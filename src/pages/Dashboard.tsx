import React, { useMemo } from "react";
import {
  Download,
  Users,
  Clock,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Calculator,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { useAttendanceStore } from "../store";
import { cn } from "../components/Layout";

export function Dashboard() {
  const { masterlist, scans, duplicateAttempts } = useAttendanceStore();

  const stats = useMemo(() => {
    const totalStudents = masterlist.length;
    const totalAttendees = scans.length;

    // Group attendance by year level
    const initialChartData = [
      { name: "1st Year", count: 0, total: 0, fill: "#3b82f6" }, // blue
      { name: "2nd Year", count: 0, total: 0, fill: "#22c55e" }, // green
      { name: "3rd Year", count: 0, total: 0, fill: "#f97316" }, // orange
      { name: "4th Year", count: 0, total: 0, fill: "#a855f7" }, // purple
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

  // Using custom horizontal bar chart with native tailwind elements for a cleaner look than recharts for simple horizontal bars
  return (
    <div className="flex flex-col min-h-full bg-bg-light">
      <header className="h-16 bg-primary border-b border-primary-hover flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10 w-full shadow-md">
        <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
          <Users className="w-5 h-5 text-white/80" />
          Dashboard
        </h2>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            System Status
          </p>
          <p className="text-sm font-bold text-green-400">Active</p>
        </div>
        <div className="sm:hidden">
          <button
            onClick={() =>
              useAttendanceStore.getState().setEndSessionModalOpen(true)
            }
            className="text-[10px] uppercase font-bold text-white bg-white/20 px-3 py-1.5 rounded-lg border border-white/30"
          >
            End
          </button>
        </div>
      </header>

      <div className="p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 mx-auto w-full max-w-7xl">
        {/* Left Column containing Charts in high density, but we'll adapt to existing components */}
        <div className="md:col-span-8 flex flex-col gap-6">
          {/* Chart Section */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] border border-white flex-1 transition-all hover:bg-white/90">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xs font-bold text-gray-600 uppercase tracking-widest">
                Attendance by Year Level
              </h3>
              <div className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded border border-gray-200 flex items-center gap-1">
                Total:{" "}
                <span className="text-primary">{stats.totalAttendees}</span>
              </div>
            </div>

            <div className="space-y-6">
              {stats.chartData.map((item, idx) => {
                const percentage =
                  item.total > 0 ? (item.count / item.total) * 100 : 0;
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-[11px] font-bold text-gray-500">
                      <span>{item.name}</span>
                      <span>
                        {item.count} / {item.total} Students
                      </span>
                    </div>
                    <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: item.fill,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Scan Status Cards */}
          <div className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,51,160,0.04)] border border-white">
            <h2 className="text-xs font-bold text-gray-600 tracking-widest mb-4 uppercase">
              Scan Status
            </h2>
            <div className="flex gap-4">
              <div className="flex-1 bg-green-50/70 border border-green-100 rounded-2xl p-5 self-stretch flex flex-col justify-between transition-all hover:bg-green-50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2
                    className="w-4 h-4 text-green-600 mb-[2px]"
                    strokeWidth={2.5}
                  />
                  <span className="text-[11px] font-bold text-green-700 tracking-widest">
                    SUCCESSFUL SCANS
                  </span>
                </div>
                <div>
                  <p className="text-2xl font-black text-green-800 leading-none">
                    {stats.totalAttendees}
                  </p>
                </div>
              </div>

              <div className="flex-1 bg-orange-50/70 border border-orange-200 rounded-2xl p-5 self-stretch flex flex-col justify-between transition-all hover:bg-orange-50 shadow-sm">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle
                    className="w-4 h-4 text-orange-500 mb-[2px]"
                    strokeWidth={2.5}
                  />
                  <span className="text-[11px] font-bold text-orange-700 tracking-widest uppercase">
                    Duplicate Detected
                  </span>
                </div>
                <div>
                  <p className="text-xl font-black text-orange-800 leading-none">
                    {stats.duplicateAttempts}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Stats */}
        <div className="md:col-span-4 flex flex-col gap-6">
          <div className="grid grid-cols-2 md:grid-cols-1 gap-4">
            <StatCard
              title="Total Students"
              value={stats.totalStudents}
              className="border-gray-200"
            />
            <StatCard
              title="Scanned"
              value={stats.totalAttendees}
              className="border-gray-200 border-l-4 border-l-primary"
            />
          </div>

          <div className="bg-primary p-6 rounded-[2rem] shadow-[0_12px_30px_rgba(200,16,46,0.25)] text-white relative overflow-hidden group">
            {/* Background geometric accents */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/10 rounded-full blur-2xl transition-transform duration-700 group-hover:scale-125" />
            <div className="absolute -bottom-10 -left-10 w-24 h-24 bg-black/20 rounded-full blur-xl" />

            <div className="relative z-10 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-80 mb-1">
                  Remaining
                </p>
                <p className="text-4xl font-black">{stats.remaining}</p>
              </div>
            </div>
          </div>

          {/* Promo Card */}
          <div className="bg-[#EBF3FF] p-6 rounded-[2rem] shadow-sm flex flex-row items-center border border-[#D1E3FF] mt-2">
            <div className="flex-1 pr-4">
              <h3 className="text-[#0033A0] font-bold text-lg leading-tight mb-2">
                Keep it organized!
              </h3>
              <p className="text-[#0033A0]/80 text-xs font-medium leading-relaxed max-w-[200px]">
                Import your masterlist and start scanning for fast and accurate
                attendance.
              </p>
            </div>
            <div className="w-16 h-16 shrink-0 relative">
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
        <p className="text-2xl font-black text-gray-800 leading-none">
          {value}
        </p>
        {icon && <div className="text-gray-300">{icon}</div>}
      </div>
    </div>
  );
}
