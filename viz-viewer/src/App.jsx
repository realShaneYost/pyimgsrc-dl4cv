import { useState, useEffect, Suspense, lazy, useMemo } from "react";

// ── Auto-discover all viz JSX files across the repo ──
// Vite resolves this at build time. Any file matching **/viz/*.jsx
// in the parent repo directory will appear here as a lazy import.
const vizModules = import.meta.glob("../../**/viz/*.jsx");

// ── Parse glob paths into a structured tree ──
function buildFileTree(modules) {
  const chapters = {};

  for (const rawPath of Object.keys(modules)) {
    // rawPath looks like: ../../knn-classifier/viz/viz-knn-concepts.jsx
    // Strip the leading ../../
    const cleaned = rawPath.replace(/^\.\.\/\.\.\//, "");
    const parts = cleaned.split("/");

    // parts: ["knn-classifier", "viz", "viz-knn-concepts.jsx"]
    const chapter = parts.slice(0, parts.indexOf("viz")).join("/");
    const filename = parts[parts.length - 1];
    const displayName = filename
      .replace(/\.jsx$/, "")
      .replace(/^viz-/, "")
      .replace(/-/g, " ");

    if (!chapters[chapter]) {
      chapters[chapter] = [];
    }

    chapters[chapter].push({
      path: rawPath,
      filename,
      displayName,
      chapter,
    });
  }

  // Sort files within each chapter
  for (const ch of Object.keys(chapters)) {
    chapters[ch].sort((a, b) => a.filename.localeCompare(b.filename));
  }

  return chapters;
}

// ── Styles ──
const styles = {
  container: {
    display: "flex",
    height: "100vh",
    width: "100vw",
    overflow: "hidden",
  },

  sidebar: {
    width: 272,
    minWidth: 272,
    height: "100%",
    background: "#0a0e17",
    borderRight: "1px solid #151c28",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
  },

  sidebarHeader: {
    padding: "20px 18px 16px",
    borderBottom: "1px solid #151c28",
    flexShrink: 0,
  },

  sidebarTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: "#fbbf24",
    letterSpacing: "0.12em",
    textTransform: "uppercase",
    marginBottom: 4,
  },

  sidebarSubtitle: {
    fontSize: 10,
    color: "#3d4a5c",
    fontWeight: 400,
  },

  sidebarScroll: {
    flex: 1,
    overflowY: "auto",
    padding: "12px 0",
  },

  chapterGroup: {
    marginBottom: 8,
  },

  chapterLabel: {
    fontSize: 9,
    fontWeight: 600,
    color: "#5a6a7e",
    textTransform: "uppercase",
    letterSpacing: "0.1em",
    padding: "8px 18px 6px",
    userSelect: "none",
  },

  fileButton: (isActive) => ({
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 18px 8px 24px",
    border: "none",
    background: isActive ? "rgba(251, 191, 36, 0.06)" : "transparent",
    color: isActive ? "#fbbf24" : "#6b7a8e",
    fontSize: 12,
    fontWeight: isActive ? 600 : 400,
    fontFamily: "inherit",
    cursor: "pointer",
    textAlign: "left",
    transition: "all 0.12s ease",
    borderLeft: isActive
      ? "2px solid #fbbf24"
      : "2px solid transparent",
    letterSpacing: "-0.01em",
  }),

  fileIcon: (isActive) => ({
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: isActive ? "#fbbf24" : "#2d3748",
    flexShrink: 0,
    transition: "all 0.15s ease",
  }),

  mainPanel: {
    flex: 1,
    height: "100%",
    overflow: "auto",
    background: "#06090f",
    position: "relative",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 16,
    color: "#2d3748",
    padding: 40,
    textAlign: "center",
  },

  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    border: "1px dashed #1e293b",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 20,
    color: "#3d4a5c",
  },

  emptyTitle: {
    fontSize: 14,
    fontWeight: 600,
    color: "#3d4a5c",
  },

  emptyHint: {
    fontSize: 11,
    color: "#2d3748",
    lineHeight: 1.7,
    maxWidth: 360,
  },

  loadingState: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    color: "#5a6a7e",
    fontSize: 12,
  },

  errorState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100%",
    gap: 12,
    color: "#ff6b6b",
    padding: 40,
    textAlign: "center",
  },

  errorTitle: {
    fontSize: 13,
    fontWeight: 600,
  },

  errorDetail: {
    fontSize: 11,
    color: "#5a6a7e",
    maxWidth: 480,
    lineHeight: 1.6,
    background: "#0a0e17",
    padding: "12px 16px",
    borderRadius: 8,
    border: "1px solid #1e293b",
    wordBreak: "break-all",
  },

  vizCount: {
    fontSize: 10,
    color: "#2d3748",
    padding: "12px 18px",
    borderTop: "1px solid #151c28",
    flexShrink: 0,
  },
};

