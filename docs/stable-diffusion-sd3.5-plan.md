## Stable Diffusion 3.5 Image Generation Integration Plan

- **API**: Stability AI SD 3/3.5 image generation
  - Docs: [Stability API: Image Generate (SD3/3.5)](https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1sd3/post)
- **Key requirements**:
  - Use API key from config (already stored via `get-api-key`/`set-api-key` IPC)
  - Call SD 3.5 generate endpoint from the main process
  - Save returned image into the current project's `images/` folder
  - Track prompt + params + saved image path in SQLite (`generations` table)
  - Display latest result in Workspace UI and show a history list/gallery

### End-to-end flow

1. Renderer (`/workspace`) submits generation form → calls `window.api.generateImage(...)` via IPC.
2. Main process resolves API key from config and current project from `projectManager`.
3. Main makes POST request to `https://api.stability.ai/v2beta/stable-image/generate/sd3` with headers and form data.
4. Receive binary image; save as `Project/images/<timestamp>_<shortid>.png`.
5. Insert a row in `generations` with prompt, params, and `image_path`.
6. Return `{ id, imagePath }` to the renderer.
7. Renderer updates UI: show the generated image preview and append to history.

### API request spec (main process)

- **URL**: `https://api.stability.ai/v2beta/stable-image/generate/sd3`
- **Method**: POST
- **Headers**:
  - `Authorization: Bearer <API_KEY>`
  - `Accept: image/png` (or `image/*`)
- **Body (multipart/form-data)** core fields we will send:
  - `prompt`: string (required)
  - `negative_prompt`: string (optional)
  - `seed`: integer (optional)
  - `output_format`: `png`
  - `model`: default `sd3.5-large` (allow `sd3.5-medium` later)
  - One of size controls supported by the SD3.5 endpoint. Preferred: `aspect_ratio`
    - Use aspect ratios (e.g., `1:1`, `16:9`, `9:16`, `3:2`, `4:5`).

Size mapping from current UI to `aspect_ratio`:

- `512x512`, `768x768`, `1024x1024` → `1:1`
- `1152x896` → `9:7` (closest). If the endpoint only supports fixed set, map to `4:3` (~1.33) or `5:4` (1.25) depending on availability.
- `896x1152` → `7:9` (closest). If limited, map to `3:4` (~0.75) or `4:5` (0.8).

If width/height are unset, default to `1:1`.

### Where to integrate

- Config/API key: `src/main/index.ts`
  - Already exposes IPC handlers `get-api-key`, `set-api-key`, `has-api-key` and reads/writes config.
- Project/DB: `src/main/project-manager.ts`
  - DB initialized via `migrate(db)`; images directory available via `getImagesDirectory()`.
  - Insert generation via `addGeneration(...)` and list via `getGenerations(...)`.
- Schema: `src/db/schema.ts`
  - `generations` table includes: `prompt`, `negative_prompt`, `seed`, `steps`, `guidance`, `width`, `height`, `image_path`, `created_at`.

### Main process: new IPC handler and helper

Add an IPC handler that:

1. Validates current project is open and images directory exists.
2. Loads API key; if missing, throws an error.
3. Builds `FormData`, mapping UI fields to SD3.5 fields.
4. Calls the endpoint; on success writes the PNG to disk.
5. Persists a `generations` row; returns `{ id, imagePath }`.

Suggested signature (IPC channel: `generate-image`):

```ts
// src/main/index.ts
ipcMain.handle(
  "generate-image",
  async (
    _,
    input: {
      prompt: string;
      negativePrompt?: string;
      steps?: number;
      cfgScale?: number;
      width?: number;
      height?: number;
      seed?: string; // may be numeric string
      model?: string; // future use
    }
  ) => {
    // 1) Resolve API key and project/images dir using projectManager
    // 2) Map {width,height} → aspect_ratio string
    // 3) Build FormData for SD3.5
    // 4) POST with fetch, get ArrayBuffer/Buffer of PNG
    // 5) Save to images/<timestamp>_<shortid>.png
    // 6) projectManager.addGeneration({...})
    // 7) return { id, imagePath }
  }
);
```

