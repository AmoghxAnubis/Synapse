import type { CSSProperties, ReactNode } from "react";

interface LazySectionProps {
  children: ReactNode;
  height?: string;
  className?: string;
  rootMargin?: string;
}

/** Keep section content and anchors in HTML; let the browser defer offscreen rendering. */
export function LazySection({ children, height = "100vh", className = "" }: LazySectionProps) {
  const style: CSSProperties = { contentVisibility: "auto", containIntrinsicSize: `auto ${height}` };
  return <div style={style} className={className}>{children}</div>;
}
