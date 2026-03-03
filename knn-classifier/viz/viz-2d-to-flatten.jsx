import { useState, useMemo, useCallback } from "react";

// Generate a small synthetic "image" with recognizable RGB values
const IMG_H = 4;
const IMG_W = 4;
const CHANNELS = 3;
const TOTAL = IMG_H * IMG_W * CHANNELS;

const CHANNEL_NAMES = ["R", "G", "B"];
const CHANNEL_COLORS = ["#ff6b6b", "#51cf66", "#339af0"];
const CHANNEL_BG = ["rgba(255,107,107,0.12)", "rgba(81,207,102,0.12)", "rgba(51,154,240,0.12)"];
const CHANNEL_BORDER = ["rgba(255,107,107,0.4)", "rgba(81,207,102,0.4)", "rgba(51,154,240,0.4)"];

// Seed some pixel values that look somewhat realistic
function generateImage() {
  const img = [];
  for (let r = 0; r < IMG_H; r++) {
    const row = [];
    for (let c = 0; c < IMG_W; c++) {
      // Create a gradient-ish pattern
      const red = Math.min(255, Math.floor(40 + r * 50 + c * 10));
      const green = Math.min(255, Math.floor(80 + c * 40 + r * 15));
      const blue = Math.min(255, Math.floor(120 + (IMG_H - r) * 30 + c * 20));
      row.push([red, green, blue]);
    }
    img.push(row);
  }
  return img;
}

// Flatten the image C-order
function flattenImage(img) {
  const flat = [];
  for (let r = 0; r < IMG_H; r++) {
    for (let c = 0; c < IMG_W; c++) {
      for (let ch = 0; ch < CHANNELS; ch++) {
        flat.push({
          value: img[r][c][ch],
          row: r,
          col: c,
          channel: ch,
          flatIdx: r * (IMG_W * CHANNELS) + c * CHANNELS + ch,
        });
      }
    }
  }
  return flat;
}

function computeFlatIdx(row, col, channel) {
  return row * (IMG_W * CHANNELS) + col * CHANNELS + channel;
}

