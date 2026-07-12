import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, Pressable,
  StyleSheet, TextInput, FlatList, ScrollView, Platform, Linking, TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Search, SearchX, SlidersHorizontal, X } from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { REGIONS, type ProductType, type Lot } from '@/constants/mockData';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { usePubs, type MarchePub } from '@/hooks/PubContext';
import { useDrawer } from '@/hooks/DrawerContext';
import LotCard from '@/components/LotCard';
import ScreenHeader from '@/components/ui/ScreenHeader';

const PRODUITS: { key: ProductType | null; label: string }[] = [
  { key: null, label: 'Tout' },
  { key: 'poulet', label: 'Poulets' },
  { key: 'poussin', label: 'Poussins' },
  { key: 'oeuf', label: 'Œufs' },
  { key: 'aliment', label: 'Aliment' },
];

const DISPOS = ['Toutes', 'Immédiat', 'Dans 3 jours', 'Dans 1 semaine', 'Dans 2 semaines', 'Sur commande'];
const TRIS = [
  { key: 'recent', label: 'Plus récent' },
  { key: 'prix_asc', label: 'Prix croissant' },
  { key: 'prix_desc', label: 'Prix décroissant' },
  { key: 'qte_desc', label: 'Plus de stock' },
];

function normalize(str: string) {
  return str.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/œ/g, 'oe').replace(/æ/g, 'ae');
}

type ListRow =
  | { type: 'pair'; id: string; left: Lot; right?: Lot }
  | { type: 'pub'; id: string; pub: MarchePub };

function openLien(lien?: string) {
  if (!lien) return;
  if (Platform.OS === 'web') {
    window.open(lien, '_blank', 'noopener,noreferrer');
  } else {
    Linking.openURL(lien).catch(() => {});
  }
}

function PubCard({ pub }: { pub: MarchePub }) {
  const hasLien = !!pub.lien;
  return (
    <Pressable
      onPress={hasLien ? () => openLien(pub.lien) : undefined}
      style={({ pressed }) => [pubStyles.card, { backgroundColor: pub.bg, opacity: pressed && hasLien ? 0.85 : 1 }]}
    >
      <Text style={pubStyles.emoji}>{pub.emoji}</Text>
      <View style={{ flex: 1 }}>
        <Text style={pubStyles.titre}>{pub.titre}</Text>
        <Text style={pubStyles.desc}>{pub.description}</Text>
        {hasLien && <Text style={pubStyles.lienLabel}>Voir plus →</Text>}
      </View>
      <View style={pubStyles.badge}><Text style={pubStyles.badgeText}>Pub</Text></View>
    </Pressable>
  );
}

const pubStyles = StyleSheet.create({
  card: {
    marginHorizontal: 4, marginVertical: 6, borderRadius: Radius.md,
    padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12,
  },
  emoji: { fontSize: 32 },
  titre: { fontSize: 15, fontFamily: Fonts.bodyBold, color: '#fff', marginBottom: 3 },
  desc: { fontSize: 12, fontFamily: Fonts.body, color: 'rgba(255,255,255,0.85)', lineHeight: 17 },
  lienLabel: { fontSize: 11, color: 'rgba(255,255,255,0.9)', marginTop: 4, textDecorationLine: 'underline', fontFamily: Fonts.bodySemiBold },
  badge: {
    position: 'absolute', top: 8, right: 10,
    backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  badgeText: { fontSize: 10, color: '#fff', fontFamily: Fonts.bodyBold, letterSpacing: 0.5 },
});

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{
      paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill, margin: 3,
      borderWidth: 1.5,
      borderColor: active ? Colors.primary : Colors.border,
      backgroundColor: active ? Colors.primary : Colors.surface,
    }}>
      <Text style={{ fontSize: 13, fontFamily: active ? Fonts.bodyBold : Fonts.bodyMedium, color: active ? '#fff' : Colors.textSecondary }}>
        {label}
      </Text>
    </Pressable>
  );
}

