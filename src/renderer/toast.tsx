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
  boxShadow: `0 10px 15px -3px ${t.var("--black-10")}, 0 4px 6px -2px ${t.var("--black-05")}`,
  border: `1px solid ${t.var("--white-20")}`,
  color: t.var("--text-inverse"),
}));

const toastError = css((t) => ({ background: t.var("--danger-90") }));
const toastSuccess = css((t) => ({ background: t.var("--success-90") }));
const toastWarning = css((t) => ({ background: t.var("--warning-90") }));
const toastInfo = css((t) => ({ background: t.var("--info-90") }));
