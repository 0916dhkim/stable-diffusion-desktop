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
          class={css({
            minHeight: "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            fontFamily: "system-ui, -apple-system, sans-serif",
            padding: "20px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          })}
        >
          <div class={css({ textAlign: "center" })}>
            <div
              class={css({
                width: "40px",
                height: "40px",
                border: "4px solid rgba(255, 255, 255, 0.3)",
                borderTop: "4px solid white",
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              })}
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
        class={css({
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          fontFamily: "system-ui, -apple-system, sans-serif",
          padding: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        })}
      >
        <div
          class={css({
            background: "rgba(255, 255, 255, 0.95)",
            borderRadius: "16px",
            padding: "32px",
            maxWidth: "500px",
            width: "100%",
            color: "#1f2937",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          })}
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
                class={css({
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
                  padding: "8px",
                  borderRadius: "6px",
                  transition: "background-color 0.2s",
                  marginRight: "12px",
                  "&:hover": {
                    background: "#f3f4f6",
                  },
                })}
              >
                ←
              </button>
              <h1
                class={css({
                  fontSize: "28px",
                  fontWeight: "700",
                  margin: "0",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                })}
              >
                Settings
              </h1>
            </div>
            <p
              class={css({
                fontSize: "16px",
                color: "#6b7280",
                margin: "0",
              })}
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
                  ? css({
                      background: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      color: "#166534",
                    })
                  : css({
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                    })
              )}
            >
              {message()!.text}
            </div>
          )}

          {/* Current API Key Status */}
          {currentApiKey() && (
            <div
              class={css({
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "24px",
              })}
            >
              <h3
                class={css({
                  margin: "0 0 8px 0",
                  fontSize: "16px",
                  fontWeight: "600",
                  color: "#166534",
                })}
              >
                Current API Key
              </h3>
              <p
                class={css({
                  margin: "0",
                  fontFamily: "monospace",
                  color: "#166534",
                  fontSize: "14px",
                })}
              >
                {currentApiKey()}
              </p>
            </div>
          )}

          {/* API Key Form */}
          <form onSubmit={handleSubmit}>
            <div class={css({ marginBottom: "24px" })}>
              <label
                class={css({
                  display: "block",
                  marginBottom: "8px",
                  fontWeight: "600",
                  color: "#374151",
                  fontSize: "16px",
                })}
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
                disabled={!apiKey().trim() || isSaving()}
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
                  !apiKey().trim() || isSaving()
                    ? css({ opacity: 0.6, cursor: "not-allowed" })
                    : css({
                        opacity: 1,
                        cursor: "pointer",
                        "&:hover": { background: "#2563eb" },
                      })
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
