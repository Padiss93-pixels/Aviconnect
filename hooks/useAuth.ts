import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
  carteNumero?: string;
  carteNom?: string;
  carteExpiry?: string;
  // Statut de certification couvoir (uniquement pour role === 'couvoir')
  couvoirStatus?: 'pending' | 'certified' | 'rejected';
  // Statut de certification vétérinaire (uniquement pour role === 'veterinaire')
  vetStatus?: 'pending' | 'certified' | 'rejected';
  // Clinique / cabinet (pour vétérinaire)
  clinique?: string;
};

export const AUTH_STORAGE_KEY = '@aviconnect_user';
export const USERS_REGISTRY_KEY = '@aviconnect_users_registry';
export const PASSWORDS_KEY = '@aviconnect_passwords';

async function storage(op: 'get' | 'set' | 'remove', key: string, value?: string): Promise<string | null> {
  try {
    if (Platform.OS === 'web') {
      if (op === 'get') return localStorage.getItem(key);
      if (op === 'set') { localStorage.setItem(key, value!); return null; }
      if (op === 'remove') { localStorage.removeItem(key); return null; }
    } else {
      if (op === 'get') return await AsyncStorage.getItem(key);
      if (op === 'set') { await AsyncStorage.setItem(key, value!); return null; }
      if (op === 'remove') { await AsyncStorage.removeItem(key); return null; }
    }
  } catch {}
  return null;
}

export async function getStoredUser(): Promise<User | null> {
  const raw = await storage('get', AUTH_STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function storeUser(user: User): Promise<void> {
  await storage('set', AUTH_STORAGE_KEY, JSON.stringify(user));
  // Mettre à jour aussi dans le registre
  await updateUserInRegistry(user);
}

export async function clearUser(): Promise<void> {
  await storage('remove', AUTH_STORAGE_KEY);
}

// ── Registre global des utilisateurs (pour admin) ─────────────────────────

export async function getAllUsers(): Promise<User[]> {
  const raw = await storage('get', USERS_REGISTRY_KEY);
  return raw ? JSON.parse(raw) : [];
}

export async function registerUserInRegistry(user: User): Promise<void> {
  const users = await getAllUsers();
  const exists = users.find((u) => u.id === user.id);
  if (!exists) {
    await storage('set', USERS_REGISTRY_KEY, JSON.stringify([...users, user]));
  }
}

export async function updateUserInRegistry(user: User): Promise<void> {
  const users = await getAllUsers();
  const idx = users.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    users[idx] = user;
    await storage('set', USERS_REGISTRY_KEY, JSON.stringify(users));
  } else {
    await storage('set', USERS_REGISTRY_KEY, JSON.stringify([...users, user]));
  }
}

export async function setUserBlocked(userId: string, blocked: boolean): Promise<void> {
  const users = await getAllUsers();
  const updated = users.map((u) => u.id === userId ? { ...u, blocked } : u);
  await storage('set', USERS_REGISTRY_KEY, JSON.stringify(updated));
}

export async function setCouvoirStatus(userId: string, status: 'pending' | 'certified' | 'rejected'): Promise<void> {
  const users = await getAllUsers();
  const updated = users.map((u) => u.id === userId ? { ...u, couvoirStatus: status } : u);
  await storage('set', USERS_REGISTRY_KEY, JSON.stringify(updated));
}

export async function setVetStatus(userId: string, status: 'pending' | 'certified' | 'rejected'): Promise<void> {
  const users = await getAllUsers();
  const updated = users.map((u) => u.id === userId ? { ...u, vetStatus: status } : u);
  await storage('set', USERS_REGISTRY_KEY, JSON.stringify(updated));
}

// Récupère l'ID admin (premier utilisateur avec role 'admin')
export async function getAdminId(): Promise<string | null> {
  const users = await getAllUsers();
  const admin = users.find((u) => u.role === 'admin');
  return admin?.id || null;
}

export async function deleteUserFromRegistry(userId: string): Promise<void> {
  const users = await getAllUsers();
  const updated = users.filter((u) => u.id !== userId);
  await storage('set', USERS_REGISTRY_KEY, JSON.stringify(updated));
  // Supprimer aussi le mot de passe
  const map = await storage('get', PASSWORDS_KEY);
  if (map) {
    const passwords = JSON.parse(map);
    delete passwords[userId];
    await storage('set', PASSWORDS_KEY, JSON.stringify(passwords));
  }
}

// Purge les données annexes d'un compte (notifications, profil vétérinaire).
// Requis par Apple (règle 5.1.1) et la Loi n°2008-12 pour la suppression de compte.
export async function purgeUserData(userId: string): Promise<void> {
  await storage('remove', `@aviconnect_notifs_${userId}`);
  const rawVet = await storage('get', '@aviconnect_vet_profiles');
  if (rawVet) {
    try {
      const profiles = JSON.parse(rawVet);
      if (profiles[userId]) {
        delete profiles[userId];
        await storage('set', '@aviconnect_vet_profiles', JSON.stringify(profiles));
      }
    } catch {}
  }
}

export async function isUserBlocked(userId: string): Promise<boolean> {
  const users = await getAllUsers();
  const user = users.find((u) => u.id === userId);
  return user?.blocked === true;
}

// ── Gestion des mots de passe ──────────────────────────────────────────────
// Stocke { [userId]: password } en localStorage

async function getPasswordMap(): Promise<Record<string, string>> {
  const raw = await storage('get', PASSWORDS_KEY);
  return raw ? JSON.parse(raw) : {};
}

export async function savePassword(userId: string, password: string): Promise<void> {
  const map = await getPasswordMap();
  map[userId] = password;
  await storage('set', PASSWORDS_KEY, JSON.stringify(map));
}

export async function verifyPassword(userId: string, password: string): Promise<boolean> {
  const map = await getPasswordMap();
  return map[userId] === password;
}

export async function hasPassword(userId: string): Promise<boolean> {
  const map = await getPasswordMap();
  return userId in map;
}

export async function resetPassword(userId: string, newPassword: string): Promise<void> {
  await savePassword(userId, newPassword);
}

// Chercher un utilisateur par email ou téléphone
export async function findUserByEmailOrPhone(identifier: string): Promise<User | null> {
  const users = await getAllUsers();
  const clean = identifier.toLowerCase().trim();
  return users.find((u) =>
    u.email?.toLowerCase() === clean ||
    u.phone === clean.replace(/\D/g, '')
  ) || null;
}

// ── Chiffrement simple des données de carte ────────────────────────────────
// XOR avec une clé fixe — suffisant pour masquer en localStorage (pas de back-end)
const CARD_KEY = 'aviconnect2024';

export function encryptCard(value: string): string {
  return btoa(value.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ CARD_KEY.charCodeAt(i % CARD_KEY.length))
  ).join(''));
}

export function decryptCard(value: string): string {
  try {
    const decoded = atob(value);
    return decoded.split('').map((c, i) =>
      String.fromCharCode(c.charCodeAt(0) ^ CARD_KEY.charCodeAt(i % CARD_KEY.length))
    ).join('');
  } catch { return ''; }
}

export function maskCardNumber(numero: string): string {
  const digits = numero.replace(/\s/g, '');
  if (digits.length < 4) return '•••• •••• •••• ••••';
  return `•••• •••• •••• ${digits.slice(-4)}`;
}
