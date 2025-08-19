import { createFileRoute, redirect } from "@tanstack/solid-router";
import { css } from "@flow-css/core/css";
import { filePathToMediaUrl } from "../../../shared/media-protocol";
import { z } from "zod";
import { showToast } from "../../toast";

const SearchSchema = z.object({
  project: z.string(),
  image: z.coerce.number(),
});

export const Route = createFileRoute("/workspace/image")({
  validateSearch: SearchSchema,
  beforeLoad: async ({ search }) => {
    const hasApiKey = await window.api.hasApiKey();
    if (!hasApiKey) {
      throw redirect({ to: "/", search: { showApiModal: true } });
    }
    if (!search.project) {
      throw redirect({ to: "/" });
    }
    if (!search.image) {
      throw redirect({ to: "/workspace", search: { project: search.project } });
    }
  },
  loaderDeps: ({ search }) => ({ ...search }),
  loader: async ({ deps }) => {
    const details = await window.api.getGenerationById(deps.image);
    if (!details) {
      throw redirect({ to: "/workspace", search: deps });
    }
    return details;
  },
  component: ImageDetailsPage,
});

function Row(props: { label: string; value?: string | number | null }) {
  return (
    <div
      class={css({
        display: "grid",
        gridTemplateColumns: "120px 1fr",
        gap: "8px",
        alignItems: "baseline",
      })}
    >
      <div class={css({ opacity: 0.8, fontSize: "12px" })}>{props.label}</div>
      <div class={css({ fontSize: "14px" })}>{String(props.value ?? "—")}</div>
    </div>
  );
}

function ImageDetailsPage() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const details = Route.useLoaderData();

  const onCopy = async () => {
    try {
      await navigator.clipboard.writeText(details().prompt);
      showToast("Copied prompt to clipboard", { type: "success" });
    } catch (e) {
      showToast("Clipboard not available", { type: "error" });
    }
  };

  return (
    <div
      class={css((t) => ({
        height: "100vh",
        overflow: "auto",
        display: "flex",
        flexDirection: "column",
        background: t.var("--gradient-primary"),
        color: t.var("--color-paper-800"),
        fontFamily: "system-ui, -apple-system, sans-serif",
      }))}
    >
      <div
        class={css((t) => ({
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: `1px solid ${t.var("--color-paper-300")}`,
          background: t.var("--color-paper-100"),
          backdropFilter: "blur(10px)",
        }))}
      >
        <div
          class={css({ display: "flex", gap: "12px", alignItems: "center" })}
        >
          <button
            onClick={() =>
              navigate({
                to: "/workspace",
                search: (p) => ({ ...p, project: search().project }),
              })
            }
            class={css((t) => ({
              padding: "6px 10px",
              background: "transparent",
              border: `1px solid ${t.var("--color-paper-400")}`,
              borderRadius: "6px",
              cursor: "pointer",
            }))}
          >
            Back
          </button>
          <h1 class={css({ margin: 0, fontSize: "18px", fontWeight: 600 })}>
            Image Details
          </h1>
        </div>
        <button
          onClick={onCopy}
          title="Copy prompt"
          class={css((t) => ({
            padding: "8px 12px",
            background: t.var("--color-paper-200"),
            color: t.var("--color-paper-800"),
            border: `1px solid ${t.var("--color-paper-400")}`,
            borderRadius: "6px",
            cursor: "pointer",
          }))}
        >
          Copy Prompt
        </button>
      </div>

      <div
        class={css({
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "24px",
          padding: "24px",
        })}
      >
        <div>
          <img
            src={filePathToMediaUrl(details().imagePath)}
            alt={details().prompt}
            class={css((t) => ({
              width: "100%",
              maxHeight: "70vh",
              objectFit: "contain",
              background: t.var("--color-paper-100"),
              border: `1px solid ${t.var("--color-paper-300")}`,
              borderRadius: "8px",
            }))}
          />
        </div>
        <div
          class={css((t) => ({
            background: t.var("--color-paper-100"),
            border: `1px solid ${t.var("--color-paper-300")}`,
            borderRadius: "12px",
            padding: "16px",
            display: "grid",
            gap: "10px",
            alignContent: "start",
          }))}
        >
          <Row label="Prompt" value={details().prompt} />
          <Row label="Negative" value={details().negativePrompt} />
          <Row label="Model" value={details().model} />
          <Row label="Steps" value={details().steps} />
          <Row label="CFG" value={details().guidance} />
          <Row label="Width" value={details().width} />
          <Row label="Height" value={details().height} />
          <Row label="Seed" value={details().seed} />
          <Row label="Created" value={details().createdAt} />

          <button
            class={css((t) => ({
              marginTop: "8px",
              padding: "10px 16px",
              fontWeight: 800,
              color: t.var("--color-paper-100"),
              background: t.var("--color-green-500"),
              border: "none",
              borderRadius: "8px",
              cursor: "pointer",
              "&:hover": { background: t.var("--color-green-600") },
            }))}
            onClick={() =>
              navigate({
                to: "/workspace",
                search: (prev) => ({
                  ...prev,
                  project: search().project,
                  prompt: details().prompt,
                  negativePrompt: details().negativePrompt ?? "",
                  model: details().model ?? "sdxl",
                  steps: details().steps ?? 30,
                  cfgScale: details().guidance ?? 7.5,
                  width: details().width ?? 1024,
                  height: details().height ?? 1024,
                  seed: (details().seed ?? "").toString(),
                }),
              })
            }
          >
            Create Iteration
          </button>
        </div>
      </div>
    </div>
  );
}
