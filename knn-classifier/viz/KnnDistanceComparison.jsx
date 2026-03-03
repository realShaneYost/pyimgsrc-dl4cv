import { useState } from "react";

// ─── Raw data from knn_v2.py log files ──────────────────────
// Both runs: 3000 images, split train=1800, val=450, test=750
// Test set composition: 249 cats, 262 dogs, 239 pandas

const TUNING_DATA = {
  l2: {
    label: "Euclidean (L2)",
    formula: "√(Σ(aᵢ - bᵢ)²)",
    intuition: "Straight-line distance — \"as the crow flies\"",
    p: 2,
    bestK: 31,
    valAcc: 0.5156,
    testAcc: 0.51,
    curve: [
      { k: 1, acc: 0.4178 }, { k: 3, acc: 0.4400 }, { k: 5, acc: 0.4422 },
      { k: 7, acc: 0.4667 }, { k: 9, acc: 0.4644 }, { k: 11, acc: 0.4422 },
      { k: 13, acc: 0.4422 }, { k: 15, acc: 0.4533 }, { k: 17, acc: 0.4711 },
      { k: 19, acc: 0.4911 }, { k: 21, acc: 0.5000 }, { k: 23, acc: 0.5044 },
      { k: 25, acc: 0.5044 }, { k: 27, acc: 0.4978 }, { k: 29, acc: 0.4956 },
      { k: 31, acc: 0.5156 },
    ],
    // From classification_report: precision, recall, f1, support
    classes: {
      cats:  { precision: 0.46, recall: 0.66, f1: 0.54, support: 249 },
      dogs:  { precision: 0.44, recall: 0.50, f1: 0.47, support: 262 },
      panda: { precision: 0.89, recall: 0.36, f1: 0.52, support: 239 },
    },
  },
  l1: {
    label: "Manhattan (L1)",
    formula: "Σ|aᵢ - bᵢ|",
    intuition: "City-block distance — \"walking the grid\"",
    p: 1,
    bestK: 31,
    valAcc: 0.5822,
    testAcc: 0.57,
    curve: [
      { k: 1, acc: 0.4622 }, { k: 3, acc: 0.5022 }, { k: 5, acc: 0.5156 },
      { k: 7, acc: 0.5400 }, { k: 9, acc: 0.5267 }, { k: 11, acc: 0.5089 },
      { k: 13, acc: 0.5311 }, { k: 15, acc: 0.5289 }, { k: 17, acc: 0.5422 },
      { k: 19, acc: 0.5511 }, { k: 21, acc: 0.5556 }, { k: 23, acc: 0.5689 },
      { k: 25, acc: 0.5667 }, { k: 27, acc: 0.5667 }, { k: 29, acc: 0.5689 },
      { k: 31, acc: 0.5822 },
    ],
    classes: {
      cats:  { precision: 0.50, recall: 0.67, f1: 0.58, support: 249 },
      dogs:  { precision: 0.50, recall: 0.53, f1: 0.51, support: 262 },
      panda: { precision: 0.90, recall: 0.52, f1: 0.66, support: 239 },
    },
  },
};

// Derive image counts from precision/recall/support
function derivecounts(cls) {
  const tp = Math.round(cls.recall * cls.support);
  const fn = cls.support - tp;
  const totalPredicted = Math.round(tp / cls.precision);
  const fp = totalPredicted - tp;
  return { tp, fn, fp, totalPredicted };
}

