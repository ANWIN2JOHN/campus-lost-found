import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface ScrollToTopButtonProps {
  threshold?: number;
}

export function ScrollToTopButton({ threshold = 300 }: ScrollToTopButtonProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [threshold]);

  if (!visible) return null;

  return (
    <button
      type="button"
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className="fixed bottom-6 right-6 z-50 w-11 h-11 rounded-full bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all duration-200 flex items-center justify-center"
      aria-label="Back to top"
    >
      <ArrowUp size={18} />
    </button>
  );
}
