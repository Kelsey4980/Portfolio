import React, { useEffect, useRef, useState } from "react";
import { Linkedin, Github, Mail, Facebook, ArrowUpRight, Menu, X } from "lucide-react";

/* ---------------------------------------------------------------
   DESIGN TOKENS
   bg #0A0A0F · ink #F6F4EF · muted #9C99A8
   palette pulled from the swirl's own hue sweep (blue → violet → magenta):
   violet #6C5CE7 · blue #3E63DD · magenta #C9459C · accent (azure) #4EA8FF
   typeface: "Lexend" for everything — display weights for headings,
   regular/medium for body and UI text.
----------------------------------------------------------------*/
const C = {
  bg: "#0A0A0F",
  bgLight: "#F0F0F5",
  panel: "#101018",
  ink: "#F6F4EF",
  muted: "#9C99A8",
  mutedSoft: "#6E6B7A",
  violet: "#6C5CE7",
  blue: "#3E63DD",
  magenta: "#C9459C",
  accent: "#4EA8FF",
  line: "rgba(246,244,239,0.12)",
};

const NAV_LINKS = [
  { id: "home", label: "Home" },
  { id: "about", label: "About" },
  { id: "work", label: "Work" },
  { id: "contact", label: "Contact" },
];

const PROJECTS = [
  {
    id: "unbound",
    name: "Unbound",
    tagline: "Case Management System",
    description:
      "A case management platform that replaces paper folders and spreadsheets with a searchable, permissioned record system for caseworkers. It is designed with an intake team at a legal-aid nonprofit.",
    tags: ["React", "Node.js", "MongoDB"],
    color: C.magenta,
    url: "https://github.com/unboundcase/cssweng-s15-group5/tree/main",
    art: "cabinet",
  },
  {
    id: "kasama",
    name: "Kasama",
    tagline: "Collaborative Household Management App",
    description:
      "Kasama is designed to help households and roommates collaborate on daily responsibilities. The app provides a dedicated space for managing shared chores and notes.",
    tags: ["Android", "Kotlin", "Firebase", "Room"],
    color: C.blue,
    url: "https://github.com/haniellejermayn/Kasama",
    art: "household",
  },
  {
    id: "wesm",
    name: "WESM Price Prediction",
    tagline: "Electricity Spot Market Forecasting",
    description:
      "A forecasting model for the Philippine Wholesale Electricity Spot Market, trained on historical demand, weather, and grid data to project next-day settlement prices.",
    tags: ["Pandas", "Scikit-Learn", "PyTorch", "TensorFlow"],
    color: C.violet,
    url: "https://github.com/haniellejermayn/wesm-price-prediction",
    art: "grid",
  },
];

const SKILLS = [
  "Python", "JavaScript", "Java", "C/C++", "Kotlin", 
  "React", "Node.js/Express.js", "SQL", "MongoDB", "Docker", "AWS"
];

