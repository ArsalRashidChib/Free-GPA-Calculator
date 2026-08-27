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

  if (marks >= 90) return { gradePoints: 4.0, gradeLabel: "A+", zone: "safe" as const };
  if (marks >= 80) return { gradePoints: 4.0, gradeLabel: "A", zone: "safe" as const };
  if (marks >= 75) {
    const gp = 3.5 + ((marks - 75) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B+", zone: "safe" as const };
  }
  if (marks >= 70) {
    const gp = 3.0 + ((marks - 70) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "B", zone: "safe" as const };
  }
  if (marks >= 65) {
    const gp = 2.5 + ((marks - 65) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C+", zone: "safe" as const };
  }
  if (marks >= 60) {
    const gp = 2.0 + ((marks - 60) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "C", zone: "safe" as const };
  }
  if (marks >= 55) {
    const gp = 1.5 + ((marks - 55) / 4) * 0.4;
    return { gradePoints: parseFloat(gp.toFixed(2)), gradeLabel: "D+", zone: "grey" as const };
  }
  if (marks >= 50) {
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

const FAQS = [
  {
    q: "How does NUML calculate Grade Points from Marks?",
    a: "NUML uses a linear interpolation formula within each 5-mark band (e.g. 70-74 or 75-79). Every 1-mark increment translates to a 0.10 addition to your Grade Point for that tier.",
  },
  {
    q: "What is the passing CGPA requirement for graduation?",
    a: "Undergraduate BS programs typically require a minimum cumulative CGPA of 2.00 out of 4.00 to graduate in good standing.",
  },
  {
    q: "Are my courses and grades stored on any server?",
    a: "No. All calculations run strictly client-side on your device and persist using your browser's localStorage for complete privacy.",
  },
  {
    q: "What is the difference between Safe, Grey, and Danger Zones?",
    a: "Safe Zone represents grades C and above (Marks 60+). Grey Zone represents grades D+ and D (Marks 50-59) which count toward credits but depress CGPA. Danger Zone represents an F grade (Marks below 50).",
  },
];

export default function NumlGPASuite() {
  const [semesters, setSemesters] = useState<Semester[]>(INITIAL_DATA);
  const [activeTab, setActiveTab] = useState<string>("sem-1");
  const [priorHistory, setPriorHistory] = useState<PriorHistory>({ credits: 0, gpa: 0 });
  const [showPriorInput, setShowPriorInput] = useState<boolean>(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // Target GPA States
  const [targetGPA, setTargetGPA] = useState<number>(3.5);
  const [upcomingCredits, setUpcomingCredits] = useState<number>(18);

  useEffect(() => {
    try {
      const savedSemesters = localStorage.getItem("numl_gpa_semesters_v2");
      const savedPrior = localStorage.getItem("numl_gpa_prior_v2");
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
      localStorage.setItem("numl_gpa_semesters_v2", JSON.stringify(semesters));
      localStorage.setItem("numl_gpa_prior_v2", JSON.stringify(priorHistory));
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

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white antialiased">
      
      {/* 1. Global Sticky Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80 transition">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
            <div className="h-9 w-9 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-sm shadow-sm shadow-blue-500/20">
              NL
            </div>
            <div>
              <span className="font-bold text-slate-900 tracking-tight text-base">NUML GPA Studio</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200/60">
                Official Scale
              </span>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6 text-xs font-semibold text-slate-600">
            <button onClick={() => scrollToSection("calculator")} className="hover:text-blue-600 transition">
              Calculator
            </button>
            <button onClick={() => scrollToSection("forecaster")} className="hover:text-blue-600 transition">
              Target Forecaster
            </button>
            <button onClick={() => scrollToSection("grading-table")} className="hover:text-blue-600 transition">
              Grading Policy
            </button>
            <button onClick={() => scrollToSection("faq")} className="hover:text-blue-600 transition">
              FAQ
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => scrollToSection("calculator")}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-blue-600/20 transition active:scale-98"
            >
              Start Calculating
            </button>
          </div>
        </div>
      </nav>

      {/* 2. Hero Section */}
      <section id="hero" className="relative pt-12 pb-16 sm:pt-20 sm:pb-24 overflow-hidden border-b border-slate-200/60 bg-gradient-to-b from-white to-slate-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/70 text-blue-700 text-xs font-semibold shadow-2xs">
            <span className="h-1.5 w-1.5 rounded-full bg-blue-600 animate-pulse"></span>
            NUML Examination Rules Compliant
          </div>

          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-slate-900 leading-tight">
            The Ultimate GPA & CGPA Suite <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Engineered for NUMLites
            </span>
          </h1>

          <p className="max-w-2xl mx-auto text-sm sm:text-base text-slate-600 font-normal leading-relaxed">
            Eliminate approximation errors. Calculate your semester GPA and cumulative CGPA using the precise
            official NUML linear interpolation formula with marks-to-grade mapping.
          </p>

          {/* Quick Stat Pill Bar */}
          <div className="pt-4 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> 100% Client-Side Privacy
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Real-Time Marks to GP
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-emerald-600 font-bold">✓</span> Instant CSV & Print Export
            </div>
          </div>
        </div>
      </section>

      {/* Main App Workspace */}
      <div className="max-w-6xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
        
        {/* 3. Global CGPA Live Banner */}
        <div id="calculator" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Cumulative CGPA</span>
            <div className="text-3xl sm:text-4xl font-black text-blue-600 mt-1 tracking-tight">{cumulativeGPA}</div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">Standard 4.00 Base</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Active Term GPA</span>
            <div className="text-3xl sm:text-4xl font-black text-emerald-600 mt-1 tracking-tight">
              {activeSemester ? getSemesterStats(activeSemester).gpa : "0.00"}
            </div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 truncate font-medium">{activeSemester?.name}</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Total Credit Hours</span>
            <div className="text-3xl sm:text-4xl font-black text-slate-800 mt-1 tracking-tight">{totalCumulativeCredits}</div>
            <p className="text-[11px] sm:text-xs text-slate-500 mt-1 font-medium">{semesters.length} Term(s) Enrolled</p>
          </div>

          <div className="bg-white border border-slate-200/80 p-5 rounded-2xl shadow-xs">
            <span className="text-[10px] sm:text-xs uppercase font-bold text-slate-400 tracking-wider">Academic Standing</span>
            <div className="mt-2">
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border inline-block ${
                parseFloat(cumulativeGPA) >= 3.5
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : parseFloat(cumulativeGPA) >= 2.0
                  ? "bg-blue-50 text-blue-700 border-blue-200"
                  : "bg-rose-50 text-rose-700 border-rose-200"
              }`}>
                {parseFloat(cumulativeGPA) >= 3.5 ? "Safe Zone (Honors)" : parseFloat(cumulativeGPA) >= 2.0 ? "Good Standing" : "Probation Risk"}
              </span>
            </div>
          </div>
        </div>

        {/* 4. Controls & Prior Credits Accordion */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800">Transcript Workspace</h2>
              <p className="text-xs text-slate-500">Configure terms, courses, and transfer credits.</p>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={() => setShowPriorInput(!showPriorInput)}
                className="px-3.5 py-2 text-xs font-semibold bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl transition"
              >
                {showPriorInput ? "Hide Transfer Credits" : "+ Add Prior CGPA / Credits"}
              </button>
              <button
                onClick={exportDataCSV}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition"
              >
                Export CSV
              </button>
              <button
                onClick={() => window.print()}
                className="px-3.5 py-2 text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition"
              >
                Print Report
              </button>
              <button
                onClick={() => {
                  if (confirm("Reset all semester data back to default template?")) {
                    setSemesters(INITIAL_DATA);
                    setPriorHistory({ credits: 0, gpa: 0 });
                    setActiveTab("sem-1");
                  }
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-100 rounded-xl transition"
              >
                Reset
              </button>
            </div>
          </div>

          {showPriorInput && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-slate-100">
              <div>
                <label className="text-xs font-semibold text-slate-600 block mb-1">Previous Completed Credits</label>
                <input
                  type="number"
                  min="0"
                  value={priorHistory.credits || ""}
                  placeholder="e.g. 45"
                  onChange={(e) => setPriorHistory({ ...priorHistory, credits: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-600"
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
                  placeholder="e.g. 3.40"
                  onChange={(e) => setPriorHistory({ ...priorHistory, gpa: parseFloat(e.target.value) || 0 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-800 focus:bg-white focus:outline-blue-600"
                />
              </div>
            </div>
          )}
        </div>

        {/* 5. Semester Matrix & Course Rows */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
            {semesters.map((sem) => {
              const semStats = getSemesterStats(sem);
              const isActive = activeTab === sem.id;
              return (
                <button
                  key={sem.id}
                  onClick={() => setActiveTab(sem.id)}
                  className={`px-4 py-2.5 text-xs sm:text-sm font-semibold rounded-xl whitespace-nowrap transition flex items-center gap-2 border ${
                    isActive
                      ? "bg-white text-blue-600 border-blue-500 shadow-sm"
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
              className="px-4 py-2.5 text-xs sm:text-sm font-semibold bg-white border border-dashed border-slate-300 text-slate-600 hover:text-blue-600 hover:border-blue-400 rounded-xl transition whitespace-nowrap"
            >
              + Add Term
            </button>
          </div>

          {activeSemester && (
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <input
                  type="text"
                  value={activeSemester.name}
                  onChange={(e) =>
                    setSemesters((prev) =>
                      prev.map((s) => (s.id === activeSemester.id ? { ...s, name: e.target.value } : s))
                    )
                  }
                  className="text-lg sm:text-xl font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-600 focus:outline-none transition py-0.5 max-w-xs"
                />

                <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
                  <span>
                    Semester Credits: <strong className="text-slate-800">{getSemesterStats(activeSemester).credits}</strong>
                  </span>
                  <span>
                    Term GPA: <strong className="text-blue-600 font-bold">{getSemesterStats(activeSemester).gpa}</strong>
                  </span>
                  {semesters.length > 1 && (
                    <button
                      onClick={() => deleteSemester(activeSemester.id)}
                      className="text-rose-500 hover:text-rose-700 font-semibold transition"
                    >
                      Delete Term
                    </button>
                  )}
                </div>
              </div>

              {/* Course Matrix Header */}
              <div className="space-y-3">
                <div className="hidden sm:grid grid-cols-12 gap-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 px-3">
                  <span className="col-span-5">Course Title</span>
                  <span className="col-span-2">Credit Hours</span>
                  <span className="col-span-2">Marks (0-100)</span>
                  <span className="col-span-2">Calculated GP</span>
                  <span className="col-span-1 text-right"></span>
                </div>

                {activeSemester.courses.map((course) => (
                  <div
                    key={course.id}
                    className="flex flex-col sm:grid sm:grid-cols-12 gap-2.5 sm:gap-3 items-stretch sm:items-center bg-slate-50/70 hover:bg-slate-50 p-3 sm:p-2.5 rounded-xl border border-slate-200/80 transition"
                  >
                    <div className="sm:col-span-5">
                      <input
                        type="text"
                        placeholder="Course title (e.g. Operating Systems)"
                        value={course.name}
                        onChange={(e) => updateCourseField(activeSemester.id, course.id, "name", e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 focus:ring-1 focus:ring-blue-600 shadow-2xs"
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
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 shadow-2xs"
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
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 font-medium focus:outline-blue-600 shadow-2xs"
                        />
                      </div>

                      <div className="sm:col-span-2 flex items-center gap-2">
                        <div className="w-full bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-slate-800 text-center">
                          {course.gradePoints.toFixed(2)}
                        </div>
                        <span
                          className={`text-xs font-bold px-2 py-1 rounded-md border ${
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
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <button
                        type="button"
                        onClick={() => removeCourse(activeSemester.id, course.id)}
                        disabled={activeSemester.courses.length <= 1}
                        className="w-full sm:w-auto text-xs sm:text-base font-bold text-slate-400 hover:text-rose-600 disabled:opacity-20 p-1 sm:p-0 rounded bg-slate-100 sm:bg-transparent transition text-center"
                      >
                        <span className="sm:hidden">Remove Course</span>
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

        {/* 6. Target GPA Forecaster */}
        <section id="forecaster" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Target CGPA Forecaster</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Calculate the minimum GPA you must average across future credit hours to achieve your graduation goal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Desired Cumulative CGPA</label>
              <input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                value={targetGPA}
                onChange={(e) => setTargetGPA(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Remaining Future Credit Hours</label>
              <input
                type="number"
                min="1"
                max="120"
                value={upcomingCredits}
                onChange={(e) => setUpcomingCredits(parseFloat(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 font-medium focus:bg-white focus:outline-blue-600"
              />
            </div>

            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 text-center">
              <span className="text-xs uppercase text-slate-400 font-bold block">Required Target GPA</span>
              <span
                className={`text-3xl sm:text-4xl font-black ${
                  parseFloat(requiredTargetGPA()) > 4.0
                    ? "text-rose-600"
                    : parseFloat(requiredTargetGPA()) <= 0
                    ? "text-blue-600"
                    : "text-emerald-600"
                }`}
              >
                {requiredTargetGPA()}
              </span>
              <span className="text-[11px] text-slate-500 block mt-1">
                {parseFloat(requiredTargetGPA()) > 4.0
                  ? "Mathematically unachievable within entered credits"
                  : "Target is achievable"}
              </span>
            </div>
          </div>
        </section>

        {/* 7. Official NUML Grades Reference Table */}
        <section id="grading-table" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Official NUML Grading System & Rules</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Standardized examination grading scale based on marks-to-grade point linear interpolation.
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold uppercase tracking-wider text-xs">
                  <th className="py-3.5 px-4 rounded-l-xl">Grades</th>
                  <th className="py-3.5 px-4">Marks Range</th>
                  <th className="py-3.5 px-4">Grade Points (GP)</th>
                  <th className="py-3.5 px-4 rounded-r-xl">Academic Zone</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">A+</td>
                  <td className="py-3 px-4">90 and above</td>
                  <td className="py-3 px-4 font-semibold">4.00</td>
                  <td className="py-3 px-4 font-bold text-emerald-700" rowSpan={6}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs">
                      ● Safe Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">A</td>
                  <td className="py-3 px-4">80 – 89</td>
                  <td className="py-3 px-4 font-semibold">4.00</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">B+</td>
                  <td className="py-3 px-4">75 – 79</td>
                  <td className="py-3 px-4 font-semibold">3.50 – 3.90</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">B</td>
                  <td className="py-3 px-4">70 – 74</td>
                  <td className="py-3 px-4 font-semibold">3.00 – 3.40</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">C+</td>
                  <td className="py-3 px-4">65 – 69</td>
                  <td className="py-3 px-4 font-semibold">2.50 – 2.90</td>
                </tr>
                <tr className="bg-emerald-50/40 hover:bg-emerald-50/60 transition">
                  <td className="py-3 px-4 font-bold text-emerald-800">C</td>
                  <td className="py-3 px-4">60 – 64</td>
                  <td className="py-3 px-4 font-semibold">2.00 – 2.40</td>
                </tr>

                <tr className="bg-slate-100/60 hover:bg-slate-100 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">D+</td>
                  <td className="py-3 px-4">55 – 59</td>
                  <td className="py-3 px-4 font-semibold">1.50 – 1.90</td>
                  <td className="py-3 px-4 font-bold text-slate-700" rowSpan={2}>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-200 text-slate-800 text-xs">
                      ● Grey Zone
                    </span>
                  </td>
                </tr>
                <tr className="bg-slate-100/60 hover:bg-slate-100 transition">
                  <td className="py-3 px-4 font-bold text-slate-800">D</td>
                  <td className="py-3 px-4">50 – 54</td>
                  <td className="py-3 px-4 font-semibold">1.00 – 1.40</td>
                </tr>

                <tr className="bg-rose-50/60 hover:bg-rose-50 transition">
                  <td className="py-3 px-4 font-bold text-rose-700">F</td>
                  <td className="py-3 px-4 font-medium text-rose-800">Below 50</td>
                  <td className="py-3 px-4 font-bold text-rose-700">0.00</td>
                  <td className="py-3 px-4 font-bold text-rose-700">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 text-xs">
                      ● Danger Zone
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 8. Frequently Asked Questions (FAQ) */}
        <section id="faq" className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Frequently Asked Questions</h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Everything you need to know about academic policies and computations.
            </p>
          </div>

          <div className="space-y-3">
            {FAQS.map((faq, idx) => (
              <div
                key={idx}
                className="border border-slate-200/80 rounded-xl overflow-hidden transition"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-4 text-left font-semibold text-sm text-slate-800 bg-slate-50/50 hover:bg-slate-50 transition"
                >
                  <span>{faq.q}</span>
                  <span className="text-slate-400 font-bold ml-2">
                    {openFaq === idx ? "−" : "+"}
                  </span>
                </button>
                {openFaq === idx && (
                  <div className="p-4 text-xs sm:text-sm text-slate-600 bg-white border-t border-slate-100 leading-relaxed">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>

      {/* 9. Production Website Footer */}
      <footer className="mt-auto bg-white border-t border-slate-200/80 py-8 px-4 sm:px-6 lg:px-8 text-center text-xs text-slate-500 space-y-2">
        <p className="font-semibold text-slate-700">
          NUML GPA Studio — Open Source Academic Tool
        </p>
        <p className="text-slate-400">
          Crafted by NUML Batch Fall 2023
        </p>
      </footer>

    </div>
  );
}