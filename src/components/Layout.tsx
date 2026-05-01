import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ScanLine,
  FileSpreadsheet,
  Github,
  Linkedin,
} from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useAttendanceStore } from "../store";
import { Logo } from "./Logo";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const {
    eventName,
    resetSession,
    clearMasterlist,
    isEndSessionModalOpen,
    setEndSessionModalOpen,
  } = useAttendanceStore();

  const confirmEndSession = () => {
    clearMasterlist();
    resetSession();
    setEndSessionModalOpen(false);
    navigate("/");
  };

  return (
    <div className="flex justify-center min-h-[100dvh] bg-bg-light font-sans overflow-hidden">
      {isEndSessionModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setEndSessionModalOpen(false)}
          ></div>
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-[0_10px_40px_rgba(0,51,160,0.1)] scale-100 animate-in zoom-in-95 duration-200 border border-white">
            <h3 className="font-bold text-gray-800 text-lg mb-2">
              End Session?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to end this session? This will clear all
              current attendance records and the imported masterlist.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setEndSessionModalOpen(false)}
                className="flex-1 py-4 px-4 bg-white border border-gray-200/80 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={confirmEndSession}
                className="flex-1 py-4 px-4 bg-gradient-to-r from-primary to-[#9e0520] hover:from-primary hover:to-[#a00018] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(200,16,46,0.25)] min-h-[44px]"
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-full flex flex-col md:flex-row h-[100dvh] max-h-[100dvh]">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-secondary text-white shadow-[4px_0_24px_rgba(0,51,160,0.1)] h-full sticky top-0 z-30">
          <div className="p-6 mb-4">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 flex items-center justify-center">
                <Logo className="w-10 h-10" />
              </div>
              <div>
                <h1 className="text-sm font-black leading-tight tracking-wider">
                  OrgTrack
                </h1>
                <p className="text-[10px] text-white/60 uppercase tracking-widest mt-0.5">
                  Attendance Monitoring
                </p>
              </div>
            </div>

            <nav className="space-y-2">
              <NavLink
                to="/dashboard"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                    isActive ? "bg-white/20" : "hover:bg-white/10 font-medium",
                  )
                }
              >
                <LayoutDashboard className="w-4 h-4" strokeWidth={2} />
                Dashboard
              </NavLink>
              <NavLink
                to="/scan"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                    isActive ? "bg-white/20" : "hover:bg-white/10 font-medium",
                  )
                }
              >
                <ScanLine className="w-4 h-4" strokeWidth={2} />
                Live Scan
              </NavLink>
              <NavLink
                to="/files"
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors",
                    isActive ? "bg-white/20" : "hover:bg-white/10 font-medium",
                  )
                }
              >
                <FileSpreadsheet className="w-4 h-4" strokeWidth={2} />
                Files & Export
              </NavLink>
            </nav>
          </div>

          <div className="mt-auto p-6">
            <div className="bg-black/10 rounded-xl p-4">
              <p className="text-[10px] uppercase font-bold tracking-widest opacity-60 mb-2">
                Session Status
              </p>
              <p className="text-xs">Active Event: {eventName || "None"}</p>
              <button
                className="w-full mt-4 py-3 px-4 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl transition-all cursor-pointer text-center min-h-[44px] backdrop-blur-sm border border-white/5"
                onClick={() => setEndSessionModalOpen(true)}
              >
                End Session
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 flex flex-col h-full overflow-y-auto overflow-x-hidden w-full relative scroll-smooth bg-bg-light">
          <div className="flex-1 shrink-0 flex flex-col">
            <Outlet />
          </div>

          <footer className="shrink-0 w-full bg-white border-t border-slate-200 py-6 px-4 md:px-8 pb-[calc(1.5rem+60px)] md:pb-6 mt-auto flex flex-col md:flex-row items-center justify-between gap-4 z-10">
            <div className="flex flex-col items-center md:items-start gap-1">
              <p className="text-xs text-slate-500 font-medium">
                &copy; {new Date().getFullYear()} OrgTrack.
                All rights reserved.
              </p>
              <p className="text-[10px] text-slate-400">
                Eliza Marie Abing | BSIT
              </p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/elicitaffairz"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                <Github className="w-5 h-5" />
              </a>
              <a
                href="hhttps://www.linkedin.com/in/eliza-abing-272b0b244/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-slate-400 hover:text-primary transition-colors p-2 hover:bg-slate-50 rounded-full"
              >
                <Linkedin className="w-5 h-5" />
              </a>
            </div>
          </footer>
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 flex justify-around items-center h-[72px] z-50 px-2 pb-safe shadow-[0_-8px_30px_rgba(0,0,0,0.04)]">
          <NavLink
            to="/dashboard"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 min-w-[70px] min-h-[44px] transition-all rounded-xl",
                isActive ? "text-primary" : "text-neutral hover:text-slate-600",
              )
            }
          >
            {({ isActive }) => (
              <>
                <LayoutDashboard
                  className={cn(
                    "w-6 h-6 mb-1.5 transition-transform",
                    isActive ? "scale-110" : "scale-100",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] transition-all",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  Dashboard
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/scan"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 min-w-[70px] min-h-[44px] transition-all rounded-xl",
                isActive ? "text-primary" : "text-neutral hover:text-slate-600",
              )
            }
          >
            {({ isActive }) => (
              <>
                <ScanLine
                  className={cn(
                    "w-6 h-6 mb-1.5 transition-transform",
                    isActive ? "scale-110" : "scale-100",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] transition-all",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  Scan
                </span>
              </>
            )}
          </NavLink>

          <NavLink
            to="/files"
            className={({ isActive }) =>
              cn(
                "flex flex-col items-center justify-center p-2 min-w-[70px] min-h-[44px] transition-all rounded-xl",
                isActive ? "text-primary" : "text-neutral hover:text-slate-600",
              )
            }
          >
            {({ isActive }) => (
              <>
                <FileSpreadsheet
                  className={cn(
                    "w-6 h-6 mb-1.5 transition-transform",
                    isActive ? "scale-110" : "scale-100",
                  )}
                  strokeWidth={isActive ? 2.5 : 2}
                />
                <span
                  className={cn(
                    "text-[10px] transition-all",
                    isActive ? "font-bold" : "font-medium",
                  )}
                >
                  Files
                </span>
              </>
            )}
          </NavLink>
        </nav>
      </div>
    </div>
  );
}