/* ---------------------------------------------------------------
   Small SVG motifs — one per project, hand-drawn line art so the
   card backgrounds stay tied to the palette instead of stock photos.
----------------------------------------------------------------*/
function CardArt({ kind, color }) {
  const common = { stroke: color, strokeWidth: 1.4, fill: "none", strokeLinecap: "round", strokeLinejoin: "round" };
  if (kind === "cabinet") {
    return (
      <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
        <rect x="40" y="20" width="160" height="200" rx="6" {...common} opacity="0.5" />
        {[60, 100, 140, 180].map((y) => (
          <g key={y}>
            <rect x="52" y={y} width="136" height="30" rx="3" {...common} opacity="0.7" />
            <rect x="106" y={y + 13} width="28" height="4" rx="2" fill={color} opacity="0.8" />
          </g>
        ))}
      </svg>
    );
  }
  if (kind === "household") {
    return (
      <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
        <path d="M120 30 L200 95 V210 H40 V95 Z" {...common} opacity="0.55" />
        <rect x="105" y="150" width="30" height="60" {...common} opacity="0.7" />
        <circle cx="120" cy="30" r="7" fill={color} opacity="0.9" />
        <path d="M70 120 h100 M70 140 h60" {...common} opacity="0.5" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 240 240" style={{ width: "100%", height: "100%" }}>
      <path d="M40 200 L90 60 L110 120 L130 40 L150 140 L170 90 L210 200" {...common} opacity="0.6" />
      <circle cx="90" cy="60" r="4" fill={color} />
      <circle cx="130" cy="40" r="4" fill={color} />
      <circle cx="170" cy="90" r="4" fill={color} />
      <line x1="40" y1="200" x2="210" y2="200" {...common} opacity="0.4" />
    </svg>
  );
}

function SwirlBackground() {
  const containerRef = useRef(null);
  const mouseRef = useRef({ x: -9999, y: -9999, active: false }); // NEW

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // ---- tunables ----
    const particleCount = 480;
    const particlePropCount = 9;
    const particlePropsLength = particleCount * particlePropCount;
    const rangeY = 100;
    const baseTTL = 50;
    const rangeTTL = 150;
    const baseSpeed = 0.1;
    const rangeSpeed = 2;
    const baseRadius = 1;
    const rangeRadius = 3;
    const baseHue = 218;
    const rangeHue = 110;
    const noiseSteps = 8;
    const xOff = 0.00125;
    const yOff = 0.00125;
    const zOff = 0.0005;
    const backgroundColor = "hsla(258,45%,5%,1)";
    const TAU = Math.PI * 2;

    // NEW — mouse interaction tunables
    const mouseRadius = 180;   // how far the cursor's pull reaches
    const mouseStrength = 4.5; // how strong the swirl pull is

    const rand = (n) => Math.random() * n;
    const randRange = (n) => n - rand(2 * n);
    const lerp = (a, b, t) => a + (b - a) * t;
    const fadeInOut = (t, m) => {
      const hm = 0.5 * m;
      return Math.abs(((t + hm) % m) - hm) / hm;
    };

    // ---- seeded 3D simplex noise (standard public-domain algorithm) ----
    function mulberry32(seed) {
      let a = seed >>> 0;
      return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    }

    function createSimplex(seed) {
      const random = mulberry32(seed);
      const grad3 = [
        [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
        [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
        [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
      ];
      const p = new Uint8Array(256);
      for (let i = 0; i < 256; i++) p[i] = i;
      for (let i = 255; i > 0; i--) {
        const n = Math.floor((i + 1) * random());
        const q = p[i];
        p[i] = p[n];
        p[n] = q;
      }
      const perm = new Uint8Array(512);
      const permMod12 = new Uint8Array(512);
      for (let i = 0; i < 512; i++) {
        perm[i] = p[i & 255];
        permMod12[i] = perm[i] % 12;
      }
      const dot = (g, x, y, z) => g[0] * x + g[1] * y + g[2] * z;
      const F3 = 1 / 3;
      const G3 = 1 / 6;

      return function noise3D(xin, yin, zin) {
        const s = (xin + yin + zin) * F3;
        const i = Math.floor(xin + s);
        const j = Math.floor(yin + s);
        const k = Math.floor(zin + s);
        const t = (i + j + k) * G3;
        const X0 = i - t, Y0 = j - t, Z0 = k - t;
        const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
        let i1, j1, k1, i2, j2, k2;
        if (x0 >= y0) {
          if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
          else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
          else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
        } else {
          if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
          else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
          else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
        }
        const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
        const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
        const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
        const ii = i & 255, jj = j & 255, kk = k & 255;
        const gi0 = permMod12[ii + perm[jj + perm[kk]]];
        const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
        const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
        const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

        let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
        let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
        if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0); }
        let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
        if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1); }
        let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
        if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot(grad3[gi2], x2, y2, z2); }
        let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
        if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3); }

        return 32 * (n0 + n1 + n2 + n3);
      };
    }

    const canvasA = document.createElement("canvas");
    const canvasB = document.createElement("canvas");
    canvasB.style.position = "absolute";
    canvasB.style.inset = "0";
    canvasB.style.width = "100%";
    canvasB.style.height = "100%";
    canvasB.style.display = "block";
    container.appendChild(canvasB);

    const ctxA = canvasA.getContext("2d");
    const ctxB = canvasB.getContext("2d");

    const center = [0, 0];
    let tick = 0;
    let raf = null;
    const noise3D = createSimplex(Math.floor(rand(65536)));
    const particleProps = new Float32Array(particlePropsLength);

    function initParticle(i) {
      const x = rand(canvasA.width);
      const y = center[1] + randRange(rangeY);
      const ttl = baseTTL + rand(rangeTTL);
      const speed = baseSpeed + rand(rangeSpeed);
      const radius = baseRadius + rand(rangeRadius);
      const hue = baseHue + rand(rangeHue);
      particleProps.set([x, y, 0, 0, 0, ttl, speed, radius, hue], i);
    }

    function initParticles() {
      tick = 0;
      for (let i = 0; i < particlePropsLength; i += particlePropCount) initParticle(i);
    }

    function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
      ctxA.save();
      ctxA.lineCap = "round";
      ctxA.lineWidth = radius;
      ctxA.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
      ctxA.beginPath();
      ctxA.moveTo(x, y);
      ctxA.lineTo(x2, y2);
      ctxA.stroke();
      ctxA.closePath();
      ctxA.restore();
    }

    function checkBounds(x, y) {
      return x > canvasA.width || x < 0 || y > canvasA.height || y < 0;
    }

    // CHANGED — added mouse swirl force
    function updateParticle(i) {
      const i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i;
      const x = particleProps[i];
      const y = particleProps[i2];
      const n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
      const vx = lerp(particleProps[i3], Math.cos(n), 0.5);
      const vy = lerp(particleProps[i4], Math.sin(n), 0.5);
      const life = particleProps[i5];
      const ttl = particleProps[i6];
      const speed = particleProps[i7];

      let x2 = x + vx * speed;
      let y2 = y + vy * speed;

      // NEW — swirl around the cursor
      const mouse = mouseRef.current;
      if (mouse.active) {
        const dx = x - mouse.x;
        const dy = y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < mouseRadius * mouseRadius) {
          const dist = Math.sqrt(distSq) || 0.001;
          const falloff = 1 - dist / mouseRadius;
          const tangentX = -dy / dist;
          const tangentY = dx / dist;
          x2 += tangentX * falloff * mouseStrength;
          y2 += tangentY * falloff * mouseStrength;
        }
      }

      const radius = particleProps[i8];
      const hue = particleProps[i9];

      drawParticle(x, y, x2, y2, life, ttl, radius, hue);

      particleProps[i] = x2;
      particleProps[i2] = y2;
      particleProps[i3] = vx;
      particleProps[i4] = vy;
      particleProps[i5] = life + 1;

      if (checkBounds(x2, y2) || life > ttl) initParticle(i);
    }

    function drawParticles() {
      for (let i = 0; i < particlePropsLength; i += particlePropCount) updateParticle(i);
    }

    function renderGlow() {
      ctxB.save();
      ctxB.filter = "blur(8px) brightness(200%)";
      ctxB.globalCompositeOperation = "lighter";
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();

      ctxB.save();
      ctxB.filter = "blur(4px) brightness(200%)";
      ctxB.globalCompositeOperation = "lighter";
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
    }

    function renderToScreen() {
      ctxB.save();
      ctxB.globalCompositeOperation = "lighter";
      ctxB.drawImage(canvasA, 0, 0);
      ctxB.restore();
    }

    function resize() {
      const w = container.clientWidth;
      const h = container.clientHeight;
      canvasA.width = w;
      canvasA.height = h;
      canvasB.width = w;
      canvasB.height = h;
      center[0] = 0.5 * w;
      center[1] = 0.5 * h;
    }

    function draw() {
      tick++;
      ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
      drawParticles();
      renderGlow();
      renderToScreen();
      raf = window.requestAnimationFrame(draw);
    }

    const prefersReducedMotion =
      window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    resize();
    initParticles();
    if (prefersReducedMotion) {
      tick = 1;
      ctxB.fillStyle = backgroundColor;
      ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
      drawParticles();
      renderGlow();
      renderToScreen();
    } else {
      draw();
    }

    const ro = new ResizeObserver(() => resize());
    ro.observe(container);

    // NEW — mouse tracking (attached to window since the canvas has pointerEvents: none)
    function onMouseMove(e) {
      const rect = container.getBoundingClientRect();
      mouseRef.current.x = e.clientX - rect.left;
      mouseRef.current.y = e.clientY - rect.top;
      mouseRef.current.active = true;
    }
    function onMouseLeave() {
      mouseRef.current.active = false;
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseout", onMouseLeave);

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("mousemove", onMouseMove); // NEW
      window.removeEventListener("mouseout", onMouseLeave); // NEW
      if (canvasB.parentNode) canvasB.parentNode.removeChild(canvasB);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
    />
  );
}

