'use client';

/**
 * Hero.tsx — Concept 5
 *
 * Two-phase hero:
 *   Phase 1 — "intro":  Autoplay <video> (muted, playsInline) runs at normal
 *                        speed for INTRO_DURATION_MS or until the user scrolls.
 *   Phase 2 — "scrub":  Canvas frame-sequence driven by GSAP ScrollTrigger
 *                        (scrub: true) pinned for the Hero scroll range.
 *
 * Transition: 250 ms opacity crossfade (video→canvas).
 * Cards are re-wired to scroll progress instead of the old time-based timeline.
 *
 * Cards OUTSIDE heroInner so backdrop-filter composites against the canvas.
 */

import { useEffect, useRef, useCallback } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import Navigation from './Navigation';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

/* ─── Constants ──────────────────────────────────────────────────────────── */

/** The intro video (latest-concept-5.mp4) plays from 0 → ~5 s. */
const VIDEO_DURATION_S = 20.761;   // full clip duration (from ffprobe)
const SCRUB_START_S    = 5;        // hand-off: video stops, canvas begins
const SCRUB_DUR_S      = VIDEO_DURATION_S - SCRUB_START_S; // 15.761 s

/** Total scroll height pinned for the hero (px). */
const HERO_SCROLL_PX = 4500;

const TOTAL_FRAMES = 300;
const FRAMES_PATH  = '/frames';
const FRAME_EXT    = 'jpg';
const BATCH_SIZE   = 30;

/* ─── Slide data ─────────────────────────────────────────────────────────── */

const slides = [
  {
    id:       '01',
    line1:    'LED',
    line2:    'SCREEN.',
    subtitle: 'LS-01',
    desc:     'Ultra-high definition indoor and outdoor LED video walls with seamless modular panels, high refresh rates, and turnkey installation.',
    showFrom:  0.05,
    showUntil: 0.18,
  },
  {
    id:       '02',
    line1:    'FLOOR',
    line2:    'SIGNAGE.',
    subtitle: 'FS-02',
    desc:     'Commercial-grade digital floor stand displays with ultra-slim profiles, high brightness, and centralized content scheduling.',
    showFrom:  0.18,
    showUntil: 0.38,
  },
  {
    id:       '03',
    line1:    'INTERACTIVE',
    line2:    'KIOSK.',
    subtitle: 'IK-03',
    desc:     'Touchscreen kiosks and self-ordering terminals engineered for intuitive customer self-service, wayfinding, and engagement.',
    showFrom:  0.40,
    showUntil: 0.58,
  },
  {
    id:       '04',
    line1:    'POS',
    line2:    'SYSTEM.',
    subtitle: 'PS-04',
    desc:     'All-in-one smart retail point-of-sale systems with barcode scanners, thermal receipt printers, ERP integration, and queue management.',
    showFrom:  0.58,
    showUntil: 0.80,
  },
  {
    id:       '05',
    line1:    'SMART',
    line2:    'LOCK.',
    subtitle: 'SL-05',
    desc:     'Advanced biometric and digital smart locks featuring keyless security, remote access control, and seamless smart automation.',
    showFrom:  0.80,
    showUntil: 1.00,
  },
];

/* ─── Component ──────────────────────────────────────────────────────────── */

