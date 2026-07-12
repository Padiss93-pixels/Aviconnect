import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  getStoredUser, storeUser, clearUser, User,
  isUserBlocked, getAllUsers, setUserBlocked, setCouvoirStatus, setVetStatus,
  deleteUserFromRegistry, purgeUserData,
} from './useAuth';

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  signIn: (user: User) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  blockUser: (userId: string) => Promise<void>;
  unblockUser: (userId: string) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  getAllUsers: () => Promise<User[]>;
  updateCouvoirStatus: (userId: string, status: 'pending' | 'certified' | 'rejected') => Promise<void>;
  updateVetStatus: (userId: string, status: 'pending' | 'certified' | 'rejected') => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isLoading: true,
  isAdmin: false,
  signIn: async () => ({}),
  signOut: async () => {},
  blockUser: async () => {},
  unblockUser: async () => {},
  deleteUser: async () => {},
  getAllUsers: async () => [],
  updateCouvoirStatus: async () => {},
  updateVetStatus: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getStoredUser().then(async (u) => {
      if (u) {
        const blocked = await isUserBlocked(u.id);
        if (blocked) {
          await clearUser();
          setUser(null);
        } else {
          setUser(u);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const signIn = async (u: User): Promise<{ error?: string }> => {
    if (u.id) {
      const blocked = await isUserBlocked(u.id);
      if (blocked) return { error: 'Votre compte a été suspendu. Contactez le support AviConnect.' };
    }
    if (u.blocked) return { error: 'Votre compte a été suspendu. Contactez le support AviConnect.' };
    await storeUser(u);
    setUser(u);
    return {};
  };

  const signOut = async () => {
    await clearUser();
    setUser(null);
  };

  const blockUser = async (userId: string) => {
    await setUserBlocked(userId, true);
    if (user?.id === userId) { await clearUser(); setUser(null); }
  };

  const unblockUser = async (userId: string) => {
    await setUserBlocked(userId, false);
  };

  const deleteUser = async (userId: string) => {
    await deleteUserFromRegistry(userId);
    await purgeUserData(userId);
    if (user?.id === userId) { await clearUser(); setUser(null); }
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
      signIn, signOut, blockUser, unblockUser, deleteUser, getAllUsers,
      updateCouvoirStatus, updateVetStatus,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  return useContext(AuthContext);
}
