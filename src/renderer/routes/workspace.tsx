import { createFileRoute, redirect } from "@tanstack/solid-router";
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
import { filePathToMediaUrl } from "../../shared/media-protocol";

// Workspace route with project query parameter
export const Route = createFileRoute("/workspace")({
  validateSearch: (search: Record<string, unknown>) => {
    return {
      project: (search.project as string) || "",
    };
  },
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

  // Image prompt form state
  const [prompt, setPrompt] = createSignal("");
  const [negativePrompt, setNegativePrompt] = createSignal("");
  const [model, setModel] = createSignal<string | undefined>(undefined);
  const [steps, setSteps] = createSignal<number | undefined>(undefined);
  const [cfgScale, setCfgScale] = createSignal<number | undefined>(undefined);
  const [width, setWidth] = createSignal<number | undefined>(undefined);
  const [height, setHeight] = createSignal<number | undefined>(undefined);
  const [seed, setSeed] = createSignal("");
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
    mutationFn: async (input: {
      prompt: string;
      negativePrompt?: string;
      model?: string;
      steps?: number;
      cfgScale?: number;
      width?: number;
      height?: number;
      seed?: string;
      projectPath: string;
    }) => {
      const result = await window.api.generateImage({
        prompt: input.prompt,
        negativePrompt: input.negativePrompt,
        steps: input.steps,
        cfgScale: input.cfgScale,
        width: input.width,
        height: input.height,
        seed: input.seed,
        model: input.model,
      });
      setLatestImagePath(result.imagePath);
      return result;
    },
    onError: (err) => {
      console.error("Error generating image:", err);
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
    () => prompt().trim().length > 0 && !generateImageMutation.isPending
  );

  const handleSubmit = async (e: Event) => {
    e.preventDefault();
    if (!canSubmit()) return;
    generateImageMutation.mutate({
      prompt: prompt().trim(),
      negativePrompt: negativePrompt().trim() || undefined,
      model: model(),
      steps: steps(),
      cfgScale: cfgScale(),
      width: width(),
      height: height(),
      seed: seed().trim() || undefined,
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
        </div>
      }
    >
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
              {loaderData().name}
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
              onClick={handleOpenSettings}
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
              Settings
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
            padding: "32px",
            gap: "24px",
            "align-items": "flex-start",
            "justify-content": "center",
          }}
        >
          {/* Prompt form */}
          <form
            onSubmit={handleSubmit}
            style={{
              width: "100%",
              "max-width": "860px",
              background: "rgba(255, 255, 255, 0.1)",
              "backdrop-filter": "blur(10px)",
              "border-radius": "12px",
              padding: "24px",
              border: "1px solid rgba(255, 255, 255, 0.2)",
            }}
          >
            <div
              style={{
                display: "flex",
                "justify-content": "space-between",
                "align-items": "baseline",
                "margin-bottom": "12px",
              }}
            >
              <h2
                style={{ margin: 0, "font-size": "20px", "font-weight": 600 }}
              >
                Image Generation
              </h2>
              <div style={{ opacity: 0.8, "font-size": "12px" }}>
                {loaderData().name}
              </div>
            </div>

            {/* Prompt */}
            <label
              style={{
                display: "block",
                "font-size": "14px",
                "font-weight": 500,
                margin: "12px 0 6px 0",
                opacity: 0.95,
              }}
            >
              Prompt
            </label>
            <textarea
              value={prompt()}
              onInput={(e) => setPrompt(e.currentTarget.value)}
              placeholder="A cinematic portrait of a cyberpunk samurai, dramatic lighting, 35mm film"
              rows={3}
              style={{
                width: "100%",
                resize: "vertical",
                padding: "12px",
                background: "rgba(255, 255, 255, 0.9)",
                color: "#111827",
                border: "1px solid rgba(0,0,0,0.1)",
                "border-radius": "8px",
                "font-size": "14px",
              }}
            />

            {/* Advanced options toggle */}
            <div style={{ margin: "16px 0 12px 0" }}>
              <button
                type="button"
                aria-expanded={showAdvanced() ? "true" : "false"}
                onClick={() => setShowAdvanced((v) => !v)}
                style={{
                  width: "100%",
                  display: "flex",
                  "align-items": "center",
                  "justify-content": "space-between",
                  gap: "8px",
                  padding: "8px 12px",
                  background: "transparent",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  "border-radius": "8px",
                  cursor: "pointer",
                }}
              >
                <span style={{ "font-weight": 600, "font-size": "14px" }}>
                  Advanced options
                </span>
                <span style={{ opacity: 0.9, "font-size": "12px" }}>
                  {showAdvanced() ? "Hide" : "Show"}
                </span>
              </button>

              <Show when={showAdvanced()}>
                <div style={{ margin: "12px 0 0 0" }}>
                  {/* Negative Prompt */}
                  <label
                    style={{
                      display: "block",
                      "font-size": "14px",
                      "font-weight": 500,
                      margin: "0 0 6px 0",
                      opacity: 0.95,
                    }}
                  >
                    Negative Prompt
                  </label>
                  <textarea
                    value={negativePrompt()}
                    onInput={(e) => setNegativePrompt(e.currentTarget.value)}
                    placeholder="blurry, low-res, bad anatomy, extra fingers"
                    rows={2}
                    style={{
                      width: "100%",
                      resize: "vertical",
                      padding: "12px",
                      background: "rgba(255, 255, 255, 0.75)",
                      color: "#111827",
                      border: "1px solid rgba(0,0,0,0.1)",
                      "border-radius": "8px",
                      "font-size": "14px",
                    }}
                  />

                  {/* Controls grid */}
                  <div
                    style={{
                      display: "grid",
                      gap: "12px",
                      "grid-template-columns":
                        "repeat(auto-fit, minmax(220px, 1fr))",
                      margin: "16px 0 12px 0",
                    }}
                  >
                    {/* Model */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          "font-size": "12px",
                          opacity: 0.9,
                          margin: "0 0 6px 0",
                        }}
                      >
                        Model
                      </label>
                      <select
                        value={model() ?? ""}
                        onChange={(e) =>
                          setModel(e.currentTarget.value || undefined)
                        }
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255,255,255,0.9)",
                          color: "#111827",
                          border: "1px solid rgba(0,0,0,0.1)",
                          "border-radius": "8px",
                          "font-size": "14px",
                        }}
                      >
                        <option value="">Model (optional)</option>
                        <option value="sdxl">Stable Diffusion XL</option>
                        <option value="sd15">Stable Diffusion 1.5</option>
                      </select>
                    </div>

                    {/* Steps */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          "font-size": "12px",
                          opacity: 0.9,
                          margin: "0 0 6px 0",
                        }}
                      >
                        Steps: {steps()}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="150"
                        value={String(steps() ?? 30)}
                        onInput={(e) => {
                          const val = parseInt(
                            e.currentTarget.value || "0",
                            10
                          );
                          setSteps(Number.isNaN(val) ? undefined : val);
                        }}
                        style={{ width: "100%" }}
                      />
                    </div>

                    {/* CFG Scale */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          "font-size": "12px",
                          opacity: 0.9,
                          margin: "0 0 6px 0",
                        }}
                      >
                        CFG Scale: {(cfgScale() ?? 7.5).toFixed(1)}
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="20"
                        step="0.5"
                        value={String(cfgScale() ?? 7.5)}
                        onInput={(e) => {
                          const val = parseFloat(
                            e.currentTarget.value || "NaN"
                          );
                          setCfgScale(Number.isNaN(val) ? undefined : val);
                        }}
                        style={{ width: "100%" }}
                      />
                    </div>

                    {/* Size */}
                    <div>
                      <label
                        style={{
                          display: "block",
                          "font-size": "12px",
                          opacity: 0.9,
                          margin: "0 0 6px 0",
                        }}
                      >
                        Size
                      </label>
                      <select
                        value={
                          width() && height() ? `${width()}x${height()}` : ""
                        }
                        onChange={(e) => {
                          if (!e.currentTarget.value) {
                            setWidth(undefined);
                            setHeight(undefined);
                            return;
                          }
                          const [w, h] = e.currentTarget.value
                            .split("x")
                            .map((v) => parseInt(v, 10));
                          setWidth(Number.isNaN(w) ? undefined : w);
                          setHeight(Number.isNaN(h) ? undefined : h);
                        }}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255,255,255,0.9)",
                          color: "#111827",
                          border: "1px solid rgba(0,0,0,0.1)",
                          "border-radius": "8px",
                          "font-size": "14px",
                        }}
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
                        style={{
                          display: "block",
                          "font-size": "12px",
                          opacity: 0.9,
                          margin: "0 0 6px 0",
                        }}
                      >
                        Seed (optional)
                      </label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Random"
                        value={seed()}
                        onInput={(e) => setSeed(e.currentTarget.value)}
                        style={{
                          width: "100%",
                          padding: "10px 12px",
                          background: "rgba(255,255,255,0.75)",
                          color: "#111827",
                          border: "1px solid rgba(0,0,0,0.1)",
                          "border-radius": "8px",
                          "font-size": "14px",
                        }}
                      />
                    </div>
                  </div>
                </div>
              </Show>
            </div>

            <div
              style={{
                display: "flex",
                gap: "12px",
                "justify-content": "flex-end",
                "margin-top": "8px",
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setPrompt("");
                  setNegativePrompt("");
                  setModel("sdxl");
                  setSteps(30);
                  setCfgScale(7.5);
                  setWidth(1024);
                  setHeight(1024);
                  setSeed("");
                }}
                style={{
                  padding: "10px 16px",
                  background: "transparent",
                  color: "white",
                  border: "1px solid rgba(255, 255, 255, 0.4)",
                  "border-radius": "8px",
                  cursor: "pointer",
                }}
              >
                Reset
              </button>

              <button
                type="submit"
                disabled={!canSubmit()}
                style={{
                  padding: "10px 16px",
                  background: canSubmit()
                    ? "#10b981"
                    : "rgba(16, 185, 129, 0.5)",
                  color: "white",
                  border: "none",
                  "border-radius": "8px",
                  cursor: canSubmit() ? "pointer" : "not-allowed",
                  "font-weight": 600,
                }}
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
              <div style={{ margin: "16px 0 0 0" }}>
                <div
                  style={{
                    "font-size": "12px",
                    opacity: 0.85,
                    "margin-bottom": "6px",
                  }}
                >
                  Latest generation
                </div>
                <img
                  // src={`media://${latestImagePath()}`}
                  src={filePathToMediaUrl(latestImagePath()!)}
                  alt="Latest generation"
                  style={{
                    width: "100%",
                    "max-height": "480px",
                    "object-fit": "contain",
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.25)",
                    "border-radius": "8px",
                  }}
                />
              </div>
            </Show>

            {/* History grid */}
            <div style={{ margin: "20px 0 0 0" }}>
              <div
                style={{
                  display: "flex",
                  "justify-content": "space-between",
                  "align-items": "center",
                  "margin-bottom": "8px",
                }}
              >
                <div style={{ "font-size": "12px", opacity: 0.85 }}>
                  Recent generations
                </div>
                <button
                  type="button"
                  onClick={() => void loadHistory()}
                  style={{
                    padding: "6px 10px",
                    background: "rgba(255, 255, 255, 0.15)",
                    color: "white",
                    border: "1px solid rgba(255, 255, 255, 0.25)",
                    "border-radius": "6px",
                    cursor: "pointer",
                    "font-size": "12px",
                  }}
                >
                  Refresh
                </button>
              </div>
              <Show
                when={history().length > 0}
                fallback={<div style={{ opacity: 0.8 }}>No images yet</div>}
              >
                <div
                  style={{
                    display: "grid",
                    gap: "10px",
                    "grid-template-columns":
                      "repeat(auto-fill, minmax(140px, 1fr))",
                  }}
                >
                  <For each={history()}>
                    {(item) => (
                      <div
                        style={{
                          background: "rgba(255,255,255,0.12)",
                          border: "1px solid rgba(255,255,255,0.2)",
                          "border-radius": "8px",
                          overflow: "hidden",
                        }}
                      >
                        <img
                          // src={`media://${item.imagePath}`}
                          src={filePathToMediaUrl(item.imagePath)}
                          alt={item.prompt}
                          style={{
                            width: "100%",
                            height: "140px",
                            "object-fit": "cover",
                            display: "block",
                            background: "rgba(255,255,255,0.1)",
                          }}
                        />
                        <div
                          style={{
                            padding: "6px 8px",
                            "font-size": "11px",
                            opacity: 0.9,
                            "white-space": "nowrap",
                            overflow: "hidden",
                            "text-overflow": "ellipsis",
                          }}
                          title={item.prompt}
                        >
                          {item.prompt}
                        </div>
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            </div>
          </form>
        </div>
      </div>
    </Suspense>
  );
}
