/**
 * components/LoadingDots.tsx — Animated typing indicator
 * =======================================================
 * Three bouncing dots shown while the AI is generating a response.
 *
 * @accessibility
 *  - role="status" announces "Thinking…" to screen readers
 *  - Dots are aria-hidden (decorative animation)
 *
 * @performance
 *  - Uses CSS transform + opacity only — GPU-composited,
 *    no layout/paint thrashing.
 *  - Animation defined in App.tsx global <style> block
 *    (keyframe: ld-bounce)
 */

import React from "react";

/**
 * LoadingDots — stateless indicator for AI processing state.
 * No props required; designed for maximum reuse.
 */
const LoadingDots: React.FC = () => {
  return (
    <div
      role="status"
      aria-label="AI is thinking"
      style={{ display: "flex", alignItems: "center", gap: 4 }}
    >
      {/* Screen-reader text */}
      <span
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          overflow: "hidden",
          clip: "rect(0,0,0,0)",
          whiteSpace: "nowrap",
        }}
      >
        Thinking…
      </span>

      {/* Visual dots — decorative */}
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          aria-hidden="true"
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "#6366F1",
            display: "inline-block",
            animation: "ld-bounce 1.2s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
    </div>
  );
};

export default LoadingDots;
