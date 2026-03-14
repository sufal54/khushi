"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { load, Store } from "@tauri-apps/plugin-store";
import { RequestTab } from "@/app/tester";

type StoreContextType = {
    user: string | null;
    login: (name: string) => Promise<void>;

    tabs: Record<string, RequestTab[]>;
    addTab: (group: string, tab: RequestTab) => void;
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
            const s = await load("store.json", { autoSave: false, defaults: {} });
            setTauriStore(s);

            const savedTabs = await s.get<Record<string, RequestTab[]>>("tabs");
            if (savedTabs) setTabs(savedTabs);

            const savedUser = await s.get<string>("user");
            if (savedUser) setUser(savedUser);
        })();
    }, []);

    useEffect(() => {
        if (!tauriStore) return;
        tauriStore.set("tabs", tabs);
        tauriStore.save();
    }, [tabs, tauriStore]);

    const login = async (name: string) => {
        setUser(name);
        await tauriStore?.set("user", name);
        await tauriStore?.save();
    };

    const addTab = (group: string, tab: RequestTab) => {
        setTabs(prev => ({
            ...prev,
            [group]: [...(prev[group] ?? []), tab],
        }));
    };

    const updateTab = (group: string, tab: RequestTab) => {
        setTabs(prev => ({
            ...prev,
            [group]: prev[group]?.map(t =>
                t.id === tab.id ? tab : t
            ) ?? [],
        }));
    };

    const removeTab = (group: string, id: string) => {
        setTabs(prev => ({
            ...prev,
            [group]: prev[group]?.filter(t => t.id !== id) ?? [],
        }));
    };

    return (
        <StoreContext.Provider
            value={{ user, login, tabs, addTab, updateTab, removeTab }}
        >
            {children}
        </StoreContext.Provider>
    );
}

export function useStore() {
    const ctx = useContext(StoreContext);
    if (!ctx) throw new Error("useStore must be used inside StoreProvider");
    return ctx;
}