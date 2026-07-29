# AviConnect 🐔

Marketplace avicole sénégalaise — connecte éleveurs, couvoirs et acheteurs dans les 14 régions du Sénégal.

## Installation

### Prérequis
- Node.js 18+ : https://nodejs.org
- Expo CLI : `npm install -g expo-cli`
- EAS CLI (pour les builds) : `npm install -g eas-cli`

### Setup
```bash
cd aviconnect
npm install
npx expo start
```

Scannez le QR code avec l'app **Expo Go** sur votre téléphone.

## Démo

- **Numéro** : n'importe quel numéro à 9+ chiffres
- **Code OTP** : n'importe quel code à 5 chiffres
- **Admin** : numéro `000000000` + n'importe quel code OTP

## Structure

```
app/
  (auth)/          # Connexion, OTP, Inscription
  (tabs)/          # Accueil, Marchés, Publier, Messages, Profil
  lot/[id].tsx     # Détail annonce
  vendeur/[id].tsx # Profil public (éleveur, couvoir, acheteur)
  chat/[id].tsx    # Chat
  couvoirs/        # Liste couvoirs
constants/
  Colors.ts        # Palette couleurs
  mockData.ts      # Constantes filière (régions, produits) — plus aucune donnée de démo
hooks/
  AuthContext.tsx  # Contexte auth global
  useAuth.ts       # Helpers AsyncStorage
components/
  LotCard.tsx      # Carte annonce réutilisable
```

## Build pour les stores

### Android (APK de preview)
```bash
eas build --platform android --profile preview
```

### iOS (TestFlight)
```bash
eas build --platform ios --profile production
```

### Soumettre aux stores
```bash
# Google Play
eas submit --platform android

# App Store
eas submit --platform ios
```

## Couleurs

| Rôle | Hex |
|------|-----|
| Vert principal | `#15803d` |
| Vert foncé | `#166534` |
| Vert clair | `#dcfce7` |
| Background | `#f8f9f5` |
| Texte | `#1a2e1a` |
