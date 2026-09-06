'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { gsap } from 'gsap';
import SplitType from 'split-type';
import styles from './Navigation.module.css';

const OPEN_HIDDEN = `M1131,0 Q565.5,0 0,0 L0,0 L1131,0 Z`;
const OPEN_BULGE = `M1131,345 Q565.5,620 0,345 L0,0 L1131,0 Z`;
const OPEN_FULL = `M1131,861 Q565.5,861 0,861 L0,0 L1131,0 Z`;
const CLOSE_START = `M1131,0 Q565.5,0 0,0 L0,861 L1131,861 Z`;
const CLOSE_BULGE = `M1131,350 Q565.5,130 0,350 L0,861 L1131,861 Z`;
const CLOSE_HIDDEN = `M1131,861 Q565.5,861 0,861 L0,861 L1131,861 Z`;

export default function Navigation() {
  const navRef = useRef<HTMLElement>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const isAnimating = useRef(false);

  const menuBgRef = useRef<SVGPathElement>(null);
  const menuLinksRef = useRef<(HTMLAnchorElement | null)[]>([]);
  const infoItemsRef = useRef<(HTMLElement | null)[]>([]);
  const splitsRef = useRef<SplitType[]>([]);

  /* ── Entrance animation ─────────────────────── */
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        navRef.current,
        { y: -80, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: 'power3.out', delay: 0.3 }
      );
    }, navRef);

    return () => ctx.revert();
  }, []);

  /* ── Setup SplitType and Initial States ─────── */
  useEffect(() => {
    gsap.set(menuBgRef.current, { attr: { d: OPEN_HIDDEN } });
    gsap.set(infoItemsRef.current, { opacity: 0, y: 100 });

    const splits: SplitType[] = [];
    menuLinksRef.current.forEach((link) => {
      if (link) {
        const split = new SplitType(link, { types: 'chars', charClass: 'char' });
        splits.push(split);
        gsap.set(split.chars, { opacity: 0, x: '150%' });
      }
    });
    splitsRef.current = splits;

    // Cleanup
    return () => {
      splits.forEach((s) => s.revert());
    };
  }, []);

  /* ── Menu Open/Close Timeline ───────────────── */
  useEffect(() => {
    // Only run if the path attribute is available, avoiding initial mount running 'close'
    const currentPath = menuBgRef.current?.getAttribute('d');
    if (!menuOpen && (!currentPath || currentPath === OPEN_HIDDEN)) return;

    if (menuOpen) {
      isAnimating.current = true;
      const tl = gsap.timeline({
        onComplete: () => {
          isAnimating.current = false;
        },
      });

      tl.to(menuBgRef.current, {
        duration: 0.5,
        attr: { d: OPEN_BULGE },
        ease: 'power4.in',
      }).to(menuBgRef.current, {
        duration: 0.5,
        attr: { d: OPEN_FULL },
        ease: 'power4.out',
      });

      tl.to(
        infoItemsRef.current,
        {
          duration: 0.75,
          opacity: 1,
          y: 0,
          ease: 'power3.out',
          stagger: 0.075,
        },
        '-=0.35'
      );

      const chars = splitsRef.current.flatMap((s) => s.chars);
      if (chars.length) {
        tl.to(
          chars,
          {
            duration: 1.5,
            x: '0%',
            ease: 'elastic.out(1, 0.25)',
            stagger: 0.01,
          },
          0.45
        );
        tl.to(
          chars,
          {
            duration: 0.75,
            opacity: 1,
            ease: 'power2.out',
            stagger: 0.01,
          },
          0.45
        );
      }
    } else {
      isAnimating.current = true;
      gsap.set(menuBgRef.current, { attr: { d: CLOSE_START } });

      const tl = gsap.timeline({
        onComplete: () => {
          gsap.set(menuBgRef.current, { attr: { d: OPEN_HIDDEN } });
          splitsRef.current.forEach((split) => {
            gsap.set(split.chars, { opacity: 0, x: '150%' });
          });
          gsap.set(menuLinksRef.current, { opacity: 1 });
          gsap.set(infoItemsRef.current, { opacity: 0, y: 100 });
          isAnimating.current = false;
        },
      });

      tl.to(menuLinksRef.current, { duration: 0.3, opacity: 0 }).to(
        infoItemsRef.current,
        { duration: 0.3, opacity: 0 },
        '<'
      );

      tl.to(
        menuBgRef.current,
        { duration: 0.5, attr: { d: CLOSE_BULGE }, ease: 'power3.in' },
        '<'
      ).to(menuBgRef.current, {
        duration: 0.5,
        attr: { d: CLOSE_HIDDEN },
        ease: 'power3.out',
      });
    }
  }, [menuOpen]);

  /* ── Magnetic hover on contact button ─────── */
  const contactRef = useRef<HTMLButtonElement>(null);

  const handleContactMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    const el = contactRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) * 0.25;
    const y = (e.clientY - rect.top - rect.height / 2) * 0.25;
    gsap.to(el, { x, y, duration: 0.4, ease: 'power2.out' });
  };

  const handleContactMouseLeave = () => {
    gsap.to(contactRef.current, { x: 0, y: 0, duration: 0.6, ease: 'elastic.out(1, 0.5)' });
  };

  return (
    <>
      <nav ref={navRef} aria-label="Main navigation" className={styles.navWrapper}>
        {/* ── Logo ─────────────────────── */}
        <Link href="/" aria-label="UNLTD home" style={{ pointerEvents: 'auto' }}>
          <Image
            src="/logo.png"
            alt="UNLTD Logo"
            width={300}
            height={90}
            priority
            style={{
              objectFit: 'contain',
              height: 90,
              width: 'auto',
              transform: 'scale(1.5)',
              transformOrigin: 'left center',
            }}
          />
        </Link>

        {/* ── Right controls ───────────── */}
        <div className={styles.navControls}>
          {/* Contact pill */}
          <button
            ref={contactRef}
            id="nav-contact-btn"
            aria-label="Contact us"
            onMouseMove={handleContactMouseMove}
            onMouseLeave={(e) => {
              handleContactMouseLeave();
              (e.currentTarget as HTMLElement).style.background = 'rgba(52, 47, 137, 0.60)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52, 47, 137, 0.40)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 4px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.15)';
            }}
            onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '0 26px',
              height: 48,
              borderRadius: 9999,
              border: '1px solid rgba(52, 47, 137, 0.40)',
              background: 'rgba(52, 47, 137, 0.60)',
              backdropFilter: 'blur(32px) saturate(180%)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              boxShadow:
                '0 4px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
              cursor: 'pointer',
              transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, opacity 0.3s ease',
              willChange: 'transform',
              opacity: menuOpen ? 0 : 1,
              pointerEvents: menuOpen ? 'none' : 'auto',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.background = 'rgba(52, 47, 137, 0.85)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52, 47, 137, 0.60)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 14px 44px rgba(52, 47, 137, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.25)';
            }}
          >
            Contact
          </button>

          {/* Hamburger circle */}
          <button
            id="nav-menu-btn"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => {
              if (isAnimating.current) return;
              setMenuOpen((v) => !v);
            }}
            style={{
              width: 48,
              height: 48,
              borderRadius: '50%',
              border: '1px solid rgba(52, 47, 137, 0.40)',
              background: menuOpen ? 'rgba(52, 47, 137, 0.95)' : 'rgba(52, 47, 137, 0.60)',
              backdropFilter: 'blur(32px) saturate(180%)',
              boxShadow:
                '0 4px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.15)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 5,
              cursor: 'pointer',
              transition: 'background 0.4s ease, border-color 0.4s ease, box-shadow 0.4s ease, transform 0.3s ease',
              willChange: 'transform',
            }}
            onMouseEnter={(e) => {
              if (!menuOpen) {
                (e.currentTarget as HTMLElement).style.transform = 'scale(1.08)';
                (e.currentTarget as HTMLElement).style.background = 'rgba(52, 47, 137, 0.85)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52, 47, 137, 0.60)';
                (e.currentTarget as HTMLElement).style.boxShadow =
                  '0 14px 44px rgba(52, 47, 137, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.18), inset 0 -1px 0 rgba(0, 0, 0, 0.25)';
              }
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.transform = 'scale(1)';
              (e.currentTarget as HTMLElement).style.background = menuOpen
                ? 'rgba(52, 47, 137, 0.95)'
                : 'rgba(52, 47, 137, 0.60)';
              (e.currentTarget as HTMLElement).style.borderColor = 'rgba(52, 47, 137, 0.40)';
              (e.currentTarget as HTMLElement).style.boxShadow =
                '0 4px 24px rgba(0, 0, 0, 0.24), inset 0 1px 0 rgba(255, 255, 255, 0.12), inset 0 -1px 0 rgba(0, 0, 0, 0.15)';
            }}
          >
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                style={{
                  display: 'block',
                  width: menuOpen ? (i === 1 ? 0 : 18) : 18,
                  height: 1.5,
                  background: '#ffffff',
                  borderRadius: 2,
                  transformOrigin: 'center',
                  transform: menuOpen
                    ? i === 0
                      ? 'translateY(6.5px) rotate(45deg)'
                      : i === 2
                      ? 'translateY(-6.5px) rotate(-45deg)'
                      : 'scaleX(0)'
                    : 'none',
                  transition: 'transform 0.3s ease, width 0.3s ease, background 0.3s ease',
                }}
              />
            ))}
          </button>
        </div>
      </nav>

      {/* ── Full screen menu overlay ───────────────── */}
      <div className={`${styles.menuOverlay} ${menuOpen ? styles.isOpen : ''}`}>
        <svg
          className={styles.menuBgSvg}
          viewBox="0 0 1131 861"
          preserveAspectRatio="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="menuGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#342F89" />
            </linearGradient>
          </defs>
          <path ref={menuBgRef} fill="url(#menuGradient)" d="M1131,0 Q565.5,0 0,0 L0,0 L1131,0 Z" />
        </svg>

        <div className={`${styles.menuCol} ${styles.menuColInfo}`}>
          <p ref={(el) => { infoItemsRef.current[0] = el; }} className={styles.infoItem}>
            Get in touch
          </p>
          <h3 ref={(el) => { infoItemsRef.current[1] = el; }} className={styles.infoItem}>
            studio@unltd.io
          </h3>
          <h3 ref={(el) => { infoItemsRef.current[2] = el; }} className={styles.infoItem}>
            +44 (0) 20 7123 4567
          </h3>
          <br />
          <h6 ref={(el) => { infoItemsRef.current[3] = el; }} className={styles.infoItem}>
            UNLTD Innovation Hub
          </h6>
          <h6 ref={(el) => { infoItemsRef.current[4] = el; }} className={styles.infoItem}>
            London, UK
          </h6>
        </div>

        <div className={`${styles.menuCol} ${styles.menuColLinks}`}>
          {['HOME', 'SOLUTIONS', 'PRODUCTS', 'PROJECTS', 'ABOUT', 'CONTACT'].map((text, i) => (
            <a
              key={text}
              href={`#${text.toLowerCase()}`}
              ref={(el) => { menuLinksRef.current[i] = el; }}
            >
              {text}
            </a>
          ))}
        </div>
      </div>
    </>
  );
}
