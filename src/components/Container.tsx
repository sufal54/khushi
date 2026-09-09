import {
  For,
  Show,
  createEffect,
  createMemo,
  createSignal,
  on,
  onCleanup,
  onMount,
} from "solid-js";
import { HiSolidPlus } from "solid-icons/hi";
import { FiX } from "solid-icons/fi";

import { useStore } from "../context/StoreContext";
import { sendRequest } from "../utils/Request";
import type { ResponseData } from "../utils/types";
import { RequestSection } from "./RequestSection";
import ResponseSection from "./RespnseSection";
import { FaSolidRotate } from "solid-icons/fa";

type HeaderRow = {
  id: number;
  name: string;
  value: string;
  isCustom?: boolean;
};

export type BodyType = "none" | "json" | "text" | "xml";

export type RequestTab = {
  id: string;
  name: string;

  method: string;
  url: string;
  headers: HeaderRow[];
  body: string;
  bodyType: BodyType;

  response: ResponseData | null;
  error: string | null;
  loading: boolean;
};

const COMMON_HEADERS = [
  "Content-Type",
  "Authorization",
  "Accept",
  "User-Agent",
  "Cache-Control",
  "Accept-Encoding",
  "Accept-Language",
  "X-API-Key",
  "Custom",
];

const METHOD_COLOR: Record<string, string> = {
  GET: "text-emerald-400",
  POST: "text-blue-400",
  PUT: "text-yellow-400",
  DELETE: "text-red-400",
  PATCH: "text-purple-400",
};

function createEmptyTab(): RequestTab {
  return {
    id: crypto.randomUUID(),
    name: "",
    method: "GET",
    url: "",
    headers: [],
    body: "",
    bodyType: "none",
    response: null,
    error: null,
    loading: false,
  };
}

