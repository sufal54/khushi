import { SetStateAction } from "react";
import { RequestTab } from "./Container";

type ResponseSectionProps = {
  leftWidth: number;
  activeTab: RequestTab;
  activeResponseTab: "body" | "headers" | "cookies" | null;
  cookies: {
    name: any;
    value: any;
    attributes: any;
  }[];
  setActiveResponseTab: (
    value: SetStateAction<"body" | "headers" | "cookies" | null>,
  ) => void;
};

export default function ResponseSection({
  leftWidth,
  activeTab,
  activeResponseTab,
  setActiveResponseTab,
  cookies,
}: ResponseSectionProps) {
  return (
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
            {activeTab.response.status_text} · {activeTab.response.duration_ms}{" "}
            ms
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
                    <span className="text-zinc-400 min-w-[140px]">{key}</span>
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
  );
}
