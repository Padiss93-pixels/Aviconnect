import { memo, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { Heart, Images, MapPin, ShoppingCart } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { type Lot, PRODUCT_EMOJIS } from '@/constants/mockData';
import CachedImage from './CachedImage';

type Props = { lot: Lot; compact?: boolean };

const PRODUCT_LABELS: Record<string, string> = {
  poulet:  'Poulet de chair',
  poussin: 'Poussins',
  oeuf:    'Œufs',
  aliment: 'Aliment',
};

const BADGE: Record<string, { bg: string; color: string }> = {
  poulet:  { bg: 'rgba(251,238,229,0.94)', color: Colors.accentDark },
  poussin: { bg: 'rgba(251,238,229,0.94)', color: Colors.accentDark },
  oeuf:    { bg: 'rgba(240,247,240,0.94)', color: Colors.primaryDark },
  aliment: { bg: 'rgba(240,247,240,0.94)', color: Colors.primaryDark },
};

const PLACEHOLDER_BG: Record<string, string> = {
  poulet:  '#F3E6D5',
  poussin: '#F8EDDD',
  oeuf:    '#EEF2E6',
  aliment: '#E9EFE3',
};

function LotCard({ lot, compact }: Props) {
  const [fav, setFav] = useState(false);
  const go = () => router.push({ pathname: '/lot/[id]', params: { id: lot.id } });
  const hasPhoto = lot.photos && lot.photos.length > 0;
  const badge = BADGE[lot.produit] || { bg: 'rgba(255,255,255,0.94)', color: Colors.text };
  const bgTop = PLACEHOLDER_BG[lot.produit] || Colors.surfaceSecondary;
  const isCarton = lot.unite === 'carton';
  const qteShort = isCarton ? `${lot.qte} cartons` : `${lot.qte.toLocaleString()} u.`;

  // ── Compact (accueil scroll horizontal) ─────────────────────────────
  if (compact) {
    return (
      <TouchableOpacity style={styles.compact} onPress={go} activeOpacity={0.92}>
        <View style={[styles.compactImg, { backgroundColor: bgTop }]}>
          {hasPhoto ? (
            <CachedImage
              uri={lot.photos![0]}
              style={StyleSheet.absoluteFillObject}
              containerStyle={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              fallback={<Text style={styles.compactEmoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>}
              skeletonColor={bgTop}
            />
          ) : (
            <Text style={styles.compactEmoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>
          )}
          <TouchableOpacity
            style={styles.compactHeart}
            onPress={(e) => { e.stopPropagation?.(); setFav(v => !v); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart size={14} color="#fff" fill={fav ? Colors.accent : 'transparent'} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>
        <View style={styles.compactBody}>
          <Text style={styles.compactTitle} numberOfLines={2}>{lot.titre}</Text>
          <View style={styles.compactLocRow}>
            <MapPin size={10} color={Colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.compactLoc} numberOfLines={1}>{lot.region}</Text>
          </View>
          <Text style={styles.compactPrice}>{lot.prix.toLocaleString()} <Text style={styles.compactPriceSub}>F{isCarton ? '/crt' : ' CFA'}</Text></Text>
        </View>
      </TouchableOpacity>
    );
  }

  // ── Grille (marchés) ─────────────────────────────────────────────────
  return (
    <TouchableOpacity style={styles.card} onPress={go} activeOpacity={0.94}>
      <View style={styles.cardCore}>

        {/* Image */}
        <View style={[styles.imgBox, { backgroundColor: bgTop }]}>
          {hasPhoto ? (
            <CachedImage
              uri={lot.photos![0]}
              style={StyleSheet.absoluteFillObject}
              containerStyle={StyleSheet.absoluteFillObject}
              resizeMode="cover"
              fallback={<Text style={styles.emoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>}
              skeletonColor={bgTop}
            />
          ) : (
            <Text style={styles.emoji}>{PRODUCT_EMOJIS[lot.produit]}</Text>
          )}

          {/* Badge catégorie */}
          <View style={[styles.catBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.catBadgeText, { color: badge.color }]}>
              {PRODUCT_LABELS[lot.produit]}
            </Text>
          </View>

          {/* Cœur */}
          <TouchableOpacity
            style={styles.heartBtn}
            onPress={(e) => { e.stopPropagation?.(); setFav(v => !v); }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Heart size={17} color="#fff" fill={fav ? Colors.accent : 'transparent'} strokeWidth={1.8} />
          </TouchableOpacity>

          {/* Nb photos */}
          {hasPhoto && lot.photos!.length > 1 && (
            <View style={styles.photoCounter}>
              <Images size={10} color="#fff" strokeWidth={1.8} />
              <Text style={styles.photoCounterText}>{lot.photos!.length}</Text>
            </View>
          )}
        </View>

        {/* Infos */}
        <View style={styles.body}>
          <Text style={styles.title} numberOfLines={2}>{lot.titre}</Text>

          <View style={styles.locRow}>
            <MapPin size={12} color={Colors.textMuted} strokeWidth={1.8} />
            <Text style={styles.locText} numberOfLines={1}>{lot.region} · {lot.eleveur}</Text>
          </View>

          {/* Prix + quantité */}
          <View style={styles.priceRow}>
            <View>
              <Text style={styles.price}>{lot.prix.toLocaleString()} <Text style={styles.priceSub}>F CFA{isCarton ? '/carton' : ''}</Text></Text>
              <Text style={styles.qte}>{qteShort} disponibles</Text>
            </View>
            <View style={[styles.dispoBadge, lot.dispo === 'Immédiat' && styles.dispoImmediat]}>
              <Text style={[styles.dispoText, lot.dispo === 'Immédiat' && styles.dispoTextImmediat]}>
                {lot.dispo === 'Immédiat' ? '● Dispo' : lot.dispo}
              </Text>
            </View>
          </View>

          {/* Bouton */}
          <TouchableOpacity style={styles.cmdBtn} onPress={go} activeOpacity={0.88}>
            <ShoppingCart size={15} color="#fff" strokeWidth={1.9} style={{ marginRight: 7 }} />
            <Text style={styles.cmdBtnText}>Commander</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default memo(LotCard);

const CARD_RADIUS = Radius.lg;
const SHELL_PAD = 4;

const styles = StyleSheet.create({
  // ── Grille ────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: CARD_RADIUS,
    padding: SHELL_PAD,
    marginBottom: 14,
    ...(Shadows.card as object),
  },
  cardCore: {
    backgroundColor: Colors.surface,
    borderRadius: CARD_RADIUS - SHELL_PAD,
    overflow: 'hidden',
  },
  imgBox: { height: 150, justifyContent: 'center', alignItems: 'center' },
  emoji: { fontSize: 52 },

  catBadge: {
    position: 'absolute', top: 10, left: 10,
    paddingHorizontal: 10, paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  catBadgeText: { fontSize: 10, fontFamily: Fonts.bodyBold, letterSpacing: 0.4, textTransform: 'uppercase' },

  heartBtn: {
    position: 'absolute', top: 9, right: 9,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(36,31,25,0.32)',
    justifyContent: 'center', alignItems: 'center',
  },

  photoCounter: {
    position: 'absolute', bottom: 9, right: 9,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(36,31,25,0.45)',
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: Radius.pill,
  },
  photoCounterText: { color: '#fff', fontSize: 10.5, fontFamily: Fonts.bodyBold },

  body: { paddingHorizontal: 13, paddingVertical: 13 },

  title: {
    fontSize: 14, fontFamily: Fonts.bodyBold,
    color: Colors.text, lineHeight: 19, marginBottom: 6,
  },

  locRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 12 },
  locText: { fontSize: 11.5, fontFamily: Fonts.body, color: Colors.textMuted, flex: 1, lineHeight: 15 },

  priceRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'flex-end', marginBottom: 12,
  },
  price: { fontSize: 17, fontFamily: Fonts.bodyExtraBold, color: Colors.primary, letterSpacing: -0.3 },
  priceSub: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
  qte: { fontSize: 10.5, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },

  dispoBadge: {
    backgroundColor: Colors.surfaceSecondary,
    paddingHorizontal: 9, paddingVertical: 5, borderRadius: Radius.sm,
  },
  dispoImmediat: { backgroundColor: Colors.primaryLight },
  dispoText: { fontSize: 10.5, fontFamily: Fonts.bodySemiBold, color: Colors.textTertiary },
  dispoTextImmediat: { color: Colors.primary },

  cmdBtn: {
    backgroundColor: Colors.primary,
    borderRadius: Radius.pill,
    paddingVertical: 11,
    flexDirection: 'row',
    justifyContent: 'center', alignItems: 'center',
    ...(Shadows.button as object),
  },
  cmdBtnText: { color: '#fff', fontSize: 13.5, fontFamily: Fonts.bodyBold, letterSpacing: 0.1 },

  // ── Compact ────────────────────────────────────────────────────────────
  compact: {
    width: 165,
    backgroundColor: Colors.surface,
    borderRadius: Radius.md + 2,
    overflow: 'hidden',
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  compactImg: { height: 104, justifyContent: 'center', alignItems: 'center' },
  compactEmoji: { fontSize: 36 },
  compactHeart: {
    position: 'absolute', top: 7, right: 7,
    width: 27, height: 27, borderRadius: 14,
    backgroundColor: 'rgba(36,31,25,0.3)',
    justifyContent: 'center', alignItems: 'center',
  },
  compactBody: { padding: 11 },
  compactTitle: { fontSize: 12.5, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 4, lineHeight: 17 },
  compactLocRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginBottom: 6 },
  compactLoc: { fontSize: 10.5, fontFamily: Fonts.body, color: Colors.textMuted, flex: 1 },
  compactPrice: { fontSize: 14.5, fontFamily: Fonts.bodyExtraBold, color: Colors.primary, letterSpacing: -0.2 },
  compactPriceSub: { fontSize: 10, fontFamily: Fonts.bodyMedium, color: Colors.textMuted },
});
