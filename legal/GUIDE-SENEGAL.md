# Guide des formalités au Sénégal — AviConnect

Démarches administratives pour exercer légalement l'activité de marketplace avicole au Sénégal. Les documents légaux (CGU, confidentialité, mentions légales) sont déjà rédigés dans ce dossier ; ce guide couvre le reste.

> ℹ️ Ce guide est informatif et ne remplace pas un conseil juridique. Pour la création de société, un passage au Guichet Unique de l'APIX règle presque tout en une fois.

---

## 1. Créer la structure juridique (APIX — Guichet Unique)

**Où :** APIX, Guichet Unique de création d'entreprise, Dakar (52-54 rue Mohamed V) — ou en ligne sur creationdentreprise.sn

**Choix de statut :**

| Statut | Coût approx. | Adapté si |
|---|---|---|
| **Entreprise individuelle** | ~25 000 FCFA | Démarrage seul, simple, rapide (recommandé pour commencer) |
| **SUARL** (SARL unipersonnelle) | ~65 000 FCFA + capital libre (min. symbolique possible) | Protéger son patrimoine personnel |
| **SARL** | idem SUARL | Plusieurs associés |

**Documents obtenus au Guichet Unique (en 24–72 h) :**
- **RCCM** — Registre du Commerce et du Crédit Mobilier (immatriculation commerciale)
- **NINEA** — Numéro d'Identification National des Entreprises et Associations (fiscal)

**Pièces à fournir :** copie CNI/passeport, casier judiciaire (ou déclaration sur l'honneur), 2 photos, justificatif d'adresse, statuts si société.

**Objet social suggéré :** « Exploitation d'une plateforme numérique de mise en relation entre acteurs de la filière avicole ; commerce électronique ; prestations de services numériques. »

➡️ Une fois le RCCM obtenu, **mettre à jour** les mentions légales (in-app et `mentions-legales.html`) : remplacer « en cours d'immatriculation » par le numéro RCCM et le NINEA.

---

## 2. Déclaration à la CDP (Commission des Données Personnelles) — OBLIGATOIRE

La Loi n°2008-12 impose une **déclaration préalable** de tout traitement de données personnelles (comptes utilisateurs, téléphones, annonces).

- **Où :** www.cdp.sn — formulaires de déclaration en ligne
- **Quoi déclarer :** traitement « gestion de comptes utilisateurs et mise en relation commerciale » ; catégories de données (identité, contact, activité) ; durées de conservation (30 jours après clôture, 5 ans pour les transactions) ; mesures de sécurité
- **Coût :** la déclaration est gratuite
- **Délai :** récépissé de déclaration — le conserver, c'est votre preuve de conformité
- La politique de confidentialité de ce dossier reprend déjà les mentions exigées (responsable de traitement, finalités, droits, contact)

> ⚠️ Sans récépissé CDP, le traitement de données est illégal au sens de la loi 2008-12 (sanctions pénales possibles). C'est LA formalité prioritaire avec le RCCM.

---

## 3. Fiscalité (après obtention du NINEA)

- **Régime :** en dessous de 50 M FCFA de CA annuel → **CGU (Contribution Globale Unique)**, régime simplifié tout-en-un. Au-delà : régime du réel (IS 30 % ou IR + TVA 18 %).
- **TVA :** les commissions/services numériques sont assujettis à 18 % au régime réel. Tant que l'app ne prélève pas de commission (simple mise en relation gratuite), l'exposition est minimale.
- **Où :** Centre des services fiscaux de rattachement (selon l'adresse du siège).

---

## 4. Secteur avicole — points d'attention

- La **mise en relation** n'exige pas d'agrément vétérinaire ou sanitaire : AviConnect ne vend pas d'animaux, ne les transporte pas et ne délivre pas de soins.
- Les CGU (§4) imposent déjà aux vendeurs le respect des normes sanitaires sénégalaises — c'est la bonne posture juridique : la responsabilité sanitaire reste chez l'éleveur/couvoir.
- Les **vétérinaires** inscrits doivent être inscrits à l'Ordre des Docteurs Vétérinaires du Sénégal ; demander le numéro d'inscription à l'Ordre lors de la certification est une bonne pratique de vérification.
- Partenariats utiles (non obligatoires) : Ministère de l'Élevage et des Productions animales, interprofession avicole (IPAS/CNA).

---

## 5. Protection de la marque (optionnel mais recommandé)

- **OAPI** (Organisation Africaine de la Propriété Intellectuelle) — dépôt de la marque « AviConnect » et du logo « Le Crieur » : protection dans les 17 États membres, ~400 000 FCFA pour 10 ans, via un mandataire agréé ou l'antenne nationale (ASPIT, Dakar).
- **Domaine :** enregistrer `aviconnect.sn` auprès d'un registrar accrédité NIC Sénégal (~15 000–25 000 FCFA/an) — nécessaire aussi pour héberger les documents légaux et les e-mails @aviconnect.sn.

---

## 6. Ordre recommandé des démarches

1. ✅ Documents légaux rédigés (ce dossier)
2. Réserver le domaine **aviconnect.sn** + créer les e-mails contact@/support@/partenaires@
3. Héberger le dossier `legal/` (voir GUIDE-STORES.md)
4. **APIX** : créer l'entreprise → RCCM + NINEA (comptez moins d'une semaine)
5. **CDP** : déclaration du traitement de données → récépissé
6. Mettre à jour les mentions légales avec RCCM/NINEA
7. Comptes développeurs Google Play + Apple, puis soumission (voir GUIDE-STORES.md)
8. Plus tard : dépôt de marque OAPI, régime fiscal selon le CA
