import { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Switch, Alert, Platform, TextInput, ActivityIndicator, Image,
} from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  BadgeCheck, Bell, BookOpen, Camera, ChevronRight, ClipboardList,
  Cookie, Eye, Factory, FileText, Flame, Handshake, Landmark, LifeBuoy, LogOut, MapPin,
  Megaphone, Package, Pencil, Phone, Scale, ShieldCheck, ShieldOff, Stethoscope, Trash2,
  TrendingUp, UserRound, Users, Warehouse, X, Zap,
} from 'lucide-react-native';
import { Colors, Fonts, Radius, Shadows } from '@/constants/theme';
import { useAuthContext } from '@/hooks/AuthContext';
import { REGIONS, PRODUCT_EMOJIS } from '@/constants/mockData';
import { useAnnonces } from '@/hooks/AnnoncesContext';
import { useRewards, getLevel } from '@/hooks/RewardsContext';

const ROLE_LABELS: Record<string, string> = {
  eleveur: 'Éleveur',
  acheteur: 'Acheteur',
  couvoir: 'Couvoir',
  admin: 'Administrateur',
  veterinaire: 'Vétérinaire',
};

const LEGAL_LINKS = [
  { label: 'Conditions d\'utilisation',       path: '/conditions',       Icon: FileText },
  { label: 'Politique de confidentialité',    path: '/confidentialite',  Icon: ShieldCheck },
  { label: 'Mentions légales',                path: '/mentions-legales', Icon: Landmark },
  { label: 'Mes droits (Loi n°2008-12)',      path: '/mes-droits',       Icon: Scale },
  { label: 'Accord de traitement des données', path: '/dpa',             Icon: Handshake },
  { label: 'Politique de cookies',            path: '/cookies',          Icon: Cookie },
];

const CERT_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  pending:   { label: 'Certification en attente', bg: 'rgba(201,154,70,0.22)', fg: '#E8C078' },
  certified: { label: 'Certifié',                 bg: 'rgba(201,154,70,0.22)', fg: '#E8C078' },
  rejected:  { label: 'Certification refusée',    bg: 'rgba(196,67,45,0.25)',  fg: '#F0A090' },
};

