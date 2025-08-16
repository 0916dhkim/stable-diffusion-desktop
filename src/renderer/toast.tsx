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

const toastBase = css((t) => ({
  minWidth: "280px",
  maxWidth: "360px",
  padding: "10px 12px",
  borderRadius: "8px",
  fontSize: "14px",
  boxShadow: t.var("--shadow"),
  border: `1px solid ${t.var("--color-paper-300")}`,
  color: t.var("--color-paper-100"),
}));

const toastError = css((t) => ({ background: t.var("--color-red-600") }));
const toastSuccess = css((t) => ({ background: t.var("--color-green-600") }));
const toastWarning = css((t) => ({ background: t.var("--color-yellow-600") }));
const toastInfo = css((t) => ({ background: t.var("--color-blue-600") }));
