import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = '@aviconnect_orders';

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

async function readStorage(): Promise<Order[]> {
  try {
    const raw = Platform.OS === 'web'
      ? localStorage.getItem(KEY)
      : await AsyncStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

async function writeStorage(orders: Order[]): Promise<void> {
  try {
    const json = JSON.stringify(orders);
    if (Platform.OS === 'web') localStorage.setItem(KEY, json);
    else await AsyncStorage.setItem(KEY, json);
  } catch {}
}

type OrdersContextType = {
  orders: Order[];
  addOrder: (order: Order) => Promise<void>;
  updateOrderStatus: (id: number, status: OrderStatus) => Promise<void>;
  getOrdersForVendeur: (userId: string) => Order[];
  getOrdersForAcheteur: (userId: string) => Order[];
};

const OrdersContext = createContext<OrdersContextType>({
  orders: [],
  addOrder: async () => {},
  updateOrderStatus: async () => {},
  getOrdersForVendeur: () => [],
  getOrdersForAcheteur: () => [],
});

export function OrdersProvider({ children }: { children: React.ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => { readStorage().then(setOrders); }, []);

  const addOrder = useCallback(async (order: Order) => {
    const updated = [order, ...orders];
    setOrders(updated);
    await writeStorage(updated);
  }, [orders]);

  const updateOrderStatus = useCallback(async (id: number, status: OrderStatus) => {
    const updated = orders.map((o) => o.id === id ? { ...o, status } : o);
    setOrders(updated);
    await writeStorage(updated);
  }, [orders]);

  // Filtre par ID en priorité (fiable), fallback sur nom si l'ID n'est pas stocké
  const getOrdersForVendeur = useCallback((userId: string) =>
    orders.filter((o) => o.vendeurId ? o.vendeurId === userId : o.vendeurNom === userId),
  [orders]);

  const getOrdersForAcheteur = useCallback((userId: string) =>
    orders.filter((o) => o.acheteurId ? o.acheteurId === userId : o.acheteurNom === userId),
  [orders]);

  return (
    <OrdersContext.Provider value={{ orders, addOrder, updateOrderStatus, getOrdersForVendeur, getOrdersForAcheteur }}>
      {children}
    </OrdersContext.Provider>
  );
}

export function useOrders() { return useContext(OrdersContext); }