/* ---------------------------------------------------------------
   Swirl — the hero's signature element. A noise-driven particle
   flow field rendered on canvas: each particle drifts along a
   simplex-noise vector field and is drawn as a short glowing
   stroke, then composited with an additive blur pass for the
   glow. Hue range is tuned to the palette (blue → violet → magenta).
----------------------------------------------------------------*/
// OLD - No Mouse Interaction
// function SwirlBackground() {
//   const containerRef = useRef(null);

//   useEffect(() => {
//     const container = containerRef.current;
//     if (!container) return;

//     // ---- tunables ----
//     const particleCount = 480;
//     const particlePropCount = 9; // x, y, vx, vy, life, ttl, speed, radius, hue
//     const particlePropsLength = particleCount * particlePropCount;
//     const rangeY = 100;
//     const baseTTL = 50;
//     const rangeTTL = 150;
//     const baseSpeed = 0.1;
//     const rangeSpeed = 2;
//     const baseRadius = 1;
//     const rangeRadius = 3;
//     const baseHue = 218; // blue
//     const rangeHue = 110; // sweeps through violet into magenta
//     const noiseSteps = 8;
//     const xOff = 0.00125;
//     const yOff = 0.00125;
//     const zOff = 0.0005;
//     const backgroundColor = "hsla(258,45%,5%,1)";
//     const TAU = Math.PI * 2;

//     const rand = (n) => Math.random() * n;
//     const randRange = (n) => n - rand(2 * n);
//     const lerp = (a, b, t) => a + (b - a) * t;
//     const fadeInOut = (t, m) => {
//       const hm = 0.5 * m;
//       return Math.abs(((t + hm) % m) - hm) / hm;
//     };

//     // ---- seeded 3D simplex noise (standard public-domain algorithm) ----
//     function mulberry32(seed) {
//       let a = seed >>> 0;
//       return function () {
//         a |= 0;
//         a = (a + 0x6d2b79f5) | 0;
//         let t = Math.imul(a ^ (a >>> 15), 1 | a);
//         t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
//         return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
//       };
//     }

