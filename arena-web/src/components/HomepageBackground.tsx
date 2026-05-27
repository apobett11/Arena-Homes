"use client";

/**
 * Futuristic navy & gold homepage backdrop (gradient, orbs, gold wash, scanline).
 * Decorative only — no content; does not affect card/text layout.
 */
export function HomepageBackground() {
  return (
    <div className="homepage-hero-container" aria-hidden>
      <div className="homepage-orb homepage-orb-1" />
      <div className="homepage-orb homepage-orb-2" />
      <div className="homepage-orb homepage-orb-3" />
      <div className="homepage-gold-glow" />
      <div className="homepage-gold-line" />
      <div className="homepage-scanline" />
    </div>
  );
}
