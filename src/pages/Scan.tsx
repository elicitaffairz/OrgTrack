import React, { useState, useEffect, useRef } from "react";
import { Html5Qrcode, CameraDevice } from "html5-qrcode";
import {
  ChevronLeft,
  UserPlus,
  X,
  Search,
  ChevronDown,
  Camera,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useAttendanceStore } from "../store";
import { toast } from "sonner";
import { cn } from "../components/Layout";

export function Scan() {
  const navigate = useNavigate();
  const { scans, addScan } = useAttendanceStore();
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCourse, setManualCourse] = useState("");
  const [manualYear, setManualYear] = useState("1st Year");
  const manualYearRef = useRef(manualYear);
  useEffect(() => {
    manualYearRef.current = manualYear;
  }, [manualYear]);
  const [filterYear, setFilterYear] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "barcode">("camera");
  const [barcodeInput, setBarcodeInput] = useState("");

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");

  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    Html5Qrcode.getCameras()
      .then((devices) => {
        if (devices && devices.length) {
          setCameras(devices);

          // Try to find the back/environment camera first
          const environmentCamera = devices.find(
            (device) =>
              device.label.toLowerCase().includes("back") ||
              device.label.toLowerCase().includes("environment") ||
              device.label.toLowerCase().includes("rear")
          );

          if (environmentCamera) {
            setSelectedCameraId(environmentCamera.id);
          } else {
            setSelectedCameraId(devices[0].id);
          }
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        toast.error("Could not access cameras. Please check permissions.");
      });
  }, []);

  useEffect(() => {
    if (
      scanMode !== "camera" ||
      !selectedCameraId ||
      !document.getElementById("reader")
    )
      return;

    let isMounted = true;
    let isStarting = true;
    const html5QrCode = new Html5Qrcode("reader");
    scannerRef.current = html5QrCode;

    let lastScanTime = 0;

    html5QrCode
      .start(
        selectedCameraId,
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }, // Square box for QR Code
        },
        (decodedText) => {
          // Basic debounce for scanning
          const now = Date.now();
          if (now - lastScanTime < 1500) return;
          lastScanTime = now;
          handleScanSubmit(decodedText);
        },
        (error) => {
          // ignoring errors for smooth UX as it continuously throws when nothing is found
        },
      )
      .then(() => {
        isStarting = false;
        if (!isMounted) {
          html5QrCode
            .stop()
            .then(() => html5QrCode.clear())
            .catch(console.error);
        }
      })
      .catch((err) => {
        isStarting = false;
        console.error("Error starting scanner", err);
      });

    return () => {
      isMounted = false;
      if (isStarting) {
        return;
      }
      if (html5QrCode.isScanning) {
        html5QrCode
          .stop()
          .then(() => {
            html5QrCode.clear();
          })
          .catch(console.error);
      } else {
        try {
          html5QrCode.clear();
        } catch (e) {
          console.error("Error clearing scanner", e);
        }
      }
    };
  }, [selectedCameraId, scanMode]);

  const handleScanSubmit = (id: string, overrideYear?: string) => {
    if (!id.trim()) return;
    const activeYearToUse = overrideYear || manualYearRef.current;
    const result = addScan(id.trim(), undefined, activeYearToUse);
    if (result.success) {
      toast.success(result.message, {
        description: `${result.student?.name} (${result.student?.id})`,
      });
    } else if (result.code === "DUPLICATE") {
      toast.warning(result.message, {
        description: `${result.student?.name} has already been stamped.`,
      });
    } else if (result.code === "NOT_FOUND") {
      toast.info("New ID Detected", {
        description: "Please enter student info for this new ID.",
      });
      setManualId(id.trim());
      setManualName("");
      setManualCourse("");
      // Keep selected manualYear
      setManualModalOpen(true);
    } else {
      toast.error(result.message);
    }
  };

  const onManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;

    const result = addScan(
      manualId,
      {
        name: manualName,
        course: manualCourse,
        yearLevel: manualYear,
      },
      manualYear,
    );

    if (result.success) {
      toast.success(result.message, {
        description: `${result.student?.name} (${result.student?.id})`,
      });
    } else if (result.code === "DUPLICATE") {
      toast.warning(result.message, {
        description: `${result.student?.name} has already been stamped.`,
      });
    } else {
      toast.error(result.message);
    }

    setManualId("");
    setManualName("");
    setManualCourse("");
    // Keep selected manualYear
    setManualModalOpen(false);
  };

  const onBarcodeScannerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;
    handleScanSubmit(barcodeInput);
    setBarcodeInput(""); // reset for next scan
  };

  const getYearBadgeColor = (year: string) => {
    if (year.includes("1st")) return "bg-blue-100 text-blue-700";
    if (year.includes("2nd")) return "bg-green-100 text-green-700";
    if (year.includes("3rd")) return "bg-orange-100 text-orange-700";
    if (year.includes("4th")) return "bg-purple-100 text-purple-700";
    return "bg-slate-100 text-slate-700";
  };

  const filteredScans = scans.filter(
    (s) =>
      filterYear === "All" || s.yearLevel.includes(filterYear.split(" ")[0]),
  );

  return (
    <div className="flex flex-col min-h-full bg-bg-light relative pb-10">
      <header className="h-16 bg-primary border-b border-primary-hover flex items-center justify-between px-6 sm:px-8 sticky top-0 z-20 shadow-md text-white">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 text-white/80 hover:text-white transition-colors md:hidden"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-white">Live Scan</h2>
        </div>
        <div className="hidden sm:block text-right">
          <p className="text-[10px] font-bold text-white/80 uppercase tracking-widest">
            Scanner Status
          </p>
          <p className="text-sm font-bold text-green-400">Online</p>
        </div>
      </header>

      <div className="p-4 sm:p-6 mx-auto w-full max-w-4xl space-y-6">
        {/* Year Level Pre-Selector */}
        <div className="bg-white/80 backdrop-blur-md rounded-3xl shadow-[0_4px_20px_rgba(0,51,160,0.03)] border border-white p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-gray-800">
                Active Year Level
              </h3>
              <p className="text-xs text-gray-500 font-medium mt-1">
                Select the year level for new or unlisted students
              </p>
            </div>
            {/* FIXED: wrapped in relative div with custom ChevronDown */}
            <div className="relative w-full sm:w-auto">
              <select
                value={manualYear}
                onChange={(e) => setManualYear(e.target.value)}
                className="appearance-none bg-white border border-gray-200/80 text-gray-800 text-sm font-bold rounded-2xl pl-4 pr-10 py-3.5 outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer w-full min-h-[44px]"
              >
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
              <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Scan Mode Toggle */}
        <div className="flex bg-white/80 backdrop-blur-md p-1 rounded-2xl w-full border border-gray-200/80 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
          <button
            onClick={() => setScanMode("camera")}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
              scanMode === "camera"
                ? "bg-primary text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            )}
          >
            Camera 
          </button>
          <button
            onClick={() => setScanMode("barcode")}
            className={cn(
              "flex-1 py-3 rounded-xl text-sm font-bold transition-all duration-300",
              scanMode === "barcode"
                ? "bg-primary text-white shadow-md"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50",
            )}
          >
            Barcode 
          </button>
        </div>

        {/* Scanner Viewfinder Box */}
        {scanMode === "camera" ? (
          <div className="bg-white rounded-3xl shadow-lg shadow-secondary/5 border border-white p-2 relative overflow-hidden">
            {/* Custom scan line animation wrapper */}
            <div className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Cleaner Integrated Scanner UI overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                <div className="w-[250px] h-[250px] rounded-xl relative">
                  <div className="w-full h-[2px] bg-red-500 blur-[1px] absolute top-1/2 -translate-y-1/2 animate-[scan-line_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                </div>
              </div>

              <div
                id="reader"
                className="w-full relative z-10 [&_video]:object-cover"
                style={{ minHeight: "200px" }}
              ></div>
            </div>

            {cameras.length > 1 && (
              <div className="absolute top-6 right-6 z-30">
                <div className="relative bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center pr-2 transition-all hover:bg-black/60">
                  <div className="pl-3 pr-2 py-2.5 text-white/80">
                    <Camera className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="bg-transparent border-none text-xs font-bold text-white py-2 pr-6 focus:ring-0 focus:outline-none appearance-none cursor-pointer placeholder:text-white"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label ||
                          `Camera ${camera.id.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
                </div>
              </div>
            )}

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 z-30">
              Live Camera Feed
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg shadow-secondary/5 border border-white p-6 sm:p-10 relative overflow-hidden flex flex-col items-center justify-center">
            <div className="bg-gray-100 p-4 rounded-full mb-6">
              <Search className="w-8 h-8 text-secondary" />
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-2 text-center">
              Ready for Barcode Scanner
            </h3>
            <p className="text-gray-500 text-sm mb-8 text-center max-w-sm">
              Please focus the input below and use your hardware barcode scanner
              to scan IDs.
            </p>

            <form
              onSubmit={onBarcodeScannerSubmit}
              className="w-full max-w-md relative"
            >
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoFocus
                placeholder="Scan or enter ID number"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-white border-2 border-gray-200 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 placeholder:text-gray-300 placeholder:text-sm sm:placeholder:text-base focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all text-base sm:text-lg font-mono font-bold text-center shadow-inner"
              />
            </form>
          </div>
        )}

        {/* Recent Scans List */}
        <div className="flex-1 bg-white/80 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 shadow-[0_8px_30px_rgba(0,51,160,0.04)] border border-white min-h-[300px]">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-0 mb-6 pb-4 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-700">
              Recent Successful Scans
            </h2>

            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="relative">
                <button
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="flex items-center gap-2 text-[10px] font-bold bg-white/90 border border-gray-200/80 text-gray-600 px-4 py-2 rounded-xl uppercase tracking-widest hover:bg-gray-50 transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px]"
                >
                  {filterYear} <ChevronDown className="w-4 h-4 ml-1" />
                </button>
                {dropdownOpen && (
                  <div className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,51,160,0.1)] border border-white z-30 py-2 overflow-hidden">
                    {[
                      "All",
                      "1st Year",
                      "2nd Year",
                      "3rd Year",
                      "4th Year",
                    ].map((yr) => (
                      <button
                        key={yr}
                        onClick={() => {
                          setFilterYear(yr);
                          setDropdownOpen(false);
                        }}
                        className={cn(
                          "w-full text-left px-4 py-2 text-xs font-bold transition-colors hover:bg-gray-50",
                          filterYear === yr
                            ? "text-primary bg-red-50/50"
                            : "text-gray-600",
                        )}
                      >
                        {yr}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => setManualModalOpen(true)}
                className="text-[11px] font-bold text-white uppercase bg-gradient-to-r from-secondary to-[#0044cc] hover:from-secondary hover:to-[#0055ff] px-5 py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-[0_4px_12px_rgba(0,51,160,0.2)] hover:shadow-[0_6px_16px_rgba(0,51,160,0.3)] min-h-[44px] tracking-widest"
              >
                <UserPlus className="w-4 h-4" />
                Manual
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {filteredScans.length === 0 ? (
              <div className="text-center py-10">
                <Search className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                <p className="text-xs text-gray-400 font-bold tracking-wide uppercase">
                  No recent scans
                </p>
              </div>
            ) : (
              filteredScans.slice(0, 4).map((scan, idx) => (
                <div
                  key={`${scan.id}-${idx}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-gray-50 bg-gray-50/30 transition-all hover:bg-gray-50 gap-2 sm:gap-0"
                  style={{ opacity: 1 - idx * 0.25 }}
                >
                  <div className="flex items-center gap-3 w-full sm:w-1/3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
                      {scan.name
                        .split(" ")
                        .map((n) => n[0])
                        .join("")
                        .substring(0, 2)
                        .toUpperCase()}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm text-gray-800 line-clamp-1">
                        {scan.name}
                      </span>
                      <span className="font-mono text-gray-500 text-[10px] sm:hidden">
                        {scan.id}
                      </span>
                    </div>
                  </div>
                  <div className="hidden sm:block sm:w-1/4">
                    <span className="font-mono text-gray-500 text-sm">
                      {scan.id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between w-full sm:w-5/12 pl-11 sm:pl-0">
                    <div className="sm:w-1/2">
                      <span
                        className={cn(
                          "px-2 py-0.5 rounded-full text-[10px] font-bold",
                          getYearBadgeColor(scan.yearLevel),
                        )}
                      >
                        {scan.yearLevel}
                      </span>
                    </div>
                    <div className="sm:w-1/2 text-right">
                      <span className="text-xs sm:text-sm text-gray-400 font-medium">
                        {scan.timestamp}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Manual Add Modal */}
      {manualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() => setManualModalOpen(false)}
          ></div>
          <div className="bg-white/90 backdrop-blur-md rounded-[2rem] p-6 sm:p-8 w-full max-w-sm relative z-10 shadow-[0_10px_40px_rgba(0,51,160,0.1)] scale-100 animate-in zoom-in-95 duration-200 h-auto max-h-[90vh] overflow-y-auto border border-white">
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
              <h3 className="font-bold text-gray-800 text-base">
                Manual Entry
              </h3>
              <button
                onClick={() => setManualModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={onManualSubmit} className="space-y-5">
              <div className="space-y-2">
                <label
                  htmlFor="studentId"
                  className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
                >
                  ID Number <span className="font-bold text-primary">*</span>
                </label>
                <div className="relative">
                  <input
                    id="studentId"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={manualId}
                    onChange={(e) => setManualId(e.target.value.replace(/\D/g, ""))}
                    placeholder="Enter ID number"
                    className="w-full bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all font-mono text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px] relative z-10"
                    autoFocus
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="studentName"
                  className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
                >
                  Name (Optional)
                </label>
                <div className="relative">
                  <input
                    id="studentName"
                    type="text"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    placeholder="Enter full name"
                    className="w-full bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px] relative z-10"
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="space-y-2 flex-1">
                  <label
                    htmlFor="studentCourse"
                    className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
                  >
                    Course
                  </label>
                  <div className="relative">
                    <input
                      id="studentCourse"
                      type="text"
                      value={manualCourse}
                      onChange={(e) => setManualCourse(e.target.value)}
                      placeholder="e.g. BSIT"
                      className="w-full bg-white border border-gray-200/80 rounded-2xl px-4 py-3.5 placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all uppercase text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px] relative z-10"
                    />
                  </div>
                </div>

                <div className="space-y-2 flex-[1.2]">
                  <label
                    htmlFor="studentYear"
                    className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1"
                  >
                    Year Level
                  </label>
                  {/* FIXED: wrapped in relative div with custom ChevronDown */}
                  <div className="relative">
                    <select
                      id="studentYear"
                      value={manualYear}
                      onChange={(e) => setManualYear(e.target.value)}
                      className="appearance-none w-full bg-white border border-gray-200/80 rounded-2xl pl-4 pr-10 py-3.5 font-bold focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all text-base shadow-[0_2px_8px_rgba(0,0,0,0.02)] min-h-[44px] cursor-pointer"
                    >
                      <option value="1st Year">1st Year</option>
                      <option value="2nd Year">2nd Year</option>
                      <option value="3rd Year">3rd Year</option>
                      <option value="4th Year">4th Year</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={!manualId.trim()}
                  className="w-full py-4 px-4 bg-gradient-to-r from-secondary to-[#0044cc] hover:from-secondary hover:to-[#0055ff] text-white rounded-2xl font-bold text-[13px] uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_8px_20px_rgba(0,51,160,0.25)] hover:shadow-[0_12px_25px_rgba(0,51,160,0.35)] min-h-[56px]"
                >
                  Save & Mark Attended
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}