//     function createSimplex(seed) {
//       const random = mulberry32(seed);
//       const grad3 = [
//         [1, 1, 0], [-1, 1, 0], [1, -1, 0], [-1, -1, 0],
//         [1, 0, 1], [-1, 0, 1], [1, 0, -1], [-1, 0, -1],
//         [0, 1, 1], [0, -1, 1], [0, 1, -1], [0, -1, -1],
//       ];
//       const p = new Uint8Array(256);
//       for (let i = 0; i < 256; i++) p[i] = i;
//       for (let i = 255; i > 0; i--) {
//         const n = Math.floor((i + 1) * random());
//         const q = p[i];
//         p[i] = p[n];
//         p[n] = q;
//       }
//       const perm = new Uint8Array(512);
//       const permMod12 = new Uint8Array(512);
//       for (let i = 0; i < 512; i++) {
//         perm[i] = p[i & 255];
//         permMod12[i] = perm[i] % 12;
//       }
//       const dot = (g, x, y, z) => g[0] * x + g[1] * y + g[2] * z;
//       const F3 = 1 / 3;
//       const G3 = 1 / 6;

//       return function noise3D(xin, yin, zin) {
//         const s = (xin + yin + zin) * F3;
//         const i = Math.floor(xin + s);
//         const j = Math.floor(yin + s);
//         const k = Math.floor(zin + s);
//         const t = (i + j + k) * G3;
//         const X0 = i - t, Y0 = j - t, Z0 = k - t;
//         const x0 = xin - X0, y0 = yin - Y0, z0 = zin - Z0;
//         let i1, j1, k1, i2, j2, k2;
//         if (x0 >= y0) {
//           if (y0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
//           else if (x0 >= z0) { i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; }
//           else { i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; }
//         } else {
//           if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; }
//           else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; }
//           else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; }
//         }
//         const x1 = x0 - i1 + G3, y1 = y0 - j1 + G3, z1 = z0 - k1 + G3;
//         const x2 = x0 - i2 + 2 * G3, y2 = y0 - j2 + 2 * G3, z2 = z0 - k2 + 2 * G3;
//         const x3 = x0 - 1 + 3 * G3, y3 = y0 - 1 + 3 * G3, z3 = z0 - 1 + 3 * G3;
//         const ii = i & 255, jj = j & 255, kk = k & 255;
//         const gi0 = permMod12[ii + perm[jj + perm[kk]]];
//         const gi1 = permMod12[ii + i1 + perm[jj + j1 + perm[kk + k1]]];
//         const gi2 = permMod12[ii + i2 + perm[jj + j2 + perm[kk + k2]]];
//         const gi3 = permMod12[ii + 1 + perm[jj + 1 + perm[kk + 1]]];

//         let n0 = 0, n1 = 0, n2 = 0, n3 = 0;
//         let t0 = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;
//         if (t0 >= 0) { t0 *= t0; n0 = t0 * t0 * dot(grad3[gi0], x0, y0, z0); }
//         let t1 = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;
//         if (t1 >= 0) { t1 *= t1; n1 = t1 * t1 * dot(grad3[gi1], x1, y1, z1); }
//         let t2 = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;
//         if (t2 >= 0) { t2 *= t2; n2 = t2 * t2 * dot(grad3[gi2], x2, y2, z2); }
//         let t3 = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;
//         if (t3 >= 0) { t3 *= t3; n3 = t3 * t3 * dot(grad3[gi3], x3, y3, z3); }

//         return 32 * (n0 + n1 + n2 + n3);
//       };
//     }

//     // ---- offscreen (a) + visible (b) canvas pair, like the reference demo ----
//     const canvasA = document.createElement("canvas");
//     const canvasB = document.createElement("canvas");
//     canvasB.style.position = "absolute";
//     canvasB.style.inset = "0";
//     canvasB.style.width = "100%";
//     canvasB.style.height = "100%";
//     canvasB.style.display = "block";
//     container.appendChild(canvasB);

//     const ctxA = canvasA.getContext("2d");
//     const ctxB = canvasB.getContext("2d");

//     const center = [0, 0];
//     let tick = 0;
//     let raf = null;
//     const noise3D = createSimplex(Math.floor(rand(65536)));
//     const particleProps = new Float32Array(particlePropsLength);

//     function initParticle(i) {
//       const x = rand(canvasA.width);
//       const y = center[1] + randRange(rangeY);
//       const ttl = baseTTL + rand(rangeTTL);
//       const speed = baseSpeed + rand(rangeSpeed);
//       const radius = baseRadius + rand(rangeRadius);
//       const hue = baseHue + rand(rangeHue);
//       particleProps.set([x, y, 0, 0, 0, ttl, speed, radius, hue], i);
//     }

//     function initParticles() {
//       tick = 0;
//       for (let i = 0; i < particlePropsLength; i += particlePropCount) initParticle(i);
//     }

//     function drawParticle(x, y, x2, y2, life, ttl, radius, hue) {
//       ctxA.save();
//       ctxA.lineCap = "round";
//       ctxA.lineWidth = radius;
//       ctxA.strokeStyle = `hsla(${hue},100%,60%,${fadeInOut(life, ttl)})`;
//       ctxA.beginPath();
//       ctxA.moveTo(x, y);
//       ctxA.lineTo(x2, y2);
//       ctxA.stroke();
//       ctxA.closePath();
//       ctxA.restore();
//     }

//     function checkBounds(x, y) {
//       return x > canvasA.width || x < 0 || y > canvasA.height || y < 0;
//     }

