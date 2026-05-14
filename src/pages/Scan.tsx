import React, { useState, useEffect, useRef } from "react";
import {
  Html5Qrcode,
  CameraDevice,
  Html5QrcodeSupportedFormats,
} from "html5-qrcode";
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
import { yearLevelToNumber } from "../utils/yearLevel";
import {
  analyzeImageQuality,
  extractBestDigitsCandidate,
  extractStudentId,
  preprocessCanvasForNumericOcr,
  validateStudentId,
} from "../utils/ocrStudentId";

export function Scan() {
  const navigate = useNavigate();
  const { scans, addScan, masterlist, masterlistFilename } = useAttendanceStore();
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [manualId, setManualId] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCourse, setManualCourse] = useState("");
  const [manualYear, setManualYear] = useState("1st Year");
  const [activeYearLevel, setActiveYearLevel] = useState("1st Year");
  const activeYearLevelRef = useRef(activeYearLevel);
  useEffect(() => {
    activeYearLevelRef.current = activeYearLevel;
  }, [activeYearLevel]);
  const [filterYear, setFilterYear] = useState("All");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [scanMode, setScanMode] = useState<"camera" | "barcode">("barcode");
  const [barcodeInput, setBarcodeInput] = useState("");
  const barcodeSubmitLockRef = useRef(false);

  const [cameras, setCameras] = useState<CameraDevice[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>("");
  const [cameraStatus, setCameraStatus] = useState<
    "idle" | "loading" | "ready" | "unavailable"
  >("idle");
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const cameraAccessErrorShownRef = useRef(false);
  const hasPromptedImportRef = useRef(false);
  const userSelectedCameraRef = useRef(false);

  const ocrWorkerRef = useRef<any | null>(null);
  const [ocrStatus, setOcrStatus] = useState<"idle" | "processing">("idle");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const ocrRunLockRef = useRef(false);

  const maybePromptImportMasterlist = () => {
    const hasImportedMasterlist = Boolean(masterlistFilename);
    const hasAnyMasterlistData = masterlist.length > 0;
    const shouldPrompt = !hasImportedMasterlist && !hasAnyMasterlistData;
    if (!shouldPrompt || hasPromptedImportRef.current) return;
    hasPromptedImportRef.current = true;

    toast.info("No masterlist imported yet", {
      description:
        "Import a masterlist to auto-fill names. You can continue using manual entry.",
      action: {
        label: "Import",
        onClick: () => navigate("/files"),
      },
      cancel: {
        label: "Not now",
        onClick: () => {},
      },
    });
  };

  useEffect(() => {
    if (scanMode !== "camera") {
      cameraAccessErrorShownRef.current = false;
      setCameraStatus("idle");
      setCameraError(null);
      return;
    }

    setCameraStatus("loading");
    setCameraError(null);

    Html5Qrcode.getCameras()
      .then((devices) => {
        if (!devices || devices.length === 0) {
          setCameras([]);
          setSelectedCameraId("");
          setCameraStatus("unavailable");
          setCameraError("No camera detected.");
          return;
        }

        if (devices && devices.length) {
          setCameras(devices);

          if (!userSelectedCameraRef.current) {
            // Prefer rear/environment camera. If labels are blank (common before permission),
            // default to the last device (often rear on mobile).
            const environmentCamera = devices.find((device) => {
              const label = (device.label || "").toLowerCase();
              return (
                label.includes("back") ||
                label.includes("environment") ||
                label.includes("rear")
              );
            });

            if (environmentCamera) {
              setSelectedCameraId(environmentCamera.id);
            } else {
              const allLabelsBlank = devices.every((d) => !d.label);
              setSelectedCameraId(
                allLabelsBlank ? devices[devices.length - 1].id : devices[0].id,
              );
            }
          }

          setCameraStatus("ready");
        }
      })
      .catch((err) => {
        console.error("Error getting cameras", err);
        setCameras([]);
        setSelectedCameraId("");
        setCameraStatus("unavailable");
        setCameraError("Please check permissions.");
        if (!cameraAccessErrorShownRef.current) {
          cameraAccessErrorShownRef.current = true;
          toast.error("Could not access cameras. Please check permissions.");
        }
      });
  }, [scanMode]);

  useEffect(() => {
    if (
      scanMode !== "camera" ||
      !document.getElementById("reader")
    )
      return;

    let isMounted = true;
    let isStarting = true;
    const html5QrCode = new Html5Qrcode("reader", {
      verbose: false,
      formatsToSupport: [
        Html5QrcodeSupportedFormats.QR_CODE,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.ITF,
        Html5QrcodeSupportedFormats.CODABAR,
      ],
      useBarCodeDetectorIfSupported: true,
    });
    scannerRef.current = html5QrCode;

    let lastScanTime = 0;

    const allLabelsBlank = cameras.length > 0 && cameras.every((d) => !d.label);
    const cameraIdOrConfig:
      | string
      | {
          facingMode: "environment";
        } =
      !userSelectedCameraRef.current && allLabelsBlank
        ? { facingMode: "environment" }
        : selectedCameraId;

    if (typeof cameraIdOrConfig === "string" && !cameraIdOrConfig) {
      setCameraStatus("unavailable");
      return;
    }

    setCameraStatus("loading");
    setCameraError(null);

    html5QrCode
      .start(
        cameraIdOrConfig,
        {
          fps: 15,
          qrbox: { width: 250, height: 250 }, // Square box for QR Code + barcodes
          disableFlip: true,
          // Improve scan reliability under varied lighting by requesting higher resolution.
          videoConstraints: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
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
        setCameraStatus("ready");
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
        setCameraStatus("unavailable");
        setCameraError("Camera unavailable.");
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
  }, [selectedCameraId, scanMode, cameras]);

  useEffect(() => {
    return () => {
      const worker = ocrWorkerRef.current;
      if (worker && typeof worker.terminate === "function") {
        Promise.resolve(worker.terminate()).catch(() => {});
      }
      ocrWorkerRef.current = null;
    };
  }, []);

  const handleScanSubmit = (id: string, overrideYear?: string) => {
    if (!id.trim()) return;
    maybePromptImportMasterlist();
    const activeYearToUse = overrideYear || activeYearLevelRef.current;
    const normalizedActiveYear =
      activeYearToUse === "All Years" ? undefined : activeYearToUse;
    const result = addScan(id.trim(), undefined, normalizedActiveYear);
    if (result.success) {
      toast.success(result.message, {
        description: `${result.student?.name} (${result.student?.id})`,
      });
    } else if (result.code === "DUPLICATE") {
      toast.warning(result.message, {
        description: `${result.student?.name} has already been stamped.`,
      });
    } else if (result.code === "NOT_FOUND") {
      if (masterlist.length > 0) {
        toast.info("New ID Detected", {
          description: "Please enter student info for this new ID.",
        });
      }
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

    maybePromptImportMasterlist();

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
    submitBarcodeInput("submit");
  };

  const submitBarcodeInput = (source: "submit" | "blur" | "enter") => {
    const value = barcodeInput.trim();
    if (!value) return;
    if (barcodeSubmitLockRef.current) return;

    if (!validateStudentId(value)) {
      if (source !== "blur") {
        toast.error("Invalid ID", {
          description: "Please enter a valid 8-digit ID number.",
        });
      }
      return;
    }

    barcodeSubmitLockRef.current = true;
    handleScanSubmit(value);
    setBarcodeInput("");

    window.setTimeout(() => {
      barcodeSubmitLockRef.current = false;
    }, 120);
  };

  const captureFrameFromReaderVideo = (): HTMLCanvasElement | null => {
    const video = document.querySelector<HTMLVideoElement>("#reader video");
    if (!video) return null;
    if (video.readyState < 2) return null;

    const width = video.videoWidth || video.clientWidth;
    const height = video.videoHeight || video.clientHeight;
    if (!width || !height) return null;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    if (!ctx) return null;
    ctx.drawImage(video, 0, 0, width, height);
    return canvas;
  };

  const runOcrFallback = async () => {
    if (ocrRunLockRef.current) return;
    if (scanMode !== "camera" || cameraStatus !== "ready") {
      toast.error("Camera is not ready.");
      return;
    }

    const rawCanvas = captureFrameFromReaderVideo();
    if (!rawCanvas) {
      toast.error("Could not capture camera frame.");
      return;
    }

    ocrRunLockRef.current = true;
    setOcrStatus("processing");
    setOcrProgress(null);

    let preprocessed: HTMLCanvasElement | null = null;
    try {
      const ctx = rawCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        toast.error("Could not analyze camera frame.");
        return;
      }

      const frameData = ctx.getImageData(0, 0, rawCanvas.width, rawCanvas.height);
      const quality = analyzeImageQuality(frameData);

      const EXTREME_DARK_LUMINANCE = 25;
      const EXTREME_BLUR_VARIANCE = 12;

      if (quality.avgLuminance < EXTREME_DARK_LUMINANCE) {
        toast.warning("Image is too dark", {
          description: "Add more light and try again, or enter the ID manually.",
          action: {
            label: "Manual",
            onClick: () => {
              setManualId("");
              setManualName("");
              setManualCourse("");
              setManualModalOpen(true);
            },
          },
          cancel: {
            label: "Retake",
            onClick: () => {},
          },
        });
        return;
      }

      if (quality.laplacianVariance < EXTREME_BLUR_VARIANCE) {
        toast.warning("Image is too blurry", {
          description: "Hold steady and move closer, then retake — or enter the ID manually.",
          action: {
            label: "Manual",
            onClick: () => {
              setManualId("");
              setManualName("");
              setManualCourse("");
              setManualModalOpen(true);
            },
          },
          cancel: {
            label: "Retake",
            onClick: () => {},
          },
        });
        return;
      }

      if (quality.tooDark) {
        toast.warning("Image is too dark", {
          description: "Add more light and try again, or enter the ID manually.",
          action: {
            label: "Manual",
            onClick: () => {
              setManualId("");
              setManualName("");
              setManualCourse("");
              setManualModalOpen(true);
            },
          },
          cancel: {
            label: "Retake",
            onClick: () => {},
          },
        });
      }

      if (quality.tooBlurry) {
        toast.warning("Image is too blurry", {
          description: "Hold steady and move closer, then retake — or enter the ID manually.",
          action: {
            label: "Manual",
            onClick: () => {
              setManualId("");
              setManualName("");
              setManualCourse("");
              setManualModalOpen(true);
            },
          },
          cancel: {
            label: "Retake",
            onClick: () => {},
          },
        });
      }

      preprocessed = preprocessCanvasForNumericOcr(rawCanvas);

      const tesseract = await import("tesseract.js");
      const createWorker = (tesseract as any).createWorker as any;
      const PSM = (tesseract as any).PSM as any;
      const OEM = (tesseract as any).OEM as any;

      if (!ocrWorkerRef.current) {
        ocrWorkerRef.current = await createWorker(
          "eng",
          OEM?.LSTM_ONLY ?? 1,
          {
            workerPath: "/tesseract/worker.min.js",
            corePath: "/tesseract-core",
            langPath: "/tessdata",
            gzip: true,
            logger: (m: any) => {
              if (m?.status === "recognizing text" && typeof m?.progress === "number") {
                setOcrProgress(m.progress);
              }
            },
          },
        );

        await ocrWorkerRef.current.setParameters({
          tessedit_char_whitelist: "0123456789",
          tessedit_pageseg_mode: PSM?.SINGLE_LINE ?? 7,
          preserve_interword_spaces: "1",
          user_defined_dpi: "300",
        });
      }

      const worker = ocrWorkerRef.current;
      const result = await worker.recognize(preprocessed);
      let text = result?.data?.text ?? "";

      const extracted = extractStudentId(text);
      if (extracted && validateStudentId(extracted)) {
        setBarcodeInput(extracted);
        toast.success("ID detected", { description: extracted });
        handleScanSubmit(extracted);
        return;
      }

      try {
        await worker.setParameters({
          tessedit_pageseg_mode: PSM?.SINGLE_BLOCK ?? 6,
        });
        const retry = await worker.recognize(preprocessed);
        text = retry?.data?.text ?? text;

        const extractedRetry = extractStudentId(text);
        if (extractedRetry && validateStudentId(extractedRetry)) {
          setBarcodeInput(extractedRetry);
          toast.success("ID detected", { description: extractedRetry });
          handleScanSubmit(extractedRetry);
          return;
        }
      } catch {
        // ignore retry failures; fall through to manual/retake prompt
      } finally {
        // Restore the primary setting for the next attempt.
        try {
          await worker.setParameters({
            tessedit_pageseg_mode: PSM?.SINGLE_LINE ?? 7,
          });
        } catch {
          // ignore
        }
      }

      const bestDigits = extractBestDigitsCandidate(text);
      toast.error("Couldn’t detect a valid 8-digit ID", {
        description: bestDigits ? `Detected: ${bestDigits}` : "Retake the image or enter manually.",
        action: {
          label: "Manual",
          onClick: () => {
            setManualId(bestDigits && /^\d+$/.test(bestDigits) ? bestDigits : "");
            setManualName("");
            setManualCourse("");
            setManualModalOpen(true);
          },
        },
        cancel: {
          label: "Retake",
          onClick: () => {},
        },
      });
    } catch (err) {
      console.error("OCR error", err);
      toast.error("OCR failed", {
        description: "Please retake the image or enter the ID manually.",
      });
    } finally {
      // Clear canvases to avoid keeping image buffers around.
      try {
        rawCanvas.width = 0;
        rawCanvas.height = 0;
      } catch {
        // ignore
      }
      try {
        if (preprocessed) {
          preprocessed.width = 0;
          preprocessed.height = 0;
        }
      } catch {
        // ignore
      }

      setOcrStatus("idle");
      setOcrProgress(null);
      ocrRunLockRef.current = false;
    }
  };

  const getYearBadgeColor = (yearLevel: string) => {
    const year = yearLevelToNumber(yearLevel);
    if (year === "1") return "bg-green-100 text-green-700";
    if (year === "2") return "bg-yellow-100 text-yellow-700";
    if (year === "3") return "bg-red-100 text-red-700";
    if (year === "4") return "bg-blue-100 text-blue-700";
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
                value={activeYearLevel}
                onChange={(e) => {
                  const next = e.target.value;
                  setActiveYearLevel(next);
                  if (next !== "All Years") {
                    setManualYear(next);
                  }
                }}
                className="appearance-none bg-white border border-gray-200/80 text-gray-800 text-sm font-bold rounded-2xl pl-4 pr-10 py-3.5 outline-none focus:ring-4 focus:ring-secondary/10 focus:border-secondary transition-all shadow-[0_2px_8px_rgba(0,0,0,0.02)] cursor-pointer w-full min-h-[44px]"
              >
                <option value="All Years">All Years</option>
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
          <div className="bg-white rounded-3xl shadow-lg shadow-secondary/5 border border-white p-2 relative overflow-hidden animate-fade-in-up">
            {/* Custom scan line animation wrapper */}
            <div className="relative w-full aspect-[4/3] sm:aspect-video bg-slate-900 rounded-2xl overflow-hidden flex items-center justify-center">
              {/* Cleaner Integrated Scanner UI overlay */}
              {cameraStatus === "ready" && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  <div className="w-[min(250px,80%)] h-[min(250px,80%)] rounded-xl relative">
                    <div className="w-full h-[2px] bg-red-500 blur-[1px] absolute top-1/2 -translate-y-1/2 animate-[scan-line_3s_ease-in-out_infinite] shadow-[0_0_10px_rgba(220,38,38,0.8)]" />
                  </div>
                </div>
              )}

              {cameraStatus !== "ready" && (
                <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center p-6 text-center">
                  <div className="bg-black/40 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-3">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">
                      {cameraStatus === "loading" ? "Starting camera" : "Camera unavailable"}
                    </p>
                    <p className="text-white/80 text-xs font-medium mt-2 max-w-xs">
                      {cameraStatus === "loading"
                        ? "Waiting for camera access…"
                        : cameraError ||
                          "Please check device permissions or use Barcode/Manual."}
                    </p>
                  </div>
                </div>
              )}

              <div
                id="reader"
                className="absolute inset-0 w-full h-full z-10 [&_video]:w-full [&_video]:h-full [&_video]:object-cover [&_canvas]:w-full [&_canvas]:h-full"
              ></div>

              {ocrStatus === "processing" && (
                <div className="absolute inset-0 z-40 flex items-center justify-center p-6 text-center">
                  <div className="bg-black/55 backdrop-blur-md rounded-2xl border border-white/10 px-4 py-3 pointer-events-auto">
                    <p className="text-white text-xs font-bold uppercase tracking-widest">
                      Reading ID…
                    </p>
                    <p className="text-white/80 text-xs font-medium mt-2 max-w-xs">
                      {typeof ocrProgress === "number"
                        ? `OCR in progress (${Math.round(ocrProgress * 100)}%)`
                        : "Processing image…"}
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute top-6 right-6 z-30 flex flex-col items-end gap-2">
              {cameras.length > 1 && (
                <div className="relative bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center pr-2 transition-all hover:bg-black/60">
                  <div className="pl-3 pr-2 py-2.5 text-white/80">
                    <Camera className="w-4 h-4" />
                  </div>
                  <select
                    value={selectedCameraId}
                    onChange={(e) => {
                      userSelectedCameraRef.current = true;
                      setSelectedCameraId(e.target.value);
                    }}
                    className="bg-transparent border-none text-xs font-bold text-white py-2 pr-6 focus:ring-0 focus:outline-none appearance-none cursor-pointer placeholder:text-white"
                  >
                    {cameras.map((camera) => (
                      <option key={camera.id} value={camera.id}>
                        {camera.label || `Camera ${camera.id.substring(0, 5)}...`}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-3 h-3 text-gray-400 absolute right-2 pointer-events-none" />
                </div>
              )}

              <button
                onClick={runOcrFallback}
                disabled={cameraStatus !== "ready" || ocrStatus === "processing"}
                className={cn(
                  "relative bg-black/40 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden flex items-center gap-2 px-3 py-2 transition-all hover:bg-black/60",
                  (cameraStatus !== "ready" || ocrStatus === "processing") &&
                    "opacity-50 cursor-not-allowed",
                )}
                title="Capture frame and read ID using OCR"
              >
                <Search className="w-4 h-4 text-white/80" />
                <span className="text-xs font-bold text-white">Use OCR</span>
              </button>
            </div>

            <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-[10px] font-bold tracking-[0.2em] uppercase opacity-70 z-30">
              Live Camera Feed
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl shadow-lg shadow-secondary/5 border border-white p-6 sm:p-10 relative overflow-hidden flex flex-col items-center justify-center animate-fade-in-up">
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
              <button
                type="submit"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
              >
                Submit
              </button>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                enterKeyHint="done"
                autoFocus
                placeholder="Scan or enter ID number"
                value={barcodeInput}
                onChange={(e) => setBarcodeInput(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === "NumpadEnter") {
                    e.preventDefault();
                    submitBarcodeInput("enter");
                  }
                }}
                onBlur={() => {
                  submitBarcodeInput("blur");
                }}
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
                  <div className="absolute right-0 top-[calc(100%+8px)] w-40 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_10px_40px_rgba(0,51,160,0.1)] border border-white z-30 py-2 overflow-hidden animate-pop-in">
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
              <>
                <div className="hidden sm:flex items-center justify-between px-3 text-[10px] font-semi text-gray-400 uppercase tracking-widest">
                  <div className="sm:w-1/3">Name</div>
                  <div className="sm:w-1/4">ID Number</div>
                  <div className="sm:w-5/12 flex items-center justify-between">
                    <div className="sm:w-1/2">Year Level</div>
                    <div className="sm:w-1/2 text-right">Time Scanned</div>
                  </div>
                </div>

                {filteredScans.slice(0, 4).map((scan, idx) => {
                  const yearNumber = yearLevelToNumber(scan.yearLevel);
                  return (
                    <div
                      key={scan.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3 border-b border-gray-50 bg-gray-50/30 transition-all hover:bg-gray-50 gap-2 sm:gap-0 animate-fade-in-up"
                      style={{ opacity: 1 - idx * 0.25, animationDelay: `${idx * 35}ms` }}
                    >
                      <div className="flex items-center gap-3 w-full sm:w-1/3">
                        <div
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shrink-0",
                            getYearBadgeColor(scan.yearLevel),
                          )}
                        >
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
                              "px-6 py-0.5 rounded-full text-[12px] font-bold",
                              getYearBadgeColor(scan.yearLevel),
                            )}
                          >
                            {yearNumber || "-"}
                          </span>
                        </div>
                        <div className="sm:w-1/2 text-right">
                          <span className="text-xs sm:text-sm text-gray-400 font-mono">
                            {scan.timestamp}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
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