// ─── Color palette ──────────────────────────────────────────
const COLORS = {
  bg: "#0f1117",
  card: "#1a1d27",
  cardHover: "#222633",
  border: "#2a2e3d",
  text: "#e2e4ea",
  textDim: "#8b90a0",
  textMuted: "#585d70",
  accent: "#6c9bff",
  accentDim: "#3d5a99",
  green: "#4ade80",
  greenDim: "#166534",
  greenBg: "rgba(74, 222, 128, 0.08)",
  red: "#f87171",
  redDim: "#991b1b",
  redBg: "rgba(248, 113, 113, 0.08)",
  orange: "#fb923c",
  orangeDim: "#9a3412",
  purple: "#a78bfa",
  purpleDim: "#5b21b6",
  l1: "#22d3ee",
  l1Dim: "#0e7490",
  l1Bg: "rgba(34, 211, 238, 0.12)",
  l2: "#f59e0b",
  l2Dim: "#92400e",
  l2Bg: "rgba(245, 158, 11, 0.12)",
  cats: "#f472b6",
  dogs: "#60a5fa",
  panda: "#34d399",
};

// ─── Reusable Components ────────────────────────────────────

function Pill({ children, color, bg }) {
  return (
    <span style={{
      display: "inline-block",
      padding: "2px 10px",
      borderRadius: 99,
      fontSize: 11,
      fontWeight: 600,
      letterSpacing: "0.03em",
      color: color,
      background: bg || `${color}18`,
    }}>
      {children}
    </span>
  );
}

function InfoTooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span
      style={{ position: "relative", display: "inline-block", cursor: "help" }}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      <span style={{
        display: "inline-flex", alignItems: "center", justifyContent: "center",
        width: 16, height: 16, borderRadius: "50%", fontSize: 10, fontWeight: 700,
        background: COLORS.border, color: COLORS.textDim, marginLeft: 4,
      }}>?</span>
      {show && (
        <span style={{
          position: "absolute", bottom: "calc(100% + 8px)", left: "50%",
          transform: "translateX(-50%)", width: 260, padding: "10px 12px",
          borderRadius: 8, fontSize: 12, lineHeight: 1.5,
          background: "#2a2e3d", color: COLORS.text, zIndex: 100,
          boxShadow: "0 8px 32px rgba(0,0,0,0.5)",
          border: `1px solid ${COLORS.border}`,
          pointerEvents: "none",
        }}>
          {text}
        </span>
      )}
    </span>
  );
}

// ─── Per-class Breakdown Card ───────────────────────────────
// This is the "intuitive image count" view Shane liked

