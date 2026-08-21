"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { RequestTab } from "@/componenets/tester";

type StoreContextType = {
  user: string | null;
  login: (name: string) => Promise<void>;

  tabs: Record<string, RequestTab[]>;

  addCollection: (name: string) => void;
  renameCollection: (oldName: string, newName: string) => void;
  deleteCollection: (name: string) => void;

  addTab: (group: string, tab: RequestTab) => void;
  renameTab: (group: string, id: string, name: string) => void;
  updateTab: (group: string, tab: RequestTab) => void;
  removeTab: (group: string, id: string) => void;
};

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [tauriStore, setTauriStore] = useState<Store | null>(null);

  const [tabs, setTabs] = useState<Record<string, RequestTab[]>>({});

  const [user, setUser] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const s = await load("store.json", {
        autoSave: false,
        defaults: {},
      });

      setTauriStore(s);

      const savedTabs = await s.get<Record<string, RequestTab[]>>("Khushi");

      if (savedTabs) {
        setTabs(savedTabs);
      }

      const savedUser = await s.get<string>("user");

      if (savedUser) {
        setUser(savedUser);
      }
    })();
  }, []);

  // Save tabs whenever they change
  useEffect(() => {
    if (!tauriStore) return;

    (async () => {
      await tauriStore.set("Khushi", tabs);
      await tauriStore.save();
    })();
  }, [tabs, tauriStore]);

  const login = async (name: string) => {
    setUser(name);

    await tauriStore?.set("user", name);
    await tauriStore?.save();
  };

  const addCollection = (name: string) => {
    const collectionName = name.trim();

    if (!collectionName) return;

    setTabs((prev) => {
      if (prev[collectionName]) {
        return prev;
      }

      return {
        ...prev,
        [collectionName]: [],
      };
    });
  };

  const renameCollection = (oldName: string, newName: string) => {
    const oldCollectionName = oldName.trim();
    const newCollectionName = newName.trim();

    if (!oldCollectionName || !newCollectionName) return;
    if (oldCollectionName === newCollectionName) return;

    setTabs((prev) => {
      // Old collection doesn't exist
      if (!(oldCollectionName in prev)) {
        return prev;
      }

      // New name already exists
      if (newCollectionName in prev) {
        return prev;
      }

      const next = { ...prev };

      // Move the collection
      next[newCollectionName] = next[oldCollectionName];

      // Delete old collection
      delete next[oldCollectionName];

      return next;
    });
  };

  const deleteCollection = (name: string) => {
    setTabs((prev) => {
      // Don't delete if it doesn't exist
      if (!(name in prev)) {
        return prev;
      }

      const next = { ...prev };

      delete next[name];

      return next;
    });
  };

  const addTab = (group: string, tab: RequestTab) => {
    setTabs((prev) => ({
      ...prev,
      [group]: [...(prev[group] ?? []), tab],
    }));
  };

  const renameTab = (group: string, id: string, name: string) => {
    const newName = name.trim();

    if (!newName) return;

    setTabs((prev) => ({
      ...prev,
      [group]:
        prev[group]?.map((tab) =>
          tab.id === id
            ? {
                ...tab,
                name: newName,
              }
            : tab,
        ) ?? [],
    }));
  };

  const updateTab = (group: string, tab: RequestTab) => {
    setTabs((prev) => ({
      ...prev,
      [group]: prev[group]?.map((t) => (t.id === tab.id ? tab : t)) ?? [],
    }));
  };

  const removeTab = (group: string, id: string) => {
    setTabs((prev) => ({
      ...prev,
      [group]: prev[group]?.filter((t) => t.id !== id) ?? [],
    }));
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        login,

        tabs,

        addCollection,
        renameCollection,
        deleteCollection,

        addTab,
        updateTab,
        renameTab,
        removeTab,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);

  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return ctx;
}
