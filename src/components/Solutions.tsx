'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import styles from './Solutions.module.css';

gsap.registerPlugin(ScrollTrigger);

export default function Solutions() {
  const sectionRef = useRef<HTMLElement>(null);
  const bgRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const splitRef = useRef<SplitType | null>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // 1. Setup text split for reveal animation
      if (headingRef.current) {
        splitRef.current = new SplitType(headingRef.current, { types: 'lines,words' });
        
        // Hide words initially (pushed down outside their line mask)
        gsap.set(splitRef.current.words, { y: '100%' });
        gsap.set(headingRef.current, { visibility: 'visible' });

        // ScrollTrigger to reveal the text when section enters view
        ScrollTrigger.create({
          trigger: sectionRef.current,
          start: 'top 80%',
          once: true,
          onEnter: () => {
            gsap.to(splitRef.current?.words || [], {
              y: '0%',
              duration: 1.2,
              ease: 'power4.out',
              stagger: 0.05,
            });
          },
        });
      }

      // 2. Setup the slanted background reveal effect
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

    return () => {
      ctx.revert();
      if (splitRef.current) {
        splitRef.current.revert();
      }
    };
  }, []);

  return (
    <section ref={sectionRef} id="solutions" className={styles.section}>
      {/* Absolute slanted background container */}
      <div className={styles.skewBg}>
        <div ref={bgRef} className={styles.bg}></div>
      </div>

      {/* Section Content */}
      <div className={styles.container}>
        <h2 ref={headingRef} className={styles.heading}>
          We build integrated hardware solutions that refuse to whisper—intelligent systems, dynamic displays, and physical stages made to capture attention.
        </h2>
        
        <div className={styles.content}>
          <div className={styles.media}>
            {/* Placeholder for future images/videos */}
          </div>
          <div className={styles.details}>
            <div className={styles.row}>
              <span>(Spark)</span>
              <p>
                It starts messy on purpose. Audits, physical blueprints, and one reckless idea that sets the entire spatial direction on fire.
              </p>
            </div>
            <div className={styles.row}>
              <span>(+Craft)</span>
              <p>
                Then we tighten the screws—sensors, digital signage, and robotics locked into a system loud enough to feel, clear enough to scale.
              </p>
            </div>
            <div className={styles.row}>
              <span>(=Heat)</span>
              <ul className={styles.stats}>
                <li><span>Spaces Transformed</span><span>48+</span></li>
                <li><span>Engagement Uplift</span><span>92%</span></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
