'use client';

/**
 * Hero.tsx — Concept 5
 *
 * Cards and headings live OUTSIDE heroInner so backdrop-filter
 * can composite against the canvas element correctly.
 */

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ArrowUpRight } from 'lucide-react';
import SequenceCanvas from './SequenceCanvas';
import Navigation from './Navigation';
import styles from './Hero.module.css';

gsap.registerPlugin(ScrollTrigger);

const slides = [
  {
    id: '01',
    line1: 'SMART',
    line2: 'RETAIL.',
    subtitle: 'SR-01',
    desc: 'Enhance the shopping experience with intelligent point-of-sale systems, digital shelves, and automated queue management.',
  },
  {
    id: '02',
    line1: 'AUDIO',
    line2: 'VISUAL.',
    subtitle: 'AV-02',
    desc: 'Immerse your audience with high-definition LED video walls, interactive LCD displays, and premium sound systems.',
  },
  {
    id: '03',
    line1: 'DIGITAL',
    line2: 'SIGNAGE.',
    subtitle: 'DS-03',
    desc: 'Deliver dynamic content anywhere with interactive kiosks, floor signage, and smart panels.',
  },
  {
    id: '04',
    line1: 'ROBOTICS',
    line2: '& A.I.',
    subtitle: 'RA-04',
    desc: 'Automate and analyze with AI-powered cameras, smart mirrors, and advanced footfall counters.',
  },
  {
    id: '05',
    line1: 'SMART',
    line2: 'SOLUTIONS.',
    subtitle: 'SS-05',
    desc: 'Transform spaces with comprehensive smart home automation, connected classrooms, and seamless integrations.',
  },
];

const TOTAL = slides.length;

// Hold durations calibrated to product appearances in the 15s video (concept-6-new.mp4):
// 01 Kiosk (0-2.9s) | 02 Monitor (2.9-5.3s) | 03 Vertical Signage (5.3-7.8s) | 04 Smart Lock & Dome Camera (7.8-12.8s) | 05 Smart Home Panel (12.8-14.1s)
const holdDurations = [1.7, 1.3, 1.2, 3.0, 1.2];

