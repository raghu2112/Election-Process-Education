/**
 * components/SidebarButton.tsx — Navigation sidebar button
 * ==========================================================
 * Renders a single navigation item in the sidebar.
 * Highlights the active view with accent background.
 *
 * Props:
 *  - id       — View identifier (ViewId)
 *  - icon     — Emoji icon string
 *  - label    — Localised button label
 *  - isActive — Whether this view is currently active
 *  - onClick  — Navigation handler
 *
 * @accessibility
 *  - aria-current="page" on the active item
 *  - Native <button> element — keyboard focusable
 *  - focus-visible ring from global CSS
 */

import React from "react";
import type { ViewId } from "../App";

interface SidebarButtonProps {
  id:       ViewId;
  icon:     string;
  label:    string;
  isActive: boolean;
  onClick:  (id: ViewId) => void;
}

/**
 * SidebarButton — prop-driven nav button, no internal state.
 *
 * Performance: Stable onClick identity via useCallback in parent (App).
 *              Only re-renders when isActive or label changes.
 */
const SidebarButton: React.FC<SidebarButtonProps> = ({
  id,
  icon,
  label,
  isActive,
  onClick,
}) => {
  return (
    <button
      type="button"
      onClick={() => onClick(id)}
      aria-current={isActive ? "page" : undefined}
      aria-label={`Navigate to ${label}`}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "9px 12px",
        marginBottom: 3,
        borderRadius: 9,
        border: "none",
        background: isActive
          ? "rgba(79, 70, 229, 0.25)"
          : "transparent",
        color: isActive
          ? "#A5B4FC"
          : "rgba(255, 255, 255, 0.55)",
        cursor: "pointer",
        fontSize: 12,
        fontWeight: isActive ? 600 : 400,
        textAlign: "left",
        transition: "all .15s ease",
        letterSpacing: isActive ? "0px" : "0px",
      }}
    >
      {/* Icon */}
      <span
        aria-hidden="true"
        style={{
          fontSize: 15,
          width: 22,
          textAlign: "center",
          flexShrink: 0,
        }}
      >
        {icon}
      </span>

      {/* Label */}
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {label}
      </span>

      {/* Active indicator dot */}
      {isActive && (
        <span
          aria-hidden="true"
          style={{
            marginLeft: "auto",
            width: 5,
            height: 5,
            borderRadius: "50%",
            background: "#A5B4FC",
            flexShrink: 0,
          }}
        />
      )}
    </button>
  );
};

export default SidebarButton;
