import { openUrl } from "@tauri-apps/plugin-opener";
import {
  For,
  Show,
  createEffect,
  createSignal,
  onCleanup,
  onMount,
} from "solid-js";
import {
  FiEdit2,
  FiHeart,
  FiMoreVertical,
  FiPlus,
  FiRefreshCw,
  FiTrash2,
  FiX,
} from "solid-icons/fi";

type Props = {
  collectionList: string[];
  activeCollection: string;
  setActiveCollection: (value: string) => void;
  setIsShowMenu: (value: boolean) => void;
  setCollection: (value: string) => void;
  addCollection: (name: string) => void;
  deleteCollection: (name: string) => void;
  renameCollection: (oldName: string, newName: string) => void;
};

export default function Menu(props: Props) {
  const [newCollection, setNewCollection] = createSignal("");
  const [isAdding, setIsAdding] = createSignal(false);

  const [menuWidth, setMenuWidth] = createSignal(320);
  const [isResizing, setIsResizing] = createSignal(false);

  const [editingCollection, setEditingCollection] = createSignal<string | null>(
    null,
  );

  const [editCollectionName, setEditCollectionName] = createSignal("");

  const [deleteCurrentCollection, setDeleteCurrentCollection] = createSignal<
    string | null
  >(null);

  let resizeStartX = 0;
  let resizeStartWidth = 320;

  // ------------------------------------------------------------
  // Add collection
  // ------------------------------------------------------------

  const handleAddCollection = () => {
    const name = newCollection().trim();

    if (!name) return;

    if (props.collectionList.includes(name)) {
      return;
    }

    props.addCollection(name);

    setNewCollection("");
    setIsAdding(false);

    props.setActiveCollection(name);
    props.setCollection(name);
  };

  // ------------------------------------------------------------
  // Delete collection
  // ------------------------------------------------------------

  const handleDeleteCollection = (name: string) => {
    props.deleteCollection(name);

    if (props.activeCollection === name) {
      props.setActiveCollection("");
    }
  };

  // ------------------------------------------------------------
  // Select collection
  // ------------------------------------------------------------

  const selectCollection = (name: string) => {
    props.setActiveCollection(name);
    props.setCollection(name);
    props.setIsShowMenu(false);
  };

  // ------------------------------------------------------------
  // Resize
  // ------------------------------------------------------------

  const startResize = (e: PointerEvent) => {
    e.preventDefault();

    resizeStartX = e.clientX;
    resizeStartWidth = menuWidth();

    setIsResizing(true);
  };

  const handlePointerMove = (e: PointerEvent) => {
    if (!isResizing()) return;

    const delta = e.clientX - resizeStartX;

    const newWidth = resizeStartWidth + delta;

    const clampedWidth = Math.min(
      Math.max(newWidth, 260),
      Math.min(700, window.innerWidth * 0.8),
    );

    setMenuWidth(clampedWidth);
  };

  const handlePointerUp = () => {
    setIsResizing(false);
  };

  onMount(() => {
    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
  });

  onCleanup(() => {
    window.removeEventListener("pointermove", handlePointerMove);
    window.removeEventListener("pointerup", handlePointerUp);

    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  });

  // Change cursor while resizing
  createEffect(() => {
    if (isResizing()) {
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    } else {
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
  });

  // ------------------------------------------------------------
  // Rename
  // ------------------------------------------------------------

  const startEditing = (collection: string) => {
    setEditingCollection(collection);
    setEditCollectionName(collection);
  };

  const finishEditing = (collection: string) => {
    const newName = editCollectionName().trim();

    if (!newName) return;

    if (newName !== collection && props.collectionList.includes(newName)) {
      return;
    }

    props.renameCollection(collection, newName);

    if (props.activeCollection === collection) {
      selectCollection(newName);
    }

    setEditingCollection(null);
  };

  return (
    <aside
      style={{
        width: `${menuWidth()}px`,
      }}
      class={`fixed inset-y-0 left-0 z-50 flex max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950 pt-[env(safe-area-inset-top)] text-white shadow-2xl ${
        isResizing() ? "" : "transition-[width] duration-150"
      }`}
    >
      {/* Header */}
      <div class="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div class="min-w-0">
          <h2 class="text-sm font-semibold">Collections</h2>

          <p class="mt-0.5 text-xs text-zinc-500">
            {props.collectionList.length} collections
          </p>
        </div>

        <div class="flex items-center gap-1">
          <button
            onClick={() => setIsAdding((prev) => !prev)}
            title="New collection"
            class="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            <FiPlus size={14} />
            <span>New</span>
          </button>

          <button
            onClick={() => props.setIsShowMenu(false)}
            title="Close"
            class="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Add collection */}
      <Show when={isAdding()}>
        <div class="shrink-0 border-b border-zinc-800 p-3">
          <div class="flex gap-2">
            <input
              autofocus
              value={newCollection()}
              onInput={(e) => setNewCollection(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleAddCollection();
                }

                if (e.key === "Escape") {
                  setNewCollection("");
                  setIsAdding(false);
                }
              }}
              placeholder="Collection name..."
              class="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <button
              onClick={handleAddCollection}
              disabled={!newCollection().trim()}
              class="rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      </Show>

      {/* Collections */}
      <div class="min-h-0 flex-1 overflow-y-auto p-2">
        <Show
          when={props.collectionList.length > 0}
          fallback={
            <div class="flex h-full items-center justify-center px-4 text-center">
              <p class="text-xs text-zinc-600">No collections yet</p>
            </div>
          }
        >
          <div class="space-y-1">
            <For each={props.collectionList}>
              {(collection) => {
                const isActive = () => props.activeCollection === collection;

                const isEditing = () => editingCollection() === collection;

                return (
                  <div
                    class={`group relative flex items-center rounded-md transition ${
                      isActive() ? "bg-zinc-800" : "hover:bg-zinc-900"
                    }`}
                  >
                    {/* Collection name / Edit input */}
                    <Show
                      when={!isEditing()}
                      fallback={
                        <input
                          autofocus
                          value={editCollectionName()}
                          onInput={(e) =>
                            setEditCollectionName(e.currentTarget.value)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              finishEditing(collection);
                            }

                            if (e.key === "Escape") {
                              setEditingCollection(null);
                            }
                          }}
                          class="min-w-0 flex-1 rounded-md border border-emerald-500 bg-transparent px-3 py-2 text-sm text-white outline-none"
                        />
                      }
                    >
                      <button
                        type="button"
                        onClick={() => selectCollection(collection)}
                        class="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm text-zinc-200"
                      >
                        {collection}
                      </button>
                    </Show>

                    {/* 3 dot */}
                    <Show when={!isEditing()}>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                        class="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-zinc-700 hover:text-white"
                      >
                        <FiMoreVertical size={15} />
                      </button>
                    </Show>

                    {/* Dropdown */}
                    <Show when={!isEditing()}>
                      <div class="absolute right-1 top-full z-50 mt-1 hidden w-36 rounded-md border border-zinc-700 bg-zinc-900 p-1 shadow-xl group-focus-within:block">
                        {/* Rename */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            startEditing(collection);
                          }}
                          class="flex w-full items-center gap-2 rounded px-2 py-2 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white"
                        >
                          <FiEdit2 size={13} />
                          Rename
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();

                            setDeleteCurrentCollection(collection);
                          }}
                          class="flex w-full items-center gap-2 rounded px-2 py-2 text-xs text-red-400 hover:bg-red-500/10"
                        >
                          <FiTrash2 size={13} />
                          Delete
                        </button>
                      </div>
                    </Show>
                  </div>
                );
              }}
            </For>
          </div>
        </Show>
      </div>

      {/* Footer */}
      <div class="shrink-0 space-y-2 border-t border-zinc-800 p-3">
        <button
          onClick={async () => {
            await openUrl("https://www.buymeacoffee.com/subadev");
          }}
          class="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <FiHeart size={15} />
          Support / Donate
        </button>

        <button
          onClick={() => props.setIsShowMenu(false)}
          class="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <FiX size={15} />
          Close
        </button>
      </div>

      {/* Delete confirmation modal */}
      <Show when={deleteCurrentCollection()}>
        <div
          class="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
          onClick={() => setDeleteCurrentCollection(null)}
        >
          <div
            class="w-full max-w-sm rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div class="mb-4 flex items-start gap-3">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/10 text-red-400">
                <FiTrash2 size={18} />
              </div>

              <div>
                <h2 class="text-sm font-semibold text-white">
                  Delete collection?
                </h2>

                <p class="mt-1 text-xs leading-5 text-zinc-400">
                  Are you sure you want to delete{" "}
                  <span class="font-medium text-zinc-200">
                    "{deleteCurrentCollection()}"
                  </span>
                  ? This action cannot be undone.
                </p>
              </div>
            </div>

            <div class="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteCurrentCollection(null)}
                class="rounded-md px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  const collection = deleteCurrentCollection();

                  if (!collection) return;

                  handleDeleteCollection(collection);

                  setDeleteCurrentCollection(null);

                  props.setActiveCollection(props.collectionList[0] ?? "");
                }}
                class="rounded-md bg-red-500 px-3 py-2 text-xs font-medium text-white hover:bg-red-600"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </Show>
    </aside>
  );
}