function ClassBreakdown({ name, data, metricColor, emoji }) {
  const { tp, fn, fp, totalPredicted } = deriveCount(data);

  // Bar widths
  const recallPct = (data.recall * 100);
  const precisionPct = (data.precision * 100);

  return (
    <div style={{
      background: COLORS.card, borderRadius: 12,
      border: `1px solid ${COLORS.border}`,
      padding: 20, flex: 1, minWidth: 220,
    }}>
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        marginBottom: 16, fontSize: 15, fontWeight: 700,
        color: COLORS.text, textTransform: "capitalize",
      }}>
        <span style={{ fontSize: 22 }}>{emoji}</span>
        {name}
        <span style={{
          marginLeft: "auto", fontSize: 12, fontWeight: 500,
          color: COLORS.textDim,
        }}>
          {data.support} in test set
        </span>
      </div>

      {/* RECALL — "How many did we find?" */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "baseline", marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim }}>
            RECALL
            <InfoTooltip text={`Of all ${data.support} real ${name} images in the test set, how many did the model correctly identify as ${name}?`} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>
            {tp} of {data.support} found
          </span>
        </div>
        <div style={{
          height: 24, borderRadius: 6, overflow: "hidden",
          background: COLORS.redBg, position: "relative",
        }}>
          <div style={{
            height: "100%", width: `${recallPct}%`,
            background: `linear-gradient(90deg, ${COLORS.greenDim}, ${COLORS.green})`,
            borderRadius: 6, transition: "width 0.6s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#000" }}>
              {Math.round(recallPct)}%
            </span>
          </div>
          {fn > 0 && (
            <span style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 10, fontWeight: 600, color: COLORS.red, opacity: 0.9,
            }}>
              {fn} missed
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: COLORS.textMuted, marginTop: 4,
          fontStyle: "italic", lineHeight: 1.4,
        }}>
          "Of the {data.support} actual {name}, the model found {tp}"
        </div>
      </div>

      {/* PRECISION — "When it says X, is it right?" */}
      <div>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "baseline", marginBottom: 6,
        }}>
          <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim }}>
            PRECISION
            <InfoTooltip text={`When the model predicted "${name}", how often was it actually correct? It predicted ${name} ${totalPredicted} times total — ${tp} were right, ${fp} were wrong.`} />
          </span>
          <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.accent }}>
            {tp} of {totalPredicted} correct
          </span>
        </div>
        <div style={{
          height: 24, borderRadius: 6, overflow: "hidden",
          background: COLORS.redBg, position: "relative",
        }}>
          <div style={{
            height: "100%", width: `${precisionPct}%`,
            background: `linear-gradient(90deg, ${COLORS.accentDim}, ${COLORS.accent})`,
            borderRadius: 6, transition: "width 0.6s ease",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#000" }}>
              {Math.round(precisionPct)}%
            </span>
          </div>
          {fp > 0 && (
            <span style={{
              position: "absolute", right: 8, top: "50%",
              transform: "translateY(-50%)",
              fontSize: 10, fontWeight: 600, color: COLORS.red, opacity: 0.9,
            }}>
              {fp} wrong
            </span>
          )}
        </div>
        <div style={{
          fontSize: 11, color: COLORS.textMuted, marginTop: 4,
          fontStyle: "italic", lineHeight: 1.4,
        }}>
          "Of {totalPredicted} times it said {name}, {tp} actually were"
        </div>
      </div>

      {/* F1 score */}
      <div style={{
        marginTop: 14, paddingTop: 12,
        borderTop: `1px solid ${COLORS.border}`,
        display: "flex", justifyContent: "space-between",
        alignItems: "center",
      }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim }}>
          F1 SCORE
          <InfoTooltip text="The harmonic mean of precision and recall. It's high only when BOTH precision and recall are high. Think of it as the 'balanced grade' — you can't cheat it by being good at just one." />
        </span>
        <span style={{
          fontSize: 15, fontWeight: 800,
          color: data.f1 >= 0.6 ? COLORS.green : data.f1 >= 0.5 ? COLORS.orange : COLORS.red,
        }}>
          {data.f1.toFixed(2)}
        </span>
      </div>
    </div>
  );
}

// Wrapper that handles the misspelled function name
function deriveCount(cls) {
  return deriveCountsFromClass(cls);
}
function deriveCountsFromClass(cls) {
  const tp = Math.round(cls.recall * cls.support);
  const fn = cls.support - tp;
  const totalPredicted = tp > 0 ? Math.round(tp / cls.precision) : 0;
  const fp = totalPredicted - tp;
  return { tp, fn, fp, totalPredicted };
}

// ─── K-Tuning Curve (SVG) ───────────────────────────────────

