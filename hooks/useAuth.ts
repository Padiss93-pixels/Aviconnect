import { supabase } from '@/lib/supabase';

export type User = {
  id: string;
  phone: string;
  email?: string;
  prenom: string;
  nom: string;
  ferme?: string;
  region: string;
  role: 'eleveur' | 'acheteur' | 'couvoir' | 'admin' | 'veterinaire';
  verified: boolean;
  blocked?: boolean;
  photo?: string;
  // Statut de certification couvoir (uniquement pour role === 'couvoir')
  couvoirStatus?: 'pending' | 'certified' | 'rejected';
  // Statut de certification vétérinaire (uniquement pour role === 'veterinaire')
  vetStatus?: 'pending' | 'certified' | 'rejected';
  // Clinique / cabinet (pour vétérinaire)
  clinique?: string;
};

// ── Mapping ligne `profiles` (snake_case) ↔ User (camelCase) ────────────────

type ProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
  prenom: string;
  nom: string;
  ferme: string | null;
  clinique: string | null;
  region: string;
  role: User['role'];
  verified: boolean;
  blocked: boolean;
  photo_url: string | null;
  couvoir_status: User['couvoirStatus'] | null;
  vet_status: User['vetStatus'] | null;
};

export function mapProfileToUser(row: ProfileRow): User {
  return {
    id: row.id,
    phone: row.phone || '',
    email: row.email || undefined,
    prenom: row.prenom,
    nom: row.nom,
    ferme: row.ferme || undefined,
    clinique: row.clinique || undefined,
    region: row.region,
    role: row.role,
    verified: row.verified,
    blocked: row.blocked,
    photo: row.photo_url || undefined,
    couvoirStatus: row.couvoir_status || undefined,
    vetStatus: row.vet_status || undefined,
  };
}

// ── Lecture ──────────────────────────────────────────────────────────────────

export async function fetchProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error || !data) return null;
  return mapProfileToUser(data as ProfileRow);
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return (data as ProfileRow[]).map(mapProfileToUser);
}

// ── Mise à jour du profil (colonnes modifiables par l'utilisateur) ──────────
// Les colonnes sensibles (role, blocked, verified, statuts) sont protégées
// côté serveur par trigger : seul un admin peut les changer.

export async function storeUser(user: User): Promise<{ error?: string }> {
  const { error } = await supabase
    .from('profiles')
    .update({
      prenom: user.prenom,
      nom: user.nom,
      phone: user.phone,
      ferme: user.ferme ?? null,
      clinique: user.clinique ?? null,
      region: user.region,
      photo_url: user.photo ?? null,
    })
    .eq('id', user.id);
  return error ? { error: error.message } : {};
}

// ── Actions admin (autorisées par RLS + trigger côté serveur) ───────────────

export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  await supabase.from('profiles').update({ blocked }).eq('id', userId);
}

export async function setCouvoirStatus(userId: string, status: 'pending' | 'certified' | 'rejected'): Promise<void> {
  await supabase.from('profiles').update({ couvoir_status: status }).eq('id', userId);
}

export async function setVetStatus(userId: string, status: 'pending' | 'certified' | 'rejected'): Promise<void> {
  await supabase.from('profiles').update({ vet_status: status }).eq('id', userId);
}

// ── Suppression de compte ────────────────────────────────────────────────────

// Suppression de son propre compte (règle Apple 5.1.1) — RPC security definer.
export async function deleteOwnAccount(): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('delete_user');
  return error ? { error: error.message } : {};
}

// Suppression d'un compte par l'admin — RPC vérifiant is_admin() côté serveur.
export async function adminDeleteUser(userId: string): Promise<{ error?: string }> {
  const { error } = await supabase.rpc('admin_delete_user', { target_id: userId });
  return error ? { error: error.message } : {};
}
