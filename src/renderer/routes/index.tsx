import { createFileRoute, redirect } from "@tanstack/solid-router";
import { createSignal, For, Show, Suspense, createEffect } from "solid-js";
import { ApiKeyModal } from "../api-key-modal";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      showApiModal: (search.showApiModal as boolean) || false,
      error: (search.error as string) || "",
    };
  },
  loader: async () => {
    // Check API key first
    const hasApiKey = await window.api.hasApiKey();

    // Load recent projects
    const recentProjects = await window.api.getRecentProjects();

    // Check for current project
    const currentProject = await window.api.getCurrentProject();

    return {
      hasApiKey,
      recentProjects,
      currentProject,
      showApiModal: !hasApiKey,
      error: "",
    };
  },
  component: Home,
});

interface Project {
  name: string;
  path: string;
  createdAt: string;
  lastOpened: string;
}

function Home() {
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();

  const search = Route.useSearch();

  const [showApiKeyModal, setShowApiKeyModal] = createSignal(
    !loaderData().hasApiKey || search().showApiModal
  );
  const [isCreating, setIsCreating] = createSignal(false);
  const [errorMessage, setErrorMessage] = createSignal<string>(
    search().error || ""
  );

  // Auto-redirect to workspace if we have project and no API modal needed
  createEffect(() => {
    const currentProject = loaderData().currentProject;
    if (loaderData().hasApiKey && !search().showApiModal && currentProject) {
      navigate({
        to: "/workspace",
        search: { project: currentProject.path },
      });
    }
  });

  const handleApiKeySubmit = async (apiKey: string) => {
    try {
      await window.api.setApiKey(apiKey);
      setShowApiKeyModal(false);
      // Reload the page to refresh loader data
      window.location.reload();
    } catch (error) {
      console.error("Error saving API key:", error);
      setErrorMessage("Failed to save API key. Please try again.");
    }
  };

  const handleProjectSelected = (project: Project) => {
    navigate({
      to: "/workspace",
      search: { project: project.path },
    });
  };

  const handleCreateNewProject = async () => {
    try {
      setIsCreating(true);
      setErrorMessage("");

      const projectPath = await window.api.selectNewProjectFolder();
      if (projectPath) {
        const newProject = await window.api.createProject(projectPath);
        await window.api.openProject(newProject.path);
        handleProjectSelected(newProject);
      }
    } catch (err) {
      console.error("Error creating project:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to create project"
      );
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenProject = async (project: Project) => {
    try {
      setErrorMessage("");
      await window.api.openProject(project.path);
      handleProjectSelected(project);
    } catch (err) {
      console.error("Error opening project:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to open project"
      );
    }
  };

  const handleOpenExistingProject = async () => {
    try {
      setErrorMessage("");
      const projectPath = await window.api.selectProjectFolder();
      if (projectPath) {
        await window.api.openProject(projectPath);
        const projectInfo = await window.api.getCurrentProject();
        if (projectInfo) {
          handleProjectSelected(projectInfo);
        }
      }
    } catch (err) {
      console.error("Error opening existing project:", err);
      setErrorMessage(
        err instanceof Error ? err.message : "Failed to open existing project"
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " at " +
      date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  return (
    <>
      {/* API Key Modal Overlay */}
      <ApiKeyModal isOpen={showApiKeyModal()} onSubmit={handleApiKeySubmit} />

      {/* Main Project Selection Interface */}
      <Suspense
        fallback={
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
        }
      >
        <div
          style={{
            height: "100vh",
            display: "flex",
            "align-items": "center",
            "justify-content": "center",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            color: "white",
            "font-family": "system-ui, -apple-system, sans-serif",
            padding: "20px",
          }}
        >
          <div
            style={{
              background: "rgba(255, 255, 255, 0.95)",
              "border-radius": "16px",
              padding: "32px",
              "max-width": "800px",
              width: "100%",
              "max-height": "90vh",
              "overflow-y": "auto",
              color: "#1f2937",
              "box-shadow": "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            }}
          >
            <div style={{ "text-align": "center", "margin-bottom": "32px" }}>
              <h1
                style={{
                  "font-size": "32px",
                  "font-weight": "700",
                  margin: "0 0 8px 0",
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  "-webkit-background-clip": "text",
                  "-webkit-text-fill-color": "transparent",
                }}
              >
                Stable Diffusion Desktop
              </h1>
              <p
                style={{
                  "font-size": "16px",
                  color: "#6b7280",
                  margin: "0",
                }}
              >
                Choose a project to get started
              </p>
            </div>

            <Show when={errorMessage()}>
              <div
                style={{
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  color: "#dc2626",
                  padding: "12px 16px",
                  "border-radius": "8px",
                  "margin-bottom": "24px",
                  "font-size": "14px",
                }}
              >
                {errorMessage()}
              </div>
            </Show>

            <Show when={loaderData().recentProjects.length > 0}>
              <div style={{ "margin-bottom": "32px" }}>
                <h2
                  style={{
                    "font-size": "20px",
                    "font-weight": "600",
                    margin: "0 0 16px 0",
                    color: "#1f2937",
                  }}
                >
                  Recent Projects
                </h2>
                <div
                  style={{
                    display: "grid",
                    gap: "16px",
                    "grid-template-columns":
                      "repeat(auto-fit, minmax(300px, 1fr))",
                  }}
                >
                  <For each={loaderData().recentProjects}>
                    {(project) => (
                      <div
                        onClick={() => handleOpenProject(project)}
                        style={{
                          border: "2px solid #e5e7eb",
                          "border-radius": "12px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "white",
                          "box-shadow": "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "#3b82f6";
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow =
                            "0 8px 25px -8px rgba(0, 0, 0, 0.15)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "#e5e7eb";
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow =
                            "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
                        }}
                      >
                        <h3
                          style={{
                            "font-size": "20px",
                            "font-weight": "600",
                            margin: "0 0 8px 0",
                            color: "#1f2937",
                          }}
                        >
                          {project.name}
                        </h3>
                        <p
                          style={{
                            "font-size": "14px",
                            color: "#6b7280",
                            margin: "0 0 4px 0",
                          }}
                        >
                          Created: {formatDate(project.createdAt)}
                        </p>
                        <p
                          style={{
                            "font-size": "14px",
                            color: "#6b7280",
                            margin: "0 0 8px 0",
                          }}
                        >
                          Last opened: {formatDate(project.lastOpened)}
                        </p>
                        <p
                          style={{
                            "font-size": "12px",
                            color: "#9ca3af",
                            margin: "0",
                            "font-family": "monospace",
                            "word-break": "break-all",
                          }}
                        >
                          {project.path}
                        </p>
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>

            <Show when={loaderData().recentProjects.length === 0}>
              <div
                style={{
                  "text-align": "center",
                  padding: "40px",
                  color: "#6b7280",
                  "margin-bottom": "32px",
                }}
              >
                <div
                  style={{
                    width: "64px",
                    height: "64px",
                    background: "linear-gradient(45deg, #e5e7eb, #d1d5db)",
                    "border-radius": "50%",
                    display: "flex",
                    "align-items": "center",
                    "justify-content": "center",
                    margin: "0 auto 16px",
                  }}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#6b7280"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                </div>
                <p style={{ "font-size": "18px", margin: "0 0 8px 0" }}>
                  No recent projects
                </p>
                <p style={{ "font-size": "14px", margin: "0" }}>
                  Create a new project or open an existing one to get started
                </p>
              </div>
            </Show>

            <div
              style={{
                display: "flex",
                gap: "12px",
                "justify-content": "center",
                "flex-wrap": "wrap",
              }}
            >
              <button
                onClick={handleCreateNewProject}
                disabled={isCreating()}
                style={{
                  padding: "12px 24px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  "border-radius": "8px",
                  "font-size": "16px",
                  "font-weight": "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  opacity: isCreating() ? "0.6" : "1",
                }}
                onMouseEnter={(e) => {
                  if (!isCreating()) {
                    e.currentTarget.style.background = "#2563eb";
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                }}
              >
                {isCreating() ? "Creating..." : "Create New Project"}
              </button>

              <button
                onClick={handleOpenExistingProject}
                style={{
                  padding: "12px 24px",
                  background: "transparent",
                  color: "#3b82f6",
                  border: "2px solid #3b82f6",
                  "border-radius": "8px",
                  "font-size": "16px",
                  "font-weight": "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "#3b82f6";
                  e.currentTarget.style.color = "white";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.color = "#3b82f6";
                }}
              >
                Open Existing Project
              </button>
            </div>
          </div>
        </div>
      </Suspense>
    </>
  );
}
