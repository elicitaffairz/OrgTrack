import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileUp, QrCode, FileDown, Github, Linkedin } from "lucide-react";
import { useAttendanceStore } from "../store";
import { toast } from "sonner";
import { Logo } from "../components/Logo";

const features = [
  { icon: FileUp,   label: "Import", desc: "Upload your master list"   },
  { icon: QrCode,   label: "Scan",   desc: "Rapid QR attendance"       },
  { icon: FileDown, label: "Export", desc: "Download reports instantly" },
];

const stats = [
  { value: "Lightning-fast", label: "scans"     },
  { value: "Instant",        label: "exports"   },
  { value: "Zero",           label: "paperwork" },
];

export function Landing() {
  const navigate = useNavigate();
  const { eventName, setEventName } = useAttendanceStore();
  const [eventInput, setEventInput] = useState(eventName || "");

  const handleStart = () => {
    if (!eventInput.trim()) {
      toast.error("Please enter the name of the event");
      return;
    }
    setEventName(eventInput);
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col min-h-[100dvh] bg-bg-light font-sans relative overflow-hidden">

      {/* Background decorations */}
      <div className="absolute inset-0 z-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--color-secondary) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Blobs — animate-blob-1/2/3 defined in tailwind config or inline below */}
        <div
          className="absolute top-[-15%] left-[-10%] w-[55%] h-[60%] bg-secondary/10 rounded-full blur-[140px]"
          style={{ animation: "blobDrift1 12s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[55%] bg-primary/10 rounded-full blur-[120px]"
          style={{ animation: "blobDrift2 15s ease-in-out infinite" }}
        />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/60 rounded-full blur-[100px]" />
      </div>

      {/* Keyframe injection */}
      <style>{`
        @keyframes blobDrift1 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33%       { transform: translate(3%, 4%) scale(1.04); }
          66%       { transform: translate(-2%, 2%) scale(0.97); }
        }
        @keyframes blobDrift2 {
          0%, 100% { transform: translate(0, 0) scale(1); }
          40%       { transform: translate(-4%, -3%) scale(1.05); }
          70%       { transform: translate(2%, -1%) scale(0.96); }
        }

        /* ── Entrance keyframes ── */
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(22px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-28px); }
          to   { opacity: 1; transform: translateX(0);     }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(28px); }
          to   { opacity: 1; transform: translateX(0);    }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes logoFloat {
          0%, 100% { transform: translateY(0px);  }
          50%       { transform: translateY(-5px); }
        }
        @keyframes shimmer {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* ── Logo float (after entrance settles) ── */
        .logo-float {
          animation:
            fadeLeft 0.65s cubic-bezier(0.22,1,0.36,1) 0.05s both,
            logoFloat 4s ease-in-out 0.9s infinite;
        }

        /* ── Left column stagger ── */
        .enter-left-1 { animation: fadeLeft 0.65s cubic-bezier(0.22,1,0.36,1) 0.15s both; }
        .enter-left-2 { animation: fadeUp  0.65s cubic-bezier(0.22,1,0.36,1) 0.28s both; }
        .enter-left-3 { animation: fadeUp  0.65s cubic-bezier(0.22,1,0.36,1) 0.42s both; }
        .enter-left-4 { animation: fadeUp  0.65s cubic-bezier(0.22,1,0.36,1) 0.54s both; }

        /* ── Right card ── */
        .enter-right  { animation: fadeRight 0.7s cubic-bezier(0.22,1,0.36,1) 0.22s both; }

        /* ── Card children stagger ── */
        .enter-card-1 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.4s  both; }
        .enter-card-2 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.52s both; }
        .enter-card-3 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.62s both; }
        .enter-card-4 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.72s both; }
        .enter-card-5 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.82s both; }
        .enter-card-6 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.90s both; }

        /* ── Headline gradient shimmer ── */
        .headline-gradient {
          background: linear-gradient(
            90deg,
            #dc2626 0%,
            #0033a0 25%,
            #2563eb 50%,
            #0033a0 75%,
            #dc2626 100%
          );
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear 1.2s infinite;
        }

        /* ── Stat item entrance stagger ── */
        .stat-item-0 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.60s both; }
        .stat-item-1 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.70s both; }
        .stat-item-2 { animation: fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.80s both; }

        /* ── Feature icon hover lift ── */
        .feature-icon-wrap {
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1);
        }
        .feature-icon-wrap:hover { transform: translateY(-3px) scale(1.08); }

        /* ── CTA button shine sweep ── */
        .cta-btn { position: relative; overflow: hidden; }
        .cta-btn::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.18) 50%, transparent 60%);
          transform: translateX(-100%);
          transition: transform 0.45s ease;
        }
        .cta-btn:hover::after { transform: translateX(100%); }

        /* ── Input focus ring bloom ── */
        .event-input {
          transition: box-shadow 0.25s ease, border-color 0.25s ease;
        }
        .event-input:focus {
          box-shadow: 0 0 0 4px rgba(0, 51, 160, 0.10);
        }

        /* ── Footer fade in ── */
        .enter-footer { animation: fadeIn 0.6s ease 1.0s both; }
      `}</style>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-10 xl:px-32 py-10 sm:py-12 relative z-10">
        <div className="w-full max-w-none mx-auto">

          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-12 xl:gap-16">

            {/* LEFT — Branding, headline, stats */}
            <div className="flex-1 flex flex-col gap-6 sm:gap-7 text-center lg:text-left items-center lg:items-start">

              {/* Logo */}
              <div className="logo-float flex items-center gap-3">
                <Logo className="w-11 h-11 sm:w-12 sm:h-12 drop-shadow-sm flex-shrink-0" />
                <div className="flex flex-col leading-none">
                  <span className="text-[1.6rem] sm:text-[1.8rem] font-black text-secondary tracking-[-0.04em] leading-none">
                    OrgTrack
                  </span>
                  <span className="text-[0.7rem] sm:text-[0.75rem] font-semibold text-secondary/70 tracking-wide mt-1.5">
                    Attendance Monitoring
                  </span>
                </div>
              </div>

              {/* Headline */}
              <div className="enter-left-2 space-y-3">
                <h1 className="text-[2.6rem] sm:text-[3.2rem] md:text-[3.8rem] xl:text-[3.8rem] 2xl:text-[4.5rem] font-black text-gray-900 tracking-[-0.04em] leading-[1.05]">
                  Seamless{" "}
                  <span className="headline-gradient">
                    Attendance
                  </span>{" "}
                  <br className="hidden sm:block" />Tracking
                </h1>
                <p className="enter-left-3 text-[0.9rem] sm:text-[0.95rem] lg:text-[0.88rem] xl:text-[0.95rem] font-medium text-neutral/80 max-w-sm sm:max-w-md lg:max-w-xs xl:max-w-sm leading-relaxed mx-auto lg:mx-0">
                  From list to report in seconds.
                  <br />
                  All data stays on your device with local storage.
                </p>
              </div>

              {/* Stat row */}
              <div className="enter-left-4 hidden sm:flex items-center gap-6 pt-1 justify-center lg:justify-start">
                {stats.map(({ value, label }, i) => (
                  <div key={label} className={`stat-item-${i} flex items-center gap-6`}>
                    <div className="flex flex-col gap-0.5 items-center lg:items-start">
                      <span className="text-sm font-black text-secondary tracking-tight">{value}</span>
                      <span className="text-[0.68rem] text-neutral/60 font-medium">{label}</span>
                    </div>
                    {i < stats.length - 1 && (
                      <div className="w-px h-8 bg-secondary/15" />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — Action card */}
            <div className="enter-right w-full lg:w-[380px] xl:w-[420px] 2xl:w-[460px] flex-shrink-0">
              <div className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-[0_16px_48px_-12px_rgba(0,51,160,0.12)] flex flex-col gap-6">

                {/* Card header */}
                <div className="enter-card-1 space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    Start a new session
                  </h2>
                  <p className="text-xs sm:text-[0.8rem] text-neutral/60 font-medium">
                    Name your event to get started
                  </p>
                </div>

                {/* Input */}
                <div className="enter-card-2 space-y-2">
                  <label
                    htmlFor="eventName"
                    className="block text-[0.7rem] font-bold text-secondary uppercase tracking-widest"
                  >
                    Event Name
                  </label>
                  <input
                    id="eventName"
                    type="text"
                    placeholder="e.g. IT Gen Assembly 2025"
                    value={eventInput}
                    onChange={(e) => setEventInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleStart(); }}
                    className="event-input w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 placeholder:text-gray-300 placeholder:font-normal focus:outline-none focus:ring-0 focus:border-secondary text-sm font-semibold text-gray-800"
                  />
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleStart}
                  className="cta-btn enter-card-3 group bg-gradient-to-r from-secondary to-[#0044cc] hover:from-[#002a8a] hover:to-[#0055ff] text-white rounded-xl flex items-center justify-center gap-2.5 active:scale-[0.98] shadow-[0_6px_20px_rgba(0,51,160,0.28)] hover:shadow-[0_10px_28px_rgba(0,51,160,0.38)] py-3.5 sm:py-4 w-full transition-all duration-200"
                >
                  <span className="font-bold text-sm tracking-wide relative z-10">
                    Start New Session
                  </span>
                  <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200" />
                </button>

                {/* Keyboard hint */}
                <p className="enter-card-4 text-[0.68rem] font-medium text-neutral/50 text-center -mt-2">
                  Press{" "}
                  <kbd className="bg-gray-100 border border-gray-200 text-gray-500 text-[0.65rem] px-1.5 py-0.5 rounded font-mono">
                    Enter
                  </kbd>{" "}
                  to continue
                </p>

                {/* Feature icon row */}
                <div className="enter-card-5 border-t border-gray-100 pt-4 grid grid-cols-3 gap-2">
                  {features.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="feature-icon-wrap flex flex-col items-center gap-1.5 text-center cursor-default">
                      <div className="w-8 h-8 rounded-lg bg-secondary/8 flex items-center justify-center">
                        <Icon className="w-4 h-4 text-secondary" strokeWidth={2} />
                      </div>
                      <span className="text-[0.65rem] font-bold text-secondary">{label}</span>
                      <span className="text-[0.6rem] text-neutral/50 font-medium leading-tight hidden sm:block">
                        {desc}
                      </span>
                    </div>
                  ))}
                </div>

              </div>
            </div>

          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="enter-footer shrink-0 w-full bg-white border-t border-slate-200 relative z-10 py-4 px-5 sm:px-8 lg:px-12 xl:px-32 pb-[calc(1rem+5px)] md:pb-4 flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-col items-center md:items-start gap-0.5">
          <p className="text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} OrgTrack. All rights reserved.
          </p>
          <p className="text-[0.65rem] text-slate-400">
            Eliza Marie Abing | BSIT
          </p>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="https://github.com/elicitaffairz"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-secondary transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <Github className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
          <a
            href="https://www.linkedin.com/in/eliza-abing-272b0b244/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-secondary transition-colors p-2 hover:bg-slate-50 rounded-full"
          >
            <Linkedin className="w-4 h-4 sm:w-5 sm:h-5" />
          </a>
        </div>
      </footer>

    </div>
  );
}