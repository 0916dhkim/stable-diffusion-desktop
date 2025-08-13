import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Suspense } from "solid-js";

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
          style={{
            "min-height": "100vh",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "font-family": "system-ui, -apple-system, sans-serif",
            padding: "20px",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
          }}
        >
          <div style={{ "text-align": "center" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                border: "4px solid rgba(255, 255, 255, 0.3)",
                "border-top": "4px solid white",
                "border-radius": "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
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
        style={{
          "min-height": "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          "font-family": "system-ui, -apple-system, sans-serif",
          padding: "20px",
          display: "flex",
          "align-items": "center",
          "justify-content": "center",
        }}
      >
        <div
          style={{
            background: "rgba(255, 255, 255, 0.95)",
            "border-radius": "16px",
            padding: "32px",
            "max-width": "500px",
            width: "100%",
            color: "#1f2937",
            "box-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          }}
        >
          {/* Header */}
          <div style={{ "margin-bottom": "32px" }}>
            <div
              style={{
                display: "flex",
                "align-items": "center",
                "margin-bottom": "16px",
              }}
            >
              <button
                onClick={handleBack}
                style={{
                  background: "none",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  "font-size": "20px",
                  padding: "8px",
                  "border-radius": "6px",
                  transition: "background-color 0.2s",
                  "margin-right": "12px",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#f3f4f6";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "none";
                }}
              >
                ←
              </button>
              <h1
                style={{
                  "font-size": "28px",
                  "font-weight": "700",
                  margin: "0",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  "-webkit-background-clip": "text",
                  "-webkit-text-fill-color": "transparent",
                }}
              >
                Settings
              </h1>
            </div>
            <p
              style={{
                "font-size": "16px",
                color: "#6b7280",
                margin: "0",
              }}
            >
              Configure your API key and application preferences
            </p>
          </div>

          {/* Message Display */}
          {message() && (
            <div
              style={{
                background:
                  message()!.type === "success" ? "#f0fdf4" : "#fef2f2",
                border: `1px solid ${message()!.type === "success" ? "#bbf7d0" : "#fecaca"}`,
                color: message()!.type === "success" ? "#166534" : "#dc2626",
                padding: "12px 16px",
                "border-radius": "8px",
                "margin-bottom": "24px",
                "font-size": "14px",
              }}
            >
              {message()!.text}
            </div>
          )}

          {/* Current API Key Status */}
          {currentApiKey() && (
            <div
              style={{
                background: "#f0fdf4",
                border: "1px solid #bbf7d0",
                "border-radius": "8px",
                padding: "16px",
                "margin-bottom": "24px",
              }}
            >
              <h3
                style={{
                  margin: "0 0 8px 0",
                  "font-size": "16px",
                  "font-weight": "600",
                  color: "#166534",
                }}
              >
                Current API Key
              </h3>
              <p
                style={{
                  margin: "0",
                  "font-family": "monospace",
                  color: "#166534",
                  "font-size": "14px",
                }}
              >
                {currentApiKey()}
              </p>
            </div>
          )}

          {/* API Key Form */}
          <form onSubmit={handleSubmit}>
            <div style={{ "margin-bottom": "24px" }}>
              <label
                style={{
                  display: "block",
                  "margin-bottom": "8px",
                  "font-weight": "600",
                  color: "#374151",
                  "font-size": "16px",
                }}
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
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  border: "1px solid #d1d5db",
                  "border-radius": "8px",
                  "font-size": "16px",
                  "box-sizing": "border-box",
                  outline: "none",
                  transition: "border-color 0.2s",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3b82f6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#d1d5db")}
              />
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                type="submit"
                disabled={!apiKey().trim() || isSaving()}
                style={{
                  flex: "1",
                  padding: "12px 24px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  "border-radius": "8px",
                  "font-size": "16px",
                  "font-weight": "500",
                  cursor: "pointer",
                  opacity: !apiKey().trim() || isSaving() ? "0.6" : "1",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  if (!(!apiKey().trim() || isSaving())) {
                    e.currentTarget.style.background = "#2563eb";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                }}
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
            style={{
              "margin-top": "24px",
              padding: "16px",
              background: "#f3f4f6",
              "border-radius": "8px",
            }}
          >
            <p
              style={{
                margin: "0",
                "font-size": "14px",
                color: "#6b7280",
                "line-height": "1.4",
              }}
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