//     function updateParticle(i) {
//       const i2 = 1 + i, i3 = 2 + i, i4 = 3 + i, i5 = 4 + i, i6 = 5 + i, i7 = 6 + i, i8 = 7 + i, i9 = 8 + i;
//       const x = particleProps[i];
//       const y = particleProps[i2];
//       const n = noise3D(x * xOff, y * yOff, tick * zOff) * noiseSteps * TAU;
//       const vx = lerp(particleProps[i3], Math.cos(n), 0.5);
//       const vy = lerp(particleProps[i4], Math.sin(n), 0.5);
//       const life = particleProps[i5];
//       const ttl = particleProps[i6];
//       const speed = particleProps[i7];
//       const x2 = x + vx * speed;
//       const y2 = y + vy * speed;
//       const radius = particleProps[i8];
//       const hue = particleProps[i9];

//       drawParticle(x, y, x2, y2, life, ttl, radius, hue);

//       particleProps[i] = x2;
//       particleProps[i2] = y2;
//       particleProps[i3] = vx;
//       particleProps[i4] = vy;
//       particleProps[i5] = life + 1;

//       if (checkBounds(x2, y2) || life > ttl) initParticle(i);
//     }

//     function drawParticles() {
//       for (let i = 0; i < particlePropsLength; i += particlePropCount) updateParticle(i);
//     }

//     function renderGlow() {
//       ctxB.save();
//       ctxB.filter = "blur(8px) brightness(200%)";
//       ctxB.globalCompositeOperation = "lighter";
//       ctxB.drawImage(canvasA, 0, 0);
//       ctxB.restore();

//       ctxB.save();
//       ctxB.filter = "blur(4px) brightness(200%)";
//       ctxB.globalCompositeOperation = "lighter";
//       ctxB.drawImage(canvasA, 0, 0);
//       ctxB.restore();
//     }

//     function renderToScreen() {
//       ctxB.save();
//       ctxB.globalCompositeOperation = "lighter";
//       ctxB.drawImage(canvasA, 0, 0);
//       ctxB.restore();
//     }

//     function resize() {
//       const w = container.clientWidth;
//       const h = container.clientHeight;
//       canvasA.width = w;
//       canvasA.height = h;
//       canvasB.width = w;
//       canvasB.height = h;
//       center[0] = 0.5 * w;
//       center[1] = 0.5 * h;
//     }

//     function draw() {
//       tick++;
//       ctxA.clearRect(0, 0, canvasA.width, canvasA.height);
//       ctxB.fillStyle = backgroundColor;
//       ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
//       drawParticles();
//       renderGlow();
//       renderToScreen();
//       raf = window.requestAnimationFrame(draw);
//     }

//     const prefersReducedMotion =
//       window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

//     resize();
//     initParticles();
//     if (prefersReducedMotion) {
//       // Single static frame — no continuous animation loop.
//       tick = 1;
//       ctxB.fillStyle = backgroundColor;
//       ctxB.fillRect(0, 0, canvasB.width, canvasB.height);
//       drawParticles();
//       renderGlow();
//       renderToScreen();
//     } else {
//       draw();
//     }

//     const ro = new ResizeObserver(() => resize());
//     ro.observe(container);

//     return () => {
//       window.cancelAnimationFrame(raf);
//       ro.disconnect();
//       if (canvasB.parentNode) canvasB.parentNode.removeChild(canvasB);
//     };
//   }, []);

//   return (
//     <div
//       ref={containerRef}
//       style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
//     />
//   );
// }

function useReveal() {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return [ref, visible];
}

function ProjectCard({ project, index }) {
  const [ref, visible] = useReveal();
  const [hover, setHover] = useState(false);

  return (
    <a 
    href={project.url} target="_blank" 
    rel="noopener noreferrer"
    style={{
        textDecoration: "none",
        color: "inherit",
    }}>
        <div
        ref={ref}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
            position: "relative",
            borderRadius: 4,
            overflow: "hidden",
            border: `1px solid ${hover ? project.color : C.line}`,
            // borderTop: `3px solid ${hover ? project.color : C.line}`,
            background: C.panel,
            cursor: "default",
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0px)" : "translateY(28px)",
            transition: `opacity 0.7s ease ${index * 0.08}s, transform 0.7s ease ${index * 0.08}s, border-color 0.3s ease`,
        }}
        className="w-full"
        >
        <div
            style={{
            position: "relative",
            height: 280,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            }}
        >
            <div
            style={{
                position: "absolute",
                inset: 0,
                opacity: hover ? 0.9 : 0.65,
                transform: hover ? "scale(1.08)" : "scale(1)",
                transition: "opacity 0.5s ease, transform 0.6s ease",
            }}
            >
            <CardArt kind={project.art} color={project.color} />
            </div>
            <div
            style={{
                position: "absolute",
                inset: 0,
                background: `linear-gradient(to bottom, transparent, ${C.panel})`,
            }}
            />
        </div>

        <div style={{ padding: "28px 28px 30px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            {/* <span style={{ width: 9, height: 9, borderRadius: 9999, background: project.color, display: "inline-block" }} /> */}
            <h3
                style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: "1.7rem",
                color: C.ink,
                margin: 0,
                }}
            >
                {project.name}
            </h3>
            <ArrowUpRight
                size={20}
                color={project.color}
                style={{
                marginLeft: "auto",
                opacity: hover ? 1 : 0,
                transform: hover ? "translate(0,0)" : "translate(-4px,4px)",
                transition: "opacity 0.3s ease, transform 0.3s ease",
                }}
            />
            </div>
            <p style={{ color: C.muted, fontFamily: "'Lexend', sans-serif", fontSize: "1rem", margin: "0 0 16px" }}>
            {project.tagline}
            </p>
            <p
            style={{
                color: C.mutedSoft,
                fontFamily: "'Lexend', sans-serif",
                fontSize: "0.92rem",
                lineHeight: 1.6,
                margin: "0 0 18px",
                maxWidth: 560,
            }}
            >
            {project.description}
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
            {project.tags.map((t) => (
                <span
                key={t}
                style={{
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    color: C.ink,
                    border: `1px solid ${C.line}`,
                    borderRadius: 6,
                    padding: "5px 12px",
                    background: hover ? `${project.color}1A` : "transparent",
                    transition: "background 0.3s ease",
                }}
                >
                {t}
                </span>
            ))}
            </div>
        </div>
        </div>
    </a>
  );
}

