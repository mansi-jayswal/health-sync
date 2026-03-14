# Phase 4 — Scan Viewer

> Browser-based image viewer with zoom, pan, and fullscreen for JPG/PNG scans.
> Opens as a fullscreen overlay when a thumbnail is clicked in `ScanGallery`.
> **Depends on Phase 3 (Scan Upload) being complete** — images and signed URLs must exist.

---

## Context

`ScanGallery` (Phase 3) renders thumbnails and has an `onImageClick(index)` prop ready. This phase builds the viewer that opens when a thumbnail is clicked. Format is JPG/PNG — use native `<img>` rendering. No DICOM library needed.

This is a **pure frontend phase** — no new DB tables, no new API routes beyond what Phase 3 already provides.

---

## What Gets Built

| Task | Notes |
|---|---|
| `ScanViewer` component | Fullscreen overlay with zoom, pan, navigation |
| Viewer toolbar | Zoom in/out, reset, fullscreen toggle, close |
| Image navigation | Arrow buttons + keyboard arrows between images |
| Signed URL per image | Fetches from existing Phase 3 route |
| Next image prefetch | Background prefetch for smooth navigation |
| Wire into study detail page stub | Phase 5 builds the full detail page — this phase adds the viewer overlay hook |

---

## No New API Routes or DB Changes

All data comes from Phase 3 routes:
- `GET /api/studies/[id]/scans` — image list (metadata)
- `GET /api/studies/[id]/scans/[imageId]/signed-url` — signed URL per image

No new routes, no migrations.

---

## Viewer Behaviour

### Opening
- User clicks a thumbnail in `ScanGallery`.
- `ScanViewer` renders as a **fixed full-viewport overlay** (`fixed inset-0 z-50`).
- The clicked image is shown first (`initialIndex` prop).

### Image Navigation
- Left/right arrow buttons on sides of image.
- Keyboard: `←` / `→` arrow keys.
- Image counter: `"3 / 7"` shown in toolbar.
- At first image: left arrow disabled. At last image: right arrow disabled.

### Zoom & Pan
- Zoom in / out buttons: ±25% per click.
- Scroll wheel: ±10% per tick.
- Zoom range: 25% min → 400% max.
- When zoom > 100%: click-drag to pan. Cursor: `grab` (hover) / `grabbing` (dragging).
- Reset button: returns to 100% zoom, clears pan offset.
- Pan resets to zero when navigating to a new image.

### Fullscreen
- Fullscreen button: calls `viewerRef.current.requestFullscreen()`.
- Button label toggles: "Fullscreen" / "Exit Fullscreen".
- ESC exits fullscreen (browser default — no custom handler needed).

### Loading & Error
- Show spinner/skeleton while signed URL fetches.
- If signed URL fetch fails: show inline error message + "Retry" button that re-queries.

### Closing
- Close button (top-right `×`).
- `Escape` key closes viewer (only when not in fullscreen mode — browser handles ESC for fullscreen itself).

---

## Component — `ScanViewer`

File: `components/dashboard/scan-viewer.tsx`

```ts
interface ScanViewerProps {
  studyId: string;
  images: ScanImage[];       // full list from useStudyScans
  initialIndex?: number;     // which image to show first (default: 0)
  onClose: () => void;
}
```

### Internal state (all `useState`)

```ts
currentIndex: number
zoom: number                        // 1.0 = 100%
panOffset: { x: number; y: number }
isDragging: boolean
dragStart: { x: number; y: number }
isFullscreen: boolean
```

### Signed URL fetching

```ts
// Active image URL
const { data: activeUrl } = useStudyScanSignedUrl(studyId, images[currentIndex].id);

// Prefetch next image in background
const { } = useStudyScanSignedUrl(studyId, images[currentIndex + 1]?.id ?? '', {
  enabled: currentIndex + 1 < images.length,
});
```

### Image rendering

```tsx
<img
  src={activeUrl?.url}
  draggable={false}
  style={{
    transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`,
    transformOrigin: 'center center',
    willChange: 'transform',
    cursor: zoom > 1 ? (isDragging ? 'grabbing' : 'grab') : 'default',
  }}
/>
```

> Inline `style` is acceptable here — these are dynamic runtime values (AGENTS.md allows inline style for truly dynamic values only).

### Toolbar layout

```
[ ← Prev ]  [ N / Total ]  [ Next → ]     [ − ]  [ Reset ]  [ + ]  [ ⛶ Fullscreen ]  [ × Close ]
```

All buttons use shadcn `Button` with `variant="ghost"` and `size="icon"`.

### Pan implementation (mouse events)

```ts
onMouseDown: set isDragging = true, record dragStart
onMouseMove: if isDragging, update panOffset by delta from dragStart
onMouseUp / onMouseLeave: set isDragging = false
```

### Keyboard events

```ts
useEffect(() => {
  const handler = (e: KeyboardEvent) => {
    if (e.key === 'ArrowLeft')  goToPrev();
    if (e.key === 'ArrowRight') goToNext();
    if (e.key === 'Escape' && !isFullscreen) onClose();
  };
  window.addEventListener('keydown', handler);
  return () => window.removeEventListener('keydown', handler);
}, [currentIndex, isFullscreen]);
```

---

## Styling

```ts
// Overlay
"fixed inset-0 z-50 bg-black/95 flex flex-col"

// Toolbar
"flex items-center gap-2 px-4 py-2 bg-black/80 border-b border-white/10 flex-shrink-0"

// Image container
"flex-1 overflow-hidden flex items-center justify-center relative"

// Image counter
"text-sm text-muted-foreground tabular-nums"
```

Use `cn()` for all conditional classes. No CSS modules.

---

## Wiring into Study List (temporary — Phase 5 replaces this)

Until Phase 5 builds the full study detail page, wire the viewer into the existing study list so it can be tested immediately:

On the study list page, for each study row add a "View Scans" button that:
1. Fetches scans for that study.
2. Opens `ScanViewer` as overlay.

This is temporary scaffolding. Phase 5 moves this into the proper study detail page.

---

## Definition of Done

- [ ] `ScanViewer` renders active image via signed URL.
- [ ] Zoom in/out buttons work (25%–400% range enforced).
- [ ] Scroll wheel zoom works.
- [ ] Click-drag pan works when zoom > 100%.
- [ ] Pan resets when navigating to new image.
- [ ] Reset button returns to 100% zoom and zero pan.
- [ ] Left/right navigation buttons switch images correctly.
- [ ] Keyboard `←` / `→` navigate images.
- [ ] Left arrow disabled on first image; right arrow disabled on last.
- [ ] Fullscreen button works; ESC exits fullscreen.
- [ ] ESC (non-fullscreen) closes viewer.
- [ ] Loading state shown while URL fetches.
- [ ] Error state shown with retry button if URL fetch fails.
- [ ] Next image URL prefetches in background.
- [ ] Tested with 1 image (nav arrows hidden/disabled), and with 5+ images.
- [ ] `planning/features.md`: Scan viewer → `done`.
