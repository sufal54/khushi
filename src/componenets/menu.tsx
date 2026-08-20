"use client";

import { Dispatch, SetStateAction, useEffect, useRef, useState } from "react";
import { FiPlus, FiTrash2, FiX } from "react-icons/fi";

type Props = {
  collectionList: string[];
  setIsShowMenu: Dispatch<SetStateAction<boolean>>;
  setCollection: Dispatch<SetStateAction<string>>;
  addCollection: (name: string) => void;
  deleteCollection: (name: string) => void;
};

export default function Menu({
  collectionList,
  setIsShowMenu,
  setCollection,
  addCollection,
  deleteCollection,
}: Props) {
  const [activeCollection, setActiveCollection] = useState("");
  const [newCollection, setNewCollection] = useState("");
  const [isAdding, setIsAdding] = useState(false);

  const [menuWidth, setMenuWidth] = useState(320);
  const [isResizing, setIsResizing] = useState(false);

  const resizeStartX = useRef(0);
  const resizeStartWidth = useRef(320);

  const handleAddCollection = () => {
    const name = newCollection.trim();

    if (!name) return;

    if (collectionList.includes(name)) {
      return;
    }

    addCollection(name);

    setNewCollection("");
    setIsAdding(false);

    setActiveCollection(name);
    setCollection(name);
  };

  const handleDeleteCollection = (name: string) => {
    deleteCollection(name);

    if (activeCollection === name) {
      setActiveCollection("");
    }
  };

  const selectCollection = (name: string) => {
    setActiveCollection(name);
    setCollection(name);
    setIsShowMenu(false);
  };

  const startResize = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();

    resizeStartX.current = e.clientX;
    resizeStartWidth.current = menuWidth;

    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handlePointerMove = (e: PointerEvent) => {
      const delta = e.clientX - resizeStartX.current;

      const newWidth = resizeStartWidth.current + delta;

      // Minimum and maximum width
      const clampedWidth = Math.min(
        Math.max(newWidth, 260),
        Math.min(700, window.innerWidth * 0.8),
      );

      setMenuWidth(clampedWidth);
    };

    const handlePointerUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);

      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing]);

  return (
    <aside
      style={{ width: `${menuWidth}px` }}
      className={`fixed inset-y-0 left-0 z-50 flex max-w-[85vw] flex-col border-r border-zinc-800 bg-zinc-950 text-white shadow-2xl ${
        isResizing ? "" : "transition-[width] duration-150"
      }`}
    >
      {/* Header */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold">Collections</h2>

          <p className="mt-0.5 text-xs text-zinc-500">
            {collectionList.length} collections
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsAdding((prev) => !prev)}
            title="New collection"
            className="flex items-center gap-1.5 rounded-md bg-zinc-800 px-2.5 py-1.5 text-xs font-medium text-zinc-200 transition hover:bg-zinc-700"
          >
            <FiPlus size={14} />
            <span>New</span>
          </button>

          <button
            onClick={() => setIsShowMenu(false)}
            title="Close"
            className="flex h-8 w-8 items-center justify-center rounded-md text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
          >
            <FiX size={18} />
          </button>
        </div>
      </div>

      {/* Add collection */}
      {isAdding && (
        <div className="shrink-0 border-b border-zinc-800 p-3">
          <div className="flex gap-2">
            <input
              autoFocus
              value={newCollection}
              onChange={(e) => setNewCollection(e.target.value)}
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
              className="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white outline-none placeholder:text-zinc-600 focus:border-zinc-500"
            />

            <button
              onClick={handleAddCollection}
              disabled={!newCollection.trim()}
              className="rounded-md bg-white px-3 py-2 text-sm font-medium text-black transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Add
            </button>
          </div>
        </div>
      )}

      {/* Collections */}
      <div className="min-h-0 flex-1 overflow-y-auto p-2">
        {collectionList.length === 0 ? (
          <div className="flex h-full items-center justify-center px-4 text-center">
            <p className="text-xs text-zinc-600">No collections yet</p>
          </div>
        ) : (
          <div className="space-y-1">
            {collectionList.map((collection) => {
              const isActive = activeCollection === collection;

              return (
                <div
                  key={collection}
                  className={`group flex items-center rounded-md transition ${
                    isActive ? "bg-zinc-800" : "hover:bg-zinc-900"
                  }`}
                >
                  <button
                    onClick={() => selectCollection(collection)}
                    className="min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm text-zinc-200"
                  >
                    {collection}
                  </button>

                  <button
                    onClick={() => handleDeleteCollection(collection)}
                    title="Delete collection"
                    className="mr-1 flex h-7 w-7 shrink-0 items-center justify-center rounded text-zinc-600 opacity-0 transition hover:bg-red-500/10 hover:text-red-400 group-hover:opacity-100"
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 border-t border-zinc-800 p-3">
        <button
          onClick={() => setIsShowMenu(false)}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-zinc-900 py-2 text-sm text-zinc-400 transition hover:bg-zinc-800 hover:text-white"
        >
          <FiX size={15} />
          Close
        </button>
      </div>

      {/* Resize handle */}
      <div
        onPointerDown={startResize}
        className="group absolute right-0 top-0 h-full w-1.5 cursor-col-resize"
      >
        <div
          className={`absolute right-0 top-0 h-full w-px transition-colors ${
            isResizing
              ? "bg-zinc-400"
              : "bg-transparent group-hover:bg-zinc-600"
          }`}
        />
      </div>
    </aside>
  );
}
