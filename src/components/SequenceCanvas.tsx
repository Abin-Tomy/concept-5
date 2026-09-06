'use client';

/**
 * SequenceCanvas.tsx
 * Frame-by-frame video sequence driven by GSAP ScrollTrigger + Lenis.
 *
 * Smooth approach:
 *  - The actual frame index is lerp'd every rAF tick so transitions
 *    between frames feel cinematic instead of stepping.
 *  - Canvas resize only happens when dimensions change.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface SequenceCanvasProps {
  frameCount:      number;
  framesPath:      string;
  ext?:            string;
  scrollTriggerEl: string;
  scrollStart?:    string;
  scrollEnd?:      string;
  className?:      string;
}

export default function SequenceCanvas({
  frameCount = 150,
  framesPath,
  ext            = 'jpg',
  scrollTriggerEl,
  scrollStart    = 'top top',
  scrollEnd      = '+=4500',
  className,
}: SequenceCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const images    = useRef<HTMLImageElement[]>([]);

  const targetFrame  = useRef(0);
  const currentFrame = useRef(0);
  const rafId        = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const totalFrames = frameCount;
    const size = { w: 0, h: 0 };

    /* ── Draw a specific (integer) frame ─── */
    const drawFrame = (index: number) => {
      const img = images.current[index];
      if (!img?.complete) return;

      const dpr = window.devicePixelRatio || 1;
      const w   = canvas.clientWidth;
      const h   = canvas.clientHeight;

      if (w !== size.w || h !== size.h) {
        canvas.width  = w * dpr;
        canvas.height = h * dpr;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        size.w = w;
        size.h = h;
      }

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, w, h);

      // Cover-fill centered
      const imgAspect    = img.naturalWidth / img.naturalHeight;
      const canvasAspect = w / h;
      let drawW: number, drawH: number, drawX: number, drawY: number;

      if (imgAspect > canvasAspect) {
        drawH = h; drawW = h * imgAspect;
        drawX = (w - drawW) / 2; drawY = 0;
      } else {
        drawW = w; drawH = w / imgAspect;
        drawX = 0; drawY = (h - drawH) / 2;
      }

      ctx.drawImage(img, drawX, drawY, drawW, drawH);
    };

    /* ── rAF loop: lerp currentFrame → targetFrame ─ */
    const LERP = 0.10;

    const tick = () => {
      const diff = targetFrame.current - currentFrame.current;
      if (Math.abs(diff) > 0.01) {
        currentFrame.current += diff * LERP;
        const idx = Math.min(totalFrames - 1, Math.max(0, Math.round(currentFrame.current)));
        drawFrame(idx);
      }
      rafId.current = requestAnimationFrame(tick);
    };

    rafId.current = requestAnimationFrame(tick);

    /* ── Pre-load frames ───────────────────────── */
    for (let i = 1; i <= totalFrames; i++) {
      const num = String(i).padStart(4, '0');
      const img = new Image();
      img.src      = `${framesPath}/frame_${num}.${ext}`;
      img.decoding = 'async';
      img.onload   = () => { if (i === 1) drawFrame(0); };
      images.current[i - 1] = img;
    }

    /* ── ScrollTrigger: update targetFrame on scroll ── */
    const st = ScrollTrigger.create({
      trigger:  scrollTriggerEl,
      start:    scrollStart,
      end:      scrollEnd,
      onUpdate: (self) => {
        targetFrame.current = self.progress * (totalFrames - 1);
      },
    });

    /* ── Resize observer ───────────────────────── */
    const ro = new ResizeObserver(() => {
      size.w = 0; size.h = 0;
      drawFrame(Math.round(currentFrame.current));
    });
    ro.observe(canvas);

    return () => {
      cancelAnimationFrame(rafId.current);
      st.kill();
      ro.disconnect();
      images.current = [];
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [frameCount, framesPath, ext, scrollTriggerEl, scrollStart, scrollEnd]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      style={{
        display:    'block',
        width:      '100%',
        height:     '100%',
        willChange: 'contents',
      }}
    />
  );
}
