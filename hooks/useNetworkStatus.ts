import { useState, useEffect } from 'react';
import * as Network from 'expo-network';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const check = async () => {
      const state = await Network.getNetworkStateAsync();
      if (!cancelled) setIsOnline(!!state.isConnected && !!state.isInternetReachable);
    };

    check();
    const interval = setInterval(check, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  return isOnline;
}