Notes:

- Keep the API key in main only; do not expose to renderer.
- Use Node `fetch` (Node 18+) or `undici`. For `FormData`, use `formdata-node` if needed.

### Preload: expose typed API to renderer

Extend `StableDiffusionAPI` in `src/preload/index.ts` with:

```ts
generateImage: (input: {
  prompt: string;
  negativePrompt?: string;
  steps?: number;
  cfgScale?: number;
  width?: number;
  height?: number;
  seed?: string;
  model?: string;
}) => Promise<{ id: number; imagePath: string }>;
```

And wire it via `ipcRenderer.invoke("generate-image", input)`.

Consider also exposing:

```ts
getGenerations: (opts?: { limit?: number; offset?: number }) =>
  Promise<GenerationRecord[]>;
```

### Realtime notification from main to renderer (planned)

After a generation is successfully saved, the main process will broadcast an event to all renderer windows so the UI can update without polling.

- **Event channel**: `generation-created`
- **Payload**: `{ id: number; imagePath: string }`

Main process (concept):

```ts
// After successful save and DB insert
// BrowserWindow.getAllWindows().forEach(win =>
//   win.webContents.send("generation-created", { id, imagePath })
// );
```

Preload additions:

```ts
// In StableDiffusionAPI
onGenerationCreated: (
  handler: (payload: { id: number; imagePath: string }) => void
) => () => void; // returns unsubscribe

// Implementation concept:
// const listener = (_e, payload) => handler(payload)
// ipcRenderer.on("generation-created", listener)
// return () => ipcRenderer.removeListener("generation-created", listener)
```

Renderer usage:

```ts
// Subscribe on mount
const unsubscribe = window.api.onGenerationCreated(({ id, imagePath }) => {
  // Update preview/gallery, optionally refetch `getGenerations()`
});

// Unsubscribe on cleanup
unsubscribe();
```

### Renderer: `workspace.tsx` changes

- Replace the placeholder mutation with a call to `window.api.generateImage(...)`.
- After success, show the returned image path in a preview and append to a simple gallery/list.
- Optionally load recent generations on mount using `getGenerations` to populate history.

Example usage inside the current mutation:

```ts
const result = await window.api.generateImage({
  prompt,
  negativePrompt,
  steps,
  cfgScale,
  width,
  height,
  seed,
  model: "sd3.5-large",
});

// result.imagePath is a local file path; use `file://` URL in `<img src>`
```

When rendering images in the renderer, convert to a file URL: `src={`file://${result.imagePath}`}`.

### File naming and storage

- Directory: `Project/images/`
- Filename: `${yyyyMMdd_HHmmss}_${shortId}.png`
- Return absolute path to renderer for display; renderer uses `file://` protocol.

### Database tracking

Insert a row using `projectManager.addGeneration(...)` including:

- `prompt`, `negativePrompt`, `seed`, `steps`, `guidance` (map from `cfgScale`), `width`, `height`, `imagePath`.

### Error handling

- If API key is missing/invalid → return a structured error; renderer should route user to Settings.
- Network/HTTP errors → include status code/message; do not create a DB row; surface error toast.
- Disk write failures → surface error and do not insert a DB row.

### Minimal UI additions

- Under the form, add a preview area that displays the most recent generation.
- Add a simple scrollable gallery grid from `getGenerations()` results.

### Testing checklist

- Settings: save API key and verify `hasApiKey` returns true.
- Create/open a project; ensure `images/` exists.
- Submit a prompt; verify a PNG file appears in `images/` and a row is added to `generations`.
- App displays the generated image and lists prior generations.

### References

- SD 3/3.5 endpoint docs: [Stability API: Image Generate (SD3/3.5)](https://platform.stability.ai/docs/api-reference#tag/Generate/paths/~1v2beta~1stable-image~1generate~1sd3/post)
