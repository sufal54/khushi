import { createMemo, createSignal, For, Show } from "solid-js";
import { FiPlus, FiX } from "solid-icons/fi";

import { BodyType, RequestTab } from "./Container";
import ErrorPopup from "./ErrorPopup";

type RequestSectionProps = {
  handleSubmit: (e: SubmitEvent) => Promise<void>;

  leftWidth: number;
  activeTab: RequestTab;

  METHOD_COLOR: Record<string, string>;

  showHeaders: boolean;
  bodyFormat: BodyType;
  COMMON_HEADERS: string[];

  parsedBody: string;

  removeHeader: (id: number) => Promise<void>;
  updateBodyType: (bodyFomat: BodyType) => Promise<void>;
  addHeaderRow: () => Promise<void>;

  updateHeader: (
    id: number,
    key: "name" | "value",
    value: string,
  ) => Promise<void>;

  setShowHeaders: (
    value: boolean | ((prev: boolean) => boolean),
  ) => Promise<void>;

  updateActiveTab: (updater: (t: RequestTab) => RequestTab) => Promise<void>;
};

export function RequestSection(props: RequestSectionProps) {
  const [showError, setShowError] = createSignal<boolean>(true);

  const visibleError = createMemo(() => {
    if (!showError()) return null;
    return props.activeTab.error;
  });

  const methods = ["GET", "POST", "PUT", "DELETE", "PATCH"];

  return (
    <section
      class="flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-4 space-y-4"
      style={{
        "flex-basis": `${props.leftWidth}%`,
      }}
    >
      <form
        onSubmit={async (e) => {
          await props.handleSubmit(e);
          setShowError(true);
        }}
        class="space-y-4"
      >
        {/* Sticky bar */}
        <div class="sticky top-0 z-10 flex gap-2 border-b border-zinc-800 bg-zinc-900/80 pb-2 backdrop-blur">
          {/* Method */}
          <select
            value={props.activeTab.method}
            onInput={async (e) => {
              const value = e.currentTarget.value;

              await props.updateActiveTab((tab) => ({
                ...tab,
                method: value,
              }));
            }}
            class={`appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-sm font-semibold ${
              props.METHOD_COLOR[props.activeTab.method]
            }`}
          >
            <For each={methods}>
              {(method) => (
                <option value={method} class={props.METHOD_COLOR[method]}>
                  {method}
                </option>
              )}
            </For>
          </select>

          {/* URL */}
          <input
            value={props.activeTab.url}
            onInput={async (e) => {
              await props.updateActiveTab((tab) => ({
                ...tab,
                url: e.currentTarget.value,
              }));
            }}
            class="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
          />

          {/* Send */}
          <button
            type="submit"
            disabled={props.activeTab.loading}
            class="flex items-center gap-2 rounded-md bg-emerald-500 px-4 py-1.5 text-sm text-zinc-950 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Show when={props.activeTab.loading}>
              <span class="h-4 w-4 animate-spin rounded-full border-2 border-zinc-900 border-t-transparent" />
            </Show>
            Send
          </button>
        </div>

        {/* HEADERS */}
        <div>
          <div class="mb-2 flex items-center justify-between">
            <h2 class="text-xs uppercase text-zinc-400">Headers</h2>

            <button
              type="button"
              onClick={async () => await props.setShowHeaders((prev) => !prev)}
              class="text-xs text-emerald-400"
            >
              {props.showHeaders ? "Hide" : "Show"}
            </button>
          </div>

          <Show when={props.showHeaders}>
            <For each={props.activeTab.headers}>
              {(h) => {
                const contentTypeDisabled =
                  h.name === "Content-Type" && props.bodyFormat !== "none";

                return (
                  <div
                    class={`mb-2 flex gap-2 overflow-x-scroll ${
                      contentTypeDisabled
                        ? "pointer-events-none opacity-50"
                        : ""
                    }`}
                  >
                    {/* Header selector */}
                    <select
                      value={h.isCustom ? "Custom" : h.name}
                      onInput={async (e) => {
                        const value = e.currentTarget.value;

                        await props.updateActiveTab((tab) => ({
                          ...tab,
                          headers: tab.headers.map((hdr) =>
                            hdr.id === h.id
                              ? {
                                  ...hdr,
                                  name: value === "Custom" ? "" : value,
                                  isCustom: value === "Custom",
                                }
                              : hdr,
                          ),
                        }));
                      }}
                      class="w-40 appearance-none rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs"
                    >
                      <For
                        each={props.COMMON_HEADERS.filter((header) => {
                          // Always show current header
                          if (header === h.name) {
                            return true;
                          }

                          // Don't show headers already used
                          return !props.activeTab.headers.some(
                            (existing) =>
                              existing.id !== h.id &&
                              existing.name.toLowerCase() ===
                                header.toLowerCase(),
                          );
                        })}
                      >
                        {(header) => <option value={header}>{header}</option>}
                      </For>
                    </select>

                    {/* Custom header name */}
                    <Show when={h.isCustom}>
                      <input
                        value={h.name}
                        onInput={async (e) =>
                          await props.updateHeader(
                            h.id,
                            "name",
                            e.currentTarget.value,
                          )
                        }
                        placeholder="Key"
                        class="w-40 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                      />
                    </Show>

                    {/* Header value */}
                    <input
                      value={h.value}
                      onInput={async (e) =>
                        await props.updateHeader(
                          h.id,
                          "value",
                          e.currentTarget.value,
                        )
                      }
                      placeholder="Value"
                      class="min-w-0 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={async () => await props.removeHeader(h.id)}
                      title="Remove header"
                      class="flex h-6 w-6 shrink-0 items-center justify-center rounded text-zinc-500 hover:bg-red-500/10 hover:text-red-400"
                    >
                      <FiX size={14} />
                    </button>
                  </div>
                );
              }}
            </For>
          </Show>

          {/* Add header */}
          <button
            type="button"
            onClick={async () => await props.addHeaderRow()}
            class="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
          >
            <FiPlus size={14} />
            Add header
          </button>
        </div>

        {/* BODY */}
        <div class="space-y-2">
          <div class="flex items-center justify-between">
            <label class="text-xs font-medium text-zinc-400">Body</label>

            <select
              value={props.bodyFormat ?? "none"}
              onInput={async (e) => {
                await props.updateBodyType(e.currentTarget.value as BodyType);
              }}
              disabled={props.activeTab.method === "GET"}
              class="rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-300 outline-none focus:border-zinc-500 disabled:opacity-50"
            >
              <option value="none">None</option>
              <option value="json">JSON</option>
              <option value="text">Text</option>
              <option value="xml">XML</option>
            </select>
          </div>

          {/* Body editor */}
          <textarea
            disabled={props.activeTab.method === "GET"}
            value={props.parsedBody}
            onInput={async (e) => {
              await props.updateActiveTab((tab) => ({
                ...tab,
                body: e.currentTarget.value,
              }));
            }}
            rows={10}
            placeholder={
              props.activeTab.bodyType === "json"
                ? '{\n  "name": "John",\n  "age": 25\n}'
                : props.activeTab.bodyType === "xml"
                  ? "<user>\n  <name>John</name>\n</user>"
                  : "Entry body"
            }
            class={`w-full rounded-md border border-zinc-700 bg-zinc-900 px-3 py-2 font-mono text-xs outline-none focus:border-zinc-500 ${
              props.activeTab.method === "GET"
                ? "cursor-not-allowed opacity-50"
                : ""
            }`}
          />
        </div>
      </form>

      <Show when={visibleError()}>
        {(error) => (
          <ErrorPopup
            error={error()}
            onClose={() => {
              setShowError(false);
            }}
          />
        )}
      </Show>
    </section>
  );
}
