import React, { useState, useRef } from "react";
import Papa from "papaparse";
import { read, utils, writeFile } from "xlsx";
import { UploadCloud, FileDown, Trash2, CheckCircle2, ChevronDown } from "lucide-react";
import { useAttendanceStore, Student } from "../store";
import { toast } from "sonner";

export function Files() {
  const {
    masterlist,
    scans,
    importMasterlist,
    clearMasterlist,
    clearScans,
    masterlistFilename,
  } = useAttendanceStore();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportWorkbookRef = useRef<any | null>(null);
  const [filter, setFilter] = useState("All Reports");

  const [isRemoveListModalOpen, setIsRemoveListModalOpen] = useState(false);
  const [isClearScansModalOpen, setIsClearScansModalOpen] = useState(false);
  const [pendingExport, setPendingExport] = useState<{
    yearFilter: string;
    filename: string;
    recordCount: number;
  } | null>(null);

  const parseRowsToStudents = (rows: any[]): Student[] => {
    return rows
      .map((row) => {
        const keys = Object.keys(row ?? {});
        const getVal = (possibleNames: string[]) => {
          const matchedKey = keys.find((k) =>
            possibleNames.some(
              (name) =>
                k.replace(/\s+/g, "").toLowerCase() ===
                name.replace(/\s+/g, "").toLowerCase(),
            ),
          );
          return matchedKey ? row[matchedKey] : "";
        };

        const student: Student = {
          id: String(
            getVal([
              "Student ID",
              "ID",
              "ID NUMBER",
              "ID Number",
              "Student Number",
            ]),
          ).trim(),
          name: String(getVal(["Name", "Student Name", "Full Name"]))
            .trim()
            .replace(/\s+/g, " "),
          yearLevel: String(getVal(["Year Level", "Year", "Level"]) || "Unknown").trim(),
          course: String(getVal(["Course", "Program", "Degree"]) || "Unknown").trim(),
        };

        return student;
      })
      .filter((s) => s.id && s.name);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCsv = file.name.toLowerCase().endsWith(".csv");

    const onParsedStudents = (parsedList: Student[]) => {
      if (parsedList.length > 0) {
        importMasterlist(parsedList, file.name);
        toast.success(
          `Successfully imported ${parsedList.length} students from ${file.name}`,
        );
      } else {
        toast.error(
          "No valid student data found in the file. Please check column headers.",
        );
      }

      if (fileInputRef.current) fileInputRef.current.value = "";
    };

    if (isCsv) {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: "greedy",
        complete: (results) => {
          try {
            const rows = Array.isArray(results.data) ? results.data : [];
            onParsedStudents(parseRowsToStudents(rows as any[]));
          } catch {
            toast.error(
              "Error processing the file. Please ensure it's a valid CSV/Excel file.",
            );
            if (fileInputRef.current) fileInputRef.current.value = "";
          }
        },
        error: () => {
          toast.error(
            "Error processing the file. Please ensure it's a valid CSV/Excel file.",
          );
          if (fileInputRef.current) fileInputRef.current.value = "";
        },
      });
      return;
    }

    const fileReader = new FileReader();
    fileReader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = utils.sheet_to_json(ws) as any[];
        onParsedStudents(parseRowsToStudents(data));
      } catch (err) {
        toast.error(
          "Error processing the file. Please ensure it's a valid CSV/Excel file.",
        );
        if (fileInputRef.current) fileInputRef.current.value = "";
      }
    };
    fileReader.readAsBinaryString(file);
  };

  const hasMasterlist = masterlist.length > 0;

  const prepareExport = (yearFilter: string) => {
    let filteredScans = scans;
    if (yearFilter !== "All Reports") {
      const yearStr = yearFilter.split("-")[0];
      filteredScans = scans.filter((s) => s.yearLevel.includes(yearStr));
    }

    if (filteredScans.length === 0) {
      toast.error(`No attendance records to export for ${yearFilter}`);
      return;
    }

    const exportReady = filteredScans.map((s) => ({
      "Student ID": s.id,
      Name: s.name,
      Course: s.course,
      "Year Level": s.yearLevel,
      "Time Scanned": s.timestamp,
    }));

    const ws = utils.json_to_sheet(exportReady);
    const wb = utils.book_new();
    utils.book_append_sheet(wb, ws, "Attendance");
    const dateStr = new Date()
      .toLocaleDateString("en-US", {
        month: "short",
        day: "2-digit",
        year: "numeric",
      })
      .replace(/ /g, "-")
      .replace(/,/g, "");

    const filename =
      yearFilter === "All Reports"
        ? `All-Attendance-Report_${dateStr}.xlsx`
        : `${yearFilter}_${dateStr}.xlsx`;

    exportWorkbookRef.current = wb;
    setPendingExport({
      yearFilter,
      filename,
      recordCount: exportReady.length,
    });
  };

  const downloadPreparedExport = () => {
    if (!pendingExport || !exportWorkbookRef.current) return;
    writeFile(exportWorkbookRef.current, pendingExport.filename);
    toast.success(`Exported ${pendingExport.filename}`);
    exportWorkbookRef.current = null;
    setPendingExport(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-bg-light relative">
      {pendingExport && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => {
              exportWorkbookRef.current = null;
              setPendingExport(null);
            }}
          ></div>
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-[0_10px_40px_rgba(0,51,160,0.1)] scale-100 animate-in zoom-in-95 duration-200 border border-white">
            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Download Report?
            </h3>
            <p className="text-gray-500 text-sm mb-5">
              You’re about to download <span className="font-semibold">{pendingExport.filename}</span>
              {" "}({pendingExport.recordCount} records).
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => {
                  exportWorkbookRef.current = null;
                  setPendingExport(null);
                }}
                className="flex-1 py-4 px-4 bg-white border border-gray-200/80 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={downloadPreparedExport}
                className="flex-1 py-4 px-4 bg-gradient-to-r from-secondary to-[#0044cc] hover:from-secondary hover:to-[#0055ff] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(0,51,160,0.25)] min-h-[44px]"
              >
                Download
              </button>
            </div>
          </div>
        </div>
      )}

      {isRemoveListModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsRemoveListModalOpen(false)}
          ></div>
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-[0_10px_40px_rgba(0,51,160,0.1)] scale-100 animate-in zoom-in-95 duration-200 border border-white">
            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Remove List?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to remove the masterlist? This will reset
              all current attendance records and the imported masterlist.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsRemoveListModalOpen(false)}
                className="flex-1 py-4 px-4 bg-white border border-gray-200/80 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearMasterlist();
                  toast.info("Masterlist removed.");
                  setIsRemoveListModalOpen(false);
                }}
                className="flex-1 py-4 px-4 bg-gradient-to-r from-primary to-[#9e0520] hover:from-primary hover:to-[#a00018] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(200,16,46,0.25)] min-h-[44px]"
              >
                Remove List
              </button>
            </div>
          </div>
        </div>
      )}

      {isClearScansModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setIsClearScansModalOpen(false)}
          ></div>
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 w-full max-w-sm relative z-10 shadow-[0_10px_40px_rgba(0,51,160,0.1)] scale-100 animate-in zoom-in-95 duration-200 border border-white">
            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Clear Scans?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Are you sure you want to reset all attendance records? This action
              cannot be undone.
            </p>
            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setIsClearScansModalOpen(false)}
                className="flex-1 py-4 px-4 bg-white border border-gray-200/80 text-gray-600 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  clearScans();
                  toast.info("Attendance records cleared.");
                  setIsClearScansModalOpen(false);
                }}
                className="flex-1 py-4 px-4 bg-gradient-to-r from-primary to-[#9e0520] hover:from-primary hover:to-[#a00018] text-white rounded-xl font-bold text-xs uppercase tracking-widest transition-all shadow-[0_8px_20px_rgba(200,16,46,0.25)] min-h-[44px]"
              >
                Clear Scans
              </button>
            </div>
          </div>
        </div>
      )}

      <header className="h-16 bg-primary border-b border-primary-hover flex items-center justify-between px-6 sm:px-8 sticky top-0 z-10 shadow-md text-white">
        <h2 className="text-lg sm:text-xl font-bold text-white">
          Import & Export
        </h2>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            System Status
          </p>
          <p className="text-sm font-bold text-green-400">Active</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 mx-auto w-full max-w-4xl space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Import Section */}
          <section className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,51,160,0.03)] border border-white">
            <h2 className="text-xs font-bold text-gray-600 tracking-widest mb-4 uppercase">
              Import Masterlist
            </h2>

            <div
              className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center transition-all relative ${hasMasterlist ? "border-green-300 bg-green-50/50 cursor-default" : "border-gray-200/80 bg-white/50 cursor-pointer hover:bg-white/80 hover:border-gray-300 shadow-[0_2px_8px_rgba(0,0,0,0.02)]"}`}
              onClick={() => !hasMasterlist && fileInputRef.current?.click()}
            >
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                disabled={hasMasterlist}
              />
              {hasMasterlist ? (
                <>
                  <CheckCircle2 className="w-10 h-10 text-green-500 mb-3" />
                  <p className="font-bold text-gray-800">Masterlist Imported</p>
                  <p className="text-xs text-gray-500 font-medium mt-1">
                    {masterlist.length} students loaded
                  </p>
                  {masterlistFilename && (
                    <p className="text-[10px] text-gray-400 mt-2 truncate w-full px-4">
                      <CheckCircle2 className="inline w-3 h-3 mr-1 text-green-500" />
                      {masterlistFilename}
                    </p>
                  )}
                </>
              ) : (
                <>
                  <div className="bg-gray-100 p-3 rounded-lg mb-3">
                    <UploadCloud className="w-6 h-6 text-gray-400" />
                  </div>
                  <p className="font-bold text-gray-600 text-sm">
                    Drag or tap to import
                  </p>
                  <p className="text-xs text-gray-400 font-medium mt-1">
                    .xlsx • .csv • .xls accepted
                  </p>
                </>
              )}
            </div>

            {!hasMasterlist && (
              <div className="mt-4 flex justify-center">
                <button
                  onClick={() => {
                    const ws = utils.json_to_sheet([
                      {
                        "Student ID": "",
                        Name: "",
                        Course: "",
                        "Year Level": "1st Year",
                      },
                    ]);
                    const wb = utils.book_new();
                    utils.book_append_sheet(wb, ws, "Template");
                    writeFile(wb, "Masterlist-Template.xlsx");
                    toast.success(
                      "Template downloaded. Fill it out and import it.",
                    );
                  }}
                  className="text-[10px] font-bold text-primary hover:underline uppercase tracking-wider flex items-center justify-center gap-1.5"
                >
                  <FileDown className="w-3 h-3" />
                  Download Empty Template
                </button>
              </div>
            )}

            {(hasMasterlist || scans.length > 0) && (
              <div className="mt-4 flex gap-2">
                {hasMasterlist && (
                  <button
                    onClick={() => setIsRemoveListModalOpen(true)}
                    className="flex-1 bg-red-50 hover:bg-red-100 text-primary transition-colors py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Remove List
                  </button>
                )}
                {scans.length > 0 && (
                  <button
                    onClick={() => setIsClearScansModalOpen(true)}
                    className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors py-2.5 rounded-lg font-bold text-[10px] uppercase tracking-wider flex items-center justify-center gap-1.5"
                  >
                    Clear Scans
                  </button>
                )}
              </div>
            )}
          </section>

          {/* Export Section */}
          <section className="bg-white/80 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-[0_4px_20px_rgba(0,51,160,0.03)] border border-white">
            <h2 className="text-xs font-bold text-gray-600 tracking-widest mb-4 uppercase">
              Export Reports
            </h2>

            <div className="space-y-4">
              {/* FIXED: wrapped in relative div with custom ChevronDown */}
              <div className="relative">
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="appearance-none w-full bg-white border border-gray-200/80 text-gray-700 text-sm font-bold rounded-2xl pl-5 pr-10 py-3.5 outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer min-h-[44px]"
                >
                  <option value="All Reports">All Reports</option>
                  <option value="1st Year">1st Year Only</option>
                  <option value="2nd Year">2nd Year Only</option>
                  <option value="3rd Year">3rd Year Only</option>
                  <option value="4th Year">4th Year Only</option>
                </select>
                <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="space-y-2 mt-4">
                {["1st-Year", "2nd-Year", "3rd-Year", "4th-Year"].map(
                  (yearMatch) => {
                    if (
                      filter !== "All Reports" &&
                      !filter.includes(yearMatch.split("-")[0])
                    )
                      return null;
                    return (
                      <div
                        key={yearMatch}
                        className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50/50 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="bg-green-100 p-1.5 rounded-lg">
                            <FileDown className="w-4 h-4 text-green-600" />
                          </div>
                          <span className="text-xs font-bold text-gray-700">
                            {yearMatch.replace("-", " ")} Report
                          </span>
                        </div>
                        <button
                          onClick={() => prepareExport(yearMatch)}
                          className="bg-gradient-to-r from-secondary to-[#0044cc] hover:from-secondary hover:to-[#0055ff] text-white text-[10px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(0,51,160,0.2)] hover:shadow-[0_6px_16px_rgba(0,51,160,0.3)]"
                        >
                          Export
                        </button>
                      </div>
                    );
                  },
                )}

                {filter === "All Reports" && (
                  <div className="flex items-center justify-between p-3 border border-gray-200 rounded-xl bg-gray-100 mt-4">
                    <div className="flex items-center gap-3">
                      <div className="bg-gray-200 p-1.5 rounded-lg">
                        <FileDown className="w-4 h-4 text-gray-600" />
                      </div>
                      <span className="text-xs font-bold text-gray-800">
                        All Attendance Report
                      </span>
                    </div>
                    <button
                      onClick={() => prepareExport("All Reports")}
                      className="bg-gray-800 hover:bg-black text-white text-[10px] font-bold px-4 py-2 rounded-lg uppercase tracking-widest transition-all shadow-[0_4px_12px_rgba(0,0,0,0.2)] hover:shadow-[0_6px_16px_rgba(0,0,0,0.3)] min-h-[36px]"
                    >
                      Export All
                    </button>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}