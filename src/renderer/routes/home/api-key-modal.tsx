import { useMutation } from "@tanstack/solid-query";
import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, Match, Switch } from "solid-js";

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
      style={{
        position: "fixed",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        background: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        "z-index": "1000",
      }}
    >
      <div
        style={{
          background: "white",
          "border-radius": "12px",
          padding: "32px",
          width: "90%",
          "max-width": "500px",
          "box-shadow":
            "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
        }}
      >
        <div style={{ "margin-bottom": "24px" }}>
          <h2
            style={{
              margin: "0 0 8px 0",
              "font-size": "24px",
              "font-weight": "600",
              color: "#1f2937",
            }}
          >
            Welcome to Stable Diffusion Desktop
          </h2>
          <p
            style={{
              margin: "0",
              color: "#6b7280",
              "line-height": "1.5",
            }}
          >
            Please enter your Stable Diffusion API key to get started. You can
            obtain one from your Stable Diffusion provider.
          </p>
        </div>
        <form onSubmit={handleSubmit}>
          <div style={{ "margin-bottom": "24px" }}>
            <label
              style={{
                display: "block",
                "margin-bottom": "8px",
                "font-weight": "500",
                color: "#374151",
              }}
            >
              API Key
            </label>
            <input
              type="password"
              value={apiKey()}
              onInput={(e) => setApiKey(e.currentTarget.value)}
              placeholder="Enter your API key..."
              required
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
              disabled={!apiKey().trim() || mutation.isPending}
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
                opacity: !apiKey().trim() || mutation.isPending ? "0.6" : "1",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!(!apiKey().trim() || mutation.isPending)) {
                  e.currentTarget.style.background = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#3b82f6";
              }}
            >
              <Switch fallback="Saving...">
                <Match when={mutation.isPending}>Save API Key</Match>
              </Switch>
            </button>
          </div>
        </form>
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
            <strong>Note:</strong> Your API key will be stored securely on your
            device and is never shared with third parties.
          </p>
        </div>
      </div>
    </div>
  );
}
