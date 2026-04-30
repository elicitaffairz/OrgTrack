import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { useAttendanceStore } from "../store";
import { toast } from "sonner";
import { Logo } from "../components/Logo";

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
    <div className="flex flex-col items-center justify-center min-h-[100dvh] bg-bg-light font-sans px-4 sm:px-6 w-full mx-auto relative overflow-hidden">
      {/* Subtle Data Grid Background */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(var(--color-secondary) 1px, transparent 1px), linear-gradient(90deg, var(--color-secondary) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
        {/* Soft radial gradients for glassmorphism backdrops */}
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-secondary/15 rounded-full blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] bg-white/50 rounded-full blur-[100px]" />
      </div>

      <div className="w-full max-w-3xl relative z-10 flex flex-col items-center animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
        {/* Brand Logo */}
        <div className="mb-8 flex items-center justify-center w-full">
          <Logo className="w-20 h-20 drop-shadow-md" />
          <div className="flex flex-col items-start justify-center pt-1">
            <span className="text-[2.3rem] font-black text-secondary tracking-[-0.03em] leading-[0.9]">
              OrgTrack
            </span>
            <span className="text-[.9rem] font-medium text-secondary tracking-tight mt-2.5 leading-none">
              Attendance Monitoring
            </span>
          </div>
        </div>

        {/* Hero Typography */}
        <div className="text-center space-y-6 mb-12 flex flex-col items-center">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-black text-gray-900 tracking-tighter leading-[1.1]">
            Seamless <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary via-blue-600 to-primary">
              Attendance
            </span>{" "}
            Tracking
          </h1>
          <p className="text-base sm:text-lg font-medium text-neutral max-w-xl mx-auto leading-relaxed">
            Eliminate bottlenecks. Import master lists, rapidly scan your
            students via QR, and export detailed reports in seconds.
          </p>
        </div>

        {/* Action Card with Deep Glassmorphism */}
        <div className="bg-white/40 backdrop-blur-2xl p-2 sm:p-2.5 rounded-[2rem] sm:rounded-[2.5rem] shadow-[0_20px_40px_-15px_rgba(0,51,160,0.1)] border border-white/60 w-full max-w-md mx-auto transition-all hover:bg-white/50 hover:shadow-[0_20px_40px_-10px_rgba(0,51,160,0.15)] hover:border-primary/80">
          <div className="bg-white/70 rounded-[1.5rem] sm:rounded-[2rem] p-6 sm:p-8 flex flex-col items-center gap-6 shadow-sm border border-white/50">
            <div className="w-full space-y-2">
              <label
                htmlFor="eventName"
                className="block text-xs font-bold text-secondary uppercase tracking-wider ml-1"
              >
                Event Name
              </label>
              <div className="relative w-full group">
                <input
                  id="eventName"
                  type="text"
                  placeholder="e.g. IT Gen Assembly 2024"
                  value={eventInput}
                  onChange={(e) => setEventInput(e.target.value)}
                  className="w-full bg-white/90 border border-gray-200/80 rounded-2xl px-5 py-4 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all text-base font-semibold text-gray-800 shadow-[0_2px_8px_rgba(0,0,0,0.02)] relative z-10"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleStart();
                    }
                  }}
                />
              </div>
            </div>

            <button
              onClick={handleStart}
              className="relative overflow-hidden group bg-gradient-to-r from-secondary to-[#0044cc] hover:from-secondary hover:to-[#0055ff] text-white px-8 py-4 sm:py-4.5 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-[0_8px_20px_rgba(0,51,160,0.25)] hover:shadow-[0_12px_25px_rgba(0,51,160,0.35)] w-full min-h-[56px]"
            >
              <span className="relative z-10 font-bold text-[15px] tracking-wide">
                Start New Session
              </span>
              <ArrowRight className="w-5 h-5 relative z-10 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-[11px] font-medium text-neutral text-center opacity-80 mt-1">
              Press Enter to continue
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
