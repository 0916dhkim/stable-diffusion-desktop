import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Suspense } from "solid-js";
import { css } from "@flow-css/core/css";
import { clsx } from "clsx";

export const Route = createFileRoute("/settings")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      returnTo: (search.returnTo as string) || "/",
    };
  },
  loader: async () => {
    const hasApiKey = await window.api.hasApiKey();
    return {
      hasApiKey,
      currentApiKey: hasApiKey ? "••••••••••••••••••••••••••••••••" : "",
    };
  },
  component: Settings,
});

function Settings() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const returnTo = search().returnTo;

  const [apiKey, setApiKey] = createSignal("");
  const [currentApiKey, setCurrentApiKey] = createSignal(
    loaderData().currentApiKey
  );
  const [isSaving, setIsSaving] = createSignal(false);
  const [message, setMessage] = createSignal<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const key = apiKey().trim();

    if (!key) {
      setMessage({ type: "error", text: "Please enter an API key" });
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await window.api.setApiKey(key);
      setCurrentApiKey("••••••••••••••••••••••••••••••••");
      setApiKey("");
      setMessage({ type: "success", text: "API key saved successfully!" });

      // Clear message after 3 seconds
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      console.error("Error saving API key:", error);
      setMessage({
        type: "error",
        text: "Failed to save API key. Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (returnTo.includes("/workspace")) {
      // Parse the project from the returnTo URL
      const url = new URL(returnTo, "http://localhost");
      const project = url.searchParams.get("project");
      if (project) {
        navigate({ to: "/workspace", search: { project } });
      } else {
        navigate({ to: "/", search: { showApiModal: false, error: "" } });
      }
    } else {
      // Navigate to home by default
      navigate({ to: "/", search: { showApiModal: false, error: "" } });
    }
  };

  return (
    <Suspense
      fallback={
        <div
          class={css((t) => ({
            minHeight: "100vh",
            background: t.var("--bg-primary-gradient"),
            color: t.var("--text-inverse"),
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }))}
        >
          <div class={css({ textAlign: "center" })}>
            <div
              class={css((t) => ({
                width: "40px",
                height: "40px",
                border: `4px solid ${t.var("--white-30")}`,
                borderTop: "4px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }))}
            />
            <p>Loading settings...</p>
            <style>
              {`
                @keyframes spin {
                  0% { transform: rotate(0deg); }
                  100% { transform: rotate(360deg); }
                }
              `}
            </style>
          </div>
        </div>
      }
    >
      <div
        class={css((t) => ({
          minHeight: "100vh",
          background: t.var("--bg-primary-gradient"),
          color: t.var("--text-inverse"),
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }))}
      >
        <div
          class={css((t) => ({
            background: t.var("--white-95"),
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "500px",
            width: "100%",
            color: t.var("--text-primary"),
            boxShadow: `0 25px 50px -12px ${t.var("--black-25")}`,
          }))}
        >
          {/* Header */}
          <div class={css({ marginBottom: "32px" })}>
            <div
              class={css({
                display: "flex",
                alignItems: "center",
                marginBottom: "16px",
              })}
            >
              <button
                onClick={handleBack}
                class={css((t) => ({
                  background: "none",
                  border: "none",
                  color: t.var("--text-muted"),
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "8px",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                  marginRight: "12px",
                  "&:hover": { background: t.var("--surface-muted") },
                }))}
              >
                ←
              </button>
              <h1
                class={css((t) => ({
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0",
                  background: t.var("--accent-gradient"),
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }))}
              >
                Settings
              </h1>
            </div>
            <p
              class={css((t) => ({
                fontSize: "16px",
                color: t.var("--text-muted"),
                margin: "0",
              }))}
            >
              Configure your API key and application preferences
            </p>
          </div>

          {/* Message Display */}
          {message() && (
            <div
              class={clsx(
                css({
                  padding: "12px 16px",
                  borderRadius: "8px",
                  marginBottom: "24px",
                  fontSize: "14px",
                }),
                message()!.type === "success"
                  ? css((t) => ({
                      background: t.var("--success-soft-bg"),
                      border: `1px solid ${t.var("--success-soft-border")}`,
                      color: t.var("--success-soft-text"),
                    }))
                  : css((t) => ({
                      background: t.var("--danger-soft-bg"),
                      border: `1px solid ${t.var("--danger-soft-border")}`,
                      color: t.var("--danger-soft-text"),
                    }))
              )}
            >
              {message()!.text}
            </div>
          )}

          {/* Current API Key Status */}
          {currentApiKey() && (
            <div
              class={css((t) => ({
                background: t.var("--success-soft-bg"),
                border: `1px solid ${t.var("--success-soft-border")}`,
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              }))}
            >
              <h3
                class={css((t) => ({
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: t.var("--success-soft-text"),
                }))}
              >
                Current API Key
              </h3>
              <p
                class={css((t) => ({
                  margin: "0",
                  fontFamily: "monospace",
                  color: t.var("--success-soft-text"),
                  fontSize: "14px",
                }))}
              >
                {currentApiKey()}
              </p>
            </div>
          )}

          {/* API Key Form */}
          <form onSubmit={handleSubmit}>
            <div class={css({ marginBottom: "24px" })}>
              <label
                class={css((t) => ({
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: t.var("--text-strong"),
                  fontSize: "16px",
                }))}
              >
                {currentApiKey() ? "Update API Key" : "API Key"}
              </label>
              <input
                type="password"
                value={apiKey()}
                onInput={(e) => setApiKey(e.currentTarget.value)}
                placeholder={
                  currentApiKey()
                    ? "Enter new API key..."
                    : "Enter your API key..."
                }
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
                disabled={!apiKey().trim() || isSaving()}
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
                  !apiKey().trim() || isSaving()
                    ? css({ opacity: 0.6, cursor: "not-allowed" })
                    : css((t) => ({
                        opacity: 1,
                        cursor: "pointer",
                        "&:hover": { background: t.var("--brand-hover") },
                      }))
                )}
              >
                {isSaving()
                  ? "Saving..."
                  : currentApiKey()
                    ? "Update API Key"
                    : "Save API Key"}
              </button>
            </div>
          </form>

          {/* Info Section */}
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
              <strong>Note:</strong> Your API key is stored securely on your
              device and is never shared with third parties. You can obtain an
              API key from your Stable Diffusion service provider.
            </p>
          </div>
        </div>
      </div>
    </Suspense>
  );
}
