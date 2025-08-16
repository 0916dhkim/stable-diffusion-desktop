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
      class={css((t) => ({
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: t.var("--black-50"),
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }))}
    >
      <div
        class={css((t) => ({
          background: "white",
          borderRadius: "12px",
          padding: "32px",
          width: "90%",
          maxWidth: "500px",
          boxShadow: `0 20px 25px -5px ${t.var("--black-10")}, 0 10px 10px -5px ${t.var("--black-05")}`,
        }))}
      >
        <div class={css({ marginBottom: "24px" })}>
          <h2
            class={css((t) => ({
              margin: "0 0 8px 0",
              fontSize: "24px",
              fontWeight: "600",
              color: t.var("--text-primary"),
            }))}
          >
            Welcome to Stable Diffusion Desktop
          </h2>
          <p
            class={css((t) => ({
              margin: "0",
              color: t.var("--text-muted"),
              lineHeight: "1.5",
            }))}
          >
            Please enter your Stable Diffusion API key to get started. You can
            obtain one from your Stable Diffusion provider.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div class={css({ marginBottom: "24px" })}>
            <label
              class={css((t) => ({
                display: "block",
                marginBottom: "8px",
                fontWeight: "500",
                color: t.var("--text-strong"),
              }))}
            >
              API Key
            </label>
            <input
              type="password"
              value={apiKey()}
              onInput={(e) => setApiKey(e.currentTarget.value)}
              placeholder="Enter your API key..."
              required
              class={css((t) => ({
                width: "100%",
                padding: "12px 16px",
                border: `1px solid ${t.var("--border-muted")}`,
                borderRadius: "8px",
                fontSize: "16px",
                boxSizing: "border-box",
                outline: "none",
                transition: "border-color 0.2s",
              }))}
              onFocus={(e) =>
                (e.currentTarget.style.borderColor = getComputedStyle(
                  document.documentElement
                ).getPropertyValue("--brand"))
              }
              onBlur={(e) =>
                (e.currentTarget.style.borderColor = getComputedStyle(
                  document.documentElement
                ).getPropertyValue("--border-muted"))
              }
            />
          </div>

          <div class={css({ display: "flex", gap: "12px" })}>
            <button
              type="submit"
              disabled={!apiKey().trim() || mutation.isPending}
              class={clsx(
                css((t) => ({
                  flex: "1",
                  padding: "12px 24px",
                  background: t.var("--brand"),
                  color: t.var("--text-inverse"),
                  border: "none",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  transition: "all 0.2s",
                })),
                !apiKey().trim() || mutation.isPending
                  ? css({ opacity: 0.6, cursor: "not-allowed" })
                  : css((t) => ({
                      opacity: 1,
                      cursor: "pointer",
                      "&:hover": { background: t.var("--brand-hover") },
                    }))
              )}
            >
              <Switch fallback="Saving...">
                <Match when={mutation.isPending}>Save API Key</Match>
              </Switch>
            </button>
          </div>
        </form>
        <div
          class={css((t) => ({
            marginTop: "24px",
            padding: "16px",
            background: t.var("--surface-muted"),
            borderRadius: "8px",
          }))}
        >
          <p
            class={css((t) => ({
              margin: "0",
              fontSize: "14px",
              color: t.var("--text-muted"),
              lineHeight: "1.4",
            }))}
          >
            <strong>Note:</strong> Your API key will be stored securely on your
            device and is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
