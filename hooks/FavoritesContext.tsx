import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';

type FavoritesContextType = {
  favoriteIds: Set<number>;
  toggleFavorite: (id: number) => void;
  favoriteCount: number;
};

const FavoritesContext = createContext<FavoritesContextType>({
  favoriteIds: new Set(),
  toggleFavorite: () => {},
  favoriteCount: 0,
});

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const [favoriteIds, setFavoriteIds] = useState<Set<number>>(new Set());

  // Charge les favoris depuis Supabase à la connexion
  useEffect(() => {
    if (!user?.id) { setFavoriteIds(new Set()); return; }
    supabase
      .from('profiles')
      .select('favorites')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.favorites) setFavoriteIds(new Set(data.favorites as number[]));
      });
  }, [user?.id]);

  const toggleFavorite = useCallback((id: number) => {
    if (!user?.id) return;
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      const arr = [...next];
      supabase.from('profiles').update({ favorites: arr }).eq('id', user.id).then(() => {});
      return next;
    });
  }, [user?.id]);

  return (
    <FavoritesContext.Provider value={{ favoriteIds, toggleFavorite, favoriteCount: favoriteIds.size }}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() { return useContext(FavoritesContext); }