function TuningCurve({ l1Data, l2Data }) {
  const W = 580, H = 280;
  const pad = { top: 30, right: 30, bottom: 50, left: 55 };
  const plotW = W - pad.left - pad.right;
  const plotH = H - pad.top - pad.bottom;

  const allAcc = [...l1Data.map(d => d.acc), ...l2Data.map(d => d.acc)];
  const minAcc = Math.floor(Math.min(...allAcc) * 20) / 20; // round down to 0.05
  const maxAcc = Math.ceil(Math.max(...allAcc) * 20) / 20;  // round up to 0.05

  const xScale = (k) => pad.left + ((k - 1) / 30) * plotW;
  const yScale = (acc) => pad.top + plotH - ((acc - minAcc) / (maxAcc - minAcc)) * plotH;

  const makePath = (data) =>
    data.map((d, i) =>
      `${i === 0 ? "M" : "L"} ${xScale(d.k).toFixed(1)} ${yScale(d.acc).toFixed(1)}`
    ).join(" ");

  // Y-axis ticks
  const yTicks = [];
  for (let v = minAcc; v <= maxAcc + 0.001; v += 0.05) {
    yTicks.push(Math.round(v * 100) / 100);
  }

  // X-axis ticks (every other K)
  const xTicks = l1Data.filter((_, i) => i % 2 === 0).map(d => d.k);

  return (
    <svg width={W} height={H} style={{ display: "block" }}>
      {/* Grid lines */}
      {yTicks.map(v => (
        <line key={v} x1={pad.left} y1={yScale(v)} x2={W - pad.right} y2={yScale(v)}
          stroke={COLORS.border} strokeWidth={1} strokeDasharray="3,3" />
      ))}

      {/* Axes */}
      <line x1={pad.left} y1={pad.top} x2={pad.left} y2={pad.top + plotH}
        stroke={COLORS.textMuted} strokeWidth={1} />
      <line x1={pad.left} y1={pad.top + plotH} x2={W - pad.right} y2={pad.top + plotH}
        stroke={COLORS.textMuted} strokeWidth={1} />

      {/* Y-axis labels */}
      {yTicks.map(v => (
        <text key={v} x={pad.left - 8} y={yScale(v) + 4}
          textAnchor="end" fill={COLORS.textDim} fontSize={11}>
          {(v * 100).toFixed(0)}%
        </text>
      ))}

      {/* X-axis labels */}
      {xTicks.map(k => (
        <text key={k} x={xScale(k)} y={pad.top + plotH + 20}
          textAnchor="middle" fill={COLORS.textDim} fontSize={11}>
          {k}
        </text>
      ))}

      {/* Axis titles */}
      <text x={W / 2} y={H - 4} textAnchor="middle"
        fill={COLORS.textDim} fontSize={12} fontWeight={600}>
        K (number of neighbors)
      </text>
      <text x={14} y={pad.top + plotH / 2}
        textAnchor="middle" fill={COLORS.textDim} fontSize={12} fontWeight={600}
        transform={`rotate(-90, 14, ${pad.top + plotH / 2})`}>
        Validation Accuracy
      </text>

      {/* L2 line */}
      <path d={makePath(l2Data)} fill="none"
        stroke={COLORS.l2} strokeWidth={2.5} strokeLinejoin="round" />
      {l2Data.map(d => (
        <circle key={`l2-${d.k}`} cx={xScale(d.k)} cy={yScale(d.acc)}
          r={3} fill={COLORS.l2} stroke={COLORS.bg} strokeWidth={1.5} />
      ))}

      {/* L1 line */}
      <path d={makePath(l1Data)} fill="none"
        stroke={COLORS.l1} strokeWidth={2.5} strokeLinejoin="round" />
      {l1Data.map(d => (
        <circle key={`l1-${d.k}`} cx={xScale(d.k)} cy={yScale(d.acc)}
          r={3} fill={COLORS.l1} stroke={COLORS.bg} strokeWidth={1.5} />
      ))}

      {/* Legend */}
      <circle cx={W - pad.right - 120} cy={pad.top + 8} r={4} fill={COLORS.l1} />
      <text x={W - pad.right - 112} y={pad.top + 12}
        fill={COLORS.l1} fontSize={12} fontWeight={600}>
        Manhattan (L1)
      </text>
      <circle cx={W - pad.right - 120} cy={pad.top + 28} r={4} fill={COLORS.l2} />
      <text x={W - pad.right - 112} y={pad.top + 32}
        fill={COLORS.l2} fontSize={12} fontWeight={600}>
        Euclidean (L2)
      </text>
    </svg>
  );
}

// ─── Headline Stat Card ─────────────────────────────────────

