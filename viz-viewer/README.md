# viz-viewer

Local React dev server that auto-discovers and renders JSX visualizations from the DL4CV repo.

## How It Works

The app uses Vite's `import.meta.glob("../../**/viz/*.jsx")` to find every `.jsx` file sitting inside a `viz/` subfolder anywhere in the repo. The sidebar groups them by chapter directory. Click a file → the component renders in the main panel.

## Setup (One Time)

```bash
# From repo root
brew install node    # if you don't already have Node.js
cd viz-viewer
npm install
```

## Usage

```bash
# From repo root
./start-viz.sh
```

Or manually:

```bash
cd viz-viewer && npm run dev
```

Opens at `http://localhost:5174`. Hot-reloads when JSX files change.

## Adding Visualizations

Drop any `.jsx` file into a `viz/` subfolder within a chapter directory:

```
knn-classifier/
  viz/
    viz-knn-concepts.jsx     ← auto-discovered
    viz-2d-to-flatten.jsx    ← auto-discovered
linear-classifier/
  viz/
    viz-loss-landscape.jsx   ← auto-discovered
```

Each JSX file must have a default export:

```jsx
export default function MyViz() {
  return <div>...</div>;
}
```

Refresh the browser (or let hot-reload pick it up) and the new file appears in the sidebar.

## Extra Dependencies

If a visualization imports a library beyond React (like `recharts`), install it:

```bash
cd viz-viewer
npm install recharts
```
