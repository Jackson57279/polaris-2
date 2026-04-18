export type GradientStyle = "mesh" | "aurora" | "noise" | "aurora-flow";

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const sanitized = hex.replace("#", "");
  const r = parseInt(sanitized.substring(0, 2), 16) / 255;
  const g = parseInt(sanitized.substring(2, 4), 16) / 255;
  const b = parseInt(sanitized.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return { h: h * 360, s: s * 100, l: l * 100 };
}

function hslString(h: number, s: number, l: number, a = 1): string {
  return `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`;
}

function parseColors(input: string[]): string[] {
  return input.map((c) => {
    const trimmed = c.trim();
    if (trimmed.startsWith("#")) return trimmed;
    if (trimmed.startsWith("hsl")) return trimmed;
    if (trimmed.startsWith("rgb")) return trimmed;
    return `#${trimmed}`;
  });
}

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function generateMeshPositions(count: number): Array<{ x: number; y: number; size: number }> {
  const positions: Array<{ x: number; y: number; size: number }> = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const radius = 0.3 + Math.random() * 0.4;
    positions.push({
      x: 50 + Math.cos(angle) * radius * 50,
      y: 50 + Math.sin(angle) * radius * 50,
      size: 40 + Math.random() * 50,
    });
  }
  return positions;
}

export interface GradientResult {
  className: string;
  css: string;
}

export function generateGradient(colors: string[], style: GradientStyle = "mesh", className = "generated-gradient"): GradientResult {
  const parsed = parseColors(colors);
  const hsls = parsed.map((c) => (c.startsWith("#") ? hexToHsl(c) : null)).filter(Boolean) as Array<{ h: number; s: number; l: number }>;

  const baseColors = hsls.length > 0 ? hsls : [
    { h: 260, s: 80, l: 60 },
    { h: 190, s: 90, l: 55 },
    { h: 320, s: 85, l: 65 },
  ];

  switch (style) {
    case "mesh":
      return generateMeshGradient(baseColors, className);
    case "aurora":
      return generateAuroraGradient(baseColors, className);
    case "aurora-flow":
      return generateAuroraFlowGradient(baseColors, className);
    case "noise":
      return generateNoiseGradient(baseColors, className);
    default:
      return generateMeshGradient(baseColors, className);
  }
}

function generateMeshGradient(colors: Array<{ h: number; s: number; l: number }>, className: string): GradientResult {
  const positions = generateMeshPositions(colors.length + 2);
  const shuffled = shuffle([...colors, ...colors]);

  const layers = positions.map((pos, i) => {
    const c = shuffled[i % shuffled.length];
    return `radial-gradient(at ${pos.x.toFixed(1)}% ${pos.y.toFixed(1)}%, ${hslString(c.h, c.s, c.l)} 0px, transparent 50%)`;
  });

  const css = `.${className} {
  position: relative;
  background-color: ${hslString(colors[0].h, colors[0].s, Math.max(10, colors[0].l - 20))};
  background-image:
    ${layers.join(",\n    ")};
  background-size: 100% 100%;
  background-repeat: no-repeat;
}

.${className}::before {
  content: "";
  position: absolute;
  inset: 0;
  backdrop-filter: blur(60px);
  -webkit-backdrop-filter: blur(60px);
  pointer-events: none;
}`;

  return { className, css };
}

function generateAuroraGradient(colors: Array<{ h: number; s: number; l: number }>, className: string): GradientResult {
  const c1 = colors[0];
  const c2 = colors[1] ?? colors[0];
  const c3 = colors[2] ?? c2;
  const c4 = colors[3] ?? c1;

  const css = `.${className} {
  background:
    radial-gradient(ellipse at top, ${hslString(c1.h, c1.s, c1.l, 0.8)}, transparent 70%),
    radial-gradient(ellipse at bottom, ${hslString(c2.h, c2.s, c2.l, 0.8)}, transparent 70%),
    radial-gradient(ellipse at left, ${hslString(c3.h, c3.s, c3.l, 0.6)}, transparent 70%),
    radial-gradient(ellipse at right, ${hslString(c4.h, c4.s, c4.l, 0.6)}, transparent 70%),
    linear-gradient(135deg, ${hslString(c1.h, c1.s, Math.max(10, c1.l - 30))}, ${hslString(c2.h, c2.s, Math.max(10, c2.l - 30))});
  background-size: 200% 200%;
  animation: ${className}-shift 15s ease infinite;
}

@keyframes ${className}-shift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;

  return { className, css };
}

function generateAuroraFlowGradient(colors: Array<{ h: number; s: number; l: number }>, className: string): GradientResult {
  const expanded = colors.length < 4 ? [...colors, ...colors] : colors;
  const stops = expanded.map((c, i) => {
    const pct = (i / (expanded.length - 1)) * 100;
    return `${hslString(c.h, c.s, c.l)} ${pct.toFixed(1)}%`;
  });

  const css = `.${className} {
  background: linear-gradient(-45deg, ${stops.join(", ")});
  background-size: 400% 400%;
  animation: ${className}-flow 12s ease infinite;
}

@keyframes ${className}-flow {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
}`;

  return { className, css };
}

function generateNoiseGradient(colors: Array<{ h: number; s: number; l: number }>, className: string): GradientResult {
  const mesh = generateMeshGradient(colors, `${className}-mesh`);
  const dark = hslString(colors[0].h, colors[0].s, Math.max(5, colors[0].l - 40));

  const noiseSvg = `<svg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='0.15'/></svg>`;
  const noiseDataUrl = `url("data:image/svg+xml,${encodeURIComponent(noiseSvg)}")`;

  const css = `.${className} {
  position: relative;
  background-color: ${dark};
}

.${className}::before {
  content: "";
  position: absolute;
  inset: 0;
  background-image:
    ${(mesh.css.match(/background-image:\s*([\s\S]*?)(?=\n\}|;)/)?.[1] ?? "").trim()},
    ${noiseDataUrl};
  background-size: 100% 100%, 200px 200px;
  background-repeat: no-repeat, repeat;
  backdrop-filter: blur(50px);
  -webkit-backdrop-filter: blur(50px);
  pointer-events: none;
}`;

  return { className, css };
}

export function generateRandomPalette(count = 5): string[] {
  const baseHue = Math.random() * 360;
  const palette: string[] = [];
  for (let i = 0; i < count; i++) {
    const h = (baseHue + i * (360 / count) + Math.random() * 40 - 20) % 360;
    const s = 60 + Math.random() * 30;
    const l = 45 + Math.random() * 25;
    palette.push(hslString(h, s, l));
  }
  return palette;
}