function StatCard({ label, value, sublabel, color, icon }) {
  return (
    <div style={{
      background: COLORS.card, borderRadius: 12,
      border: `1px solid ${COLORS.border}`,
      padding: "16px 20px", flex: 1, minWidth: 140,
      textAlign: "center",
    }}>
      <div style={{ fontSize: 12, fontWeight: 600, color: COLORS.textDim, marginBottom: 4 }}>
        {icon && <span style={{ marginRight: 4 }}>{icon}</span>}
        {label}
      </div>
      <div style={{ fontSize: 28, fontWeight: 800, color, lineHeight: 1.1 }}>
        {value}
      </div>
      {sublabel && (
        <div style={{ fontSize: 11, color: COLORS.textMuted, marginTop: 4 }}>
          {sublabel}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ─────────────────────────────────────────

export default function KnnDistanceComparison() {
  const [activeMetric, setActiveMetric] = useState("l1");
  const data = TUNING_DATA[activeMetric];
  const other = activeMetric === "l1" ? TUNING_DATA.l2 : TUNING_DATA.l1;

  const emojis = { cats: "🐱", dogs: "🐶", panda: "🐼" };

  return (
    <div style={{
      fontFamily: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      background: COLORS.bg, color: COLORS.text, minHeight: "100vh",
      padding: "32px 24px",
    }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* ── Header ─────────────────────────────────────── */}
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontSize: 11, fontWeight: 700, letterSpacing: "0.12em",
            color: COLORS.textMuted, textTransform: "uppercase",
            marginBottom: 8,
          }}>
            knn_v2.py · animals dataset · chapter 7
          </div>
          <h1 style={{
            fontSize: 26, fontWeight: 800, margin: 0,
            color: COLORS.text, lineHeight: 1.2,
          }}>
            Distance Metric Comparison
          </h1>
          <p style={{
            fontSize: 13, color: COLORS.textDim, margin: "8px 0 0",
            lineHeight: 1.6, maxWidth: 620,
          }}>
            Same dataset, same K-tuning range (1–31, odd only), same splits
            (train=1800, val=450, test=750). The only thing that changed is
            how "distance" is measured between two images in the 3072-dimensional
            feature space.
          </p>
        </div>

        {/* ── Metric Toggle ──────────────────────────────── */}
        <div style={{
          display: "flex", gap: 8, marginBottom: 28,
        }}>
          {["l1", "l2"].map(key => {
            const d = TUNING_DATA[key];
            const isActive = activeMetric === key;
            const color = key === "l1" ? COLORS.l1 : COLORS.l2;
            return (
              <button
                key={key}
                onClick={() => setActiveMetric(key)}
                style={{
                  flex: 1, padding: "14px 16px",
                  background: isActive ? `${color}15` : COLORS.card,
                  border: `2px solid ${isActive ? color : COLORS.border}`,
                  borderRadius: 12, cursor: "pointer",
                  transition: "all 0.2s ease",
                  textAlign: "left",
                }}
              >
                <div style={{
                  fontSize: 14, fontWeight: 700,
                  color: isActive ? color : COLORS.textDim,
                }}>
                  {d.label}
                </div>
                <div style={{
                  fontSize: 11, color: COLORS.textMuted,
                  marginTop: 2, fontFamily: "inherit",
                }}>
                  p={d.p} · {d.formula}
                </div>
                <div style={{
                  fontSize: 11, color: COLORS.textMuted,
                  fontStyle: "italic", marginTop: 2,
                }}>
                  {d.intuition}
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Headline Stats ─────────────────────────────── */}
        <div style={{
          display: "flex", gap: 12, marginBottom: 28,
          flexWrap: "wrap",
        }}>
          <StatCard
            label="BEST K"
            value={data.bestK}
            sublabel="from validation tuning"
            color={COLORS.accent}
          />
          <StatCard
            label="VAL ACCURACY"
            value={`${(data.valAcc * 100).toFixed(1)}%`}
            sublabel={`${Math.round(data.valAcc * 450)} of 450 correct`}
            color={COLORS.purple}
          />
          <StatCard
            label="TEST ACCURACY"
            value={`${(data.testAcc * 100).toFixed(0)}%`}
            sublabel={`${Math.round(data.testAcc * 750)} of 750 correct`}
            color={data.testAcc > other.testAcc ? COLORS.green : COLORS.orange}
          />
          <StatCard
            label="VS OTHER METRIC"
            value={data.testAcc > other.testAcc ? "WINNER" : "SLOWER"}
            sublabel={`${data.testAcc > other.testAcc ? "+" : ""}${((data.testAcc - other.testAcc) * 100).toFixed(0)}% vs ${other.label}`}
            color={data.testAcc > other.testAcc ? COLORS.green : COLORS.red}
          />
        </div>

        {/* ── Tuning Curves ──────────────────────────────── */}
        <div style={{
          background: COLORS.card, borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 28,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: COLORS.text,
            marginBottom: 4,
          }}>
            K-Tuning Curves
            <InfoTooltip text="Each point shows how well the model performed on the 450-image validation set for a given value of K. Both metrics were tested on identical splits. The model picks the K with the highest validation accuracy, then evaluates ONE time on the held-out test set." />
          </div>
          <div style={{
            fontSize: 12, color: COLORS.textDim, marginBottom: 16,
          }}>
            Validation accuracy across K=1 to K=31 (odd values only)
          </div>
          <div style={{ overflowX: "auto" }}>
            <TuningCurve
              l1Data={TUNING_DATA.l1.curve}
              l2Data={TUNING_DATA.l2.curve}
            />
          </div>
          <div style={{
            fontSize: 11, color: COLORS.textMuted, marginTop: 12,
            lineHeight: 1.5, fontStyle: "italic",
          }}>
            Notice: L1 (cyan) sits above L2 (amber) across nearly every K value.
            This isn't just "the best K happened to be better" — Manhattan distance
            is consistently finding more useful neighbors in this 3072-dimensional
            space. The gap widens as K increases.
          </div>
        </div>

        {/* ── Section: "Reading the Report Card" ─────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.card} 0%, #1f2233 100%)`,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 28,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: COLORS.text,
            marginBottom: 12,
          }}>
            📖 How to Read the Cards Below
          </div>
          <div style={{
            fontSize: 12, color: COLORS.textDim, lineHeight: 1.8,
          }}>
            <p style={{ margin: "0 0 10px" }}>
              Each animal gets a card showing two bars. Here's what they mean:
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <span style={{ color: COLORS.green, fontWeight: 700 }}>RECALL</span> →
              "Of all the <em>actual</em> cats in the test set, how many did the model find?"
              Think of it like a search — recall measures <strong>completeness</strong>.
              {" "}A recall of 67% on 249 cats means it correctly identified 167 and <em>missed</em> 82.
            </p>
            <p style={{ margin: "0 0 8px" }}>
              <span style={{ color: COLORS.accent, fontWeight: 700 }}>PRECISION</span> →
              "When the model <em>said</em> 'this is a cat', how often was it right?"
              Think of it like trust — precision measures <strong>reliability</strong>.
              {" "}A precision of 50% means half the time it said "cat", it was actually something else.
            </p>
            <p style={{ margin: "0 0 0" }}>
              <span style={{ color: COLORS.orange, fontWeight: 700 }}>F1 SCORE</span> →
              The "balanced grade" — it's only high when <em>both</em> precision and recall
              are high. You can't cheat it by being good at just one.
            </p>
          </div>
        </div>

        {/* ── Per-class Breakdown ─────────────────────────── */}
        <div style={{
          fontSize: 14, fontWeight: 700, color: COLORS.text,
          marginBottom: 14,
        }}>
          Per-Class Breakdown — {data.label} (K={data.bestK})
        </div>
        <div style={{
          display: "flex", gap: 14, marginBottom: 28,
          flexWrap: "wrap",
        }}>
          {Object.entries(data.classes).map(([name, cls]) => (
            <ClassBreakdown
              key={name}
              name={name}
              data={cls}
              metricColor={activeMetric === "l1" ? COLORS.l1 : COLORS.l2}
              emoji={emojis[name]}
            />
          ))}
        </div>

        {/* ── The Panda Story ────────────────────────────── */}
        <div style={{
          background: COLORS.card, borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 28,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: COLORS.text,
            marginBottom: 12,
          }}>
            🐼 The Panda Story — L1 vs L2
          </div>
          <div style={{
            fontSize: 12, color: COLORS.textDim, lineHeight: 1.8,
          }}>
            <p style={{ margin: "0 0 10px" }}>
              Pandas remain the most interesting case. Both metrics achieve
              <strong style={{ color: COLORS.green }}> ~90% precision</strong> for pandas —
              when either model says "panda", it's almost always right. The model is
              <em> cautious </em> about labeling things as pandas.
            </p>
            <p style={{ margin: "0 0 10px" }}>
              But the recall tells a very different story:
            </p>
            <div style={{
              display: "flex", gap: 16, marginBottom: 10,
              flexWrap: "wrap",
            }}>
              <div style={{
                flex: 1, minWidth: 200, padding: 12, borderRadius: 8,
                background: COLORS.l2Bg, border: `1px solid ${COLORS.l2Dim}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.l2 }}>
                  L2 Euclidean
                </div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
                  Recall: <strong style={{ color: COLORS.red }}>36%</strong> →
                  Only {Math.round(0.36 * 239)} of 239 pandas found.
                  <br />{239 - Math.round(0.36 * 239)} pandas misclassified as cats or dogs.
                </div>
              </div>
              <div style={{
                flex: 1, minWidth: 200, padding: 12, borderRadius: 8,
                background: COLORS.l1Bg, border: `1px solid ${COLORS.l1Dim}`,
              }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: COLORS.l1 }}>
                  L1 Manhattan
                </div>
                <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 4 }}>
                  Recall: <strong style={{ color: COLORS.orange }}>52%</strong> →
                  {Math.round(0.52 * 239)} of 239 pandas found.
                  <br />That's {Math.round(0.52 * 239) - Math.round(0.36 * 239)} more pandas
                  rescued from being mislabeled.
                </div>
              </div>
            </div>
            <p style={{ margin: 0 }}>
              <strong>Why?</strong> In 3072 dimensions, Euclidean distance squares each
              pixel difference before summing. A few big pixel differences (like a bright
              background) can dominate the total, drowning out the subtle pattern
              differences that actually distinguish pandas. Manhattan distance just sums
              absolute differences — no squaring — so it's less sensitive to a few
              outlier pixels dominating the measurement.
            </p>
          </div>
        </div>

        {/* ── Side-by-Side Summary Table ──────────────────── */}
        <div style={{
          background: COLORS.card, borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 28,
          overflowX: "auto",
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: COLORS.text,
            marginBottom: 16,
          }}>
            Head-to-Head Summary
          </div>
          <table style={{
            width: "100%", borderCollapse: "collapse",
            fontSize: 12, minWidth: 500,
          }}>
            <thead>
              <tr>
                <th style={{ ...thStyle, textAlign: "left" }}></th>
                <th style={{ ...thStyle, color: COLORS.l2 }}>Euclidean (L2)</th>
                <th style={{ ...thStyle, color: COLORS.l1 }}>Manhattan (L1)</th>
                <th style={thStyle}>Δ (L1 − L2)</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Test Accuracy", `${(TUNING_DATA.l2.testAcc * 100).toFixed(0)}%`, `${(TUNING_DATA.l1.testAcc * 100).toFixed(0)}%`,
                  `+${((TUNING_DATA.l1.testAcc - TUNING_DATA.l2.testAcc) * 100).toFixed(0)}%`],
                ["Best K", TUNING_DATA.l2.bestK, TUNING_DATA.l1.bestK, "same"],
                ["Cat F1", TUNING_DATA.l2.classes.cats.f1.toFixed(2), TUNING_DATA.l1.classes.cats.f1.toFixed(2),
                  `+${(TUNING_DATA.l1.classes.cats.f1 - TUNING_DATA.l2.classes.cats.f1).toFixed(2)}`],
                ["Dog F1", TUNING_DATA.l2.classes.dogs.f1.toFixed(2), TUNING_DATA.l1.classes.dogs.f1.toFixed(2),
                  `+${(TUNING_DATA.l1.classes.dogs.f1 - TUNING_DATA.l2.classes.dogs.f1).toFixed(2)}`],
                ["Panda F1", TUNING_DATA.l2.classes.panda.f1.toFixed(2), TUNING_DATA.l1.classes.panda.f1.toFixed(2),
                  `+${(TUNING_DATA.l1.classes.panda.f1 - TUNING_DATA.l2.classes.panda.f1).toFixed(2)}`],
                ["Panda Recall", `${(TUNING_DATA.l2.classes.panda.recall * 100).toFixed(0)}%`, `${(TUNING_DATA.l1.classes.panda.recall * 100).toFixed(0)}%`,
                  `+${((TUNING_DATA.l1.classes.panda.recall - TUNING_DATA.l2.classes.panda.recall) * 100).toFixed(0)}%`],
              ].map(([label, l2Val, l1Val, delta], i) => (
                <tr key={i}>
                  <td style={{ ...tdStyle, fontWeight: 600, color: COLORS.textDim }}>{label}</td>
                  <td style={{ ...tdStyle, color: COLORS.l2 }}>{l2Val}</td>
                  <td style={{ ...tdStyle, color: COLORS.l1 }}>{l1Val}</td>
                  <td style={{
                    ...tdStyle, fontWeight: 700,
                    color: delta.startsWith("+") ? COLORS.green :
                           delta === "same" ? COLORS.textMuted : COLORS.red,
                  }}>{delta}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* ── Key Takeaway ───────────────────────────────── */}
        <div style={{
          background: `linear-gradient(135deg, ${COLORS.l1}10 0%, ${COLORS.l2}10 100%)`,
          borderRadius: 12,
          border: `1px solid ${COLORS.border}`,
          padding: 24, marginBottom: 16,
        }}>
          <div style={{
            fontSize: 14, fontWeight: 700, color: COLORS.text,
            marginBottom: 10,
          }}>
            💡 Key Takeaway
          </div>
          <div style={{
            fontSize: 12, color: COLORS.textDim, lineHeight: 1.8,
          }}>
            <strong style={{ color: COLORS.l1 }}>Manhattan (L1) wins here</strong> — it
            improved test accuracy from 51% to 57%, and the biggest improvement was
            panda recall jumping from 36% to 52%. In high-dimensional pixel spaces,
            L1 distance tends to be more robust because Euclidean distance suffers
            from the <em>concentration effect</em>: when you square thousands of small
            differences, distances between all points converge toward a similar value,
            making it harder to distinguish neighbors. L1 avoids this by using absolute
            differences. But remember — this is dataset-specific. A different feature
            representation (like learned features from a neural network) might flip the
            result entirely.
          </div>
        </div>

        {/* ── Footer ─────────────────────────────────────── */}
        <div style={{
          fontSize: 11, color: COLORS.textMuted,
          textAlign: "center", padding: "8px 0 24px",
        }}>
          knn_v2.py · animals dataset (3000 images) · train=1800 / val=450 / test=750
          <br />
          both runs: best K=31 (odd values 1–31) · Minkowski distance p=1 vs p=2
        </div>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "8px 12px",
  borderBottom: `2px solid ${COLORS.border}`,
  fontWeight: 700,
  color: COLORS.textDim,
  textAlign: "center",
  fontSize: 12,
};

const tdStyle = {
  padding: "10px 12px",
  borderBottom: `1px solid ${COLORS.border}`,
  textAlign: "center",
  fontSize: 13,
};
