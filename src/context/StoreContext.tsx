import {
  createContext,
  createSignal,
  useContext,
  onMount,
  type ParentComponent,
  Accessor,
} from "solid-js";

import { load, Store } from "@tauri-apps/plugin-store";
import type { RequestTab } from "../components/Container";

type Tabs = Record<string, RequestTab[]>;
type LastTab = { group: string; tabId: string };

type StoreContextType = {
  user: () => string | null;
  login: (name: string) => Promise<void>;
  lastTab: () => LastTab | null;
  tabs: () => Tabs;
  showUpdateNote: Accessor<boolean>;
  storeReady: Accessor<boolean>;

  neverShowUpdateNote: () => Promise<void>;

  addCollection: (name: string) => Promise<void>;
  renameCollection: (oldName: string, newName: string) => Promise<void>;
  deleteCollection: (name: string) => Promise<void>;

  addTab: (group: string, tab: RequestTab) => Promise<void>;
  renameTab: (group: string, id: string, name: string) => Promise<void>;
  updateTab: (group: string, tab: RequestTab) => Promise<void>;
  removeTab: (group: string, id: string) => Promise<void>;
  setLastTabOpened: (lastTabOpened: LastTab) => Promise<void>;
};

const StoreContext = createContext<StoreContextType>();

export const StoreProvider: ParentComponent = (props) => {
  const [tauriStore, setTauriStore] = createSignal<Store | null>(null);

  const [tabs, setTabs] = createSignal<Tabs>({});
  const [user, setUser] = createSignal<string | null>(null);
  const [lastTab, setLastTab] = createSignal<LastTab | null>(null);
  const [showUpdateNote, setShowUpdateNote] = createSignal<boolean>(true);

  // Important: don't persist until the initial store has finished loading.
  const [storeReady, setStoreReady] = createSignal(false);

  /*
   * LOAD STORE
   */
  onMount(async () => {
    try {
      const store = await load("store.json", {
        autoSave: false,
        defaults: {},
      });

      setTauriStore(store);

      const savedTabs = await store.get<Tabs>("Khushi");

      if (savedTabs) {
        setTabs(savedTabs);
      }

      const savedUser = await store.get<string>("user");

      if (savedUser) {
        setUser(savedUser);
      }

      const savedLastTab = await store.get<LastTab>("lastTab");
      if (savedLastTab) {
        setLastTab(savedLastTab);
      }

      const savedShowUpdateNote = await store.get<boolean>("showUpdateNote");
      if (typeof savedShowUpdateNote === "boolean") {
        setShowUpdateNote(savedShowUpdateNote);
      } else {
        setShowUpdateNote(true);
      }

      setStoreReady(true);
    } catch (error) {
      console.error("Failed to load store:", error);

      // Still allow the application to work in memory.
      setStoreReady(true);
    }
  });

  const neverShowUpdateNote = async () => {
    const ready = storeReady();
    const store = tauriStore();

    if (!ready || !store) {
      return;
    }

    try {
      setShowUpdateNote(false);
      await store.set("showUpdateNote", false);
      await store.save();
    } catch (error) {
      console.error("Failed to save tabs:", error);
    }
  };

  /*
   * PERSIST TABS
   */
  const tabsSave = async () => {
    const ready = storeReady();
    const store = tauriStore();
    const currentTabs = tabs();

    if (!ready || !store || !storeReady() || !currentTabs) {
      return;
    }

    try {
      await store.set("Khushi", currentTabs);
      await store.save();
    } catch (error) {
      console.error("Failed to save tabs:", error);
    }
  };

  /*
   * PERSIST LAST TABS
   */
  const lastTabSave = async () => {
    const ready = storeReady();
    const store = tauriStore();
    const currentTabs = lastTab();

    if (!ready || !store || !storeReady()) {
      return;
    }

    try {
      await store.set("lastTab", currentTabs);
      await store.save();
    } catch (error) {
      console.error("Failed to save tabs:", error);
    }
  };

  const setLastTabOpened = async (lastTabOpened: LastTab) => {
    setLastTab(lastTabOpened);

    await lastTabSave();
  };

  /*
   * LOGIN
   */
  const login = async (name: string) => {
    const value = name.trim();

    if (!value) {
      return;
    }

    setUser(value);

    const store = tauriStore();

    if (!store) {
      return;
    }

    try {
      await store.set("user", value);
      await store.save();
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  };

  /*
   * COLLECTIONS
   */
  const addCollection = async (name: string) => {
    const collectionName = name.trim();

    if (!collectionName) {
      return;
    }

    setTabs((prev) => {
      if (collectionName in prev) {
        return prev;
      }

      return {
        ...prev,
        [collectionName]: [],
      };
    });
    await tabsSave();
  };

  const renameCollection = async (oldName: string, newName: string) => {
    const oldCollectionName = oldName.trim();
    const newCollectionName = newName.trim();

    if (!oldCollectionName || !newCollectionName) {
      return;
    }

    if (oldCollectionName === newCollectionName) {
      return;
    }

    setTabs((prev) => {
      if (!(oldCollectionName in prev)) {
        return prev;
      }

      if (newCollectionName in prev) {
        return prev;
      }

      return {
        ...Object.fromEntries(
          Object.entries(prev).filter(([name]) => name !== oldCollectionName),
        ),
        [newCollectionName]: prev[oldCollectionName],
      };
    });
    await tabsSave();
  };

  const deleteCollection = async (name: string) => {
    setTabs((prev) => {
      if (!(name in prev)) {
        return prev;
      }

      const next = { ...prev };

      delete next[name];

      return next;
    });

    await tabsSave();
  };

  /*
   * TABS
   */
  const addTab = async (group: string, tab: RequestTab) => {
    const collection = group.trim();

    if (!collection) {
      console.warn("Cannot add tab: collection is empty");
      return;
    }

    setTabs((prev) => {
      const existingTabs = prev[collection] ?? [];

      return {
        ...prev,
        [collection]: [...existingTabs, tab],
      };
    });
    await tabsSave();
  };

  const renameTab = async (group: string, id: string, name: string) => {
    const newName = name.trim();

    if (!newName) {
      return;
    }

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
    await tabsSave();
  };

  const updateTab = async (group: string, tab: RequestTab) => {
    setTabs((prev) => ({
      ...prev,
      [group]:
        prev[group]?.map((currentTab) =>
          currentTab.id === tab.id ? tab : currentTab,
        ) ?? [],
    }));
    await tabsSave();
  };

  const removeTab = async (group: string, id: string) => {
    setTabs((prev) => ({
      ...prev,
      [group]: prev[group]?.filter((tab) => tab.id !== id) ?? [],
    }));
    await tabsSave();
  };

  return (
    <StoreContext.Provider
      value={{
        user,
        login,
        lastTab,
        storeReady,

        tabs,
        showUpdateNote,

        neverShowUpdateNote,

        addCollection,
        renameCollection,
        deleteCollection,

        addTab,
        renameTab,
        updateTab,
        removeTab,
        setLastTabOpened,
      }}
    >
      {props.children}
    </StoreContext.Provider>
  );
};

export function useStore() {
  const ctx = useContext(StoreContext);

  if (!ctx) {
    throw new Error("useStore must be used inside StoreProvider");
  }

  return ctx;
}
