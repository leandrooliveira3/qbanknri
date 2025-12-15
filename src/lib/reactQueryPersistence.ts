import { persistQueryClient } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";

export function setupReactQueryPersistence(queryClient: any) {
  const persister = createSyncStoragePersister({
    storage: window.localStorage,
    key: "qbanknri-react-query-cache",
  });

  persistQueryClient({
    queryClient,
    persister,
    maxAge: 1000 * 60 * 60 * 24 * 7, // 7 dias
  });
}
