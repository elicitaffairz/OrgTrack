import React, { useMemo, useEffect } from "react";
import {
  Users,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";
import { toast } from "sonner";
import { useAttendanceStore } from "../store";
import { cn } from "../components/Layout";

export function Dashboard() {
  const { masterlist, scans, duplicateAttempts, eventName } = useAttendanceStore();

  const stats = useMemo(() => {
    const totalStudents = masterlist.length;
    const totalAttendees = scans.length;

    const initialChartData = [
      { name: "1st Year", count: 0, total: 0, fill: "#3b82f6" },
      { name: "2nd Year", count: 0, total: 0, fill: "#22c55e" },
      { name: "3rd Year", count: 0, total: 0, fill: "#f97316" },
      { name: "4th Year", count: 0, total: 0, fill: "#a855f7" },
    ];

    const chartData = initialChartData.map((level) => {
      const levelTotal = masterlist.filter((s) =>
        s.yearLevel.includes(level.name.split(" ")[0]),
      ).length;
      const levelCount = scans.filter((s) =>
        s.yearLevel.includes(level.name.split(" ")[0]),
      ).length;
      return { ...level, count: levelCount, total: levelTotal };
    });

    return {
      totalStudents,
      totalAttendees,
      remaining: totalStudents - totalAttendees,
      duplicateAttempts,
      chartData,
    };
  }, [masterlist, scans, duplicateAttempts]);

  useEffect(() => {
    const timer = setTimeout(() => {
      toast.success(`Hey there!`, {
        description: eventName ? `Session: ${eventName}` : "Ready to scan.",
        duration: 3500,
      });
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="flex flex-col min-h-full bg-bg-light">

      <style>{`
        /* ── Keyframes ── */
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeLeft {
          from { opacity: 0; transform: translateX(-20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeRight {
          from { opacity: 0; transform: translateX(20px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.92); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes barGrow {
          from { width: 0% !important; }
        }
        @keyframes pulse-soft {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.7; }
        }
        @keyframes shimmerBadge {
          0%   { background-position: -200% center; }
          100% { background-position:  200% center; }
        }

        /* ── Header ── */
        .dash-header   { animation: fadeDown 0.5s cubic-bezier(0.22,1,0.36,1) 0.05s both; }
        .dash-status   { animation: fadeIn  0.4s ease 0.35s both; }

        /* ── Left column ── */
        .dash-chart    { animation: fadeLeft 0.6s cubic-bezier(0.22,1,0.36,1) 0.18s both; }
        .dash-scan     { animation: fadeUp   0.6s cubic-bezier(0.22,1,0.36,1) 0.30s both; }

        /* ── Right column ── */
        .dash-stat-0   { animation: fadeRight 0.55s cubic-bezier(0.22,1,0.36,1) 0.22s both; }
        .dash-stat-1   { animation: fadeRight 0.55s cubic-bezier(0.22,1,0.36,1) 0.32s both; }
        .dash-remaining{ animation: scaleIn  0.6s cubic-bezier(0.34,1.4,0.64,1) 0.42s both; }
        .dash-promo    { animation: fadeUp   0.6s cubic-bezier(0.22,1,0.36,1)   0.52s both; }

        /* ── Number pop ── */
        .num-pop       { animation: countUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.55s both; }

        /* ── Progress bars animate in ── */
        .progress-bar  { animation: barGrow 1s cubic-bezier(0.22,1,0.36,1) 0.6s both; }

        /* ── Active status badge ── */
        .status-active {
          background: linear-gradient(90deg, #4ade80, #86efac, #4ade80);
          background-size: 200% auto;
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmerBadge 2.5s linear 1s infinite;
        }

        /* ── Scan card hover ── */
        .scan-card {
          transition: transform 0.2s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.2s ease;
        }
        .scan-card:hover { transform: translateY(-3px); }

        /* ── Remaining card orb ── */
        .remaining-orb {
          transition: transform 0.7s ease;
        }
        .dash-remaining:hover .remaining-orb { transform: scale(1.35); }

        /* ── Stat card lift already handled by Tailwind hover, just smooth it ── */
        .stat-card-smooth {
          transition: transform 0.22s cubic-bezier(0.34,1.56,0.64,1),
                      box-shadow 0.22s ease,
                      background-color 0.2s ease;
        }

        /* ── Promo icon float ── */
        @keyframes iconFloat {
          0%, 100% { transform: translateY(0);   }
          50%       { transform: translateY(-4px); }
        }
        .promo-icon { animation: iconFloat 3.5s ease-in-out 1.2s infinite; }

        /* ── Welcome wave on header icon ── */
        @keyframes wave {
          0%,100% { transform: rotate(0deg);   }
          20%     { transform: rotate(-15deg);  }
          40%     { transform: rotate(12deg);   }
          60%     { transform: rotate(-8deg);   }
          80%     { transform: rotate(6deg);    }
        }
        .header-icon { animation: wave 1.2s ease 0.6s 1; }
      `}</style>

      {/* Header */}
      <header className="dash-header h-16 bg-primary border-b border-primary-hover flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10 w-full shadow-md">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Users className="header-icon w-5 h-5 text-white/80" />
          Dashboard
        </h2>
        <div className="dash-status hidden sm:block text-right">
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            System Status
          </p>
          <p className="text-sm font-bold status-active">Active</p>
        </div>
        <div className="sm:hidden">
          <button
            onClick={() =>
              useAttendanceStore.getState().setEndSessionModalOpen(true)
            }
            className="text-[10px] uppercase font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg border border-white/30"
          >
            End session
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 mx-auto w-full max-w-7xl">

        {/* Left Column */}
        <div className="md:col-span-8 flex flex-col gap-6">

          {/* Chart Section */}
          <div className="dash-chart bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex-1 transition-all hover:bg-white/90">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Attendance by Year Level
              </h3>
              <div className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                Total:{" "}
                <span className="text-primary num-pop">{stats.totalAttendees}</span>
              </div>
            </div>

            <div className="space-y-6">
              {stats.chartData.map((item, idx) => {
                const percentage =
                  item.total > 0 ? (item.count / item.total) * 100 : 0;
                return (
                  <div
                    key={idx}
                    className="space-y-2"
                    style={{ animation: `fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) ${0.55 + idx * 0.1}s both` }}
                  >
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>{item.name}</span>
                      <span>
                        {item.count} / {item.total} Students
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="progress-bar h-full rounded-full"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.fill,
                          animationDelay: `${0.65 + idx * 0.1}s`,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scan Status Cards */}
          <div className="dash-scan bg-white/80 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,51,160,0.04)] border border-white">
            <h2 className="text-xs font-bold text-gray-600 tracking-widest mb-4 uppercase">
              Scan Status
            </h2>
            <div className="flex gap-3 sm:gap-4">

              <div className="scan-card flex-1 bg-green-50/70 border border-green-100 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <CheckCircle2
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600 flex-shrink-0"
                    strokeWidth={2.5}
                  />
                  <span className="text-[9px] sm:text-[11px] font-bold text-green-700 tracking-wide sm:tracking-widest leading-tight">
                    SUCCESSFUL SCANS
                  </span>
                </div>
                <p className="num-pop text-xl sm:text-2xl font-black text-green-800 leading-none">
                  {stats.totalAttendees}
                </p>
              </div>

              <div className="scan-card flex-1 bg-orange-50/70 border border-orange-200 rounded-2xl p-3.5 sm:p-5 flex flex-col justify-between shadow-sm">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle
                    className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-500 flex-shrink-0"
                    strokeWidth={2.5}
                  />
                  <span className="text-[9px] sm:text-[11px] font-bold text-orange-700 tracking-wide sm:tracking-widest leading-tight uppercase">
                    Duplicate Detected
                  </span>
                </div>
                <p className="num-pop text-lg sm:text-xl font-black text-orange-800 leading-none">
                  {stats.duplicateAttempts}
                </p>
              </div>

            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <div className="dash-stat-0">
              <StatCard
                title="Total Students"
                value={stats.totalStudents}
                className="stat-card-smooth border-gray-200"
              />
            </div>
            <div className="dash-stat-1">
              <StatCard
                title="Scanned"
                value={stats.totalAttendees}
                className="stat-card-smooth border-gray-200 border-l-4 border-l-primary"
              />
            </div>
          </div>

          {/* Remaining card */}
          <div className="dash-remaining bg-primary p-6 rounded-[2rem] shadow-[0_12px_30px_rgba(200,16,46,0.25)] text-white relative overflow-hidden group cursor-default">
            <div className="remaining-orb absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/20 rounded-full blur-xl" />
            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                  Remaining
                </p>
                <p className="num-pop text-4xl font-black">{stats.remaining}</p>
              </div>
            </div>
          </div>

          {/* Promo Card */}
          <div className="dash-promo bg-[#EBF3FF] p-6 rounded-[2rem] shadow-sm flex flex-row items-center border border-[#D1E3FF]">
            <div className="flex-1 pr-4">
              <h3 className="text-[#0033A0] font-bold text-lg leading-tight mb-2">
                Keep it organized!
              </h3>
              <p className="text-[#0033A0]/80 text-xs font-medium leading-relaxed max-w-[200px]">
                Import your masterlist and start scanning for fast and accurate
                attendance.
              </p>
            </div>
            <div className="promo-icon w-16 h-16 shrink-0 relative">
              <FileSpreadsheet
                className="w-full h-full text-[#4B8CFF] drop-shadow-sm"
                strokeWidth={1}
              />
              <Calculator
                className="w-7 h-7 absolute -bottom-1 -right-1 text-slate-700 bg-white rounded-lg p-1.5 shadow-md border border-slate-100"
                strokeWidth={2}
              />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
  className = "",
}: {
  title: string;
  value: number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "bg-white/80 backdrop-blur-md text-left rounded-[1.5rem] p-5 shadow-[0_4px_20px_rgba(0,51,160,0.03)] border border-white flex flex-col justify-between min-h-[100px] transition-all hover:-translate-y-1 hover:shadow-[0_8px_25px_rgba(0,51,160,0.05)] hover:bg-white/90",
        className,
      )}
    >
      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">
        {title}
      </p>
      <div className="flex justify-between items-end">
        <p className="num-pop text-2xl font-black text-gray-800 leading-none">
          {value}
        </p>
        {icon && <div className="text-gray-300">{icon}</div>}
      </div>
    </div>
  );
}