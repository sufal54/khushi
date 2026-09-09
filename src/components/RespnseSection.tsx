import { For, Show } from "solid-js";
import { RequestTab } from "./Container";

type ResponseTab = "body" | "headers" | "cookies" | null;

type ResponseSectionProps = {
  leftWidth: number;
  activeTab: RequestTab;
  activeResponseTab: ResponseTab;
  cookies: {
    name: any;
    value: any;
    attributes: any;
  }[];

  setActiveResponseTab: (
    value: ResponseTab | ((prev: ResponseTab) => ResponseTab),
  ) => Promise<void>;
};

export default function ResponseSection(props: ResponseSectionProps) {
  const toggleResponseTab = async (tab: Exclude<ResponseTab, null>) => {
    await props.setActiveResponseTab((current) =>
      current === tab ? null : tab,
    );
  };

  return (
    <section
      class="flex min-h-0 flex-1 flex-col overflow-hidden bg-zinc-950 p-4"
      style={{
        "flex-basis": `${100 - props.leftWidth}%`,
      }}
    >
      <h2 class="mb-2 text-xs uppercase text-zinc-400">Response</h2>

      {/* No response */}
      <Show
        when={props.activeTab.response}
        fallback={<p class="text-xs text-zinc-500">No response yet</p>}
      >
        {/* Status */}
        <p class="mb-3 flex items-center gap-2 text-xs">
          <span
            class={`rounded-full px-2 py-0.5 text-[10px] ${
              props.activeTab.response!.status < 300
                ? "bg-emerald-900 text-emerald-300"
                : "bg-red-900 text-red-300"
            }`}
          >
            {props.activeTab.response!.status}
          </span>
          {props.activeTab.response!.status_text} ·{" "}
          {props.activeTab.response!.duration_ms} ms
        </p>

        {/* Tabs */}
        <div class="mb-2 flex gap-2">
          {/* Body */}
          <button
            type="button"
            onClick={async () => await toggleResponseTab("body")}
            class={`rounded px-3 py-1 text-xs ${
              props.activeResponseTab === "body"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-900 text-zinc-400"
            }`}
          >
            Body
          </button>

          {/* Headers */}
          <button
            type="button"
            onClick={async () => await toggleResponseTab("headers")}
            class={`rounded px-3 py-1 text-xs ${
              props.activeResponseTab === "headers"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-900 text-zinc-400"
            }`}
          >
            Headers
          </button>

          {/* Cookies */}
          <button
            type="button"
            onClick={async () => await toggleResponseTab("cookies")}
            class={`rounded px-3 py-1 text-xs ${
              props.activeResponseTab === "cookies"
                ? "bg-zinc-800 text-white"
                : "bg-zinc-900 text-zinc-400"
            }
                ${props.cookies.length > 0 ? "block" : "hidden"}`}
          >
            Cookies
          </button>
        </div>

        {/* Content */}
        <div class="relative min-h-0 flex-1">
          {/* BODY */}
          <pre
            class={`absolute inset-0 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs ${
              props.activeResponseTab === "body" ? "block" : "hidden"
            }`}
          >
            {props.activeTab.response!.body.toString()}
          </pre>

          {/* HEADERS */}
          <div
            class={`absolute inset-0 space-y-1 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs ${
              props.activeResponseTab === "headers" ? "block" : "hidden"
            }`}
          >
            <For each={Object.entries(props.activeTab.response!.headers)}>
              {([key, value]) => (
                <div class="flex gap-2">
                  <span class="min-w-[140px] text-zinc-400">{key}</span>

                  <span class="break-all">{value}</span>
                </div>
              )}
            </For>
          </div>

          {/* COOKIES */}
          <div
            class={`absolute inset-0 overflow-auto rounded-md border border-zinc-800 bg-zinc-900 p-3 text-xs ${
              props.activeResponseTab === "cookies" ? "block" : "hidden"
            }`}
          >
            <Show
              when={props.cookies.length > 0}
              fallback={<p class="text-zinc-500">No cookies received</p>}
            >
              <For each={props.cookies}>
                {(cookie) => (
                  <div class="space-y-1">
                    <div>Name: {cookie.name}</div>

                    <div>Value: {cookie.value}</div>
                  </div>
                )}
              </For>
            </Show>
          </div>
        </div>
      </Show>
    </section>
  );
}