function SocialIcon({ Icon, href, label, orientation = "vertical" }) {
  const [hover, setHover] = useState(false);
  return (
    <a
      href={href}
      aria-label={label}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        color: hover ? C.magenta : C.muted,
        transition: "color 0.25s ease, transform 0.25s ease",
        transform: hover ? (orientation === "vertical" ? "translateX(-3px)" : "translateY(-3px)") : "none",
        display: "inline-flex",
      }}
    >
      <Icon size={40} strokeWidth={1.7} />
    </a>
  );
}

function NavLink({ label, active, onClick }) {
  const [hover, setHover] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: "none",
        border: "none",
        cursor: "pointer",
        fontFamily: "'Lexend', sans-serif",
        fontSize: "0.85rem",
        fontWeight: 600,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        color: active || hover ? C.magenta : C.muted,
        position: "relative",
        padding: "6px 2px",
        transition: "color 0.25s ease",
      }}
    >
      {label}
      <span
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 2,
          borderRadius: 2,
          background: C.bg,
          transform: hover || active ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
          transition: "transform 0.25s ease",
        }}
      />
    </button>
  );
}

export default function Portfolio() {
  const [active, setActive] = useState("home");
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolledPastHero, setScrolledPastHero] = useState(false);
  const [resumeHover, setResumeHover] = useState(false);
  const HEADER_HEIGHT = 76;
  const heroRef = useRef(null);
  const sectionRefs = {
    home: useRef(null),
    about: useRef(null),
    work: useRef(null),
    contact: useRef(null),
  };

  useEffect(() => {
    const heroEl = heroRef.current;
    if (!heroEl) return;
    const onScroll = () => {
      const rect = heroEl.getBoundingClientRect();
      setScrolledPastHero(rect.bottom <= HEADER_HEIGHT);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTo = (id) => {
    setMenuOpen(false);
    setActive(id);
    sectionRefs[id]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const [aboutRef, aboutVisible] = useReveal();
  const [contactRef, contactVisible] = useReveal();
  const [taglineRef, taglineVisible] = useReveal();

  return (
    <div style={{ background: C.bg, minHeight: "100%", fontFamily: "'Lexend', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Lexend:wght@300;400;500;600;700;800&display=swap');

        * { box-sizing: border-box; }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-in-up { animation: fadeUp 0.8s ease both; }

        a:focus-visible, button:focus-visible {
          outline: 2px solid ${C.accent};
          outline-offset: 3px;
          border-radius: 4px;
        }

        @media (prefers-reduced-motion: reduce) {
          * { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; transition-duration: 0.01ms !important; }
        }
      `}</style>

      {/* ---------------- NAV ---------------- */}
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          background: scrolledPastHero || menuOpen ? "rgba(10,10,15,0.85)" : "transparent",
          backdropFilter: scrolledPastHero || menuOpen ? "blur(10px)" : "none",
          borderBottom: `1px solid ${scrolledPastHero || menuOpen ? C.line : "transparent"}`,
          transition: "background-color 0.35s ease, border-color 0.35s ease",
        }}
      >
        <div
          style={{
            width: "100%",
            padding: "18px clamp(40px, 5vw, 80px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <button
            onClick={() => scrollTo("home")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 800,
              fontSize: "1.05rem",
              letterSpacing: "0.12em",
              color: C.ink,
            }}
          >
            KELSEY
          </button>

          <nav style={{ display: "flex", gap: 36 }} className="hidden md:flex">
            {NAV_LINKS.map((l) => (
              <NavLink key={l.id} label={l.label} active={active === l.id} onClick={() => scrollTo(l.id)} />
            ))}
          </nav>

          {/* <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden"
            aria-label="Toggle menu"
            style={{ background: "none", border: "none", color: C.ink, cursor: "pointer" }}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button> */}
        </div>

        {/* {menuOpen && (
          <div
            className="md:hidden"
            style={{
              borderTop: `1px solid ${C.line}`,
              display: "flex",
              flexDirection: "column",
              padding: "8px clamp(40px, 5vw, 80px) 18px",
              gap: 14,
            }}
          >
            {NAV_LINKS.map((l) => (
              <NavLink key={l.id} label={l.label} active={active === l.id} onClick={() => scrollTo(l.id)} />
            ))}
          </div>
        )} */}
      </header>

      {/* ---------------- HERO ---------------- */}
      <section
        ref={(el) => {
          sectionRefs.home.current = el;
          heroRef.current = el;
        }}
        style={{
          position: "relative",
          overflow: "hidden",
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          padding: "110px 0 90px",
        }}
      >
        <SwirlBackground />
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 220,
            background: `linear-gradient(to bottom, transparent, ${C.bg})`,
            pointerEvents: "none",
            zIndex: 1,
          }}
        />
        <div
          style={{
            position: "relative",
            zIndex: 2,
            width: "100%",
            padding: "0 clamp(40px, 5vw, 80px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div className="fade-in-up">
            <h1
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(2.6rem, 6vw, 4.2rem)",
                color: C.ink,
                margin: 0,
                lineHeight: 1.05,
              }}
            >
              Gabrielle Kelsey
            </h1>
            <p
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: "1.15rem",
                color: C.muted,
                marginTop: 14,
              }}
            >
              Software Developer
            </p>
            <a
            onMouseEnter={() => setResumeHover(true)}
            onMouseLeave={() => setResumeHover(false)}
            href="/CV_KELSEY_GABRIELLEMADISON.pdf"
            download="Gabrielle-Kelsey-Resume.pdf"
            style={{
                display: "inline-block",
                textDecoration: "none",
                fontFamily: "'Lexend', sans-serif",
                fontSize: "0.78rem",
                fontWeight: 600,
                marginTop: 24,
                letterSpacing: "0.02em",
                color: C.ink,
                border: `1px solid ${C.line}`,
                borderRadius: 6,
                padding: "5px 12px",
                background: resumeHover ? `${C.magenta}CA` : `${C.bg}CA`,
                transition: "background 0.3s ease",
              }}
            >
              Download My Resume
            </a>
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 18,
            }}
            className="hidden sm:flex"
          >
            <SocialIcon Icon={Linkedin} href="https://www.linkedin.com/in/gabrielle-kelsey-88796431b/" label="LinkedIn" />
            <SocialIcon Icon={Github} href="https://github.com/Kelsey4980" label="GitHub" />
            <SocialIcon Icon={Mail} href="https://mail.google.com/mail/?view=cm&fs=1&to=gabriellemkelsey@gmail.com" label="Email" />
            <SocialIcon Icon={Facebook} href="https://www.facebook.com/Kelsey.gabrielle.90" label="Facebook" />
          </div>
        </div>
      </section>

      {/* ---------------- TAGLINE BAND ---------------- */}
      {/* <section
        style={{
          position: "relative",
          background: C.bg,
          padding: "70px clamp(40px, 5vw, 80px)",
          textAlign: "center",
          overflow: "hidden",
        }}
      >
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: 0,
            height: 140,
            background: "linear-gradient(to top, #FFFFFF08, transparent)",
            pointerEvents: "none",
          }}
        />
        <p
          ref={taglineRef}
          style={{
            position: "relative",
            fontFamily: "'Lexend', sans-serif",
            fontWeight: 700,
            fontSize: "clamp(1.5rem, 3.4vw, 2.1rem)",
            color: C.ink,
            margin: 0,
            lineHeight: 1.4,
            opacity: taglineVisible ? 1 : 0,
            transform: taglineVisible ? "translateY(0)" : "translateY(16px)",
            transition: "opacity 0.9s ease, transform 0.9s ease",
          }}
        >
          Where curiosity
          <br />
          becomes creation
        </p>
      </section> */}

      {/* ---------------- ABOUT ---------------- */}
      <section
        ref={(el) => {
          sectionRefs.about.current = el;
          aboutRef.current = el;
        }}
        style={{ padding: "100px clamp(40px, 5vw, 80px)", background: "FFFFFF08", scrollMarginTop: HEADER_HEIGHT }}
      >
        <div
          style={{
            width: "100%",
            display: "grid",
            gridTemplateColumns: "1fr",
            gap: 40,
            opacity: aboutVisible ? 1 : 0,
            transform: aboutVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
          className="md:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]"
        >
          <div>
            {/* <span
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              About
            </span> */}
            <h2
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.7rem, 3.6vw, 2.2rem)",
                color: C.ink,
                margin: "10px 0 0",
              }}
            >
              Hi, I'm Gabrielle
            </h2>
            <h2
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.7rem, 3.6vw, 2.2rem)",
                color: C.ink,
                margin: "10px 0 0",
              }}
            >
              I <span style={{ 
                    color: C.bg,
                    // WebkitTextStroke: `0.5px ${C.ink}`,
                    textShadow: `-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff`,
                }}>
                    build
                </span>,{' '}
                <span style={{ 
                    color: C.bg,
                    textShadow: `-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff`,
                }}>
                    design
                </span>, &{' '}
                <span style={{ 
                    color: C.bg,
                    textShadow: `-1px -1px 0 #fff, 1px -1px 0 #fff, -1px 1px 0 #fff, 1px 1px 0 #fff`,
                }}>
                    solve problems
                </span>.
            </h2>
          </div>

          <div>
            <p style={{ color: C.muted, fontSize: "1.05rem", lineHeight: 1.75, margin: "0 0 18px" }}>
              I’m a software developer based in Antipolo, Philippines with experience in delivering 
              end-to-end applications. I’m always looking for opportunities where I can keep learning 
              and contribute to meaningful projects.
            </p>
            <p style={{ color: C.mutedSoft, fontSize: "1rem", lineHeight: 1.75, margin: "0 0 28px" }}>
              My current point of interest lies in my thesis, where I'm building a 3D facial reconstruction 
              pipeline to generate synthetic datasets aimed at improving the performance of 
              lip-reading (visual speech recognition) models.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {SKILLS.map((s) => (
                <span
                  key={s}
                  style={{
                    fontFamily: "'Lexend', sans-serif",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    color: C.ink,
                    border: `1px solid ${C.line}`,
                    borderRadius: 6,
                    padding: "6px 14px",
                  }}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---------------- WORK ---------------- */}
      <section
        ref={sectionRefs.work}
        style={{
          background: `linear-gradient(180deg, ${C.bg} 0%, #FFFFFF08 200px, #FFFFFF08 100%)`,
          padding: "90px clamp(40px, 5vw, 80px)",
          scrollMarginTop: HEADER_HEIGHT,
        }}
      >
        <div style={{ width: "100%" }}>
          <div style={{ marginBottom: 44 }}>
            {/* <span
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontSize: "0.8rem",
                fontWeight: 600,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                color: C.accent,
              }}
            >
              Selected Work
            </span> */}
            <h2
              style={{
                fontFamily: "'Lexend', sans-serif",
                fontWeight: 700,
                fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
                color: C.ink,
                margin: "10px 0 0",
              }}
            >
              Projects I've Worked On
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
            {PROJECTS.map((p, i) => (
              <ProjectCard key={p.id} project={p} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------- CONTACT ---------------- */}
      <section
        ref={(el) => {
          sectionRefs.contact.current = el;
          contactRef.current = el;
        }}
        style={{
          background: C.panel,
          borderTop: `1px solid ${C.line}`,
          padding: "100px clamp(40px, 5vw, 80px)",
          textAlign: "center",
          scrollMarginTop: HEADER_HEIGHT,
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            opacity: contactVisible ? 1 : 0,
            transform: contactVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.7s ease, transform 0.7s ease",
          }}
        >
          {/* <span
            style={{
              fontFamily: "'Lexend', sans-serif",
              fontSize: "0.8rem",
              fontWeight: 600,
              letterSpacing: "0.18em",
              textTransform: "uppercase",
              color: C.accent,
            }}
          >
            Contact
          </span> */}
          <h2
            style={{
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 700,
              fontSize: "clamp(1.8rem, 4vw, 2.4rem)",
              color: C.ink,
              margin: "10px 0 16px",
            }}
          >
            Let's build something.
          </h2>
          <p style={{ color: C.muted, fontSize: "1.02rem", lineHeight: 1.7, margin: "0 0 30px" }}>
            Have a project in mind, or just want to talk? My inbox is open!
          </p>

          <a
            href="https://mail.google.com/mail/?view=cm&fs=1&to=gabriellemkelsey@gmail.com"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              fontFamily: "'Lexend', sans-serif",
              fontWeight: 700,
              fontSize: "0.95rem",
              color: C.bg,
              background: C.magenta,
              borderRadius: 8,
              padding: "14px 26px",
              textDecoration: "none",
              transition: "transform 0.25s ease, box-shadow 0.25s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = `
                0 0 0 6px ${C.bg},
                0 0 0 7px ${C.magenta},
                0 10px 24px ${C.bg}44
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.border = "1px solid transparent";
            }}
          >
            hello@gabriellemkelsey@gmail.com
            <ArrowUpRight size={18} />
          </a>

          <div style={{ display: "flex", justifyContent: "center", gap: 26, marginTop: 44 }}>
            <SocialIcon Icon={Linkedin} href="https://www.linkedin.com/in/gabrielle-kelsey-88796431b/" label="LinkedIn" orientation="horizontal" />
            <SocialIcon Icon={Github} href="https://github.com/Kelsey4980" label="GitHub" orientation="horizontal" />
            <SocialIcon Icon={Mail} href="https://mail.google.com/mail/?view=cm&fs=1&to=gabriellemkelsey@gmail.com" label="Email" orientation="horizontal" />
            <SocialIcon Icon={Facebook} href="https://www.facebook.com/Kelsey.gabrielle.90" label="Facebook" orientation="horizontal" />
          </div>
        </div>
      </section>

      {/* ---------------- FOOTER ---------------- */}
      <footer
        style={{
          background: C.bg,
          borderTop: `1px solid ${C.line}`,
          padding: "26px clamp(40px, 5vw, 80px)",
          textAlign: "center",
        }}
      >
        <p style={{ color: C.mutedSoft, fontSize: "0.82rem", margin: 0, fontFamily: "'Lexend', sans-serif" }}>
          © {new Date().getFullYear()} Gabrielle Kelsey. Built with curiosity.
        </p>
      </footer>
    </div>
  );
}
