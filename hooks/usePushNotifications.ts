import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { notifRoute } from '@/constants/notifRoutes';
import { useAuthContext } from './AuthContext';

// Affichage des notifs quand l'app est au premier plan
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export function usePushNotifications() {
  const { user } = useAuthContext();

  useEffect(() => {
    if (!user?.id || Platform.OS === 'web') return;

    (async () => {
      // Les push ne fonctionnent pas sur simulateur
      if (!Device.isDevice) return;

      // Canal Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'AviConnect',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#1E7A45',
        });
      }

      // Demande de permission
      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (existing !== 'granted') {
        const { status: asked } = await Notifications.requestPermissionsAsync();
        status = asked;
      }
      if (status !== 'granted') return;

      // Récupération du token Expo
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      if (!projectId) {
        console.warn('[Push] projectId manquant dans app.json extra.eas.projectId');
        return;
      }

      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      if (!token) {
        console.warn('[Push] aucun jeton renvoye par Expo');
        return;
      }
      // Sans ce log, un echec d'enregistrement est invisible : le compte reste
      // sans push_token et ne recoit jamais de notification systeme, sans que
      // rien ne l'indique.
      const { error } = await supabase
        .from('profiles')
        .update({ push_token: token })
        .eq('id', user.id);
      if (error) console.error('[Push] enregistrement du jeton impossible:', error.message);
    })();
  }, [user?.id]);

  // Tap sur une notification système : sans ce listener la notif s'affiche
  // mais reste inerte — l'app s'ouvre sur l'écran courant et l'admin ne peut
  // pas atteindre l'écran qui permet de traiter le signalement.
  useEffect(() => {
    if (Platform.OS === 'web') return;

    const go = (data: any) => {
      const commandeTypes = ['nouvelle_commande', 'commande_acceptee', 'commande_refusee', 'nouveau_message'];
      if (data?.otherUserId && commandeTypes.includes(data?.type)) {
        router.push(`/chat/${data.otherUserId}` as any);
        return;
      }
      const route = data?.url ?? notifRoute(data?.type) ?? '/notifications';
      router.push(route as any);
    };

    // App fermée : la notification qui l'a réveillée.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (response) go(response.notification.request.content.data);
      })
      .catch(() => {});

    // App ouverte ou en arrière-plan.
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      go(response.notification.request.content.data);
    });

    return () => sub.remove();
  }, []);
}
