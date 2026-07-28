import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';

// Gabarit HTML de la version web (aviconnect.sn).
// Ce fichier n'est utilisé que par l'export web : il ne touche pas aux apps natives.
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />

        {/* Le titre et la description sont posés par <Head> dans app/_layout.tsx :
            les répéter ici créerait deux balises <title> et la première, vide,
            l'emporterait pour les moteurs de recherche et les aperçus de lien. */}
        <meta name="theme-color" content="#1E7A45" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="canonical" href="https://aviconnect.sn/" />

        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="AviConnect" />
        <meta property="og:title" content="AviConnect — La marketplace avicole du Sénégal" />
        <meta
          property="og:description"
          content="Achetez et vendez poulets, poussins, œufs et aliments partout au Sénégal."
        />
        <meta property="og:url" content="https://aviconnect.sn/" />
        <meta property="og:locale" content="fr_SN" />
        <meta name="twitter:card" content="summary_large_image" />

        {/* Empêche le scroll du body : la mise en page gère son propre défilement */}
        <ScrollViewStyleReset />
      </head>
      <body>{children}</body>
    </html>
  );
}
