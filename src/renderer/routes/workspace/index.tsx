import { createFileRoute, Link, redirect } from "@tanstack/solid-router";
import { css } from "@flow-css/core/css";
import { clsx } from "clsx";
import {
  Suspense,
  createMemo,
  createSignal,
  Show,
  onCleanup,
  onMount,
  For,
} from "solid-js";
import { useMutation } from "@tanstack/solid-query";
import { showToast } from "../../toast";
import { filePathToMediaUrl } from "../../../shared/media-protocol";
import { z } from "zod";

const FormSchema = z.object({
  prompt: z.string().optional().default(""),
  negativePrompt: z.string().optional(),
  model: z.string().optional(),
  steps: z.number().optional().default(30),
  cfgScale: z.number().optional().default(7.5),
  width: z.number().optional(),
  height: z.number().optional(),
  seed: z.string().optional(),
});
const SearchSchema = z
  .object({
    project: z.string(),
  })
  .and(FormSchema);

// Workspace route with project query parameter
export const Route = createFileRoute("/workspace/")({
  validateSearch: SearchSchema,
  beforeLoad: async ({ search }) => {
    // Check API key first
    const hasApiKey = await window.api.hasApiKey();
    if (!hasApiKey) {
      throw redirect({ to: "/", search: { showApiModal: true } });
    }

    const projectPath = search.project;
    if (!projectPath) {
      throw redirect({ to: "/" });
    }
  },
  loaderDeps: ({ search: { project } }) => ({ project }),
  loader: async ({ deps }) => {
    const projectPath = deps.project;

    try {
      // Check if we have the right project open
      const currentProject = await window.api.getCurrentProject();
      if (!currentProject || currentProject.path !== projectPath) {
        // Try to open the project from the URL
        await window.api.openProject(projectPath);
        // Get the project info after opening
        const projectInfo = await window.api.getCurrentProject();
        if (!projectInfo) {
          throw new Error("Failed to load project");
        }
        return projectInfo;
      }
      return currentProject;
    } catch (error) {
      console.error("Error loading project:", error);
      throw redirect({ to: "/", search: { error: "invalid-project" } });
    }
  },
  component: Workspace,
});

