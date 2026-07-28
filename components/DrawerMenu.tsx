import {
  View, Text, TouchableOpacity, StyleSheet, Platform,
  Pressable, ScrollView,
} from 'react-native';
import { router, usePathname } from 'expo-router';
import {
  Home, ShoppingBag, ClipboardList, Newspaper, Receipt, MessageCircle,
  Factory, Stethoscope, Users, Megaphone, LogOut, type LucideIcon,
} from 'lucide-react-native';
import { Colors } from '@/constants/Colors';
import { Fonts } from '@/constants/theme';
import Logo from '@/components/ui/Logo';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useDrawer } from '@/hooks/DrawerContext';

type MenuItem = {
  label: string;
  Icon: LucideIcon;
  // Pastille colorée derrière le picto (lisibilité)
  tint: string;
  tintBg: string;
  path: string;
  hasBadge?: boolean;
};

const MENU_ITEMS: MenuItem[] = [
  { label: 'Accueil',       Icon: Home,          tint: '#1E7A45', tintBg: '#E6F4EC', path: '/(tabs)' },
  { label: 'Marchés',       Icon: ShoppingBag,   tint: '#B07A2A', tintBg: '#FBF1DF', path: '/(tabs)/marches' },
  { label: 'Besoins',       Icon: ClipboardList, tint: '#7C4DBE', tintBg: '#F1EAFB', path: '/besoins' },
  { label: 'Actualités',    Icon: Newspaper,     tint: '#2563EB', tintBg: '#E8EFFD', path: '/actualites' },
  { label: 'Mes Commandes', Icon: Receipt,       tint: '#C2410C', tintBg: '#FDEEE4', path: '/commandes' },
  { label: 'Messagerie',    Icon: MessageCircle, tint: '#0E7490', tintBg: '#E3F4F8', path: '/(tabs)/messages', hasBadge: true },
];

const PARTNER_ITEMS: MenuItem[] = [
  { label: 'Couvoirs certifiés',     Icon: Factory,     tint: '#92400E', tintBg: '#FBF0E0', path: '/couvoirs' },
  { label: 'Vétérinaires certifiés', Icon: Stethoscope, tint: '#0F766E', tintBg: '#E2F3F1', path: '/veterinaires' },
];

const ADMIN_ITEMS: MenuItem[] = [
  { label: 'Gestion utilisateurs', Icon: Users,     tint: '#374151', tintBg: '#EDEFF2', path: '/admin' },
  { label: 'Publicités',           Icon: Megaphone, tint: '#BE185D', tintBg: '#FBE7F0', path: '/admin/pubs' },
];

