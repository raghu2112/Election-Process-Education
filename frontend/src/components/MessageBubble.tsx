/**
 * components/MessageBubble.tsx — Chat message bubble
 * ====================================================
 * Renders a single chat turn (user or assistant).
 *
 * @accessibility
 *  - role="article" with descriptive aria-label
 *  - Avatar is aria-hidden (decorative)
 *  - Supports pre-wrap for multiline AI responses
 */

import React from "react";
import type { Theme } from "../constants/theme";
import type { ChatMessage } from "../App";

interface MessageBubbleProps {
  message: ChatMessage;
  theme:   Theme;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, theme: th }) => {
  const isUser = message.role === "user";

  return (
    <article
      aria-label={`${isUser ? "You" : "ElectGuide AI"} said: ${message.content.slice(0, 80)}`}
      style={{
        display: "flex",
        flexDirection: isUser ? "row-reverse" : "row",
        alignItems: "flex-start",
        gap: 8,
        marginBottom: 14,
        animation: "msg-in .25s ease",
      }}
    >
      {/* Avatar — decorative */}
      <div
        aria-hidden="true"
        style={{
          width: 30, height: 30, borderRadius: "50%", flexShrink: 0,
          background: isUser ? "#3B82F6" : "#6366F1",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 12, fontWeight: 700, color: "#fff", userSelect: "none",
        }}
      >
        {isUser ? "U" : "E"}
      </div>

      {/* Bubble */}
      <div
        style={{
          maxWidth: "74%",
          padding: "9px 13px",
          borderRadius: isUser ? "14px 4px 14px 14px" : "4px 14px 14px 14px",
          background:   isUser ? th.userBubbleBg   : th.aiBubbleBg,
          color:        isUser ? th.userBubbleText  : th.aiBubbleText,
          border:       `1px solid ${th.border}`,
          fontSize: 13, lineHeight: 1.65,
          whiteSpace: "pre-wrap", wordBreak: "break-word",
        }}
      >
        {message.content}
      </div>
    </article>
  );
};

export default MessageBubble;
