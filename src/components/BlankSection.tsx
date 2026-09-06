'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import styles from './BlankSection.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function BlankSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      if (bgRef.current && sectionRef.current) {
        gsap.to(bgRef.current, {
          y: -220,
          skewY: -8,
          ease: 'none',
          scrollTrigger: {
            trigger: sectionRef.current,
            start: 'top 95%',
            end: 'top 40%',
            scrub: 0.5,
          },
        });
      }
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  return (
    <section ref={sectionRef} className={styles.section}>
      <div className={styles.skewBg}>
        <div ref={bgRef} className={styles.bg}></div>
      </div>
      <div className={styles.container}>
        <h2>Next Section Placeholder</h2>
      </div>
    </section>
  );
}
