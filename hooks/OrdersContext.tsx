import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from './AuthContext';
import { useAnnonces } from './AnnoncesContext';

export type OrderStatus = 'en_attente' | 'acceptee' | 'refusee' | 'payee';

export type Order = {
  id: number;
  lotId: number;
  lotTitre: string;
  lotProduit: string;
  vendeurNom: string;
  vendeurId?: string;
  acheteurNom: string;
  acheteurId?: string;
  acheteurPhone?: string;
  qte: number;
  prix: number;
  total: number;
  livraison: string;
  note: string;
  payMode: 'message' | 'carte';
  status: OrderStatus;
  date: string;
};

function rowToOrder(row: any): Order {
  return {
    id: row.id,
    lotId: row.lot_id,
    lotTitre: row.lot_titre,
    lotProduit: row.lot_produit,
    vendeurNom: row.vendeur_nom,
    vendeurId: row.vendeur_id ?? undefined,
    acheteurNom: row.acheteur_nom,
    acheteurId: row.acheteur_id ?? undefined,
    acheteurPhone: row.acheteur_phone ?? undefined,
    qte: row.qte,
    prix: row.prix,
    total: row.total,
    livraison: row.livraison,
    note: row.note,
    payMode: row.pay_mode,
    status: row.status,
    date: row.created_at,
  };
}

type OrdersContextType = {
  orders: Order[];
  addOrder: (order: Omit<Order, 'id' | 'date'>) => Promise<number | null>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  getOrdersForVendeur: (userId: string) => Order[];
  getOrdersForAcheteur: (userId: string) => Order[];
};

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  addOrder: async () => null,
  updateOrderStatus: async () => {},
  getOrdersForVendeur: () => [],
  getOrdersForAcheteur: () => [],
});

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthContext();
  const { adjustStock, sendNotification } = useAnnonces();
  const [orders, setOrders] = useState<Order[]>([]);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) { setOrders([]); return; }
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .or(`vendeur_id.eq.${user.id},acheteur_id.eq.${user.id}`)
      .order('created_at', { ascending: false });
    if (!error && data) setOrders(data.map(rowToOrder));
  }, [user?.id]);

  useEffect(() => {
    fetchOrders();
    if (!user?.id) return;
    // Temps réel : nouvelles commandes + mises à jour de statut
    const sub = supabase
      .channel(`orders-${user.id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, () => fetchOrders())
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        setOrders((prev) => prev.map((o) => o.id === payload.new.id ? rowToOrder(payload.new) : o));
      })
      .subscribe();
    return () => { supabase.removeChannel(sub); };
  }, [fetchOrders, user?.id]);

  const addOrder = useCallback(async (order: Omit<Order, 'id' | 'date'>): Promise<number | null> => {
    const { data, error } = await supabase.from('orders').insert({
      lot_id: order.lotId,
      lot_titre: order.lotTitre,
      lot_produit: order.lotProduit,
      vendeur_nom: order.vendeurNom,
      vendeur_id: order.vendeurId ?? null,
      acheteur_nom: order.acheteurNom,
      acheteur_id: order.acheteurId ?? null,
      acheteur_phone: order.acheteurPhone ?? null,
      qte: order.qte,
      prix: order.prix,
      total: order.total,
      livraison: order.livraison,
      note: order.note,
      pay_mode: order.payMode,
      status: order.status,
    }).select().single();
    if (!error && data) {
      const newOrder = rowToOrder(data);
      setOrders((prev) => [newOrder, ...prev]);
      return newOrder.id;
    }
    return null;
  }, []);

  const updateOrderStatus = useCallback(async (id: number, status: OrderStatus) => {
    await supabase.from('orders').update({ status }).eq('id', id);
    const order = orders.find((o) => o.id === id);
    setOrders((prev) => prev.map((o) => o.id === id ? { ...o, status } : o));

    if (status === 'acceptee' && order) {
      // Réduire le stock au moment de l'acceptation
      await adjustStock(order.lotId, -order.qte);
      // Notifier l'acheteur
      await sendNotification(
        'commande_acceptee',
        '✅ Commande acceptée !',
        `Votre commande de ${order.qte} unités de "${order.lotTitre}" a été acceptée par ${order.vendeurNom}.`,
        id,
        order.acheteurId,
      );
      // Marquer la notif nouvelle_commande comme lue
      await supabase.from('notifications').update({ read: true }).eq('order_id', id).eq('type', 'nouvelle_commande');
    }

    if (status === 'refusee' && order) {
      // Restaurer le stock si la commande est refusée
      await adjustStock(order.lotId, +order.qte);
      // Notifier l'acheteur
      await sendNotification(
        'commande_refusee',
        '❌ Commande refusée',
        `Votre commande de ${order.qte} unités de "${order.lotTitre}" a été refusée par ${order.vendeurNom}.`,
        id,
        order.acheteurId,
      );
      await supabase.from('notifications').update({ read: true }).eq('order_id', id).eq('type', 'nouvelle_commande');
    }
  }, [orders, adjustStock, sendNotification]);

  const getOrdersForVendeur = useCallback((userId: string) =>
    orders.filter((o) => o.vendeurId === userId),
  [orders]);

  const getOrdersForAcheteur = useCallback((userId: string) =>
    orders.filter((o) => o.acheteurId === userId),
  [orders]);

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrdersForVendeur, getOrdersForAcheteur }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() { return useContext(OrdersContext); }
