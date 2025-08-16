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
      class={css((t) => ({
        height: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: t.var("--gradient-primary"),
        color: t.var("--color-paper-100"),
        fontFamily: "system-ui, -apple-system, sans-serif",
      }))}
    >
      <Suspense
        fallback={
          <div class={css({ textAlign: "center" })}>
            <div
              class={css((t) => ({
                width: "40px",
                height: "40px",
                border: `4px solid ${t.var("--color-paper-300")}`,
                borderTop: `4px solid ${t.var("--color-paper-100")}`,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }))}
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
            class={css((t) => ({
              background: t.var("--color-paper-100"),
              borderRadius: "16px",
              padding: "32px",
              width: "100%",
              maxWidth: "800px",
              maxHeight: "90vh",
              overflowY: "auto",
              color: t.var("--color-paper-800"),
              boxShadow: t.var("--shadow"),
            }))}
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
                class={css((t) => ({
                  fontSize: "16px",
                  color: t.var("--color-paper-500"),
                  margin: "0",
                }))}
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
                    class={css((t) => ({
                      background: t.var("--color-red-100"),
                      border: `1px solid ${t.var("--color-red-200")}`,
                      color: t.var("--color-red-700"),
                      padding: "12px 16px",
                      borderRadius: "8px",
                      fontSize: "14px",
                    }))}
                  >
                    {msg}
                  </div>
                )}
              </For>
            </div>

            <Show when={loaderData().recentProjects.length > 0}>
              <div class={css({ marginBottom: "32px" })}>
                <h2
                  class={css((t) => ({
                    fontSize: "20px",
                    fontWeight: "600",
                    margin: "0 0 16px 0",
                    color: t.var("--color-paper-800"),
                  }))}
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
                        class={css((t) => ({
                          border: `2px solid ${t.var("--color-paper-200")}`,
                          borderRadius: "12px",
                          padding: "20px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          background: "white",
                          boxShadow: t.var("--shadow"),
                          "&:hover": {
                            borderColor: t.var("--color-blue-500"),
                            transform: "translateY(-2px)",
                            boxShadow: t.var("--shadow"),
                          },
                        }))}
                      >
                        <h3
                          class={css((t) => ({
                            fontSize: "20px",
                            fontWeight: "600",
                            margin: "0 0 8px 0",
                            color: t.var("--color-paper-800"),
                          }))}
                        >
                          {project.name}
                        </h3>
                        <p
                          class={css((t) => ({
                            fontSize: "14px",
                            color: t.var("--color-paper-500"),
                            margin: "0 0 4px 0",
                          }))}
                        >
                          Created: {formatDate(project.createdAt)}
                        </p>
                        <p
                          class={css((t) => ({
                            fontSize: "14px",
                            color: t.var("--color-paper-500"),
                            margin: "0 0 8px 0",
                          }))}
                        >
                          Last opened: {formatDate(project.lastOpened)}
                        </p>
                        <p
                          class={css((t) => ({
                            fontSize: "12px",
                            color: t.var("--color-paper-400"),
                            margin: "0",
                            fontFamily: "monospace",
                            wordBreak: "break-all",
                          }))}
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
                class={css((t) => ({
                  textAlign: "center",
                  padding: "40px",
                  color: t.var("--color-paper-500"),
                  marginBottom: "32px",
                }))}
              >
                <div
                  class={css((t) => ({
                    width: "64px",
                    height: "64px",
                    background: t.var("--gradient-primary"),
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    margin: "0 auto 16px",
                  }))}
                >
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
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
                  css((t) => ({
                    padding: "12px 24px",
                    background: t.var("--color-blue-500"),
                    color: t.var("--color-paper-100"),
                    border: "none",
                    borderRadius: "8px",
                    fontSize: "16px",
                    fontWeight: "500",
                    transition: "all 0.2s",
                  })),
                  createProjectMutation.isPending
                    ? css({ opacity: 0.6, cursor: "not-allowed" })
                    : css((t) => ({
                        opacity: 1,
                        cursor: "pointer",
                        "&:hover": { background: t.var("--color-blue-600") },
                      }))
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
                class={css((t) => ({
                  padding: "12px 24px",
                  background: "transparent",
                  color: t.var("--color-blue-500"),
                  border: `2px solid ${t.var("--color-blue-500")}`,
                  borderRadius: "8px",
                  fontSize: "16px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  "&:hover": {
                    background: t.var("--color-blue-500"),
                    color: t.var("--color-paper-100"),
                  },
                }))}
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
