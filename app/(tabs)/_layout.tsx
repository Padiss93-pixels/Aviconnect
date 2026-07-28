import { Tabs, router } from 'expo-router';
import { View, Text, StyleSheet, Platform, TouchableOpacity } from 'react-native';
import { BookOpen, House, MessageCircle, Plus, Store, User } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';

type LucideIcon = typeof House;

function TabIcon({ Icon, label, focused }: { Icon: LucideIcon; label: string; focused: boolean }) {
  return (
    <View style={styles.tabIconWrap}>
      <View style={[styles.iconBox, focused && styles.iconBoxActive]}>
        <Icon size={21} color={focused ? Colors.primaryDark : Colors.textMuted} strokeWidth={focused ? 2 : 1.6} />
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelActive]}>{label}</Text>
    </View>
  );
}

function PublishButton() {
  const { user } = useAuthContext();
  const isVet = user?.role === 'veterinaire';

  const handlePress = () => {
    if (isVet) {
      router.push('/mon-catalogue' as any);
    }
    // Pour les autres rôles, la navigation normale vers 'publier' se fait via l'onglet
  };

  if (isVet) {
    return (
      <TouchableOpacity onPress={handlePress} style={styles.publishOuter}>
        <View style={styles.publishInner}>
          <LinearGradient
            colors={[Colors.accent, Colors.accentDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View><BookOpen size={22} color="#fff" strokeWidth={1.8} /></View>
        </View>
        <Text style={[styles.tabLabel, { color: Colors.accentDark, fontFamily: Fonts.bodyBold }]}>Catalogue</Text>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.publishOuter}>
      <View style={styles.publishInner}>
        <LinearGradient
          colors={[Colors.primaryMid, Colors.primaryDark]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
        <View><Plus size={26} color="#fff" strokeWidth={2} /></View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  // Expo 54 est edge-to-edge sur Android : la tab bar doit intégrer la zone système
  const bottomPad = Math.max(insets.bottom, 10);
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: [styles.tabBar, { height: 62 + bottomPad, paddingBottom: bottomPad }],
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={House} label="Accueil" focused={focused} /> }}
      />
      <Tabs.Screen
        name="marches"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={Store} label="Marché" focused={focused} /> }}
      />
      <Tabs.Screen
        name="publier"
        options={{ tabBarIcon: () => <PublishButton /> }}
      />
      <Tabs.Screen
        name="messages"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={MessageCircle} label="Messages" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profil"
        options={{ tabBarIcon: ({ focused }) => <TabIcon Icon={User} label="Compte" focused={focused} /> }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.tabBar,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.border,
    paddingTop: 10,
    ...Platform.select({
      ios: { shadowColor: Colors.shadow, shadowOffset: { width: 0, height: -2 }, shadowOpacity: 0.05, shadowRadius: 14 },
      android: { elevation: 12 },
      web: { boxShadow: '0 -2px 14px rgba(36,31,25,0.05)' } as any,
    }),
  },
  tabIconWrap: { alignItems: 'center', gap: 3, minWidth: 56 },
  iconBox: { width: 44, height: 30, borderRadius: Radius.pill, justifyContent: 'center', alignItems: 'center' },
  iconBoxActive: { backgroundColor: Colors.primaryTint },
  tabLabel: { fontSize: 10, color: Colors.textMuted, fontFamily: Fonts.bodyMedium },
  tabLabelActive: { color: Colors.primaryDark, fontFamily: Fonts.bodyBold },
  publishOuter: { alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  publishInner: {
    width: 54, height: 54, borderRadius: 20, overflow: 'hidden',
    justifyContent: 'center', alignItems: 'center',
    ...(Shadows.button as object),
  },
});
