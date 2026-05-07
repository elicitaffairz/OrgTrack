import { create } from "zustand";
import { persist } from "zustand/middleware";

export interface Student {
  id: string;
  name: string;
  yearLevel: string;
  course: string;
}

export interface ScanRecord extends Student {
  timestamp: string;
}

function normalizeYearLevel(input: unknown): string {
  const raw = String(input ?? "").trim();
  if (!raw) return "Unknown";

  const lowered = raw.toLowerCase().replace(/\s+/g, "");

  const mapNumeric = (n: number) =>
    n === 1
      ? "1st Year"
      : n === 2
        ? "2nd Year"
        : n === 3
          ? "3rd Year"
          : n === 4
            ? "4th Year"
            : "Unknown";

  // Strict numeric (e.g., 1, 2, 3, 4)
  if (/^[1-4]$/.test(lowered)) {
    return mapNumeric(Number(lowered));
  }

  // Common variants (e.g., 1st, 1styear, firstyear)
  if (
    lowered === "1st" ||
    lowered === "1styear" ||
    lowered === "first" ||
    lowered === "firstyear" ||
    lowered === "year1"
  )
    return "1st Year";
  if (
    lowered === "2nd" ||
    lowered === "2ndyear" ||
    lowered === "second" ||
    lowered === "secondyear" ||
    lowered === "year2"
  )
    return "2nd Year";
  if (
    lowered === "3rd" ||
    lowered === "3rdyear" ||
    lowered === "third" ||
    lowered === "thirdyear" ||
    lowered === "year3"
  )
    return "3rd Year";
  if (
    lowered === "4th" ||
    lowered === "4thyear" ||
    lowered === "fourth" ||
    lowered === "fourthyear" ||
    lowered === "year4"
  )
    return "4th Year";

  // If it's already in a reasonable format, keep it.
  return raw;
}

interface AttendanceState {
  masterlist: Student[];
  scans: ScanRecord[];
  duplicateAttempts: number;
  eventName: string | null;
  isEndSessionModalOpen: boolean;
  masterlistFilename: string | null;

  importMasterlist: (data: Student[], filename?: string) => void;
  clearMasterlist: () => void;
  addScan: (
    id: string,
    manualData?: Partial<Student>,
    activeYearLevel?: string,
  ) => {
    success: boolean;
    student?: Student;
    message: string;
    code: "SUCCESS" | "DUPLICATE" | "NOT_FOUND";
  };
  clearScans: () => void;
  resetSession: () => void;
  setEventName: (name: string | null) => void;
  setEndSessionModalOpen: (isOpen: boolean) => void;
}

export const useAttendanceStore = create<AttendanceState>()(
  persist(
    (set, get) => ({
      masterlist: [],
      scans: [],
      duplicateAttempts: 0,
      eventName: null,
      isEndSessionModalOpen: false,
      masterlistFilename: null,

      importMasterlist: (data, filename) => {
        const normalized = data.map((s) => ({
          ...s,
          yearLevel: normalizeYearLevel(s.yearLevel),
        }));
        set({
          masterlist: normalized,
          scans: [],
          duplicateAttempts: 0,
          masterlistFilename: filename || null,
        });
      },

      clearMasterlist: () => {
        set({
          masterlist: [],
          scans: [],
          duplicateAttempts: 0,
          masterlistFilename: null,
        });
      },

      addScan: (id, manualData, activeYearLevel) => {
        const { masterlist, scans } = get();
        let studentIndex = masterlist.findIndex(
          (s) => s.id === id || s.id === id.trim(),
        );
        let student =
          studentIndex !== -1 ? { ...masterlist[studentIndex] } : undefined;

        if (student) {
          const normalizedYear = normalizeYearLevel(student.yearLevel);
          if (normalizedYear !== student.yearLevel) {
            student.yearLevel = normalizedYear;
            const updatedMasterlist = [...masterlist];
            updatedMasterlist[studentIndex] = student;
            set({ masterlist: updatedMasterlist });
          }
          if (
            (!student.yearLevel ||
              student.yearLevel === "Unknown" ||
              student.yearLevel.trim() === "") &&
            activeYearLevel
          ) {
            student.yearLevel = activeYearLevel;
            const updatedMasterlist = [...masterlist];
            updatedMasterlist[studentIndex] = student;
            set({ masterlist: updatedMasterlist });
          }
        } else if (!student && manualData) {
          student = {
            id: id.trim(),
            name: manualData.name?.trim() || "Unknown",
            course: manualData.course?.trim() || "N/A",
            yearLevel:
              normalizeYearLevel(
                manualData.yearLevel?.trim() || activeYearLevel || "Unknown",
              ),
          };
          set((state) => ({ masterlist: [...state.masterlist, student!] }));
        }

        if (!student) {
          return {
            success: false,
            message: "Student not found in masterlist.",
            code: "NOT_FOUND",
          };
        }

        const alreadyScanned = scans.find((s) => s.id === student!.id);
        if (alreadyScanned) {
          set((state) => ({ duplicateAttempts: state.duplicateAttempts + 1 }));
          return {
            success: false,
            student,
            message: "Student already present.",
            code: "DUPLICATE",
          };
        }

        const now = new Date();
        const timestamp = now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });

        set((state) => ({
          scans: [{ ...student!, timestamp }, ...state.scans],
        }));

        return {
          success: true,
          student,
          message: "Marked as attended.",
          code: "SUCCESS",
        };
      },

      clearScans: () => {
        set({ scans: [], duplicateAttempts: 0 });
      },

      resetSession: () => {
        set({ scans: [], duplicateAttempts: 0, eventName: null });
      },

      setEventName: (name: string | null) => {
        set({ eventName: name });
      },

      setEndSessionModalOpen: (isOpen: boolean) => {
        set({ isEndSessionModalOpen: isOpen });
      },
    }),
    {
      name: "attendance-storage",
      partialize: (state) => ({
        masterlist: state.masterlist,
        scans: state.scans,
        duplicateAttempts: state.duplicateAttempts,
        eventName: state.eventName,
        masterlistFilename: state.masterlistFilename,
      }),
    },
  ),
);
