import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Fonts } from '@/constants/theme';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: isOnline ? 0 : 1,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isOnline]);

  const height = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 36] });
  const opacity = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  return (
    <Animated.View style={[styles.banner, { height, opacity }]}>
      <Text style={styles.text}>📡 Pas de connexion — certaines fonctions sont indisponibles</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    backgroundColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: Platform.OS === 'android' ? 2 : 0,
  },
  text: {
    color: '#f9fafb',
    fontSize: 12,
    fontFamily: Fonts.bodyMedium,
  },
});
