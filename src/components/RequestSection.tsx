import { createMemo, createSignal, For, Show } from "solid-js";
import { FiPlus, FiX } from "solid-icons/fi";

import { BodyType, RequestTab } from "./Container";
import ErrorPopup from "./ErrorPopup";
import { Portal } from "solid-js/web";

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
  const [methodOpen, setMethodOpen] = createSignal(false);
  const [methodMenuDirection, setMethodMenuDirection] = createSignal<
    "top" | "bottom"
  >("bottom");

  const [methodMenuPos, setMethodMenuPos] = createSignal({
    left: 0,
    top: 0,
    bottom: 0,
  });

  const [headerOpenId, setHeaderOpenId] = createSignal<number | null>(null);
  const [headerMenuPos, setHeaderMenuPos] = createSignal({
    left: 0,
    top: 0,
    bottom: 0,
  });
  const [headerMenuDirection, setHeaderMenuDirection] = createSignal<
    "top" | "bottom"
  >("top");
  const visibleError = createMemo(() => {
    if (!showError()) return null;
    return props.activeTab.error;
  });

  const methods = [
    "GET",
    "POST",
    "PUT",
    "DELETE",
    "PATCH",
    "HEAD",
    "OPTIONS",
    // "CONNECT",
    // "TRACE",
  ];

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
        <div class="sticky top-0 z-10 flex gap-2 border-b border-zinc-800 bg-zinc-900/80 pb-2 backdrop-blur ">
          {/* Method */}
          <div class="relative shrink-0 z-50">
            <button
              type="button"
              class={`flex items-center gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2.5 py-1.5 text-sm font-semibold transition-colors hover:bg-zinc-800 ${
                props.METHOD_COLOR[props.activeTab.method]
              }`}
              onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();

                const menuHeight = methods.length * 32 + 8;

                const spaceAbove = rect.top - 8;
                const spaceBelow = window.innerHeight - rect.bottom - 8;

                setMethodMenuPos({
                  left: rect.left,
                  top: rect.top,
                  bottom: rect.bottom,
                });

                setMethodMenuDirection(
                  spaceBelow >= menuHeight || spaceBelow >= spaceAbove
                    ? "bottom"
                    : "top",
                );

                setMethodOpen((open) => !open);
              }}
            >
              {props.activeTab.method}

              <svg
                class="h-3.5 w-3.5 text-zinc-500"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <Show when={methodOpen()}>
              <Portal>
                <div
                  class="fixed z-50 min-w-30 max-w-50 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
                  style={{
                    left: `${methodMenuPos().left}px`,
                    top:
                      methodMenuDirection() === "top"
                        ? `${methodMenuPos().top - 4}px`
                        : `${methodMenuPos().bottom + 4}px`,
                    transform:
                      methodMenuDirection() === "top"
                        ? "translateY(-100%)"
                        : "none",
                    "max-height": `${
                      methodMenuDirection() === "top"
                        ? Math.max(methodMenuPos().top - 8, 100)
                        : Math.max(
                            window.innerHeight - methodMenuPos().bottom - 8,
                            100,
                          )
                    }px`,
                  }}
                >
                  <For each={methods}>
                    {(method) => (
                      <button
                        type="button"
                        class={`w-full rounded-md px-3 py-1.5 text-left text-sm
              font-semibold transition-colors
              hover:bg-zinc-800
              ${props.METHOD_COLOR[method]}
              ${props.activeTab.method === method ? "bg-zinc-800" : ""}`}
                        onClick={async () => {
                          await props.updateActiveTab((tab) => ({
                            ...tab,
                            method,
                          }));

                          setMethodOpen(false);
                        }}
                      >
                        {method}
                      </button>
                    )}
                  </For>
                </div>
              </Portal>
            </Show>
          </div>

          {/* URL */}
          <input
            value={props.activeTab.url}
            onInput={async (e) => {
              await props.updateActiveTab((tab) => ({
                ...tab,
                url: e.currentTarget.value,
              }));
            }}
            class="min-w-30 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-sm outline-none focus:border-zinc-500"
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
                const [localName, setLocalName] = createSignal(h.name);
                const [localValue, setLocalValue] = createSignal(h.value);

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
                    <div class="relative shrink-0 ">
                      <button
                        type="button"
                        class="flex w-40 items-center justify-between gap-2 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-left text-xs transition-colors hover:bg-zinc-800"
                        onClick={(e) => {
                          const rect = e.currentTarget.getBoundingClientRect();

                          const menuHeight = Math.min(
                            props.COMMON_HEADERS.length * 30 + 8,
                            window.innerHeight - 16,
                          );

                          const spaceAbove = rect.top - 8;

                          setHeaderMenuPos({
                            left: rect.left,
                            top: rect.top,
                            bottom: rect.bottom,
                          });

                          setHeaderMenuDirection(
                            spaceAbove >= menuHeight ? "top" : "bottom",
                          );

                          setHeaderOpenId((current) =>
                            current === h.id ? null : h.id,
                          );
                        }}
                      >
                        <span class="truncate">
                          {h.isCustom ? "Custom" : h.name || "Select header"}
                        </span>

                        <svg
                          class="h-3.5 w-3.5 shrink-0 text-zinc-500"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fill-rule="evenodd"
                            d="M5.23 7.21a.75.75 0 011.06.02L10 11.17l3.71-3.94a.75.75 0 111.08 1.04l-4.25 4.51a.75.75 0 01-1.08 0l-4.25-4.51a.75.75 0 01.02-1.06z"
                            clip-rule="evenodd"
                          />
                        </svg>
                      </button>

                      <Show when={headerOpenId() !== null}>
                        {(() => {
                          const activeHeader = () =>
                            props.activeTab.headers.find(
                              (h) => h.id === headerOpenId(),
                            );

                          return (
                            <Show when={activeHeader()}>
                              {(h) => (
                                <Portal>
                                  <div
                                    class="fixed z-50 w-40 overflow-y-auto rounded-lg border border-zinc-700 bg-zinc-900 p-1 shadow-2xl"
                                    style={{
                                      left: `${headerMenuPos().left}px`,
                                      top:
                                        headerMenuDirection() === "top"
                                          ? `${headerMenuPos().top - 4}px`
                                          : `${headerMenuPos().bottom + 4}px`,
                                      transform:
                                        headerMenuDirection() === "top"
                                          ? "translateY(-100%)"
                                          : "none",
                                      "max-height": `${
                                        headerMenuDirection() === "top"
                                          ? Math.max(
                                              headerMenuPos().top - 8,
                                              100,
                                            )
                                          : Math.max(
                                              window.innerHeight -
                                                headerMenuPos().bottom -
                                                8,
                                              100,
                                            )
                                      }px`,
                                    }}
                                  >
                                    <For
                                      each={[
                                        ...props.COMMON_HEADERS.filter(
                                          (header) => {
                                            if (header === h().name)
                                              return true;

                                            return !props.activeTab.headers.some(
                                              (existing) =>
                                                existing.id !== h().id &&
                                                existing.name.toLowerCase() ===
                                                  header.toLowerCase(),
                                            );
                                          },
                                        ),
                                        "Custom",
                                      ]}
                                    >
                                      {(header) => (
                                        <button
                                          type="button"
                                          class={`block w-full rounded-md px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-zinc-800 ${
                                            (h().isCustom
                                              ? "Custom"
                                              : h().name) === header
                                              ? "bg-zinc-800 text-zinc-100"
                                              : "text-zinc-300"
                                          }`}
                                          onClick={async () => {
                                            await props.updateActiveTab(
                                              (tab) => ({
                                                ...tab,
                                                headers: tab.headers.map(
                                                  (hdr) =>
                                                    hdr.id === h().id
                                                      ? {
                                                          ...hdr,
                                                          name:
                                                            header === "Custom"
                                                              ? ""
                                                              : header,
                                                          isCustom:
                                                            header === "Custom",
                                                        }
                                                      : hdr,
                                                ),
                                              }),
                                            );

                                            setHeaderOpenId(null);
                                          }}
                                        >
                                          {header}
                                        </button>
                                      )}
                                    </For>
                                  </div>
                                </Portal>
                              )}
                            </Show>
                          );
                        })()}
                      </Show>
                    </div>

                    {/* Custom header name */}
                    <Show when={h.isCustom}>
                      <input
                        value={localName()}
                        onInput={(e) => {
                          setLocalName(e.currentTarget.value);
                        }}
                        onBlur={async () => {
                          await props.updateHeader(h.id, "name", localName());
                        }}
                        placeholder="Key"
                        class="min-w-40 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                      />
                    </Show>

                    {/* Header value */}
                    <input
                      value={localValue()}
                      onInput={(e) => {
                        setLocalValue(e.currentTarget.value);
                      }}
                      onBlur={async () => {
                        await props.updateHeader(h.id, "value", localValue());
                      }}
                      placeholder="Value"
                      class="min-w-40 flex-1 rounded-md border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs outline-none focus:border-zinc-500"
                    />

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={async () => {
                        await props.removeHeader(h.id);
                      }}
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
              disabled={(() => {
                switch (props.activeTab.method) {
                  case "GET":
                  case "HEAD":
                    // case "TRACE":
                    return true;
                  default:
                    return false;
                }
              })()}
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
