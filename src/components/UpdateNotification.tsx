import { createSignal, Show, onMount, For, createEffect, on } from "solid-js";
import { animate } from "motion";
import { getVersion } from "@tauri-apps/api/app";
import { fetch } from "@tauri-apps/plugin-http";
import { FiAlertCircle, FiStar, FiZap } from "solid-icons/fi";
import { openUrl } from "@tauri-apps/plugin-opener";
import { useStore } from "../context/StoreContext";

type Update = {
  version: string;
  new: string[];
  improved: string[];
  fixed: string[];
};

export default function UpdateNotification() {
  const { showUpdateNote, neverShowUpdateNote, storeReady } = useStore();
  const [show, setShow] = createSignal(false);
  const [dontShowAgain, setDontShowAgain] = createSignal(false);
  const [update, setUpdate] = createSignal<Update | null>(null);

  let notification!: HTMLDivElement;

  onMount(async () => {
    const checkUpdate = async () => {
      if (!storeReady()) {
        setTimeout(checkUpdate, 100);
        return;
      }

      if (!showUpdateNote()) {
        return;
      }

      await openNotification();
    };

    await checkUpdate();
  });

  const openNotification = async () => {
    try {
      const res = await fetch("https://khushi-liart.vercel.app/api/update", {
        cache: "no-store",
      });

      if (!res.ok) return;

      const data: Update = await res.json();

      const currentVersion = await getVersion();

      // Don't show if already on this version
      if (currentVersion === data.version) {
        return;
      }

      // Store fetched update
      setUpdate(data);
      setShow(true);

      requestAnimationFrame(() => {
        animate(
          notification,
          {
            opacity: [0, 1],
            transform: [
              "translateX(30px) scale(0.96)",
              "translateX(0) scale(1)",
            ],
          },
          {
            duration: 0.35,
            ease: [0.22, 1, 0.36, 1],
          },
        );
      });
    } catch (error) {
      console.error("Failed to fetch update:", error);
    }
  };

  const closeNotification = async () => {
    if (dontShowAgain()) {
      await neverShowUpdateNote();
    }
    await animate(
      notification,
      {
        opacity: [1, 0],
        transform: ["translateX(0) scale(1)", "translateX(30px) scale(0.96)"],
      },
      {
        duration: 0.25,
        ease: [0.4, 0, 1, 1],
      },
    ).finished;

    setShow(false);
  };

  return (
    <Show when={show() && update()}>
      {(data) => (
        <div
          ref={notification}
          class="fixed top-5 right-5 z-50 w-96 rounded-xl border border-zinc-700 bg-zinc-900 p-4 shadow-2xl overflow-scroll"
        >
          <div class="flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-400">
              ↑
            </div>

            <div class="flex-1">
              <h3 class="font-semibold text-white">New version released</h3>

              <p class="mt-1 text-sm text-zinc-400">
                Khushi API Client v{data().version} is now available.
              </p>

              <Show when={data().new.length > 0}>
                <div class="mt-3">
                  <h4 class="flex items-center gap-1 text-xs font-semibold uppercase text-zinc-300">
                    <FiStar class="text-yellow-400" size={14} />
                    What's new
                  </h4>

                  <ul class="mt-1 space-y-1">
                    <For each={data().new}>
                      {(item) => (
                        <li class="text-xs text-zinc-400">• {item}</li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <Show when={data().improved.length > 0}>
                <div class="mt-3">
                  <h4 class="flex items-center gap-1 text-xs font-semibold uppercase text-zinc-300">
                    <FiZap size={14} /> Improved
                  </h4>

                  <ul class="mt-1 space-y-1">
                    <For each={data().improved}>
                      {(item) => (
                        <li class="text-xs text-zinc-400">• {item}</li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <Show when={data().fixed.length > 0}>
                <div class="mt-3">
                  <h4 class="flex items-center gap-1 text-xs font-semibold uppercase text-zinc-300">
                    <FiAlertCircle size={14} /> Fixed
                  </h4>

                  <ul class="mt-1 space-y-1">
                    <For each={data().fixed}>
                      {(item) => (
                        <li class="text-xs text-zinc-400">• {item}</li>
                      )}
                    </For>
                  </ul>
                </div>
              </Show>

              <div class="mt-4 flex gap-2">
                <button
                  class="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
                  onClick={() => openUrl("https://khushi-liart.vercel.app")}
                >
                  Update now
                </button>

                <button
                  class="rounded-lg px-3 py-1.5 text-sm text-zinc-400 hover:bg-zinc-800 hover:text-white"
                  onClick={closeNotification}
                >
                  Later
                </button>
              </div>

              <label class="mt-3 flex cursor-pointer items-center gap-2 text-xs text-zinc-500">
                <input
                  type="checkbox"
                  checked={dontShowAgain()}
                  onChange={(e) => setDontShowAgain(e.currentTarget.checked)}
                  class="accent-blue-600"
                />
                Never show again
              </label>
            </div>

            <button
              class="text-zinc-500 hover:text-white"
              onClick={closeNotification}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </Show>
  );
}