export default function MarchesScreen() {
  const params = useLocalSearchParams<{ produit?: string; q?: string }>();
  const { annonces: allLots, unreadCount } = useAnnonces();
  const { marchePubs } = usePubs();
  const { toggle: toggleDrawer } = useDrawer();

  const [searchInput, setSearchInput] = useState(params.q || '');
  const [search, setSearch] = useState(params.q || '');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [filter, setFilter] = useState<ProductType | null>((params.produit as ProductType) || null);

  const handleSearch = useCallback((text: string) => {
    setSearchInput(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setSearch(text), 300);
  }, []);
  const [region, setRegion] = useState('Toutes');
  const [dispo, setDispo] = useState('Toutes');
  const [prixMin, setPrixMin] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [tri, setTri] = useState('recent');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    if (params.q !== undefined) { setSearchInput(params.q); setSearch(params.q); }
    if (params.produit !== undefined) setFilter((params.produit as ProductType) || null);
  }, [params.q, params.produit]);

  const activeFilterCount = [
    region !== 'Toutes', dispo !== 'Toutes', prixMin !== '', prixMax !== '', tri !== 'recent',
  ].filter(Boolean).length;

  const filtered = useMemo(() => {
    let results = allLots.filter((l) => {
      if (filter && l.produit !== filter) return false;
      if (region !== 'Toutes' && l.region !== region) return false;
      if (dispo !== 'Toutes' && l.dispo !== dispo) return false;
      if (prixMin && l.prix < parseInt(prixMin)) return false;
      if (prixMax && l.prix > parseInt(prixMax)) return false;
      if (search) {
        const q = normalize(search);
        if (
          !normalize(l.titre).includes(q) &&
          !normalize(l.eleveur).includes(q) &&
          !normalize(l.region).includes(q) &&
          !normalize(l.produit).includes(q) &&
          !(l.detail && normalize(l.detail).includes(q))
        ) return false;
      }
      return true;
    });
    if (tri === 'prix_asc') results = [...results].sort((a, b) => a.prix - b.prix);
    else if (tri === 'prix_desc') results = [...results].sort((a, b) => b.prix - a.prix);
    else if (tri === 'qte_desc') results = [...results].sort((a, b) => b.qte - a.qte);
    return results;
  }, [allLots, filter, region, dispo, prixMin, prixMax, search, tri]);

  // Construire les lignes : paires d'annonces + pubs intercalées toutes les 8 annonces
  const rows = useMemo((): ListRow[] => {
    const activePubs = marchePubs.filter((p) => p.actif);
    const result: ListRow[] = [];
    let pubIdx = 0;
    let pairCount = 0;
    for (let i = 0; i < filtered.length; i += 2) {
      // Insérer une pub toutes les 4 paires (= 8 annonces), sauf en tout premier
      if (pairCount > 0 && pairCount % 4 === 0 && activePubs.length > 0) {
        result.push({ type: 'pub', id: `pub_${pubIdx}`, pub: activePubs[pubIdx % activePubs.length] });
        pubIdx++;
      }
      result.push({ type: 'pair', id: `pair_${i}`, left: filtered[i], right: filtered[i + 1] });
      pairCount++;
    }
    return result;
  }, [filtered, marchePubs]);

  const resetFilters = () => {
    setRegion('Toutes'); setDispo('Toutes');
    setPrixMin(''); setPrixMax(''); setTri('recent');
  };

  return (
    <View style={styles.container}>
      <ScreenHeader title="Marché" onMenuPress={toggleDrawer} unreadCount={unreadCount} />

      {/* Barre recherche */}
      <View style={styles.searchRow}>
        <View style={styles.searchBar}>
          <Search size={17} color={Colors.textMuted} strokeWidth={1.8} />
          <TextInput
            style={styles.searchInput}
            placeholder="Un produit, un éleveur, une région..."
            placeholderTextColor={Colors.textPlaceholder}
            value={searchInput}
            onChangeText={handleSearch}
            returnKeyType="search"
            autoCorrect={false}
          />
          {searchInput.length > 0 && (
            <Pressable onPress={() => { setSearchInput(''); setSearch(''); }} hitSlop={8}>
              <X size={16} color={Colors.textMuted} strokeWidth={1.8} />
            </Pressable>
          )}
        </View>
        <Pressable
          onPress={() => setShowFilters((v) => !v)}
          style={[styles.filterBtn, (showFilters || activeFilterCount > 0) && styles.filterBtnActive]}
        >
          <SlidersHorizontal size={18} color={showFilters || activeFilterCount > 0 ? Colors.primaryDark : Colors.textSecondary} strokeWidth={1.7} />
          {activeFilterCount > 0 && !showFilters && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      {/* Pills produit — cachées quand filtres ouverts */}
      <View style={{ display: showFilters ? 'none' : 'flex' }}>
        <View style={styles.pillsRow}>
          {PRODUITS.map((f) => (
            <Chip key={String(f.key)} label={f.label} active={filter === f.key} onPress={() => setFilter(f.key)} />
          ))}
        </View>
        {activeFilterCount > 0 && (
          <View style={styles.tagsRow}>
            {region !== 'Toutes' && (
              <Pressable style={styles.tag} onPress={() => setRegion('Toutes')}>
                <Text style={styles.tagText}>{region} ✕</Text>
              </Pressable>
            )}
            {dispo !== 'Toutes' && (
              <Pressable style={styles.tag} onPress={() => setDispo('Toutes')}>
                <Text style={styles.tagText}>{dispo} ✕</Text>
              </Pressable>
            )}
            {(prixMin || prixMax) && (
              <Pressable style={styles.tag} onPress={() => { setPrixMin(''); setPrixMax(''); }}>
                <Text style={styles.tagText}>{prixMin || '0'}–{prixMax || '∞'} F ✕</Text>
              </Pressable>
            )}
            {tri !== 'recent' && (
              <Pressable style={styles.tag} onPress={() => setTri('recent')}>
                <Text style={styles.tagText}>{TRIS.find(t => t.key === tri)?.label} ✕</Text>
              </Pressable>
            )}
          </View>
        )}
      </View>

      {/* Panneau filtres — affiché par display, jamais démonté */}
      <View style={{ display: showFilters ? 'flex' : 'none', flex: 1 }}>
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ padding: 18, paddingBottom: 20 }}
          keyboardShouldPersistTaps="handled"
          scrollEnabled
        >
          <Text style={styles.filterLabel}>Région</Text>
          <View style={styles.wrapGrid}>
            {REGIONS.map((r) => (
              <Chip key={r} label={r} active={region === r} onPress={() => setRegion(r)} />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 20 }]}>Disponibilité</Text>
          <View style={styles.wrapGrid}>
            {DISPOS.map((d) => (
              <Chip key={d} label={d} active={dispo === d} onPress={() => setDispo(d)} />
            ))}
          </View>

          <Text style={[styles.filterLabel, { marginTop: 20 }]}>Prix (F CFA / unité)</Text>
          <View style={styles.prixRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.prixLabel}>Min</Text>
              <TextInput style={styles.prixInput} value={prixMin} onChangeText={(v) => setPrixMin(v.replace(/\D/g, ''))} placeholder="0" placeholderTextColor={Colors.textPlaceholder} keyboardType="numeric" />
            </View>
            <Text style={styles.prixDash}>—</Text>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.prixLabel}>Max</Text>
              <TextInput style={styles.prixInput} value={prixMax} onChangeText={(v) => setPrixMax(v.replace(/\D/g, ''))} placeholder="∞" placeholderTextColor={Colors.textPlaceholder} keyboardType="numeric" />
            </View>
          </View>

          <Text style={[styles.filterLabel, { marginTop: 20 }]}>Trier par</Text>
          <View style={styles.wrapGrid}>
            {TRIS.map((t) => (
              <Chip key={t.key} label={t.label} active={tri === t.key} onPress={() => setTri(t.key)} />
            ))}
          </View>
        </ScrollView>

        {/* Boutons toujours visibles en bas */}
        <View style={styles.filterActions}>
          <Pressable style={styles.resetBtn} onPress={resetFilters}>
            <Text style={styles.resetBtnText}>Tout effacer</Text>
          </Pressable>
          <Pressable style={styles.applyBtn} onPress={() => setShowFilters(false)}>
            <Text style={styles.applyBtnText}>Voir {filtered.length} annonce{filtered.length !== 1 ? 's' : ''}</Text>
          </Pressable>
        </View>
      </View>

      {/* Liste — affichée par display, jamais démontée */}
      <View style={{ display: showFilters ? 'none' : 'flex', flex: 1 }}>
        <FlatList
          data={rows}
          keyExtractor={(item) => item.id}
          removeClippedSubviews
          maxToRenderPerBatch={4}
          updateCellsBatchingPeriod={60}
          windowSize={5}
          initialNumToRender={4}
          renderItem={({ item }) => {
            if (item.type === 'pub') {
              return <PubCard pub={item.pub} />;
            }
            return (
              <View style={styles.pairRow}>
                <View style={styles.gridItem}>
                  <LotCard lot={item.left} />
                </View>
                {item.right ? (
                  <View style={styles.gridItem}>
                    <LotCard lot={item.right} />
                  </View>
                ) : (
                  <View style={styles.gridItem} />
                )}
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <SearchX size={30} color={Colors.textMuted} strokeWidth={1.4} />
              </View>
              <Text style={styles.emptyTitle}>Rien par ici pour l'instant</Text>
              <Text style={styles.emptySub}>Essaie d'élargir tes filtres ou ta recherche</Text>
              {activeFilterCount > 0 && (
                <Pressable style={styles.resetBtnEmpty} onPress={resetFilters}>
                  <Text style={{ color: Colors.primary, fontFamily: Fonts.bodyBold }}>Effacer les filtres</Text>
                </Pressable>
              )}
            </View>
          }
          contentContainerStyle={{ padding: 10, paddingBottom: 110 }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  searchRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, gap: 9,
    backgroundColor: Colors.surface,
    borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border,
  },
  searchBar: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 9,
    backgroundColor: Colors.surfaceSecondary, borderRadius: Radius.pill,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  searchInput: { flex: 1, fontSize: 14.5, color: Colors.text, fontFamily: Fonts.bodyMedium },
  filterBtn: {
    width: 45, height: 45, borderRadius: Radius.pill,
    backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  filterBtnActive: { backgroundColor: Colors.primaryTint },
  filterBadge: {
    position: 'absolute', top: -3, right: -3,
    backgroundColor: Colors.accent, borderRadius: 9,
    width: 18, height: 18, justifyContent: 'center', alignItems: 'center',
  },
  filterBadgeText: { color: '#fff', fontSize: 10, fontFamily: Fonts.bodyBold },
  pillsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 12, paddingVertical: 8 },
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 6, paddingBottom: 6 },
  tag: {
    backgroundColor: Colors.primaryLight, borderRadius: Radius.pill,
    paddingHorizontal: 11, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.primaryTint,
  },
  tagText: { fontSize: 11, color: Colors.primaryDark, fontFamily: Fonts.bodySemiBold },
  filterLabel: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 10,
  },
  wrapGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  prixRow: { flexDirection: 'row', alignItems: 'center' },
  prixLabel: { fontSize: 12, color: Colors.textMuted, marginBottom: 5, fontFamily: Fonts.bodyMedium },
  prixInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 13, paddingVertical: 11, fontSize: 15,
    color: Colors.text, backgroundColor: Colors.surface, fontFamily: Fonts.bodyMedium,
  },
  prixDash: { fontSize: 18, color: Colors.textMuted, marginTop: 18, marginHorizontal: 4 },
  filterActions: {
    flexDirection: 'row', gap: 10, padding: 14,
    backgroundColor: Colors.surface, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: Colors.border,
  },
  resetBtn: {
    flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center',
  },
  resetBtnText: { color: Colors.textSecondary, fontFamily: Fonts.bodyBold, fontSize: 14.5 },
  resetBtnEmpty: {
    marginTop: 18, borderWidth: 1.5, borderColor: Colors.primary,
    borderRadius: Radius.pill, paddingHorizontal: 22, paddingVertical: 11,
  },
  applyBtn: {
    flex: 2, backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center',
    ...(Shadows.button as object),
  },
  applyBtnText: { color: '#fff', fontSize: 14.5, fontFamily: Fonts.bodyBold },
  pairRow: { flexDirection: 'row', paddingHorizontal: 4, marginBottom: 2 },
  gridItem: { flex: 1, paddingHorizontal: 4 },
  empty: { alignItems: 'center', paddingTop: 70 },
  emptyIconBox: {
    width: 68, height: 68, borderRadius: 24, backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  emptyTitle: { fontSize: 18, fontFamily: Fonts.display, color: Colors.text, marginBottom: 6 },
  emptySub: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted },
});
