import { createEffect, createSignal, on, onMount } from "solid-js";
import { FiMenu } from "solid-icons/fi";

import { Container } from "./components/Container";
import Menu from "./components/Menu";
import { useStore } from "./context/StoreContext";
import { animate } from "motion";
import UpdateNotification from "./components/UpdateNotification";
import { getName } from "@tauri-apps/api/app";

export default function App() {
  const {
    tabs: tabGroups,
    addCollection,
    deleteCollection,
    lastTab,
    renameCollection,
  } = useStore();

  const [isShowMenu, setIsShowMenu] = createSignal(false);
  const [activeCollection, setActiveCollection] = createSignal("test");

  const [appName, setAppName] = createSignal("");

  const collectionList = () => Object.keys(tabGroups());

  onMount(async () => {
    setAppName(await getName());
  });

  let menuEl: HTMLElement | undefined;

  const openMenu = () => {
    setIsShowMenu(true);

    requestAnimationFrame(() => {
      if (!menuEl) return;
      menuEl.style.opacity = "0";
      menuEl.style.transform = "translateX(-20px)";

      animate(
        menuEl,
        {
          opacity: [0, 1],
          transform: ["translateX(-20px)", "translateX(0px)"],
        },
        {
          duration: 0.3,
          ease: [0.16, 1, 0.3, 1],
        },
      );
    });
  };

  const closeMenu = async () => {
    if (!menuEl) {
      setIsShowMenu(false);
      return;
    }

    await animate(
      menuEl,
      {
        opacity: [1, 0],
        transform: ["translateX(0px)", "translateX(-20px)"],
      },
      {
        duration: 0.25,
        ease: [0.4, 0, 1, 1],
      },
    ).finished;

    setIsShowMenu(false);
  };

  createEffect(
    on(
      () => lastTab()?.group,
      (group) => {
        if (!group) {
          return;
        }
        setActiveCollection(group);
      },
    ),
  );

  return (
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex items-stretch justify-center px-4 py-6 overflow-hidden">
      <main class="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header class="px-6 py-4 border-b border-zinc-800 flex items-center">
          <button type="button" class="mr-5 cursor-pointer" onClick={openMenu}>
            <FiMenu class="text-xl" />
          </button>

          <div>
            <h1 class="text-xl font-semibold tracking-tight">
              {appName()} API Client
            </h1>

            <p class="text-xs text-zinc-400">API Tester</p>
          </div>
        </header>

        {isShowMenu() && (
          <Menu
            setMenuEl={(el) => {
              menuEl = el;
            }}
            collectionList={collectionList()}
            closeMenu={closeMenu}
            setCollection={setActiveCollection}
            addCollection={addCollection}
            deleteCollection={deleteCollection}
            renameCollection={renameCollection}
            activeCollection={activeCollection()}
            setActiveCollection={setActiveCollection}
          />
        )}

        <UpdateNotification />

        <Container collection={activeCollection()} />
      </main>
    </div>
  );
}
