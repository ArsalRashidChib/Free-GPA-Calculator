"use client";

import { useState, useEffect, useMemo } from "react";

// --- NUML Official Grade Calculation Engine ---
export interface Course {
  id: string;
  name: string;
  credits: number;
  marks: number;
  gradePoints: number;
  gradeLabel: string;
  zone: "safe" | "grey" | "danger";
}

export interface Semester {
  id: string;
  name: string;
  courses: Course[];
}

export interface PriorHistory {
  credits: number;
  gpa: number;
}

export function calculateNumlGrade(rawMarks: number) {
  const marks = Math.min(100, Math.max(0, Math.round(rawMarks)));

  if (marks >= 90) {
    return { gradePoints: 4.0, gradeLabel: "A+", zone: "safe" as const };
  }
  if (marks >= 80) {
    return { gradePoints: 4.0, gradeLabel: "A", zone: "safe" as const };
  }
  if (marks >= 75) {
    // 75-79: 3.50 to 3.90
    const gp = 3.5 + ((marks - 75) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B+", zone: "safe" as const };
  }
  if (marks >= 70) {
    // 70-74: 3.00 to 3.40
    const gp = 3.0 + ((marks - 70) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B", zone: "safe" as const };
  }
  if (marks >= 65) {
    // 65-69: 2.50 to 2.90
    const gp = 2.5 + ((marks - 65) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C+", zone: "safe" as const };
  }
  if (marks >= 60) {
    // 60-64: 2.00 to 2.40
    const gp = 2.0 + ((marks - 60) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C", zone: "safe" as const };
  }
  if (marks >= 55) {
    // 55-59: 1.50 to 1.90
    const gp = 1.5 + ((marks - 55) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "D+", zone: "grey" as const };
  }
  if (marks >= 50) {
    // 50-54: 1.00 to 1.40
    const gp = 1.0 + ((marks - 50) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "D", zone: "grey" as const };
  }
  return { gradePoints: 0.0, gradeLabel: "F", zone: "danger" as const };
}

const INITIAL_DATA: Semester[] = [
  {
    id: "sem-1",
    name: "Semester 1",
    courses: [
      { id: "c1", name: "Programming Fundamentals", credits: 4, marks: 85, ...calculateNumlGrade(85) },
      { id: "c2", name: "Linear Algebra", credits: 3, marks: 78, ...calculateNumlGrade(78) },
      { id: "c3", name: "Applied Physics", credits: 3, marks: 72, ...calculateNumlGrade(72) },
      { id: "c4", name: "English Composition", credits: 3, marks: 92, ...calculateNumlGrade(92) },
    ],
  },
];

export default function NumlGPASuite() {
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<string>("sem-1");
  const [priorHistory, setPriorHistory] = useState<PriorHistory>({ credits: 0, gpa: 0 });
  const [showPriorInput, setShowPriorInput] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Target GPA States
  const [targetGPA, setTargetGPA] = useState<number>(3.5);
  const [upcomingCredits, setUpcomingCredits] = useState<number>(18);

  useEffect(() => {
    try {
      const savedSemesters = localStorage.getItem("numl_gpa_semesters");
      const savedPrior = localStorage.getItem("numl_gpa_prior");
      if (savedSemesters) {
        const parsed = JSON.parse(savedSemesters);
        setSemesters(parsed);
        if (parsed.length > 0) setActiveTab(parsed[0].id);
      }
      if (savedPrior) setPriorHistory(JSON.parse(savedPrior));
    } catch (e) {
      console.error(e);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("numl_gpa_semesters", JSON.stringify(semesters));
      localStorage.setItem("numl_gpa_prior", JSON.stringify(priorHistory));
    }
  }, [semesters, priorHistory, isLoaded]);

  const getSemesterStats = (sem: Semester) => {
    const credits = sem.courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const totalPoints = sem.courses.reduce((sum, c) => sum + (Number(c.credits) || 0) * c.gradePoints, 0);
    return {
      credits,
      gpa: credits > 0 ? (totalPoints / credits).toFixed(2) : "0.00",
    };
  };

  const allCourses = useMemo(() => semesters.flatMap((s) => s.courses), [semesters]);
  const activeSemesterCredits = allCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const activeSemesterPoints = allCourses.reduce((sum, c) => sum + (Number(c.credits) || 0) * c.gradePoints, 0);

  const priorPoints = (Number(priorHistory.credits) || 0) * (Number(priorHistory.gpa) || 0);
  const totalCumulativeCredits = activeSemesterCredits + (Number(priorHistory.credits) || 0);
  const totalCumulativePoints = activeSemesterPoints + priorPoints;

  const cumulativeGPA =
    totalCumulativeCredits > 0 ? (totalCumulativePoints / totalCumulativeCredits).toFixed(2) : "0.00";

  const zoneBreakdown = useMemo(() => {
    const counts = { safe: 0, grey: 0, danger: 0 };
    allCourses.forEach((c) => counts[c.zone]++);
    return counts;
  }, [allCourses]);

  const requiredTargetGPA = () => {
    if (upcomingCredits <= 0) return "0.00";
    const totalDesiredPoints = targetGPA * (totalCumulativeCredits + upcomingCredits);
    const neededPoints = totalDesiredPoints - totalCumulativePoints;
    const neededGPA = neededPoints / upcomingCredits;
    return neededGPA.toFixed(2);
  };

  const activeSemester = semesters.find((s) => s.id === activeTab) || semesters[0];

  const addSemester = () => {
    const newId = `sem-${Date.now()}`;
    const newSem: Semester = {
      id: newId,
      name: `Semester ${semesters.length + 1}`,
      courses: [{ id: crypto.randomUUID(), name: "New Course", credits: 3, marks: 80, ...calculateNumlGrade(80) }],
    };
    setSemesters([...semesters, newSem]);
    setActiveTab(newId);
  };

  const deleteSemester = (id: string) => {
    if (semesters.length <= 1) return;
    const remaining = semesters.filter((s) => s.id !== id);
    setSemesters(remaining);
    setActiveTab(remaining[0].id);
  };

  const addCourse = (semId: string) => {
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: [
            ...s.courses,
            {
              id: crypto.randomUUID(),
              name: `Course ${s.courses.length + 1}`,
              credits: 3,
              marks: 80,
              ...calculateNumlGrade(80),
            },
          ],
        };
      })
    );
  };

  const updateCourseMarks = (semId: string, courseId: string, marksValue: number) => {
    const calculated = calculateNumlGrade(marksValue);
    setSemesters((prev) =>
      prev.map((s) => {
        if (s.id !== semId) return s;
        return {
          ...s,
          courses: s.courses.map((c) =>
            c.id === courseId ? { ...c, marks: marksValue, ...calculated } : c
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
        if (s.courses.length <= 1) return s;
        return { ...s, courses: s.courses.filter((c) => c.id !== courseId) };
      })
    );
  };

  const exportDataCSV = () => {
    const headers = "Semester,Course Name,Credits,Marks,Grade,Grade Points,Zone\n";
    const rows = semesters
      .flatMap((s) =>
        s.courses.map((c) => `"${s.name}","${c.name}",${c.credits},${c.marks},${c.gradeLabel},${c.gradePoints},${c.zone}`)
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `NUML_GPA_Transcript_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-6 sm:py-10 px-3.5 sm:px-6 lg:px-8 flex flex-col justify-between antialiased">
      <div className="max-w-5xl w-full mx-auto space-y-6 sm:space-y-8">
        
        {/* Header with NUML Branding */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-blue-700 flex items-center justify-center text-white font-black text-sm shadow-sm">
                NUML
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  NUML GPA & CGPA Portal
                </h1>
                <p className="text-xs text-slate-500">
                  Official examination rules grading engine (Marks to GP Linear Scale)
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <button
              onClick={exportDataCSV}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition"
            >
              Print
            </button>
            <button
              onClick={() => {
                if (confirm("Reset all data?")) {
                  setSemesters(INITIAL_DATA);
                  setPriorHistory({ credits: 0, gpa: 0 });
                  setActiveTab("sem-1");
                }
              }}
              className="flex-1 sm:flex-initial px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Global Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Cumulative CGPA</span>
            <div className="text-3xl sm:text-4xl font-black text-blue-700 mt-1">{cumulativeGPA}</div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">Scale out of 4.00</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Active Term GPA</span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1">
              {activeSemester ? getSemesterStats(activeSemester).gpa : "0.00"}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate">{activeSemester?.name}</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Earned Credits</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-800 mt-1">{totalCumulativeCredits}</div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1">{semesters.length} Semester(s)</p>
          </div>

          <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Official Status</span>
            <div className="mt-2 space-y-1">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${
                parseFloat(cumulativeGPA) >= 3.0
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : parseFloat(cumulativeGPA) >= 2.0
                  ? "bg-amber-50 text-amber-700 border-amber-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {parseFloat(cumulativeGPA) >= 3.5 ? "Safe Zone (High)" : parseFloat(cumulativeGPA) >= 2.0 ? "Safe Zone" : "Danger Zone"}
              </span>
            </div>
          </div>
        </div>

        {/* NUML Grade & Zone Legend Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex items-center justify-between flex-wrap gap-2 text-xs">
          <span className="font-bold text-slate-400 uppercase tracking-wider text-[11px]">NUML Zone Distribution:</span>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold">
              Safe Zone (60–100): {zoneBreakdown.safe}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-300 font-semibold">
              Grey Zone (50–59): {zoneBreakdown.grey}
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-semibold">
              Danger Zone (&lt;50): {zoneBreakdown.danger}
            </span>
          </div>
        </div>

        {/* Transfer / Previous CGPA Config */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowPriorInput(!showPriorInput)}>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Prior Semester CGPA / Credit Hours</h2>
              <p className="text-xs text-slate-500">Incorporate earlier semesters without inputting individual past courses.</p>
            </div>
            <button className="text-xs font-semibold text-blue-700 hover:underline">
              {showPriorInput ? "Hide" : "Configure"}
            </button>
          </div>

          {showPriorInput && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Previous Completed Credits</label>
                <input
                  type="number"
                  min="0"
                  value={priorHistory.credits || ""}
                  placeholder="e.g. 60"
                  onChange={(e) => setPriorHistory({ ...priorHistory, credits: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Previous Cumulative CGPA</label>
                <input
                  type="number"
                  min="0"
                  max="4.0"
                  step="0.01"
                  value={priorHistory.gpa || ""}
                  placeholder="e.g. 3.45"
                  onChange={(e) => setPriorHistory({ ...priorHistory, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-700"
                />
              </div>
            </div>
          )}
        </div>

        {/* Semester Matrix Tabs */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {semesters.map((sem) => {
              const semStats = getSemesterStats(sem);
              const isActive = activeTab === sem.id;
              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveTab(sem.id)}
                  className={`px-3.5 sm:px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition flex items-center gap-2 border ${
                    isActive
                      ? "bg-white text-blue-700 border-blue-600 shadow-xs"
                      : "bg-white/70 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-white"
                  }`}
                >
                  <span>{sem.name}</span>
                  <span className={`text-[11px] px-1.5 py-0.5 rounded-md font-bold ${isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {semStats.gpa}
                  </span>
                </button>
              );
            })}
            <button
              onClick={addSemester}
              className="px-3.5 py-2 text-xs sm:text-sm font-semibold bg-white border border-dashed border-slate-300 text-slate-600 hover:text-blue-700 hover:border-blue-400 rounded-xl transition whitespace-nowrap"
            >
              + Add Semester
            </button>
          </div>

          {/* Active Semester Table */}
          {activeSemester && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-6 shadow-xs space-y-5 sm:space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <input
                  type="text"
                  value={activeSemester.name}
                  onChange={(e) =>
                    setSemesters((prev) =>
                      prev.map((s) => (s.id === activeSemester.id ? { ...s, name: e.target.value } : s))
                    )
                  }
                  className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-700 focus:outline-none transition py-0.5 max-w-xs"
                />

                <div className="flex items-center gap-3 sm:gap-4 text-xs font-medium text-slate-500">
                  <span>
                    Semester Credits: <strong className="text-slate-800">{getSemesterStats(activeSemester).credits}</strong>
                  </span>
                  <span>
                    GPA: <strong className="text-blue-700">{getSemesterStats(activeSemester).gpa}</strong>
                  </span>
                  {semesters.length > 1 && (
                    <button
                      onClick={() => deleteSemester(activeSemester.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold transition"
                    >
                      Delete Semester
                    </button>
                  )}
                </div>
              </div>

              {/* Course Row Table */}
              <div className="space-y-3">
                {/* Column Headers for Laptop / Desktop */}
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                  <span className="col-span-4">Course Title</span>
                  <span className="col-span-2">Credit Hours</span>
                  <span className="col-span-2">Marks (0-100)</span>
                  <span className="col-span-2">Calculated GP</span>
                  <span className="col-span-1 text-center">Grade</span>
                  <span className="col-span-1 text-right"></span>
                </div>

                {activeSemester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-3 items-stretch sm:items-center bg-slate-50/80 hover:bg-slate-50 p-3 sm:p-2.5 rounded-xl border border-slate-200/80 transition"
                  >
                    <div className="sm:col-span-4">
                      <input
                        type="text"
                        placeholder="Course title"
                        value={course.name}
                        onChange={(e) => updateCourseField(activeSemester.id, course.id, "name", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-700 shadow-2xs"
                      />
                    </div>

                    <div className="grid grid-cols-3 sm:contents gap-2">
                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1">Credits</label>
                        <input
                          type="number"
                          min="1"
                          max="6"
                          step="1"
                          value={course.credits}
                          onChange={(e) =>
                            updateCourseField(activeSemester.id, course.id, "credits", parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-700 shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1">Marks</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={course.marks}
                          onChange={(e) =>
                            updateCourseMarks(activeSemester.id, course.id, parseFloat(e.target.value) || 0)
                          }
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-700 shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center">
                        <label className="text-[10px] font-bold text-slate-400 uppercase sm:hidden block mb-1">Points</label>
                        <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800">
                          {course.gradePoints.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    <div className="sm:col-span-1 flex items-center justify-center">
                      <span
                        className={`w-full text-center py-1 sm:py-0.5 px-2 rounded-md font-bold text-xs border ${
                          course.zone === "safe"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : course.zone === "grey"
                            ? "bg-slate-200 text-slate-700 border-slate-300"
                            : "bg-rose-100 text-rose-700 border-rose-200"
                        }`}
                      >
                        {course.gradeLabel}
                      </span>
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeCourse(activeSemester.id, course.id)}
                        disabled={activeSemester.courses.length <= 1}
                        className="w-full sm:w-auto text-xs sm:text-base font-bold text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1 sm:p-0 rounded bg-slate-100 sm:bg-transparent transition text-center"
                      >
                        <span className="sm:hidden">Delete</span>
                        <span className="hidden sm:inline">✕</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addCourse(activeSemester.id)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                + Add Course
              </button>
            </div>
          )}
        </div>

        {/* Target GPA Forecaster */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-900">Target CGPA Forecaster</h2>
            <p className="text-xs text-slate-500">
              Calculate what GPA you need across future credit hours to achieve your target graduation CGPA.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Goal CGPA (Max 4.00)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-700"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Upcoming Credit Hours</label>
              <input
                type="number"
                min="1"
                max="120"
                value={upcomingCredits}
                onChange={(e) => setUpcomingCredits(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-700"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <span className="text-[11px] uppercase text-slate-500 font-bold block">Required Future GPA</span>
              <span
                className={`text-2xl sm:text-3xl font-black ${
                  parseFloat(requiredTargetGPA()) > 4.0
                    ? "text-rose-600"
                    : parseFloat(requiredTargetGPA()) <= 0
                    ? "text-blue-700"
                    : "text-emerald-600"
                }`}
              >
                {requiredTargetGPA()}
              </span>
              <span className="text-[10px] text-slate-500 block mt-1">
                {parseFloat(requiredTargetGPA()) > 4.0
                  ? "Target mathematically unachievable"
                  : "Target is achievable"}
              </span>
            </div>
          </div>
        </div>

        {/* Official NUML Grades & Ranges Reference Table */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="text-base font-bold text-slate-900">Official NUML Grading System & Ranges</h2>
            <p className="text-xs text-slate-500">
              Reference standard extracted directly from NUML Examination Policy rules.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-500 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4 rounded-l-lg">Grades</th>
                  <th className="py-3 px-4">Marks Range</th>
                  <th className="py-3 px-4">Grade Points (GP)</th>
                  <th className="py-3 px-4 rounded-r-lg">Academic Standing</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {/* Safe Zone */}
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">A+</td>
                  <td className="py-2.5 px-4">90 and above</td>
                  <td className="py-2.5 px-4 font-semibold">4.00</td>
                  <td className="py-2.5 px-4 font-bold text-emerald-700" rowSpan={6}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[11px]">
                      ● Safe Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">A</td>
                  <td className="py-2.5 px-4">80 – 89</td>
                  <td className="py-2.5 px-4 font-semibold">4.00</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">B+</td>
                  <td className="py-2.5 px-4">75 – 79</td>
                  <td className="py-2.5 px-4 font-semibold">3.50 – 3.90</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">B</td>
                  <td className="py-2.5 px-4">70 – 74</td>
                  <td className="py-2.5 px-4 font-semibold">3.00 – 3.40</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">C+</td>
                  <td className="py-2.5 px-4">65 – 69</td>
                  <td className="py-2.5 px-4 font-semibold">2.50 – 2.90</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-2.5 px-4 font-bold text-emerald-800">C</td>
                  <td className="py-2.5 px-4">60 – 64</td>
                  <td className="py-2.5 px-4 font-semibold">2.00 – 2.40</td>
                </tr>

                {/* Grey Zone */}
                <tr className="bg-slate-100/60 hover:bg-slate-100 transition">
                  <td className="py-2.5 px-4 font-bold text-slate-800">D+</td>
                  <td className="py-2.5 px-4">55 – 59</td>
                  <td className="py-2.5 px-4 font-semibold">1.50 – 1.90</td>
                  <td className="py-2.5 px-4 font-bold text-slate-700" rowSpan={2}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-[11px]">
                      ● Grey Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-100/60 hover:bg-slate-100 transition">
                  <td className="py-2.5 px-4 font-bold text-slate-800">D</td>
                  <td className="py-2.5 px-4">50 – 54</td>
                  <td className="py-2.5 px-4 font-semibold">1.00 – 1.40</td>
                </tr>

                {/* Danger Zone */}
                <tr className="bg-rose-50/60 hover:bg-rose-50 transition">
                  <td className="py-2.5 px-4 font-bold text-rose-700">F</td>
                  <td className="py-2.5 px-4 font-medium text-rose-800">Below 50</td>
                  <td className="py-2.5 px-4 font-bold text-rose-700">0.00</td>
                  <td className="py-2.5 px-4 font-bold text-rose-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-[11px]">
                      ● Danger Zone
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Footer */}
      <footer className="mt-12 text-center text-xs font-medium text-slate-400 py-4 border-t border-slate-200/60">
        Crafted by NUML Batch Fall 2023
      </footer>
    </main>
  );
}