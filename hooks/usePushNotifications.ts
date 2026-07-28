import { useEffect } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { supabase } from '@/lib/supabase';
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
      if (token) {
        await supabase.from('profiles').update({ push_token: token }).eq('id', user.id);
      }
    })();
  }, [user?.id]);
}
