import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, FileUp, QrCode, FileDown, Github, Linkedin } from "lucide-react";
import { useAttendanceStore } from "../store";
import { toast } from "sonner";
import { Logo } from "../components/Logo";

const features = [
  { icon: FileUp, label: "Import", desc: "Upload your master list" },
  { icon: QrCode, label: "Scan", desc: "Rapid QR attendance" },
  { icon: FileDown, label: "Export", desc: "Download reports instantly" },
];

const stats = [
  { value: "Lightning-fast", label: "scans" },
  { value: "Instant", label: "exports" },
  { value: "Zero", label: "paperwork" },
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
        <div className="absolute top-[-15%] left-[-10%] w-[55%] h-[60%] bg-secondary/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[45%] h-[55%] bg-primary/10 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[70%] h-[70%] bg-white/60 rounded-full blur-[80px]" />
      </div>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center px-5 sm:px-8 lg:px-12 xl:px-16 py-10 sm:py-12 relative z-10">
        <div className="w-full max-w-5xl xl:max-w-6xl mx-auto">

          {/* Two-column grid: left = branding/headline, right = card */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-10 lg:gap-12 xl:gap-16">

            {/* LEFT — Branding, headline, stats */}
            <div
              className="flex-1 flex flex-col gap-6 sm:gap-7
                         animate-in fade-in slide-in-from-left-6 duration-700 ease-out"
            >
              {/* Logo */}
              <div className="flex items-center gap-3">
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
              <div className="space-y-3">
                <h1
                  className="text-[2.6rem] sm:text-[3.2rem] md:text-[3.8rem]
                             lg:text-[3rem] xl:text-[3.8rem]
                             font-black text-gray-900 tracking-[-0.04em] leading-[1.05]"
                >
                  Seamless{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-blue-600 to-primary">
                    Attendance
                  </span>
                  <br />
                  Tracking.
                </h1>
                <p
                  className="text-[0.9rem] sm:text-[0.95rem] lg:text-[0.88rem] xl:text-[0.95rem]
                             font-medium text-neutral/80
                             max-w-sm sm:max-w-md lg:max-w-xs xl:max-w-sm leading-relaxed"
                >
                  From list to report in seconds. 
                  <br />
                  All data stays on your device with local storage.
                </p>
              </div>

              {/* Stat row */}
              <div className="hidden sm:flex items-center gap-6 pt-1">
                {stats.map(({ value, label }, i) => (
                  <div key={label} className="flex items-center gap-6">
                    <div className="flex flex-col gap-0.5">
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
            <div
              className="w-full lg:w-[380px] xl:w-[420px] flex-shrink-0
                         animate-in fade-in slide-in-from-right-6 duration-700 ease-out delay-150"
            >
              <div
                className="bg-white border border-gray-100 rounded-2xl sm:rounded-3xl p-6 sm:p-8
                           shadow-[0_16px_48px_-12px_rgba(0,51,160,0.12)]
                           flex flex-col gap-6"
              >
                {/* Card header */}
                <div className="space-y-1">
                  <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight">
                    Start a new session
                  </h2>
                  <p className="text-xs sm:text-[0.8rem] text-neutral/60 font-medium">
                    Name your event to get started
                  </p>
                </div>

                {/* Input */}
                <div className="space-y-2">
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
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5
                               placeholder:text-gray-300 placeholder:font-normal
                               focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary
                               transition-all text-sm font-semibold text-gray-800"
                  />
                </div>

                {/* CTA Button */}
                <button
                  onClick={handleStart}
                  className="group relative overflow-hidden
                             bg-gradient-to-r from-secondary to-[#0044cc]
                             hover:from-[#002a8a] hover:to-[#0055ff]
                             text-white rounded-xl
                             flex items-center justify-center gap-2.5
                             transition-all active:scale-[0.98]
                             shadow-[0_6px_20px_rgba(0,51,160,0.28)]
                             hover:shadow-[0_10px_28px_rgba(0,51,160,0.38)]
                             py-3.5 sm:py-4 w-full"
                >
                  <span className="font-bold text-sm tracking-wide relative z-10">
                    Start New Session
                  </span>
                  <ArrowRight
                    className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform duration-200"
                  />
                </button>

                {/* Feature icon row inside card */}
                <div className="border-t border-gray-100 pt-4 grid grid-cols-3 gap-2">
                  {features.map(({ icon: Icon, label, desc }) => (
                    <div key={label} className="flex flex-col items-center gap-1.5 text-center">
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
      <footer
        className="shrink-0 w-full bg-white border-t border-slate-200 relative z-10
                   py-4 px-5 sm:px-30
                   pb-[calc(1rem+5px)] md:pb-4
                   flex flex-col md:flex-row items-center justify-between gap-3"
      >
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