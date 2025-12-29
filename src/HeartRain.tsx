// src/components/HeartRain.tsx
"use client";

import React, { useEffect, useMemo, useRef } from "react";

type Props = {
  count?: number; // number of hearts on screen
  minSize?: number;
  maxSize?: number;
  speed?: number; // base falling speed
  wind?: number; // horizontal drift
  className?: string;
};

type Heart = {
  x: number;
  y: number;
  size: number;
  vy: number;
  vx: number;
  rot: number;
  vr: number;
  alpha: number;
};

function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}

export default function HeartRain({
  count = 55,
  minSize = 10,
  maxSize = 22,
  speed = 0.9,
  wind = 0.15,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const heartsRef = useRef<Heart[]>([]);
  const dpr = useMemo(() => Math.min(2, typeof window !== "undefined" ? window.devicePixelRatio || 1 : 1), []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    if (!ctx) return;

    let w = 0;
    let h = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      const rect = parent ? parent.getBoundingClientRect() : canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));

      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const spawn = (yStart: number): Heart => {
      const size = rand(minSize, maxSize);
      return {
        x: rand(-20, w + 20),
        y: yStart,
        size,
        vy: rand(0.6, 1.6) * speed,
        vx: rand(-0.4, 0.4) + wind,
        rot: rand(-0.8, 0.8),
        vr: rand(-0.01, 0.01),
        alpha: rand(0.55, 0.95),
      };
    };

    const init = () => {
      heartsRef.current = Array.from({ length: count }, () => spawn(rand(-h, 0)));
    };

    const drawHeart = (cx: number, cy: number, s: number) => {
      // simple heart path using bezier curves (fast)
      ctx.beginPath();
      const top = s * 0.3;
      ctx.moveTo(cx, cy + top);
      ctx.bezierCurveTo(cx + s, cy - s * 0.2, cx + s, cy + s * 0.9, cx, cy + s);
      ctx.bezierCurveTo(cx - s, cy + s * 0.9, cx - s, cy - s * 0.2, cx, cy + top);
      ctx.closePath();
      ctx.fill();
    };

    const render = () => {
      ctx.clearRect(0, 0, w, h);

      // draw
      for (const p of heartsRef.current) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);

        // gradient-ish feel without heavy gradients
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = "#ff4fb3";

        drawHeart(0, 0, p.size);

        ctx.restore();

        // update
        p.y += p.vy;
        p.x += p.vx;
        p.rot += p.vr;

        // recycle if out of bounds
        if (p.y > h + 30 || p.x < -60 || p.x > w + 60) {
          const np = spawn(rand(-80, -20));
          p.x = np.x;
          p.y = np.y;
          p.size = np.size;
          p.vy = np.vy;
          p.vx = np.vx;
          p.rot = np.rot;
          p.vr = np.vr;
          p.alpha = np.alpha;
        }
      }

      rafRef.current = requestAnimationFrame(render);
    };

    resize();
    init();
    rafRef.current = requestAnimationFrame(render);

    const ro = new ResizeObserver(() => resize());
    ro.observe(canvas.parentElement || canvas);

    const onVis = () => {
      // pause when tab hidden (huge perf win)
      if (document.visibilityState !== "visible") {
        if (rafRef.current) cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      } else if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      ro.disconnect();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [count, minSize, maxSize, speed, wind, dpr]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
      aria-hidden="true"
    />
  );
}
