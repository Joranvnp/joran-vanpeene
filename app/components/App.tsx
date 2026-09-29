'use client';

/**
 * App.tsx — composant client principal du portfolio.
 *
 * Contient l'ensemble de l'expérience : curseur magnétique, navbar, hero animé,
 * sections (Projets, À propos, Services, Brief, Lab, Contact) et le setup
 * initial des variables CSS de thème (dark par défaut).
 *
 * Les API serverless sont dans app/api/audit/route.ts et app/api/brief/route.ts.
 */

import { useState, useEffect, useRef, useMemo } from 'react';
import Image from 'next/image';
import projectData from '../../data/projects.json';

const clamp = (v, mn, mx) => Math.max(mn, Math.min(mx, v));
const lerp = (a, b, t) => a + (b - a) * t;

function MagneticCursor() {
  const dotRef = useRef(null);
  const ringRef = useRef(null);
  const state = useRef({ x: 0, y: 0, rx: 0, ry: 0, hovering: false, label: '' });
  const [label, setLabel] = useState('');

  useEffect(() => {
    const onMove = (e) => { state.current.x = e.clientX; state.current.y = e.clientY; };
    const onOver = (e) => {
      const t = e.target.closest?.('[data-cursor]');
      if (t) {
        state.current.hovering = true;
        const l = t.getAttribute('data-cursor') || '';
        if (l !== state.current.label) { state.current.label = l; setLabel(l); }
      }
    };
    const onOut = (e) => {
      const t = e.target.closest?.('[data-cursor]');
      if (t) { state.current.hovering = false; state.current.label = ''; setLabel(''); }
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseover', onOver);
    window.addEventListener('mouseout', onOut);

    let raf;
    const tick = () => {
      const s = state.current;
      s.rx = lerp(s.rx, s.x, 0.18);
      s.ry = lerp(s.ry, s.y, 0.18);
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${s.x}px,${s.y}px,0) translate(-50%,-50%)`;
      if (ringRef.current) {
        const scale = s.hovering ? 2.6 : 1;
        ringRef.current.style.transform = `translate3d(${s.rx}px,${s.ry}px,0) translate(-50%,-50%) scale(${scale})`;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseover', onOver);
      window.removeEventListener('mouseout', onOut);
    };
  }, []);

  return (
    <>
      <div ref={ringRef} className="cursor-ring" />
      <div ref={dotRef} className="cursor-dot">{label && <span className="cursor-label">{label}</span>}</div>
    </>
  );
}

function Halo() {
  return (
    <div className="halo" aria-hidden="true">
      <div className="halo-blob halo-blob-1" />
      <div className="halo-blob halo-blob-2" />
      <div className="halo-noise" />
    </div>
  );
}

/* ── MagneticButton — cursor attracts the button with a soft spring ── */
function MagneticButton({ children, href, className, cursor, strength = 26 }) {
  const ref = useRef(null);
  const pos = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const [hov, setHov] = useState(false);

  useEffect(() => {
    let raf;
    const tick = () => {
      pos.current.x += (pos.current.tx - pos.current.x) * 0.18;
      pos.current.y += (pos.current.ty - pos.current.y) * 0.18;
      if (ref.current) {
        ref.current.style.transform = `translate3d(${pos.current.x}px, ${pos.current.y}px, 0)`;
        const inner = ref.current.querySelector('.btn-label, span');
        if (inner && inner.classList.contains('btn-label')) {
          inner.style.transform = `translate3d(${pos.current.x * 0.4}px, ${pos.current.y * 0.4}px, 0)`;
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const onMove = (e) => {
    const r = ref.current.getBoundingClientRect();
    const nx = (e.clientX - (r.left + r.width / 2)) / r.width;
    const ny = (e.clientY - (r.top + r.height / 2)) / r.height;
    pos.current.tx = nx * strength;
    pos.current.ty = ny * strength;
  };
  const onLeave = () => { pos.current.tx = 0; pos.current.ty = 0; setHov(false); };

  return (
    <a href={href} className={`magnetic ${className || ''} ${hov ? 'is-hov' : ''}`} data-cursor={cursor}
       ref={ref}
       onMouseEnter={() => setHov(true)}
       onMouseMove={onMove}
       onMouseLeave={onLeave}>
      {children}
    </a>
  );
}

/* ── ScrollRevealText — word-by-word gradient opacity reveal on scroll ── */
function ScrollRevealText({ children, className }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf;
    const tick = () => {
      if (ref.current) {
        const r = ref.current.getBoundingClientRect();
        const vh = window.innerHeight;
        // start when bottom of text enters 80% of viewport, finish when top hits 25%
        const start = vh * 0.85;
        const end = vh * 0.25;
        const raw = (start - r.top) / (start - end + r.height * 0.3);
        setProgress(Math.max(0, Math.min(1, raw)));
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const text = typeof children === 'string' ? children : '';
  const words = text.split(/(\s+)/);
  const active = Math.floor(progress * words.length);

  return (
    <p ref={ref} className={`reveal-text ${className || ''}`}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <span key={i}>{w}</span>;
        const isActive = i <= active;
        const isEdge = i === active + 1;
        const op = isActive ? 1 : isEdge ? 0.55 : 0.18;
        return <span key={i} className="reveal-word" style={{ opacity: op, filter: isActive ? 'none' : 'blur(0.4px)' }}>{w}</span>;
      })}
    </p>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [now, setNow] = useState('');
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll();
    window.addEventListener('scroll', onScroll);
    const update = () => {
      const d = new Date();
      setNow(d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }));
    };
    update();
    const id = setInterval(update, 15000);
    return () => { window.removeEventListener('scroll', onScroll); clearInterval(id); };
  }, []);

  return (
    <nav className={`nav ${scrolled ? 'nav-scrolled' : ''}`}>
      <a href="#top" className="nav-logo" data-cursor="home">
        <span className="nav-logo-mark">
          <svg viewBox="0 0 28 28" width="24" height="24" aria-hidden="true">
            <rect x="0.75" y="0.75" width="26.5" height="26.5" rx="6" fill="none" stroke="currentColor" strokeWidth="1.1" opacity="0.35"/>
            <path d="M7 7 L12 7" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M9.5 7 L9.5 17.5 Q 9.5 20 6.75 20 Q 4.5 20 4 17.5" fill="none" stroke="var(--accent)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M14.5 7 L18.75 20 L23 7" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
        <span className="nav-logo-text">Joran Vanpeene</span>
        <span className="nav-logo-dot" />
      </a>
      <div className="nav-center">
        <a href="#work" data-cursor="→">Projets</a>
        <a href="#about" data-cursor="→">À propos</a>
        <a href="#services" data-cursor="→">Services</a>
        <a href="#devis" data-cursor="→">Brief</a>
        <a href="#lab" data-cursor="→">Outils</a>
        <a href="#contact" data-cursor="→">Contact</a>
      </div>
      <div className="nav-right">
        <span className="nav-clock"><span className="nav-clock-dot" />Aigre · {now}</span>
        <a href="#contact" className="nav-cta" data-cursor="démarrer">
          <span>Démarrer</span>
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 10L10 2M10 2H4M10 2V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </a>
      </div>
    </nav>
  );
}

function Hero() {
  const heroRef = useRef(null);
  const kickerRef = useRef(null);
  const titleRef = useRef(null);
  const metaRef = useRef(null);
  const marqueeRef = useRef(null);
  const innerRef = useRef(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e) => {
      if (!heroRef.current) return;
      const r = heroRef.current.getBoundingClientRect();
      setMouse({ x: (e.clientX - r.left - r.width / 2) / r.width, y: (e.clientY - r.top - r.height / 2) / r.height });
    };
    let raf;
    let current = 0;
    const tick = () => {
      const target = window.scrollY;
      current += (target - current) * 0.14;
      const s = current;
      const kickerY = Math.min(s * 0.22, 140);
      const titleY = Math.min(s * 0.14, 90);
      const metaY = Math.min(s * 0.08, 50);
      const marqueeY = Math.min(s * 0.04, 20);
      const op = Math.max(1 - s / 700, 0);
      if (kickerRef.current) kickerRef.current.style.transform = `translate3d(0, ${-kickerY}px, 0)`;
      if (titleRef.current) titleRef.current.style.transform = `translate3d(0, ${-titleY}px, 0)`;
      if (metaRef.current) metaRef.current.style.transform = `translate3d(0, ${-metaY}px, 0)`;
      if (marqueeRef.current) marqueeRef.current.style.transform = `translate3d(0, ${-marqueeY}px, 0)`;
      if (innerRef.current) innerRef.current.style.opacity = op;
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    window.addEventListener('mousemove', onMove);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
    };
  }, []);

  return (
    <section id="top" ref={heroRef} className="hero">
      <Halo />
      <div className="hero-grid" aria-hidden="true" />
      <div className="hero-top-row">
        <span className="mono-label"><span className="dot-live" /> Disponible · mai 2026</span>
        <span className="mono-label">Portfolio / 2026</span>
      </div>
      <div className="hero-inner" ref={innerRef}>
        <div className="hero-kicker" ref={kickerRef}>
          <span className="mono-label">Développeur web Full Stack & IA — Charente (16)</span>
        </div>
        <h1 className="hero-title" ref={titleRef}>
          <span className="hero-line"><span className="hero-word">Je construis</span></span>
          <span className="hero-line"><span className="hero-word hero-word-italic">des sites</span><span className="hero-word">&nbsp;qui</span></span>
          <span className="hero-line">
            <span className="hero-word">font&nbsp;</span>
            <span className="hero-accent" style={{ transform: `translate(${mouse.x * 14}px, ${mouse.y * 10}px)` }}>
              <span className="hero-accent-inner">la différence</span>
              <svg className="hero-accent-swoop" viewBox="0 0 220 24" preserveAspectRatio="none">
                <path d="M2 18 Q 60 4, 110 12 T 218 8" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"/>
              </svg>
            </span>
          </span>
        </h1>
        <div className="hero-meta" ref={metaRef}>
          <p className="hero-sub">
            Sites vitrines, boutiques en ligne et outils métier pour entreprises, commerces et marques indépendantes.
            Clairs, rapides, sans blabla technique — <em>pensés pour transformer vos visiteurs en clients</em>.
          </p>
          <div className="hero-actions">
            <MagneticButton href="#work" className="btn btn-primary" cursor="voir">
              <span className="btn-label">Voir les projets</span>
              <span className="btn-arrow"><svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 11L11 3M11 3H5M11 3V9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg></span>
            </MagneticButton>
            <MagneticButton href="#contact" className="btn btn-ghost" cursor="écrire"><span>Prendre contact</span></MagneticButton>
          </div>
        </div>
      </div>
      <div className="marquee" aria-hidden="true" ref={marqueeRef}>
        <div className="marquee-track">
          {Array.from({ length: 2 }).map((_, k) => (
            <div key={k} className="marquee-group">
              <span>React</span><span className="marquee-bullet">●</span>
              <span>TypeScript</span><span className="marquee-bullet">●</span>
              <span>Next.js</span><span className="marquee-bullet">●</span>
              <span>Framer Motion</span><span className="marquee-bullet">●</span>
              <span>Tailwind</span><span className="marquee-bullet">●</span>
              <span>Three.js</span><span className="marquee-bullet">●</span>
              <span>Figma</span><span className="marquee-bullet">●</span>
              <span>WebGL</span><span className="marquee-bullet">●</span>
              <span>GSAP</span><span className="marquee-bullet">●</span>
              <span>Supabase</span><span className="marquee-bullet">●</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// Edit project content in data/projects.json; add screenshots to public/projects/.
const PROJECTS = projectData.filter(project => project.visible !== false);

function ProjectVisual({ project, index }) {
  const [failed, setFailed] = useState(false);
  const src = /^\/projects\/[^?#]+\.(png|jpe?g|webp|avif)$/i.test(project.image) ? project.image : '';
  return (
    <div className="project-visual" style={{ backgroundColor: project.color }}>
      {src && !failed ? <Image src={src} alt={project.imageAlt || `Aperçu de ${project.title}`}
        width={1280} height={900} sizes="(max-width: 820px) 90vw, 360px" onError={() => setFailed(true)} /> :
        <div className="project-placeholder">
          <span className="project-placeholder-top">{project.comingSoon ? 'Présentation à venir' : 'Aperçu à venir'}</span>
          <span className="project-placeholder-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
          <span className="project-placeholder-bottom">{project.title}</span>
        </div>}
    </div>
  );
}

function WorkSection() {
  const [hover, setHover] = useState<number | null>(null);
  const [enhanced, setEnhanced] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);
  const position = useRef({ x: 0, y: 0, targetX: 0, targetY: 0, initialized: false });
  const hasProjects = PROJECTS.some(project => !project.comingSoon);

  useEffect(() => {
    const media = window.matchMedia('(min-width: 821px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => { setEnhanced(media.matches); setHover(null); };
    update(); media.addEventListener('change', update);
    const hide = () => setHover(null);
    window.addEventListener('scroll', hide, { passive: true });
    window.addEventListener('blur', hide);
    return () => { media.removeEventListener('change', update); window.removeEventListener('scroll', hide); window.removeEventListener('blur', hide); };
  }, []);

  const active = enhanced && hover !== null;
  useEffect(() => {
    if (!active) return;
    let frame = 0;
    const tick = () => {
      const p = position.current;
      p.x += (p.targetX - p.x) * .16;
      p.y += (p.targetY - p.y) * .16;
      if (previewRef.current) previewRef.current.style.transform = `translate3d(${p.x}px, ${p.y}px, 0)`;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active]);

  const move = (event, index: number) => {
    if (!enhanced || event.pointerType === 'touch') return;
    const p = position.current;
    p.targetX = clamp(event.clientX - 180, 16, window.innerWidth - 376);
    p.targetY = clamp(event.clientY - 150, 96, Math.max(96, window.innerHeight - 316));
    if (!p.initialized) { p.x = p.targetX; p.y = p.targetY; p.initialized = true; }
    setHover(index);
  };

  return (
    <section id="work" className={`work work-gallery ${enhanced ? 'work-gallery-enhanced' : ''}`} onKeyDown={event => { if (event.key === 'Escape') setHover(null); }}>
      <div className="section-head">
        <div className="section-head-left">
          <span className="mono-label">§ 02 · Projets sélectionnés</span>
          <h2 className="section-title">Des idées, <br/><em>des réalisations.</em></h2>
        </div>
        <div className="section-head-right"><p>{hasProjects
          ? 'Une sélection de projets : leur contexte, les choix de conception et le résultat.'
          : 'Les premières présentations de projets arrivent bientôt.'}</p></div>
      </div>
      <ul className="work-list" onPointerLeave={() => setHover(null)} onPointerCancel={() => setHover(null)}>
        {PROJECTS.map((project, index) => {
          let url = '';
          try { const parsed = new URL(project.url); if (['http:', 'https:'].includes(parsed.protocol)) url = parsed.href; } catch { /* no public link yet */ }
          if (project.comingSoon) url = '';
          const content = <>
            <span className="work-num">({String(index + 1).padStart(2, '0')})</span>
            <span className="project-title-group"><span className="work-title">{project.title}</span><span className="project-mobile-kind">{project.category}</span></span>
            <span className="work-kind">{project.category}</span><span className="work-year">{project.year}</span>
            <span className="work-arrow" aria-hidden="true">{url ? '↗' : '—'}</span>
          </>;
          return <li key={project.id} className={`work-row ${hover === index ? 'work-row-hover' : ''} ${active && hover !== index ? 'work-row-dim' : ''}`}
            onPointerEnter={event => move(event, index)} onPointerMove={event => move(event, index)}>
            {url ? <a href={url} target="_blank" rel="noopener noreferrer" className="work-row-inner" data-cursor="voir" aria-label={`${project.title} — ouvrir le site dans un nouvel onglet`}>{content}</a>
              : <div className="work-row-inner" tabIndex={0} aria-label={`${project.title} — ${project.category}`}>{content}</div>}
            {project.description && <p className="project-description">{project.description}</p>}
            <div className="project-inline"><ProjectVisual key={project.image} project={project} index={index}/>
              {project.tags.length > 0 && <div className="project-tags">{project.tags.map(tag => <span key={tag}>{tag}</span>)}</div>}
            </div>
          </li>;
        })}
      </ul>
      <div className="project-follow" ref={previewRef} aria-hidden="true">
        <div className={`project-follow-window ${active ? 'is-visible' : ''}`}>
          <div className="project-slides" style={{ transform: `translateY(-${(hover ?? 0) * 100}%)` }}>
            {PROJECTS.map((project, index) => <div className="project-slide" key={project.id}>
              <ProjectVisual key={project.image} project={project} index={index}/>
              <div className="project-slide-caption"><span>{project.category}</span><span>{project.comingSoon ? 'Bientôt' : 'Aperçu du projet'}</span></div>
            </div>)}
          </div>
        </div>
      </div>
      <div className="work-foot"><span className="mono-label">{hasProjects ? `${PROJECTS.filter(project => !project.comingSoon).length} projet(s) présenté(s)` : 'Nouveaux projets bientôt disponibles'}</span>
        <a href="#contact" className="link-plain" data-cursor="→">Discuter d’un projet →</a></div>
    </section>
  );
}

function AboutSection() {
  return (
    <section id="about" className="about">
      <div className="section-head">
        <div className="section-head-left">
          <span className="mono-label">§ 03 · À propos</span>
          <h2 className="section-title">Un humain, <em>pas une agence.</em></h2>
        </div>
      </div>
      <div className="about-grid">
        <div className="about-portrait">
          <div className="about-id-card">
            <div className="about-id-top">
              <span className="mono-label">IDENTITÉ · FR · 2026</span>
              <span className="about-id-chip" />
            </div>
            <div className="about-id-monogram" aria-hidden="true">
              <svg viewBox="0 0 200 200" width="100%" height="100%">
                <defs>
                  <pattern id="dots" width="8" height="8" patternUnits="userSpaceOnUse">
                    <circle cx="1" cy="1" r="0.8" fill="currentColor" opacity="0.35"/>
                  </pattern>
                </defs>
                <rect x="0" y="0" width="200" height="200" fill="url(#dots)" color="var(--fg-2)"/>
                <text x="100" y="138" textAnchor="middle"
                  fontFamily="Fraunces, serif" fontStyle="italic" fontWeight="300"
                  fontSize="170" letterSpacing="-8" fill="var(--accent)">J</text>
                <text x="100" y="138" textAnchor="middle"
                  fontFamily="Inter Tight, sans-serif" fontWeight="700"
                  fontSize="170" letterSpacing="-8" fill="none" stroke="var(--fg)" strokeWidth="1.2">V</text>
              </svg>
            </div>
            <div className="about-id-sig">
              <svg viewBox="0 0 200 40" preserveAspectRatio="none" width="100%" height="40">
                <path d="M6 26 C 18 10, 28 32, 40 22 S 56 12, 66 20 C 76 28, 86 16, 96 22 S 118 30, 130 18 C 142 6, 158 24, 170 20 L 190 18"
                  fill="none" stroke="var(--fg)" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
              <span className="mono-label">signé main · avril 2026</span>
            </div>
            <div className="about-id-rows">
              <div><span>Nom</span><b>Vanpeene, Joran</b></div>
              <div><span>Métier</span><b>Dev & design web</b></div>
              <div><span>Lieu</span><b>Aigre, Charente · 45.89°N / 0.01°E</b></div>
              <div><span>Depuis</span><b>2022 — indépendant</b></div>
            </div>
            <div className="about-id-foot">
              <span className="mono-label">— n° 001 / 001 —</span>
            </div>
          </div>
        </div>
        <div className="about-copy">
          <ScrollRevealText className="about-lead">
            Bonjour, je suis Joran Vanpeene. Depuis quatre ans, je conçois et développe des sites et des outils web pour des entreprises et indépendants qui veulent un résultat à la hauteur de leur activité. Basé en Charente, je travaille avec des clients partout en France.
          </ScrollRevealText>
          <p>Ce qui compte pour moi : un site qui vous ressemble, qui charge vite, que Google comprend, et qui convertit vos visiteurs en clients. Chaque outil est choisi en fonction de votre projet — jamais par habitude ou par effet de mode.</p>
          <div className="about-meta">
            <div><span className="mono-label">Basé à</span><b>Aigre (16)</b></div>
            <div><span className="mono-label">Clients</span><b>FR · UE · CA</b></div>
            <div><span className="mono-label">Dispo</span><b>Mai 2026</b></div>
            <div><span className="mono-label">Engagement</span><b>à l'appel</b></div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ServicesSection() {
  const items = [
    { num: '01', title: 'Identité de marque', desc: "Votre image, votre ton, vos couleurs, votre typographie. Un univers cohérent qui vous distingue — la base avant de construire quoi que ce soit.", bullets: ['Positionnement', 'Logo & direction visuelle', 'Charte graphique simple'] },
    { num: '02', title: 'Sites web sur-mesure', desc: 'Site vitrine, boutique en ligne, page de campagne. Rapides, accessibles sur téléphone, bien référencés sur Google.', bullets: ['Design unique, pas de template', 'Optimisé téléphone & tablette', 'Référencement Google'] },
    { num: '03', title: 'Outils métier sur-mesure', desc: "Petites applications pour automatiser ce qui vous fait perdre du temps : devis, prise de rendez-vous, catalogue, tableau de bord interne.", bullets: ['Gain de temps quotidien', 'Paiements en ligne sécurisés', 'Formé pour gérer soi-même'] },
    { num: '04', title: 'Refonte & conseil', desc: "Votre site actuel peut mieux faire ? On regarde ensemble ce qui fonctionne, ce qui freine, et on décide de la meilleure stratégie — parfois sans tout recommencer.", bullets: ['Audit complet', "Plan d'action clair", 'Accompagnement sur la durée'] },
  ];
  return (
    <section id="services" className="services">
      <div className="section-head">
        <div className="section-head-left">
          <span className="mono-label">§ 04 · Services</span>
          <h2 className="section-title">Ce que je fais, <em>concrètement.</em></h2>
        </div>
        <div className="section-head-right">
          <p>Quatre domaines d'expertise, souvent combinés. Chaque projet commence par un appel de 15 minutes pour comprendre votre besoin — offert, sans engagement.</p>
        </div>
      </div>
      <div className="services-grid">
        {items.map(it => (
          <div key={it.num} className="service-card" data-cursor="→">
            <div className="service-num">{it.num}</div>
            <h3 className="service-title">{it.title}</h3>
            <p className="service-desc">{it.desc}</p>
            <ul className="service-bullets">{it.bullets.map(b => <li key={b}>{b}</li>)}</ul>
            <div className="service-corner">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 13L13 3M13 3H6M13 3V10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/></svg>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function QuoteSection() {
  // Brief express — 4 étapes → brief généré + envoyé par mail
  const types = [
    { id: 'vitrine', label: 'Site vitrine', desc: 'Présenter votre activité, récupérer des contacts.', tag: 'Le plus demandé' },
    { id: 'ecom', label: 'Boutique en ligne', desc: 'Vendre vos produits ou services sur Internet.', tag: null },
    { id: 'outil', label: 'Outil métier', desc: 'Automatiser un processus : devis, rendez-vous, gestion.', tag: 'Forte valeur' },
    { id: 'refonte', label: 'Refonte', desc: "Vous avez déjà un site, il mérite mieux.", tag: null },
  ];
  const goals = [
    { id: 'leads', label: 'Générer des contacts / leads' },
    { id: 'vendre', label: 'Vendre en ligne' },
    { id: 'credibilite', label: 'Gagner en crédibilité' },
    { id: 'seo', label: 'Être trouvé sur Google' },
    { id: 'automatiser', label: 'Automatiser du travail manuel' },
    { id: 'fideliser', label: 'Fidéliser les clients existants' },
  ];
  const contexts = [
    { id: 'solo', label: 'Je démarre', desc: 'Projet personnel, freelance, lancement.' },
    { id: 'tpe', label: "J'ai une activité", desc: 'TPE, commerce, indépendant.' },
    { id: 'pme', label: 'Petite équipe', desc: 'PME, association, structure établie.' },
  ];

  const [step, setStep] = useState(0);
  const [type, setType] = useState('vitrine');
  const [pickedGoals, setPickedGoals] = useState(new Set(['leads']));
  const [context, setContext] = useState('tpe');
  const [details, setDetails] = useState('');
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  const toggleGoal = (id) => {
    const n = new Set(pickedGoals);
    if (n.has(id)) n.delete(id); else n.add(id);
    setPickedGoals(n);
  };

  const completion = useMemo(() => {
    let n = 0;
    if (type) n++;
    if (pickedGoals.size > 0) n++;
    if (context) n++;
    if (details.trim().length >= 10) n++;
    return n;
  }, [type, pickedGoals, context, details]);

  const submit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    const goals = [...pickedGoals];
    const payload = { type, goals, context, details, email };
    try {
      const resp = await fetch('/api/brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error('backend ko');
      setSent(true);
    } catch (err) {
      console.error('[brief] erreur d\'envoi:', err);
      alert("L'envoi a échoué. Vous pouvez aussi me contacter directement à joran.vanpeene@gmail.com");
    }
  };

  const reset = () => {
    setStep(0); setType('vitrine'); setPickedGoals(new Set(['leads']));
    setContext('tpe'); setDetails(''); setEmail(''); setSent(false);
  };

  return (
    <section id="devis" className="brief">
      <div className="section-head">
        <div className="section-head-left">
          <span className="mono-label">§ 05 · Brief de projet</span>
          <h2 className="section-title">
            Parlons de votre projet, <em>sérieusement.</em><br/>
            <span className="section-title-small">Quatre questions pour préparer notre échange.</span>
          </h2>
        </div>
        <div className="section-head-right">
          <p>Avant d'en discuter, j'ai besoin de comprendre l'essentiel de votre projet. En quelques minutes, vous m'en dites assez pour que je prépare des pistes concrètes pour notre premier échange — 15 minutes, offert, sans engagement.</p>
        </div>
      </div>

      <div className="brief-frame">
        {/* Topbar — tabs + live preview */}
        <div className="brief-topbar">
          <div className="brief-tabs">
            {['Projet', 'Objectifs', 'Contexte', 'Détails'].map((s, i) => (
              <button
                key={s}
                className={`brief-tab ${step === i ? 'active' : ''} ${i < step ? 'done' : ''}`}
                onClick={() => setStep(i)}
                data-cursor="→"
              >
                <span className="brief-tab-num">0{i + 1}</span>
                <span className="brief-tab-label">{s}</span>
              </button>
            ))}
          </div>
          <div className="brief-live">
            <span className="brief-live-label">Complétion</span>
            <div className="brief-live-bar">
              <div className="brief-live-fill" style={{ width: (completion / 4 * 100) + '%' }} />
            </div>
            <span className="brief-live-count">{completion}/4</span>
          </div>
        </div>

        {/* Body */}
        <div className="brief-body">
          {step === 0 && (
            <div className="brief-grid-2">
              {types.map(t => (
                <button
                  key={t.id}
                  className={`brief-option ${type === t.id ? 'selected' : ''}`}
                  onClick={() => setType(t.id)}
                  data-cursor="choisir"
                >
                  {t.tag && <span className="brief-option-tag">{t.tag}</span>}
                  <div className="brief-option-head">
                    <span className="brief-option-label">{t.label}</span>
                  </div>
                  <p className="brief-option-desc">{t.desc}</p>
                  <div className="brief-option-check">
                    {type === t.id ? '●' : '○'}
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 1 && (
            <div className="brief-grid-3">
              {goals.map(g => (
                <button
                  key={g.id}
                  className={`brief-addon ${pickedGoals.has(g.id) ? 'selected' : ''}`}
                  onClick={() => toggleGoal(g.id)}
                  data-cursor={pickedGoals.has(g.id) ? 'retirer' : 'ajouter'}
                >
                  <div className="brief-addon-box">
                    {pickedGoals.has(g.id) ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 7.5L5.5 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    ) : <span className="brief-addon-plus">+</span>}
                  </div>
                  <div className="brief-addon-text">
                    <span className="brief-addon-label">{g.label}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {step === 2 && (
            <div className="brief-grid-3">
              {contexts.map(c => (
                <button
                  key={c.id}
                  className={`brief-option brief-timeline ${context === c.id ? 'selected' : ''}`}
                  onClick={() => setContext(c.id)}
                  data-cursor="choisir"
                >
                  <div className="brief-option-head">
                    <span className="brief-option-label">{c.label}</span>
                  </div>
                  <p className="brief-option-desc">{c.desc}</p>
                  <div className="brief-option-check">{context === c.id ? '●' : '○'}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && !sent && (
            <div className="brief-summary">
              <div className="brief-summary-left">
                <div className="brief-sum-row">
                  <span className="brief-sum-key">Projet</span>
                  <span className="brief-sum-val">{types.find(x => x.id === type)?.label}</span>
                </div>
                <div className="brief-sum-row">
                  <span className="brief-sum-key">Objectifs</span>
                  <span className="brief-sum-val">
                    {pickedGoals.size === 0 ? <em>À préciser</em> : Array.from(pickedGoals).map(id => goals.find(g => g.id === id)?.label).join(' · ')}
                  </span>
                </div>
                <div className="brief-sum-row">
                  <span className="brief-sum-key">Contexte</span>
                  <span className="brief-sum-val">{contexts.find(x => x.id === context)?.label}</span>
                </div>
                <div className="brief-sum-row brief-sum-details">
                  <span className="brief-sum-key">Un mot sur votre idée</span>
                  <textarea
                    className="brief-details-input"
                            placeholder="Décrivez en quelques mots votre activité, le problème que vous cherchez à résoudre, ou une contrainte particulière. Plus vous partagez de contexte, mieux je prépare notre échange."
                    value={details}
                    onChange={e => setDetails(e.target.value)}
                    rows={4}
                  />
                </div>
                <p className="brief-disclaimer">
                  <span className="mono-label">★ Transparence sur le budget</span>
                  Je n'affiche pas de grille tarifaire, volontairement. Chaque projet est unique, et le tarif juste dépend de votre réalité — pas d'une case dans un tableau. Pour vous donner un ordre d'idée, mes projets s'échelonnent généralement de <em>2 000 € à 15 000 € et plus</em>. On en parle ensemble, en toute transparence, lors de l'appel.
                </p>
              </div>
              <form className="brief-send" onSubmit={submit}>
                <div className="brief-send-preview">
                  <span className="mono-label">★ Ce que vous recevrez</span>
                  <ul>
                    <li>Un récapitulatif structuré de votre brief</li>
                    <li>Deux ou trois pistes concrètes, adaptées à votre projet</li>
                    <li>Un créneau pour notre appel, proposé sous 24h</li>
                  </ul>
                </div>
                <label className="brief-send-label">
                  <span className="mono-label">Votre email</span>
                  <input
                    type="email"
                    placeholder="vous@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="brief-send-input"
                    required
                  />
                </label>
                <button type="submit" className="brief-send-cta" data-cursor="envoyer">
                  <span>Envoyer mon brief</span>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </button>
                <p className="brief-send-note">Aucun spam. Je réponds personnellement à chaque message.</p>
              </form>
            </div>
          )}

          {step === 3 && sent && (
            <div className="brief-sent">
              <div className="brief-sent-mark">
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none"><path d="M5 15L11 21L23 7" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              </div>
              <h3 className="brief-sent-title">Bien reçu, {email.split('@')[0]}.</h3>
              <p className="brief-sent-text">Je prends connaissance de votre brief, je prépare quelques pistes adaptées à votre projet, et je reviens vers vous sous 24h avec un créneau pour notre appel. Vous pouvez compléter votre brief à tout moment en répondant directement au mail que vous venez de recevoir.</p>
              <button onClick={reset} className="brief-sent-reset" data-cursor="recommencer">Soumettre un autre projet</button>
            </div>
          )}
        </div>

        {/* Nav */}
        <div className="brief-nav">
          <button
            className="brief-nav-btn"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            data-cursor="précédent"
          >
            ← Précédent
          </button>
          <div className="brief-nav-center">
            <span className="brief-nav-dots">
              {[0,1,2,3].map(i => <span key={i} className={`brief-nav-dot ${i === step ? 'on' : ''} ${i < step ? 'done' : ''}`} />)}
            </span>
          </div>
          {step < 3 ? (
            <button className="brief-nav-btn brief-nav-next" onClick={() => setStep(step + 1)} data-cursor="suivant">
              Suivant →
            </button>
          ) : (
            <button className="brief-nav-btn brief-nav-next" onClick={reset} data-cursor="reset" disabled={!sent}>
              ↻ Nouveau
            </button>
          )}
        </div>
      </div>
    </section>
  );
}


function LabSection() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('intro');
  const inFlight = useRef(false);

  const audit = async () => {
    if (inFlight.current) return;
    if (!url.trim()) { setError('Indiquez une adresse de site.'); return; }
    inFlight.current = true;
    setError(''); setLoading(true); setTab('running'); setResult(null);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25_000);
    try {
      const resp = await fetch('/api/audit', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim() }), signal: controller.signal,
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !Array.isArray(data?.checks)) {
        throw new Error(data?.error || 'Le diagnostic est temporairement indisponible. Réessayez plus tard.');
      }
      setResult(data); setTab('result');
    } catch (e) {
      setError(e.name === 'AbortError' ? 'Le site met trop de temps à répondre. Réessayez plus tard.' : e.message);
      setTab('intro');
    } finally { clearTimeout(timeout); setLoading(false); inFlight.current = false; }
  };
  const reset = () => { setTab('intro'); setResult(null); setUrl(''); setError(''); };
  const statusLabel = { pass: 'Validé', warning: 'À examiner', info: 'À savoir' };

  return (
    <section id="lab" className="lab">
      <div className="section-head">
        <div className="section-head-left">
          <span className="mono-label">§ 06 · Lab — outil intégré</span>
          <h2 className="section-title">Votre site, <em>vu de près.</em><br/>
            <span className="section-title-small">Un premier diagnostic, des constats vérifiables.</span>
          </h2>
        </div>
        <div className="section-head-right">
          <p>Entrez l’adresse d’une page publique. L’outil consulte son HTML et vérifie dix points simples : référencement, structure et premiers repères d’accessibilité. Chaque remarque s’appuie sur ce qu’il trouve.</p>
        </div>
      </div>
      <div className="lab-stage">
        <div className="lab-window">
          <div className="lab-window-bar">
            <div className="lab-dots" aria-hidden="true"><i/><i/><i/></div>
            <div className="lab-url"><span className="lab-url-text">Diagnostic de page web</span></div>
            <div className="lab-meta">HTML · 10 contrôles</div>
          </div>
          <div className="lab-content" aria-busy={loading}>
            {tab === 'intro' && (
              <div className="lab-intro"><div className="lab-intro-inner">
                <div className="lab-badge">Lecture réelle de la page · sans IA</div>
                <h3 className="lab-h">Que peut-on améliorer sur votre page ?</h3>
                <p className="lab-p" id="audit-help">Titre, description, HTTPS, images, liens… Recevez les constats et jusqu’à trois pistes d’action prioritaires. Ce diagnostic porte sur une seule page, sans mesurer sa vitesse d’affichage.</p>
                <form className="lab-form" onSubmit={e => { e.preventDefault(); audit(); }}>
                  <div className="lab-input">
                    <input aria-label="Adresse de la page à analyser" aria-describedby="audit-help" aria-invalid={!!error}
                      value={url} onChange={e => setUrl(e.target.value)} placeholder="https://votre-site.fr"
                      autoComplete="url" inputMode="url" maxLength={1500} required disabled={loading} />
                  </div>
                  <button className="btn btn-primary" type="submit" disabled={loading} data-cursor="go">
                    <span className="btn-label">Analyser la page</span><span className="btn-arrow" aria-hidden="true">↗</span>
                  </button>
                </form>
                {error && <div className="lab-error" role="alert">{error}</div>}
                <div className="lab-examples"><span className="mono-label">Un exemple :</span>
                  <button className="lab-chip" onClick={() => setUrl('https://joran-vanpeene.fr')}>Mon portfolio</button>
                </div>
              </div></div>
            )}
            {tab === 'running' && (
              <div className="lab-running" role="status" aria-live="polite">
                <div className="lab-run-scan" aria-hidden="true"><div className="lab-run-grid">
                  {Array.from({ length: 40 }).map((_, i) => <div key={i} className="lab-run-cell" style={{ animationDelay: `${(i % 8) * 50}ms` }} />)}
                </div><div className="lab-run-scanline" /></div>
                <div className="lab-run-log">
                  <div className="lab-log-line lab-log-live"><span className="lab-log-spin" aria-hidden="true" /> Consultation et analyse en cours…</div>
                  <p className="audit-note">L’outil attend la réponse de la page et vérifie son contenu. Cela peut prendre quelques secondes.</p>
                </div>
              </div>
            )}
            {tab === 'result' && result && (
              <div className="lab-result">
                <div className="lab-result-head">
                  <div><span className="mono-label">Page consultée</span><div className="lab-result-url">{result.url}</div></div>
                  <div className="audit-count" role="status" aria-live="polite">
                    <strong>{result.passed}<span> / {result.checked}</span></strong><span>contrôles validés</span>
                  </div>
                </div>
                <div className="audit-context">
                  <span>Consultée le {new Date(result.fetchedAt).toLocaleString('fr-FR')}</span>
                  <span>HTTP {result.httpStatus} · HTML : {Math.round(result.htmlBytes / 1024)} Ko</span>
                  {result.redirects > 0 && <span>{result.redirects} redirection(s) suivie(s)</span>}
                </div>
                <p className="lab-summary">{result.summary}</p>
                {result.notAssessed > 0 && <p className="audit-note">{result.notAssessed} contrôle(s) informatif(s) ou non applicable(s), exclus du total. Dix points examinés au départ.</p>}
                {result.partial && <p className="audit-notice">Le HTML reçu contient peu de texte et des scripts. Une partie du contenu peut apparaître seulement après exécution de JavaScript : le diagnostic est partiel.</p>}
                {result.improvements.length > 0 && <>
                  <h3 className="audit-subtitle">Par où commencer</h3>
                  <div className="lab-improvements">
                    {result.improvements.map((item, i) => <div key={item.id} className="lab-imp">
                      <div className="lab-imp-head"><span className="lab-imp-num">0{i + 1}</span><h4>{item.title}</h4></div>
                      <span className="audit-priority">Priorité {item.priority}</span>
                      <p><strong>Constat.</strong> {item.evidence}</p><p><strong>Action.</strong> {item.action}</p>
                    </div>)}
                  </div>
                </>}
                <details className="audit-details">
                  <summary>Voir les {result.total} contrôles et leurs constats</summary>
                  <div className="audit-checks">{result.checks.map(check => <div className="audit-check" key={check.id}>
                    <div className="audit-check-heading"><h4>{check.title}</h4><span className={`audit-status audit-status-${check.status}`}>{statusLabel[check.status]}</span></div>
                    <p>{check.evidence}</p>{check.action && <p><strong>À faire :</strong> {check.action}</p>}
                  </div>)}</div>
                </details>
                <p className="audit-note">{result.limitations}</p>
                <div className="lab-result-foot">
                  <button className="btn btn-ghost" onClick={reset}>← Nouvelle analyse</button>
                  <a href="#contact" className="btn btn-primary" data-cursor="discuter"><span className="btn-label">En discuter avec moi</span><span className="btn-arrow" aria-hidden="true">↗</span></a>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="lab-foot"><p className="audit-note">L’adresse est transmise à mon serveur, qui consulte la page publique. Aucun modèle d’IA n’est utilisé pour ce diagnostic. N’indiquez pas de lien privé ni d’adresse contenant un code d’accès.</p></div>
      </div>
    </section>
  );
}

function ContactSection() {
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [copiedTel, setCopiedTel] = useState(false);
  const copyEmail = () => {
    navigator.clipboard?.writeText('joran.vanpeene@gmail.com');
    setCopiedEmail(true);
    setTimeout(() => setCopiedEmail(false), 1500);
  };
  const copyTel = () => {
    navigator.clipboard?.writeText('0767647406');
    setCopiedTel(true);
    setTimeout(() => setCopiedTel(false), 1500);
  };
  return (
    <section id="contact" className="contact">
      <div className="contact-huge" aria-hidden="true">
        <span>À</span>
        <span className="contact-huge-italic">vous.</span>
      </div>
      <div className="contact-inner">
        <div className="contact-left">
          <span className="mono-label">§ 07 · Contact</span>
          <h2 className="contact-title">Un projet en tête ?<br/><em>Un appel de 15 minutes, sans engagement.</em></h2>
          <p className="contact-p">Dites-moi quelques mots sur vous, votre activité, ce que vous aimeriez construire. Je réponds sous 24h — souvent plus vite.</p>
        </div>
        <div className="contact-right">
          <button className="contact-card" onClick={copyEmail} data-cursor={copiedEmail ? 'copié !' : 'copier'}>
            <span className="mono-label">email</span>
            <b>joran.vanpeene@gmail.com</b>
            <span className="contact-card-hint">{copiedEmail ? '✓ copié' : 'cliquer pour copier'}</span>
          </button>
          <button className="contact-card" onClick={copyTel} data-cursor={copiedTel ? 'copié !' : 'copier'}>
            <span className="mono-label">téléphone</span>
            <b>07 67 64 74 06</b>
            <span className="contact-card-hint">{copiedTel ? '✓ copié' : 'cliquer pour copier'}</span>
          </button>
          <a className="contact-card" href="https://cal.com/joranvnp" target="_blank" rel="noopener" data-cursor="ouvrir">
            <span className="mono-label">agenda</span>
            <b>Réserver 15 min</b>
            <span className="contact-card-hint">cal.com/joranvnp ↗</span>
          </a>
          <div className="contact-socials">
            <a href="https://github.com/Joranvnp" target="_blank" rel="noopener" data-cursor="github">GitHub</a>
            <span>·</span><a href="https://www.linkedin.com/in/joran-vanpeene/" target="_blank" rel="noopener" data-cursor="linkedin">LinkedIn</a>
          </div>
        </div>
      </div>
      <footer className="footer">
        <div>© 2026 Joran Vanpeene — Aigre (16), France</div>
        <div className="mono-label">conçu & codé à la main · v4.0</div>
        <div>↑ <a href="#top">retour en haut</a></div>
      </footer>
    </section>
  );
}

function App() {
  // Setup theme CSS variables — dark mode par défaut
  useEffect(() => {
    const r = document.documentElement;
    r.style.setProperty('--bg', 'oklch(0.16 0.01 60)');
    r.style.setProperty('--bg-2', 'oklch(0.19 0.012 60)');
    r.style.setProperty('--surface', 'oklch(0.22 0.015 60)');
    r.style.setProperty('--fg', 'oklch(0.96 0.015 80)');
    r.style.setProperty('--fg-2', 'oklch(0.78 0.01 60)');
    r.style.setProperty('--muted', 'oklch(0.58 0.008 60)');
    r.style.setProperty('--line', 'oklch(0.32 0.01 60)');
    r.style.setProperty('--line-2', 'oklch(0.26 0.01 60)');
    r.style.setProperty('--accent', 'oklch(0.72 0.14 55)');
    r.setAttribute('data-theme', 'dark');
    r.setAttribute('data-density', 'normal');
  }, []);

  return (
    <div className="app">
      <MagneticCursor />
      <Navbar />
      <Hero />
      <WorkSection />
      <AboutSection />
      <ServicesSection />
      <QuoteSection />
      <LabSection />
      <ContactSection />
    </div>
  );
}

export default App;