export default function Hero() {
  /* DOM refs */
  const sectionRef       = useRef<HTMLElement>(null);
  const videoRef         = useRef<HTMLVideoElement>(null);
  const canvasRef        = useRef<HTMLCanvasElement>(null);
  const overlayRef       = useRef<HTMLDivElement>(null);   // loading overlay
  const cardRefs         = useRef<(HTMLDivElement | null)[]>([]);
  const leftContainerRef = useRef<HTMLDivElement>(null);
  const leftTextRefs     = useRef<(HTMLDivElement | null)[]>([]);
  const activeLeftIdx    = useRef(0);
  const currentTheme     = useRef<'dark' | 'light'>('dark');

  /* Frame / playback state (all refs — no re-renders) */
  const images       = useRef<(HTMLImageElement | null)[]>(Array(TOTAL_FRAMES).fill(null));
  const loadedCount  = useRef(0);
  const targetFrame  = useRef(0);
  const currentFrame = useRef(0);
  const lastDrawn    = useRef(-1);          // avoid redundant draws
  const rafId        = useRef<number>(0);
  const canvasSize   = useRef({ w: 0, h: 0 });

  /* Phase tracking */
  const phase        = useRef<'intro' | 'transition' | 'scrub'>('intro');
  const introTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const stRef        = useRef<ScrollTrigger | null>(null);
  const timeUpdateHandler  = useRef<(() => void) | null>(null);
  const reverseToVideoRef  = useRef<() => void>(() => {});
  const forwardToCanvasRef = useRef<() => void>(() => {});

  /* Card state — which card index is currently shown */
  const activeCardIdx = useRef(-1);

  /* ── Canvas draw ───────────────────────────────────────────────────────── */

  const drawFrame = useCallback((index: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = images.current[index];
    if (!img?.complete || !img.naturalWidth) return;

    const dpr = window.devicePixelRatio || 1;
    const w   = canvas.clientWidth;
    const h   = canvas.clientHeight;

    if (w !== canvasSize.current.w || h !== canvasSize.current.h) {
      canvas.width  = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      canvasSize.current = { w, h };
    }

    // Cover-fill centred
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
    lastDrawn.current = index;
  }, []);

  /* ── rAF loop ──────────────────────────────────────────────────────────── */

  const tick = useCallback(() => {
    if (phase.current === 'scrub') {
      const target = Math.min(TOTAL_FRAMES - 1, Math.max(0, targetFrame.current));
      const idx    = Math.round(target);
      if (idx !== lastDrawn.current) {
        drawFrame(idx);
        currentFrame.current = target;
      }
    }
    rafId.current = requestAnimationFrame(tick);
  }, [drawFrame]);

  /* ── Card visibility (called from ST onUpdate) ─────────────────────────── */

  const updateCards = useCallback((progress: number) => {
    let nextActive = -1;
    for (let i = 0; i < slides.length; i++) {
      const s = slides[i];
      if (progress >= s.showFrom && progress < s.showUntil) {
        nextActive = i;
        break;
      }
      // On the very last slide keep it visible until the end
      if (i === slides.length - 1 && progress >= s.showFrom) {
        nextActive = i;
      }
    }

    if (nextActive === activeCardIdx.current) return;

    // Hide old card
    if (activeCardIdx.current >= 0 && cardRefs.current[activeCardIdx.current]) {
      gsap.to(cardRefs.current[activeCardIdx.current], {
        autoAlpha: 0,
        y:         -40,
        duration:  0.45,
        ease:      'power2.inOut',
        overwrite: 'auto',
      });
    }

    // Show new card
    if (nextActive >= 0 && cardRefs.current[nextActive]) {
      gsap.fromTo(
        cardRefs.current[nextActive],
        { autoAlpha: 0, y: 60 },
        { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power3.out', overwrite: 'auto' }
      );
    }

    activeCardIdx.current = nextActive;
  }, []);

  /* ── Left text rollout (called from ST onUpdate & phase transitions) ────── */

  const updateLeftText = useCallback((targetIdx: number) => {
    if (targetIdx === activeLeftIdx.current) return;
    const prevIdx = activeLeftIdx.current;
    activeLeftIdx.current = targetIdx;

    const isGoingDown = targetIdx > prevIdx;

    // Roll out previous text
    if (prevIdx >= 0 && leftTextRefs.current[prevIdx]) {
      gsap.to(leftTextRefs.current[prevIdx], {
        autoAlpha: 0,
        y:         isGoingDown ? -28 : 28,
        duration:  0.45,
        ease:      'power2.inOut',
        overwrite: 'auto',
      });
    }

    // Roll in new text
    if (targetIdx >= 0 && leftTextRefs.current[targetIdx]) {
      gsap.fromTo(
        leftTextRefs.current[targetIdx],
        { autoAlpha: 0, y: isGoingDown ? 28 : -28 },
        {
          autoAlpha: 1,
          y:         0,
          duration:  0.55,
          ease:      'power3.out',
          overwrite: 'auto',
        }
      );
    }
  }, []);

  /* ── Crossfade video → canvas ──────────────────────────────────────────── */

  const triggerTransition = useCallback(() => {
    if (phase.current !== 'intro') return;
    phase.current = 'transition';

    // Clear intro timer if it fires before scroll (no longer used, kept defensively)
    if (introTimer.current) {
      clearTimeout(introTimer.current);
      introTimer.current = null;
    }

    // Remove scroll listeners — only one transition allowed
    window.removeEventListener('wheel',      triggerTransitionProxy, { capture: true });
    window.removeEventListener('touchstart', triggerTransitionProxy, { capture: true });

    // Stop the video loop handler immediately
    if (timeUpdateHandler.current) {
      videoRef.current?.removeEventListener('timeupdate', timeUpdateHandler.current);
      timeUpdateHandler.current = null;
    }

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // The canvas sequence starts at second 5 of the video (frame 0 of the extracted
    // sequence). Since the video loops within 0–5s, we always start the canvas at frame 0.
    const frameIdx = 0;

    // Draw that frame immediately onto canvas before fading in
    drawFrame(frameIdx);
    currentFrame.current = frameIdx;
    targetFrame.current  = frameIdx;

    const allLoaded = loadedCount.current >= TOTAL_FRAMES;

    const doFade = () => {
      phase.current = 'scrub';
      rafId.current = requestAnimationFrame(tick);

      gsap.to(video, {
        opacity:  0,
        duration: 0.25,
        ease:     'power1.inOut',
        onComplete: () => {
          video.pause();
          video.style.display = 'none';
        },
      });

      gsap.to(canvas, {
        opacity:  1,
        duration: 0.25,
        ease:     'power1.inOut',
      });

      // Hide loading overlay
      if (overlayRef.current) {
        gsap.to(overlayRef.current, { opacity: 0, duration: 0.2, onComplete: () => {
          if (overlayRef.current) overlayRef.current.style.display = 'none';
        }});
      }

      // Activate ScrollTrigger scrub — handles both directions
      stRef.current = ScrollTrigger.create({
        trigger:          sectionRef.current,
        start:            'top top',
        end:              `+=${HERO_SCROLL_PX}`,
        pin:              true,
        scrub:            true,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          // Only drive canvas + cards while in scrub phase
          if (phase.current === 'scrub') {
            targetFrame.current = self.progress * (TOTAL_FRAMES - 1);
            updateCards(self.progress);

            // Left text & button appear only once scrub moves forward past the video handoff (progress >= 0.05)
            if (self.progress < 0.05) {
              if (leftContainerRef.current && activeLeftIdx.current !== -1) {
                gsap.to(leftContainerRef.current, {
                  autoAlpha: 0,
                  y:         20,
                  duration:  0.3,
                  ease:      'power2.in',
                  overwrite: 'auto',
                });
                activeLeftIdx.current = -1;
              }
            } else {
              // Reveal left text & button if hidden
              if (leftContainerRef.current && activeLeftIdx.current === -1) {
                gsap.to(leftContainerRef.current, {
                  autoAlpha: 1,
                  y:         0,
                  duration:  0.45,
                  ease:      'power2.out',
                  overwrite: 'auto',
                });
              }

              // Adaptive text theme based on background brightness
              // In latest-concept-5.mp4, all scrub frames (progress >= 0.05) are light showroom wall (lum > 140)
              const isDark = self.progress < 0.05;
              const nextTheme = isDark ? 'dark' : 'light';
              if (currentTheme.current !== nextTheme) {
                currentTheme.current = nextTheme;
                leftContainerRef.current?.setAttribute('data-theme', nextTheme);
              }

              // Roll out left text per slide (0 to 4)
              let slideIdx = 0;
              if (self.progress < 0.18)      slideIdx = 0;
              else if (self.progress < 0.38) slideIdx = 1;
              else if (self.progress < 0.58) slideIdx = 2;
              else if (self.progress < 0.80) slideIdx = 3;
              else                           slideIdx = 4;

              updateLeftText(slideIdx);
            }
          }

          // Scrolled back to the very start → restore intro video
          if (
            self.direction === -1 &&
            self.progress  <= 0.005 &&
            phase.current  === 'scrub'
          ) {
            reverseToVideoRef.current();
          }

          // Scrolled forward again after video restore → bring canvas back
          if (
            self.direction === 1 &&
            self.progress  >  0.02 &&
            phase.current  === 'intro'
          ) {
            forwardToCanvasRef.current();
          }
        },
      });

      // Initialise cards for progress = 0 (both cards and left text remain hidden until progress >= 0.05)
      updateCards(0);
    };

    if (allLoaded) {
      doFade();
    } else {
      // Show loading overlay until enough frames are ready, then fade
      if (overlayRef.current) overlayRef.current.style.display = 'flex';
      const check = setInterval(() => {
        if (loadedCount.current >= TOTAL_FRAMES) {
          clearInterval(check);
          doFade();
        }
      }, 100);
    }
  }, [drawFrame, tick, updateCards, updateLeftText]);

  // Stable proxy so we can add/remove the same reference
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const triggerTransitionProxy = useCallback(() => triggerTransition(), [triggerTransition]);

  /* ── Crossfade canvas → video (scroll back to start) ───────────────── */

  const reverseToVideo = useCallback(() => {
    if (phase.current !== 'scrub') return;
    phase.current = 'intro';

    cancelAnimationFrame(rafId.current);

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Stop existing loop handler before re-attaching
    if (timeUpdateHandler.current) {
      video.removeEventListener('timeupdate', timeUpdateHandler.current);
    }

    // Restart video at 0 with the 0–5s loop
    video.style.display = 'block';
    video.currentTime   = 0;
    void video.play();

    const loopHandler = () => {
      const vid = videoRef.current;
      if (vid && vid.currentTime >= SCRUB_START_S) vid.currentTime = 0;
    };
    timeUpdateHandler.current = loopHandler;
    video.addEventListener('timeupdate', loopHandler);

    // Crossfade canvas → video
    gsap.to(canvas, { opacity: 0, duration: 0.25, ease: 'power1.inOut' });
    gsap.to(video,  { opacity: 1, duration: 0.25, ease: 'power1.inOut' });

    // Hide all cards
    activeCardIdx.current = -1;
    cardRefs.current.forEach(card => {
      if (card) gsap.to(card, { autoAlpha: 0, y: 60, duration: 0.3, overwrite: 'auto' });
    });

    // Hide left text & button completely when returning to intro video
    if (leftContainerRef.current) {
      gsap.to(leftContainerRef.current, {
        autoAlpha: 0,
        y:         24,
        duration:  0.3,
        ease:      'power2.in',
        overwrite: 'auto',
      });
    }
    activeLeftIdx.current = -1;
  }, []);

  /* ── Crossfade video → canvas (scroll forward after video restore) ────── */

  const forwardToCanvas = useCallback(() => {
    if (phase.current !== 'intro') return;
    phase.current = 'scrub';

    // Stop the video loop
    if (timeUpdateHandler.current) {
      videoRef.current?.removeEventListener('timeupdate', timeUpdateHandler.current);
      timeUpdateHandler.current = null;
    }

    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    // Snap canvas to frame 0 before fading it in
    drawFrame(0);
    currentFrame.current = 0;
    targetFrame.current  = 0;

    rafId.current = requestAnimationFrame(tick);

    gsap.to(video, {
      opacity:  0,
      duration: 0.25,
      ease:     'power1.inOut',
      onComplete: () => { video.pause(); video.style.display = 'none'; },
    });
    gsap.to(canvas, { opacity: 1, duration: 0.25, ease: 'power1.inOut' });

    const p = stRef.current ? stRef.current.progress : 0;

    // Reveal left text and CTA button only if already forward past the threshold
    if (p >= 0.05 && leftContainerRef.current) {
      gsap.to(leftContainerRef.current, {
        autoAlpha: 1,
        y:         0,
        duration:  0.45,
        ease:      'power2.out',
        overwrite: 'auto',
      });
    }

    // Update theme & left text based on current progress
    const isDark = p < 0.05;
    const nextTheme = isDark ? 'dark' : 'light';
    currentTheme.current = nextTheme;
    leftContainerRef.current?.setAttribute('data-theme', nextTheme);

    if (p >= 0.05) {
      let slideIdx = 0;
      if (p < 0.18)      slideIdx = 0;
      else if (p < 0.38) slideIdx = 1;
      else if (p < 0.58) slideIdx = 2;
      else if (p < 0.80) slideIdx = 3;
      else               slideIdx = 4;

      updateLeftText(slideIdx);
    }
    updateCards(p);
  }, [drawFrame, tick, updateCards, updateLeftText]);

  // Keep both direction refs in sync
  useEffect(() => { reverseToVideoRef.current  = reverseToVideo;  }, [reverseToVideo]);
  useEffect(() => { forwardToCanvasRef.current = forwardToCanvas; }, [forwardToCanvas]);

  /* ── Frame batch-loading ───────────────────────────────────────────────── */

  const loadBatch = useCallback((startIdx: number) => {
    const end = Math.min(startIdx + BATCH_SIZE, TOTAL_FRAMES);
    let pending = end - startIdx;

    for (let i = startIdx; i < end; i++) {
      const num = String(i + 1).padStart(4, '0');
      const img = new Image();
      img.decoding = 'async';
      img.onload = () => {
        loadedCount.current++;
        pending--;
        // Draw first frame as soon as it's ready
        if (i === 0) drawFrame(0);
        // Load next batch when this one finishes
        if (pending === 0 && end < TOTAL_FRAMES) {
          loadBatch(end);
        }
      };
      img.onerror = () => {
        loadedCount.current++;
        pending--;
        if (pending === 0 && end < TOTAL_FRAMES) loadBatch(end);
      };
      img.src = `${FRAMES_PATH}/frame_${num}.${FRAME_EXT}`;
      images.current[i] = img;
    }
  }, [drawFrame]);

  /* ── Mount / unmount ───────────────────────────────────────────────────── */

  useEffect(() => {
    // ── Initialise card visibility
    for (let i = 0; i < slides.length; i++) {
      gsap.set(cardRefs.current[i], { autoAlpha: 0, y: 60 });
    }

    // ── Initialise left container: HIDDEN during Phase 1 intro video
    gsap.set(leftContainerRef.current, { autoAlpha: 0, y: 24 });

    // ── Initialise left text rollout
    for (let i = 0; i < slides.length; i++) {
      if (i === 0) {
        gsap.set(leftTextRefs.current[i], { autoAlpha: 1, y: 0 });
      } else {
        gsap.set(leftTextRefs.current[i], { autoAlpha: 0, y: 28 });
      }
    }
    activeLeftIdx.current = -1;
    currentTheme.current  = 'dark';
    leftContainerRef.current?.setAttribute('data-theme', 'dark');

    // ── Canvas starts transparent; video visible
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.opacity = '0';
    }

    // ── Start batch loading frames
    loadBatch(0);

    // ── Video plays first 5 s in a loop until user scrolls
    const onTimeUpdate = () => {
      const vid = videoRef.current;
      if (vid && vid.currentTime >= SCRUB_START_S) {
        vid.currentTime = 0;  // loop back to start
      }
    };
    timeUpdateHandler.current = onTimeUpdate;
    videoRef.current?.addEventListener('timeupdate', onTimeUpdate);

    // Transition triggered only by wheel / touchstart
    window.addEventListener('wheel',      triggerTransitionProxy, { once: true, capture: true, passive: true });
    window.addEventListener('touchstart', triggerTransitionProxy, { once: true, capture: true, passive: true });

    // ── Resize observer — redraw current frame on resize
    const ro = new ResizeObserver(() => {
      canvasSize.current = { w: 0, h: 0 }; // invalidate cache
      const idx = Math.round(currentFrame.current);
      drawFrame(idx);
    });
    if (canvas) ro.observe(canvas);

    return () => {
      // Clean up timers
      if (introTimer.current) clearTimeout(introTimer.current);
      window.removeEventListener('wheel',      triggerTransitionProxy, { capture: true });
      window.removeEventListener('touchstart', triggerTransitionProxy, { capture: true });
      if (timeUpdateHandler.current) {
        videoRef.current?.removeEventListener('timeupdate', timeUpdateHandler.current);
        timeUpdateHandler.current = null;
      }

      // Clean up animation / ST
      cancelAnimationFrame(rafId.current);
      stRef.current?.kill();
      ro.disconnect();

      // Release image references
      images.current = Array(TOTAL_FRAMES).fill(null);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ─── Render ──────────────────────────────────────────────────────────── */

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      aria-label="Hero"
      className={styles.hero}
    >
      {/* ── Media container ── */}
      <div className={styles.heroInner}>
        <Navigation />

        {/* Phase 1: autoplay intro video */}
        <video
          ref={videoRef}
          className={styles.heroVideo}
          src="/hero.mp4"
          autoPlay
          muted
          playsInline
          preload="auto"
          aria-hidden="true"
        />

        {/* Phase 2: scroll-scrubbed canvas */}
        <div className={styles.canvasWrap}>
          <canvas
            ref={canvasRef}
            className={styles.canvas}
            aria-hidden="true"
          />
        </div>

        {/* Loading overlay (shown only if frames aren't ready when scroll begins) */}
        <div ref={overlayRef} className={styles.loadingOverlay} style={{ display: 'none' }}>
          <div className={styles.loadingSpinner} aria-label="Loading frames…" />
        </div>
      </div>

      {/* ── UI overlay — sits OUTSIDE heroInner so backdrop-filter works ── */}
      <div className={styles.uiOverlay}>

        {/* ── Left Content (Rollout per slide & adaptive theme) ── */}
        <div ref={leftContainerRef} className={styles.staticLeftContent} data-theme="dark">
          <div className={styles.leftTextStage}>
            {slides.map((item, index) => (
              <div
                key={item.id}
                ref={el => { leftTextRefs.current[index] = el; }}
                className={styles.leftTextBlock}
              >
                <h1 className={styles.thinPremiumTitle}>
                  <span className={styles.titleLine}>{item.line1}</span>
                  <span className={styles.titleLine}>{item.line2}</span>
                </h1>
                <p className={styles.smallDesc}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className={styles.ctaLeftWrap}>
            <a href="#solutions" className={styles.ctaPill}>
              <span>Explore Collection</span>
              <ArrowUpRight size={13} strokeWidth={2.5} className={styles.ctaArrowIcon} />
            </a>
          </div>
        </div>

        {slides.map((slide, index) => (
          <div key={slide.id} className={styles.slideWrapper}>
            {/* Glassmorphic Card */}
            <div
              ref={el => { cardRefs.current[index] = el; }}
              className={styles.cardParent}
            >
              {/* 3D container */}
              <div className="relative w-[320px] h-[320px] text-white font-sans select-none group [transform-style:preserve-3d] transition-transform duration-500 ease-out hover:[transform:rotate3d(1,-1,0,12deg)_translateY(-4px)]">

                {/* Ambient glowing UnLtd Logo gradient orb */}
                <div
                  className="absolute w-36 h-36 rounded-full top-[20%] right-[4%] bg-gradient-to-br from-[#342F89] via-[#252166] to-[#52B6E6] blur-[22px] opacity-70 pointer-events-none z-0 transition-transform duration-500 ease-out group-hover:scale-115 group-hover:opacity-90"
                  aria-hidden="true"
                />

                {/* Cyan accent dot */}
                <div
                  className="absolute w-12 h-12 rounded-full top-[10%] right-[12%] bg-[#52B6E6] blur-[14px] opacity-60 pointer-events-none z-0 transition-transform duration-500 ease-out group-hover:scale-125"
                  aria-hidden="true"
                />

                {/* 3D Glass Surface */}
                <div className="relative w-full h-full [transform-style:preserve-3d] drop-shadow-[0_15px_35px_rgba(0,0,0,0.32)] transition-all duration-300 ease-out group-hover:drop-shadow-[0_0_25px_rgba(82,182,230,0.45)]">

                  {/* Main Scooped Glass Card */}
                  <div
                    className="absolute inset-0 w-[320px] h-[320px] bg-gradient-to-br from-[#342F89]/40 via-[#252166]/50 to-[#52B6E6]/25 backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)] overflow-hidden transition-all duration-300 ease-out border border-white/20 group-hover:border-[#52B6E6]/50"
                    style={{
                      clipPath: "path('M 32,4 L 288,4 A 28,28 0 0,1 316,32 L 316,218 A 20,20 0 0,1 296,238 L 196,238 C 176,238 162,248 146,268 C 130,288 120,306 98,306 L 32,306 A 28,28 0 0,1 4,278 L 4,32 A 28,28 0 0,1 32,4 Z')"
                    }}
                  >
                    {/* Specular shine sweep */}
                    <div className="absolute -inset-full w-[200%] h-6 bg-white/20 blur-xl rotate-[45deg] pointer-events-none animate-[cardShine_9s_ease-in-out_infinite]" />

                    {/* SVG Rim & Surface Lighting */}
                    <svg viewBox="0 0 320 320" className="absolute inset-0 w-[320px] h-[320px] pointer-events-none z-[1]" aria-hidden="true">
                      <defs>
                        <linearGradient id={`rimGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor="#ffffff"           stopOpacity="0.85" />
                          <stop offset="25%"  stopColor="rgba(255,255,255,0.4)" />
                          <stop offset="55%"  stopColor="#52B6E6"           stopOpacity="0.8" />
                          <stop offset="80%"  stopColor="#342F89"           stopOpacity="0.9" />
                          <stop offset="100%" stopColor="#52B6E6"           stopOpacity="0.5" />
                        </linearGradient>
                        <linearGradient id={`surfaceGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%"   stopColor="#342F89" stopOpacity="0.45" />
                          <stop offset="45%"  stopColor="#252166" stopOpacity="0.55" />
                          <stop offset="85%"  stopColor="#1e1a52" stopOpacity="0.45" />
                          <stop offset="100%" stopColor="#52B6E6" stopOpacity="0.25" />
                        </linearGradient>
                        <radialGradient id={`causticGrad-${slide.id}`} cx="20%" cy="15%" r="70%">
                          <stop offset="0%"   stopColor="rgba(255, 255, 255, 0.22)" />
                          <stop offset="40%"  stopColor="rgba(82, 182, 230, 0.14)"  />
                          <stop offset="75%"  stopColor="rgba(52, 47, 137, 0.16)"   />
                          <stop offset="100%" stopColor="transparent" />
                        </radialGradient>
                      </defs>
                      <path
                        d="M 32,4 L 288,4 A 28,28 0 0,1 316,32 L 316,218 A 20,20 0 0,1 296,238 L 196,238 C 176,238 162,248 146,268 C 130,288 120,306 98,306 L 32,306 A 28,28 0 0,1 4,278 L 4,32 A 28,28 0 0,1 32,4 Z"
                        fill={`url(#surfaceGrad-${slide.id})`}
                        stroke={`url(#rimGrad-${slide.id})`}
                        strokeWidth="1.5"
                      />
                      <path
                        d="M 32,4 L 288,4 A 28,28 0 0,1 316,32 L 316,218 A 20,20 0 0,1 296,238 L 196,238 C 176,238 162,248 146,268 C 130,288 120,306 98,306 L 32,306 A 28,28 0 0,1 4,278 L 4,32 A 28,28 0 0,1 32,4 Z"
                        fill={`url(#causticGrad-${slide.id})`}
                      />
                    </svg>

                    {/* Card content */}
                    <div
                      className="absolute inset-0 flex flex-col justify-between z-[2] pointer-events-auto select-none"
                      style={{ paddingLeft: '32px', paddingTop: '30px', paddingRight: '28px', paddingBottom: '26px' }}
                    >
                      <div>
                        <h3 className="text-[1.4rem] font-semibold tracking-wide text-white uppercase leading-tight drop-shadow-sm font-sans">
                          {slide.line1} {slide.line2.replace('.', '')}
                        </h3>
                        <p className="text-[12.5px] leading-[1.65] font-normal text-white/85 max-w-[250px] mt-3">
                          {slide.desc}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-wider text-white/60 uppercase">
                        <span className="text-[#52B6E6] font-semibold">UNLTD</span>
                        <span className="text-white/30">•</span>
                        <span>DEVICE</span>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card Pill Badge */}
                  <div
                    className="absolute inset-0 w-[320px] h-[320px] bg-gradient-to-br from-[#342F89]/50 via-[#252166]/60 to-[#52B6E6]/30 backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)] overflow-hidden transition-all duration-300 ease-out border border-white/20 group-hover:border-[#52B6E6]/50"
                    style={{
                      clipPath: "path('M 205,250 L 296,250 A 16,16 0 0,1 316,270 L 316,286 A 20,20 0 0,1 296,306 L 178,306 A 18,18 0 0,1 162,292 C 158,282 165,274 175,264 L 192,254 A 14,14 0 0,1 205,250 Z')"
                    }}
                  >
                    <svg viewBox="0 0 320 320" className="absolute inset-0 w-[320px] h-[320px] pointer-events-none z-[1]" aria-hidden="true">
                      <path
                        d="M 205,250 L 296,250 A 16,16 0 0,1 316,270 L 316,286 A 20,20 0 0,1 296,306 L 178,306 A 18,18 0 0,1 162,292 C 158,282 165,274 175,264 L 192,254 A 14,14 0 0,1 205,250 Z"
                        fill={`url(#surfaceGrad-${slide.id})`}
                        stroke={`url(#rimGrad-${slide.id})`}
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div className="absolute left-[165px] top-[250px] w-[150px] h-[56px] flex items-center justify-center z-[2] pointer-events-none">
                      <span className="font-mono text-[13px] font-bold tracking-widest text-white drop-shadow-sm">
                        {slide.id} / 05
                      </span>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
