import { createSignal } from "solid-js";
import { FiMenu } from "solid-icons/fi";

import { Container } from "./components/Container";
import Menu from "./components/Menu";
import { useStore } from "./context/StoreContext";

export default function App() {
  const {
    tabs: tabGroups,
    addCollection,
    deleteCollection,
    renameCollection,
  } = useStore();

  const [isShowMenu, setIsShowMenu] = createSignal(false);
  const [activeCollection, setActiveCollection] = createSignal("test");

  const collectionList = () => Object.keys(tabGroups());

  return (
    <div class="min-h-screen bg-zinc-950 text-zinc-50 flex items-stretch justify-center px-4 py-6 overflow-hidden">
      <main class="w-full bg-zinc-900/80 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        <header class="px-6 py-4 border-b border-zinc-800 flex items-center">
          <button
            type="button"
            class="mr-5 cursor-pointer"
            onClick={() => setIsShowMenu(true)}
          >
            <FiMenu class="text-xl" />
          </button>

          <div>
            <h1 class="text-xl font-semibold tracking-tight">
              Khushi API Client
            </h1>

            <p class="text-xs text-zinc-400">API Tester</p>
          </div>
        </header>

        {isShowMenu() && (
          <Menu
            collectionList={collectionList()}
            setIsShowMenu={setIsShowMenu}
            setCollection={setActiveCollection}
            addCollection={addCollection}
            deleteCollection={deleteCollection}
            renameCollection={renameCollection}
            activeCollection={activeCollection()}
            setActiveCollection={setActiveCollection}
          />
        )}

        <Container collection={activeCollection()} />
      </main>
    </div>
  );
}
