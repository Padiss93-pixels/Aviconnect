import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import {
  User, fetchProfile, getAllUsers, storeUser,
  setUserBlocked, setCouvoirStatus, setVetStatus,
  deleteOwnAccount, adminDeleteUser,
} from './useAuth';

export type SignUpParams = {
  email: string;
  password: string;
  prenom: string;
  nom: string;
  phone: string;
  role: 'eleveur' | 'acheteur' | 'couvoir' | 'veterinaire';
  region: string;
  commune?: string;
  ferme?: string;
  clinique?: string;
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (params: SignUpParams) => Promise<{ error?: string; needsConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  updateProfile: (user: User) => Promise<{ error?: string }>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<{ error?: string }>;
  getAllUsers: () => Promise<User[]>;
  updateCouvoirStatus: (userId: string, status: 'pending' | 'certified' | 'rejected') => Promise<void>;
  updateVetStatus: (userId: string, status: 'pending' | 'certified' | 'rejected') => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signIn: async () => ({}),
  signUp: async () => ({}),
  signOut: async () => {},
  updateProfile: async () => ({}),
  blockUser: async () => {},
  unblockUser: async () => {},
  deleteUser: async () => ({}),
  getAllUsers: async () => [],
  updateCouvoirStatus: async () => {},
  updateVetStatus: async () => {},
});

function frenchAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes('invalid login credentials')) return 'Email ou mot de passe incorrect.';
  if (m.includes('email not confirmed')) return 'Confirme d\'abord ton email — regarde ta boîte de réception.';
  if (m.includes('already registered')) return 'Un compte existe déjà avec cet email. Connecte-toi plutôt.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Trop de tentatives. Réessaye dans quelques minutes.';
  if (m.includes('network') || m.includes('fetch')) return 'Problème de connexion internet. Vérifie ton réseau.';
  if (m.includes('password should be')) return 'Mot de passe trop faible (8 caractères minimum).';
  return message;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  // Évite d'écraser l'état pendant un signIn explicite (course avec onAuthStateChange)
  const signingIn = useRef(false);

  const loadProfile = async (userId: string): Promise<User | null> => {
    const profile = await fetchProfile(userId);
    if (profile?.blocked) {
      await supabase.auth.signOut();
      return null;
    }
    return profile;
  };

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user && mounted) {
        const profile = await loadProfile(session.user.id);
        if (mounted) setUser(profile);
      }
      if (mounted) setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (signingIn.current) return;
      if (event === 'SIGNED_OUT') {
        setUser(null);
      } else if (event === 'SIGNED_IN' && session?.user) {
        // setTimeout : ne jamais faire d'appel Supabase directement dans ce callback (deadlock)
        setTimeout(async () => {
          const profile = await loadProfile(session.user.id);
          if (mounted) setUser(profile);
        }, 0);
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, []);

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    signingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.toLowerCase().trim(),
        password,
      });
      if (error) return { error: frenchAuthError(error.message) };
      const profile = await fetchProfile(data.user.id);
      if (!profile) return { error: 'Profil introuvable. Contacte le support AviConnect.' };
      if (profile.blocked) {
        await supabase.auth.signOut();
        return { error: 'Ton compte a été suspendu. Écris-nous, on regarde ça avec toi.' };
      }
      setUser(profile);
      return {};
    } finally {
      signingIn.current = false;
    }
  };

  const signUp = async (params: SignUpParams): Promise<{ error?: string; needsConfirmation?: boolean }> => {
    signingIn.current = true;
    try {
      const { data, error } = await supabase.auth.signUp({
        email: params.email.toLowerCase().trim(),
        password: params.password,
        options: {
          data: {
            prenom: params.prenom,
            nom: params.nom,
            phone: params.phone,
            role: params.role,
            region: params.region,
            commune: params.commune || '',
            ferme: params.ferme || '',
            clinique: params.clinique || '',
          },
        },
      });
      if (error) return { error: frenchAuthError(error.message) };
      if (!data.session) return { needsConfirmation: true };
      // Le trigger handle_new_user peut prendre quelques ms — on réessaie jusqu'à 5×
      let profile = null;
      for (let i = 0; i < 5; i++) {
        profile = await fetchProfile(data.user!.id);
        if (profile) break;
        await new Promise((r) => setTimeout(r, 600));
      }
      setUser(profile);
      return {};
    } finally {
      signingIn.current = false;
    }
  };

  const signOut = async () => {
    // Le jeton push identifie l'appareil, pas le compte. Le laisser en place
    // enverrait les notifications de ce compte au prochain utilisateur du
    // téléphone : ses messages s'afficheraient sur l'écran de verrouillage de
    // quelqu'un d'autre. On le libère donc avant de fermer la session.
    if (user?.id) {
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: null })
        .eq('id', user.id);
      if (error) console.error('[Push] liberation du jeton impossible:', error.message);
    }
    await supabase.auth.signOut();
    setUser(null);
  };

  const updateProfile = async (updated: User): Promise<{ error?: string }> => {
    const result = await storeUser(updated);
    if (!result.error) setUser(updated);
    return result;
  };

  const blockUser = async (userId: string) => {
    await setUserBlocked(userId, true);
  };

  const unblockUser = async (userId: string) => {
    await setUserBlocked(userId, false);
  };

  const deleteUser = async (userId: string): Promise<{ error?: string }> => {
    if (user?.id === userId) {
      const result = await deleteOwnAccount();
      if (!result.error) {
        await supabase.auth.signOut();
        setUser(null);
      }
      return result;
    }
    return adminDeleteUser(userId);
  };

  const updateCouvoirStatus = async (userId: string, status: 'pending' | 'certified' | 'rejected') => {
    await setCouvoirStatus(userId, status);
  };

  const updateVetStatus = async (userId: string, status: 'pending' | 'certified' | 'rejected') => {
    await setVetStatus(userId, status);
  };

  return (
    <AuthContext.Provider value={{
      user, isLoading, isAdmin: user?.role === 'admin',
      signIn, signUp, signOut, updateProfile,
      blockUser, unblockUser, deleteUser, getAllUsers,
      updateCouvoirStatus, updateVetStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