export default function FlattenVisualizer() {
  const image = useMemo(() => generateImage(), []);
  const flatData = useMemo(() => flattenImage(image), [image]);

  const [selected, setSelected] = useState(null); // { row, col, channel }
  const [hoveredFlat, setHoveredFlat] = useState(null);
  const [showFormula, setShowFormula] = useState(true);

  const activePixel = hoveredFlat !== null
    ? flatData[hoveredFlat]
    : selected;

  const activeIndices = useMemo(() => {
    if (!activePixel) return new Set();
    // All 3 channels of the selected pixel
    const base = activePixel.row * (IMG_W * CHANNELS) + activePixel.col * CHANNELS;
    return new Set([base, base + 1, base + 2]);
  }, [activePixel]);

  const exactIdx = activePixel ? activePixel.flatIdx : null;

  const handlePixelClick = useCallback((row, col) => {
    setSelected({ row, col, channel: 0, flatIdx: computeFlatIdx(row, col, 0), value: image[row][col][0] });
  }, [image]);

  const handleChannelSelect = useCallback((channel) => {
    if (!selected && !activePixel) return;
    const p = activePixel || selected;
    setSelected({
      row: p.row,
      col: p.col,
      channel,
      flatIdx: computeFlatIdx(p.row, p.col, channel),
      value: image[p.row][p.col][channel],
    });
  }, [activePixel, selected, image]);

  return (
    <div style={{
      fontFamily: "'IBM Plex Mono', 'SF Mono', 'Fira Code', monospace",
      background: "#0a0e17",
      color: "#c8d3e0",
      minHeight: "100vh",
      padding: "28px 24px",
      boxSizing: "border-box",
    }}>
      {/* Header */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <h1 style={{
          fontSize: 20,
          fontWeight: 700,
          color: "#e8edf4",
          margin: 0,
          letterSpacing: "-0.02em",
        }}>
          NumPy Image Flatten — Pixel ↔ Index Mapping
        </h1>
        <p style={{
          fontSize: 12,
          color: "#5a6a7e",
          marginTop: 6,
          fontWeight: 400,
        }}>
          shape ({IMG_H}, {IMG_W}, {CHANNELS}) → flatten() → shape ({TOTAL},)
          <span style={{ margin: "0 8px", color: "#2d3748" }}>|</span>
          C-order (row-major)
        </p>
      </div>

      {/* Main layout */}
      <div style={{
        display: "flex",
        flexDirection: "column",
        gap: 24,
        maxWidth: 760,
        margin: "0 auto",
      }}>
        {/* Top section: 2D Grid + Info Panel */}
        <div style={{
          display: "flex",
          gap: 20,
          alignItems: "flex-start",
          flexWrap: "wrap",
          justifyContent: "center",
        }}>
          {/* 2D Image Grid */}
          <div>
            <div style={{
              fontSize: 10,
              color: "#5a6a7e",
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: "0.08em",
              fontWeight: 600,
            }}>
              2D Array — image[row][col]
            </div>

            {/* Column indices */}
            <div style={{ display: "flex", marginLeft: 36, marginBottom: 4 }}>
              {Array.from({ length: IMG_W }, (_, c) => (
                <div key={c} style={{
                  width: 64,
                  textAlign: "center",
                  fontSize: 10,
                  color: activePixel && activePixel.col === c ? "#e8edf4" : "#3d4a5c",
                  fontWeight: activePixel && activePixel.col === c ? 700 : 400,
                  transition: "all 0.15s",
                }}>
                  col {c}
                </div>
              ))}
            </div>

            {image.map((row, r) => (
              <div key={r} style={{ display: "flex", alignItems: "center", marginBottom: 2 }}>
                {/* Row label */}
                <div style={{
                  width: 34,
                  fontSize: 10,
                  color: activePixel && activePixel.row === r ? "#e8edf4" : "#3d4a5c",
                  fontWeight: activePixel && activePixel.row === r ? 700 : 400,
                  textAlign: "right",
                  paddingRight: 6,
                  transition: "all 0.15s",
                }}>
                  row {r}
                </div>

                {row.map((pixel, c) => {
                  const isSelected = activePixel && activePixel.row === r && activePixel.col === c;
                  const rgbStr = `rgb(${pixel[0]}, ${pixel[1]}, ${pixel[2]})`;

                  return (
                    <div
                      key={c}
                      onClick={() => handlePixelClick(r, c)}
                      style={{
                        width: 60,
                        height: 60,
                        margin: 2,
                        borderRadius: 6,
                        background: rgbStr,
                        cursor: "pointer",
                        position: "relative",
                        outline: isSelected ? "2px solid #e8edf4" : "1px solid rgba(255,255,255,0.06)",
                        outlineOffset: isSelected ? 1 : 0,
                        transform: isSelected ? "scale(1.08)" : "scale(1)",
                        transition: "all 0.15s ease",
                        boxShadow: isSelected ? "0 0 20px rgba(255,255,255,0.15)" : "none",
                        zIndex: isSelected ? 2 : 1,
                      }}
                    >
                      {/* Pixel coordinate label */}
                      <div style={{
                        position: "absolute",
                        bottom: 2,
                        right: 4,
                        fontSize: 8,
                        color: "rgba(255,255,255,0.7)",
                        fontWeight: 600,
                        textShadow: "0 1px 3px rgba(0,0,0,0.8)",
                      }}>
                        [{r},{c}]
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Info Panel */}
          <div style={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 18,
            minWidth: 280,
            flex: "0 1 320px",
          }}>
            {activePixel ? (
              <>
                <div style={{
                  fontSize: 10,
                  color: "#5a6a7e",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  fontWeight: 600,
                  marginBottom: 12,
                }}>
                  Selected Pixel
                </div>

                {/* Color swatch */}
                <div style={{
                  width: "100%",
                  height: 36,
                  borderRadius: 6,
                  background: `rgb(${image[activePixel.row][activePixel.col][0]}, ${image[activePixel.row][activePixel.col][1]}, ${image[activePixel.row][activePixel.col][2]})`,
                  marginBottom: 14,
                  border: "1px solid rgba(255,255,255,0.08)",
                }} />

                {/* Numpy accessor */}
                <div style={{
                  background: "#0a0e17",
                  borderRadius: 6,
                  padding: "10px 12px",
                  fontSize: 13,
                  marginBottom: 14,
                  border: "1px solid #1e293b",
                }}>
                  <span style={{ color: "#5a6a7e" }}>image</span>
                  <span style={{ color: "#fbbf24" }}>[{activePixel.row}]</span>
                  <span style={{ color: "#fbbf24" }}>[{activePixel.col}]</span>
                  {" = "}
                  <span style={{ color: "#e8edf4" }}>
                    [{image[activePixel.row][activePixel.col].join(", ")}]
                  </span>
                </div>

                {/* Channel selector */}
                <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
                  {CHANNEL_NAMES.map((ch, i) => {
                    const isActive = activePixel.channel === i;
                    return (
                      <button
                        key={i}
                        onClick={() => handleChannelSelect(i)}
                        style={{
                          flex: 1,
                          padding: "8px 4px",
                          borderRadius: 6,
                          border: `1px solid ${isActive ? CHANNEL_COLORS[i] : CHANNEL_BORDER[i]}`,
                          background: isActive ? CHANNEL_BG[i] : "transparent",
                          color: isActive ? CHANNEL_COLORS[i] : "#5a6a7e",
                          cursor: "pointer",
                          fontSize: 12,
                          fontWeight: 600,
                          fontFamily: "inherit",
                          transition: "all 0.15s",
                        }}
                      >
                        <div>{ch}</div>
                        <div style={{
                          fontSize: 16,
                          fontWeight: 700,
                          marginTop: 2,
                          color: isActive ? "#e8edf4" : "#8a96a6",
                        }}>
                          {image[activePixel.row][activePixel.col][i]}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Formula */}
                {showFormula && (
                  <div style={{
                    background: "#0a0e17",
                    borderRadius: 6,
                    padding: "10px 12px",
                    fontSize: 11,
                    lineHeight: 1.7,
                    border: "1px solid #1e293b",
                  }}>
                    <div style={{ color: "#5a6a7e", marginBottom: 4, fontSize: 10, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      Flat Index Formula (C-order)
                    </div>
                    <div>
                      <span style={{ color: "#fbbf24" }}>{activePixel.row}</span>
                      <span style={{ color: "#5a6a7e" }}> × (</span>
                      <span style={{ color: "#a78bfa" }}>{IMG_W}</span>
                      <span style={{ color: "#5a6a7e" }}> × </span>
                      <span style={{ color: "#a78bfa" }}>{CHANNELS}</span>
                      <span style={{ color: "#5a6a7e" }}>) + </span>
                      <span style={{ color: "#fbbf24" }}>{activePixel.col}</span>
                      <span style={{ color: "#5a6a7e" }}> × </span>
                      <span style={{ color: "#a78bfa" }}>{CHANNELS}</span>
                      <span style={{ color: "#5a6a7e" }}> + </span>
                      <span style={{ color: CHANNEL_COLORS[activePixel.channel] }}>{activePixel.channel}</span>
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <span style={{ color: "#5a6a7e" }}>= </span>
                      <span style={{ color: "#fbbf24" }}>{activePixel.row * (IMG_W * CHANNELS)}</span>
                      <span style={{ color: "#5a6a7e" }}> + </span>
                      <span style={{ color: "#fbbf24" }}>{activePixel.col * CHANNELS}</span>
                      <span style={{ color: "#5a6a7e" }}> + </span>
                      <span style={{ color: CHANNEL_COLORS[activePixel.channel] }}>{activePixel.channel}</span>
                      <span style={{ color: "#5a6a7e" }}> = </span>
                      <span style={{ color: "#e8edf4", fontWeight: 700, fontSize: 14 }}>{activePixel.flatIdx}</span>
                    </div>
                    <div style={{ marginTop: 8, borderTop: "1px solid #1e293b", paddingTop: 8 }}>
                      <span style={{ color: "#5a6a7e" }}>flat</span>
                      <span style={{ color: "#e8edf4" }}>[</span>
                      <span style={{ color: "#fbbf24", fontWeight: 700 }}>{activePixel.flatIdx}</span>
                      <span style={{ color: "#e8edf4" }}>]</span>
                      <span style={{ color: "#5a6a7e" }}> = </span>
                      <span style={{ color: CHANNEL_COLORS[activePixel.channel], fontWeight: 700 }}>
                        {activePixel.value}
                      </span>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{
                color: "#3d4a5c",
                fontSize: 12,
                textAlign: "center",
                padding: "32px 16px",
                lineHeight: 1.7,
              }}>
                Click a pixel in the 2D grid to see how its RGB values map to positions in the flattened array
              </div>
            )}
          </div>
        </div>

        {/* Traversal Order Indicator */}
        <div style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: "12px 16px",
        }}>
          <div style={{
            fontSize: 10,
            color: "#5a6a7e",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 8,
          }}>
            C-Order Traversal — How flatten() Reads the Array
          </div>
          <div style={{
            fontSize: 12,
            color: "#8a96a6",
            lineHeight: 1.7,
          }}>
            <span style={{ color: "#339af0" }}>innermost</span>
            {" → channels (R,G,B) → "}
            <span style={{ color: "#fbbf24" }}>middle</span>
            {" → columns (left→right) → "}
            <span style={{ color: "#ff6b6b" }}>outermost</span>
            {" → rows (top→bottom)"}
          </div>
          <div style={{
            fontSize: 11,
            color: "#3d4a5c",
            marginTop: 6,
            fontStyle: "italic",
          }}>
            For each row, visit each column. For each column, emit R then G then B. Move to next column. When row is done, move to next row.
          </div>
        </div>

        {/* Flattened Array */}
        <div>
          <div style={{
            fontSize: 10,
            color: "#5a6a7e",
            marginBottom: 8,
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
          }}>
            Flattened 1D Array — image.flatten() — {TOTAL} elements
          </div>

          <div style={{
            background: "#111827",
            border: "1px solid #1e293b",
            borderRadius: 10,
            padding: 14,
            overflowX: "auto",
          }}>
            {/* Group by pixel (3 channels each) */}
            {Array.from({ length: IMG_H }, (_, r) => (
              <div key={r}>
                {/* Row label */}
                <div style={{
                  fontSize: 9,
                  color: activePixel && activePixel.row === r ? "#8a96a6" : "#2d3748",
                  marginBottom: 3,
                  marginTop: r > 0 ? 6 : 0,
                  fontWeight: 600,
                  transition: "color 0.15s",
                }}>
                  row {r} ──
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 2 }}>
                  {Array.from({ length: IMG_W }, (_, c) => {
                    const baseIdx = r * (IMG_W * CHANNELS) + c * CHANNELS;
                    const isPixelActive = activePixel && activePixel.row === r && activePixel.col === c;

                    return (
                      <div
                        key={c}
                        style={{
                          display: "flex",
                          gap: 1,
                          padding: "2px 3px",
                          borderRadius: 4,
                          background: isPixelActive ? "rgba(255,255,255,0.04)" : "transparent",
                          border: isPixelActive ? "1px solid rgba(255,255,255,0.1)" : "1px solid transparent",
                          marginRight: 4,
                          transition: "all 0.15s",
                        }}
                      >
                        {[0, 1, 2].map(ch => {
                          const flatIdx = baseIdx + ch;
                          const entry = flatData[flatIdx];
                          const isExact = exactIdx === flatIdx;
                          const isInGroup = activeIndices.has(flatIdx);

                          return (
                            <div
                              key={ch}
                              onMouseEnter={() => setHoveredFlat(flatIdx)}
                              onMouseLeave={() => setHoveredFlat(null)}
                              onClick={() => {
                                setSelected(entry);
                                setHoveredFlat(null);
                              }}
                              style={{
                                width: 38,
                                height: 32,
                                display: "flex",
                                flexDirection: "column",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: 3,
                                cursor: "pointer",
                                background: isExact
                                  ? CHANNEL_BG[ch]
                                  : isInGroup
                                    ? "rgba(255,255,255,0.02)"
                                    : "transparent",
                                border: isExact
                                  ? `1.5px solid ${CHANNEL_COLORS[ch]}`
                                  : isInGroup
                                    ? `1px solid ${CHANNEL_BORDER[ch]}`
                                    : "1px solid transparent",
                                transition: "all 0.12s",
                              }}
                            >
                              <div style={{
                                fontSize: 11,
                                fontWeight: isExact ? 700 : 500,
                                color: isExact ? "#e8edf4" : isInGroup ? "#8a96a6" : "#3d4a5c",
                                transition: "color 0.12s",
                              }}>
                                {entry.value}
                              </div>
                              <div style={{
                                fontSize: 7,
                                color: isExact ? CHANNEL_COLORS[ch] : "#2d3748",
                                fontWeight: 600,
                                marginTop: 1,
                                transition: "color 0.12s",
                              }}>
                                [{flatIdx}]
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Code Example */}
        <div style={{
          background: "#111827",
          border: "1px solid #1e293b",
          borderRadius: 10,
          padding: 18,
        }}>
          <div style={{
            fontSize: 10,
            color: "#5a6a7e",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 12,
          }}>
            Python — Accessing Both Ways
          </div>

          <pre style={{
            margin: 0,
            fontSize: 12,
            lineHeight: 1.8,
            color: "#c8d3e0",
            overflowX: "auto",
          }}>
            <code>{`import numpy as np

# Load / create a ${IMG_H}×${IMG_W} RGB image
image = np.random.randint(0, 256, (${IMG_H}, ${IMG_W}, ${CHANNELS}), dtype=np.uint8)
print(image.shape)  # (${IMG_H}, ${IMG_W}, ${CHANNELS})

# ── 3D access: image[row, col, channel] ──
pixel_rgb = image[1, 2]        # shape (3,) → all 3 channels
red_val   = image[1, 2, 0]     # scalar  → just red

# ── Flatten to 1D feature vector ──
flat = image.flatten()          # C-order by default
print(flat.shape)               # (${TOTAL},)

# ── 1D access: flat[index] ──
# same red value, computed via formula:
idx = 1 * (${IMG_W} * ${CHANNELS}) + 2 * ${CHANNELS} + 0  # = ${1 * (IMG_W * CHANNELS) + 2 * CHANNELS + 0}
assert flat[idx] == image[1, 2, 0]

# ── Convenience: np.ravel_multi_index ──
idx2 = np.ravel_multi_index((1, 2, 0), image.shape)
assert idx2 == idx  # same thing

# ── Reverse: flat index → (row, col, ch) ──
coords = np.unravel_index(${1 * (IMG_W * CHANNELS) + 2 * CHANNELS + 0}, image.shape)
print(coords)  # (1, 2, 0)`}</code>
          </pre>
        </div>

        {/* KNN Context */}
        <div style={{
          background: "rgba(251, 191, 36, 0.04)",
          border: "1px solid rgba(251, 191, 36, 0.15)",
          borderRadius: 10,
          padding: "14px 18px",
        }}>
          <div style={{
            fontSize: 10,
            color: "#fbbf24",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
            fontWeight: 600,
            marginBottom: 6,
          }}>
            Why This Matters for KNN
          </div>
          <div style={{
            fontSize: 12,
            color: "#8a96a6",
            lineHeight: 1.7,
          }}>
            Your 32×32×3 animals images become <span style={{ color: "#e8edf4", fontWeight: 600 }}>3,072-element</span> feature
            vectors after flattening. Each element in that vector is one channel of one pixel. KNN computes
            Euclidean distance between these vectors — so pixel <span style={{ color: "#e8edf4" }}>[0,0,R]</span> at
            flat index <span style={{ color: "#fbbf24" }}>0</span> and
            pixel <span style={{ color: "#e8edf4" }}>[31,31,B]</span> at flat index <span style={{ color: "#fbbf24" }}>3071</span> are
            treated as coordinates in the same 3072-dimensional space. The spatial layout is gone — it's just a
            long list of numbers now.
          </div>
        </div>

        {/* Footer */}
        <div style={{
          textAlign: "center",
          fontSize: 10,
          color: "#2d3748",
          paddingBottom: 8,
        }}>
          NumPy uses C-order (row-major) by default — same as C arrays in memory.
          <br />
          Fortran-order (column-major) would traverse columns first instead.
        </div>
      </div>
    </div>
  );
}
