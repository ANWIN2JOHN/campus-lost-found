import { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";

const MAX = 30;

export function CardNameTooltip({
  name,
  className,
  style,
}: {
  name: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const [visible, setVisible] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const ref = useRef<HTMLSpanElement>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isTruncated = name.length > MAX;
  const display = isTruncated ? name.slice(0, MAX) + "…" : name;

  const show = useCallback(() => {
    if (!isTruncated || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    setPos({ top: r.top + window.scrollY, left: r.left + r.width / 2 });
    setVisible(true);
  }, [isTruncated]);

  const hide = useCallback(() => {
    setVisible(false);
    if (hideTimer.current) clearTimeout(hideTimer.current);
  }, []);

  const handleTouchStart = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    touchTimer.current = setTimeout(show, 500);
  };

  const handleTouchEnd = () => {
    if (touchTimer.current) clearTimeout(touchTimer.current);
    if (visible) {
      hideTimer.current = setTimeout(hide, 1800);
    }
  };

  return (
    <>
      <span
        ref={ref}
        onMouseEnter={show}
        onMouseLeave={hide}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        className={className}
        style={style}
      >
        {display}
      </span>

      {visible && isTruncated &&
        createPortal(
          <div
            style={{
              position: "absolute",
              top: pos.top - 10,
              left: pos.left,
              transform: "translate(-50%, -100%)",
              zIndex: 9999,
              pointerEvents: "none",
            }}
          >
            <div className="lf-card-tooltip">
              {name}
              <span className="lf-card-tooltip-arrow" />
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