export default function DrawerMenu() {
  const { user, isAdmin, signOut } = useAuthContext();
  const { unreadCount } = useAnnonces();
  const { isOpen, close } = useDrawer();
  const pathname = usePathname();

  if (!isOpen) return null;

  const initiales = user
    ? `${user.prenom.charAt(0)}${user.nom.charAt(0)}`.toUpperCase()
    : '?';

  const roleLabel: Record<string, string> = {
    eleveur: 'Éleveur',
    acheteur: 'Acheteur',
    couvoir: 'Couvoir',
    veterinaire: 'Vétérinaire',
    admin: 'Administrateur',
  };

  const navigate = (path: string) => {
    close();
    setTimeout(() => router.push(path as any), 100);
  };

  const isActive = (path: string) =>
    pathname === path || pathname.startsWith(path + '/');

  return (
    <View style={styles.overlay} pointerEvents="box-none">
      {/* Fond sombre */}
      <Pressable style={styles.backdrop} onPress={close} />

      {/* Panneau */}
      <View style={styles.drawer}>

        {/* Marque */}
        <View style={styles.brandRow}>
          <Logo size={28} variant="color" />
          <Text style={styles.brandText}>AviConnect</Text>
        </View>

        {/* Profil */}
        {user ? (
          <View style={styles.profileBox}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initiales}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.profileName}>{user.prenom} {user.nom}</Text>
              <Text style={styles.profileRole}>
                {roleLabel[user.role] || user.role} · {user.region}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.authBox}>
            <TouchableOpacity style={styles.loginBtn} onPress={() => navigate('/(auth)/login')}>
              <Text style={styles.loginBtnText}>Se connecter</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigate('/(auth)/register')}>
              <Text style={styles.registerText}>Créer un compte</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.separator} />

        <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>

          {/* MENU */}
          <Text style={styles.sectionLabel}>MENU</Text>
          {MENU_ITEMS.map((item) => {
            const active = isActive(item.path);
            const badge = item.hasBadge ? unreadCount : 0;
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => navigate(item.path)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconTile, { backgroundColor: active ? Colors.primary : item.tintBg }]}>
                  <item.Icon size={19} color={active ? '#fff' : item.tint} strokeWidth={2.1} />
                </View>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>
                  {item.label}
                </Text>
                {badge > 0 && (
                  <View style={styles.badgePill}>
                    <Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}

          {/* PARTENAIRES */}
          <View style={styles.separator} />
          <Text style={styles.sectionLabel}>PARTENAIRES</Text>
          {PARTNER_ITEMS.map((item) => {
            const active = isActive(item.path);
            return (
              <TouchableOpacity
                key={item.label}
                style={[styles.menuItem, active && styles.menuItemActive]}
                onPress={() => navigate(item.path)}
                activeOpacity={0.7}
              >
                <View style={[styles.iconTile, { backgroundColor: active ? Colors.primary : item.tintBg }]}>
                  <item.Icon size={19} color={active ? '#fff' : item.tint} strokeWidth={2.1} />
                </View>
                <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
              </TouchableOpacity>
            );
          })}

          {/* ADMINISTRATION */}
          {isAdmin && (
            <>
              <View style={styles.separator} />
              <Text style={styles.sectionLabel}>ADMINISTRATION</Text>
              {ADMIN_ITEMS.map((item) => {
                const active = isActive(item.path);
                return (
                  <TouchableOpacity
                    key={item.label}
                    style={[styles.menuItem, active && styles.menuItemActive]}
                    onPress={() => navigate(item.path)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.iconTile, { backgroundColor: active ? Colors.primary : item.tintBg }]}>
                      <item.Icon size={19} color={active ? '#fff' : item.tint} strokeWidth={2.1} />
                    </View>
                    <Text style={[styles.menuLabel, active && styles.menuLabelActive]}>{item.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}

          {/* Déconnexion */}
          {user && (
            <>
              <View style={styles.separator} />
              <TouchableOpacity
                style={styles.menuItem}
                onPress={async () => { close(); await signOut(); router.replace('/(tabs)'); }}
              >
                <View style={[styles.iconTile, { backgroundColor: '#FDEBE9' }]}>
                  <LogOut size={19} color={Colors.error} strokeWidth={2.1} />
                </View>
                <Text style={[styles.menuLabel, { color: Colors.error }]}>Se déconnecter</Text>
              </TouchableOpacity>
            </>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    </View>
  );
}

const DRAWER_WIDTH = 300;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    zIndex: 1000,
    flexDirection: 'row',
    ...(Platform.OS === 'web' ? { position: 'fixed' as any } : {}),
  },
  backdrop: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  drawer: {
    width: DRAWER_WIDTH,
    backgroundColor: '#fff',
    height: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 16,
    paddingTop: Platform.OS === 'ios' ? 56 : 40,
  },

  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    paddingHorizontal: 18,
    paddingBottom: 14,
  },
  brandText: { fontSize: 19, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },

  profileBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginHorizontal: 12,
    marginBottom: 4,
    backgroundColor: '#f3f4f6',
    borderRadius: 14,
    padding: 14,
  },
  avatar: {
    width: 46, height: 46, borderRadius: 23,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { fontSize: 17, fontWeight: '700', color: Colors.primaryDark },
  profileName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  profileRole: { fontSize: 12, color: Colors.textLight, marginTop: 2 },

  authBox: { paddingHorizontal: 16, paddingBottom: 8, gap: 10 },
  loginBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingVertical: 12, alignItems: 'center',
  },
  loginBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  registerText: { textAlign: 'center', color: Colors.primary, fontWeight: '600', fontSize: 13 },

  separator: { height: 1, backgroundColor: '#f0f0f0', marginHorizontal: 16, marginVertical: 6 },

  sectionLabel: {
    fontSize: 11, fontWeight: '700', color: '#9ca3af',
    letterSpacing: 1, paddingHorizontal: 20,
    marginTop: 10, marginBottom: 4,
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    marginHorizontal: 8, marginVertical: 2, borderRadius: 12,
  },
  menuItemActive: { backgroundColor: '#f0fdf4' },
  iconTile: {
    width: 36, height: 36, borderRadius: 11,
    justifyContent: 'center', alignItems: 'center',
  },
  menuLabel: { fontSize: 15, color: '#1f2937', fontWeight: '600', flex: 1 },
  menuLabelActive: { color: Colors.primary, fontWeight: '700' },

  badgePill: {
    backgroundColor: '#ef4444', borderRadius: 10,
    minWidth: 20, height: 20,
    justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5,
  },
  badgeText: { color: '#fff', fontSize: 11, fontWeight: '700' },
});