export default function Hero() {
  const sectionRef = useRef<HTMLElement>(null);
  const headingRefs = useRef<(HTMLDivElement | null)[]>([]);
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Slide 0 visible, rest hidden
      gsap.set([headingRefs.current[0], cardRefs.current[0]], { autoAlpha: 1, y: 0 });
      for (let i = 1; i < TOTAL; i++) {
        gsap.set([headingRefs.current[i], cardRefs.current[i]], { autoAlpha: 0, y: 60 });
      }

      const tl = gsap.timeline();

      for (let i = 0; i < TOTAL - 1; i++) {
        tl.to({}, { duration: holdDurations[i] });

        tl.to([headingRefs.current[i], cardRefs.current[i]], {
          autoAlpha: 0,
          y: -40,
          duration: 0.7,
          ease: 'power3.inOut',
          stagger: 0.04,
        });

        tl.fromTo(
          [headingRefs.current[i + 1], cardRefs.current[i + 1]],
          { autoAlpha: 0, y: 60 },
          { autoAlpha: 1, y: 0, duration: 0.7, ease: 'power3.out', stagger: 0.04 },
          '>-0.1'
        );
      }

      tl.to({}, { duration: holdDurations[TOTAL - 1] });

      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: '+=4500',
        pin: true,
        scrub: 0.8,
        animation: tl,
        invalidateOnRefresh: true,
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section
      ref={sectionRef}
      id="hero-section"
      aria-label="Hero"
      className={styles.hero}
    >
      {/* ── Canvas container (the video) ── */}
      <div className={styles.heroInner}>
        <Navigation />
        <div className={styles.canvasWrap}>
          <SequenceCanvas
            frameCount={150}
            framesPath="/frames"
            ext="jpg"
            scrollTriggerEl="#hero-section"
            scrollStart="top top"
            scrollEnd="+=4500"
            className={styles.canvas}
          />
        </div>
      </div>

      {/* ── UI overlay — sits OUTSIDE heroInner so backdrop-filter works ── */}
      <div className={styles.uiOverlay}>
        {slides.map((slide, index) => {
          return (
            <div key={slide.id} className={styles.slideWrapper}>

              {/* Heading — left side */}
              <div
                ref={el => { headingRefs.current[index] = el; }}
                className={styles.headingContent}
              >
                <p className={`${styles.mega} ${styles.megaMD}`}>{slide.line1}</p>
                <p className={`${styles.mega} ${styles.megaMD}`}>{slide.line2}</p>
              </div>

              {/* Glassmorphic Card styled with UnLtd Logo gradient tint & clean alignment */}
              <div
                ref={el => { cardRefs.current[index] = el; }}
                className={styles.cardParent}
              >
                {/* 3D container */}
                <div className="relative w-[320px] h-[320px] text-white font-sans select-none group [transform-style:preserve-3d] transition-transform duration-500 ease-out hover:[transform:rotate3d(1,-1,0,12deg)_translateY(-4px)]">
                  
                  {/* Ambient glowing UnLtd Logo gradient orb behind glass (Royal Indigo to Cyan) */}
                  <div
                    className="absolute w-36 h-36 rounded-full top-[20%] right-[4%] bg-gradient-to-br from-[#342F89] via-[#252166] to-[#52B6E6] blur-[22px] opacity-70 pointer-events-none z-0 transition-transform duration-500 ease-out group-hover:scale-115 group-hover:opacity-90"
                    aria-hidden="true"
                  />

                  {/* Ambient glowing Cyan accent dot reflection (from UnLtd Logo) */}
                  <div
                    className="absolute w-12 h-12 rounded-full top-[10%] right-[12%] bg-[#52B6E6] blur-[14px] opacity-60 pointer-events-none z-0 transition-transform duration-500 ease-out group-hover:scale-125"
                    aria-hidden="true"
                  />

                  {/* 3D Glass Surface Container with UnLtd Drop Shadow */}
                  <div className="relative w-full h-full [transform-style:preserve-3d] drop-shadow-[0_15px_35px_rgba(0,0,0,0.32)] transition-all duration-300 ease-out group-hover:drop-shadow-[0_0_25px_rgba(82,182,230,0.45)]">
                    
                    {/* Main Scooped Glass Card */}
                    <div
                      className="absolute inset-0 w-[320px] h-[320px] bg-gradient-to-br from-[#342F89]/40 via-[#252166]/50 to-[#52B6E6]/25 backdrop-blur-[24px] [-webkit-backdrop-filter:blur(24px)] overflow-hidden transition-all duration-300 ease-out border border-white/20 group-hover:border-[#52B6E6]/50"
                      style={{
                        clipPath: "path('M 32,4 L 288,4 A 28,28 0 0,1 316,32 L 316,218 A 20,20 0 0,1 296,238 L 196,238 C 176,238 162,248 146,268 C 130,288 120,306 98,306 L 32,306 A 28,28 0 0,1 4,278 L 4,32 A 28,28 0 0,1 32,4 Z')"
                      }}
                    >
                      {/* Specular glass shine sweep across card */}
                      <div className="absolute -inset-full w-[200%] h-6 bg-white/20 blur-xl rotate-[45deg] pointer-events-none animate-[cardShine_9s_ease-in-out_infinite]" />

                      {/* SVG Rim & Surface Lighting with UnLtd Logo gradient colors */}
                      <svg viewBox="0 0 320 320" className="absolute inset-0 w-[320px] h-[320px] pointer-events-none z-[1]" aria-hidden="true">
                        <defs>
                          <linearGradient id={`rimGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
                            <stop offset="25%" stopColor="rgba(255,255,255,0.4)" />
                            <stop offset="55%" stopColor="#52B6E6" stopOpacity="0.8" />
                            <stop offset="80%" stopColor="#342F89" stopOpacity="0.9" />
                            <stop offset="100%" stopColor="#52B6E6" stopOpacity="0.5" />
                          </linearGradient>
                          <linearGradient id={`surfaceGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#342F89" stopOpacity="0.45" />
                            <stop offset="45%" stopColor="#252166" stopOpacity="0.55" />
                            <stop offset="85%" stopColor="#1e1a52" stopOpacity="0.45" />
                            <stop offset="100%" stopColor="#52B6E6" stopOpacity="0.25" />
                          </linearGradient>
                          <radialGradient id={`causticGrad-${slide.id}`} cx="20%" cy="15%" r="70%">
                            <stop offset="0%" stopColor="rgba(255, 255, 255, 0.22)" />
                            <stop offset="40%" stopColor="rgba(82, 182, 230, 0.14)" />
                            <stop offset="75%" stopColor="rgba(52, 47, 137, 0.16)" />
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

                      {/* Content inside main card - cleanly aligned and properly positioned */}
                      <div
                        className="absolute inset-0 flex flex-col justify-between z-[2] pointer-events-auto select-none"
                        style={{ paddingLeft: '32px', paddingTop: '30px', paddingRight: '28px', paddingBottom: '26px' }}
                      >
                        {/* Top: Category Title */}
                        <div>
                          <h3 className="text-[1.4rem] font-semibold tracking-wide text-white uppercase leading-tight drop-shadow-sm font-sans">
                            {slide.line1} {slide.line2.replace('.', '')}
                          </h3>

                          {/* Description with comfortable breathing room */}
                          <p className="text-[12.5px] leading-[1.65] font-normal text-white/85 max-w-[250px] mt-3">
                            {slide.desc}
                          </p>
                        </div>

                        {/* Bottom-left: Brand indicator (fits cleanly to left of scooped notch) */}
                        <div className="flex items-center gap-1.5 text-[10.5px] font-medium tracking-wider text-white/60 uppercase">
                          <span className="text-[#52B6E6] font-semibold">UNLTD</span>
                          <span className="text-white/30">•</span>
                          <span>DEVICE</span>
                        </div>
                      </div>
                    </div>

                    {/* Sub-Card Pill Badge with matching UnLtd Logo gradient */}
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
          );
        })}

        {/* CTA pill */}
        <div className={styles.ctaWrap}>
          <a href="#solutions" className={styles.ctaPill}>
            <span>Explore Solutions</span>
            <ArrowUpRight size={13} strokeWidth={2.5} className={styles.ctaArrowIcon} />
          </a>
        </div>
      </div>
    </section>
  );
}
