import { type Component } from "solid-js";
import { FiAlertCircle, FiX } from "solid-icons/fi";
import { animate } from "motion";
type ErrorPopupProps = { error: string; onClose?: () => void };
const ErrorPopup: Component<ErrorPopupProps> = (props) => {
  return (
    <div
      ref={(el) => {
        animate(
          el,
          {
            opacity: [0, 1],
            transform: [
              "translateY(-8px) scale(0.98)",
              "translateY(0) scale(1)",
            ],
          },
          { duration: 0.2, ease: "easeOut" },
        );
      }}
      class="fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-start gap-3 rounded-lg border border-red-900/70 bg-red-950/90 px-4 py-3 text-red-300 shadow-lg"
    >
      {" "}
      <FiAlertCircle class="mt-0.5 h-4 w-4 shrink-0 text-red-400" />{" "}
      <div class="min-w-0 flex-1">
        {" "}
        <p class="text-xs font-semibold text-red-300"> Request failed </p>{" "}
        <p class="mt-1 break-words text-xs leading-5 text-red-400/90">
          {" "}
          {props.error}{" "}
        </p>{" "}
      </div>{" "}
      {props.onClose && (
        <button
          type="button"
          onClick={props.onClose}
          class="shrink-0 rounded p-1 text-red-400 transition hover:bg-red-900/40 hover:text-red-200"
          aria-label="Close error"
        >
          {" "}
          <FiX class="h-4 w-4" />{" "}
        </button>
      )}{" "}
    </div>
  );
};
export default ErrorPopup;
