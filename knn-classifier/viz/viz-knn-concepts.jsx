import { useState, useEffect, useRef, useCallback } from "react";

// ─── Color Palette ───
const C = {
  bg: "#0f1117",
  surface: "#1a1d27",
  surfaceAlt: "#232736",
  border: "#2e3347",
  text: "#e2e4ed",
  textDim: "#8b90a5",
  cat: "#f97066",
  dog: "#60a5fa",
  panda: "#34d399",
  catDim: "rgba(249,112,102,0.15)",
  dogDim: "rgba(96,165,250,0.15)",
  pandaDim: "rgba(52,211,153,0.15)",
  accent: "#a78bfa",
  accentDim: "rgba(167,139,250,0.2)",
  grid: "rgba(139,144,165,0.08)",
  gridLine: "rgba(139,144,165,0.15)",
};

// ─── Tab Navigation ───
const tabs = [
  { id: "dim", label: "1 — Dimensions" },
  { id: "feature", label: "2 — Feature Space" },
  { id: "kbound", label: "3 — K & Boundaries" },
  { id: "confusion", label: "4 — Your Results" },
];

// ════════════════════════════════════════════════════════════
//  TAB 1: Dimensionality Progression
// ════════════════════════════════════════════════════════════
function DimensionTab() {
  const canvasRef1D = useRef(null);
  const canvasRef2D = useRef(null);
  const canvasRef3D = useRef(null);
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setRotation((r) => r + 0.008), 30);
    return () => clearInterval(id);
  }, []);

  // 1D
  useEffect(() => {
    const canvas = canvasRef1D.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    // axis
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, H / 2);
    ctx.lineTo(W - 10, H / 2);
    ctx.stroke();

    // tick marks
    for (let i = 0; i <= 10; i++) {
      const x = 30 + (i / 10) * (W - 50);
      ctx.beginPath();
      ctx.moveTo(x, H / 2 - 4);
      ctx.lineTo(x, H / 2 + 4);
      ctx.stroke();
    }

    // label
    ctx.fillStyle = C.textDim;
    ctx.font = "11px monospace";
    ctx.textAlign = "center";
    ctx.fillText("pixel intensity (0–255)", W / 2, H / 2 + 22);

    // data points
    const points = [
      { v: 0.15, c: C.cat },
      { v: 0.3, c: C.cat },
      { v: 0.55, c: C.dog },
      { v: 0.7, c: C.dog },
      { v: 0.85, c: C.panda },
      { v: 0.92, c: C.panda },
    ];
    points.forEach((p) => {
      const x = 30 + p.v * (W - 50);
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(x, H / 2, 6, 0, Math.PI * 2);
      ctx.fill();
    });

    // dimension label
    ctx.fillStyle = C.accent;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText("1D: 1 pixel = 1 axis", 10, 16);
  }, []);

  // 2D
  useEffect(() => {
    const canvas = canvasRef2D.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 40, oy = H - 30;
    const axW = W - 55, axH = H - 50;

    // grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 5; i++) {
      const x = ox + (i / 5) * axW;
      const y = oy - (i / 5) * axH;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - axH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + axW, y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + axW, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - axH); ctx.stroke();

    ctx.fillStyle = C.textDim;
    ctx.font = "10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("pixel[0]", ox + axW / 2, oy + 18);
    ctx.save();
    ctx.translate(12, oy - axH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("pixel[1]", 0, 0);
    ctx.restore();

    // data points
    const pts2d = [
      { x: 0.15, y: 0.2, c: C.cat }, { x: 0.25, y: 0.35, c: C.cat },
      { x: 0.2, y: 0.15, c: C.cat }, { x: 0.3, y: 0.25, c: C.cat },
      { x: 0.6, y: 0.55, c: C.dog }, { x: 0.7, y: 0.65, c: C.dog },
      { x: 0.65, y: 0.7, c: C.dog }, { x: 0.55, y: 0.6, c: C.dog },
      { x: 0.8, y: 0.15, c: C.panda }, { x: 0.85, y: 0.25, c: C.panda },
      { x: 0.9, y: 0.2, c: C.panda }, { x: 0.82, y: 0.3, c: C.panda },
    ];
    pts2d.forEach((p) => {
      const px = ox + p.x * axW;
      const py = oy - p.y * axH;
      ctx.fillStyle = p.c;
      ctx.beginPath();
      ctx.arc(px, py, 5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = C.accent;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText("2D: 2 pixels = 2 axes", 10, 16);
  }, []);

  // 3D (rotating wireframe cube)
  useEffect(() => {
    const canvas = canvasRef3D.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const cx = W / 2, cy = H / 2 + 5;
    const s = Math.min(W, H) * 0.28;

    const cos = Math.cos(rotation), sin = Math.sin(rotation);
    const cosY = Math.cos(rotation * 0.7), sinY = Math.sin(rotation * 0.7);

    function project(x, y, z) {
      // rotate Y
      let x1 = x * cos - z * sin;
      let z1 = x * sin + z * cos;
      // rotate X
      let y1 = y * cosY - z1 * sinY;
      let z2 = y * sinY + z1 * cosY;
      const scale = 1.8 / (3 + z2);
      return { px: cx + x1 * s * scale, py: cy - y1 * s * scale };
    }

    // cube edges
    const v = [
      [-1,-1,-1],[1,-1,-1],[1,1,-1],[-1,1,-1],
      [-1,-1,1],[1,-1,1],[1,1,1],[-1,1,1],
    ];
    const edges = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];

    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 0.8;
    edges.forEach(([a, b]) => {
      const pa = project(...v[a]);
      const pb = project(...v[b]);
      ctx.beginPath();
      ctx.moveTo(pa.px, pa.py);
      ctx.lineTo(pb.px, pb.py);
      ctx.stroke();
    });

    // data points inside cube
    const pts3d = [
      { p: [-0.6, -0.5, -0.4], c: C.cat },
      { p: [-0.4, -0.7, -0.3], c: C.cat },
      { p: [-0.5, -0.6, -0.6], c: C.cat },
      { p: [0.3, 0.4, 0.5], c: C.dog },
      { p: [0.5, 0.3, 0.6], c: C.dog },
      { p: [0.4, 0.5, 0.4], c: C.dog },
      { p: [0.6, -0.5, 0.1], c: C.panda },
      { p: [0.7, -0.4, -0.1], c: C.panda },
      { p: [0.65, -0.6, 0.0], c: C.panda },
    ];
    pts3d.forEach(({ p, c }) => {
      const proj = project(...p);
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(proj.px, proj.py, 4.5, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = C.accent;
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "left";
    ctx.fillText("3D: 3 pixels = 3 axes", 10, 16);
  }, [rotation]);

  return (
    <div>
      <div style={{ marginBottom: 16, color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
        Each pixel becomes one axis (dimension). A 32×32×3 image has 3,072 pixels, 
        so each image is a single point in a 3,072-dimensional space. Below: 
        the same idea at 1, 2, and 3 dimensions.
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
        <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
          <canvas ref={canvasRef1D} width={520} height={60} style={{ width: "100%", height: 60 }} />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
            <canvas ref={canvasRef2D} width={260} height={220} style={{ width: "100%", height: 220 }} />
          </div>
          <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
            <canvas ref={canvasRef3D} width={260} height={220} style={{ width: "100%", height: 220 }} />
          </div>
        </div>
      </div>

      {/* High-dimensional concept */}
      <div style={{
        marginTop: 16, background: C.surfaceAlt, borderRadius: 8,
        padding: 16, border: `1px solid ${C.border}`
      }}>
        <div style={{ color: C.accent, fontWeight: 700, fontSize: 13, fontFamily: "monospace", marginBottom: 8 }}>
          3072D: each image = 1 point you can't visualize
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ flex: 1, fontSize: 12, color: C.textDim, lineHeight: 1.7, fontFamily: "monospace" }}>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.text }}>image_A</span> = [142, 87, 201, 56, ..., 178]  →  <span style={{ color: C.cat }}>● point in ℝ³⁰⁷²</span>
            </div>
            <div style={{ marginBottom: 6 }}>
              <span style={{ color: C.text }}>image_B</span> = [98, 145, 33, 211, ..., 64]  →  <span style={{ color: C.dog }}>● point in ℝ³⁰⁷²</span>
            </div>
            <div>
              <span style={{ color: C.text }}>image_C</span> = [12, 230, 115, 8, ..., 199]  →  <span style={{ color: C.panda }}>● point in ℝ³⁰⁷²</span>
            </div>
          </div>
          <div style={{
            width: 100, height: 100, borderRadius: 8,
            background: `radial-gradient(ellipse at 30% 40%, ${C.catDim}, transparent 50%),
                         radial-gradient(ellipse at 70% 30%, ${C.dogDim}, transparent 50%),
                         radial-gradient(ellipse at 50% 75%, ${C.pandaDim}, transparent 50%),
                         ${C.surface}`,
            border: `1px solid ${C.border}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 10, color: C.textDim, fontFamily: "monospace", textAlign: "center",
          }}>
            3072 axes<br/>we can't draw
          </div>
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: "flex", gap: 20, marginTop: 12, justifyContent: "center" }}>
        {[["cats", C.cat], ["dogs", C.dog], ["pandas", C.panda]].map(([l, c]) => (
          <div key={l} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: C.textDim }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            {l}
          </div>
        ))}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 2: Feature Space — 2D toy example bridged to images
// ════════════════════════════════════════════════════════════
function FeatureSpaceTab() {
  const canvasRef = useRef(null);
  const [queryPt, setQueryPt] = useState({ x: 0.45, y: 0.5 });
  const [k, setK] = useState(3);
  const dragging = useRef(false);

  const clusters = [
    // cats: darker fur, medium fluffiness
    ...Array.from({ length: 15 }, (_, i) => ({
      x: 0.15 + Math.sin(i * 2.1) * 0.12 + Math.cos(i * 0.7) * 0.05,
      y: 0.35 + Math.cos(i * 1.8) * 0.12 + Math.sin(i * 1.3) * 0.06,
      c: "cat", color: C.cat,
    })),
    // dogs: varied
    ...Array.from({ length: 15 }, (_, i) => ({
      x: 0.55 + Math.sin(i * 1.9) * 0.13 + Math.cos(i * 0.9) * 0.06,
      y: 0.65 + Math.cos(i * 2.2) * 0.1 + Math.sin(i * 1.1) * 0.07,
      c: "dog", color: C.dog,
    })),
    // pandas: high lightness, low fluffiness
    ...Array.from({ length: 15 }, (_, i) => ({
      x: 0.78 + Math.sin(i * 2.3) * 0.1 + Math.cos(i * 0.5) * 0.04,
      y: 0.2 + Math.cos(i * 1.6) * 0.1 + Math.sin(i * 1.7) * 0.05,
      c: "panda", color: C.panda,
    })),
  ];

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = canvas.width, H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const ox = 50, oy = H - 40;
    const axW = W - 70, axH = H - 70;

    const toScreen = (px, py) => ({
      sx: ox + px * axW,
      sy: oy - py * axH,
    });

    // grid
    ctx.strokeStyle = C.grid;
    ctx.lineWidth = 0.5;
    for (let i = 0; i <= 10; i++) {
      const x = ox + (i / 10) * axW;
      const y = oy - (i / 10) * axH;
      ctx.beginPath(); ctx.moveTo(x, oy); ctx.lineTo(x, oy - axH); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(ox, y); ctx.lineTo(ox + axW, y); ctx.stroke();
    }

    // axes
    ctx.strokeStyle = C.gridLine;
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox + axW, oy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(ox, oy); ctx.lineTo(ox, oy - axH); ctx.stroke();

    ctx.fillStyle = C.textDim;
    ctx.font = "12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("avg pixel brightness →", ox + axW / 2, oy + 28);
    ctx.save();
    ctx.translate(14, oy - axH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText("edge density →", 0, 0);
    ctx.restore();

    // cluster background regions (soft)
    const clusterCenters = [
      { x: 0.15, y: 0.35, c: C.catDim, r: 0.2 },
      { x: 0.55, y: 0.65, c: C.dogDim, r: 0.22 },
      { x: 0.78, y: 0.2, c: C.pandaDim, r: 0.18 },
    ];
    clusterCenters.forEach(({ x, y, c, r }) => {
      const s = toScreen(x, y);
      const grad = ctx.createRadialGradient(s.sx, s.sy, 0, s.sx, s.sy, r * axW);
      grad.addColorStop(0, c);
      grad.addColorStop(1, "transparent");
      ctx.fillStyle = grad;
      ctx.fillRect(ox, oy - axH, axW, axH);
    });

    // data points
    clusters.forEach((p) => {
      const s = toScreen(p.x, p.y);
      ctx.fillStyle = p.color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(s.sx, s.sy, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    });

    // query point
    const qs = toScreen(queryPt.x, queryPt.y);

    // find k nearest
    const withDist = clusters.map((p) => ({
      ...p,
      dist: Math.sqrt((p.x - queryPt.x) ** 2 + (p.y - queryPt.y) ** 2),
    }));
    withDist.sort((a, b) => a.dist - b.dist);
    const neighbors = withDist.slice(0, k);

    // draw lines to neighbors
    neighbors.forEach((n) => {
      const ns = toScreen(n.x, n.y);
      ctx.strokeStyle = "rgba(167,139,250,0.4)";
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(qs.sx, qs.sy);
      ctx.lineTo(ns.sx, ns.sy);
      ctx.stroke();
      ctx.setLineDash([]);

      // highlight neighbor
      ctx.strokeStyle = C.accent;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(ns.sx, ns.sy, 8, 0, Math.PI * 2);
      ctx.stroke();
    });

    // vote count
    const votes = {};
    neighbors.forEach((n) => {
      votes[n.c] = (votes[n.c] || 0) + 1;
    });
    const winner = Object.entries(votes).sort((a, b) => b[1] - a[1])[0][0];
    const winnerColor = winner === "cat" ? C.cat : winner === "dog" ? C.dog : C.panda;

    // radius circle
    const maxDist = neighbors[neighbors.length - 1].dist;
    const radiusPx = maxDist * axW;
    ctx.strokeStyle = "rgba(167,139,250,0.25)";
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.arc(qs.sx, qs.sy, radiusPx, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // query point
    ctx.fillStyle = winnerColor;
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(qs.sx, qs.sy, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // label
    ctx.fillStyle = "#fff";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "center";
    ctx.fillText("?", qs.sx, qs.sy + 3.5);

    // vote display
    ctx.fillStyle = C.text;
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    const voteStr = Object.entries(votes)
      .map(([c, v]) => `${c}: ${v}`)
      .join("  ");
    ctx.fillText(`votes → ${voteStr}  →  ${winner}`, ox + 5, 20);
  }, [queryPt, k, clusters]);

  useEffect(() => { draw(); }, [draw]);

  const handleMouse = useCallback((e, isDown) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;

    const ox = 50, oy = canvas.height - 40;
    const axW = canvas.width - 70, axH = canvas.height - 70;

    const nx = Math.max(0, Math.min(1, (mx - ox) / axW));
    const ny = Math.max(0, Math.min(1, (oy - my) / axH));

    if (isDown) dragging.current = true;
    if (dragging.current) setQueryPt({ x: nx, y: ny });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12, color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
        This is the "fluffiness vs lightness" idea. Each axis represents one <em>measured feature</em> of an animal.
        <strong style={{ color: C.text }}> Drag the "?" point</strong> to see how KNN classifies it by polling its {k} nearest neighbors.
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
        <span style={{ fontSize: 12, color: C.textDim, fontFamily: "monospace" }}>K =</span>
        {[1, 3, 5, 7].map((v) => (
          <button
            key={v}
            onClick={() => setK(v)}
            style={{
              background: k === v ? C.accent : C.surfaceAlt,
              color: k === v ? "#fff" : C.textDim,
              border: `1px solid ${k === v ? C.accent : C.border}`,
              borderRadius: 6, padding: "4px 14px", cursor: "pointer",
              fontSize: 13, fontFamily: "monospace", fontWeight: k === v ? 700 : 400,
            }}
          >
            {v}
          </button>
        ))}
      </div>

      <div style={{ background: C.surfaceAlt, borderRadius: 8, padding: 8, border: `1px solid ${C.border}` }}>
        <canvas
          ref={canvasRef}
          width={520}
          height={380}
          style={{ width: "100%", height: 380, cursor: "crosshair" }}
          onMouseDown={(e) => handleMouse(e, true)}
          onMouseMove={(e) => { if (dragging.current) handleMouse(e, false); }}
          onMouseUp={() => { dragging.current = false; }}
          onMouseLeave={() => { dragging.current = false; }}
        />
      </div>

      <div style={{
        marginTop: 12, padding: 12, background: C.surface, borderRadius: 8,
        border: `1px solid ${C.border}`, fontSize: 12, color: C.textDim, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.accent }}>Bridge to 3072D:</strong> This 2D plot uses 2 synthetic features.
        Your image classifier does the same thing but with 3,072 features (one per pixel).
        The geometry is identical — KNN measures distance and votes — you just can't draw 3,072 axes.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 3: Decision Boundaries for different K
// ════════════════════════════════════════════════════════════
function KBoundaryTab() {
  const canvasRefs = [useRef(null), useRef(null), useRef(null)];
  const kValues = [1, 5, 15];

  // fixed training data
  const trainingData = [
    { x: 0.15, y: 0.7, c: 0 }, { x: 0.2, y: 0.8, c: 0 }, { x: 0.1, y: 0.65, c: 0 },
    { x: 0.25, y: 0.75, c: 0 }, { x: 0.18, y: 0.85, c: 0 }, { x: 0.3, y: 0.7, c: 0 },
    { x: 0.35, y: 0.82, c: 0 }, { x: 0.22, y: 0.6, c: 0 },
    { x: 0.6, y: 0.3, c: 1 }, { x: 0.7, y: 0.25, c: 1 }, { x: 0.65, y: 0.4, c: 1 },
    { x: 0.75, y: 0.35, c: 1 }, { x: 0.55, y: 0.2, c: 1 }, { x: 0.68, y: 0.15, c: 1 },
    { x: 0.72, y: 0.45, c: 1 }, { x: 0.58, y: 0.35, c: 1 },
    { x: 0.8, y: 0.75, c: 2 }, { x: 0.85, y: 0.8, c: 2 }, { x: 0.9, y: 0.7, c: 2 },
    { x: 0.75, y: 0.85, c: 2 }, { x: 0.88, y: 0.65, c: 2 }, { x: 0.82, y: 0.9, c: 2 },
    { x: 0.92, y: 0.78, c: 2 }, { x: 0.78, y: 0.72, c: 2 },
    // some noise / overlap
    { x: 0.4, y: 0.55, c: 0 }, { x: 0.45, y: 0.5, c: 1 }, { x: 0.65, y: 0.6, c: 2 },
  ];

  const colors = [C.cat, C.dog, C.panda];
  const dimColors = [C.catDim, C.dogDim, C.pandaDim];

  useEffect(() => {
    kValues.forEach((kVal, idx) => {
      const canvas = canvasRefs[idx].current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);

      const res = 3; // pixel resolution for boundary map
      // draw decision regions
      for (let px = 0; px < W; px += res) {
        for (let py = 0; py < H; py += res) {
          const qx = px / W, qy = 1 - py / H;

          const dists = trainingData.map((p) => ({
            c: p.c,
            d: Math.sqrt((p.x - qx) ** 2 + (p.y - qy) ** 2),
          }));
          dists.sort((a, b) => a.d - b.d);
          const votes = [0, 0, 0];
          for (let i = 0; i < kVal && i < dists.length; i++) {
            votes[dists[i].c]++;
          }
          const winner = votes.indexOf(Math.max(...votes));
          ctx.fillStyle = dimColors[winner];
          ctx.fillRect(px, py, res, res);
        }
      }

      // data points
      trainingData.forEach((p) => {
        const sx = p.x * W, sy = (1 - p.y) * H;
        ctx.fillStyle = colors[p.c];
        ctx.strokeStyle = C.bg;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(sx, sy, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // label
      ctx.fillStyle = C.text;
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`K = ${kVal}`, 6, 16);
    });
  }, []);

  return (
    <div>
      <div style={{ marginBottom: 12, color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
        These three plots show the <strong style={{ color: C.text }}>decision boundary</strong> for
        the same training data at different K values. Notice how K=1 creates jagged, noisy
        boundaries while K=15 produces smoother (but potentially over-smoothed) regions.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
        {kValues.map((kv, i) => (
          <div key={kv} style={{ background: C.surfaceAlt, borderRadius: 8, padding: 6, border: `1px solid ${C.border}` }}>
            <canvas ref={canvasRefs[i]} width={170} height={170} style={{ width: "100%", height: 170, borderRadius: 4 }} />
            <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginTop: 4, fontFamily: "monospace" }}>
              {kv === 1 ? "noisy / overfit" : kv === 5 ? "balanced" : "smooth / underfit"}
            </div>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 14, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10,
      }}>
        <div style={{
          padding: 12, background: C.surface, borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 12, color: C.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: C.cat }}>Small K (1–3)</strong><br />
          Boundaries hug every data point. Captures noise as if it were signal.
          A single outlier can create an island of wrong class. This is overfitting.
        </div>
        <div style={{
          padding: 12, background: C.surface, borderRadius: 8,
          border: `1px solid ${C.border}`, fontSize: 12, color: C.textDim, lineHeight: 1.7,
        }}>
          <strong style={{ color: C.panda }}>Large K (15+)</strong><br />
          Boundaries become very smooth. Minority clusters get absorbed by majority neighbors.
          Fine detail is lost. This is underfitting / oversmoothing.
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  TAB 4: Classification Report & Confusion Matrix
// ════════════════════════════════════════════════════════════
function ConfusionTab() {
  // From Shane's actual classification_report.txt
  const matrix = [
    [139, 79, 31],  // cats predicted as: cats, dogs, pandas
    [107, 123, 32],  // dogs predicted as: cats, dogs, pandas
    [100, 62, 77],   // pandas predicted as: cats, dogs, pandas
  ];
  const labels = ["cats", "dogs", "panda"];
  const labelColors = [C.cat, C.dog, C.panda];
  const support = [249, 262, 239];

  // precision and recall from report
  const metrics = [
    { label: "cats", precision: 0.40, recall: 0.56, f1: 0.46 },
    { label: "dogs", precision: 0.41, recall: 0.47, f1: 0.43 },
    { label: "panda", precision: 0.80, recall: 0.32, f1: 0.46 },
  ];

  const maxVal = Math.max(...matrix.flat());

  return (
    <div>
      <div style={{ marginBottom: 14, color: C.textDim, fontSize: 13, lineHeight: 1.6 }}>
        Your actual results from <code style={{ color: C.accent, fontSize: 12 }}>classification_report.txt</code>.
        The confusion matrix shows what the model predicted (columns) versus
        truth (rows).
      </div>

      {/* Confusion Matrix */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <div>
          <div style={{ textAlign: "center", fontSize: 11, color: C.textDim, marginBottom: 6, fontFamily: "monospace" }}>
            ← predicted class →
          </div>
          <div style={{ display: "flex" }}>
            <div style={{
              writingMode: "vertical-lr", transform: "rotate(180deg)",
              fontSize: 11, color: C.textDim, fontFamily: "monospace",
              display: "flex", alignItems: "center", justifyContent: "center",
              paddingRight: 6,
            }}>
              ← actual class →
            </div>
            <div>
              {/* header row */}
              <div style={{ display: "flex", marginLeft: 60 }}>
                {labels.map((l, i) => (
                  <div key={l} style={{
                    width: 72, textAlign: "center", fontSize: 11, fontWeight: 700,
                    color: labelColors[i], fontFamily: "monospace", marginBottom: 4,
                  }}>
                    {l}
                  </div>
                ))}
              </div>
              {matrix.map((row, ri) => (
                <div key={ri} style={{ display: "flex", alignItems: "center" }}>
                  <div style={{
                    width: 56, textAlign: "right", paddingRight: 8,
                    fontSize: 11, fontWeight: 700, color: labelColors[ri], fontFamily: "monospace",
                  }}>
                    {labels[ri]}
                  </div>
                  {row.map((val, ci) => {
                    const intensity = val / maxVal;
                    const isDiag = ri === ci;
                    return (
                      <div
                        key={ci}
                        style={{
                          width: 72, height: 52,
                          display: "flex", flexDirection: "column",
                          alignItems: "center", justifyContent: "center",
                          background: isDiag
                            ? `rgba(167,139,250,${intensity * 0.35})`
                            : `rgba(249,112,102,${intensity * 0.25})`,
                          border: isDiag ? `2px solid ${C.accent}` : `1px solid ${C.border}`,
                          borderRadius: 4, margin: 2,
                          fontSize: 16, fontWeight: 700,
                          color: isDiag ? C.accent : C.cat,
                          fontFamily: "monospace",
                        }}
                      >
                        {val}
                        <span style={{ fontSize: 9, color: C.textDim, fontWeight: 400 }}>
                          {((val / support[ri]) * 100).toFixed(0)}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Metrics table */}
      <div style={{
        background: C.surfaceAlt, borderRadius: 8, padding: 14,
        border: `1px solid ${C.border}`,
      }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: C.text, marginBottom: 10, fontFamily: "monospace" }}>
          precision / recall / F1
        </div>
        {metrics.map((m, i) => (
          <div key={m.label} style={{ marginBottom: 10 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 10, marginBottom: 4,
            }}>
              <span style={{
                width: 50, fontSize: 12, fontWeight: 700,
                color: labelColors[i], fontFamily: "monospace",
              }}>
                {m.label}
              </span>
              <span style={{ fontSize: 11, color: C.textDim, fontFamily: "monospace", width: 160 }}>
                P={m.precision.toFixed(2)}  R={m.recall.toFixed(2)}  F1={m.f1.toFixed(2)}
              </span>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
              <span style={{ fontSize: 10, color: C.textDim, width: 50, fontFamily: "monospace" }}>prec</span>
              <div style={{ flex: 1, height: 8, background: C.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${m.precision * 100}%`, height: "100%",
                  background: labelColors[i], borderRadius: 4, opacity: 0.8,
                }} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 4, alignItems: "center", marginTop: 2 }}>
              <span style={{ fontSize: 10, color: C.textDim, width: 50, fontFamily: "monospace" }}>recall</span>
              <div style={{ flex: 1, height: 8, background: C.surface, borderRadius: 4, overflow: "hidden" }}>
                <div style={{
                  width: `${m.recall * 100}%`, height: "100%",
                  background: labelColors[i], borderRadius: 4, opacity: 0.5,
                }} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Panda callout */}
      <div style={{
        marginTop: 12, padding: 12, background: C.surface, borderRadius: 8,
        border: `1px solid ${C.border}`, fontSize: 12, color: C.textDim, lineHeight: 1.7,
      }}>
        <strong style={{ color: C.panda }}>Panda paradox:</strong> 80% precision means when the model 
        says "panda," it's usually right. But 32% recall means it only identifies 77 of 239 actual 
        pandas — the other 162 get misclassified as cats (100) or dogs (62). The model is <em>conservative</em> about 
        calling something a panda, but <em>misses most pandas entirely</em>.
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════
//  Main App
// ════════════════════════════════════════════════════════════
export default function KNNConceptExplorer() {
  const [activeTab, setActiveTab] = useState("dim");

  return (
    <div style={{
      background: C.bg, color: C.text, minHeight: "100vh",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
      padding: "20px 16px",
    }}>
      <div style={{ maxWidth: 560, margin: "0 auto" }}>
        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <h1 style={{
            fontSize: 18, fontWeight: 700, color: C.text,
            margin: 0, letterSpacing: "-0.02em",
          }}>
            KNN Concept Explorer
          </h1>
          <div style={{ fontSize: 12, color: C.textDim, marginTop: 4 }}>
            Chapter 7 — Deep Learning for Computer Vision
          </div>
        </div>

        {/* Tab bar */}
        <div style={{
          display: "flex", gap: 4, marginBottom: 20,
          background: C.surface, borderRadius: 10, padding: 4,
          border: `1px solid ${C.border}`,
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                flex: 1, padding: "8px 4px", border: "none",
                borderRadius: 7, cursor: "pointer",
                background: activeTab === t.id ? C.accent : "transparent",
                color: activeTab === t.id ? "#fff" : C.textDim,
                fontSize: 11, fontWeight: activeTab === t.id ? 700 : 400,
                fontFamily: "inherit", transition: "all 0.15s ease",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div>
          {activeTab === "dim" && <DimensionTab />}
          {activeTab === "feature" && <FeatureSpaceTab />}
          {activeTab === "kbound" && <KBoundaryTab />}
          {activeTab === "confusion" && <ConfusionTab />}
        </div>
      </div>
    </div>
  );
}
