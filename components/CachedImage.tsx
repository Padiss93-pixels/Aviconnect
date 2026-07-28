import { useState } from 'react';
import { Image, View, StyleSheet, type ImageResizeMode, type StyleProp, type ImageStyle, type ViewStyle } from 'react-native';

type Props = {
  uri: string;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  resizeMode?: ImageResizeMode;
  fallback?: React.ReactNode;
  skeletonColor?: string;
};

export default function CachedImage({ uri, style, containerStyle, resizeMode = 'cover', fallback, skeletonColor = '#e5e7eb' }: Props) {
  const [status, setStatus] = useState<'loading' | 'loaded' | 'error'>('loading');

  if (status === 'error') {
    return <View style={[styles.errorBox, containerStyle]}>{fallback || null}</View>;
  }

  return (
    <View style={[{ overflow: 'hidden' }, containerStyle]}>
      {status === 'loading' && (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: skeletonColor }]} />
      )}
      {/* L'image n'est plus masquée pendant le chargement : elle se dessine
          progressivement par-dessus le fond, au lieu de laisser une vignette
          vide le temps du téléchargement. */}
      <Image
        source={{ uri, cache: 'force-cache' } as any}
        style={style}
        resizeMode={resizeMode}
        onLoad={() => setStatus('loaded')}
        onError={() => setStatus('error')}
        progressiveRenderingEnabled
        fadeDuration={150}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  errorBox: { justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6' },
});
