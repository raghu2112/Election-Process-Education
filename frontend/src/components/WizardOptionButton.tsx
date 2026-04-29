/**
 * components/WizardOptionButton.tsx — Voter guide wizard option
 * ===============================================================
 * Renders a single selectable option within a wizard step.
 *
 * Props:
 *  - label    — Option text
 *  - selected — Whether this option is currently selected
 *  - onSelect — Callback fired with the label string
 *  - theme    — Theme tokens
 *
 * @accessibility
 *  - Uses native <button> element (keyboard-focusable)
 *  - aria-pressed indicates selection state
 *  - focus-visible ring from global CSS
 */

import React from "react";
import type { Theme } from "../constants/theme";

interface WizardOptionButtonProps {
  label:    string;
  selected: boolean;
  onSelect: (label: string) => void;
  theme:    Theme;
}

/**
 * WizardOptionButton — prop-driven, no internal state.
 * Grid-friendly: designed for 2-column layout in the wizard view.
 */
const WizardOptionButton: React.FC<WizardOptionButtonProps> = ({
  label,
  selected,
  onSelect,
  theme: th,
}) => {
  return (
    <button
      type="button"
      onClick={() => onSelect(label)}
      aria-pressed={selected}
      style={{
        padding: "11px 14px",
        borderRadius: 10,
        border: `1.5px solid ${selected ? th.accent : th.border}`,
        background: selected ? th.accent + "15" : th.surface,
        color: selected ? th.accent : th.text,
        fontSize: 13,
        fontWeight: selected ? 600 : 400,
        cursor: "pointer",
        textAlign: "left",
        transition: "all .15s ease",
        lineHeight: 1.4,
      }}
    >
      {/* Selection indicator */}
      <span
        aria-hidden="true"
        style={{
          display: "inline-block",
          width: 16,
          height: 16,
          borderRadius: "50%",
          border: `2px solid ${selected ? th.accent : th.inputBorder}`,
          background: selected ? th.accent : "transparent",
          marginRight: 9,
          verticalAlign: "middle",
          position: "relative",
        }}
      >
        {selected && (
          <span
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              width: 6,
              height: 6,
              borderRadius: "50%",
              background: "#fff",
            }}
          />
        )}
      </span>
      {label}
    </button>
  );
};

export default WizardOptionButton;
