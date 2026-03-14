"use client";

import { useStore } from "@/context/StoreContext";
import { invoke } from "@tauri-apps/api/core";
import {
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";


type HeaderRow = {
  id: number;
  name: string;
  value: string;
  isCustom?: boolean;
};

type ResponseData = {
  status: number;
  status_text: string;
  headers: Record<string, string>;
  body: string;
  duration_ms: number;
};

export type RequestTab = {
  id: string;
  name: string;

  method: string;
  url: string;
  headers: HeaderRow[];
  body: string;

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
  "GET": "text-emerald-400",
  "POST": "text-blue-400",
  "PUT": "text-yellow-400",
  "DELETE": "text-red-400",
  "PATCH": "text-purple-400",
};

export function ApiTester() {
  const { tabs: tabGroups, addTab: addStoreTab, updateTab, removeTab } = useStore();

  const GROUP = "tabs";
  const tabs = tabGroups[GROUP] ?? [];



  const [showHeaders, setShowHeaders] = useState(true);
  const [activeResponseTab, setActiveResponseTab] = useState<"body" | "headers" | "cookies" | null>("body");


  const [activeTabId, setActiveTabId] = useState<string | null>(
    tabs[0]?.id ?? null
  );


  const activeTab = useMemo(
    () => tabs.find(t => t.id === activeTabId) ?? {
      id: crypto.randomUUID(),
      name: "Request 1",
      method: "GET",
      url: "https://jsonplaceholder.typicode.com/posts/1",
      headers: [],
      body: "",
      response: null,
      error: null,
      loading: false,
    },
    [tabs, activeTabId]
  );



  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const [leftWidth, setLeftWidth] = useState(50);


  const isTauri = typeof window !== "undefined" && "__TAURI__" in window;


  const parsedBody = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(activeTab.body), null, 2);
    } catch {
      return activeTab.body;
    }
  }, [activeTab.body]);

  const cookies = useMemo(() => {
    if (!activeTab.response) return [];

    const setCookie = activeTab.response.headers["set-cookie"];
    if (!setCookie) return [];

    const cookieLines = Array.isArray(setCookie)
      ? setCookie
      : [setCookie];

    return cookieLines.map((line) => {
      const [pair, ...attrs] = line.split(";");
      const [name, value] = pair.split("=");

      return {
        name: name?.trim(),
        value: value?.trim(),
        attributes: attrs.map((a: any) => a.trim()),
      };
    });
  }, [activeTab.response]);

  useEffect(() => {
    if (tabs.length === 0) {
      const tab: RequestTab = {
        id: crypto.randomUUID(),
        name: "Request 1",
        method: "GET",
        url: "https://jsonplaceholder.typicode.com/posts/1",
        headers: [],
        body: "",
        response: null,
        error: null,
        loading: false,
      };

      addStoreTab(GROUP, tab);
      setActiveTabId(tab.id);
    }
  }, [tabs.length]);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();
      const percent = ((e.clientY - rect.top) / rect.height) * 100;

      if (percent > 20 && percent < 80) {
        setLeftWidth(percent);
      }
    };

    const onUp = () => {
      isDragging.current = false;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);


  const addTabLocal = () => {
    const tab: RequestTab = {
      id: crypto.randomUUID(),
      name: `Request ${tabs.length + 1}`,
      method: "GET",
      url: "",
      headers: [],
      body: "",
      response: null,
      error: null,
      loading: false,
    };

    addStoreTab(GROUP, tab);
    setActiveTabId(tab.id);
  };

  const closeTab = (id: string) => {
    removeTab(GROUP, id);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    updateActiveTab(t => ({
      ...t,
      loading: true,
      error: null,
      response: null
    }));

    try {
      const res = await invoke("send_request", {
        method: activeTab.method,
        url: activeTab.url,
        headers: activeTab.headers,
        body: activeTab.method === "GET" ? null : activeTab.body,
      }) as ResponseData;

      updateActiveTab(t => ({
        ...t,
        response: res,
        loading: false
      }));
    } catch (err: any) {
      updateActiveTab(t => ({
        ...t,
        error: String(err),
        loading: false
      }));
    }
  };
  const addHeaderRow = () =>
    updateActiveTab(t => ({
      ...t,
      headers: [
        ...t.headers,
        { id: Date.now(), name: "", value: "", isCustom: true }
      ]
    }));

  const updateHeader = (id: number, key: "name" | "value", value: string) =>
    updateActiveTab(t => ({
      ...t,
      headers: t.headers.map(h =>
        h.id === id ? { ...h, [key]: value } : h
      )
    }));

  const removeHeader = (id: number) =>
    updateActiveTab(t => ({
      ...t,
      headers: t.headers.filter(h => h.id !== id)
    }));
  const updateActiveTab = (updater: (t: RequestTab) => RequestTab) => {
    if (!activeTab) return;
    updateTab(GROUP, updater(activeTab));
  };


  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId(null);
      return;
    }

    if (!tabs.find(t => t.id === activeTabId)) {
      setActiveTabId(tabs[0].id);
    }
  }, [tabs, activeTabId]);
  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col h-full w-full overflow-hidden"
      >
        <div className="flex items-center gap-1 px-2 border-b border-zinc-800 bg-zinc-900">
          {tabs.map(tab => (
            <div
              key={tab.id}
              onClick={() => {
                setActiveTabId(tab.id);
              }}
              className={`flex items-center gap-2 px-3 py-1 text-xs rounded-t cursor-pointer
        ${tab.id === activeTabId
                  ? "bg-zinc-800 text-white"
                  : "bg-zinc-900 text-zinc-400 hover:text-white"}
      `}
            >
              {tab.name}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="hover:text-red-400"
              >
                ✕
              </button>
            </div>
          ))}

          <button
            onClick={addTabLocal}
            className="ml-2 px-2 text-zinc-400 hover:text-emerald-400"
          >
            ＋
          </button>
        </div>
        {/* REQUEST */}
        <section
          style={{ height: `${leftWidth}%` }}
          className="h-full overflow-auto p-4 space-y-4"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Sticky bar */}
            <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 pb-2 flex gap-2">
              <select
                value={activeTab.method}
                onChange={(e) =>
                  updateActiveTab(t => ({
                    ...t,
                    method: e.target.value
                  }))
                }
                className={`appearance-none bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm font-semibold ${METHOD_COLOR[activeTab.method]}`}
              >
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                  <option className={`${METHOD_COLOR[m]}`} key={m}>{m}</option>
                ))}

              </select>

              <input
                value={activeTab.url}
                onChange={(e) =>
                  updateActiveTab(t => ({
                    ...t,
                    url: e.target.value
                  }))
                }
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"
              />

              <button
                type="submit"
                disabled={activeTab.loading}
                className="px-4 py-1.5 rounded-md bg-emerald-500 text-sm text-zinc-950 flex items-center gap-2"
              >
                {activeTab.loading && (
                  <span className="h-4 w-4 border-2 border-zinc-900 border-t-transparent rounded-full animate-spin" />
                )}
                Send
              </button>
            </div>

            {/* HEADERS */}
            <div>
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-xs text-zinc-400 uppercase">Headers</h2>
                <button
                  type="button"
                  onClick={() => setShowHeaders(!showHeaders)}
                  className="text-xs text-emerald-400"
                >
                  {showHeaders ? "Hide" : "Show"}
                </button>
              </div>

              {showHeaders &&
                activeTab.headers.map((h) => (
                  <div key={h.id} className="flex gap-2 mb-2">
                    <select
                      value={h.isCustom ? "Custom" : h.name}
                      onChange={(e) => {
                        const v = e.target.value;

                        updateActiveTab(tab => ({
                          ...tab,
                          headers: tab.headers.map(hdr =>
                            hdr.id === h.id
                              ? {
                                ...hdr,
                                name: v === "Custom" ? "" : v,
                                isCustom: v === "Custom",
                              }
                              : hdr
                          )
                        }));
                      }}
                      className="w-40 appearance-none bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
                    >
                      {COMMON_HEADERS.map((o) => (
                        <option key={o}>{o}</option>
                      ))}
                    </select>

                    {h.isCustom && (
                      <input
                        value={h.name}
                        onChange={(e) =>
                          updateHeader(h.id, "name", e.target.value)
                        }
                        placeholder="Key"
                        className="w-40 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
                      />
                    )}

                    <input
                      value={h.value}
                      onChange={(e) =>
                        updateHeader(h.id, "value", e.target.value)
                      }
                      placeholder="Value"
                      className="flex-1 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
                    />

                    <button
                      type="button"
                      onClick={() => removeHeader(h.id)}
                      className="text-zinc-500 hover:text-red-400"
                    >
                      ✕
                    </button>
                  </div>
                ))}

              <button
                type="button"
                onClick={addHeaderRow}
                className="text-xs text-emerald-400"
              >
                + Add header
              </button>
            </div>

            {/* BODY */}
            <textarea
              disabled={activeTab.method === "GET"}
              value={parsedBody}
              onChange={(e) =>
                updateActiveTab(t => ({
                  ...t,
                  body: e.target.value
                }))
              }
              rows={10}
              className={`w-full bg-zinc-900 border border-zinc-700 rounded-md px-3 py-2 text-xs font-mono ${activeTab.method === "GET" ? "opacity-50" : ""
                }`}
            />



            {activeTab.error && (
              <p className="text-xs text-red-400 border border-red-900 rounded-md px-3 py-2">
                {activeTab.error}
              </p>
            )}
          </form>
        </section>

        {/* SPLITTER */}
        <div
          onMouseDown={() => {
            isDragging.current = true;
            document.body.style.cursor = "row-resize";
          }}
          className="relative h-1 w-full cursor-row-resize bg-zinc-800 hover:bg-emerald-500/60"
        >
          <div className="absolute inset-y-[-6px] inset-x-0" />
        </div>

        {/* RESPONSE */}
        <section
          style={{ height: `${100 - leftWidth}%` }}
          className="h-full p-4 bg-zinc-950 flex flex-col overflow-hidden"
        >
          <h2 className="text-xs text-zinc-400 uppercase mb-2">Response</h2>

          {!activeTab.response && (
            <p className="text-xs text-zinc-500">No response yet</p>
          )}

          {activeTab.response && (
            <>
              {/* Status bar */}
              <p className="text-xs mb-3 flex items-center gap-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab.response.status < 300
                    ? "bg-emerald-900 text-emerald-300"
                    : "bg-red-900 text-red-300"
                    }`}
                >
                  {activeTab.response.status}
                </span>
                {activeTab.response.status_text} · {activeTab.response.duration_ms} ms
              </p>

              {/* Tabs */}
              <div className="flex gap-2 mb-2">
                <button
                  onClick={() =>
                    setActiveResponseTab(activeResponseTab === "body" ? null : "body")
                  }
                  className={`px-3 py-1 text-xs rounded ${activeResponseTab === "body"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-900 text-zinc-400"
                    }`}
                >
                  Body
                </button>

                <button
                  onClick={() =>
                    setActiveResponseTab(activeResponseTab === "headers" ? null : "headers")
                  }
                  className={`px-3 py-1 text-xs rounded ${activeResponseTab === "headers"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-900 text-zinc-400"
                    }`}
                >
                  Headers
                </button>
                <button
                  onClick={() =>
                    setActiveResponseTab(activeResponseTab === "cookies" ? null : "cookies")
                  }
                  className={`px-3 py-1 text-xs rounded ${activeResponseTab === "cookies"
                    ? "bg-zinc-800 text-white"
                    : "bg-zinc-900 text-zinc-400"
                    }`}
                >
                  Cookies
                </button>
              </div>

              <div className="relative flex-1 min-h-0">
                {/* BODY */}
                <pre
                  className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-xs overflow-auto
      ${activeResponseTab === "body" ? "block" : "hidden"}`}
                >
                  {formatBody(activeTab.response.body)}
                </pre>

                {/* HEADERS */}
                <div
                  className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-xs overflow-auto space-y-1
      ${activeResponseTab === "headers" ? "block" : "hidden"}`}
                >
                  {Object.entries(activeTab.response.headers).map(([key, value]) => (
                    <div key={key} className="flex gap-2">
                      <span className="text-zinc-400 min-w-[140px]">{key}</span>
                      <span className="break-all">{value}</span>
                    </div>
                  ))}
                </div>

                {/* COOKIES */}
                <div
                  className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-xs overflow-auto
      ${activeResponseTab === "cookies" ? "block" : "hidden"}`}
                >
                  {cookies.length === 0 ? (
                    <p className="text-zinc-500">No cookies received</p>
                  ) : (
                    cookies.map((c, i) => (
                      <div key={i} className="space-y-1">
                        <div>Name: {c.name}</div>
                        <div>Value: {c.value}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </section>
      </div>

      {/* MOBILE STACKED */}
      <div className="md:hidden flex flex-col">
        <p className="text-xs text-zinc-500 p-4">
          Resize available on desktop
        </p>
      </div>
    </>
  );
}

function formatBody(body: string) {
  try {
    return JSON.stringify(JSON.parse(body), null, 2);
  } catch {
    return body;
  }
}