export default function ProfilScreen() {
  const { user, updateProfile, signOut, isAdmin, deleteUser } = useAuthContext();
  const { userLots, deleteAnnonce, deleteAnnoncesByAuthor } = useAnnonces();
  const { data: rewards } = useRewards();
  const mesAnnonces = user
    ? userLots.filter((l) => l.eleveur === `${user.prenom} ${user.nom}`)
    : [];
  const [notifs, setNotifs] = useState(true);
  const [visible, setVisible] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  // Champs modifiables
  const [prenom, setPrenom] = useState(user?.prenom || '');
  const [nom, setNom] = useState(user?.nom || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [ferme, setFerme] = useState(user?.ferme || '');
  const [region, setRegion] = useState(user?.region || 'Dakar');
  const [error, setError] = useState('');

  const handleChangePhoto = async () => {
    if (Platform.OS === 'web') {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.onchange = async (e: any) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingPhoto(true);
        const reader = new FileReader();
        reader.onload = async (ev) => {
          const photoUri = ev.target?.result as string;
          const updated = { ...user!, photo: photoUri };
          await updateProfile(updated);
          setUploadingPhoto(false);
        };
        reader.readAsDataURL(file);
      };
      input.click();
    } else {
      try {
        const ImagePicker = await import('expo-image-picker');
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          Alert.alert('Permission refusée', 'Autorisez l\'accès à la galerie dans les paramètres.');
          return;
        }
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });
        if (!result.canceled && result.assets[0]) {
          setUploadingPhoto(true);
          const updated = { ...user!, photo: result.assets[0].uri };
          await updateProfile(updated);
          setUploadingPhoto(false);
        }
      } catch {
        Alert.alert('Erreur', 'Impossible d\'accéder à la galerie.');
      }
    }
  };

  if (!user) {
    return (
      <View style={styles.authWall}>
        <View style={styles.authIconBox}>
          <UserRound size={30} color={Colors.primaryDark} strokeWidth={1.6} />
        </View>
        <Text style={styles.authTitle}>Votre espace{'\n'}personnel</Text>
        <Text style={styles.authSub}>
          Connectez-vous pour gérer votre profil, vos annonces et vos commandes.
        </Text>
        <TouchableOpacity style={styles.authBtn} onPress={() => router.push('/(auth)/login')} activeOpacity={0.88}>
          <Text style={styles.authBtnText}>Se connecter</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => router.push('/(auth)/register')} hitSlop={8}>
          <Text style={styles.authLink}>Créer un compte</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const initials = `${(prenom || user.prenom)[0]}${(nom || user.nom)[0]}`.toUpperCase();
  const certStatus = user.role === 'couvoir' ? user.couvoirStatus
    : user.role === 'veterinaire' ? user.vetStatus
    : undefined;
  const cert = certStatus ? CERT_LABELS[certStatus] : undefined;

  const handleStartEdit = () => {
    setPrenom(user.prenom);
    setNom(user.nom);
    setPhone(user.phone);
    setFerme(user.ferme || '');
    setRegion(user.region);
    setError('');
    setEditing(true);
  };

  const handleSave = async () => {
    if (!prenom.trim() || !nom.trim()) {
      setError('Le prénom et le nom sont obligatoires');
      return;
    }
    const digits = phone.replace(/\D/g, '');
    if (digits.length > 0 && digits.length < 9) {
      setError('Numéro de téléphone invalide (9 chiffres minimum)');
      return;
    }
    setError('');
    setSaving(true);
    const updated = { ...user, prenom, nom, phone: digits || phone, ferme, region };
    const result = await updateProfile(updated);
    if (result.error) {
      setError('Impossible d\'enregistrer le profil. Vérifie ta connexion.');
      setSaving(false);
      return;
    }
    setSaving(false);
    setEditing(false);
    if (Platform.OS === 'web') window.alert('✅ Profil mis à jour avec succès !');
    else Alert.alert('✅ Profil mis à jour !');
  };

  const handleCancel = () => {
    setEditing(false);
    setError('');
  };

  const handleSignOut = () => {
    if (Platform.OS === 'web') {
      if (window.confirm('Voulez-vous vous déconnecter ?')) {
        signOut().then(() => router.replace('/(tabs)'));
      }
      return;
    }
    Alert.alert('Déconnexion', 'Êtes-vous sûr ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnecter', style: 'destructive', onPress: () => signOut().then(() => router.replace('/(tabs)')) },
    ]);
  };

  // Suppression définitive du compte (exigence Apple 5.1.1 · Loi n°2008-12)
  const doDeleteAccount = async () => {
    await deleteAnnoncesByAuthor(user!.id);
    await deleteUser(user!.id);
    router.replace('/(tabs)');
  };

  const handleDeleteAccount = () => {
    const warning =
      'Cette action est irréversible. Votre profil, vos annonces, vos notifications et votre mot de passe seront définitivement supprimés.';
    if (Platform.OS === 'web') {
      if (window.confirm(`Supprimer votre compte ?\n\n${warning}`) &&
          window.confirm('Dernière confirmation : supprimer définitivement votre compte AviConnect ?')) {
        doDeleteAccount();
      }
      return;
    }
    Alert.alert('Supprimer votre compte ?', warning, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Continuer', style: 'destructive',
        onPress: () => Alert.alert('Dernière confirmation', 'Supprimer définitivement votre compte AviConnect ?', [
          { text: 'Annuler', style: 'cancel' },
          { text: 'Supprimer définitivement', style: 'destructive', onPress: doDeleteAccount },
        ]),
      },
    ]);
  };

  const handleDeleteAnnonce = (id: number) => {
    if (Platform.OS === 'web') {
      if (window.confirm('Supprimer cette annonce ?')) deleteAnnonce(id);
    } else {
      Alert.alert('Supprimer ?', 'Cette annonce sera retirée du marché.', [
        { text: 'Annuler', style: 'cancel' },
        { text: 'Supprimer', style: 'destructive', onPress: () => deleteAnnonce(id) },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>

        {/* Titre éditorial */}
        <View style={styles.pageHeader}>
          <Text style={styles.eyebrow}>Mon espace</Text>
          <Text style={styles.pageTitle}>Mon compte</Text>
        </View>

        {/* Carte héro */}
        <View style={styles.heroCard}>
          <LinearGradient
            colors={[Colors.ink, Colors.primaryDark]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.heroDeco1} />
          <View style={styles.heroDeco2} />

          <View style={styles.heroTop}>
            <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangePhoto} activeOpacity={0.85}>
              {user.photo ? (
                <Image source={{ uri: user.photo }} style={styles.avatarImg} />
              ) : (
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>{initials}</Text>
                </View>
              )}
              <View style={styles.avatarOverlay}>
                {uploadingPhoto
                  ? <ActivityIndicator color={Colors.ink} size="small" />
                  : <Camera size={12} color={Colors.ink} strokeWidth={2.1} />
                }
              </View>
            </TouchableOpacity>

            <View style={styles.heroInfo}>
              <Text style={styles.heroName} numberOfLines={2}>{user.prenom} {user.nom}</Text>
              <View style={styles.chipRow}>
                <View style={styles.roleChip}>
                  <Text style={styles.roleChipText}>{ROLE_LABELS[user.role] ?? user.role}</Text>
                </View>
                {user.verified && (
                  <View style={styles.verifiedChip}>
                    <BadgeCheck size={11} color="#9FD8B4" strokeWidth={2.2} />
                    <Text style={styles.verifiedChipText}>Vérifié</Text>
                  </View>
                )}
              </View>
              {cert && (
                <View style={[styles.certChip, { backgroundColor: cert.bg }]}>
                  <ShieldCheck size={11} color={cert.fg} strokeWidth={2} />
                  <Text style={[styles.certChipText, { color: cert.fg }]}>{cert.label}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.heroDetails}>
            {user.phone ? (
              <View style={styles.heroDetailRow}>
                <Phone size={13} color={Colors.textOnDarkMuted} strokeWidth={1.7} />
                <Text style={styles.heroDetailText}>+221 {user.phone}</Text>
              </View>
            ) : null}
            {user.ferme ? (
              <View style={styles.heroDetailRow}>
                <Warehouse size={13} color={Colors.textOnDarkMuted} strokeWidth={1.7} />
                <Text style={styles.heroDetailText}>{user.ferme}</Text>
              </View>
            ) : null}
            <View style={styles.heroDetailRow}>
              <MapPin size={13} color={Colors.textOnDarkMuted} strokeWidth={1.7} />
              <Text style={styles.heroDetailText}>{user.region}</Text>
            </View>
          </View>

          {!editing ? (
            <TouchableOpacity style={styles.editBtn} onPress={handleStartEdit} activeOpacity={0.88}>
              <Pencil size={13} color={Colors.ink} strokeWidth={2} />
              <Text style={styles.editBtnText}>Modifier le profil</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity style={styles.cancelHeroBtn} onPress={handleCancel} activeOpacity={0.88}>
              <X size={13} color={Colors.textOnDark} strokeWidth={2.2} />
              <Text style={styles.cancelHeroBtnText}>Annuler la modification</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Formulaire de modification */}
        {editing && (
          <View style={styles.editCard}>
            <Text style={styles.editCardTitle}>Modifier mon profil</Text>

            <View style={styles.editRow}>
              <View style={{ flex: 1, marginRight: 10 }}>
                <Text style={styles.fieldLabel}>Prénom *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={prenom}
                  onChangeText={setPrenom}
                  placeholder="Prénom"
                  placeholderTextColor={Colors.textPlaceholder}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.fieldLabel}>Nom *</Text>
                <TextInput
                  style={styles.fieldInput}
                  value={nom}
                  onChangeText={setNom}
                  placeholder="Nom"
                  placeholderTextColor={Colors.textPlaceholder}
                />
              </View>
            </View>

            <Text style={styles.fieldLabel}>Numéro sénégalais</Text>
            <View style={styles.phoneRow}>
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>🇸🇳 +221</Text>
              </View>
              <TextInput
                style={[styles.fieldInput, { flex: 1 }]}
                value={phone}
                onChangeText={setPhone}
                placeholder="77 123 45 67"
                placeholderTextColor={Colors.textPlaceholder}
                keyboardType="phone-pad"
                maxLength={12}
              />
            </View>

            {user.role !== 'acheteur' && (
              <>
                <Text style={styles.fieldLabel}>
                  {user.role === 'couvoir' ? 'Nom du couvoir' : user.role === 'veterinaire' ? 'Nom de la clinique' : 'Nom de la ferme'}
                </Text>
                <TextInput
                  style={styles.fieldInput}
                  value={ferme}
                  onChangeText={setFerme}
                  placeholder="Ferme Diallo"
                  placeholderTextColor={Colors.textPlaceholder}
                />
              </>
            )}

            <Text style={styles.fieldLabel}>Région</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.regionScroll}>
              {REGIONS.filter((r) => r !== 'Toutes').map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[styles.regionPill, region === r && styles.regionPillActive]}
                  onPress={() => setRegion(r)}
                >
                  <Text style={[styles.regionText, region === r && styles.regionTextActive]}>{r}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
              onPress={handleSave}
              disabled={saving}
              activeOpacity={0.88}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.saveBtnText}>Enregistrer les modifications</Text>
              }
            </TouchableOpacity>
          </View>
        )}

        {/* Abonnement Partenaire (couvoirs + vétérinaires) */}
        {(user.role === 'couvoir' || user.role === 'veterinaire') && (
          <TouchableOpacity
            style={styles.boostProCard}
            onPress={() => router.push('/abonnement' as any)}
            activeOpacity={0.88}
          >
            <View style={styles.boostProIconBox}>
              <Text style={{ fontSize: 20 }}>👑</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.boostProTitle}>Abonnement Partenaire</Text>
              <Text style={styles.boostProSub}>Soyez mis en avant sur la page d'accueil · 25 000 F/mois</Text>
            </View>
            <ChevronRight size={17} color={Colors.gold} strokeWidth={1.8} />
          </TouchableOpacity>
        )}

        {/* Récompenses — série, niveau, badges */}
        <TouchableOpacity style={styles.rewardsCard} onPress={() => router.push('/recompenses' as any)} activeOpacity={0.88}>
          <View style={styles.rewardsFlameBox}>
            <Flame size={20} color={Colors.accent} strokeWidth={1.8} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.rewardsTitle}>
              {rewards.streak > 1 ? `Série de ${rewards.streak} jours` : 'Mes récompenses'}
            </Text>
            <Text style={styles.rewardsSub}>
              {getLevel(rewards.xp).level.emoji} {getLevel(rewards.xp).level.name} · {rewards.xp.toLocaleString()} XP · {rewards.badges.length} badge{rewards.badges.length > 1 ? 's' : ''}
            </Text>
          </View>
          <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
        </TouchableOpacity>

        {/* Stats */}
        <View style={styles.statsRow}>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/mes-annonces' as any)} activeOpacity={0.85}>
            <Text style={styles.statValue}>{mesAnnonces.length}</Text>
            <Text style={styles.statLabel}>Annonces</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCard} onPress={() => router.push('/transactions' as any)} activeOpacity={0.85}>
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Transactions</Text>
          </TouchableOpacity>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>—</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
        </View>

        {/* Mes annonces */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Sur le marché</Text>
          <Text style={styles.sectionTitle}>Mes annonces ({mesAnnonces.length})</Text>
        </View>
        <View style={styles.card}>
          {mesAnnonces.length === 0 ? (
            <View style={styles.emptyAnnonces}>
              <Text style={styles.emptyAnnoncesText}>Vous n'avez pas encore publié d'annonce</Text>
              <TouchableOpacity
                style={styles.publishLink}
                onPress={() => router.push('/(tabs)/publier' as any)}
                activeOpacity={0.88}
              >
                <Text style={styles.publishLinkText}>+ Publier une annonce</Text>
              </TouchableOpacity>
            </View>
          ) : (
            mesAnnonces.map((a, i) => (
              <View key={a.id} style={[styles.annonceRow, i < mesAnnonces.length - 1 && styles.rowDivider]}>
                <View style={styles.annonceEmojiBox}>
                  <Text style={styles.annonceEmoji}>{PRODUCT_EMOJIS[a.produit]}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.annonceTitre} numberOfLines={1}>{a.titre}</Text>
                  <Text style={styles.annonceDetail}>
                    {a.qte.toLocaleString()} unités · {a.prix.toLocaleString()} F CFA · {a.region}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => handleDeleteAnnonce(a.id)}
                  hitSlop={8}
                >
                  <Trash2 size={16} color={Colors.error} strokeWidth={1.7} />
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

        {/* Paramètres */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Préférences</Text>
          <Text style={styles.sectionTitle}>Paramètres</Text>
        </View>
        <View style={styles.card}>
          <View style={[styles.linkRow, styles.rowDivider]}>
            <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
              <Bell size={17} color={Colors.primaryDark} strokeWidth={1.7} />
            </View>
            <Text style={styles.linkLabel}>Notifications push</Text>
            <Switch value={notifs} onValueChange={setNotifs} trackColor={{ true: Colors.primary }} />
          </View>
          <View style={styles.linkRow}>
            <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
              <Eye size={17} color={Colors.primaryDark} strokeWidth={1.7} />
            </View>
            <Text style={styles.linkLabel}>Profil visible</Text>
            <Switch value={visible} onValueChange={setVisible} trackColor={{ true: Colors.primary }} />
          </View>
        </View>

        {/* Admin */}
        {isAdmin && (
          <>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionEyebrow}>Espace réservé</Text>
              <Text style={styles.sectionTitle}>Administration</Text>
            </View>
            <View style={styles.card}>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/admin' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: Colors.accentLight }]}>
                  <Users size={17} color={Colors.accentDark} strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Gestion des utilisateurs</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/admin/pubs' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: Colors.accentLight }]}>
                  <Megaphone size={17} color={Colors.accentDark} strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Gérer les publicités</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/admin/couvoirs' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: '#f0fdf4' }]}>
                  <Factory size={17} color={Colors.primaryDark} strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Certification couvoirs</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/admin/veterinaires' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: '#ccfbf1' }]}>
                  <Stethoscope size={17} color="#0f766e" strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Certification vétérinaires</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/admin/boosts' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: '#FFFBF0' }]}>
                  <Zap size={17} color="#92600A" strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Boosts & abonnements</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/commandes' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: Colors.accentLight }]}>
                  <ClipboardList size={17} color={Colors.accentDark} strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Toutes les commandes</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/admin/analytics' as any)} activeOpacity={0.8}>
                <View style={[styles.linkIconBox, { backgroundColor: '#eff6ff' }]}>
                  <TrendingUp size={17} color="#1d4ed8" strokeWidth={1.7} />
                </View>
                <Text style={styles.linkLabel}>Statistiques d'audience</Text>
                <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Liens */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Raccourcis</Text>
          <Text style={styles.sectionTitle}>Mon activité</Text>
        </View>
        <View style={styles.card}>
          {user.role === 'veterinaire' && (
            <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/mon-catalogue' as any)} activeOpacity={0.8}>
              <View style={[styles.linkIconBox, { backgroundColor: Colors.accentLight }]}>
                <BookOpen size={17} color={Colors.accentDark} strokeWidth={1.7} />
              </View>
              <Text style={styles.linkLabel}>Mon catalogue</Text>
              <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
          )}
          <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/commandes' as any)} activeOpacity={0.8}>
            <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
              <Package size={17} color={Colors.primaryDark} strokeWidth={1.7} />
            </View>
            <Text style={styles.linkLabel}>Mes commandes</Text>
            <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.linkRow, styles.rowDivider]} onPress={() => router.push('/mes-blocages' as any)} activeOpacity={0.8}>
            <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
              <ShieldOff size={17} color={Colors.primaryDark} strokeWidth={1.7} />
            </View>
            <Text style={styles.linkLabel}>Utilisateurs bloqués</Text>
            <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkRow} onPress={() => router.push('/aide')} activeOpacity={0.8}>
            <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
              <LifeBuoy size={17} color={Colors.primaryDark} strokeWidth={1.7} />
            </View>
            <Text style={styles.linkLabel}>Aide et support</Text>
            <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
          </TouchableOpacity>
        </View>

        {/* Légal */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionEyebrow}>Transparence</Text>
          <Text style={styles.sectionTitle}>Légal</Text>
        </View>
        <View style={styles.card}>
          {LEGAL_LINKS.map(({ label, path, Icon }, i) => (
            <TouchableOpacity
              key={path}
              style={[styles.linkRow, i < LEGAL_LINKS.length - 1 && styles.rowDivider]}
              onPress={() => router.push(path as any)}
              activeOpacity={0.8}
            >
              <View style={[styles.linkIconBox, { backgroundColor: Colors.primaryTint }]}>
                <Icon size={17} color={Colors.primaryDark} strokeWidth={1.7} />
              </View>
              <Text style={styles.linkLabel}>{label}</Text>
              <ChevronRight size={17} color={Colors.textMuted} strokeWidth={1.8} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <LogOut size={16} color={Colors.error} strokeWidth={1.8} />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Suppression du compte (exigence Apple 5.1.1) */}
        <TouchableOpacity style={styles.deleteAccountBtn} onPress={handleDeleteAccount} activeOpacity={0.85}>
          <Trash2 size={15} color={Colors.error} strokeWidth={1.8} />
          <Text style={styles.deleteAccountText}>Supprimer mon compte</Text>
        </TouchableOpacity>
        <Text style={styles.deleteAccountHint}>
          Suppression définitive de votre profil, de vos annonces et de vos données, conformément à notre politique de confidentialité.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },

  pageHeader: {
    paddingTop: Platform.OS === 'ios' ? 66 : 52,
    paddingHorizontal: 22, paddingBottom: 18,
  },
  eyebrow: {
    fontSize: 11, fontFamily: Fonts.bodyBold, color: Colors.accent,
    textTransform: 'uppercase', letterSpacing: 1.6, marginBottom: 8,
  },
  pageTitle: { fontSize: 27, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.3 },

  heroCard: {
    marginHorizontal: 18, borderRadius: Radius.xl, overflow: 'hidden',
    paddingHorizontal: 22, paddingVertical: 24,
  },
  heroDeco1: { position: 'absolute', width: 190, height: 190, borderRadius: 95, backgroundColor: 'rgba(247,242,233,0.05)', top: -60, right: -45 },
  heroDeco2: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(201,154,70,0.12)', bottom: -40, left: 10 },
  heroTop: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrapper: { width: 74, height: 74 },
  avatar: {
    width: 74, height: 74, borderRadius: 26,
    backgroundColor: 'rgba(247,242,233,0.14)',
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: 'rgba(247,242,233,0.22)',
  },
  avatarImg: { width: 74, height: 74, borderRadius: 26 },
  avatarText: { fontSize: 26, fontFamily: Fonts.display, color: Colors.textOnDark },
  avatarOverlay: {
    position: 'absolute', bottom: -4, right: -4,
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: Colors.textOnDark,
    justifyContent: 'center', alignItems: 'center',
  },
  heroInfo: { flex: 1 },
  heroName: { fontSize: 21, fontFamily: Fonts.display, color: Colors.textOnDark, letterSpacing: -0.2, marginBottom: 8 },
  chipRow: { flexDirection: 'row', alignItems: 'center', gap: 7, flexWrap: 'wrap' },
  roleChip: {
    backgroundColor: 'rgba(247,242,233,0.14)', borderRadius: Radius.pill,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  roleChipText: { fontSize: 10.5, fontFamily: Fonts.bodyBold, color: Colors.textOnDark, letterSpacing: 0.7, textTransform: 'uppercase' },
  verifiedChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(39,150,83,0.28)', borderRadius: Radius.pill,
    paddingHorizontal: 9, paddingVertical: 4,
  },
  verifiedChipText: { fontSize: 10.5, fontFamily: Fonts.bodyBold, color: '#9FD8B4' },
  certChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4, alignSelf: 'flex-start',
    borderRadius: Radius.pill, paddingHorizontal: 9, paddingVertical: 4, marginTop: 7,
  },
  certChipText: { fontSize: 10.5, fontFamily: Fonts.bodyBold },

  heroDetails: { marginTop: 18, gap: 7 },
  heroDetailRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  heroDetailText: { fontSize: 13, fontFamily: Fonts.bodyMedium, color: Colors.textOnDarkMuted },

  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.textOnDark, borderRadius: Radius.pill,
    paddingVertical: 11, marginTop: 20,
  },
  editBtnText: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.ink },
  cancelHeroBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: 'rgba(247,242,233,0.12)', borderRadius: Radius.pill,
    borderWidth: 1, borderColor: 'rgba(247,242,233,0.28)',
    paddingVertical: 11, marginTop: 20,
  },
  cancelHeroBtnText: { fontSize: 13, fontFamily: Fonts.bodyBold, color: Colors.textOnDark },

  editCard: {
    backgroundColor: Colors.surface, marginHorizontal: 18, marginTop: 14,
    borderRadius: Radius.lg, padding: 20,
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.card as object),
  },
  editCardTitle: { fontSize: 17, fontFamily: Fonts.display, color: Colors.text, marginBottom: 10, letterSpacing: -0.2 },
  editRow: { flexDirection: 'row', marginBottom: 4 },
  fieldLabel: { fontSize: 12.5, fontFamily: Fonts.bodySemiBold, color: Colors.textSecondary, marginBottom: 6, marginTop: 12 },
  fieldInput: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: Radius.sm,
    paddingHorizontal: 14, paddingVertical: 11, fontSize: 14.5,
    fontFamily: Fonts.body, color: Colors.text, backgroundColor: Colors.background,
    ...(Platform.OS === 'web' ? { outlineStyle: 'none' } as any : {}),
  },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  prefix: {
    backgroundColor: Colors.primaryTint, borderRadius: Radius.sm,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  prefixText: { fontSize: 13.5, color: Colors.primaryDark, fontFamily: Fonts.bodyBold },
  regionScroll: { marginTop: 2, marginBottom: 4 },
  regionPill: {
    paddingHorizontal: 13, paddingVertical: 7, borderRadius: Radius.pill,
    borderWidth: 1, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.surface,
  },
  regionPillActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  regionText: { fontSize: 12, color: Colors.textTertiary, fontFamily: Fonts.bodyMedium },
  regionTextActive: { color: '#fff', fontFamily: Fonts.bodyBold },
  errorText: { color: Colors.error, fontSize: 13, fontFamily: Fonts.bodyMedium, marginTop: 10 },
  saveBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingVertical: 14, alignItems: 'center', marginTop: 18,
    ...(Shadows.button as object),
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { color: '#fff', fontSize: 14.5, fontFamily: Fonts.bodyBold },

  boostProCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: '#FFFBF0', marginHorizontal: 18, marginTop: 14,
    borderRadius: Radius.lg, padding: 16,
    borderWidth: 1.5, borderColor: Colors.gold + '66',
  },
  boostProIconBox: {
    width: 44, height: 44, borderRadius: 14,
    backgroundColor: Colors.gold + '22',
    justifyContent: 'center', alignItems: 'center',
  },
  boostProTitle: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text, marginBottom: 3 },
  boostProSub: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, lineHeight: 16 },

  rewardsCard: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    backgroundColor: Colors.surface, marginHorizontal: 18, marginTop: 14,
    borderRadius: Radius.lg, paddingHorizontal: 16, paddingVertical: 14,
    borderWidth: 1, borderColor: 'rgba(201,154,70,0.3)',
    ...(Shadows.soft as object),
  },
  rewardsFlameBox: {
    width: 40, height: 40, borderRadius: 14,
    backgroundColor: 'rgba(193,102,59,0.1)',
    justifyContent: 'center', alignItems: 'center',
  },
  rewardsTitle: { fontSize: 14.5, fontFamily: Fonts.bodyBold, color: Colors.text },
  rewardsSub: { fontSize: 12, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 2 },

  statsRow: { flexDirection: 'row', marginHorizontal: 18, gap: 10, marginTop: 14 },
  statCard: {
    flex: 1, backgroundColor: Colors.surface, borderRadius: Radius.lg,
    paddingVertical: 16, alignItems: 'center',
    borderWidth: 1, borderColor: Colors.borderSoft,
    ...(Shadows.soft as object),
  },
  statValue: { fontSize: 22, fontFamily: Fonts.display, color: Colors.primary, letterSpacing: -0.4 },
  statLabel: { fontSize: 11, fontFamily: Fonts.bodyMedium, color: Colors.textMuted, marginTop: 4 },

  sectionHeader: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 12 },
  sectionEyebrow: {
    fontSize: 10.5, fontFamily: Fonts.bodyBold, color: Colors.textMuted,
    textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 4,
  },
  sectionTitle: { fontSize: 19, fontFamily: Fonts.display, color: Colors.text, letterSpacing: -0.2 },

  card: {
    backgroundColor: Colors.surface, marginHorizontal: 18, borderRadius: Radius.lg,
    borderWidth: 1, borderColor: Colors.borderSoft, overflow: 'hidden',
    ...(Shadows.soft as object),
  },
  rowDivider: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Colors.border },

  linkRow: {
    flexDirection: 'row', alignItems: 'center', gap: 13,
    paddingHorizontal: 16, paddingVertical: 13,
  },
  linkIconBox: {
    width: 36, height: 36, borderRadius: 12,
    justifyContent: 'center', alignItems: 'center',
  },
  linkLabel: { flex: 1, fontSize: 14.5, fontFamily: Fonts.bodyMedium, color: Colors.text },

  emptyAnnonces: { padding: 22, alignItems: 'center' },
  emptyAnnoncesText: { fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted, marginBottom: 14 },
  publishLink: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 20, paddingVertical: 10,
    ...(Shadows.button as object),
  },
  publishLinkText: { color: '#fff', fontSize: 13, fontFamily: Fonts.bodyBold },
  annonceRow: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 16, paddingVertical: 12,
  },
  annonceEmojiBox: {
    width: 42, height: 42, borderRadius: 14, backgroundColor: Colors.surfaceSecondary,
    justifyContent: 'center', alignItems: 'center',
  },
  annonceEmoji: { fontSize: 21 },
  annonceTitre: { fontSize: 14, fontFamily: Fonts.bodyBold, color: Colors.text },
  annonceDetail: { fontSize: 12, fontFamily: Fonts.body, color: Colors.textMuted, marginTop: 2 },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 12, backgroundColor: 'rgba(196,67,45,0.08)',
    justifyContent: 'center', alignItems: 'center',
  },

  signOutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 28,
    borderWidth: 1, borderColor: 'rgba(196,67,45,0.35)', borderRadius: Radius.pill,
    paddingVertical: 14, backgroundColor: 'rgba(196,67,45,0.04)',
  },
  signOutText: { color: Colors.error, fontSize: 14.5, fontFamily: Fonts.bodyBold },

  deleteAccountBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    marginHorizontal: 18, marginTop: 12,
    borderRadius: Radius.pill, paddingVertical: 14,
    backgroundColor: 'rgba(196,67,45,0.10)',
  },
  deleteAccountText: { color: Colors.error, fontSize: 14.5, fontFamily: Fonts.bodyBold },
  deleteAccountHint: {
    marginHorizontal: 34, marginTop: 10, textAlign: 'center',
    fontSize: 11.5, fontFamily: Fonts.body, color: Colors.textMuted, lineHeight: 16,
  },

  authWall: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 36, backgroundColor: Colors.background },
  authIconBox: {
    width: 72, height: 72, borderRadius: 24, backgroundColor: Colors.primaryTint,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  authTitle: {
    fontSize: 23, fontFamily: Fonts.display, color: Colors.text,
    textAlign: 'center', lineHeight: 30, letterSpacing: -0.3,
  },
  authSub: {
    fontSize: 13.5, fontFamily: Fonts.body, color: Colors.textMuted,
    textAlign: 'center', marginTop: 10, lineHeight: 20, marginBottom: 26,
  },
  authBtn: {
    backgroundColor: Colors.primary, borderRadius: Radius.pill,
    paddingHorizontal: 34, paddingVertical: 14, alignSelf: 'stretch', alignItems: 'center',
    ...(Shadows.button as object),
  },
  authBtnText: { color: Colors.textOnDark, fontSize: 15, fontFamily: Fonts.bodyBold },
  authLink: { marginTop: 16, fontSize: 13.5, fontFamily: Fonts.bodyBold, color: Colors.primary },
});
