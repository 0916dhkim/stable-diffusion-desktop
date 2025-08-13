import { createFileRoute } from "@tanstack/solid-router";
import { createSignal, onMount, Switch, Match } from "solid-js";
import { ApiKeyModal } from "../api-key-modal";
import { ProjectSelector } from "../project-selector";

export const Route = createFileRoute("/")({
  component: Home,
});

interface Project {
  name: string;
  path: string;
  createdAt: string;
  lastOpened: string;
}

function Home() {
  const [showApiKeyModal, setShowApiKeyModal] = createSignal(false);
  const [isCheckingApiKey, setIsCheckingApiKey] = createSignal(true);
  const [currentProject, setCurrentProject] = createSignal<Project | null>(
    null
  );
  const [isCheckingProject, setIsCheckingProject] = createSignal(true);

  onMount(async () => {
    try {
      // Check API key first
      const hasKey = await window.api.hasApiKey();
      if (!hasKey) {
        setShowApiKeyModal(true);
      }

      // Check for existing project
      const project = await window.api.getCurrentProject();
      setCurrentProject(project);
    } catch (error) {
      console.error("Error during initialization:", error);
      setShowApiKeyModal(true);
    } finally {
      setIsCheckingApiKey(false);
      setIsCheckingProject(false);
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

  const handleProjectSelected = (project: Project) => {
    setCurrentProject(project);
  };

  const handleCloseProject = async () => {
    try {
      await window.api.closeProject();
      setCurrentProject(null);
    } catch (error) {
      console.error("Error closing project:", error);
    }
  };

  return (
    <Switch>
      <Match when={isCheckingApiKey() || isCheckingProject()}>
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
        </div>
      </Match>

      <Match when={showApiKeyModal()}>
        <ApiKeyModal isOpen={showApiKeyModal()} onSubmit={handleApiKeySubmit} />
      </Match>

      <Match when={!showApiKeyModal() && !currentProject()}>
        <ProjectSelector onProjectSelected={handleProjectSelected} />
      </Match>

      <Match when={!showApiKeyModal() && currentProject()}>
        <div
          style={{
            height: "100vh",
            display: "flex",
            "flex-direction": "column",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "font-family": "system-ui, -apple-system, sans-serif",
          }}
        >
          {/* Header with project info and controls */}
          <div
            style={{
              padding: "16px 24px",
              background: "rgba(255, 255, 255, 0.1)",
              "backdrop-filter": "blur(10px)",
              "border-bottom": "1px solid rgba(255, 255, 255, 0.2)",
              display: "flex",
              "align-items": "center",
              "justify-content": "space-between",
            }}
          >
            <div
              style={{
                display: "flex",
                "align-items": "center",
                gap: "16px",
              }}
            >
              <h1
                style={{
                  margin: "0",
                  "font-size": "20px",
                  "font-weight": "600",
                }}
              >
                {currentProject()?.name}
              </h1>
              <div
                style={{
                  padding: "4px 8px",
                  background: "rgba(255, 255, 255, 0.2)",
                  "border-radius": "4px",
                  "font-size": "12px",
                  "font-weight": "500",
                }}
              >
                Project
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                onClick={() => setShowApiKeyModal(true)}
                style={{
                  padding: "8px 16px",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.3)",
                  "border-radius": "6px",
                  "font-size": "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.3)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
                }}
              >
                API Key
              </button>
              <button
                onClick={handleCloseProject}
                style={{
                  padding: "8px 16px",
                  background: "rgba(239, 68, 68, 0.8)",
                  color: "white",
                  border: "1px solid rgba(239, 68, 68, 0.5)",
                  "border-radius": "6px",
                  "font-size": "14px",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 1)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(239, 68, 68, 0.8)";
                }}
              >
                Close Project
              </button>
            </div>
          </div>

          {/* Main content area */}
          <div
            style={{
              flex: "1",
              display: "flex",
              "align-items": "center",
              "justify-content": "center",
              padding: "40px",
            }}
          >
            <div style={{ "text-align": "center" }}>
              <h2
                style={{
                  "font-size": "36px",
                  "font-weight": "700",
                  margin: "0 0 16px 0",
                  opacity: "0.9",
                }}
              >
                Ready to Create
              </h2>
              <p
                style={{
                  "font-size": "18px",
                  opacity: "0.8",
                  margin: "0 0 32px 0",
                }}
              >
                Your project is ready. Start generating amazing images with AI!
              </p>
              <div
                style={{
                  padding: "20px",
                  background: "rgba(255, 255, 255, 0.1)",
                  "border-radius": "12px",
                  "backdrop-filter": "blur(10px)",
                }}
              >
                <p
                  style={{
                    margin: "0",
                    "font-size": "14px",
                    opacity: "0.8",
                  }}
                >
                  Image generation functionality will be implemented here
                </p>
              </div>
            </div>
          </div>
        </div>
      </Match>
    </Switch>
  );
}