function Workspace() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const loaderData = Route.useLoaderData();
  const projectPath = search().project;

  const [showAdvanced, setShowAdvanced] = createSignal(false);
  const [latestImagePath, setLatestImagePath] = createSignal<string | null>(
    null
  );

  const [history, setHistory] = createSignal<
    Array<{
      id: number;
      imagePath: string;
      prompt: string;
      createdAt: string;
    }>
  >([]);

  const loadHistory = async () => {
    try {
      const items = await window.api.getGenerations({ limit: 60, offset: 0 });
      setHistory(
        items.map((g) => ({
          id: g.id,
          imagePath: g.imagePath,
          prompt: g.prompt,
          createdAt: g.createdAt,
        }))
      );
      if (!latestImagePath() && items[0]?.imagePath) {
        setLatestImagePath(items[0].imagePath);
      }
    } catch (err) {
      console.error("Error loading history:", err);
    }
  };

  const generateImageMutation = useMutation(() => ({
    mutationFn: async (
      input: {
        projectPath: string;
      } & z.infer<typeof FormSchema>
    ) => {
      const result = await window.api.generateImage(input);
      setLatestImagePath(result.imagePath);
      return result;
    },
    onError: (err) => {
      console.error("Error generating image:", err);
      const msg = (() => {
        if (!err) return "";
        if (err instanceof Error) return err.message;
        if (typeof err === "string") return err;
        try {
          return JSON.stringify(err);
        } catch {
          return "An error occurred";
        }
      })();

      const lower = msg.toLowerCase();
      const isInsufficientCredit =
        lower.includes("insufficient") ||
        lower.includes("no credit") ||
        lower.includes("insufficient credit") ||
        lower.includes("payment required") ||
        lower.includes("402");

      if (isInsufficientCredit) {
        showToast(
          "Generation failed: insufficient credits. Please top up your Stability account.",
          { type: "error", durationMs: 6000 }
        );
      } else {
        showToast(msg || "Failed to generate image.", { type: "error" });
      }
    },
  }));

  // Subscribe to realtime generation-created events
  onMount(() => {
    loadHistory();
    const unsubscribe = window.api.onGenerationCreated(({ imagePath }) => {
      setLatestImagePath(imagePath);
      // Refresh history on new generation
      void loadHistory();
    });
    onCleanup(() => unsubscribe());
  });

  const canSubmit = createMemo(
    () => search().prompt.trim().length > 0 && !generateImageMutation.isPending
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!canSubmit()) return;
    generateImageMutation.mutate({
      ...search(),
      projectPath,
    });
  };

  const handleCloseProject = async () => {
    try {
      await window.api.closeProject();
      navigate({ to: "/" });
    } catch (error) {
      console.error("Error closing project:", error);
    }
  };

  const handleOpenSettings = () => {
    navigate({
      to: "/settings",
      search: {
        returnTo: `/workspace?project=${encodeURIComponent(projectPath)}`,
      },
    });
  };

  return (
    <div
      class={css((t) => ({
        height: "100vh",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        background: t.var("--gradient-primary"),
        color: t.var("--color-paper-800"),
        fontFamily: "system-ui, -apple-system, sans-serif",
      }))}
    >
      {/* Header with project info and controls */}
      <div
        class={css((t) => ({
          alignSelf: "stretch",
          padding: "16px 24px",
          background: t.var("--color-paper-100"),
          backdropFilter: "blur(10px)",
          borderBottom: `1px solid ${t.var("--color-paper-300")}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }))}
      >
        <div
          class={css({
            display: "flex",
            alignItems: "center",
            gap: "16px",
          })}
        >
          <h1
            class={css({
              margin: "0",
              fontSize: "20px",
              fontWeight: "600",
            })}
          >
            {loaderData().name}
          </h1>
          <div
            class={css((t) => ({
              padding: "4px 8px",
              background: t.var("--color-paper-200"),
              borderRadius: "4px",
              fontSize: "12px",
              fontWeight: "500",
            }))}
          >
            Project
          </div>
        </div>

        <div class={css({ display: "flex", gap: "12px" })}>
          <button
            onClick={handleOpenSettings}
            class={css((t) => ({
              padding: "8px 16px",
              background: t.var("--color-paper-200"),
              color: t.var("--color-paper-800"),
              border: `1px solid ${t.var("--color-paper-400")}`,
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { background: t.var("--color-paper-300") },
            }))}
          >
            Settings
          </button>
          <button
            onClick={handleCloseProject}
            class={css((t) => ({
              padding: "8px 16px",
              background: t.var("--color-red-500"),
              color: t.var("--color-paper-100"),
              border: `1px solid ${t.var("--color-red-300")}`,
              borderRadius: "6px",
              fontSize: "14px",
              cursor: "pointer",
              transition: "all 0.2s",
              "&:hover": { background: t.var("--color-red-600") },
            }))}
          >
            Close Project
          </button>
        </div>
      </div>
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
            <p>Loading project...</p>
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
          {/* Main content area */}
          <div
            class={css({
              flex: "1",
              display: "flex",
              padding: "32px",
              gap: "24px",
              alignItems: "flex-start",
              justifyContent: "center",
            })}
          >
            {/* Prompt form */}
            <form
              onSubmit={handleSubmit}
              class={css((t) => ({
                width: "100%",
                maxWidth: "860px",
                background: t.var("--color-paper-100"),
                backdropFilter: "blur(10px)",
                borderRadius: "12px",
                padding: "24px",
                border: `1px solid ${t.var("--color-paper-300")}`,
              }))}
            >
              <div
                class={css({
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "baseline",
                  marginBottom: "12px",
                })}
              >
                <h2
                  class={css({ margin: 0, fontSize: "20px", fontWeight: 600 })}
                >
                  Image Generation
                </h2>
                <div class={css({ opacity: 0.8, fontSize: "12px" })}>
                  {loaderData().name}
                </div>
              </div>

              {/* Prompt */}
              <label
                class={css({
                  display: "block",
                  fontSize: "14px",
                  fontWeight: 500,
                  margin: "12px 0 6px 0",
                  opacity: 0.95,
                })}
              >
                Prompt
              </label>
              <textarea
                value={search().prompt}
                onInput={(e) =>
                  navigate({
                    search: (prev) => ({
                      ...prev,
                      prompt: e.currentTarget.value,
                    }),
                  })
                }
                placeholder="A cinematic portrait of a cyberpunk samurai, dramatic lighting, 35mm film"
                rows={3}
                class={css((t) => ({
                  width: "100%",
                  resize: "vertical",
                  padding: "12px",
                  background: t.var("--color-paper-100"),
                  color: t.var("--color-paper-800"),
                  border: `1px solid ${t.var("--color-paper-300")}`,
                  borderRadius: "8px",
                  fontSize: "14px",
                }))}
              />

              {/* Advanced options toggle */}
              <div class={css({ margin: "16px 0 12px 0" })}>
                <button
                  type="button"
                  aria-expanded={showAdvanced() ? "true" : "false"}
                  onClick={() => setShowAdvanced((v) => !v)}
                  class={css((t) => ({
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: "8px",
                    padding: "8px 12px",
                    background: "transparent",
                    color: t.var("--color-paper-700"),
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                    borderRadius: "8px",
                    cursor: "pointer",
                  }))}
                >
                  <span class={css({ fontWeight: 600, fontSize: "14px" })}>
                    Advanced options
                  </span>
                  <span class={css({ opacity: 0.9, fontSize: "12px" })}>
                    {showAdvanced() ? "Hide" : "Show"}
                  </span>
                </button>

                <Show when={showAdvanced()}>
                  <div class={css({ margin: "12px 0 0 0" })}>
                    {/* Negative Prompt */}
                    <label
                      class={css({
                        display: "block",
                        fontSize: "14px",
                        fontWeight: 500,
                        margin: "0 0 6px 0",
                        opacity: 0.95,
                      })}
                    >
                      Negative Prompt
                    </label>
                    <textarea
                      value={search().negativePrompt ?? ""}
                      onInput={(e) =>
                        navigate({
                          search: (prev) => ({
                            ...prev,
                            negativePrompt: e.currentTarget.value,
                          }),
                        })
                      }
                      placeholder="blurry, low-res, bad anatomy, extra fingers"
                      rows={2}
                      class={css((t) => ({
                        width: "100%",
                        resize: "vertical",
                        padding: "12px",
                        background: t.var("--color-paper-200"),
                        color: t.var("--color-paper-800"),
                        border: `1px solid ${t.var("--color-paper-300")}`,
                        borderRadius: "8px",
                        fontSize: "14px",
                      }))}
                    />

                    {/* Controls grid */}
                    <div
                      class={css({
                        display: "grid",
                        gap: "12px",
                        gridTemplateColumns:
                          "repeat(auto-fit, minmax(220px, 1fr))",
                        margin: "16px 0 12px 0",
                      })}
                    >
                      {/* Model */}
                      <div>
                        <label
                          class={css({
                            display: "block",
                            fontSize: "12px",
                            opacity: 0.9,
                            margin: "0 0 6px 0",
                          })}
                        >
                          Model
                        </label>
                        <select
                          value={search().model ?? ""}
                          onChange={(e) =>
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                model: e.currentTarget.value,
                              }),
                            })
                          }
                          class={css((t) => ({
                            width: "100%",
                            padding: "10px 12px",
                            background: t.var("--color-paper-100"),
                            color: t.var("--color-paper-800"),
                            border: `1px solid ${t.var("--color-paper-300")}`,
                            borderRadius: "8px",
                            fontSize: "14px",
                          }))}
                        >
                          <option value="">Model (optional)</option>
                          <option value="sd3.5-large">
                            Large (6.5 credits)
                          </option>
                          <option value="sd3.5-large-turbo">
                            Large Turbo (4 credits)
                          </option>
                          <option value="sd3.5-medium">
                            Medium (3.5 credits)
                          </option>
                          <option value="sd3.5-flash">
                            Flash (2.5 credits)
                          </option>
                        </select>
                      </div>

                      {/* Steps */}
                      <div>
                        <label
                          class={css({
                            display: "block",
                            fontSize: "12px",
                            opacity: 0.9,
                            margin: "0 0 6px 0",
                          })}
                        >
                          Steps: {search().steps}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="150"
                          value={String(search().steps)}
                          onInput={(e) =>
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                steps: Number(e.currentTarget.value),
                              }),
                            })
                          }
                          class={css({ width: "100%" })}
                        />
                      </div>

                      {/* CFG Scale */}
                      <div>
                        <label
                          class={css({
                            display: "block",
                            fontSize: "12px",
                            opacity: 0.9,
                            margin: "0 0 6px 0",
                          })}
                        >
                          CFG Scale: {search().cfgScale.toFixed(1)}
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="20"
                          step="0.5"
                          value={String(search().cfgScale)}
                          onInput={(e) =>
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                cfgScale: Number(e.currentTarget.value),
                              }),
                            })
                          }
                          class={css({ width: "100%" })}
                        />
                      </div>

                      {/* Size */}
                      <div>
                        <label
                          class={css({
                            display: "block",
                            fontSize: "12px",
                            opacity: 0.9,
                            margin: "0 0 6px 0",
                          })}
                        >
                          Size
                        </label>
                        <select
                          value={
                            search().width && search().height
                              ? `${search().width}x${search().height}`
                              : ""
                          }
                          onChange={(e) => {
                            if (!e.currentTarget.value) {
                              navigate({
                                search: (prev) => ({
                                  ...prev,
                                  width: undefined,
                                  height: undefined,
                                }),
                              });
                              return;
                            }
                            const [w, h] = e.currentTarget.value
                              .split("x")
                              .map((v) => parseInt(v, 10));
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                width: w,
                                height: h,
                              }),
                            });
                          }}
                          class={css((t) => ({
                            width: "100%",
                            padding: "10px 12px",
                            background: t.var("--color-paper-100"),
                            color: t.var("--color-paper-800"),
                            border: `1px solid ${t.var("--color-paper-300")}`,
                            borderRadius: "8px",
                            fontSize: "14px",
                          }))}
                        >
                          <option value="">Size (optional)</option>
                          <option value="512x512">512 x 512</option>
                          <option value="768x768">768 x 768</option>
                          <option value="1024x1024">1024 x 1024</option>
                          <option value="1152x896">1152 x 896</option>
                          <option value="896x1152">896 x 1152</option>
                        </select>
                      </div>

                      {/* Seed */}
                      <div>
                        <label
                          class={css({
                            display: "block",
                            fontSize: "12px",
                            opacity: 0.9,
                            margin: "0 0 6px 0",
                          })}
                        >
                          Seed (optional)
                        </label>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Random"
                          value={search().seed ?? ""}
                          onInput={(e) =>
                            navigate({
                              search: (prev) => ({
                                ...prev,
                                seed: e.currentTarget.value,
                              }),
                            })
                          }
                          class={css((t) => ({
                            width: "100%",
                            padding: "10px 12px",
                            background: t.var("--color-paper-200"),
                            color: t.var("--color-paper-800"),
                            border: `1px solid ${t.var("--color-paper-300")}`,
                            borderRadius: "8px",
                            fontSize: "14px",
                          }))}
                        />
                      </div>
                    </div>
                  </div>
                </Show>
              </div>

              <div
                class={css({
                  display: "flex",
                  gap: "12px",
                  justifyContent: "flex-end",
                  marginTop: "8px",
                })}
              >
                <Link
                  to="/workspace"
                  search={{
                    project: search().project,
                    prompt: "",
                  }}
                  class={css((t) => ({
                    padding: "10px 16px",
                    background: "transparent",
                    color: t.var("--color-paper-800"),
                    border: `1px solid ${t.var("--color-paper-400")}`,
                    borderRadius: "8px",
                    cursor: "pointer",
                  }))}
                >
                  Reset
                </Link>

                <button
                  type="submit"
                  disabled={!canSubmit()}
                  class={clsx(
                    css((t) => ({
                      padding: "10px 16px",
                      color: t.var("--color-paper-100"),
                      border: "none",
                      borderRadius: "8px",
                      fontWeight: 600,
                    })),
                    canSubmit()
                      ? css((t) => ({
                          background: t.var("--color-green-500"),
                          cursor: "pointer",
                          "&:hover": { background: t.var("--color-green-600") },
                        }))
                      : css((t) => ({
                          background: t.var("--color-green-200"),
                          cursor: "not-allowed",
                        }))
                  )}
                >
                  <Show
                    when={!generateImageMutation.isPending}
                    fallback={"Generating..."}
                  >
                    Generate
                  </Show>
                </button>
              </div>

              {/* Latest image preview */}
              <Show when={latestImagePath()}>
                <div class={css({ margin: "16px 0 0 0" })}>
                  <div
                    class={css({
                      fontSize: "12px",
                      opacity: 0.85,
                      marginBottom: "6px",
                    })}
                  >
                    Latest generation
                  </div>
                  <img
                    // src={`media://${latestImagePath()}`}
                    src={filePathToMediaUrl(latestImagePath()!)}
                    alt="Latest generation"
                    class={css((t) => ({
                      width: "100%",
                      maxHeight: "480px",
                      objectFit: "contain",
                      background: t.var("--color-paper-100"),
                      border: `1px solid ${t.var("--color-paper-300")}`,
                      borderRadius: "8px",
                    }))}
                  />
                </div>
              </Show>

              {/* History grid */}
              <div class={css({ margin: "20px 0 0 0" })}>
                <div
                  class={css({
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "8px",
                  })}
                >
                  <div class={css({ fontSize: "12px", opacity: 0.85 })}>
                    Recent generations
                  </div>
                  <button
                    type="button"
                    onClick={() => void loadHistory()}
                    class={css((t) => ({
                      padding: "6px 10px",
                      background: t.var("--color-paper-100"),
                      color: t.var("--color-paper-800"),
                      border: `1px solid ${t.var("--color-paper-300")}`,
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "12px",
                    }))}
                  >
                    Refresh
                  </button>
                </div>
                <Show
                  when={history().length > 0}
                  fallback={
                    <div class={css({ opacity: 0.8 })}>No images yet</div>
                  }
                >
                  <div
                    class={css({
                      display: "grid",
                      gap: "10px",
                      gridTemplateColumns:
                        "repeat(auto-fill, minmax(140px, 1fr))",
                    })}
                  >
                    <For each={history()}>
                      {(item) => (
                        <Link
                          to="/workspace/image"
                          search={(prev) => ({
                            ...prev,
                            project: projectPath,
                            image: String(item.id),
                          })}
                          class={css((t) => ({
                            background: t.var("--color-paper-100"),
                            border: `1px solid ${t.var("--color-paper-300")}`,
                            borderRadius: "8px",
                            overflow: "hidden",
                          }))}
                        >
                          <img
                            src={filePathToMediaUrl(item.imagePath)}
                            alt={item.prompt}
                            class={css((t) => ({
                              width: "100%",
                              height: "140px",
                              objectFit: "cover",
                              display: "block",
                              background: t.var("--color-paper-100"),
                            }))}
                          />
                          <div
                            class={css({
                              padding: "6px 8px",
                              fontSize: "11px",
                              opacity: 0.9,
                              whiteSpace: "nowrap",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                            })}
                            title={item.prompt}
                          >
                            {item.prompt}
                          </div>
                        </Link>
                      )}
                    </For>
                  </div>
                </Show>
              </div>
            </form>
          </div>
        </>
      </Suspense>
    </div>
  );
}
