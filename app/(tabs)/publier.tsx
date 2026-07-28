import { useState, useRef } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator,
  Alert, Image,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { REGIONS, PRODUCT_EMOJIS, PRODUCT_LABELS, type ProductType } from '@/constants/mockData';
import { useAuthContext } from '@/hooks/AuthContext';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useBesoins } from '@/hooks/BesoinContext';
import { useRewards } from '@/hooks/RewardsContext';
import { supabase } from '@/lib/supabase';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

// Largeur maximale des photos d'annonce. Une photo de téléphone fait 3000 à
// 4000 px de large et pèse plusieurs mégaoctets : dans la grille du marché,
// elle mettait plusieurs secondes à s'afficher sur une connexion mobile.
// 1280 px suffit largement pour un affichage plein écran sur téléphone.
const PHOTO_MAX_WIDTH = 1280;

// Redimensionne et recompresse en JPEG avant l'envoi. En cas d'échec on
// renvoie l'URI d'origine : mieux vaut une photo lourde que pas de photo.
async function compressPhoto(uri: string): Promise<{ uri: string; ext: string; mime: string }> {
  try {
    const ImageManipulator = await import('expo-image-manipulator');
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: PHOTO_MAX_WIDTH } }],
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    return { uri: result.uri, ext: 'jpg', mime: 'image/jpeg' };
  } catch (e) {
    console.warn('[photo] compression impossible, envoi de l’original', e);
    const isBase64 = uri.startsWith('data:');
    const ext = isBase64
      ? (uri.startsWith('data:image/png') ? 'png' : 'jpg')
      : (uri.split('.').pop()?.toLowerCase() || 'jpg');
    return { uri, ext, mime: ext === 'png' ? 'image/png' : 'image/jpeg' };
  }
}

