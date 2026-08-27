"use client";

import { useState, useEffect, useMemo, useRef } from "react";

// --- NUML Official Grade Calculation Engine ---
export interface Course {
  id: string;
  name: string;
  credits: number;
  marks: number | "";
  gradePoints: number;
  gradeLabel: string;
  zone: "safe" | "grey" | "danger" | "unrated";
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface PriorHistory {
  credits: number | "";
  gpa: number | "";
}

export function calculateNumlGrade(rawMarks: number | ""): {
  gradePoints: number;
  gradeLabel: string;
  zone: "safe" | "grey" | "danger" | "unrated";
} {
  if (rawMarks === "" || isNaN(Number(rawMarks))) {
    return { gradePoints: 0.0, gradeLabel: "—", zone: "unrated" };
  }

  const marks = Math.min(100, Math.max(0, Math.round(Number(rawMarks))));

  if (marks >= 90) return { gradePoints: 4.0, gradeLabel: "A+", zone: "safe" };
  if (marks >= 80) return { gradePoints: 4.0, gradeLabel: "A", zone: "safe" };
  if (marks >= 75) {
    const gp = 3.5 + ((marks - 75) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B+", zone: "safe" };
  }
  if (marks >= 70) {
    const gp = 3.0 + ((marks - 70) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B", zone: "safe" };
  }
  if (marks >= 65) {
    const gp = 2.5 + ((marks - 65) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C+", zone: "safe" };
  }
  if (marks >= 60) {
    const gp = 2.0 + ((marks - 60) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C", zone: "safe" };
  }
  if (marks >= 55) {
    const gp = 1.5 + ((marks - 55) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "D+", zone: "grey" };
  }
  if (marks >= 50) {
    const gp = 1.0 + ((marks - 50) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "D", zone: "grey" };
  }
  return { gradePoints: 0.0, gradeLabel: "F", zone: "danger" };
}

export default function NumlEnterpriseDashboard() {
  // --- Clean Default State ---
  const [semesters, setSemesters] = useState<Semester[]>([]);
  const [activeTab, setActiveTab] = useState<string>("");
  const [priorHistory, setPriorHistory] = useState<PriorHistory>({ credits: "", gpa: "" });
  const [showPriorInput, setShowPriorInput] = useState<boolean>(false);
  const [degreeTotalCredits, setDegreeTotalCredits] = useState<number>(130);
  const [isLoaded, setIsLoaded] = useState(false);

  // Target Planner
  const [targetGPA, setTargetGPA] = useState<number>(3.5);
  const [upcomingCredits, setUpcomingCredits] = useState<number>(15);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initialize fresh workspace
  const createEmptySemester = (index = 1): Semester => ({
    id: `sem-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    name: `Semester ${index}`,
    courses: [
      {
        id: crypto.randomUUID(),
        name: "",
        credits: 3,
        marks: "",
        gradePoints: 0.0,
        gradeLabel: "—",
        zone: "unrated",
      },
    ],
  });

  // LocalStorage Persistence
  useEffect(() => {
    try {
      const savedSemesters = localStorage.getItem("numl_saas_semesters_v4");
      const savedPrior = localStorage.getItem("numl_saas_prior_v4");
      const savedDegreeGoal = localStorage.getItem("numl_saas_degree_goal");

      if (savedSemesters) {
        const parsed = JSON.parse(savedSemesters);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSemesters(parsed);
          setActiveTab(parsed[0].id);
        } else {
          const fresh = [createEmptySemester(1)];
          setSemesters(fresh);
          setActiveTab(fresh[0].id);
        }
      } else {
        const fresh = [createEmptySemester(1)];
        setSemesters(fresh);
        setActiveTab(fresh[0].id);
      }

      if (savedPrior) setPriorHistory(JSON.parse(savedPrior));
      if (savedDegreeGoal) setDegreeTotalCredits(Number(savedDegreeGoal) || 130);
    } catch (e) {
      console.error(e);
      const fresh = [createEmptySemester(1)];
      setSemesters(fresh);
      setActiveTab(fresh[0].id);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("numl_saas_semesters_v4", JSON.stringify(semesters));
      localStorage.setItem("numl_saas_prior_v4", JSON.stringify(priorHistory));
      localStorage.setItem("numl_saas_degree_goal", String(degreeTotalCredits));
    }
  }, [semesters, priorHistory, degreeTotalCredits, isLoaded]);

  // Calculations
  const getSemesterStats = (sem: Semester) => {
    const validCourses = sem.courses.filter((c) => c.marks !== "" && !isNaN(Number(c.marks)));
    const credits = validCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const totalPoints = validCourses.reduce((sum, c) => sum + (Number(c.credits) || 0) * c.gradePoints, 0);
    return {
      credits,
      points: totalPoints,
      gpa: credits > 0 ? (totalPoints / credits).toFixed(2) : "0.00",
      totalCourses: sem.courses.length,
      gradedCourses: validCourses.length,
    };
  };

  const allCourses = useMemo(() => semesters.flatMap((s) => s.courses), [semesters]);
  const gradedCourses = useMemo(
    () => allCourses.filter((c) => c.marks !== "" && !isNaN(Number(c.marks))),
    [allCourses]
  );

  const activeSemesterCredits = gradedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const activeSemesterPoints = gradedCourses.reduce((sum, c) => sum + (Number(c.credits) || 0) * c.gradePoints, 0);

  const priorCreditsNum = Number(priorHistory.credits) || 0;
  const priorGpaNum = Number(priorHistory.gpa) || 0;
  const priorPoints = priorCreditsNum * priorGpaNum;

  const totalCumulativeCredits = activeSemesterCredits + priorCreditsNum;
  const totalCumulativePoints = activeSemesterPoints + priorPoints;

  const cumulativeCGPA =
    totalCumulativeCredits > 0 ? (totalCumulativePoints / totalCumulativeCredits).toFixed(2) : "0.00";

  // Degree Completion
  const degreeProgressPercent = Math.min(
    100,
    Math.round((totalCumulativeCredits / (degreeTotalCredits || 130)) * 100)
  );

  // Zone Breakdown
  const zoneStats = useMemo(() => {
    const counts = { safe: 0, grey: 0, danger: 0, unrated: 0 };
    allCourses.forEach((c) => counts[c.zone]++);
    return counts;
  }, [allCourses]);

  // Academic Standing Rating
  const standingInfo = useMemo(() => {
    const val = parseFloat(cumulativeCGPA);
    if (totalCumulativeCredits === 0) {
      return { title: "No Record Yet", badge: "bg-slate-100 text-slate-600 border-slate-200", desc: "Add courses to see standing." };
    }
    if (val >= 3.8) {
      return { title: "Summa Cum Laude", badge: "bg-emerald-50 text-emerald-700 border-emerald-300", desc: "Top 2% academic standing." };
    }
    if (val >= 3.5) {
      return { title: "High Honors List", badge: "bg-blue-50 text-blue-700 border-blue-300", desc: "Eligible for merit certificates." };
    }
    if (val >= 3.0) {
      return { title: "Good Standing", badge: "bg-indigo-50 text-indigo-700 border-indigo-200", desc: "Fully eligible for internships." };
    }
    if (val >= 2.0) {
      return { title: "Satisfactory", badge: "bg-amber-50 text-amber-700 border-amber-300", desc: "Passing grade. Aim higher." };
    }
    return { title: "Probation Warning", badge: "bg-rose-50 text-rose-700 border-rose-300", desc: "CGPA below 2.00. Repeats required." };
  }, [cumulativeCGPA, totalCumulativeCredits]);

  // Forecast Engine
  const requiredTargetGPA = () => {
    if (upcomingCredits <= 0) return "0.00";
    const totalDesiredPoints = targetGPA * (totalCumulativeCredits + upcomingCredits);
    const neededPoints = totalDesiredPoints - totalCumulativePoints;
    const neededGPA = neededPoints / upcomingCredits;
    return neededGPA.toFixed(2);
  };

  // Handlers
  const activeSemester = semesters.find((s) => s.id === activeTab) || semesters[0];

  const addSemester = () => {
    const newSem = createEmptySemester(semesters.length + 1);
    setSemesters((prev) => [...prev, newSem]);
    setActiveTab(newSem.id);
  };

  const deleteSemester = (id: string) => {
    if (semesters.length <= 1) return;
    const remaining = semesters.filter((s) => s.id !== id);
    setSemesters(remaining);
    setActiveTab(remaining[0].id);
  };

  const addCourse = (semId: string, customCredits = 3) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: [
            ...s.courses,
            {
              id: crypto.randomUUID(),
              name: "",
              credits: customCredits,
              marks: "",
              gradePoints: 0.0,
              gradeLabel: "—",
              zone: "unrated",
            },
          ],
        };
      })
    );
  };

  const updateCourseMarks = (semId: string, courseId: string, val: string) => {
    const rawMarks = val === "" ? "" : Math.min(100, Math.max(0, parseFloat(val) || 0));
    const calculated = calculateNumlGrade(rawMarks);

    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: s.courses.map((c) =>
            c.id === courseId ? { ...c, marks: rawMarks, ...calculated } : c
          ),
        };
      })
    );
  };

  const updateCourseField = (semId: string, courseId: string, field: "name" | "credits", value: unknown) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: s.courses.map((c) => (c.id === courseId ? { ...c, [field]: value } : c)),
        };
      })
    );
  };

  const removeCourse = (semId: string, courseId: string) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        if (s.courses.length <= 1) {
          return {
            ...s,
            courses: [
              {
                id: crypto.randomUUID(),
                name: "",
                credits: 3,
                marks: "",
                gradePoints: 0.0,
                gradeLabel: "—",
                zone: "unrated",
              },
            ],
          };
        }
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId) };
      })
    );
  };

  // Backups
  const exportDataJSON = () => {
    const payload = { semesters, priorHistory, degreeTotalCredits, exportedAt: new Date().toISOString() };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NUML_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  };

  const importDataJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.semesters && Array.isArray(parsed.semesters)) {
          setSemesters(parsed.semesters);
          if (parsed.semesters.length > 0) setActiveTab(parsed.semesters[0].id);
          if (parsed.priorHistory) setPriorHistory(parsed.priorHistory);
          if (parsed.degreeTotalCredits) setDegreeTotalCredits(parsed.degreeTotalCredits);
        } else if (Array.isArray(parsed)) {
          setSemesters(parsed);
          if (parsed.length > 0) setActiveTab(parsed[0].id);
        }
      } catch {
        alert("Corrupt or invalid backup file.");
      }
    };
    reader.readAsText(file);
  };

  const exportDataCSV = () => {
    const headers = "Semester,Course Name,Credits,Marks,Grade,Grade Points,Zone\n";
    const rows = semesters
      .flatMap((s) =>
        s.courses.map((c) => `"${s.name}","${c.name || "Untitled Course"}",${c.credits},${c.marks === "" ? "N/A" : c.marks},${c.gradeLabel},${c.gradePoints},${c.zone}`)
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NUML_Transcript_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  const resetAllData = () => {
    if (confirm("Reset everything? All recorded courses, marks, and prior credits will be cleared.")) {
      const fresh = [createEmptySemester(1)];
      setSemesters(fresh);
      setActiveTab(fresh[0].id);
      setPriorHistory({ credits: "", gpa: "" });
      localStorage.removeItem("numl_saas_semesters_v4");
      localStorage.removeItem("numl_saas_prior_v4");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans antialiased selection:bg-blue-600 selection:text-white">
      
      {/* 1. Global Navigation Bar - Mobile Optimized Scroll Ribbon */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-[72px] sm:h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 shrink-0">
            <div className="h-10 w-10 sm:h-9 sm:w-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base sm:text-sm shadow-md shadow-blue-500/20">
              NL
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-900 tracking-tight text-lg sm:text-base leading-none">
                  NUML Suite Pro
                </span>
              </div>
              <p className="text-xs text-blue-600 font-bold leading-none mt-1 sm:mt-0.5">
                Fall 2023 Rules
              </p>
            </div>
          </div>

          {/* Scrollable Action Toolbar for Mobile */}
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide py-2 flex-1 justify-end snap-x">
            <input type="file" ref={fileInputRef} onChange={importDataJSON} accept=".json" className="hidden" />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="snap-end shrink-0 px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-bold sm:font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-lg transition active:scale-95"
            >
              Import
            </button>
            <button
              onClick={exportDataJSON}
              className="snap-end shrink-0 px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-bold sm:font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl sm:rounded-lg transition active:scale-95"
            >
              Save JSON
            </button>
            <button
              onClick={exportDataCSV}
              className="snap-end shrink-0 px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-bold sm:font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-800 rounded-xl sm:rounded-lg shadow-sm sm:shadow-2xs transition active:scale-95"
            >
              Export CSV
            </button>
            <button
              onClick={resetAllData}
              className="snap-end shrink-0 px-4 sm:px-3 py-2 sm:py-1.5 text-xs font-bold sm:font-semibold bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200/80 rounded-xl sm:rounded-lg transition active:scale-95"
            >
              Reset
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Workspace Body */}
      <main className="max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6 sm:space-y-8 flex-1">
        
        {/* Top Metric Deck (Mobile: 1 Col, Tablet: 2 Col, Desktop: 4 Col) */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm sm:shadow-xs relative overflow-hidden flex flex-col justify-between group hover:border-blue-300 transition">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Cumulative CGPA</span>
              <span className="h-2 w-2 rounded-full bg-blue-600 animate-pulse"></span>
            </div>
            <div className="my-3 sm:my-2">
              <div className="text-5xl sm:text-4xl lg:text-5xl font-black text-slate-900 tracking-tight flex items-baseline gap-1">
                {cumulativeCGPA}
                <span className="text-base sm:text-sm font-semibold text-slate-400">/ 4.00</span>
              </div>
            </div>
            <div className="text-xs sm:text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Linear Interpolation</span>
              <span className="font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{totalCumulativeCredits} Earned Cr</span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm sm:shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Active Term GPA</span>
              <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[120px]">{activeSemester?.name || "Term"}</span>
            </div>
            <div className="my-3 sm:my-2">
              <div className="text-5xl sm:text-4xl lg:text-5xl font-black text-emerald-600 tracking-tight">
                {activeSemester ? getSemesterStats(activeSemester).gpa : "0.00"}
              </div>
            </div>
            <div className="text-xs sm:text-[11px] text-slate-500 font-medium">
              {activeSemester ? getSemesterStats(activeSemester).gradedCourses : 0} of {activeSemester ? activeSemester.courses.length : 0} courses graded
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm sm:shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">Degree Goal</span>
              <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2 py-0.5 rounded-md">{degreeProgressPercent}%</span>
            </div>
            <div className="my-3 sm:my-2 space-y-3 sm:space-y-2">
              <div className="text-3xl sm:text-2xl lg:text-3xl font-black text-slate-800">
                {totalCumulativeCredits} <span className="text-base sm:text-sm font-medium text-slate-400">/ {degreeTotalCredits} Cr</span>
              </div>
              <div className="w-full bg-slate-100 h-2.5 sm:h-2 rounded-full overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-600 to-emerald-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${degreeProgressPercent}%` }}
                ></div>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs sm:text-[10px] text-slate-400">
              <span>Goal: {degreeTotalCredits} Credits</span>
              <button
                onClick={() => {
                  const val = prompt("Enter total degree credit requirements (e.g. 130 or 136):", String(degreeTotalCredits));
                  if (val && !isNaN(Number(val))) setDegreeTotalCredits(Number(val));
                }}
                className="text-blue-600 font-bold hover:underline p-1 sm:p-0"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm sm:shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs font-bold text-slate-400 uppercase tracking-wider">NUML Status</span>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 sm:py-0.5 rounded-full border ${standingInfo.badge}`}>
                {parseFloat(cumulativeCGPA) >= 2.0 || totalCumulativeCredits === 0 ? "Normal" : "Warning"}
              </span>
            </div>
            <div className="my-2 sm:my-1">
              <div className="text-base sm:text-sm font-black text-slate-900 leading-snug">
                {standingInfo.title}
              </div>
              <p className="text-xs sm:text-[11px] text-slate-500 mt-1 sm:mt-1.5 leading-tight">
                {standingInfo.desc}
              </p>
            </div>
            <div className="text-xs sm:text-[10px] font-semibold text-slate-400 pt-2 sm:pt-1 border-t border-slate-100 mt-auto">
              Req. CGPA: 2.00
            </div>
          </div>

        </div>

        {/* 3. Main Split Workbench */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* Left Column: Interactive Manager (8 Cols) */}
          <div className="lg:col-span-8 space-y-5 sm:space-y-6">
            
            {/* Semester Tabs Ribbon */}
            <div className="flex items-center justify-between gap-3 overflow-x-auto pb-2 scrollbar-hide snap-x">
              <div className="flex items-center gap-2 sm:gap-2.5 flex-nowrap">
                {semesters.map((sem, idx) => {
                  const stats = getSemesterStats(sem);
                  const isActive = activeTab === sem.id;
                  return (
                    <button
                      key={sem.id}
                      onClick={() => setActiveTab(sem.id)}
                      className={`snap-start px-4 sm:px-4 py-3 sm:py-2.5 rounded-xl font-bold text-sm sm:text-sm whitespace-nowrap transition flex items-center gap-2.5 border shadow-sm sm:shadow-none ${
                        isActive
                          ? "bg-white text-blue-700 border-blue-600 sm:shadow-sm ring-1 ring-blue-600/20"
                          : "bg-white/80 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-white"
                      }`}
                    >
                      <span>{sem.name || `Semester ${idx + 1}`}</span>
                      <span className={`text-xs sm:text-[10px] px-2 py-0.5 rounded-md ${isActive ? "bg-blue-50 text-blue-700 font-black" : "bg-slate-100 text-slate-500 font-bold"}`}>
                        {stats.gpa}
                      </span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={addSemester}
                className="snap-end shrink-0 px-4 py-3 sm:py-2.5 rounded-xl text-sm sm:text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md sm:shadow-xs transition whitespace-nowrap flex items-center gap-1.5 active:scale-95"
              >
                <span>+</span> Term
              </button>
            </div>

            {/* Active Semester Mobile-Optimized Card */}
            {activeSemester && (
              <div className="bg-white border border-slate-200/80 rounded-3xl sm:rounded-2xl p-4 sm:p-6 shadow-sm sm:shadow-xs space-y-5 sm:space-y-6">
                
                {/* Semester Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <input
                    type="text"
                    value={activeSemester.name}
                    placeholder="e.g. 7th Semester (Fall)"
                    onChange={(e) =>
                      setSemesters((prev) =>
                        prev.map((s) => (s.id === activeSemester.id ? { ...s, name: e.target.value } : s))
                      )
                    }
                    className="w-full sm:w-auto text-xl sm:text-xl font-black text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition py-1"
                  />

                  <div className="flex items-center justify-between sm:justify-end gap-4 text-xs font-semibold text-slate-500 bg-slate-50 sm:bg-transparent p-3 sm:p-0 rounded-xl sm:rounded-none">
                    <span className="flex flex-col sm:block">
                      <span className="sm:hidden text-[10px] uppercase text-slate-400">Credits</span>
                      <strong className="text-slate-800 text-sm sm:text-xs">{getSemesterStats(activeSemester).credits}</strong>
                    </span>
                    <span className="flex flex-col sm:block">
                      <span className="sm:hidden text-[10px] uppercase text-slate-400">Term GPA</span>
                      <strong className="text-blue-600 text-sm sm:text-xs font-black">{getSemesterStats(activeSemester).gpa}</strong>
                    </span>
                    {semesters.length > 1 && (
                      <button
                        onClick={() => deleteSemester(activeSemester.id)}
                        className="text-rose-500 bg-rose-50 sm:bg-transparent px-3 py-1.5 sm:p-0 rounded-lg hover:text-rose-700 font-bold sm:ml-2 transition"
                      >
                        Delete Term
                      </button>
                    )}
                  </div>
                </div>

                {/* Course List */}
                <div className="space-y-4 sm:space-y-3">
                  <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                    <span className="col-span-5">Course Title</span>
                    <span className="col-span-2">Credit Hours</span>
                    <span className="col-span-2">Marks (0-100)</span>
                    <span className="col-span-2 text-center">Grade Point</span>
                    <span className="col-span-1 text-right"></span>
                  </div>

                  {activeSemester.courses.map((course, cIdx) => (
                    <div
                      key={course.id}
                      className="relative flex flex-col sm:grid sm:grid-cols-12 gap-3 sm:gap-3 items-stretch sm:items-center bg-white sm:bg-slate-50/70 p-4 sm:p-2.5 rounded-2xl sm:rounded-xl border border-slate-200 sm:border-slate-200/80 shadow-sm sm:shadow-none transition group"
                    >
                      {/* Course Name */}
                      <div className="sm:col-span-5">
                        <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1.5">Course Name</label>
                        <input
                          type="text"
                          placeholder={`Course ${cIdx + 1} Title`}
                          value={course.name}
                          onChange={(e) => updateCourseField(activeSemester.id, course.id, "name", e.target.value)}
                          className="w-full bg-slate-50 sm:bg-white border border-slate-200 rounded-xl sm:rounded-lg px-4 sm:px-3 py-3 sm:py-2 text-sm text-slate-900 font-bold focus:outline-blue-600 focus:bg-white shadow-none sm:shadow-2xs transition"
                        />
                      </div>

                      {/* Mobile Row: Credits, Marks, Points */}
                      <div className="grid grid-cols-3 sm:contents gap-3">
                        
                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1.5">Credits</label>
                          <select
                            value={course.credits}
                            onChange={(e) => updateCourseField(activeSemester.id, course.id, "credits", parseFloat(e.target.value) || 0)}
                            className="w-full bg-slate-50 sm:bg-white border border-slate-200 rounded-xl sm:rounded-lg px-3 sm:px-2.5 py-3 sm:py-2 text-sm text-slate-900 font-bold focus:outline-blue-600 shadow-none sm:shadow-2xs"
                          >
                            <option value={4}>4 Cr</option>
                            <option value={3}>3 Cr</option>
                            <option value={2}>2 Cr</option>
                            <option value={1}>1 Cr</option>
                          </select>
                        </div>

                        <div className="sm:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1.5">Marks</label>
                          <input
                            type="number"
                            min="0"
                            max="100"
                            placeholder="0-100"
                            value={course.marks === "" ? "" : course.marks}
                            onChange={(e) => updateCourseMarks(activeSemester.id, course.id, e.target.value)}
                            className="w-full bg-slate-50 sm:bg-white border border-slate-200 rounded-xl sm:rounded-lg px-3 py-3 sm:py-2 text-sm text-slate-900 font-black focus:outline-blue-600 focus:bg-white shadow-none sm:shadow-2xs text-center sm:text-left"
                          />
                        </div>

                        <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-1.5 bg-slate-50 sm:bg-white border border-slate-200 rounded-xl sm:rounded-lg p-2 sm:px-2.5 sm:py-1.5 shadow-none sm:shadow-2xs items-center justify-center">
                          <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block text-center">Result</label>
                          <div className="flex sm:contents items-center gap-2">
                            <span className="text-sm font-black text-slate-900">
                              {course.marks !== "" ? course.gradePoints.toFixed(2) : "—"}
                            </span>
                            <span
                              className={`text-[10px] font-black px-2 py-0.5 rounded-md border ${
                                course.zone === "safe"
                                  ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                                  : course.zone === "grey"
                                  ? "bg-slate-200 text-slate-800 border-slate-300"
                                  : course.zone === "danger"
                                  ? "bg-rose-100 text-rose-800 border-rose-300"
                                  : "bg-white text-slate-400 border-slate-200"
                              }`}
                            >
                              {course.gradeLabel}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Delete Action (Full width bottom on mobile, small X on desktop) */}
                      <div className="mt-1 sm:mt-0 sm:col-span-1 flex justify-end w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => removeCourse(activeSemester.id, course.id)}
                          disabled={activeSemester.courses.length <= 1}
                          className="w-full sm:w-auto text-xs sm:text-sm font-bold text-rose-500 sm:text-slate-400 hover:text-rose-600 bg-rose-50 sm:bg-transparent py-2.5 sm:p-1 rounded-xl sm:rounded transition text-center disabled:opacity-30 disabled:bg-slate-50"
                        >
                          <span className="sm:hidden">Remove Course</span>
                          <span className="hidden sm:inline">✕</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Quick Add Chips - Mobile Friendly Ribbon */}
                <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-2">
                  <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2 sm:pb-0 snap-x">
                    <button
                      type="button"
                      onClick={() => addCourse(activeSemester.id, 3)}
                      className="snap-start shrink-0 px-4 py-3 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition active:scale-95"
                    >
                      + 3 Cr Theory
                    </button>
                    <button
                      type="button"
                      onClick={() => addCourse(activeSemester.id, 4)}
                      className="snap-start shrink-0 px-4 py-3 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition active:scale-95"
                    >
                      + 4 Cr Course
                    </button>
                    <button
                      type="button"
                      onClick={() => addCourse(activeSemester.id, 1)}
                      className="snap-start shrink-0 px-4 py-3 sm:px-3 sm:py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition active:scale-95"
                    >
                      + 1 Cr Lab
                    </button>
                  </div>
                  <span className="hidden sm:inline text-xs text-slate-400 font-medium">Auto-calculates via NUML policy</span>
                </div>
              </div>
            )}

            {/* Prior Semesters Quick Aggregator */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-sm sm:shadow-xs space-y-4">
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowPriorInput(!showPriorInput)}
              >
                <div className="pr-4">
                  <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight">Transfer & Past Credits</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Include previously accumulated credits without entering old semesters manually.
                  </p>
                </div>
                <button className="shrink-0 text-xs sm:text-sm font-bold bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg transition active:scale-95">
                  {showPriorInput ? "Hide" : "Edit"}
                </button>
              </div>

              {showPriorInput && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100 mt-4">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Completed Credit Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={priorHistory.credits === "" ? "" : priorHistory.credits}
                      placeholder="e.g. 64"
                      onChange={(e) =>
                        setPriorHistory({
                          ...priorHistory,
                          credits: e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2 text-sm text-slate-900 font-black focus:bg-white focus:outline-blue-600 transition shadow-2xs"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1.5">
                      Cumulative CGPA
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="4.0"
                      step="0.01"
                      value={priorHistory.gpa === "" ? "" : priorHistory.gpa}
                      placeholder="e.g. 3.42"
                      onChange={(e) =>
                        setPriorHistory({
                          ...priorHistory,
                          gpa: e.target.value === "" ? "" : parseFloat(e.target.value) || 0,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2 text-sm text-slate-900 font-black focus:bg-white focus:outline-blue-600 transition shadow-2xs"
                    />
                  </div>
                </div>
              )}
            </div>

          </div>

          {/* Right Column: Analytics & Info (4 Cols) */}
          <div className="lg:col-span-4 space-y-5 sm:space-y-6">
            
            {/* Target CGPA Forecaster Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl sm:rounded-2xl p-5 sm:p-6 shadow-sm sm:shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-indigo-600"></span>
                  <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider">Target Forecaster</h3>
                </div>
                <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                  Set your graduation goal and see the required GPA for your remaining credits.
                </p>
              </div>

              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-2">
                    <span>Desired CGPA Goal</span>
                    <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-sm">{targetGPA.toFixed(2)}</span>
                  </div>
                  <input
                    type="range"
                    min="2.0"
                    max="4.0"
                    step="0.05"
                    value={targetGPA}
                    onChange={(e) => setTargetGPA(parseFloat(e.target.value))}
                    className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg appearance-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1.5">
                    Future Credit Hours Left
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="120"
                    value={upcomingCredits}
                    onChange={(e) => setUpcomingCredits(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 sm:py-2.5 text-sm text-slate-900 font-black focus:bg-white focus:outline-blue-600 shadow-2xs transition"
                  />
                </div>

                {/* Live Forecast Result Gauge */}
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1.5 relative overflow-hidden">
                  <span className="text-[10px] sm:text-[11px] uppercase text-slate-500 font-black tracking-wider block">
                    Required Future Term GPA
                  </span>
                  <div
                    className={`text-4xl sm:text-4xl font-black tracking-tight ${
                      parseFloat(requiredTargetGPA()) > 4.0
                        ? "text-rose-600"
                        : parseFloat(requiredTargetGPA()) <= 0
                        ? "text-blue-600"
                        : "text-emerald-600"
                    }`}
                  >
                    {requiredTargetGPA()}
                  </div>
                  <p className="text-xs text-slate-500 font-medium pt-1">
                    {parseFloat(requiredTargetGPA()) > 4.0
                      ? "Exceeds max possible 4.00"
                      : parseFloat(requiredTargetGPA()) <= 0
                      ? "Target already achieved."
                      : "Statistically achievable."}
                  </p>
                </div>
              </div>
            </div>

            {/* Live Distribution Pill Deck */}
            <div className="bg-white border border-slate-200/80 rounded-3xl sm:rounded-2xl p-5 sm:p-6 shadow-sm sm:shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 border-b border-slate-100 pb-3">
                Grade Zone Distribution
              </h3>
              
              <div className="space-y-2.5 text-xs sm:text-sm font-semibold">
                <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                    Safe (60–100)
                  </span>
                  <span className="font-black bg-white px-2 py-0.5 rounded shadow-2xs">{zoneStats.safe}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 text-slate-800 border border-slate-200">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-slate-400"></span>
                    Grey (50–59)
                  </span>
                  <span className="font-black bg-white px-2 py-0.5 rounded shadow-2xs">{zoneStats.grey}</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-rose-50 text-rose-900 border border-rose-200">
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                    Danger (&lt;50)
                  </span>
                  <span className="font-black bg-white px-2 py-0.5 rounded shadow-2xs">{zoneStats.danger}</span>
                </div>
              </div>
            </div>

          </div>

        </div>

        {/* 4. Official NUML Examination Grading Table (Mobile Scrollable) */}
        <section className="bg-white border border-slate-200/80 rounded-3xl sm:rounded-2xl p-5 sm:p-8 shadow-sm sm:shadow-xs space-y-5 sm:space-y-6 overflow-hidden">
          <div className="border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2.5">
              <span className="h-3 w-3 rounded-full bg-blue-600"></span>
              <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">NUML Grading Rules</h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1.5 leading-relaxed">
              Based on the official examination rulebook. Scroll horizontally to view full table on mobile.
            </p>
          </div>

          <div className="overflow-x-auto scrollbar-thin pb-2">
            <table className="w-full text-left text-xs sm:text-sm border-collapse min-w-[500px]">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-[10px] sm:text-xs border-y border-slate-200">
                  <th className="py-3 sm:py-3.5 px-4 rounded-l-xl">Letter Grade</th>
                  <th className="py-3 sm:py-3.5 px-4">Marks Range</th>
                  <th className="py-3 sm:py-3.5 px-4">Grade Points (GP)</th>
                  <th className="py-3 sm:py-3.5 px-4 rounded-r-xl">Academic Classification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">A+</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">90 and above</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">4.00</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold text-emerald-700" rowSpan={6}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] sm:text-xs font-black shadow-2xs border border-emerald-200">
                      ● Safe Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">A</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">80 – 89</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">4.00</td>
                </tr>
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">B+</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">75 – 79</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">3.50 – 3.90</td>
                </tr>
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">B</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">70 – 74</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">3.00 – 3.40</td>
                </tr>
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">C+</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">65 – 69</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">2.50 – 2.90</td>
                </tr>
                <tr className="bg-emerald-50/20 hover:bg-emerald-50/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-emerald-800 text-base sm:text-sm">C</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">60 – 64</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">2.00 – 2.40</td>
                </tr>

                <tr className="bg-slate-50/60 hover:bg-slate-100 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-slate-800 text-base sm:text-sm">D+</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">55 – 59</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">1.50 – 1.90</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold text-slate-700" rowSpan={2}>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200 text-slate-900 text-[11px] sm:text-xs font-black shadow-2xs border border-slate-300">
                      ● Grey Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-50/60 hover:bg-slate-100 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-slate-800 text-base sm:text-sm">D</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold">50 – 54</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black">1.00 – 1.40</td>
                </tr>

                <tr className="bg-rose-50/40 hover:bg-rose-100/50 transition">
                  <td className="py-3.5 sm:py-3 px-4 font-black text-rose-700 text-base sm:text-sm">F</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold text-rose-800">Below 50</td>
                  <td className="py-3.5 sm:py-3 px-4 font-black text-rose-700">0.00</td>
                  <td className="py-3.5 sm:py-3 px-4 font-bold text-rose-700">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-100 text-rose-900 text-[11px] sm:text-xs font-black shadow-2xs border border-rose-300">
                      ● Danger Zone
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

      </main>

      {/* 5. Production Footer */}
      <footer className="mt-8 sm:mt-12 bg-white border-t border-slate-200/80 py-8 sm:py-10 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2.5">
        <p className="font-black text-slate-800 tracking-tight text-sm sm:text-base">
          NUML Academic GPA Operating System
        </p>
        <p className="text-slate-400 font-bold uppercase tracking-wider text-[10px]">
          Crafted by NUML Batch Fall 2023
        </p>
      </footer>

    </div>
  );
}