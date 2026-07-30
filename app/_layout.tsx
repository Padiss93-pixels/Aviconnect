import { useCallback, useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { Platform, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Fraunces_500Medium_Italic,
  Fraunces_600SemiBold,
  Fraunces_700Bold,
} from '@expo-google-fonts/fraunces';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_600SemiBold,
  PlusJakartaSans_700Bold,
  PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { AuthProvider, useAuthContext } from '@/hooks/AuthContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { supabase } from '@/lib/supabase';
import { AnnoncesProvider } from '@/hooks/AnnoncesContext';
import { OrdersProvider } from '@/hooks/OrdersContext';
import { PubProvider } from '@/hooks/PubContext';
import { DrawerProvider } from '@/hooks/DrawerContext';
import { BesoinProvider } from '@/hooks/BesoinContext';
import { ActualitesProvider } from '@/hooks/ActualitesContext';
import { VetProvider } from '@/hooks/VetContext';
import { RewardsProvider } from '@/hooks/RewardsContext';
import { BoostProvider } from '@/hooks/BoostContext';
import { FavoritesProvider } from '@/hooks/FavoritesContext';
import { ModerationProvider } from '@/hooks/ModerationContext';
import { UnreadMessagesProvider } from '@/hooks/UnreadMessagesContext';
import DrawerMenu from '@/components/DrawerMenu';
import RewardToast from '@/components/RewardToast';
import OfflineBanner from '@/components/OfflineBanner';
import { Colors } from '@/constants/Colors';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: Colors.primary,
    secondary: Colors.primaryDark,
  },
};

SplashScreen.preventAutoHideAsync().catch(() => {});

function VisitLogger() {
  const { user } = useAuthContext();
  useEffect(() => {
    if (!user?.id) return;
    supabase.from('app_visits').insert({
      user_id: user.id,
      platform: Platform.OS,
    }).then(({ error }) => {
      // Sans ce log, une table absente ou une RLS trop stricte fait
      // silencieusement disparaître toutes les statistiques d'audience.
      if (error) console.error('[AviConnect] app_visits insert error:', error.message);
    });
  }, [user?.id]);
  return null;
}

function PushRegistrar() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Fraunces_500Medium_Italic,
    Fraunces_600SemiBold,
    Fraunces_700Bold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  const onLayout = useCallback(() => {
    if (fontsLoaded) SplashScreen.hideAsync().catch(() => {});
  }, [fontsLoaded]);

  useEffect(() => { onLayout(); }, [onLayout]);

  if (!fontsLoaded) return null;

  return (
    <PaperProvider theme={theme}>
      <AuthProvider>
      <ModerationProvider>
      <AnnoncesProvider>
      <OrdersProvider>
      <PubProvider>
      <BesoinProvider>
      <ActualitesProvider>
      <VetProvider>
      <RewardsProvider>
      <BoostProvider>
      <FavoritesProvider>
      <UnreadMessagesProvider>
      <DrawerProvider>
        <VisitLogger />
        <PushRegistrar />
        <StatusBar style="light" backgroundColor={Colors.primary} />
        {/* Colonne centrée sur web large ; transparent sur mobile (<760px, aucun effet) */}
        <View style={{ flex: 1, backgroundColor: '#EFE7D8' }}>
        <View style={{
          flex: 1, width: '100%', maxWidth: 760, alignSelf: 'center',
          ...(Platform.OS === 'web' ? { boxShadow: '0 0 48px rgba(36,31,25,0.10)' } as any : {}),
        }}>
          <OfflineBanner />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(auth)/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            <Stack.Screen name="lot/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="chat/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="commander/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="aide/index" options={{ headerShown: false }} />
            <Stack.Screen name="conditions/index" options={{ headerShown: false }} />
            <Stack.Screen name="mes-annonces/index" options={{ headerShown: false }} />
            <Stack.Screen name="transactions/index" options={{ headerShown: false }} />
            <Stack.Screen name="notifications/index" options={{ headerShown: false }} />
            <Stack.Screen name="commandes/index" options={{ headerShown: false }} />
            <Stack.Screen name="modifier-annonce/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="admin/index" options={{ headerShown: false }} />
            <Stack.Screen name="admin/pubs" options={{ headerShown: false }} />
            <Stack.Screen name="besoins/index" options={{ headerShown: false }} />
            <Stack.Screen name="actualites/index" options={{ headerShown: false }} />
            <Stack.Screen name="actualites/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="admin/actualites" options={{ headerShown: false }} />
            <Stack.Screen name="admin/couvoirs" options={{ headerShown: false }} />
            <Stack.Screen name="admin/moderation" options={{ headerShown: false }} />
            <Stack.Screen name="couvoirs/index" options={{ headerShown: false }} />
            <Stack.Screen name="confidentialite/index" options={{ headerShown: false }} />
            <Stack.Screen name="mentions-legales/index" options={{ headerShown: false }} />
            <Stack.Screen name="dpa/index" options={{ headerShown: false }} />
            <Stack.Screen name="mes-droits/index" options={{ headerShown: false }} />
            <Stack.Screen name="cookies/index" options={{ headerShown: false }} />
            <Stack.Screen name="veterinaires/index" options={{ headerShown: false }} />
            <Stack.Screen name="veterinaire/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="admin/veterinaires" options={{ headerShown: false }} />
            <Stack.Screen name="mon-catalogue/index" options={{ headerShown: false }} />
            <Stack.Screen name="recompenses/index" options={{ headerShown: false }} />
            <Stack.Screen name="boost/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="vendeur/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="mes-favoris/index" options={{ headerShown: false }} />
            <Stack.Screen name="mes-blocages/index" options={{ headerShown: false }} />
            <Stack.Screen name="abonnement/index" options={{ headerShown: false }} />
            <Stack.Screen name="admin/boosts" options={{ headerShown: false }} />
            <Stack.Screen name="admin/analytics" options={{ headerShown: false }} />
            <Stack.Screen name="admin/annonceurs" options={{ headerShown: false }} />
          </Stack>
          {/* Drawer superposé sur toute l'appli */}
          <DrawerMenu />
          {/* Toast global de récompenses (XP, badges, niveaux) */}
          <RewardToast />

        </View>
        </View>
      </DrawerProvider>
      </UnreadMessagesProvider>
      </FavoritesProvider>
      </BoostProvider>
      </RewardsProvider>
      </VetProvider>
      </ActualitesProvider>
      </BesoinProvider>
      </PubProvider>
      </OrdersProvider>
      </AnnoncesProvider>
      </ModerationProvider>
      </AuthProvider>
    </PaperProvider>
  );
}
