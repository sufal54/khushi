import { FormEvent, SetStateAction } from "react";
import { BodyType, RequestTab } from "./Container";
import { FiPlus, FiX } from "react-icons/fi";

type RequestSectionProps = {
  handleSubmit: (e: FormEvent<Element>) => Promise<void>;
  leftWidth: number;
  activeTab: RequestTab;
  METHOD_COLOR: Record<string, string>;
  showHeaders: boolean;
  bodyFormat: BodyType;
  COMMON_HEADERS: string[];
  parsedBody: string;
  removeHeader: (id: number) => void;

  addHeaderRow: () => void;
  updateHeader: (id: number, key: "name" | "value", value: string) => void;
  setShowHeaders: (value: SetStateAction<boolean>) => void;
  updateActiveTab: (updater: (t: RequestTab) => RequestTab) => void;
};

export function RequestSection({
  handleSubmit,
  leftWidth,
  activeTab,
  updateActiveTab,
  METHOD_COLOR,
  setShowHeaders,
  showHeaders,
  bodyFormat,
  updateHeader,
  removeHeader,
  addHeaderRow,
  parsedBody,
  COMMON_HEADERS,
}: RequestSectionProps) {
  return (
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
              onClick={() => setShowHeaders((prv) => !prv)}
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
                        existing.name.toLowerCase() === header.toLowerCase(),
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
                    onChange={(e) => updateHeader(h.id, "name", e.target.value)}
                    placeholder="Key"
                    className="w-40 bg-zinc-900 border border-zinc-700 rounded-md px-2 py-1 text-xs"
                  />
                )}

                <input
                  value={h.value}
                  onChange={(e) => updateHeader(h.id, "value", e.target.value)}
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
            <label className="text-xs font-medium text-zinc-400">Body</label>

            <select
              value={bodyFormat ?? "none"}
              onChange={(e) => {
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
            disabled={activeTab.method === "GET"}
            value={parsedBody}
            onChange={(e) => {
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
              activeTab.method === "GET" ? "cursor-not-allowed opacity-50" : ""
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
  );
}
