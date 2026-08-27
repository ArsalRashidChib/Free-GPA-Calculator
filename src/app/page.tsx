"use client";

import { useState, useEffect, useMemo, useRef } from "react";

// --- Types & Config ---
export type WeightType = "regular" | "honors" | "ap";

export interface Course {
  id: string;
  name: string;
  credits: number;
  gradePoints: number;
  weight: WeightType;
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

const GRADE_SCALE = [
  { label: "A+ (4.0)", value: 4.0, letter: "A" },
  { label: "A (4.0)", value: 4.0, letter: "A" },
  { label: "A- (3.7)", value: 3.7, letter: "A" },
  { label: "B+ (3.3)", value: 3.3, letter: "B" },
  { label: "B (3.0)", value: 3.0, letter: "B" },
  { label: "B- (2.7)", value: 2.7, letter: "B" },
  { label: "C+ (2.3)", value: 2.3, letter: "C" },
  { label: "C (2.0)", value: 2.0, letter: "C" },
  { label: "C- (1.7)", value: 1.7, letter: "C" },
  { label: "D+ (1.3)", value: 1.3, letter: "D" },
  { label: "D (1.0)", value: 1.0, letter: "D" },
  { label: "F (0.0)", value: 0.0, letter: "F" },
];

const WEIGHT_BONUS: Record<WeightType, number> = {
  regular: 0.0,
  honors: 0.5,
  ap: 1.0,
};

const INITIAL_DATA: Semester[] = [
  {
    id: "sem-1",
    name: "Fall Semester",
    courses: [
      { id: "c1", name: "Data Structures & Algorithms", credits: 4, gradePoints: 4.0, weight: "regular" },
      { id: "c2", name: "Linear Algebra", credits: 4, gradePoints: 3.7, weight: "honors" },
      { id: "c3", name: "University Physics", credits: 4, gradePoints: 3.3, weight: "ap" },
      { id: "c4", name: "Technical Writing", credits: 3, gradePoints: 4.0, weight: "regular" },
    ],
  },
];

export default function ProfessionalGPASuite() {
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<string>("sem-1");
  const [priorHistory, setPriorHistory] = useState<PriorHistory>({ credits: 0, gpa: 0 });
  const [showPriorInput, setShowPriorInput] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Target GPA Planner States
  const [targetGPA, setTargetGPA] = useState<number>(3.8);
  const [upcomingCredits, setUpcomingCredits] = useState<number>(15);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const savedSemesters = localStorage.getItem("gpa_pro_semesters");
      const savedPrior = localStorage.getItem("gpa_pro_prior");
      if (savedSemesters) {
        const parsed = JSON.parse(savedSemesters);
        setSemesters(parsed);
        if (parsed.length > 0) setActiveTab(parsed[0].id);
      }
      if (savedPrior) {
        setPriorHistory(JSON.parse(savedPrior));
      }
    } catch (e) {
      console.error("Local storage hydration error", e);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("gpa_pro_semesters", JSON.stringify(semesters));
      localStorage.setItem("gpa_pro_prior", JSON.stringify(priorHistory));
    }
  }, [semesters, priorHistory, isLoaded]);

  // --- Calculations ---
  const getCoursePoints = (c: Course) => {
    const bonus = c.gradePoints > 0 ? WEIGHT_BONUS[c.weight] : 0;
    return (Number(c.gradePoints) + bonus) * (Number(c.credits) || 0);
  };

  const getSemesterStats = (sem: Semester) => {
    const credits = sem.courses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
    const points = sem.courses.reduce((sum, c) => sum + getCoursePoints(c), 0);
    const unweightedPoints = sem.courses.reduce(
      (sum, c) => sum + (Number(c.gradePoints) || 0) * (Number(c.credits) || 0),
      0
    );

    return {
      credits,
      gpa: credits > 0 ? (points / credits).toFixed(2) : "0.00",
      unweightedGpa: credits > 0 ? (unweightedPoints / credits).toFixed(2) : "0.00",
    };
  };

  const allCourses = useMemo(() => semesters.flatMap((s) => s.courses), [semesters]);

  const rawActiveCredits = allCourses.reduce((sum, c) => sum + (Number(c.credits) || 0), 0);
  const rawActivePoints = allCourses.reduce((sum, c) => sum + getCoursePoints(c), 0);

  const priorPoints = (Number(priorHistory.credits) || 0) * (Number(priorHistory.gpa) || 0);
  const totalCumulativeCredits = rawActiveCredits + (Number(priorHistory.credits) || 0);
  const totalCumulativePoints = rawActivePoints + priorPoints;

  const cumulativeGPA =
    totalCumulativeCredits > 0 ? (totalCumulativePoints / totalCumulativeCredits).toFixed(2) : "0.00";

  const unweightedCumulativeGPA = useMemo(() => {
    const unweightedPts = allCourses.reduce(
      (sum, c) => sum + (Number(c.gradePoints) || 0) * (Number(c.credits) || 0),
      0
    );
    return rawActiveCredits > 0 ? (unweightedPts / rawActiveCredits).toFixed(2) : "0.00";
  }, [allCourses, rawActiveCredits]);

  // Grade Distribution Counter
  const gradeDistribution = useMemo(() => {
    const counts: Record<string, number> = { A: 0, B: 0, C: 0, D: 0, F: 0 };
    allCourses.forEach((c) => {
      const match = GRADE_SCALE.find((g) => g.value === c.gradePoints);
      if (match) counts[match.letter] = (counts[match.letter] || 0) + 1;
    });
    return counts;
  }, [allCourses]);

  // Academic Standing Classification
  const academicStanding = useMemo(() => {
    const val = parseFloat(cumulativeGPA);
    if (val >= 3.9) return { label: "Summa Cum Laude", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    if (val >= 3.7) return { label: "Magna Cum Laude", color: "bg-blue-50 text-blue-700 border-blue-200" };
    if (val >= 3.5) return { label: "Dean's List / Honors", color: "bg-indigo-50 text-indigo-700 border-indigo-200" };
    if (val >= 3.0) return { label: "Good Standing", color: "bg-slate-100 text-slate-700 border-slate-300" };
    if (val >= 2.0) return { label: "Academic Warning", color: "bg-amber-50 text-amber-700 border-amber-200" };
    return { label: "Academic Probation Risk", color: "bg-rose-50 text-rose-700 border-rose-200" };
  }, [cumulativeGPA]);

  // Target GPA Planner Formula
  const requiredTargetGPA = () => {
    if (upcomingCredits <= 0) return "0.00";
    const totalDesiredPoints = targetGPA * (totalCumulativeCredits + upcomingCredits);
    const neededPoints = totalDesiredPoints - totalCumulativePoints;
    const neededGPA = neededPoints / upcomingCredits;
    return neededGPA.toFixed(2);
  };

  // --- Handlers ---
  const activeSemester = semesters.find((s) => s.id === activeTab) || semesters[0];

  const addSemester = () => {
    const newId = `sem-${Date.now()}`;
    const newSem: Semester = {
      id: newId,
      name: `Semester ${semesters.length + 1}`,
      courses: [{ id: crypto.randomUUID(), name: "New Course", credits: 3, gradePoints: 4.0, weight: "regular" }],
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
              gradePoints: 4.0,
              weight: "regular",
            },
          ],
        };
      })
    );
  };

  const updateCourse = (semId: string, courseId: string, field: keyof Course, value: unknown) => {
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

  // Export CSV
  const exportDataCSV = () => {
    const headers = "Semester,Course Name,Credits,Grade Points,Weight\n";
    const rows = semesters
      .flatMap((s) =>
        s.courses.map((c) => `"${s.name}","${c.name}",${c.credits},${c.gradePoints},${c.weight}`)
      )
      .join("\n");
    const blob = new Blob([headers + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Academic_GPA_Report_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  // Import JSON / Backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (Array.isArray(parsed)) {
          setSemesters(parsed);
          setActiveTab(parsed[0]?.id || "sem-1");
        }
      } catch {
        alert("Invalid file format. Please upload a valid exported JSON file.");
      }
    };
    reader.readAsText(file);
  };

  const clearAllData = () => {
    if (confirm("Reset all semester data back to default template?")) {
      setSemesters(INITIAL_DATA);
      setPriorHistory({ credits: 0, gpa: 0 });
      setActiveTab("sem-1");
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 py-10 px-4 sm:px-6 lg:px-8 font-sans antialiased">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Navigation / Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div>
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-blue-500/20">
                A+
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                Academic GPA Studio
              </h1>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              Precision cumulative tracking, multi-scale weighted honors, & smart goal forecasting.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImportFile}
              accept=".json"
              className="hidden"
            />
            <button
              onClick={exportDataCSV}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition"
            >
              Export CSV
            </button>
            <button
              onClick={() => window.print()}
              className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-xl shadow-xs transition"
            >
              Print Summary
            </button>
            <button
              onClick={clearAllData}
              className="px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition"
            >
              Reset
            </button>
          </div>
        </header>

        {/* Global Performance Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Cumulative GPA</span>
            <div className="text-4xl font-extrabold text-blue-600 mt-1 tracking-tight">{cumulativeGPA}</div>
            <div className="flex items-center gap-2 mt-2">
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${academicStanding.color}`}>
                {academicStanding.label}
              </span>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Unweighted Scale</span>
            <div className="text-4xl font-extrabold text-slate-800 mt-1 tracking-tight">{unweightedCumulativeGPA}</div>
            <p className="text-xs text-slate-500 mt-2">Pure 4.0 Standard Base</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Total Credits</span>
            <div className="text-4xl font-extrabold text-slate-800 mt-1 tracking-tight">{totalCumulativeCredits}</div>
            <p className="text-xs text-slate-500 mt-2">Across {semesters.length} semester(s)</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
            <span className="text-xs uppercase font-semibold text-slate-400 tracking-wider">Active Term GPA</span>
            <div className="text-4xl font-extrabold text-emerald-600 mt-1 tracking-tight">
              {activeSemester ? getSemesterStats(activeSemester).gpa : "0.00"}
            </div>
            <p className="text-xs text-slate-500 mt-2 truncate">{activeSemester?.name || "None"}</p>
          </div>
        </div>

        {/* Grade Distribution Bar */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-sm flex items-center justify-between flex-wrap gap-3 text-xs">
          <span className="font-semibold text-slate-500 uppercase tracking-wider">Grade Breakdown:</span>
          <div className="flex items-center gap-2 flex-wrap">
            {Object.entries(gradeDistribution).map(([grade, count]) => (
              <div key={grade} className="flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg font-medium text-slate-700">
                <span className="font-bold text-slate-900">{grade}:</span>
                <span>{count} course{count === 1 ? "" : "s"}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Prior Academic Credits Drawer */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowPriorInput(!showPriorInput)}>
            <div>
              <h2 className="text-sm font-bold text-slate-800">Prior College / Transfer Credits</h2>
              <p className="text-xs text-slate-500">Add already-completed credits without entering old courses individually.</p>
            </div>
            <button className="text-xs font-semibold text-blue-600 hover:text-blue-700">
              {showPriorInput ? "Hide" : "Edit Prior Credits"}
            </button>
          </div>

          {showPriorInput && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Previous Total Credits</label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={priorHistory.credits || ""}
                  placeholder="e.g. 45"
                  onChange={(e) => setPriorHistory({ ...priorHistory, credits: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-600 transition"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Previous Cumulative GPA</label>
                <input
                  type="number"
                  min="0"
                  max="5.0"
                  step="0.01"
                  value={priorHistory.gpa || ""}
                  placeholder="e.g. 3.65"
                  onChange={(e) => setPriorHistory({ ...priorHistory, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-600 transition"
                />
              </div>
            </div>
          )}
        </div>

        {/* Semester Tabs & Dynamic Management */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {semesters.map((sem) => {
              const semStats = getSemesterStats(sem);
              const isActive = activeTab === sem.id;
              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveTab(sem.id)}
                  className={`px-4 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap transition flex items-center gap-2.5 border ${
                    isActive
                      ? "bg-white text-blue-600 border-blue-500 shadow-sm"
                      : "bg-white/80 text-slate-600 hover:text-slate-900 border-slate-200 hover:bg-white"
                  }`}
                >
                  <span>{sem.name}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? "bg-blue-50 text-blue-700" : "bg-slate-100 text-slate-600"}`}>
                    {semStats.gpa}
                  </span>
                </button>
              );
            })}
            <button
              onClick={addSemester}
              className="px-4 py-2.5 text-sm font-semibold bg-white border border-dashed border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 rounded-xl transition"
            >
              + Add Term
            </button>
          </div>

          {/* Active Semester Table */}
          {activeSemester && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <input
                  type="text"
                  value={activeSemester.name}
                  onChange={(e) =>
                    setSemesters((prev) =>
                      prev.map((s) => (s.id === activeSemester.id ? { ...s, name: e.target.value } : s))
                    )
                  }
                  className="text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition py-0.5 max-w-xs"
                />

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span>
                    Term Credits: <strong className="text-slate-800">{getSemesterStats(activeSemester).credits}</strong>
                  </span>
                  <span>
                    Unweighted GPA: <strong className="text-slate-800">{getSemesterStats(activeSemester).unweightedGpa}</strong>
                  </span>
                  {semesters.length > 1 && (
                    <button
                      onClick={() => deleteSemester(activeSemester.id)}
                      className="text-rose-500 hover:text-rose-700 transition"
                    >
                      Delete Term
                    </button>
                  )}
                </div>
              </div>

              {/* Course Matrix Header */}
              <div className="space-y-3">
                <div className="grid grid-cols-12 gap-3 text-xs font-bold uppercase tracking-wider text-slate-400 px-3">
                  <span className="col-span-12 sm:col-span-4">Course Name</span>
                  <span className="col-span-4 sm:col-span-2">Credits</span>
                  <span className="col-span-4 sm:col-span-3">Grade Earned</span>
                  <span className="col-span-3 sm:col-span-2">Course Level</span>
                  <span className="col-span-1 text-right"></span>
                </div>

                {activeSemester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="grid grid-cols-12 gap-3 items-center bg-slate-50/70 hover:bg-slate-50 p-3 rounded-xl border border-slate-200/70 transition"
                  >
                    <input
                      type="text"
                      placeholder="e.g. Organic Chemistry"
                      value={course.name}
                      onChange={(e) => updateCourse(activeSemester.id, course.id, "name", e.target.value)}
                      className="col-span-12 sm:col-span-4 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
                    />

                    <input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={course.credits}
                      onChange={(e) =>
                        updateCourse(activeSemester.id, course.id, "credits", parseFloat(e.target.value) || 0)
                      }
                      className="col-span-4 sm:col-span-2 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 shadow-2xs"
                    />

                    <select
                      value={course.gradePoints}
                      onChange={(e) =>
                        updateCourse(activeSemester.id, course.id, "gradePoints", parseFloat(e.target.value))
                      }
                      className="col-span-4 sm:col-span-3 bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 shadow-2xs"
                    >
                      {GRADE_SCALE.map((g) => (
                        <option key={g.label} value={g.value}>
                          {g.label}
                        </option>
                      ))}
                    </select>

                    <select
                      value={course.weight}
                      onChange={(e) =>
                        updateCourse(activeSemester.id, course.id, "weight", e.target.value as WeightType)
                      }
                      className="col-span-3 sm:col-span-2 bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-xs text-slate-800 font-medium focus:outline-blue-600 shadow-2xs"
                    >
                      <option value="regular">Standard (+0.0)</option>
                      <option value="honors">Honors (+0.5)</option>
                      <option value="ap">AP / IB (+1.0)</option>
                    </select>

                    <button
                      type="button"
                      onClick={() => removeCourse(activeSemester.id, course.id)}
                      disabled={activeSemester.courses.length <= 1}
                      className="col-span-1 text-slate-400 hover:text-rose-600 disabled:opacity-20 text-center font-bold text-base transition"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => addCourse(activeSemester.id)}
                className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 font-semibold rounded-xl text-sm transition"
              >
                + Add Another Course
              </button>
            </div>
          )}
        </div>

        {/* Target GPA Planner / Scenario Forecaster */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-sm">
          <div className="border-b border-slate-100 pb-3 mb-5">
            <h2 className="text-base font-bold text-slate-900">Graduation Target GPA Forecaster</h2>
            <p className="text-xs text-slate-500">
              Determine the exact minimum GPA required across future terms to reach your graduation goal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Goal Cumulative GPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="5.0"
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-600">Remaining Future Credit Hours</label>
              <input
                type="number"
                min="1"
                max="120"
                value={upcomingCredits}
                onChange={(e) => setUpcomingCredits(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 text-center">
              <span className="text-xs uppercase text-slate-500 font-bold block">Required Target GPA</span>
              <span
                className={`text-3xl font-black ${
                  parseFloat(requiredTargetGPA()) > 4.0
                    ? "text-amber-600"
                    : parseFloat(requiredTargetGPA()) <= 0
                    ? "text-blue-600"
                    : "text-emerald-600"
                }`}
              >
                {requiredTargetGPA()}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                {parseFloat(requiredTargetGPA()) > 4.0
                  ? "Requires Weighted AP / Honors bonus points"
                  : "Target is comfortably achievable"}
              </span>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}