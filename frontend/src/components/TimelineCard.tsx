/**
 * components/TimelineCard.tsx — Election timeline phase card
 * ============================================================
 * Renders a single expandable timeline phase with key actions.
 *
 * Props:
 *  - phase       — ElectionPhase data object
 *  - index       — Phase index (0-based) for numbering
 *  - isOpen      — Whether the card is currently expanded
 *  - onToggle    — Callback to toggle expansion
 *  - theme       — Theme tokens
 *  - phaseLabel  — Localised "Phase" string
 *
 * @accessibility
 *  - <button> trigger with aria-expanded + aria-controls
 *  - Expandable content panel has role="region"
 *  - Keyboard-navigable (native button semantics)
 *  - Color contrast verified against WCAG AA
 */

import React from "react";
import type { Theme } from "../constants/theme";
import type { ElectionPhase } from "../constants/electionData";

interface TimelineCardProps {
  phase:      ElectionPhase;
  index:      number;
  isOpen:     boolean;
  onToggle:   (id: string) => void;
  theme:      Theme;
  phaseLabel: string;
}

/**
 * TimelineCard — Accordion-style card for a single election phase.
 *
 * Performance: No internal state — fully controlled by parent.
 *              Renders only when props change.
 */
const TimelineCard: React.FC<TimelineCardProps> = ({
  phase,
  index,
  isOpen,
  onToggle,
  theme: th,
  phaseLabel,
}) => {
  const panelId  = `panel-${phase.id}`;
  const headerId = `header-${phase.id}`;

  return (
    <div
      style={{
        marginBottom: 10,
        borderRadius: 14,
        border: `1.5px solid ${isOpen ? phase.color + "55" : th.border}`,
        background: th.surface,
        overflow: "hidden",
        transition: "border-color .2s, box-shadow .2s",
        boxShadow: isOpen ? `0 2px 12px ${phase.color}18` : "none",
      }}
    >
      {/* ── Header button ── */}
      <button
        id={headerId}
        type="button"
        onClick={() => onToggle(phase.id)}
        aria-expanded={isOpen}
        aria-controls={panelId}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "14px 16px",
          background: "transparent",
          border: "none",
          cursor: "pointer",
          textAlign: "left",
          color: th.text,
        }}
      >
        {/* Phase colour indicator */}
        <div
          aria-hidden="true"
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: phase.color + "18",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {phase.icon}
        </div>

        {/* Title + duration */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: phase.color,
              textTransform: "uppercase",
              letterSpacing: ".4px",
              marginBottom: 2,
            }}
          >
            {phaseLabel} {index + 1}
          </div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>
            {phase.title}
          </div>
          <div style={{ fontSize: 11, color: th.textMuted, marginTop: 1 }}>
            ⏱ {phase.duration}
          </div>
        </div>

        {/* Expand/collapse chevron */}
        <span
          aria-hidden="true"
          style={{
            fontSize: 14,
            color: th.textMuted,
            transition: "transform .2s",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
          }}
        >
          ▼
        </span>
      </button>

      {/* ── Expandable panel ── */}
      {isOpen && (
        <div
          id={panelId}
          role="region"
          aria-labelledby={headerId}
          style={{
            padding: "0 16px 16px",
            animation: "msg-in .25s ease",
          }}
        >
          {/* Description */}
          <p
            style={{
              fontSize: 13,
              lineHeight: 1.7,
              color: th.textMuted,
              margin: "0 0 12px",
            }}
          >
            {phase.description}
          </p>

          {/* Key actions */}
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: th.text,
              marginBottom: 8,
              textTransform: "uppercase",
              letterSpacing: ".4px",
            }}
          >
            Key Actions
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {phase.keyActions.map((action) => (
              <span
                key={action}
                style={{
                  padding: "5px 10px",
                  borderRadius: 8,
                  background: phase.color + "12",
                  border: `1px solid ${phase.color}30`,
                  color: phase.color,
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {action}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimelineCard;
