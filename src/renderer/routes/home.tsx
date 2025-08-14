import { createFileRoute, Outlet } from "@tanstack/solid-router";
import { clsx } from "clsx";
import type {} from "react";
import { useMutation } from "@tanstack/solid-query";
import { For, Show, Suspense, createEffect, Match, Switch } from "solid-js";
import { Project } from "../../main/project-manager";
import { css } from "@flow-css/core/css";

export const Route = createFileRoute("/home")({
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
    };
  },
  component: Home,
});

function Home() {
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();

  const getErrorMessage = (err: unknown) => {
    if (!err) return "";
    if (err instanceof Error) return err.message;
    if (typeof err === "string") return err;
    try {
      return JSON.stringify(err);
    } catch {
      return "An error occurred";
    }
  };
  const errorMessages = () =>
    [
      createProjectMutation.error,
      openProjectMutation.error,
      openExistingProjectMutation.error,
    ]
      .map((e) => getErrorMessage(e))
      .filter((msg) => msg);

  createEffect(() => {
    if (!loaderData().hasApiKey) {
      navigate({
        to: "/home/api-key-modal",
        mask: {
          to: "/home",
        },
      });
    }
  });

  // Auto-redirect to workspace if we have project and no API modal needed
  createEffect(() => {
    const currentProject = loaderData().currentProject;
    if (loaderData().hasApiKey && currentProject) {
      navigate({
        to: "/workspace",
        search: { project: currentProject.path },
      });
    }
  });

  const handleProjectSelected = (project: Project) => {
    navigate({
      to: "/workspace",
      search: { project: project.path },
    });
  };

  const createProjectMutation = useMutation(() => ({
    mutationFn: async () => {
      const projectPath = await window.api.selectNewProjectFolder();
      if (!projectPath) return undefined as unknown as Project;
      const newProject = await window.api.createProject(projectPath);
      await window.api.openProject(newProject.path);
      return newProject as Project;
    },
    onSuccess: (newProject) => {
      if (!newProject) return;
      handleProjectSelected(newProject);
    },
    onError: (err) => {
      console.error("Error creating project:", err);
    },
  }));

  const openProjectMutation = useMutation(() => ({
    mutationFn: async (project: Project) => {
      await window.api.openProject(project.path);
      return project;
    },
    onSuccess: (project) => {
      handleProjectSelected(project);
    },
    onError: (err) => {
      console.error("Error opening project:", err);
    },
  }));

  const openExistingProjectMutation = useMutation(() => ({
    mutationFn: async () => {
      const projectPath = await window.api.selectProjectFolder();
      if (!projectPath) return undefined as unknown as Project;
      await window.api.openProject(projectPath);
      const projectInfo = await window.api.getCurrentProject();
      return (projectInfo || undefined) as unknown as Project;
    },
    onSuccess: (projectInfo) => {
      if (!projectInfo) return;
      handleProjectSelected(projectInfo);
    },
    onError: (err) => {
      console.error("Error opening existing project:", err);
    },
  }));

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
    <div
      class={css({
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        fontFamily: "system-ui, -apple-system, sans-serif",
      })}
    >
      <Suspense
        fallback={
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
        }
      >
        <>
          <div
            class={css({
              background: "rgba(255, 255, 255, 0.95)",
              borderRadius: "16px",
              padding: "32px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              color: "#1f2937",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            })}
          >
            <div class={css({ textAlign: "center", marginBottom: "32px" })}>
              <h1
                class={css({
                  fontSize: "32px",
                  fontWeight: "700",
                  margin: "0 0 8px 0",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                })}
              >
                Stable Diffusion Desktop
              </h1>
              <p
                class={css({
                  fontSize: "16px",
                  color: "#6b7280",
                  margin: "0",
                })}
              >
                Choose a project to get started
              </p>
            </div>

            <div
              class={css({
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                marginBottom: "24px",
              })}
            >
              <For each={errorMessages()}>
                {(msg) => (
                  <div
                    class={css({
                      background: "#fef2f2",
                      border: "1px solid #fecaca",
                      color: "#dc2626",
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    })}
                  >
                    {msg}
                  </div>
                )}
              </For>
            </div>

            <Show when={loaderData().recentProjects.length > 0}>
              <div class={css({ marginBottom: "32px" })}>
                <h2
                  class={css({
                    fontSize: "20px",
                    fontWeight: "600",
                    margin: "0 0 16px 0",
                    color: "#1f2937",
                  })}
                >
                  Recent Projects
                </h2>
                <div
                  class={css({
                    display: "grid",
                    gap: "16px",
                    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                  })}
                >
                  <For each={loaderData().recentProjects}>
                    {(project) => (
                      <div
                        onClick={() => openProjectMutation.mutate(project)}
                        class={css({
                          border: "2px solid #e5e7eb",
                          borderRadius: "12px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "white",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          "&:hover": {
                            borderColor: "#3b82f6",
                            transform: "translateY(-2px)",
                            boxShadow: "0 8px 25px -8px rgba(0, 0, 0, 0.15)",
                          },
                        })}
                      >
                        <h3
                          class={css({
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: "0 0 8px 0",
                            color: "#1f2937",
                          })}
                        >
                          {project.name}
                        </h3>
                        <p
                          class={css({
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "0 0 4px 0",
                          })}
                        >
                          Created: {formatDate(project.createdAt)}
                        </p>
                        <p
                          class={css({
                            fontSize: "14px",
                            color: "#6b7280",
                            margin: "0 0 8px 0",
                          })}
                        >
                          Last opened: {formatDate(project.lastOpened)}
                        </p>
                        <p
                          class={css({
                            fontSize: "12px",
                            color: "#9ca3af",
                            margin: "0",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                          })}
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
                class={css({
                  textAlign: "center",
                  padding: "40px",
                  color: "#6b7280",
                  marginBottom: "32px",
                })}
              >
                <div
                  class={css({
                    width: "64px",
                    height: "64px",
                    background: "linear-gradient(45deg, #e5e7eb, #d1d5db)",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  })}
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
                <p class={css({ fontSize: "18px", margin: "0 0 8px 0" })}>
                  No recent projects
                </p>
                <p class={css({ fontSize: "14px", margin: "0" })}>
                  Create a new project or open an existing one to get started
                </p>
              </div>
            </Show>

            <div
              class={css({
                display: "flex",
                gap: "12px",
                justifyContent: "center",
                flexWrap: "wrap",
              })}
            >
              <button
                onClick={() => createProjectMutation.mutate()}
                disabled={createProjectMutation.isPending}
                class={clsx(
                  css({
                    padding: "12px 24px",
                    background: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  }),
                  createProjectMutation.isPending
                    ? css({ opacity: 0.6, cursor: "not-allowed" })
                    : css({
                        opacity: 1,
                        cursor: "pointer",
                        "&:hover": { background: "#2563eb" },
                      })
                )}
              >
                <Switch fallback="Create New Project">
                  <Match when={createProjectMutation.isPending}>
                    Creating...
                  </Match>
                </Switch>
              </button>

              <button
                onClick={() => openExistingProjectMutation.mutate()}
                class={css({
                  padding: "12px 24px",
                  background: "transparent",
                  color: "#3b82f6",
                  border: "2px solid #3b82f6",
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": { background: "#3b82f6", color: "white" },
                })}
              >
                Open Existing Project
              </button>
            </div>
          </div>
        </>
        <Outlet />
      </Suspense>
    </div>
  );
}
