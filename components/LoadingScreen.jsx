import { useEffect, useMemo, useRef, useState } from "react";
import "./LoadingScreen.css";

const LINE_TOP = "Aevine";
const LINE_BOTTOM = ".design";
const LOGO = `${LINE_TOP}${LINE_BOTTOM}`;
const STAGE1_MS = 2000;
const LETTER_DELAY_S = 0.12;
const LETTER_BOUNCE_S = 0.7;
const EXIT_MS = 700;

/**
 * Minimalist premium loading screen for Aevine.design.
 * Logo stacks as:
 *   Aevine
 *   .design
 * Pixel stage samples live glyph boxes so bounce stays on the same Y axis.
 *
 * When `loadProgress` is provided (0–100), the bar tracks real asset loading.
 * Bounce/exit wait until `canFinish` is true (default: true).
 */
export default function LoadingScreen({
  lineTop = LINE_TOP,
  lineBottom = LINE_BOTTOM,
  onComplete,
  duration = STAGE1_MS,
  loadProgress,
  canFinish = true,
}) {
  const canvasRef = useRef(null);
  const logoRef = useRef(null);
  const wrapRef = useRef(null);
  const [animProgress, setAnimProgress] = useState(0);
  const [phase, setPhase] = useState("pixel");
  const [exiting, setExiting] = useState(false);
  const [pixelDone, setPixelDone] = useState(false);

  const lines = useMemo(
    () => [
      { text: lineTop, offset: 0 },
      { text: lineBottom, offset: lineTop.length },
    ],
    [lineTop, lineBottom]
  );

  const letterCount = lineTop.length + lineBottom.length;

  const useExternalProgress = typeof loadProgress === "number";
  const progress = useExternalProgress
    ? Math.max(0, Math.min(100, Math.round(loadProgress)))
    : animProgress;

  useEffect(() => {
    document.documentElement.classList.add("is-loading");
    return () => {
      document.documentElement.classList.remove("is-loading");
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const logoEl = logoRef.current;
    if (!canvas || !logoEl) return undefined;

    const ctx = canvas.getContext("2d", { alpha: true });
    let raf = 0;
    let start = 0;
    let particles = [];
    let disposed = false;

    const buildParticles = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const logoStyle = getComputedStyle(logoEl);
      const fontFamily = logoStyle.fontFamily || "Syne, sans-serif";
      const fontWeight = logoStyle.fontWeight || "800";
      const fontSize = parseFloat(logoStyle.fontSize) || 48;

      const logoRect = logoEl.getBoundingClientRect();
      const cssW = Math.max(1, Math.ceil(logoRect.width));
      const cssH = Math.max(1, Math.ceil(logoRect.height));

      canvas.width = Math.floor(cssW * dpr);
      canvas.height = Math.floor(cssH * dpr);
      canvas.style.width = `${cssW}px`;
      canvas.style.height = `${cssH}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#000";
      ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
      ctx.textBaseline = "middle";
      ctx.textAlign = "left";

      logoEl.querySelectorAll(".aevine-loader__char").forEach((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left - logoRect.left;
        const y = r.top - logoRect.top + r.height / 2;
        const ch = el.textContent || "";
        if (!ch) return;
        ctx.fillText(ch, x, y);
      });

      const sample = Math.max(2, Math.round(fontSize / 28));
      const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = image.data;
      const list = [];
      const maxX = Math.max(cssW, 1);

      for (let py = 0; py < canvas.height; py += sample * dpr) {
        for (let px = 0; px < canvas.width; px += sample * dpr) {
          const i = (Math.floor(py) * canvas.width + Math.floor(px)) * 4;
          if (data[i + 3] > 28) {
            list.push({
              x: px / dpr,
              y: py / dpr,
              size: sample,
              threshold: px / dpr / maxX,
              jitter: Math.random() * 0.08,
            });
          }
        }
      }

      particles = list;
      ctx.clearRect(0, 0, cssW, cssH);
    };

    const draw = (now) => {
      if (disposed) return;
      if (!start) start = now;
      const elapsed = now - start;
      const t = Math.min(1, elapsed / duration);

      if (!useExternalProgress) {
        setAnimProgress(Math.round(t * 100));
      }

      const cssW = canvas.clientWidth;
      const cssH = canvas.clientHeight;
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#000";

      for (const p of particles) {
        const local = (t - (p.threshold * 0.85 + p.jitter)) / 0.18;
        const alpha = Math.min(1, Math.max(0, local));
        if (alpha <= 0) continue;
        ctx.globalAlpha = alpha;
        ctx.fillRect(p.x, p.y, p.size * 0.92, p.size * 0.92);
      }
      ctx.globalAlpha = 1;

      if (t < 1) {
        raf = requestAnimationFrame(draw);
      } else {
        if (!useExternalProgress) setAnimProgress(100);
        setPixelDone(true);
      }
    };

    const boot = async () => {
      try {
        if (document.fonts?.ready) await document.fonts.ready;
      } catch {
        /* ignore */
      }
      if (disposed) return;
      buildParticles();
      raf = requestAnimationFrame(draw);
    };

    boot();

    return () => {
      disposed = true;
      cancelAnimationFrame(raf);
    };
  }, [lineTop, lineBottom, duration, useExternalProgress]);

  // Hold on pixel stage until assets are ready, then bounce.
  useEffect(() => {
    if (phase !== "pixel" || !pixelDone || !canFinish) return;
    setPhase("bounce");
  }, [phase, pixelDone, canFinish]);

  useEffect(() => {
    if (phase !== "bounce") return undefined;

    const bounceTotalMs =
      (Math.max(letterCount - 1, 0) * LETTER_DELAY_S + LETTER_BOUNCE_S) * 1000;
    const t1 = window.setTimeout(() => {
      setExiting(true);
      setPhase("exit");
    }, bounceTotalMs + 180);

    return () => window.clearTimeout(t1);
  }, [phase, letterCount]);

  useEffect(() => {
    if (phase !== "exit") return undefined;
    const t = window.setTimeout(() => {
      setPhase("done");
      document.documentElement.classList.remove("is-loading");
      document.documentElement.classList.add("is-ready");
      onComplete?.();
    }, EXIT_MS);
    return () => window.clearTimeout(t);
  }, [phase, onComplete]);

  if (phase === "done") return null;

  return (
    <div
      ref={wrapRef}
      className={`aevine-loader${exiting ? " is-exiting" : ""}`}
      role="status"
      aria-live="polite"
      aria-label={`Loading ${progress}%`}
    >
      <div className="aevine-loader__inner">
        <div className="aevine-loader__logo-slot">
          <p
            ref={logoRef}
            className={`aevine-loader__logo${phase !== "pixel" ? " is-active" : ""}${
              phase === "bounce" ? " is-bouncing" : ""
            }`}
            aria-hidden={phase === "pixel"}
          >
            {lines.map((line) => (
              <span className="aevine-loader__line" key={line.text}>
                {Array.from(line.text).map((ch, i) => (
                  <span
                    key={`${line.text}-${i}`}
                    className="aevine-loader__char"
                    style={{
                      animationDelay:
                        phase === "bounce" || phase === "exit"
                          ? `${(line.offset + i) * LETTER_DELAY_S}s`
                          : undefined,
                    }}
                  >
                    {ch === " " ? "\u00A0" : ch}
                  </span>
                ))}
              </span>
            ))}
          </p>
          <canvas
            ref={canvasRef}
            className={`aevine-loader__canvas${phase === "pixel" ? " is-active" : ""}`}
            aria-hidden="true"
          />
        </div>

        <div className="aevine-loader__progress-block">
          <div className="aevine-loader__meta">
            <span>{progress}%</span>
            <span>100%</span>
          </div>
          <div className="aevine-loader__track" aria-hidden="true">
            <div
              className="aevine-loader__fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export { LOGO, LINE_TOP, LINE_BOTTOM, STAGE1_MS, LETTER_DELAY_S, LETTER_BOUNCE_S };
