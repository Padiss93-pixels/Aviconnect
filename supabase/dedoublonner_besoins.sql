-- ============================================================================
-- AviConnect — Dédoublonnage des besoins
--
-- Constat (juillet 2026) : 4 lignes strictement identiques dans `besoins`,
-- toutes du même acheteur (poulet, 200 unités, même région). Sur la page
-- d'accueil, la même demande apparaissait donc quatre fois.
--
-- Ces doublons existaient déjà. Ils étaient masqués par le filtre anti-doublon
-- des données de démonstration, qui écartait les besoins dont l'id coïncidait
-- avec celui d'une démo (1, 2 et 3). Retirer les démos les a révélés, pas créés.
--
-- Ce script garde la ligne la plus récente de chaque groupe identique et
-- supprime les autres.
--
-- À exécuter dans : Dashboard Supabase → SQL Editor → Run
-- Lancez la section 1, lisez le résultat, puis la section 2.
-- ============================================================================

-- ── 1. Ce qui sera supprimé ─────────────────────────────────────────────────
-- Deux besoins sont considérés comme doublons s'ils ont le même acheteur, le
-- même produit, la même quantité, le même prix maximum et la même région.
-- `rang = 1` est la ligne conservée (la plus récente) ; tout le reste part.
with classement as (
  select
    id, acheteur_nom, produit, qte, prix_max, region, created_at,
    row_number() over (
      partition by acheteur_id, produit, qte, prix_max, region
      order by created_at desc, id desc
    ) as rang
  from public.besoins
)
select
  id, acheteur_nom, produit, qte, prix_max, region, created_at,
  case when rang = 1 then 'CONSERVÉ' else 'SUPPRIMÉ' end as sort
from classement
order by acheteur_nom, produit, qte, rang;

-- ── 2. Suppression ──────────────────────────────────────────────────────────
-- SUPPRESSION DÉFINITIVE. À ne lancer qu'après avoir lu la section 1.
delete from public.besoins
where id in (
  select id from (
    select
      id,
      row_number() over (
        partition by acheteur_id, produit, qte, prix_max, region
        order by created_at desc, id desc
      ) as rang
    from public.besoins
  ) t
  where t.rang > 1
);

-- ── 3. Vérification ────────────────────────────────────────────────────────
-- Doit renvoyer 0 ligne : plus aucun groupe identique.
select acheteur_id, produit, qte, prix_max, region, count(*) as occurrences
from public.besoins
group by acheteur_id, produit, qte, prix_max, region
having count(*) > 1;

-- État final de la table.
select id, acheteur_nom, produit, qte, prix_max, region, created_at
from public.besoins
order by created_at desc;
