"use client";
import { GiHamburgerMenu } from "react-icons/gi";
import { ApiTester } from "../componenets/tester";
import { useState } from "react";
import Menu from "@/componenets/menu";
import { useStore } from "@/context/StoreContext";

export default function Home() {
  const {
    tabs: tabGroups,
    addCollection,
    deleteCollection,
    renameCollection,
  } = useStore();

  const collectionList = Object.keys(tabGroups);

  const [isShowMenu, setIsShowMenu] = useState<boolean>(false);
  const [activeCollection, setActiveCollection] = useState<string>("test");

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-stretch justify-center px-4 py-6 overflow-hidden">
      <main className="w-full  bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header className="px-6 py-4 border-b border-zinc-800 flex items-center">
          <div
            className="mr-5"
            onClick={() => {
              setIsShowMenu(true);
            }}
          >
            <GiHamburgerMenu className="text-xl" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight">
              Khushi API Client
            </h1>
            <p className="text-xs text-zinc-400">API Tester</p>
          </div>
        </header>

        {isShowMenu && (
          <Menu
            collectionList={collectionList}
            setIsShowMenu={setIsShowMenu}
            setCollection={setActiveCollection}
            addCollection={addCollection}
            deleteCollection={deleteCollection}
            renameCollection={renameCollection}
            activeCollection={activeCollection}
            setActiveCollection={setActiveCollection}
          />
        )}

        <ApiTester collection={activeCollection} />
      </main>
    </div>
  );
}