export function Container(props: { collection: string }) {
  const {
    tabs: tabGroups,
    addTab: addStoreTab,
    updateTab,
    removeTab,
    renameTab,
    lastTab,
    setLastTabOpened,
  } = useStore();

  const tabs = createMemo(() => tabGroups()[props.collection] ?? []);

  const [showHeaders, setShowHeaders] = createSignal(true);

  const [editingTabId, setEditingTabId] = createSignal<string | null>(null);

  const [editingName, setEditingName] = createSignal("");

  const [isVertical, setIsVertical] = createSignal(false);

  const [activeResponseTab, setActiveResponseTab] = createSignal<
    "body" | "headers" | "cookies" | null
  >("body");

  const [activeTabId, setActiveTabId] = createSignal<string | null>(null);

  const [leftWidth, setLeftWidth] = createSignal(50);

  let containerRef: HTMLDivElement | undefined;
  let isDragging = false;

  /*
   * Active tab
   */
  const activeTab = createMemo<RequestTab>(() => {
    const currentTabs = tabs();
    const id = activeTabId();

    if (!id && currentTabs.length > 0) {
      setActiveTabId(currentTabs[0].id);
    }

    return (
      currentTabs.find((tab) => tab.id === id) ??
      currentTabs[0] ??
      createEmptyTab()
    );
  });

  /*
   * Body format
   */
  const bodyFormat = createMemo<BodyType>(() => activeTab().bodyType || "none");

  /*
   * Parsed body
   */
  const parsedBody = createMemo(() => {
    const body = activeTab().body;

    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  });

  /*
   * Cookies
   */
  const cookies = createMemo(() => {
    const response = activeTab().response;

    if (!response) {
      return [];
    }

    const setCookie = response.headers["set-cookie"];

    if (!setCookie) {
      return [];
    }

    const cookieLines = Array.isArray(setCookie) ? setCookie : [setCookie];

    return cookieLines.map((line: string) => {
      const [pair, ...attrs] = line.split(";");

      const [name, ...valueParts] = pair.split("=");

      return {
        name: name?.trim(),
        value: valueParts.join("=").trim(),
        attributes: attrs.map((a) => a.trim()),
      };
    });
  });

  /*
   * Update active tab
   */
  const updateActiveTab = async (updater: (tab: RequestTab) => RequestTab) => {
    const tab = activeTab();

    if (!tab) {
      return;
    }

    await updateTab(props.collection, updater(tab));
  };

  /*
   * Set initial active tab
   */
  onMount(() => {
    const currentTabs = tabs();
    const lastOpendTab = lastTab();
    if (lastOpendTab && lastOpendTab.group == props.collection) {
      setActiveTabId(lastOpendTab.tabId);
      return;
    }

    if (currentTabs.length > 0) {
      setActiveTabId(currentTabs[0].id);
    }
  });

  createEffect(
    on(
      () => lastTab()?.tabId,
      (id) => {
        if (!id) {
          return;
        }
        setActiveTabId(id);
      },
    ),
  );

  /*
   * Body type → Content-Type header
   */

  const updateBodyType = async (format: BodyType) => {
    await updateActiveTab((tab) => {
      // Remove existing Content-Type
      const headers = tab.headers.filter(
        (header) => header.name.toLowerCase() !== "content-type",
      );

      if (format === "none") {
        return {
          ...tab,
          bodyType: "none",
          headers,
        };
      }

      const contentTypeMap: Record<Exclude<BodyType, "none">, string> = {
        json: "application/json",
        text: "text/plain",
        xml: "application/xml",
      };

      return {
        ...tab,
        bodyType: format,
        headers: [
          ...headers,
          {
            id: Date.now(),
            name: "Content-Type",
            value: contentTypeMap[format],
          },
        ],
      };
    });
  };

  /*
   * Drag splitter
   */
  onMount(() => {
    if (!containerRef) {
      return;
    }

    const container = containerRef;

    const move = (e: PointerEvent) => {
      if (!isDragging) {
        return;
      }

      const rect = container.getBoundingClientRect();

      const vertical = isVertical();

      const percent = vertical
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;

      if (percent > 20 && percent < 80) {
        setLeftWidth(percent);
      }
    };

    const up = () => {
      isDragging = false;
      document.body.style.cursor = "";
    };

    container.addEventListener("pointermove", move);

    container.addEventListener("pointerup", up);

    onCleanup(() => {
      container.removeEventListener("pointermove", move);

      container.removeEventListener("pointerup", up);
    });
  });

  /*
   * Add tab
   */
  const addTabLocal = async () => {
    const currentTabs = tabs();

    let lastNumber = 0;

    if (currentTabs.length > 0) {
      const lastTab = currentTabs[currentTabs.length - 1];

      const number = Number(lastTab.name.split(" ")[1]);

      if (!Number.isNaN(number)) {
        lastNumber = number;
      }
    }

    const tab: RequestTab = {
      id: crypto.randomUUID(),
      name: `Request ${lastNumber + 1}`,
      method: "GET",
      url: "",
      headers: [],
      body: "",
      bodyType: "none",
      response: null,
      error: null,
      loading: false,
    };

    await addStoreTab(props.collection, tab);
    setActiveTabId(tab.id);
  };

  /*
   * Close tab
   */
  const closeTab = async (id: string) => {
    await removeTab(props.collection, id);
  };

  /*
   * Send request
   */
  const handleSubmit = async (e: SubmitEvent) => {
    e.preventDefault();

    const tab = activeTab();

    setLastTabOpened({ group: props.collection, tabId: tab.id });

    await updateActiveTab((t) => ({
      ...t,
      loading: true,
      error: null,
      response: null,
    }));

    try {
      const cookieHeader = cookies()
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      const url = tab.url.startsWith("http") ? tab.url : `https://${tab.url}`;

      const headers = cookieHeader
        ? [
            ...tab.headers,
            {
              id: Date.now(),
              name: "Cookie",
              value: cookieHeader,
            },
          ]
        : tab.headers;

      const res = (await sendRequest(
        tab.method,
        url,
        headers,
        tab.method === "GET" ? null : tab.body,
      )) as ResponseData;

      console.log(res);

      await updateActiveTab((t) => ({
        ...t,
        response: res,
        error: null,
        loading: false,
      }));
    } catch (err: any) {
      await updateActiveTab((t) => ({
        ...t,
        error: String(err),
        loading: false,
      }));
    }
  };

  /*
   * Header operations
   */
  const addHeaderRow = async () => {
    await updateActiveTab((tab) => ({
      ...tab,
      headers: [
        ...tab.headers,
        {
          id: Date.now(),
          name: "",
          value: "",
          isCustom: true,
        },
      ],
    }));
  };

  const updateHeader = async (
    id: number,
    key: "name" | "value",
    value: string,
  ) => {
    await updateActiveTab((tab) => ({
      ...tab,
      headers: tab.headers.map((header) =>
        header.id === id
          ? {
              ...header,
              [key]: value,
            }
          : header,
      ),
    }));
  };

  const removeHeader = async (id: number) => {
    await updateActiveTab((tab) => ({
      ...tab,
      headers: tab.headers.filter((header) => header.id !== id),
    }));
  };

  return (
    <div
      ref={containerRef}
      class="flex flex-col h-screen min-h-screen w-full overflow-hidden"
    >
      {/* TABS */}
      <div class="flex items-center gap-1 px-2 border-b border-zinc-800 bg-zinc-900 overflow-x-auto overflow-y-hidden shrink-0 min-h-9">
        <For each={tabs()}>
          {(tab) => (
            <div
              onDblClick={() => {
                setEditingName(tab.name);
                setEditingTabId(tab.id);
              }}
              onClick={() => {
                setActiveTabId(tab.id);
                // setLastTabOpened({ group: props.collection, tabId: tab.id });
              }}
              class={`flex shrink-0 items-center gap-2 px-3 py-1 text-xs rounded-t cursor-pointer whitespace-nowrap ${
                tab.id === activeTabId()
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"
              }`}
            >
              <Show when={editingTabId() === tab.id} fallback={tab.name}>
                <input
                  autofocus
                  value={editingName()}
                  onInput={(e) => {
                    setEditingName(e.currentTarget.value);
                  }}
                  onBlur={async () => {
                    await renameTab(props.collection, tab.id, editingName());

                    setEditingTabId(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.currentTarget.blur();
                    }

                    if (e.key === "Escape") {
                      setEditingTabId(null);
                    }
                  }}
                  onClick={(e) => e.stopPropagation()}
                  class="w-20 bg-transparent outline-none text-white"
                />
              </Show>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                class="flex h-5 w-5 shrink-0 items-center justify-center rounded text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                title="Close tab"
              >
                <FiX size={13} />
              </button>
            </div>
          )}
        </For>

        {/* PLUS */}
        <button
          onClick={async () => {
            await addTabLocal();
          }}
          class="ml-2 shrink-0 px-1 text-zinc-400 hover:text-emerald-400"
          title="New request"
        >
          <HiSolidPlus class="text-green-500 text-xl" />
        </button>
      </div>

      {/* MAIN */}
      <div
        class={`h-full flex ${isVertical() ? "flex-row" : "flex-col"} ${
          tabs().length === 0 ? "opacity-50" : ""
        }`}
      >
        {/* REQUEST */}
        <RequestSection
          leftWidth={leftWidth()}
          handleSubmit={handleSubmit}
          activeTab={activeTab()}
          updateActiveTab={updateActiveTab}
          METHOD_COLOR={METHOD_COLOR}
          setShowHeaders={setShowHeaders}
          showHeaders={showHeaders()}
          bodyFormat={bodyFormat()}
          COMMON_HEADERS={COMMON_HEADERS}
          removeHeader={removeHeader}
          addHeaderRow={addHeaderRow}
          updateHeader={updateHeader}
          parsedBody={parsedBody()}
          updateBodyType={updateBodyType}
        />

        {/* SPLITTER */}
        <div
          onPointerDown={(e) => {
            e.preventDefault();

            isDragging = true;

            document.body.style.cursor = isVertical()
              ? "col-resize"
              : "row-resize";
          }}
          class={`relative touch-none bg-zinc-800 hover:bg-emerald-500/60 ${
            isVertical()
              ? "h-full w-2 cursor-col-resize"
              : "h-2 w-full cursor-row-resize"
          }`}
          style={{
            "touch-action": "none",
          }}
        >
          <button
            type="button"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setIsVertical((value) => !value)}
            class="absolute z-20 flex h-7 w-7 items-center justify-center rounded bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            title={isVertical() ? "Horizontal split" : "Vertical split"}
          >
            <FaSolidRotate
              class={`transition-transform duration-300 ease-in-out ${
                isVertical() ? "rotate-90" : "rotate-0"
              }`}
            />
          </button>

          <div
            class={
              isVertical()
                ? "absolute inset-x-[-8px] inset-y-0"
                : "absolute inset-y-[-8px] inset-x-0"
            }
          />
        </div>

        {/* RESPONSE */}
        <ResponseSection
          leftWidth={leftWidth()}
          activeTab={activeTab()}
          activeResponseTab={activeResponseTab()}
          cookies={cookies()}
          setActiveResponseTab={setActiveResponseTab}
        />
      </div>
    </div>
  );
}
