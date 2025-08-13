import type { Component } from "solid-js";
import { createSignal, createEffect, onMount } from "solid-js";

// Type declarations for the exposed API
declare global {
  interface Window {
    api: {
      getApiKey: () => Promise<string | null>;
      setApiKey: (apiKey: string) => Promise<void>;
      hasApiKey: () => Promise<boolean>;
    };
  }
}

interface ApiKeyModalProps {
  isOpen: boolean;
  onSubmit: (apiKey: string) => void;
}

const ApiKeyModal: Component<ApiKeyModalProps> = (props) => {
  const [apiKey, setApiKey] = createSignal("");
  const [isLoading, setIsLoading] = createSignal(false);

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    const key = apiKey().trim();

    if (key) {
      setIsLoading(true);
      try {
        await props.onSubmit(key);
      } finally {
        setIsLoading(false);
      }
    }
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
        display: props.isOpen ? "flex" : "none",
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
              disabled={!apiKey().trim() || isLoading()}
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
                opacity: !apiKey().trim() || isLoading() ? "0.6" : "1",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (!(!apiKey().trim() || isLoading())) {
                  e.currentTarget.style.background = "#2563eb";
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#3b82f6";
              }}
            >
              {isLoading() ? "Saving..." : "Save API Key"}
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
};

const App: Component = () => {
  const [showApiKeyModal, setShowApiKeyModal] = createSignal(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = createSignal(true);

  onMount(async () => {
    try {
      const hasKey = await window.api.hasApiKey();
      if (!hasKey) {
        setShowApiKeyModal(true);
      }
    } catch (error) {
      console.error("Error checking API key:", error);
      setShowApiKeyModal(true);
    } finally {
      setIsCheckingApiKey(false);
    }
  });

  const handleApiKeySubmit = async (apiKey: string) => {
    try {
      await window.api.setApiKey(apiKey);
      setShowApiKeyModal(false);
    } catch (error) {
      console.error("Error saving API key:", error);
      alert("Failed to save API key. Please try again.");
    }
  };

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        "align-items": "center",
        "justify-content": "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        "font-family": "system-ui, -apple-system, sans-serif",
      }}
    >
      <ApiKeyModal isOpen={showApiKeyModal()} onSubmit={handleApiKeySubmit} />

      {isCheckingApiKey() ? (
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
          ></div>
          <p>Loading...</p>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      ) : (
        <div
          style={{
            "text-align": "center",
            "max-width": "600px",
            padding: "32px",
          }}
        >
          <h1
            style={{
              "font-size": "48px",
              "font-weight": "700",
              margin: "0 0 16px 0",
              background: "linear-gradient(45deg, #fff, #e0e7ff)",
              "-webkit-background-clip": "text",
              "-webkit-text-fill-color": "transparent",
            }}
          >
            Stable Diffusion Desktop
          </h1>
          <p
            style={{
              "font-size": "18px",
              "line-height": "1.6",
              margin: "0 0 32px 0",
              opacity: "0.9",
            }}
          >
            Your creative AI companion for generating stunning images with
            Stable Diffusion technology.
          </p>
          <div
            style={{
              display: "flex",
              gap: "16px",
              "justify-content": "center",
            }}
          >
            <button
              onClick={() => setShowApiKeyModal(true)}
              style={{
                padding: "12px 24px",
                background: "rgba(255, 255, 255, 0.2)",
                color: "white",
                border: "2px solid rgba(255, 255, 255, 0.3)",
                "border-radius": "8px",
                "font-size": "16px",
                "font-weight": "500",
                cursor: "pointer",
                transition: "all 0.3s",
                "backdrop-filter": "blur(10px)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.3)";
              }}
            >
              Update API Key
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
