import { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Platform, Alert, Switch, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { usePubs, type BannerPub, type MarchePub } from '@/hooks/PubContext';

const BG_PRESETS = [
  '#15803d', '#166534', '#14532d', '#1d4ed8', '#7c3aed',
  '#b45309', '#be123c', '#0e7490', '#374151', '#92400e',
];

function ColorPicker({ value, onChange }: { value: string; onChange: (c: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
      {BG_PRESETS.map((c) => (
        <TouchableOpacity
          key={c}
          onPress={() => onChange(c)}
          style={[
            cp.swatch,
            { backgroundColor: c },
            value === c && cp.swatchActive,
          ]}
        />
      ))}
      <View style={[cp.swatch, { backgroundColor: value, borderStyle: 'dashed' }]}>
        <TextInput
          style={cp.hexInput}
          value={value}
          onChangeText={onChange}
          maxLength={7}
          autoCapitalize="none"
          placeholder="#"
          placeholderTextColor="rgba(255,255,255,0.5)"
        />
      </View>
    </View>
  );
}
const cp = StyleSheet.create({
  swatch: { width: 34, height: 34, borderRadius: 8, borderWidth: 2, borderColor: 'transparent', justifyContent: 'center', alignItems: 'center' },
  swatchActive: { borderColor: '#fff', transform: [{ scale: 1.15 }] },
  hexInput: { fontSize: 8, color: '#fff', width: 32, textAlign: 'center' },
});

// ─── Formulaire bannière ──────────────────────────────────────────────────────
function BannerForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<BannerPub>;
  onSave: (b: Omit<BannerPub, 'id'>) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [sub, setSub] = useState(initial?.sub || '');
  const [lien, setLien] = useState(initial?.lien || '');
  const [bg, setBg] = useState(initial?.bg || '#15803d');
  const [actif, setActif] = useState(initial?.actif ?? true);

  const valid = title.trim().length > 0;
  return (
    <View style={form.box}>
      <Text style={form.label}>Titre *</Text>
      <TextInput style={form.input} value={title} onChangeText={setTitle} placeholder="Titre de la bannière" placeholderTextColor={Colors.textMuted} maxLength={60} />
      <Text style={form.label}>Sous-titre</Text>
      <TextInput style={form.input} value={sub} onChangeText={setSub} placeholder="Description courte" placeholderTextColor={Colors.textMuted} maxLength={80} />
      <Text style={form.label}>Lien (optionnel)</Text>
      <View style={form.lienRow}>
        <Text style={form.lienIcon}>🔗</Text>
        <TextInput
          style={[form.input, { flex: 1, marginBottom: 0 }]}
          value={lien}
          onChangeText={setLien}
          placeholder="https://..."
          placeholderTextColor={Colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {lien.length > 0 && !lien.startsWith('http') && (
        <Text style={form.lienWarn}>⚠️ Le lien doit commencer par https://</Text>
      )}
      <Text style={form.label}>Couleur de fond</Text>
      <ColorPicker value={bg} onChange={setBg} />
      <View style={form.preview}>
        <View style={[form.previewSlide, { backgroundColor: bg }]}>
          <Text style={form.previewTitle}>{title || 'Titre'}</Text>
          <Text style={form.previewSub}>{sub || 'Sous-titre'}</Text>
          {lien.length > 0 && <Text style={form.previewLien}>🔗 {lien}</Text>}
        </View>
      </View>
      <View style={form.switchRow}>
        <Text style={form.label}>Activer cette bannière</Text>
        <Switch value={actif} onValueChange={setActif} trackColor={{ true: Colors.primary }} />
      </View>
      <View style={form.actions}>
        <TouchableOpacity style={form.cancelBtn} onPress={onCancel}>
          <Text style={form.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.saveBtn, !valid && form.saveBtnDisabled]}
          disabled={!valid}
          onPress={() => onSave({ title: title.trim(), sub: sub.trim(), lien: lien.trim() || undefined, bg, actif })}
        >
          <Text style={form.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Formulaire pub marché ────────────────────────────────────────────────────
function MarchePubForm({
  initial, onSave, onCancel,
}: {
  initial?: Partial<MarchePub>;
  onSave: (p: Omit<MarchePub, 'id'>) => void;
  onCancel: () => void;
}) {
  const [titre, setTitre] = useState(initial?.titre || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [emoji, setEmoji] = useState(initial?.emoji || '📢');
  const [lien, setLien] = useState(initial?.lien || '');
  const [bg, setBg] = useState(initial?.bg || '#1d4ed8');
  const [actif, setActif] = useState(initial?.actif ?? true);

  const valid = titre.trim().length > 0;
  return (
    <View style={form.box}>
      <Text style={form.label}>Titre *</Text>
      <TextInput style={form.input} value={titre} onChangeText={setTitre} placeholder="Votre offre ou message" placeholderTextColor={Colors.textMuted} maxLength={50} />
      <Text style={form.label}>Description</Text>
      <TextInput style={form.input} value={description} onChangeText={setDescription} placeholder="Détails de la promotion..." placeholderTextColor={Colors.textMuted} maxLength={100} multiline />
      <Text style={form.label}>Emoji</Text>
      <TextInput style={[form.input, { fontSize: 22, width: 60 }]} value={emoji} onChangeText={setEmoji} maxLength={4} />
      <Text style={form.label}>Lien (optionnel)</Text>
      <View style={form.lienRow}>
        <Text style={form.lienIcon}>🔗</Text>
        <TextInput
          style={[form.input, { flex: 1, marginBottom: 0 }]}
          value={lien}
          onChangeText={setLien}
          placeholder="https://..."
          placeholderTextColor={Colors.textMuted}
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {lien.length > 0 && !lien.startsWith('http') && (
        <Text style={form.lienWarn}>⚠️ Le lien doit commencer par https://</Text>
      )}
      <Text style={form.label}>Couleur de fond</Text>
      <ColorPicker value={bg} onChange={setBg} />
      <View style={form.preview}>
        <View style={[form.previewPub, { backgroundColor: bg }]}>
          <Text style={{ fontSize: 28 }}>{emoji}</Text>
          <View style={{ flex: 1, marginLeft: 10 }}>
            <Text style={form.previewTitle}>{titre || 'Titre'}</Text>
            <Text style={form.previewSub}>{description || 'Description'}</Text>
            {lien.length > 0 && <Text style={form.previewLien}>🔗 Voir plus</Text>}
          </View>
          <View style={form.previewBadge}><Text style={form.previewBadgeText}>Pub</Text></View>
        </View>
      </View>
      <View style={form.switchRow}>
        <Text style={form.label}>Activer cette pub</Text>
        <Switch value={actif} onValueChange={setActif} trackColor={{ true: Colors.primary }} />
      </View>
      <View style={form.actions}>
        <TouchableOpacity style={form.cancelBtn} onPress={onCancel}>
          <Text style={form.cancelText}>Annuler</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[form.saveBtn, !valid && form.saveBtnDisabled]}
          disabled={!valid}
          onPress={() => onSave({ titre: titre.trim(), description: description.trim(), emoji, lien: lien.trim() || undefined, bg, actif })}
        >
          <Text style={form.saveText}>Enregistrer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const form = StyleSheet.create({
  box: { backgroundColor: '#f8fafb', borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: Colors.border },
  label: { fontSize: 12, fontWeight: '700', color: Colors.textLight, textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 10, marginBottom: 4 },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
    color: Colors.text, backgroundColor: '#fff',
  },
  preview: { marginTop: 12, marginBottom: 4 },
  previewSlide: { borderRadius: 12, padding: 20, minHeight: 80, justifyContent: 'center' },
  previewPub: { borderRadius: 12, padding: 14, flexDirection: 'row', alignItems: 'center' },
  previewTitle: { fontSize: 15, fontWeight: '700', color: '#fff', marginBottom: 2 },
  previewSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)' },
  previewBadge: { position: 'absolute', top: 6, right: 8, backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 5, paddingHorizontal: 5, paddingVertical: 2 },
  previewBadgeText: { fontSize: 9, color: '#fff', fontWeight: '700' },
  lienRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  lienIcon: { fontSize: 18 },
  lienWarn: { fontSize: 11, color: '#b45309', marginTop: 4 },
  previewLien: { fontSize: 11, color: 'rgba(255,255,255,0.8)', marginTop: 4, textDecorationLine: 'underline' },
  switchRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  actions: { flexDirection: 'row', gap: 10, marginTop: 14 },
  cancelBtn: { flex: 1, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  cancelText: { color: Colors.textLight, fontWeight: '700' },
  saveBtn: { flex: 2, backgroundColor: Colors.primary, borderRadius: 10, paddingVertical: 11, alignItems: 'center' },
  saveBtnDisabled: { opacity: 0.5 },
  saveText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

// ─── Page principale ──────────────────────────────────────────────────────────
export default function AdminPubsScreen() {
  const { user, isAdmin, isLoading: authLoading } = useAuthContext();
  const {
    banners, marchePubs,
    addBanner, updateBanner, deleteBanner,
    addMarchePub, updateMarchePub, deleteMarchePub,
  } = usePubs();

  const [tab, setTab] = useState<'banners' | 'marche'>('banners');
  const [addingBanner, setAddingBanner] = useState(false);
  const [editingBanner, setEditingBanner] = useState<BannerPub | null>(null);
  const [addingMarche, setAddingMarche] = useState(false);
  const [editingMarche, setEditingMarche] = useState<MarchePub | null>(null);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.replace('/(tabs)' as any);
    }
  }, [authLoading, isAdmin]);

  if (authLoading || !user || !isAdmin) {
    return (
      <View style={styles.denied}>
        <ActivityIndicator color={Colors.primary} size="large" />
      </View>
    );
  }

  const confirmDelete = (onDelete: () => void, label: string) => {
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer "${label}" ?`)) onDelete();
    } else {
      Alert.alert('Supprimer ?', `"${label}" sera supprimé définitivement.`, [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: onDelete },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)}>
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Gestion des publicités</Text>
        <View style={{ width: 32 }} />
      </View>

      {/* Onglets */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'banners' && styles.tabActive]}
          onPress={() => setTab('banners')}
        >
          <Text style={[styles.tabText, tab === 'banners' && styles.tabTextActive]}>
            🖼 Carrousel accueil ({banners.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'marche' && styles.tabActive]}
          onPress={() => setTab('marche')}
        >
          <Text style={[styles.tabText, tab === 'marche' && styles.tabTextActive]}>
            🛒 Marchés ({marchePubs.length})
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 60 }}>

        {/* ── Bannières accueil ─────────────────────────────────── */}
        {tab === 'banners' && (
          <>
            <Text style={styles.hint}>
              Ces bannières s'affichent dans le carrousel de l'accueil. Jusqu'à 5 bannières actives.
            </Text>

            {banners.map((b) => (
              editingBanner?.id === b.id ? (
                <BannerForm
                  key={b.id}
                  initial={b}
                  onSave={async (data) => { await updateBanner({ ...b, ...data }); setEditingBanner(null); }}
                  onCancel={() => setEditingBanner(null)}
                />
              ) : (
                <View key={b.id} style={[styles.itemCard, !b.actif && styles.itemInactive]}>
                  <View style={[styles.itemPreview, { backgroundColor: b.bg }]}>
                    <Text style={styles.itemPreviewTitle} numberOfLines={1}>{b.title}</Text>
                    <Text style={styles.itemPreviewSub} numberOfLines={1}>{b.sub}</Text>
                  </View>
                  <View style={styles.itemFooter}>
                    <View style={[styles.statusDot, { backgroundColor: b.actif ? '#22c55e' : '#d1d5db' }]} />
                    <Text style={styles.statusText}>{b.actif ? 'Active' : 'Inactive'}</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={async () => { await updateBanner({ ...b, actif: !b.actif }); }}
                    >
                      <Text style={styles.actionBtnText}>{b.actif ? 'Désactiver' : 'Activer'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditingBanner(b)}>
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(() => deleteBanner(b.id), b.title)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ))}

            {addingBanner ? (
              <BannerForm
                onSave={async (data) => { await addBanner(data); setAddingBanner(false); }}
                onCancel={() => setAddingBanner(false)}
              />
            ) : banners.length < 5 ? (
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddingBanner(true)}>
                <Text style={styles.addBtnText}>+ Ajouter une bannière</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.maxHint}>Maximum 5 bannières atteint</Text>
            )}
          </>
        )}

        {/* ── Pubs marchés ──────────────────────────────────────── */}
        {tab === 'marche' && (
          <>
            <Text style={styles.hint}>
              Ces publicités s'affichent dans la liste des marchés, après chaque groupe de 8 annonces.
            </Text>

            {marchePubs.length === 0 && !addingMarche && (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyEmoji}>📢</Text>
                <Text style={styles.emptyText}>Aucune pub pour les marchés</Text>
                <Text style={styles.emptySubText}>Ajoutez-en une pour commencer</Text>
              </View>
            )}

            {marchePubs.map((p) => (
              editingMarche?.id === p.id ? (
                <MarchePubForm
                  key={p.id}
                  initial={p}
                  onSave={async (data) => { await updateMarchePub({ ...p, ...data }); setEditingMarche(null); }}
                  onCancel={() => setEditingMarche(null)}
                />
              ) : (
                <View key={p.id} style={[styles.itemCard, !p.actif && styles.itemInactive]}>
                  <View style={[styles.itemPubPreview, { backgroundColor: p.bg }]}>
                    <Text style={{ fontSize: 26 }}>{p.emoji}</Text>
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={styles.itemPreviewTitle} numberOfLines={1}>{p.titre}</Text>
                      <Text style={styles.itemPreviewSub} numberOfLines={1}>{p.description}</Text>
                    </View>
                  </View>
                  <View style={styles.itemFooter}>
                    <View style={[styles.statusDot, { backgroundColor: p.actif ? '#22c55e' : '#d1d5db' }]} />
                    <Text style={styles.statusText}>{p.actif ? 'Active' : 'Inactive'}</Text>
                    <View style={{ flex: 1 }} />
                    <TouchableOpacity
                      style={styles.actionBtn}
                      onPress={async () => { await updateMarchePub({ ...p, actif: !p.actif }); }}
                    >
                      <Text style={styles.actionBtnText}>{p.actif ? 'Désactiver' : 'Activer'}</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.editBtn} onPress={() => setEditingMarche(p)}>
                      <Text style={styles.editBtnText}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(() => deleteMarchePub(p.id), p.titre)}
                    >
                      <Text style={styles.deleteBtnText}>🗑</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )
            ))}

            {addingMarche ? (
              <MarchePubForm
                onSave={async (data) => { await addMarchePub(data); setAddingMarche(false); }}
                onCancel={() => setAddingMarche(false)}
              />
            ) : (
              <TouchableOpacity style={styles.addBtn} onPress={() => setAddingMarche(true)}>
                <Text style={styles.addBtnText}>+ Ajouter une pub marché</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: Colors.primary, paddingTop: 56,
    paddingHorizontal: 20, paddingBottom: 16,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end',
  },
  backText: { color: '#fff', fontSize: 24, fontWeight: '300' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#fff' },
  tabs: {
    flexDirection: 'row', backgroundColor: '#fff',
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: 14, alignItems: 'center',
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  tabTextActive: { color: Colors.primary, fontWeight: '700' },
  hint: {
    fontSize: 12, color: Colors.textMuted, marginBottom: 14,
    backgroundColor: '#f0fdf4', padding: 10, borderRadius: 8, lineHeight: 18,
  },
  itemCard: {
    backgroundColor: '#fff', borderRadius: 14, overflow: 'hidden',
    marginBottom: 10, borderWidth: 1, borderColor: Colors.border,
  },
  itemInactive: { opacity: 0.65 },
  itemPreview: { padding: 18, justifyContent: 'center', minHeight: 72 },
  itemPubPreview: { padding: 14, flexDirection: 'row', alignItems: 'center', minHeight: 72 },
  itemPreviewTitle: { fontSize: 15, fontWeight: '700', color: '#fff' },
  itemPreviewSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 3 },
  itemFooter: {
    flexDirection: 'row', alignItems: 'center', padding: 10,
    borderTopWidth: 1, borderTopColor: Colors.border, gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, color: Colors.textLight },
  actionBtn: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  actionBtnText: { fontSize: 12, color: Colors.text, fontWeight: '600' },
  editBtn: { padding: 6 },
  editBtnText: { fontSize: 18 },
  deleteBtn: { padding: 6 },
  deleteBtnText: { fontSize: 18 },
  addBtn: {
    borderWidth: 2, borderColor: Colors.primary, borderStyle: 'dashed',
    borderRadius: 14, paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  addBtnText: { color: Colors.primary, fontWeight: '700', fontSize: 15 },
  maxHint: { textAlign: 'center', color: Colors.textMuted, fontSize: 13, marginTop: 8 },
  emptyBox: { alignItems: 'center', paddingVertical: 40 },
  emptyEmoji: { fontSize: 48 },
  emptyText: { fontSize: 16, fontWeight: '700', color: Colors.text, marginTop: 12 },
  emptySubText: { fontSize: 13, color: Colors.textLight, marginTop: 6 },
  denied: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
  deniedText: { fontSize: 16, color: Colors.textLight, textAlign: 'center', marginTop: 12 },
  backBtn: { marginTop: 20, backgroundColor: Colors.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  backBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

