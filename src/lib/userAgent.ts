/** "Chrome · Windows": só para a pessoa reconhecer as próprias sessões. */
export function describeUserAgent(ua: string | null | undefined) {
  if (!ua) return "Aparelho desconhecido";
  const text = ua.slice(0, 300);

  const browser = /Edg\//.test(text)
    ? "Edge"
    : /OPR\/|Opera/.test(text)
      ? "Opera"
      : /Firefox\//.test(text)
        ? "Firefox"
        : /Chrome\/|CriOS\//.test(text)
          ? "Chrome"
          : /Safari\//.test(text)
            ? "Safari"
            : null;

  const os = /Windows/.test(text)
    ? "Windows"
    : /Android/.test(text)
      ? "Android"
      : /iPhone|iPad|iPod/.test(text)
        ? "iOS"
        : /Mac OS X|Macintosh/.test(text)
          ? "macOS"
          : /Linux/.test(text)
            ? "Linux"
            : null;

  if (!browser && !os) return "Aparelho desconhecido";
  return [browser, os].filter(Boolean).join(" · ");
}
