import { useEffect, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Platform, TextInput, Alert, Modal, Image, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '@/constants/Colors';
import { useAuthContext } from '@/hooks/AuthContext';
import { useVetContext, ProduitVet } from '@/hooks/VetContext';

const CATEGORIES = [
  { key: 'vaccin', label: 'Vaccin', icon: '💉' },
  { key: 'vitamine', label: 'Vitamine', icon: '🧪' },
  { key: 'medicament', label: 'Médicament', icon: '💊' },
  { key: 'autre', label: 'Autre', icon: '📦' },
] as const;

type Cat = 'vaccin' | 'vitamine' | 'medicament' | 'autre';

const EMPTY_FORM = { nom: '', description: '', prix: '', unite: 'par dose', categorie: 'vaccin' as Cat, photo: '' };

export default function MonCatalogue() {
  const { user } = useAuthContext();
  const { getProfilVet, addProduit, updateProduit, deleteProduit, updatePhoto } = useVetContext();

  const [catalogue, setCatalogue] = useState<ProduitVet[]>([]);
  const [photo, setPhoto] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProduit, setEditingProduit] = useState<ProduitVet | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const profil = await getProfilVet(user.id);
    setCatalogue(profil.catalogue);
    setPhoto(profil.photo);
    setLoading(false);
  };

  const openAdd = () => {
    setEditingProduit(null);
    setForm(EMPTY_FORM);
    setModalVisible(true);
  };

  const openEdit = (p: ProduitVet) => {
    setEditingProduit(p);
    setForm({ nom: p.nom, description: p.description, prix: String(p.prix), unite: p.unite, categorie: p.categorie, photo: p.photo ?? '' });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!form.nom.trim()) { Alert.alert('Champ requis', 'Le nom du produit est obligatoire.'); return; }
    const prix = parseInt(form.prix);
    if (!form.prix || isNaN(prix) || prix < 0) { Alert.alert('Prix invalide', 'Entrez un prix valide en F CFA.'); return; }
    if (!user) return;
    setSaving(true);
    if (editingProduit) {
      await updateProduit(user.id, { ...editingProduit, ...form, prix, photo: form.photo || undefined });
    } else {
      await addProduit(user.id, { ...form, prix, photo: form.photo || undefined });
    }
    await loadData();
    setSaving(false);
    setModalVisible(false);
  };

  const handleDelete = (p: ProduitVet) => {
    Alert.alert('Supprimer ce produit ?', p.nom, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer', style: 'destructive',
        onPress: async () => {
          await deleteProduit(user!.id, p.id);
          await loadData();
        },
      },
    ]);
  };

  const handlePickPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission refusée', 'Autorisez l\'accès à vos photos dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1, 1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      await updatePhoto(user!.id, uri);
      setPhoto(uri);
    }
  };

  const handlePickProduitPhoto = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Permission refusée', 'Autorisez l\'accès à vos photos dans les réglages.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [4, 3], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setForm((f) => ({ ...f, photo: result.assets[0].uri }));
    }
  };

  if (loading) return (
    <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
      <ActivityIndicator size="large" color="#0f766e" />
    </View>
  );

  const isPending = user?.vetStatus === 'pending';
  const isRejected = user?.vetStatus === 'rejected';

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.canGoBack() ? router.back() : router.replace('/(tabs)') : router.replace(`/(tabs)`)} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="chevron-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Mon catalogue</Text>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <Ionicons name="add" size={22} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Statut */}
        {isPending && (
          <View style={styles.statusBanner}>
            <Ionicons name="time" size={20} color="#92400e" />
            <Text style={styles.statusText}>Votre compte est en attente de validation par l'admin AviConnect. Votre profil sera visible une fois validé.</Text>
          </View>
        )}
        {isRejected && (
          <View style={[styles.statusBanner, { backgroundColor: '#fee2e2' }]}>
            <Ionicons name="close-circle" size={20} color="#991b1b" />
            <Text style={[styles.statusText, { color: '#991b1b' }]}>Votre profil a été rejeté. Contactez support@aviconnect.sn pour plus d'informations.</Text>
          </View>
        )}

        {/* Photo de profil */}
        <View style={styles.photoSection}>
          <TouchableOpacity onPress={handlePickPhoto} style={styles.photoBox}>
            {photo ? (
              <Image source={{ uri: photo }} style={styles.photoImg} />
            ) : (
              <View style={styles.photoPlaceholder}>
                <Ionicons name="camera" size={28} color="#0f766e" />
                <Text style={styles.photoPlaceholderText}>Ajouter une photo</Text>
              </View>
            )}
            <View style={styles.photoCameraIcon}>
              <Ionicons name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.photoName}>Dr {user?.prenom} {user?.nom}</Text>
            {user?.ferme ? <Text style={styles.photoClinique}>🏥 {user.ferme}</Text> : null}
            <Text style={styles.photoRegion}>📍 {user?.region}</Text>
          </View>
        </View>

        {/* Catalogue */}
        <View style={styles.catalogueHeader}>
          <Text style={styles.catalogueTitre}>Mes produits ({catalogue.length})</Text>
          <TouchableOpacity style={styles.addProduitBtn} onPress={openAdd}>
            <Ionicons name="add-circle" size={18} color="#0f766e" />
            <Text style={styles.addProduitText}>Ajouter</Text>
          </TouchableOpacity>
        </View>

        {catalogue.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.emptyTitle}>Catalogue vide</Text>
            <Text style={styles.emptySub}>Ajoutez vos vaccins, vitamines et médicaments pour que les éleveurs puissent les consulter.</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={openAdd}>
              <Text style={styles.emptyBtnText}>+ Ajouter un produit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          catalogue.map((p) => (
            <View key={p.id} style={styles.produitCard}>
              {p.photo && (
                <Image source={{ uri: p.photo }} style={styles.produitPhoto} />
              )}
              <View style={styles.produitTop}>
                {!p.photo && (
                  <Text style={styles.produitEmoji}>
                    {CATEGORIES.find((c) => c.key === p.categorie)?.icon ?? '📦'}
                  </Text>
                )}
                <View style={styles.produitInfo}>
                  <Text style={styles.produitNom}>{p.nom}</Text>
                  <Text style={styles.produitPrix}>{p.prix.toLocaleString()} F CFA <Text style={styles.produitUnite}>/ {p.unite}</Text></Text>
                  {p.description ? <Text style={styles.produitDesc}>{p.description}</Text> : null}
                </View>
                <View style={styles.produitActions}>
                  <TouchableOpacity onPress={() => openEdit(p)} style={styles.editBtn}>
                    <Ionicons name="pencil" size={15} color={Colors.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(p)} style={styles.delBtn}>
                    <Ionicons name="trash" size={15} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 80 }} />
      </ScrollView>

      {/* Modal ajout/édition produit */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.text} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editingProduit ? 'Modifier le produit' : 'Ajouter un produit'}</Text>
            <TouchableOpacity onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#0f766e" /> : <Text style={styles.modalSave}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled">
            {/* Photo du produit */}
            <Text style={styles.formLabel}>Photo du produit</Text>
            <TouchableOpacity style={styles.photoProduitPicker} onPress={handlePickProduitPhoto}>
              {form.photo ? (
                <View style={styles.photoProduitPreviewBox}>
                  <Image source={{ uri: form.photo }} style={styles.photoProduitPreview} />
                  <TouchableOpacity
                    style={styles.photoProduitDel}
                    onPress={() => setForm((f) => ({ ...f, photo: '' }))}
                  >
                    <Ionicons name="close-circle" size={22} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoProduitEmpty}>
                  <Ionicons name="camera" size={28} color={Colors.textMuted} />
                  <Text style={styles.photoProduitEmptyText}>Appuyer pour ajouter une photo</Text>
                </View>
              )}
            </TouchableOpacity>

            <Text style={styles.formLabel}>Catégorie</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((c) => (
                <TouchableOpacity
                  key={c.key}
                  style={[styles.catBtn, form.categorie === c.key && styles.catBtnActive]}
                  onPress={() => setForm((f) => ({ ...f, categorie: c.key }))}
                >
                  <Text style={styles.catBtnIcon}>{c.icon}</Text>
                  <Text style={[styles.catBtnLabel, form.categorie === c.key && styles.catBtnLabelActive]}>{c.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.formLabel}>Nom du produit *</Text>
            <TextInput
              style={styles.formInput}
              value={form.nom}
              onChangeText={(v) => setForm((f) => ({ ...f, nom: v }))}
              placeholder="Ex: Newcastle B1, Vitamix, Amprolium..."
              placeholderTextColor={Colors.textMuted}
            />

            <Text style={styles.formLabel}>Description</Text>
            <TextInput
              style={[styles.formInput, styles.formTextarea]}
              value={form.description}
              onChangeText={(v) => setForm((f) => ({ ...f, description: v }))}
              placeholder="Usage, posologie, espèces concernées..."
              placeholderTextColor={Colors.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />

            <View style={styles.formRow}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.formLabel}>Prix (F CFA) *</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.prix}
                  onChangeText={(v) => setForm((f) => ({ ...f, prix: v.replace(/\D/g, '') }))}
                  placeholder="2500"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="numeric"
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.formLabel}>Unité</Text>
                <TextInput
                  style={styles.formInput}
                  value={form.unite}
                  onChangeText={(v) => setForm((f) => ({ ...f, unite: v }))}
                  placeholder="par dose"
                  placeholderTextColor={Colors.textMuted}
                />
              </View>
            </View>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  header: {
    backgroundColor: '#0f766e',
    paddingTop: Platform.OS === 'ios' ? 56 : 42,
    paddingHorizontal: 16, paddingBottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800', color: '#fff' },
  addBtn: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center',
  },
  scroll: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  statusBanner: {
    backgroundColor: '#fef3c7', borderRadius: 12, padding: 14,
    flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 16,
  },
  statusText: { flex: 1, fontSize: 13, color: '#92400e', lineHeight: 19 },
  photoSection: {
    backgroundColor: '#fff', borderRadius: 16, padding: 16,
    flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 20,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06, shadowRadius: 8, elevation: 3,
  },
  photoBox: { position: 'relative' },
  photoImg: { width: 80, height: 80, borderRadius: 40 },
  photoPlaceholder: {
    width: 80, height: 80, borderRadius: 40,
    backgroundColor: '#ccfbf1', alignItems: 'center', justifyContent: 'center',
  },
  photoPlaceholderText: { fontSize: 10, color: '#0f766e', marginTop: 4, textAlign: 'center' },
  photoCameraIcon: {
    position: 'absolute', bottom: 0, right: 0,
    backgroundColor: '#0f766e', borderRadius: 10, width: 22, height: 22,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: '#fff',
  },
  photoName: { fontSize: 16, fontWeight: '800', color: Colors.text, marginBottom: 2 },
  photoClinique: { fontSize: 13, color: Colors.textSecondary, marginBottom: 2 },
  photoRegion: { fontSize: 12, color: Colors.textMuted },
  catalogueHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12,
  },
  catalogueTitre: { fontSize: 15, fontWeight: '800', color: Colors.text },
  addProduitBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addProduitText: { fontSize: 13, color: '#0f766e', fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 40, paddingHorizontal: 24 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  emptyTitle: { fontSize: 17, fontWeight: '700', color: Colors.text, marginBottom: 8 },
  emptySub: { fontSize: 13, color: Colors.textMuted, textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  emptyBtn: { backgroundColor: '#0f766e', borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24 },
  emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  produitCard: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden', marginBottom: 8,
    shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04, shadowRadius: 4, elevation: 1,
  },
  produitPhoto: { width: '100%', height: 140, resizeMode: 'cover' },
  produitTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, padding: 14 },
  produitEmoji: { fontSize: 26, marginTop: 2 },
  produitInfo: { flex: 1 },
  produitNom: { fontSize: 14, fontWeight: '700', color: Colors.text, marginBottom: 2 },
  produitPrix: { fontSize: 14, fontWeight: '800', color: '#0f766e', marginBottom: 4 },
  produitUnite: { fontSize: 11, fontWeight: '500', color: Colors.textMuted },
  produitDesc: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },
  produitActions: { gap: 6 },
  editBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: Colors.primaryLight,
    alignItems: 'center', justifyContent: 'center',
  },
  delBtn: {
    width: 32, height: 32, borderRadius: 8, backgroundColor: '#fee2e2',
    alignItems: 'center', justifyContent: 'center',
  },
  // Modal
  modalContainer: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingVertical: 14,
    paddingTop: Platform.OS === 'ios' ? 56 : 24,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
    backgroundColor: '#fff',
  },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modalSave: { fontSize: 15, color: '#0f766e', fontWeight: '800' },
  modalScroll: { flex: 1 },
  modalContent: { padding: 20, paddingBottom: 60 },
  formLabel: { fontSize: 13, fontWeight: '600', color: Colors.text, marginBottom: 8, marginTop: 16 },
  formInput: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15,
    color: Colors.text, backgroundColor: '#fff',
  },
  formTextarea: { minHeight: 80 },
  formRow: { flexDirection: 'row' },
  photoProduitPicker: { marginBottom: 4 },
  photoProduitEmpty: {
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    borderRadius: 12, height: 110, alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.surfaceSecondary,
  },
  photoProduitEmptyText: { fontSize: 13, color: Colors.textMuted },
  photoProduitPreviewBox: { position: 'relative' },
  photoProduitPreview: { width: '100%', height: 160, borderRadius: 12, resizeMode: 'cover' },
  photoProduitDel: { position: 'absolute', top: 8, right: 8 },
  catGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  catBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10,
    borderWidth: 1.5, borderColor: Colors.border, backgroundColor: '#fff',
  },
  catBtnActive: { borderColor: '#0f766e', backgroundColor: '#ccfbf1' },
  catBtnIcon: { fontSize: 16 },
  catBtnLabel: { fontSize: 13, color: Colors.textSecondary, fontWeight: '600' },
  catBtnLabelActive: { color: '#0f766e' },
});

