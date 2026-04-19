import { useCallback, useState } from "react";

export function usePullToRefresh(action: () => Promise<void>) {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    if (isRefreshing) {
      return;
    }

    setIsRefreshing(true);

    try {
      await action();
    } finally {
      setIsRefreshing(false);
    }
  }, [action, isRefreshing]);

  return {
    isRefreshing,
    onRefresh,
  };
}
