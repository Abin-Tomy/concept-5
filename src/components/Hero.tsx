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

              {/* Mockup Glassmorphic Card — right bottom */}
              <div
                ref={el => { cardRefs.current[index] = el; }}
                className={styles.cardParent}
              >
                <div className={styles.mockupContainer}>
                  {/* Main Scooped Card */}
                  <div className={styles.mainCard}>
                    {/* SVG Rim & Surface Lighting */}
                    <svg viewBox="0 0 320 320" className={styles.cardSvg} aria-hidden="true">
                      <defs>
                        <linearGradient id={`rimGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
                          <stop offset="30%" stopColor="#ffffff" stopOpacity="0.45" />
                          <stop offset="65%" stopColor="rgba(255,255,255,0.15)" />
                          <stop offset="85%" stopColor="#ffffff" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="rgba(255,255,255,0.4)" />
                        </linearGradient>
                        <linearGradient id={`surfaceGrad-${slide.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.16)" />
                          <stop offset="35%" stopColor="rgba(255, 255, 255, 0.04)" />
                          <stop offset="70%" stopColor="rgba(0, 0, 0, 0.35)" />
                          <stop offset="100%" stopColor="rgba(255, 255, 255, 0.10)" />
                        </linearGradient>
                        <radialGradient id={`causticGrad-${slide.id}`} cx="35%" cy="30%" r="55%">
                          <stop offset="0%" stopColor="rgba(255, 255, 255, 0.15)" />
                          <stop offset="60%" stopColor="rgba(255, 255, 255, 0.02)" />
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

                    {/* Content inside main card */}
                    <div className={styles.mainCardBody}>
                      {/* Top row: Active slide topic */}
                      <div className={styles.topRow}>
                        <span className={styles.slideTopic}>
                          {slide.line1} {slide.line2.replace('.', '')}
                        </span>
                      </div>

                      {/* Main description */}
                      <div className={styles.descSection}>
                        <p className={styles.cardDesc}>{slide.desc}</p>
                      </div>
                    </div>
                  </div>

                  {/* Sub-Card (Bottom-right pill badge with slide counter) */}
                  <div className={styles.subCard}>
                    <svg viewBox="0 0 320 320" className={styles.cardSvg} aria-hidden="true">
                      <path
                        d="M 205,250 L 296,250 A 16,16 0 0,1 316,270 L 316,286 A 20,20 0 0,1 296,306 L 178,306 A 18,18 0 0,1 162,292 C 158,282 165,274 175,264 L 192,254 A 14,14 0 0,1 205,250 Z"
                        fill={`url(#surfaceGrad-${slide.id})`}
                        stroke={`url(#rimGrad-${slide.id})`}
                        strokeWidth="1.5"
                      />
                    </svg>
                    <div className={styles.subCardBody}>
                      <span className={styles.subCardText}>{slide.id} / 05</span>
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