// ── Loading Fallback ──
function LoadingFallback() {
  return (
    <div style={styles.loadingState}>
      <span style={{ animation: "pulse 1.5s ease-in-out infinite" }}>
        Loading visualization...
      </span>
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Error Boundary ──
function ErrorDisplay({ error, filePath }) {
  return (
    <div style={styles.errorState}>
      <div style={{ fontSize: 24 }}>!</div>
      <div style={styles.errorTitle}>Failed to load visualization</div>
      <div style={styles.errorDetail}>
        <div style={{ marginBottom: 4, color: "#ff6b6b" }}>{filePath}</div>
        {error?.message || "Unknown error"}
      </div>
      <div style={{ fontSize: 11, color: "#3d4a5c", marginTop: 8 }}>
        Check the browser console for more details.
      </div>
    </div>
  );
}

// ── Dynamic Component Wrapper ──
function VizRenderer({ modulePath, importFn }) {
  const [Component, setComponent] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setComponent(null);
    setError(null);

    importFn()
      .then((mod) => {
        const Comp = mod.default;
        if (typeof Comp === "function") {
          setComponent(() => Comp);
        } else {
          setError(new Error(
            "Module does not export a default React component. "
            + "Make sure the JSX file has: export default function MyViz() { ... }"
          ));
        }
      })
      .catch((err) => {
        console.error("Viz load error:", err);
        setError(err);
      });
  }, [modulePath, importFn]);

  if (error) {
    return <ErrorDisplay error={error} filePath={modulePath} />;
  }

  if (!Component) {
    return <LoadingFallback />;
  }

  return (
    <Suspense fallback={<LoadingFallback />}>
      <Component />
    </Suspense>
  );
}

// ── Main App ──
export default function App() {
  const fileTree = useMemo(() => buildFileTree(vizModules), []);
  const chapters = Object.keys(fileTree).sort();
  const totalFiles = Object.values(fileTree).reduce((sum, arr) => sum + arr.length, 0);

  const [activePath, setActivePath] = useState(null);

  // Hover state for file buttons
  const [hoveredPath, setHoveredPath] = useState(null);

  return (
    <div style={styles.container}>
      {/* ── Sidebar ── */}
      <div style={styles.sidebar}>
        <div style={styles.sidebarHeader}>
          <div style={styles.sidebarTitle}>DL4CV Viz</div>
          <div style={styles.sidebarSubtitle}>
            Visualization Viewer
          </div>
        </div>

        <div style={styles.sidebarScroll}>
          {chapters.length === 0 ? (
            <div style={{
              padding: "24px 18px",
              fontSize: 11,
              color: "#3d4a5c",
              lineHeight: 1.7,
            }}>
              No visualizations found.
              <br /><br />
              Place <code style={{ color: "#5a6a7e" }}>.jsx</code> files in
              a <code style={{ color: "#5a6a7e" }}>viz/</code> subfolder
              within any chapter directory.
            </div>
          ) : (
            chapters.map((chapter) => (
              <div key={chapter} style={styles.chapterGroup}>
                <div style={styles.chapterLabel}>{chapter}</div>
                {fileTree[chapter].map((file) => {
                  const isActive = activePath === file.path;
                  const isHovered = hoveredPath === file.path;
                  const buttonStyle = {
                    ...styles.fileButton(isActive),
                    ...(isHovered && !isActive ? {
                      background: "rgba(255, 255, 255, 0.02)",
                      color: "#8a96a6",
                    } : {}),
                  };

                  return (
                    <button
                      key={file.path}
                      style={buttonStyle}
                      onClick={() => setActivePath(file.path)}
                      onMouseEnter={() => setHoveredPath(file.path)}
                      onMouseLeave={() => setHoveredPath(null)}
                    >
                      <span style={styles.fileIcon(isActive)} />
                      {file.displayName}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div style={styles.vizCount}>
          {totalFiles} visualization{totalFiles !== 1 ? "s" : ""} found
        </div>
      </div>

      {/* ── Main Panel ── */}
      <div style={styles.mainPanel}>
        {activePath ? (
          <VizRenderer
            key={activePath}
            modulePath={activePath}
            importFn={vizModules[activePath]}
          />
        ) : (
          <div style={styles.emptyState}>
            <div style={styles.emptyIcon}>&#9670;</div>
            <div style={styles.emptyTitle}>
              Select a visualization
            </div>
            <div style={styles.emptyHint}>
              Choose a file from the sidebar to render it here.
              Visualizations are auto-discovered from
              {" "}<code style={{ color: "#5a6a7e" }}>*/viz/*.jsx</code>{" "}
              paths in the repo.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
