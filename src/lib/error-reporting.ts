export function reportError(error: unknown, context: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return;
  const meta = {
    source: "react_error_boundary",
    route: window.location.pathname,
    ...context,
  };
  // eslint-disable-next-line no-console
  console.error("[error-boundary]", error, meta);
}
