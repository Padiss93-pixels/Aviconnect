import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Bell, Heart, Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts } from '@/constants/theme';
import Logo from '@/components/ui/Logo';
import { useFavorites } from '@/hooks/FavoritesContext';

type Props = {
  title?: string;
  showLogo?: boolean;
  onMenuPress?: () => void;
  unreadCount?: number;
  showFavorites?: boolean;
};

export default function ScreenHeader({ title, showLogo, onMenuPress, unreadCount = 0, showFavorites }: Props) {
  const insets = useSafeAreaInsets();
  const { favoriteCount } = useFavorites();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, Platform.OS === 'web' ? 18 : 30) + 12 }]}>
      <Pressable style={styles.iconBtn} onPress={onMenuPress} hitSlop={12}>
        <Menu size={22} color={Colors.text} strokeWidth={1.75} />
      </Pressable>

      {showLogo ? (
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}><Logo size={22} variant="cream" /></View>
          <Text style={styles.logoText}>AviConnect</Text>
        </View>
      ) : (
        <Text style={styles.title}>{title}</Text>
      )}

      <View style={styles.rightRow}>
        {showFavorites && (
          <Pressable style={styles.iconBtn} onPress={() => router.push('/mes-favoris' as any)} hitSlop={12}>
            <Heart size={21} color={favoriteCount > 0 ? Colors.accent : Colors.text} fill={favoriteCount > 0 ? Colors.accent : 'transparent'} strokeWidth={1.75} />
          </Pressable>
        )}
        <Pressable style={styles.iconBtn} onPress={() => router.push('/notifications' as any)} hitSlop={12}>
          <Bell size={21} color={Colors.text} strokeWidth={1.75} />
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
            </View>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  logoIcon: { width: 30, height: 30, borderRadius: 9, backgroundColor: Colors.primary, justifyContent: 'center', alignItems: 'center' },
  logoText: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },
  title: { fontSize: 17, fontFamily: Fonts.bodyBold, color: Colors.text },
  badge: {
    position: 'absolute', top: 3, right: 2,
    backgroundColor: Colors.accent, borderRadius: 8,
    minWidth: 16, height: 16, justifyContent: 'center', alignItems: 'center',
    paddingHorizontal: 3, borderWidth: 1.5, borderColor: Colors.surface,
  },
  badgeText: { color: '#fff', fontSize: 9, fontFamily: Fonts.bodyBold },
});
