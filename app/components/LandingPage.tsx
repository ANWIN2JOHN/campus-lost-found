import { useRef, useEffect, useState } from "react";
import { Search, Package, MapPin, ArrowRight, AlertCircle, ChevronDown } from "lucide-react";
import collegeLogo from "../../imports/WhatsApp_Image_2026-06-01_at_10.51.49_AM.jpeg";
import headerCenterImg from "../../imports/WhatsApp_Image_2026-06-01_at_11.03.14_AM.jpeg";

interface LandingPageProps {
  onBrowseLost: () => void;
  onBrowseFound: () => void;
  onAdminLogin: () => void;
}

function StatRing({ pct, color, label, animate = false }: { pct: number; color: string; label: string; animate?: boolean }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const [currentPct, setCurrentPct] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let startTimestamp: number | null = null;
    const duration = 1000;
    const startVal = 0;
    const endVal = pct;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCurrentPct(progress * (endVal - startVal) + startVal);
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [pct, animate]);

  const renderPct = animate ? currentPct : pct;
  const dash = (renderPct / 100) * circ;
  const displayLabel = label.endsWith("%") && animate ? `${Math.round(renderPct)}%` : label;

  return (
    <div className="relative shrink-0" style={{ width: 56, height: 56 }}>
      <svg width="56" height="56" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="#e2e8f0" strokeWidth="4.5" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="4.5"
          strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold"
        style={{ color, fontFamily: "DM Sans, sans-serif" }}>
        {displayLabel}
      </span>
    </div>
  );
}

function AnimatedCounter({ value, animate = false }: { value: number; animate?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!animate) return;
    let startTimestamp: number | null = null;
    const duration = 1000;
    const startVal = 0;
    const endVal = value;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      setCount(Math.floor(progress * (endVal - startVal) + startVal));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, animate]);

  return <>{animate ? count : value}</>;
}

const howItWorks = [
  { icon: <Search size={24} />, step: "01", title: "Search & Browse", desc: "Explore our database of lost and found items. Search by location, date, and category.", g: "from-cyan-500 to-teal-600", bg: "from-cyan-50 to-teal-50", border: "border-cyan-100" },
  { icon: <MapPin size={24} />, step: "02", title: "Locate Collection Point", desc: "Each item shows exactly where it's stored — Main Block, Admin Block, Humanities Block.", g: "from-emerald-500 to-green-600", bg: "from-emerald-50 to-green-50", border: "border-emerald-100" },
  { icon: <Package size={24} />, step: "03", title: "Collect Your Item", desc: "Bring your student ID to the designated office to verify ownership and collect your item.", g: "from-amber-500 to-orange-500", bg: "from-amber-50 to-orange-50", border: "border-amber-100" },
];

