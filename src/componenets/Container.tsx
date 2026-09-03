"use client";

import { useStore } from "@/context/StoreContext";
import { sendRequest } from "@/utill/Request";
import { ResponseData } from "@/utill/types";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { CiSquarePlus } from "react-icons/ci";
import { FiX } from "react-icons/fi";
import { PiDeviceRotateFill } from "react-icons/pi";
import { RequestSection } from "./RequestSection";
import ResponseSection from "./RespnseSection";

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

export function Container({ collection }: { collection: string }) {
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

  // const [bodyFormat, setBodyFormat] = useState<BodyType>(
  //   activeTab.bodyType as BodyType,
  // );

  const bodyFormat = useMemo(() => {
    return activeTab.bodyType || "none";
  }, [activeTab.bodyType]);

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
          <RequestSection
            leftWidth={leftWidth}
            handleSubmit={handleSubmit}
            activeTab={activeTab}
            updateActiveTab={updateActiveTab}
            METHOD_COLOR={METHOD_COLOR}
            setShowHeaders={setShowHeaders}
            showHeaders={showHeaders}
            bodyFormat={bodyFormat}
            COMMON_HEADERS={COMMON_HEADERS}
            removeHeader={removeHeader}
            addHeaderRow={addHeaderRow}
            updateHeader={updateHeader}
            parsedBody={parsedBody}
          />

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
          <ResponseSection
            leftWidth={leftWidth}
            activeTab={activeTab}
            activeResponseTab={activeResponseTab}
            cookies={cookies}
            setActiveResponseTab={setActiveResponseTab}
          />
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
