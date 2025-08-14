import { useMutation } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Match, Switch } from "solid-js";
import { css } from "@flow-css/core/css";
import { clsx } from "clsx";

export const Route = createFileRoute("/home/api-key-modal")({
  component: ApiKeyModal,
});

function ApiKeyModal() {
  const [apiKey, setApiKey] = createSignal("");
  const mutation = useMutation(() => ({
    mutationFn: async (key: string) => {
      await window.api.setApiKey(key);
    },
    onSuccess: () => {
      navigate({ to: "/" });
    },
    onError: (e) => {
      console.error("Error saving API key:", e);
    },
  }));
  const navigate = Route.useNavigate();

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const key = apiKey().trim();
    mutation.mutate(key);
  };

  return (
    <div
      class={css({
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      })}
    >
      <div
        class={css({
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          width: "90%",
          maxWidth: "500px",
          boxShadow:
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        })}
      >
        <div class={css({ marginBottom: "24px" })}>
          <h2
            class={css({
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "600",
              color: "#1f2937",
            })}
          >
            Welcome to Stable Diffusion Desktop
          </h2>
          <p
            class={css({
              margin: "0",
              color: "#6b7280",
              lineHeight: "1.5",
            })}
          >
            Please enter your Stable Diffusion API key to get started. You can
            obtain one from your Stable Diffusion provider.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div class={css({ marginBottom: "24px" })}>
            <label
              class={css({
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: "#374151",
              })}
            >
              API Key
            </label>
            <input
              type="password"
              value={apiKey()}
              onInput={(e) => setApiKey(e.currentTarget.value)}
              placeholder="Enter your API key..."
              required
              class={css({
                width: "100%",
                padding: "12px 16px",
                border: "1px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s",
              })}
              onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
            />
          </div>

          <div class={css({ display: "flex", gap: "12px" })}>
            <button
              type="submit"
              disabled={!apiKey().trim() || mutation.isPending}
              class={clsx(
                css({
                  flex: "1",
                  padding: "12px 24px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                }),
                !apiKey().trim() || mutation.isPending
                  ? css({ opacity: 0.6, cursor: "not-allowed" })
                  : css({
                      opacity: 1,
                      cursor: "pointer",
                      "&:hover": { background: "#2563eb" },
                    })
              )}
            >
              <Switch fallback="Saving...">
                <Match when={mutation.isPending}>Save API Key</Match>
              </Switch>
            </button>
          </div>
        </form>
        <div
          class={css({
            marginTop: "24px",
            padding: "16px",
            background: "#f3f4f6",
            borderRadius: "8px",
          })}
        >
          <p
            class={css({
              margin: "0",
              fontSize: "14px",
              color: "#6b7280",
              lineHeight: "1.4",
            })}
          >
            <strong>Note:</strong> Your API key will be stored securely on your
            device and is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
