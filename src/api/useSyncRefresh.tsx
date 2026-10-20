import React, { useState } from 'react';
import { RefreshControl } from 'react-native';
import { useAccount } from '../auth/AccountProvider';
import { colors } from '../theme';
import { syncNow } from './sync';

/** Pull-to-refresh that syncs with the account. Nothing while signed out. */
export function useSyncRefresh() {
  const { signedIn } = useAccount();
  const [refreshing, setRefreshing] = useState(false);
  if (!signedIn) return undefined;
  const refresh = async () => {
    setRefreshing(true);
    await syncNow();
    setRefreshing(false);
  };
  return <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.orange} colors={[colors.orange]} />;
}
