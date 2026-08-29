"use client";

import { useStore } from "@/context/StoreContext";
import { sendRequest } from "@/utill/Request";
import { ResponseData } from "@/utill/types";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import { FiPlus, FiX } from "react-icons/fi";
import { PiDeviceRotateFill } from "react-icons/pi";

type HeaderRow = {
  id: number;
  name: string;
  value: string;
  isCustom?: boolean;
};
type BodyType = "none" | "json" | "text" | "xml";

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

export function ApiTester({ collection }: { collection: string }) {
  const {
    tabs: tabGroups,
    addTab: addStoreTab,
    updateTab,
    removeTab,
    renameTab,
  } = useStore();

  const tabs = tabGroups[collection] ?? [];

  const [showHeaders, setShowHeaders] = useState(true);
  const [editingTabId, setEditingTabId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [isVertical, setIsVertical] = useState<boolean>(false);

  const [activeResponseTab, setActiveResponseTab] = useState<
    "body" | "headers" | "cookies" | null
  >("body");

  const [activeTabId, setActiveTabId] = useState<string | null>(
    tabs[0]?.id ?? null,
  );

  const activeTab = useMemo(
    () =>
      tabs.find((t) => t.id === activeTabId) ?? {
        id: crypto.randomUUID(),
        name: "",
        method: "GET",
        url: "",
        headers: [],
        body: "",
        bodyType: "none" as BodyType,
        response: null,
        error: null,
        loading: false,
      },
    [tabs, activeTabId],
  );

  const [bodyFormat, setBodyFormat] = useState<BodyType>(
    activeTab.bodyType as BodyType,
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

    const cookieLines = Array.isArray(setCookie) ? setCookie : [setCookie];

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
    const move = (e: PointerEvent) => {
      if (!isDragging.current || !containerRef.current) return;

      const rect = containerRef.current.getBoundingClientRect();

      const percent = isVertical
        ? ((e.clientX - rect.left) / rect.width) * 100
        : ((e.clientY - rect.top) / rect.height) * 100;

      if (percent > 20 && percent < 80) {
        setLeftWidth(percent);
      }
    };

    const up = () => {
      isDragging.current = false;
      document.body.style.cursor = "";
    };

    const container = containerRef.current;

    if (!container) return;

    container.addEventListener("pointermove", move);
    container.addEventListener("pointerup", up);

    return () => {
      container.removeEventListener("pointermove", move);
      container.removeEventListener("pointerup", up);
    };
  }, [isVertical]);

  useEffect(() => {
    updateActiveTab((tab) => {
      // Remove existing Content-Type header
      const headers = tab.headers.filter(
        (h) => h.name.toLowerCase() !== "content-type",
      );

      // None = don't add Content-Type
      if (bodyFormat === "none") {
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
        bodyType: bodyFormat,
        headers: [
          ...headers,
          {
            id: Date.now(),
            name: "Content-Type",
            value: contentTypeMap[bodyFormat],
          },
        ],
      };
    });
  }, [bodyFormat]);

  const addTabLocal = () => {
    let lastNumber = 0;
    if (tabs.length > 0) {
      const lasttabs = tabs[tabs.length - 1];
      lastNumber = Number(lasttabs.name.split(" ")[1]);
    }
    const tab: RequestTab = {
      id: crypto.randomUUID(),
      name: `Request ${lastNumber + 1}`,
      method: "GET",
      url: "",
      headers: [],
      body: "",
      bodyType: "none" as BodyType,
      response: null,
      error: null,
      loading: false,
    };

    addStoreTab(collection, tab);
    setActiveTabId(tab.id);
  };

  const closeTab = (id: string) => {
    removeTab(collection, id);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    updateActiveTab((t) => ({
      ...t,
      loading: true,
      error: null,
      response: null,
    }));

    try {
      const cookieHeader = cookies
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");

      const url = activeTab.url.startsWith("http")
        ? activeTab.url
        : `https://${activeTab.url}`;
      const res = (await sendRequest(
        activeTab.method,
        url,
        cookieHeader
          ? [
              ...activeTab.headers,
              {
                name: "Cookie",
                value: cookieHeader,
              },
            ]
          : activeTab.headers,
        activeTab.method === "GET" ? null : activeTab.body,
      )) as ResponseData;

      updateActiveTab((t) => ({
        ...t,
        response: res,
        error: null,
        loading: false,
      }));
    } catch (err: any) {
      updateActiveTab((t) => ({
        ...t,
        error: String(err),
        loading: false,
      }));
    }
  };

  const addHeaderRow = () =>
    updateActiveTab((t) => ({
      ...t,
      headers: [
        ...t.headers,
        { id: Date.now(), name: "", value: "", isCustom: true },
      ],
    }));

  const updateHeader = (id: number, key: "name" | "value", value: string) =>
    updateActiveTab((t) => ({
      ...t,
      headers: t.headers.map((h) => (h.id === id ? { ...h, [key]: value } : h)),
    }));

  const removeHeader = (id: number) =>
    updateActiveTab((t) => ({
      ...t,
      headers: t.headers.filter((h) => h.id !== id),
    }));

  const updateActiveTab = (updater: (t: RequestTab) => RequestTab) => {
    if (!activeTab) return;
    updateTab(collection, updater(activeTab));
  };

  useEffect(() => {
    if (!tabs.length) {
      setActiveTabId(null);
      return;
    }
    const currentTap = tabs.find((t) => t.id === activeTabId);
    if (!currentTap) {
      setActiveTabId(tabs[0].id);
      setBodyFormat(tabs[0].bodyType);
    } else {
      setBodyFormat(currentTap.bodyType);
    }
  }, [tabs, activeTabId]);

  return (
    <>
      <div
        ref={containerRef}
        className="flex flex-col h-screen min-h-screen w-full overflow-hidden"
      >
        <div className="flex items-center gap-1 px-2 border-b border-zinc-800 bg-zinc-900 overflow-y-scroll">
          {tabs.map((tab) => (
            <div
              key={tab.id}
              onDoubleClick={() => {
                setEditingName(tab.name);
                setEditingTabId(tab.id);
              }}
              onClick={() => {
                setActiveTabId(tab.id);
              }}
              className={`flex items-center gap-2 px-3 py-1 text-xs rounded-t cursor-pointer
  whitespace-nowrap text-ellipsis
  ${
    tab.id === activeTabId
      ? "bg-zinc-800 text-white"
      : "bg-zinc-900 text-zinc-400 hover:text-white"
  }
`}
            >
              {editingTabId === tab.id ? (
                <input
                  autoFocus
                  value={editingName}
                  onChange={(e) => {
                    setEditingName(e.target.value);
                  }}
                  onBlur={() => {
                    renameTab(collection, tab.id, editingName);

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
                  className="w-20 bg-transparent outline-none text-white"
                />
              ) : (
                tab.name
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  closeTab(tab.id);
                }}
                className="flex h-5 w-5 items-center justify-center rounded text-zinc-500 transition hover:bg-red-500/10 hover:text-red-400"
                title="Close tab"
              >
                <FiX size={13} />
              </button>
            </div>
          ))}

          <button
            onClick={addTabLocal}
            className="ml-2 text-zinc-400 hover:text-emerald-400"
          >
            <CiSquarePlus className="text-green-500 text-xl" />
          </button>
        </div>
        <div
          className={`h-full flex ${isVertical ? "flex-row" : "flex-col"} ${tabs.length === 0 && "opacity-50"}`}
        >
          {/* REQUEST */}
          <section
            className="overflow-y-auto overflow-x-hidden p-4 space-y-4 flex-1 min-h-0"
            style={{ flexBasis: `${leftWidth}%` }}
          >
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Sticky bar */}
              <div className="sticky top-0 z-10 bg-zinc-900/80 backdrop-blur border-b border-zinc-800 pb-2 flex gap-2">
                <select
                  value={activeTab.method}
                  onChange={(e) =>
                    updateActiveTab((t) => ({
                      ...t,
                      method: e.target.value,
                    }))
                  }
                  className={`appearance-none bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-sm font-semibold ${METHOD_COLOR[activeTab.method]}`}
                >
                  {["GET", "POST", "PUT", "DELETE", "PATCH"].map((m) => (
                    <option className={`${METHOD_COLOR[m]}`} key={m}>
                      {m}
                    </option>
                  ))}
                </select>

                <input
                  value={activeTab.url}
                  onChange={(e) =>
                    updateActiveTab((t) => ({
                      ...t,
                      url: e.target.value,
                    }))
                  }
                  className="flex-1 min-w-0 bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm"
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
                    <div
                      key={h.id}
                      className={`flex gap-2 mb-2 overflow-x-scroll ${h.name === "Content-Type" && bodyFormat !== "none" && "opacity-50 pointer-events-none"}`}
                    >
                      <select
                        value={h.isCustom ? "Custom" : h.name}
                        onChange={(e) => {
                          const v = e.target.value;

                          updateActiveTab((tab) => ({
                            ...tab,
                            headers: tab.headers.map((hdr) =>
                              hdr.id === h.id
                                ? {
                                    ...hdr,
                                    name: v === "Custom" ? "" : v,
                                    isCustom: v === "Custom",
                                  }
                                : hdr,
                            ),
                          }));
                        }}
                        className="w-40 appearance-none bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
                      >
                        {COMMON_HEADERS.filter((header) => {
                          // Always show the currently selected header
                          if (header === h.name) return true;

                          // Don't show headers already used by another row
                          return !activeTab.headers.some(
                            (existing) =>
                              existing.id !== h.id &&
                              existing.name.toLowerCase() ===
                                header.toLowerCase(),
                          );
                        }).map((header, i) => (
                          <option key={i} value={header}>
                            {header}
                          </option>
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
                        className="flex h-6 w-6 items-center justify-center rounded text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                        title="Remove header"
                      >
                        <FiX size={14} />
                      </button>
                    </div>
                  ))}

                <button
                  type="button"
                  onClick={addHeaderRow}
                  className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
                >
                  <FiPlus size={14} />
                  Add header
                </button>
              </div>

              {/* BODY */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-zinc-400">
                    Body
                  </label>

                  <select
                    value={bodyFormat ?? "none"}
                    onChange={(e) => {
                      setBodyFormat(e.target.value as BodyType);
                      updateActiveTab((t) => ({
                        ...t,
                        bodyType: e.target.value as BodyType,
                      }));
                    }}
                    disabled={activeTab.method === "GET"}
                    className="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-500 disabled:opacity-50"
                  >
                    <option value="none">None</option>
                    <option value="json">JSON</option>
                    <option value="text">Text</option>
                    <option value="xml">XML</option>
                  </select>
                </div>

                <textarea
                  disabled={
                    activeTab.method === "GET" || activeTab.bodyType === "none"
                  }
                  value={parsedBody}
                  onChange={(e) => {
                    setBodyFormat(e.target.value as BodyType);
                    updateActiveTab((t) => ({
                      ...t,
                      body: e.target.value,
                    }));
                  }}
                  rows={10}
                  placeholder={
                    activeTab.bodyType === "json"
                      ? '{\n  "name": "John",\n  "age": 25\n}'
                      : activeTab.bodyType === "xml"
                        ? "<user>\n  <name>John</name>\n</user>"
                        : "Entry body"
                  }
                  className={`w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 text-xs font-mono outline-none focus:border-zinc-500 ${
                    activeTab.method === "GET" || activeTab.bodyType === "none"
                      ? "cursor-not-allowed opacity-50"
                      : ""
                  }`}
                />
              </div>

              {activeTab.error && (
                <p className="text-xs text-red-400 border border-red-900 rounded-md px-3 py-2">
                  {activeTab.error}
                </p>
              )}
            </form>
          </section>

          {/* SPLITTER */}
          <div
            onPointerDown={(e) => {
              e.preventDefault();
              isDragging.current = true;
              document.body.style.cursor = isVertical
                ? "col-resize"
                : "row-resize";
            }}
            className={`relative touch-none bg-zinc-800 hover:bg-emerald-500/60 ${
              isVertical
                ? "h-full w-2 cursor-col-resize"
                : "h-2 w-full cursor-row-resize"
            }`}
            style={{ touchAction: "none" }}
          >
            {/* Toggle button */}
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={() => setIsVertical((v) => !v)}
              className="absolute z-20 flex h-7 w-7 items-center justify-center rounded
  bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white
  left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
              title={isVertical ? "Horizontal split" : "Vertical split"}
            >
              <PiDeviceRotateFill
                className={`transition-transform duration-300 ease-in-out ${
                  isVertical ? "rotate-90" : "rotate-0"
                }`}
              />
            </button>

            {/* Larger drag area */}
            <div
              className={
                isVertical
                  ? "absolute inset-x-[-8px] inset-y-0"
                  : "absolute inset-y-[-8px] inset-x-0"
              }
            />
          </div>

          {/* RESPONSE */}
          <section
            className="p-4 bg-zinc-950 flex flex-col overflow-hidden flex-1 min-h-0"
            style={{ flexBasis: `${100 - leftWidth}%` }}
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
                    className={`px-2 py-0.5 rounded-full text-[10px] ${
                      activeTab.response.status < 300
                        ? "bg-emerald-900 text-emerald-300"
                        : "bg-red-900 text-red-300"
                    }`}
                  >
                    {activeTab.response.status}
                  </span>
                  {activeTab.response.status_text} ·{" "}
                  {activeTab.response.duration_ms} ms
                </p>

                {/* Tabs */}
                <div className="flex gap-2 mb-2">
                  <button
                    onClick={() =>
                      setActiveResponseTab(
                        activeResponseTab === "body" ? null : "body",
                      )
                    }
                    className={`px-3 py-1 text-xs rounded ${
                      activeResponseTab === "body"
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    Body
                  </button>

                  <button
                    onClick={() =>
                      setActiveResponseTab(
                        activeResponseTab === "headers" ? null : "headers",
                      )
                    }
                    className={`px-3 py-1 text-xs rounded ${
                      activeResponseTab === "headers"
                        ? "bg-zinc-800 text-white"
                        : "bg-zinc-900 text-zinc-400"
                    }`}
                  >
                    Headers
                  </button>
                  <button
                    onClick={() =>
                      setActiveResponseTab(
                        activeResponseTab === "cookies" ? null : "cookies",
                      )
                    }
                    className={`px-3 py-1 text-xs rounded ${
                      activeResponseTab === "cookies"
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
                    {/* {formatBody(activeTab.response.body)} */}

                    {activeTab.response.body.toString()}
                  </pre>

                  {/* HEADERS */}
                  <div
                    className={`absolute inset-0 bg-zinc-900 border border-zinc-800 rounded-md p-3 text-xs overflow-auto space-y-1
      ${activeResponseTab === "headers" ? "block" : "hidden"}`}
                  >
                    {Object.entries(activeTab.response.headers).map(
                      ([key, value]) => (
                        <div key={key} className="flex gap-2">
                          <span className="text-zinc-400 min-w-[140px]">
                            {key}
                          </span>
                          <span className="break-all">{value}</span>
                        </div>
                      ),
                    )}
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
      </div>
    </>
  );
}

// function formatBody(body: string) {
//   try {
//     return JSON.stringify(JSON.parse(body), null, 2);
//   } catch {
//     return body;
//   }
// }
