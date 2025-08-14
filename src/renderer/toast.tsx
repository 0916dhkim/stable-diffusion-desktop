import { For, Show, createSignal } from "solid-js";
import { css } from "@flow-css/core/css";
import { clsx } from "clsx";

type ToastType = "success" | "error" | "info" | "warning";

interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

const [toasts, setToasts] = createSignal<ToastItem[]>([]);

export function showToast(
  message: string,
  options?: { type?: ToastType; durationMs?: number }
): void {
  const id = Date.now() + Math.floor(Math.random() * 1000);
  const type: ToastType = options?.type ?? "info";
  const durationMs = options?.durationMs ?? 4000;
  setToasts((prev) => [...prev, { id, type, message }]);

  window.setTimeout(() => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, durationMs);
}

export function ToastContainer() {
  return (
    <div
      class={css({
        position: "fixed",
        bottom: "16px",
        right: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        zIndex: 9999,
      })}
    >
      <For each={toasts()}>
        {(t) => (
          <div
            class={clsx(toastBase, {
              [toastError]: t.type === "error",
              [toastSuccess]: t.type === "success",
              [toastWarning]: t.type === "warning",
              [toastInfo]: t.type === "info",
            })}
          >
            {t.message}
          </div>
        )}
      </For>
    </div>
  );
}

const toastBase = css({
  minWidth: "280px",
  maxWidth: "360px",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  boxShadow:
    "0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)",
  border: "1px solid rgba(255,255,255,0.2)",
  color: "white",
});

const toastError = css({ background: "rgba(239, 68, 68, 0.9)" });
const toastSuccess = css({ background: "rgba(16, 185, 129, 0.9)" });
const toastWarning = css({ background: "rgba(245, 158, 11, 0.9)" });
const toastInfo = css({ background: "rgba(59, 130, 246, 0.9)" });
