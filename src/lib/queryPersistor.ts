import { createSyncStoragePersister } from "@tanstack/react-query-persist-client";
import localforage from "localforage";

export const queryPersister = createSyncStoragePersister({
  storage: {
    getItem: async (key) => {
      return await localforage.getItem(key);
    },
    setItem: async (key, value) => {
      await localforage.setItem(key, value);
    },
    removeItem: async (key) => {
      await localforage.removeItem(key);
    },
  },
});
