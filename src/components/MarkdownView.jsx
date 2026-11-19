import React from "react";

/**
 * Clean up LaTeX, math symbols, and raw markup
 */
function cleanRawSymbols(str) {
  if (!str) return "";
  return str
    // Common LaTeX commands to clean unicode
    .replace(/\\le\b/g, "≤")
    .replace(/\\ge\b/g, "≥")
    .replace(/\\to\b/g, "→")
    .replace(/\\times\b/g, "×")
    .replace(/\\neq\b/g, "≠")
    .replace(/\\approx\b/g, "≈")
    .replace(/\\log\b/g, "log")
    // Remove math dollar sign wrappers: $O(1)$ -> O(1), $N$ -> N
    .replace(/\$([^$\n]+)\$/g, "$1")
    // Remove isolated stray dollar signs
    .replace(/(^|\s)\$(\s|$)/g, "$1$2");
}

/**
 * Formats inline segments: handles code blocks, bold text, and cleans stray asterisks
 */
function formatInlineText(rawStr) {
  const str = cleanRawSymbols(rawStr);
  if (!str) return null;

  // 1. Split by inline code: `code`
  const codeSegments = str.split(/(`[^`]+`)/g);

  return codeSegments.map((segment, segIdx) => {
    // Inline code segment
    if (segment.startsWith("`") && segment.endsWith("`") && segment.length >= 2) {
      return (
        <code key={`code-${segIdx}`} className="inline-code">
          {segment.slice(1, -1)}
        </code>
      );
    }

    // 2. Parse bold: **bold text**
    // Match any **...** block non-greedily
    const boldRegex = /\*\*([^*]+)\*\*/g;
    const parts = [];
    let lastIdx = 0;
    let boldMatch;

    while ((boldMatch = boldRegex.exec(segment)) !== null) {
      if (boldMatch.index > lastIdx) {
        // Normal text before bold - clean any stray single asterisks
        const normalText = segment.slice(lastIdx, boldMatch.index).replace(/\*\*/g, "");
        parts.push(normalText);
      }
      parts.push(
        <strong key={`bold-${segIdx}-${boldMatch.index}`}>
          {boldMatch[1]}
        </strong>
      );
      lastIdx = boldMatch.index + boldMatch[0].length;
    }

    if (lastIdx < segment.length) {
      const remainingText = segment.slice(lastIdx).replace(/\*\*/g, "");
      parts.push(remainingText);
    }

    return <React.Fragment key={`seg-${segIdx}`}>{parts}</React.Fragment>;
  });
}

/**
 * Clean, lightweight Markdown Parser & Formatter
 * Supports code blocks (```), tables, lists, bold text, inline code, and headers.
 * Eliminates raw $ and ** artifacts.
 */
export default function MarkdownView({ content }) {
  if (!content) return null;

  // Split content by code fences: ```lang ... ```
  const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    // Text before code block
    if (match.index > lastIndex) {
      parts.push({
        type: "text",
        value: content.slice(lastIndex, match.index)
      });
    }

    // Code block
    parts.push({
      type: "code",
      language: match[1] || "text",
      value: match[2]
    });

    lastIndex = match.index + match[0].length;
  }

  // Trailing text
  if (lastIndex < content.length) {
    parts.push({
      type: "text",
      value: content.slice(lastIndex)
    });
  }

  // Render a text block (headers, lists, tables, paragraphs)
  const renderTextBlock = (text, blockIdx) => {
    const lines = text.split("\n");
    const elements = [];
    let currentTable = null;

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Horizontal separator ---
      if (trimmed === "---") {
        elements.push(<hr key={`hr-${blockIdx}-${lineIdx}`} className="markdown-hr" />);
        return;
      }

      // Headers
      if (trimmed.startsWith("### ")) {
        elements.push(
          <h4 key={`h4-${blockIdx}-${lineIdx}`} className="markdown-h4">
            {formatInlineText(trimmed.replace("### ", ""))}
          </h4>
        );
        return;
      }
      if (trimmed.startsWith("#### ")) {
        elements.push(
          <h5 key={`h5-${blockIdx}-${lineIdx}`} className="markdown-h5">
            {formatInlineText(trimmed.replace("#### ", ""))}
          </h5>
        );
        return;
      }

      // Table row | col 1 | col 2 |
      if (trimmed.startsWith("|") && trimmed.endsWith("|")) {
        // Skip table separator line |:---|:---|
        if (trimmed.includes("---")) {
          return;
        }

        const cells = trimmed
          .split("|")
          .slice(1, -1)
          .map((c) => c.trim());

        if (!currentTable) {
          currentTable = [];
        }
        currentTable.push(cells);
        return;
      } else if (currentTable) {
        // Flush accumulated table
        const tableData = currentTable;
        currentTable = null;
        elements.push(
          <div key={`tbl-${blockIdx}-${lineIdx}`} className="markdown-table-wrapper">
            <table className="markdown-table">
              <thead>
                <tr>
                  {tableData[0]?.map((head, hIdx) => (
                    <th key={hIdx}>{formatInlineText(head)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.slice(1).map((row, rIdx) => (
                  <tr key={rIdx}>
                    {row.map((cell, cIdx) => (
                      <td key={cIdx}>{formatInlineText(cell)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      // Unordered list
      if (trimmed.startsWith("* ") || trimmed.startsWith("- ")) {
        elements.push(
          <li key={`li-${blockIdx}-${lineIdx}`} className="markdown-li">
            {formatInlineText(trimmed.replace(/^(\*|-)\s+/, ""))}
          </li>
        );
        return;
      }

      // Plain paragraph (skip empty lines)
      if (trimmed.length > 0) {
        elements.push(
          <p key={`p-${blockIdx}-${lineIdx}`} className="markdown-p">
            {formatInlineText(line)}
          </p>
        );
      }
    });

    // Flush any pending table at the end
    if (currentTable) {
      const tableData = currentTable;
      elements.push(
        <div key={`tbl-end-${blockIdx}`} className="markdown-table-wrapper">
          <table className="markdown-table">
            <thead>
              <tr>
                {tableData[0]?.map((head, hIdx) => (
                  <th key={hIdx}>{formatInlineText(head)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableData.slice(1).map((row, rIdx) => (
                <tr key={rIdx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx}>{formatInlineText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return <React.Fragment key={blockIdx}>{elements}</React.Fragment>;
  };

  return (
    <div className="markdown-body-content">
      {parts.map((part, idx) => {
        if (part.type === "code") {
          const isAscii = part.language === "text" || part.language === "diagram" || part.language === "";
          // In ASCII diagrams or code, clean any raw LaTeX markers if present
          const cleanCode = cleanRawSymbols(part.value);
          return (
            <div
              key={`code-${idx}`}
              className={`code-fence-container ${isAscii ? "ascii-diagram-container" : ""}`}
            >
              <div className="code-fence-header">
                <span className="code-lang-tag">
                  {isAscii ? "ASCII DIAGRAM / STRUCTURE" : part.language.toUpperCase()}
                </span>
                <button
                  type="button"
                  className="copy-code-btn"
                  onClick={() => {
                    navigator.clipboard.writeText(cleanCode);
                    alert("Copied to clipboard!");
                  }}
                >
                  Copy
                </button>
              </div>
              <pre className="code-pre-block">
                <code>{cleanCode}</code>
              </pre>
            </div>
          );
        }

        return renderTextBlock(part.value, idx);
      })}
    </div>
  );
}