export default function LandingPage({ onBrowseFound, onAdminLogin }: LandingPageProps) {
  const [stats, setStats] = useState({
    total: 0,
    lost: 0,
    found: 0,
    returned: 0,
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [animateStats, setAnimateStats] = useState(false);
  const statsContainerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setAnimateStats(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (statsContainerRef.current) {
      observer.observe(statsContainerRef.current);
    }

    return () => observer.disconnect();
  }, [statsLoading]);

  useEffect(() => {
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://campus-lost-found-ghvc.onrender.com";

    Promise.all([
      fetch(`${API_BASE_URL}/api/items/lost?limit=1&status=Not%20Returned`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/items/found?limit=1&status=Not%20Returned`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/items/lost?limit=1&status=Returned`).then(r => r.json()),
      fetch(`${API_BASE_URL}/api/items/found?limit=1&status=Returned`).then(r => r.json()),
    ])
      .then(([lostActive, foundActive, lostReturned, foundReturned]) => {
        const lostActiveTotal = lostActive?.data?.total ?? lostActive?.data?.data?.length ?? 0;
        const foundActiveTotal = foundActive?.data?.total ?? foundActive?.data?.data?.length ?? 0;
        const lostReturnedTotal = lostReturned?.data?.total ?? lostReturned?.data?.data?.length ?? 0;
        const foundReturnedTotal = foundReturned?.data?.total ?? foundReturned?.data?.data?.length ?? 0;

        setStats({
          total: lostActiveTotal + foundActiveTotal + lostReturnedTotal + foundReturnedTotal,
          lost: lostActiveTotal + lostReturnedTotal,
          found: foundActiveTotal + foundReturnedTotal,
          returned: lostReturnedTotal + foundReturnedTotal,
        });
      })
      .catch(console.error)
      .finally(() => setStatsLoading(false));
  }, []);

  const TOTAL = stats.total;
  const LOST = stats.lost;
  const FOUND = stats.found;
  const RETURNED = stats.returned;

  const LOST_PCT = TOTAL ? Math.round((LOST / TOTAL) * 100) : 0;
  const FOUND_PCT = TOTAL ? Math.round((FOUND / TOTAL) * 100) : 0;
  const RETURN_RATE = TOTAL ? Math.round((RETURNED / TOTAL) * 100) : 0;

  const overviewStats = [
    { ring: <StatRing pct={100} color="#0891b2" label="ALL" animate={animateStats} />, value: <AnimatedCounter value={TOTAL} animate={animateStats} />, label: "Total Reported", labelColor: "text-slate-700", border: "border-slate-200" },
    { ring: <StatRing pct={LOST_PCT} color="#f59e0b" label={`${LOST_PCT}%`} animate={animateStats} />, value: <AnimatedCounter value={LOST} animate={animateStats} />, label: "Lost Items", labelColor: "text-amber-500", border: "border-amber-200" },
    { ring: <StatRing pct={FOUND_PCT} color="#10b981" label={`${FOUND_PCT}%`} animate={animateStats} />, value: <AnimatedCounter value={FOUND} animate={animateStats} />, label: "Found Items", labelColor: "text-emerald-500", border: "border-emerald-200" },
    { ring: <StatRing pct={RETURN_RATE} color="#8b5cf6" label={`${RETURN_RATE}%`} animate={animateStats} />, value: <AnimatedCounter value={RETURNED} animate={animateStats} />, label: "Returned", labelColor: "text-violet-500", border: "border-violet-200" },
  ];

  const scrollToStats = () => {
    statsRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="h-screen overflow-y-auto" style={{ scrollSnapType: "y mandatory" }}>

      {/* ── SECTION 1 — Hero (full viewport) ─────────────────── */}
      <section
        className="relative min-h-screen flex flex-col bg-white"
        style={{ scrollSnapAlign: "start" }}
      >
        {/* Blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-cyan-200 rounded-full mix-blend-multiply blur-3xl opacity-20" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-teal-200 rounded-full mix-blend-multiply blur-3xl opacity-20" />
        </div>

        {/* Header */}
        <header className="relative shrink-0 bg-white/80 backdrop-blur border-b border-slate-200 shadow-sm z-10">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img src={collegeLogo} alt="Kristu Jayanti University" className="h-8 object-contain" />
              <div className="border-l-2 border-slate-200 pl-3">
                <p className="text-slate-900 font-bold text-base leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Campus Lost and Found
                </p>
                <p className="text-cyan-600 text-xs font-medium">Your Items, Reunited</p>
              </div>
            </div>
            <div className="flex-1 flex justify-center">
              <img src={headerCenterImg} alt="Campus Lost and Found" className="h-10 object-contain" />
            </div>
            <div className="flex items-center gap-3">

              <button
                onClick={onAdminLogin}
                className="px-5 py-2 rounded-lg text-sm font-medium bg-cyan-600 text-white hover:bg-cyan-700 transition-all shadow-md hover:shadow-lg"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                Login
              </button>
            </div>
          </div>
        </header>

        {/* Hero content */}
        <div className="relative flex-1 flex items-center">
          <div className="max-w-6xl mx-auto w-full px-6 py-10 flex flex-col gap-10">

            {/* Headline */}
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="flex-1">
                <h1 className="text-4xl lg:text-5xl font-bold text-slate-900 leading-tight mb-4"
                  style={{ fontFamily: "Outfit, sans-serif" }}>
                  Lost Something?
                  <br />
                  <span className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
                    We've Got You Covered.
                  </span>
                </h1>
                <p className="text-slate-500 text-base max-w-md" style={{ fontFamily: "DM Sans, sans-serif" }}>Browse all lost and found items reported across campus. Reuniting students with their belongings.</p>
                <button
                  onClick={onBrowseFound}
                  className="mt-6 inline-flex items-center gap-2 px-7 py-3 rounded-full text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-[1.03] active:scale-[0.98]"
                  style={{
                    fontFamily: "DM Sans, sans-serif",
                    background: "linear-gradient(135deg, #5eadab 0%, #0891b2 100%)",
                  }}
                >
                  Browse Items
                  <ArrowRight size={18} />
                </button>
              </div>

              {/* Campus Overview — moved here from section 2 */}
              <div className="w-full md:w-auto md:flex-1">
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-base font-bold text-slate-900 shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Campus Overview
                  </h2>
                  <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
                  <span className="text-slate-400 text-xs shrink-0" style={{ fontFamily: "DM Sans, sans-serif" }}>Live statistics</span>
                </div>
                <div className="grid grid-cols-2 gap-3" ref={statsContainerRef}>
                  {statsLoading ? (
                    // Skeleton placeholders — same dimensions as real cards
                    Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center gap-3 shadow-sm">
                        {/* Ring skeleton */}
                        <div className="shrink-0 rounded-full bg-slate-200 animate-pulse" style={{ width: 56, height: 56 }} />
                        <div className="flex flex-col gap-2 flex-1">
                          {/* Value skeleton */}
                          <div className="h-7 w-10 rounded bg-slate-200 animate-pulse" />
                          {/* Label skeleton */}
                          <div className="h-3 w-20 rounded bg-slate-200 animate-pulse" />
                        </div>
                      </div>
                    ))
                  ) : (
                    overviewStats.map((s, i) => (
                      <div key={i} className={`bg-white border ${s.border} rounded-2xl p-4 flex items-center gap-3 shadow-sm`}>
                        {s.ring}
                        <div>
                          <p className="text-2xl font-bold text-slate-900" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
                          <p className={`text-xs font-semibold ${s.labelColor}`} style={{ fontFamily: "DM Sans, sans-serif" }}>{s.label}</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll-down hint */}
        <div className="relative shrink-0 pb-6 flex justify-center">
          <button
            onClick={scrollToStats}
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-cyan-600 transition-colors"
          >
            <span className="text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>More Details</span>
            <ChevronDown size={18} className="animate-bounce" />
          </button>
        </div>
      </section>

      {/* ── SECTION 2 — Browse card + How It Works ─────────────────── */}
      <section
        ref={statsRef}
        className="min-h-screen bg-slate-50 border-t border-slate-200"
        style={{ scrollSnapAlign: "start" }}
      >
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col gap-10">

          {/* Browse card — full width */}
          <div>
            <button
              onClick={onBrowseFound}
              className="group relative w-full overflow-hidden bg-white rounded-2xl border border-gray-200 p-10 hover:border-cyan-300 hover:shadow-2xl transition-all duration-300 text-left animate-gentle-pulse"
            >
              <div className="absolute top-0 left-0 w-64 h-64 bg-gradient-to-br from-orange-300 to-orange-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="absolute bottom-0 right-0 w-64 h-64 bg-gradient-to-br from-green-300 to-emerald-400 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              <div className="relative flex flex-col md:flex-row md:items-center gap-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center shadow-lg">
                    <AlertCircle size={26} className="text-white" />
                  </div>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg">
                    <Package size={26} className="text-white" />
                  </div>
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Lost &amp; Found Items
                  </h3>
                  <p className="text-gray-500 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    Browse all items reported across campus in one place.
                  </p>
                </div>
                <div className="flex items-center gap-2 text-cyan-600 font-semibold text-base group-hover:gap-3 transition-all duration-200 shrink-0">
                  <span>Browse All Items</span>
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-200" />
                </div>
              </div>
            </button>
          </div>

          {/* How It Works */}
          <div>
            <div className="flex items-center gap-4 mb-5">
              <h2 className="text-xl font-bold text-slate-900 shrink-0" style={{ fontFamily: "Outfit, sans-serif" }}>
                How It Works
              </h2>
              <div className="flex-1 h-px bg-gradient-to-r from-slate-200 to-transparent" />
              <span className="text-slate-400 text-sm shrink-0" style={{ fontFamily: "DM Sans, sans-serif" }}>3 simple steps</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {howItWorks.map((f, i) => (
                <div key={i} className={`relative flex flex-col bg-gradient-to-br ${f.bg} rounded-2xl p-5 border ${f.border} shadow-sm overflow-hidden`}>
                  <div className={`absolute -top-4 -right-4 w-20 h-20 bg-gradient-to-br ${f.g} opacity-10 rounded-full`} />
                  <div className="relative flex items-start gap-4 mb-3">
                    <div className={`w-12 h-12 shrink-0 rounded-xl bg-gradient-to-br ${f.g} flex items-center justify-center shadow-lg text-white`}>
                      {f.icon}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/70 text-slate-500 border border-slate-200 mb-1 inline-block">
                        STEP {f.step}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {f.title}
                      </h3>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    {f.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Policy notice */}
          <div className="pb-4">
            <div className="rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50 px-7 py-6 shadow-md">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center shadow-md shrink-0">
                  <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                    <path d="M9 7h2v2H9V7zm0 4h2v4H9v-4zm1-9C5.03 2 2 5.03 2 10s3.03 8 8 8 8-3.03 8-8-3.03-8-8-8zm0 14.4A6.4 6.4 0 1 1 10 3.6a6.4 6.4 0 0 1 0 12.8z" fill="white" />
                  </svg>
                </div>
                <p className="text-sm font-bold text-amber-700 uppercase tracking-widest" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  University Policy
                </p>
              </div>
              <p className="text-sm text-amber-900 leading-relaxed" style={{ fontFamily: "DM Sans, sans-serif" }}>
                If an item remains unclaimed after{" "}
                <span className="font-bold text-orange-600 bg-orange-100 px-1.5 py-0.5 rounded-md">60 days</span>,
                {" "}it may be donated, recycled, disposed of, or otherwise handled in accordance with university policies and guidelines.
              </p>
            </div>
          </div>

        </div>
      </section>

    </div>
  );
}