async function uploadPhoto(uri: string, userId: string): Promise<string | null> {
  try {
    const photo = await compressPhoto(uri);
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).slice(2)}.${photo.ext}`;
    const res = await fetch(photo.uri);
    const arrayBuffer = await res.arrayBuffer();
    const { error } = await supabase.storage.from('photos').upload(fileName, arrayBuffer, {
      contentType: photo.mime, upsert: false,
    });
    if (error) { console.error('[photo upload]', error.message); return null; }
    return supabase.storage.from('photos').getPublicUrl(fileName).data.publicUrl;
  } catch (e) {
    console.error('[photo upload] error', e); return null;
  }
}

const PRODUCTS_ELEVEUR: ProductType[] = ['poulet', 'poussin', 'oeuf', 'aliment'];
const PRODUCTS_COUVOIR: ProductType[] = ['poussin', 'aliment'];
const PRODUCTS_BESOIN: ProductType[] = ['poulet', 'poussin', 'oeuf', 'aliment'];
const DISPOS = ['Immédiat', 'Dans 3 jours', 'Dans 1 semaine', 'Dans 2 semaines', 'Sur commande'];

// ─── Formulaire Annonce (éleveur / couvoir) ───────────────────────────────────

function AnnounceForm() {
  const { user } = useAuthContext();
  const { addAnnonce } = useAnnonces();
  const isOnline = useNetworkStatus();
  const { award } = useRewards();
  const [produit, setProduit] = useState<ProductType>(user?.role === 'couvoir' ? 'poussin' : 'poulet');
  const [photos, setPhotos] = useState<string[]>([]);
  const [titre, setTitre] = useState('');
  const [qte, setQte] = useState('');
  const [prix, setPrix] = useState('');
  const [region, setRegion] = useState(user?.region || 'Dakar');
  const [dispo, setDispo] = useState('Immédiat');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const isCouvoir = user?.role === 'couvoir';
  const products = isCouvoir ? PRODUCTS_COUVOIR : PRODUCTS_ELEVEUR;
  const isCarton = produit === 'poussin' && isCouvoir;
  const CARTON_SIZE = 50;

  const pickImageWeb = () => {
    if (photos.length >= 4) { window.alert('Maximum 4 photos autorisées.'); return; }
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = (e: any) => {
      const files: File[] = Array.from(e.target.files || []);
      files.slice(0, 4 - photos.length).forEach((file) => {
        const reader = new FileReader();
        reader.onload = (ev) => { const r = ev.target?.result as string; if (r) setPhotos((p) => [...p, r]); };
        reader.readAsDataURL(file);
      });
    };
    input.click();
  };

  const pickImageMobile = async () => {
    if (photos.length >= 4) { Alert.alert('Maximum 4 photos autorisées.'); return; }
    try {
      const ImagePicker = await import('expo-image-picker');
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) { Alert.alert('Permission refusée', "Autorisez l'accès à la galerie."); return; }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true, quality: 0.8,
      });
      if (!result.canceled) setPhotos((p) => [...p, ...result.assets.slice(0, 4 - photos.length).map((a) => a.uri)]);
    } catch { Alert.alert('Erreur', "Impossible d'accéder à la galerie."); }
  };

  const pickImage = () => { if (Platform.OS === 'web') pickImageWeb(); else pickImageMobile(); };
  const removePhoto = (idx: number) => setPhotos((p) => p.filter((_, i) => i !== idx));

  const handlePublier = async () => {
    if (!user) {
      const go = () => router.push('/(auth)/login');
      if (Platform.OS === 'web') { window.alert('Connectez-vous pour publier.'); go(); }
      else Alert.alert('Connexion requise', '', [{ text: 'Se connecter', onPress: go }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (!titre.trim() || !qte.trim() || !prix.trim()) {
      const msg = 'Veuillez remplir le titre, la quantité et le prix.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Champs manquants', msg);
      return;
    }
    if (!isOnline) {
      const msg = 'Pas de connexion internet. Reconnectez-vous pour publier.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Hors-ligne', msg);
      return;
    }
    setLoading(true);
    // Upload photos vers Supabase Storage
    let uploadedUrls: string[] = [];
    if (photos.length > 0) {
      const results = await Promise.all(photos.map((uri) => uploadPhoto(uri, user.id)));
      uploadedUrls = results.filter(Boolean) as string[];
    }
    await addAnnonce({
      eleveur: user.prenom + ' ' + user.nom,
      eleveurId: user.id,
      eleveurPhone: user.phone || '',
      region, produit, titre,
      qte: parseInt(qte),
      prix: parseInt(prix),
      unite: isCarton ? 'carton' : 'piece',
      dispo,
      detail: description || '',
      createdAt: new Date().toISOString().slice(0, 10),
      photos: uploadedUrls.length > 0 ? uploadedUrls : undefined,
    });
    await award('publish');
    setLoading(false);
    setTitre(''); setQte(''); setPrix(''); setDescription(''); setPhotos([]);
    const msg = 'Elle est maintenant visible sur le marché.';
    if (Platform.OS === 'web') { window.alert('✅ Annonce publiée ! ' + msg); router.push('/(tabs)/marches' as any); }
    else Alert.alert('✅ Annonce publiée !', msg, [{ text: 'Voir les marchés', onPress: () => router.push('/(tabs)/marches' as any) }]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
      {/* Produit */}
      <Text style={styles.label}>Produit *</Text>
      <View style={styles.productGrid}>
        {products.map((p) => (
          <TouchableOpacity key={p} style={[styles.productCard, produit === p && styles.productCardActive]} onPress={() => setProduit(p)}>
            <Text style={{ fontSize: 28 }}>{PRODUCT_EMOJIS[p]}</Text>
            <Text style={[styles.productLabel, produit === p && styles.productLabelActive]}>{PRODUCT_LABELS[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Photos */}
      <Text style={[styles.label, { marginTop: 8 }]}>Photos ({photos.length}/4)</Text>
      <View style={styles.photosGrid}>
        {photos.map((uri, idx) => (
          <View key={idx} style={styles.photoThumb}>
            <Image source={{ uri }} style={styles.thumbImg} />
            <TouchableOpacity style={styles.removeBtn} onPress={() => removePhoto(idx)}>
              <Text style={styles.removeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        {photos.length < 4 && (
          <TouchableOpacity style={styles.addPhotoBtn} onPress={pickImage}>
            <Text style={styles.addPhotoIcon}>📷</Text>
            <Text style={styles.addPhotoText}>Ajouter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Titre */}
      <Text style={[styles.label, { marginTop: 8 }]}>Titre *</Text>
      <TextInput style={styles.input} value={titre} onChangeText={setTitre} placeholder="Ex: Poulets de chair Cobb 500" placeholderTextColor={Colors.textMuted} />

      {/* Quantité + Prix */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>{isCarton ? 'Quantité (cartons) *' : 'Quantité *'}</Text>
          <TextInput
            style={styles.input} value={qte} onChangeText={setQte}
            placeholder={isCarton ? 'Ex: 20' : '500'} placeholderTextColor={Colors.textMuted} keyboardType="numeric"
          />
          {isCarton && <Text style={styles.cartonHint}>= {qte ? parseInt(qte) * CARTON_SIZE : 0} poussins au total</Text>}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{isCarton ? 'Prix / carton *' : 'Prix F CFA *'}</Text>
          <TextInput
            style={styles.input} value={prix} onChangeText={setPrix}
            placeholder={isCarton ? 'Ex: 75000' : '2800'} placeholderTextColor={Colors.textMuted} keyboardType="numeric"
          />
        </View>
      </View>
      {isCarton && (
        <View style={styles.cartonInfo}>
          <Text style={styles.cartonInfoText}>📦 1 carton = {CARTON_SIZE} poussins · Le prix est par carton</Text>
        </View>
      )}

      {/* Région */}
      <Text style={styles.label}>Région *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
          <TouchableOpacity key={r} style={[styles.pill, region === r && styles.pillActive]} onPress={() => setRegion(r)}>
            <Text style={[styles.pillText, region === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Disponibilité */}
      <Text style={styles.label}>Disponibilité</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {DISPOS.map((d) => (
          <TouchableOpacity key={d} style={[styles.pill, dispo === d && styles.pillActive]} onPress={() => setDispo(d)}>
            <Text style={[styles.pillText, dispo === d && styles.pillTextActive]}>{d}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Description */}
      <Text style={styles.label}>Description</Text>
      <TextInput
        style={[styles.input, styles.textarea]} value={description} onChangeText={setDescription}
        placeholder="Décrivez votre lot, races disponibles, conditions sanitaires..."
        placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top"
      />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handlePublier} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>📢 Publier l'annonce</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Formulaire Besoin (acheteur uniquement) ──────────────────────────────────

function BesoinForm() {
  const { user } = useAuthContext();
  const { addBesoin } = useBesoins();
  const { award } = useRewards();
  const [produit, setProduit] = useState<ProductType>('poulet');
  const [qte, setQte] = useState('');
  const [prixMax, setPrixMax] = useState('');
  const [region, setRegion] = useState(user?.region || 'Dakar');
  const [detail, setDetail] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePublier = async () => {
    if (!user) {
      const go = () => router.push('/(auth)/login');
      if (Platform.OS === 'web') { window.alert('Connectez-vous pour publier.'); go(); }
      else Alert.alert('Connexion requise', '', [{ text: 'Se connecter', onPress: go }, { text: 'Annuler', style: 'cancel' }]);
      return;
    }
    if (!qte.trim() || !prixMax.trim()) {
      const msg = 'Veuillez remplir la quantité et le prix maximum.';
      if (Platform.OS === 'web') window.alert(msg); else Alert.alert('Champs manquants', msg);
      return;
    }
    setLoading(true);
    await addBesoin({
      acheteurId: user.id,
      acheteurNom: user.prenom + ' ' + user.nom,
      acheteurPhone: user.phone,
      produit,
      qte: parseInt(qte),
      prixMax: parseInt(prixMax),
      region,
      detail,
      dateExpiry: '',
    });
    await award('besoin');
    setLoading(false);
    setQte(''); setPrixMax(''); setDetail('');
    const msg = 'Les vendeurs peuvent maintenant vous contacter.';
    if (Platform.OS === 'web') { window.alert('✅ Besoin publié ! ' + msg); router.push('/(tabs)' as any); }
    else Alert.alert('✅ Besoin publié !', msg, [{ text: 'Accueil', onPress: () => router.push('/(tabs)' as any) }]);
  };

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={{ padding: 16, paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
      {/* Info banner */}
      <View style={styles.besoinBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#0c4a6e" style={{ marginRight: 8 }} />
        <Text style={styles.besoinBannerText}>Publiez ce que vous cherchez. Les éleveurs et couvoirs vous contacteront directement.</Text>
      </View>

      {/* Produit */}
      <Text style={styles.label}>Je cherche *</Text>
      <View style={styles.productGrid}>
        {PRODUCTS_BESOIN.map((p) => (
          <TouchableOpacity key={p} style={[styles.productCard, produit === p && styles.productCardActive]} onPress={() => setProduit(p)}>
            <Text style={{ fontSize: 28 }}>{PRODUCT_EMOJIS[p]}</Text>
            <Text style={[styles.productLabel, produit === p && styles.productLabelActive]}>{PRODUCT_LABELS[p]}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quantité + Prix max */}
      <View style={styles.row}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.label}>Quantité souhaitée *</Text>
          <TextInput
            style={styles.input} value={qte} onChangeText={setQte}
            placeholder="Ex: 500" placeholderTextColor={Colors.textMuted} keyboardType="numeric"
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>Prix max F CFA *</Text>
          <TextInput
            style={styles.input} value={prixMax} onChangeText={setPrixMax}
            placeholder="Ex: 3000" placeholderTextColor={Colors.textMuted} keyboardType="numeric"
          />
        </View>
      </View>

      {/* Région */}
      <Text style={styles.label}>Région souhaitée *</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
          <TouchableOpacity key={r} style={[styles.pill, region === r && styles.pillActive]} onPress={() => setRegion(r)}>
            <Text style={[styles.pillText, region === r && styles.pillTextActive]}>{r}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Détail */}
      <Text style={styles.label}>Détails supplémentaires</Text>
      <TextInput
        style={[styles.input, styles.textarea]} value={detail} onChangeText={setDetail}
        placeholder="Race souhaitée, délai de livraison, conditions particulières..."
        placeholderTextColor={Colors.textMuted} multiline numberOfLines={4} textAlignVertical="top"
      />

      <TouchableOpacity style={[styles.btn, loading && styles.btnDisabled]} onPress={handlePublier} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>🔍 Publier mon besoin</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

// ─── Écran principal ─────────────────────────────────────────────────────────

export default function PublierScreen() {
  const { user } = useAuthContext();
  const isAcheteur = user?.role === 'acheteur';
  const isVet = user?.role === 'veterinaire';

  // Les vétérinaires n'ont pas accès à cette page, ils ont Mon Catalogue
  if (isVet) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
        <Text style={{ fontSize: 48, marginBottom: 16 }}>💉</Text>
        <Text style={{ fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8, textAlign: 'center' }}>Mon catalogue</Text>
        <Text style={{ fontSize: 14, color: Colors.textMuted, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
          En tant que vétérinaire, vous gérez vos produits depuis votre catalogue.
        </Text>
        <TouchableOpacity
          style={{ backgroundColor: '#0f766e', borderRadius: 12, paddingVertical: 14, paddingHorizontal: 28 }}
          onPress={() => router.push('/mon-catalogue' as any)}
        >
          <Text style={{ color: '#fff', fontSize: 15, fontWeight: '700' }}>📋 Ouvrir mon catalogue</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const headerTitle = isAcheteur ? 'Publier un besoin' : 'Publier une annonce';
  const headerSub = isAcheteur
    ? 'Dites ce que vous cherchez, les vendeurs vous répondent'
    : 'Partagez votre offre avec tout le Sénégal';

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <Text style={styles.headerSub}>{headerSub}</Text>
      </View>

      {isAcheteur ? <BesoinForm /> : <AnnounceForm />}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  header: { backgroundColor: Colors.primary, paddingTop: 56, paddingHorizontal: 20, paddingBottom: 16 },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#fff' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.75)', marginTop: 2 },
  scroll: { flex: 1, backgroundColor: Colors.background },
  label: { fontSize: 13, fontWeight: '700', color: Colors.text, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 },
  productGrid: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  productCard: {
    flex: 1, alignItems: 'center', backgroundColor: '#fff', borderRadius: 12,
    padding: 12, borderWidth: 2, borderColor: Colors.border,
  },
  productCardActive: { borderColor: Colors.primary, backgroundColor: Colors.primaryLight },
  productLabel: { fontSize: 12, fontWeight: '600', color: Colors.textLight, marginTop: 4 },
  productLabelActive: { color: Colors.primaryDark },
  photosGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  photoThumb: { width: 80, height: 80, borderRadius: 10, overflow: 'hidden', position: 'relative' },
  thumbImg: { width: '100%', height: '100%' },
  removeBtn: {
    position: 'absolute', top: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10,
    width: 20, height: 20, justifyContent: 'center', alignItems: 'center',
  },
  removeBtnText: { color: '#fff', fontSize: 10, fontWeight: '700' },
  addPhotoBtn: {
    width: 80, height: 80, borderRadius: 10,
    borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed',
    backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center',
  },
  addPhotoIcon: { fontSize: 24 },
  addPhotoText: { fontSize: 11, color: Colors.textLight, marginTop: 2 },
  row: { flexDirection: 'row' },
  input: {
    borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 15, color: Colors.text,
    backgroundColor: '#fff', marginBottom: 16,
  },
  textarea: { minHeight: 100 },
  pill: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: '#fff',
  },
  pillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  pillText: { fontSize: 13, color: Colors.textLight, fontWeight: '500' },
  pillTextActive: { color: '#fff', fontWeight: '700' },
  btn: {
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 8,
  },
  btnDisabled: { opacity: 0.6 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cartonHint: { fontSize: 11, color: Colors.primary, fontWeight: '600', marginTop: -10, marginBottom: 12 },
  cartonInfo: {
    backgroundColor: '#fef9ec', borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
    marginBottom: 16, borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  cartonInfoText: { fontSize: 13, color: '#92400e', fontWeight: '500' },
  besoinBanner: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: '#e0f2fe', borderRadius: 12, padding: 14,
    marginBottom: 20, borderLeftWidth: 3, borderLeftColor: '#0284c7',
  },
  besoinBannerText: { flex: 1, fontSize: 13, color: '#0c4a6e', fontWeight: '500', lineHeight: 19 },
});
