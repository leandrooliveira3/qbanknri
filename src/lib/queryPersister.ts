import localforage from "localforage";
import { createAsyncStoragePersister } from "@tanstack/react-query-persist-client";

localforage.config({
  name: "qbanknri",
  storeName: "react_query_cache",
  description: "Cache offline do banco de questões",
});

export const queryPersister = createAsyncStoragePersister({
  storage: localforage,
  key: "qbanknri-react-query-cache",
});
