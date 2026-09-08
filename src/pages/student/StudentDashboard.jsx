import { useState } from 'react'
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CalendarCheck,
  CheckCircle2,
  FileText,
  GraduationCap,
  LogOut,
  Megaphone,
  Sparkles,
  Target,
  TrendingUp,
  AlertTriangle,
  Loader2,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { useAuth } from '../../contexts/AuthContext'
import { useStudentAcademicData } from '../../hooks/useStudentAcademicData'
import JoinClass from './JoinClass.jsx'
import CampusPulse from './CampusPulse.jsx'
import NovaAI from './NovaAI.jsx'
import NovaDocs from './NovaDocs.jsx'
import NovaQuiz from './NovaQuiz.jsx'
import NovaPlan from './NovaPlan.jsx'
import Settings from './Settings.jsx'

function calculateAttendance(attendanceRows) {
  if (!attendanceRows.length) return 0

  const present = attendanceRows.filter(
    (item) => item.status === 'present'
  ).length

  return Math.round((present / attendanceRows.length) * 100)
}

function calculateSubjectAttendance(subjectId, attendanceRows) {
  const rows = attendanceRows.filter(
    (item) => item.subject_id === subjectId
  )

  if (!rows.length) return 0

  const present = rows.filter(
    (item) => item.status === 'present'
  ).length

  return Math.round((present / rows.length) * 100)
}

function calculateSubjectAverage(subjectId, marksRows) {
  const rows = marksRows.filter(
    (item) => item.subject_id === subjectId
  )

  if (!rows.length) return 0

  let totalObtained = 0
  let totalMaximum = 0

  rows.forEach((item) => {
    const obtained = Number(item.marks_obtained ?? 0)
    const maximum = Number(item.maximum_marks ?? 100)

    if (maximum > 0) {
      totalObtained += obtained
      totalMaximum += maximum
    }
  })

  if (totalMaximum === 0) return 0

  return Math.round(
    (totalObtained / totalMaximum) * 100
  )
}

function getSubjectStatus(attendance, average) {
  if (attendance < 75 || average < 50) {
    return {
      label: 'Needs attention',
      color: 'text-rose-300',
      dot: 'bg-rose-400',
    }
  }

  if (attendance < 85 || average < 65) {
    return {
      label: 'Keep improving',
      color: 'text-amber-300',
      dot: 'bg-amber-400',
    }
  }

  return {
    label: 'On track',
    color: 'text-emerald-300',
    dot: 'bg-emerald-400',
  }
}

function getInitials(name) {
  if (!name) return 'S'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
}

export default function StudentDashboard() {
  const { profile, signOut } = useAuth()

  const [showJoinClass, setShowJoinClass] = useState(false)
  const [showRiskInsights, setShowRiskInsights] = useState(false)
  const [showCampusPulse, setShowCampusPulse] = useState(false)
  const [showNovaAI, setShowNovaAI] = useState(false)
  const [showNovaDocs, setShowNovaDocs] = useState(false)
  const [showNovaQuiz, setShowNovaQuiz] = useState(false)
  const [showNovaPlan, setShowNovaPlan] = useState(false)
  const [showSettings, setShowSettings] = useState(false)

  const {
    subjects,
    attendance,
    marks,
    loading,
    error,
    refresh,
  } = useStudentAcademicData()

  const overallAttendance = calculateAttendance(attendance)

  const subjectsWithMarks = subjects.filter((subject) =>
    marks.some(
      (mark) => mark.subject_id === subject.id
    )
  )

  const overallAverage = subjectsWithMarks.length
    ? Math.round(
        subjectsWithMarks.reduce(
          (sum, subject) =>
            sum +
            calculateSubjectAverage(
              subject.id,
              marks
            ),
          0
        ) / subjectsWithMarks.length
      )
    : 0

  const riskSubjects = subjects.filter((subject) => {
    const subjectAttendanceRows = attendance.filter(
      (item) => item.subject_id === subject.id
    )

    const subjectMarksRows = marks.filter(
      (item) => item.subject_id === subject.id
    )

    // No academic data yet = don't classify as at risk
    if (
      subjectAttendanceRows.length === 0 &&
      subjectMarksRows.length === 0
    ) {
      return false
    }

    const hasAttendance =
      subjectAttendanceRows.length > 0

    const hasMarks =
      subjectMarksRows.length > 0

    const subjectAttendance = hasAttendance
      ? calculateSubjectAttendance(
          subject.id,
          attendance
        )
      : null

    const subjectAverage = hasMarks
      ? calculateSubjectAverage(
          subject.id,
          marks
        )
      : null

    const lowAttendance =
      hasAttendance && subjectAttendance < 75

    const lowPerformance =
      hasMarks && subjectAverage < 50

    return lowAttendance || lowPerformance
  })

  const academicRisk =
    riskSubjects.length === 0
      ? 'Low'
      : riskSubjects.length <= 2
        ? 'Moderate'
        : 'High'

  const riskColor =
    academicRisk === 'Low'
      ? 'text-emerald-300'
      : academicRisk === 'Moderate'
        ? 'text-amber-300'
        : 'text-rose-300'

  const displayName =
    profile?.full_name ||
    profile?.email?.split('@')[0] ||
    'Student'

  /*
   * -----------------------------
   * JOIN CLASS PAGE
   * -----------------------------
   */
  if (showJoinClass) {
    return (
      <JoinClass
        onBack={() => setShowJoinClass(false)}
        onJoined={() => setShowJoinClass(false)}
      />
    )
  }

  /*
   * -----------------------------
   * CAMPUS PULSE PAGE
   * -----------------------------
   */
  if (showCampusPulse) {
    return (
      <CampusPulse
        onBack={() => setShowCampusPulse(false)}
      />
    )
  }

  if (showNovaAI) {
  return (
    <NovaAI
      onBack={() => setShowNovaAI(false)}
    />
  )
}

  /*
   * -----------------------------
   * SMART RISK INSIGHTS PAGE
   * -----------------------------
   */
  if (showRiskInsights) {
    return (
      <main className="min-h-screen bg-[#070b1a] text-white">
        <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center px-6 lg:px-10">
            <div className="flex h-16 w-32 shrink-0 items-center">
              <img
                src={logo}
                alt="NovaSphere"
                className="max-h-14 w-full object-contain object-left"
              />
            </div>
          </div>
        </header>

        <div className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
          <button
            type="button"
            onClick={() => setShowRiskInsights(false)}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </button>

          <section className="mb-8">
            <div className="mb-3 flex items-center gap-2 text-sm font-medium text-amber-300">
              <AlertTriangle className="h-4 w-4" />
              SMART RISK INSIGHTS
            </div>

            <h1 className="text-4xl font-bold tracking-tight">
              Understand your academic risk
            </h1>

            <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
              NovaSphere analyzes your attendance and
              academic performance to identify subjects
              that may need attention.
            </p>
          </section>

          {riskSubjects.length === 0 ? (
            <div className="nova-card rounded-3xl p-8 text-center">
              <CheckCircle2 className="mx-auto h-12 w-12 text-emerald-300" />

              <h2 className="mt-5 text-2xl font-bold">
                You're on track
              </h2>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-400">
                Your current attendance and performance
                indicators look healthy. Keep maintaining
                your momentum.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {riskSubjects.map((subject) => {
                const subjectAttendance =
                  calculateSubjectAttendance(
                    subject.id,
                    attendance
                  )

                const subjectAverage =
                  calculateSubjectAverage(
                    subject.id,
                    marks
                  )

                const lowAttendance =
                  subjectAttendance < 75

                const lowPerformance =
                  subjectAverage < 50

                return (
                  <div
                    key={subject.id}
                    className="nova-card rounded-3xl p-6"
                  >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-400/10">
                            <AlertTriangle className="h-5 w-5 text-rose-300" />
                          </div>

                          <div>
                            <h2 className="text-lg font-semibold">
                              {subject.name}
                            </h2>

                            <p className="mt-1 text-sm text-rose-300">
                              Needs attention
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-slate-500">
                            Attendance
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {subjectAttendance}%
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-slate-500">
                            Performance
                          </p>

                          <p className="mt-1 text-xl font-bold">
                            {subjectAverage}%
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 border-t border-white/10 pt-5">
                      <p className="text-sm font-semibold text-white">
                        Why this subject is flagged
                      </p>

                      <div className="mt-3 space-y-2 text-sm text-slate-400">
                        {lowAttendance && (
                          <p>
                            • Attendance is below the recommended
                            75% level.
                          </p>
                        )}

                        {lowPerformance && (
                          <p>
                            • Academic performance is below the
                            50% target.
                          </p>
                        )}
                      </div>

                      <div className="mt-5 rounded-2xl border border-violet-400/10 bg-violet-400/[0.04] p-4">
                        <p className="text-sm font-semibold text-violet-200">
                          Recommended action
                        </p>

                        <p className="mt-1 text-sm leading-6 text-slate-400">
                          Prioritize this subject in your study
                          plan, attend upcoming classes regularly,
                          and revise the topics where your
                          performance is weakest.
                        </p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    )
  }

  if (showNovaDocs) {
  return (
    <NovaDocs
      onBack={() => setShowNovaDocs(false)}
    />
  )
}

if (showNovaQuiz) {
  return (
    <NovaQuiz
      onBack={() => setShowNovaQuiz(false)}
    />
  )
}

if (showNovaPlan) {
  return (
    <NovaPlan
      onBack={() => setShowNovaPlan(false)}
    />
  )
}

if (showSettings) {
  return (
    <Settings
      onBack={() => setShowSettings(false)}
    />
  )
}

  /*
   * -----------------------------
   * MAIN STUDENT DASHBOARD
   * -----------------------------
   */
  return (
    <main className="min-h-screen bg-[#070b1a] text-white">

      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">

          {/* Logo */}
          <div className="flex items-center gap-3">
  <div className="flex h-14 w-14 shrink-0 items-center">
    <img
      src={logo}
      alt="NovaSphere"
      className="max-h-12 w-full object-contain object-left"
    />
  </div>

  <div className="hidden sm:block">
    <div className="text-xl font-bold tracking-tight text-white">
      Nova<span className="text-violet-400">Sphere</span>
    </div>

    <div className="text-[9px] font-medium tracking-[0.22em] text-cyan-400">
      LEARN • GROW • ACHIEVE
    </div>
  </div>
</div>

          {/* Profile */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {displayName}
              </p>

              <p className="text-xs text-slate-500">
                Student
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              {getInitials(displayName)}
            </div>

<button
  type="button"
  onClick={() => setShowSettings(true)}
  className="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
>
  ⚙️
</button>

            <button
              type="button"
              onClick={signOut}
              title="Sign out"
              className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-slate-400 transition hover:bg-white/[0.07] hover:text-white"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">

        {/* WELCOME */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Sparkles className="h-4 w-4" />
            Your academic universe
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Good to see you,{' '}
            <span className="nova-text-gradient">
              {displayName}.
            </span>
          </h1>

          <p className="mt-3 text-base text-slate-400">
            Here's how your academic universe is looking today.
          </p>
        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 flex items-center justify-between gap-4 rounded-2xl border border-rose-400/20 bg-rose-400/10 px-5 py-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-rose-300" />

              <div>
                <p className="text-sm font-medium text-rose-200">
                  Unable to load academic data
                </p>

                <p className="mt-1 text-xs text-rose-300/70">
                  {error}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refresh}
              className="rounded-lg bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-400/20"
            >
              Retry
            </button>
          </div>
        )}

        {/* TODAY'S MISSION */}
        <section className="nova-gradient mb-8 overflow-hidden rounded-3xl p-7 shadow-2xl shadow-violet-950/20 sm:p-8">
          <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white/80">
                <Target className="h-5 w-5" />
                TODAY'S MISSION
              </div>

              <h2 className="text-2xl font-bold sm:text-3xl">
                Keep your momentum going.
              </h2>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/70">
                Complete today's planned study tasks and
                stay on track with your academic goals.
              </p>
            </div>

            <button
  type="button"
  onClick={() => setShowNovaPlan(true)}
  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-4 text-sm font-medium text-violet-600 transition hover:bg-slate-100"
>
  View NovaPlan
  <ArrowRight size={18} />
</button>
          </div>
        </section>

        {/* STATS */}
        <section className="mb-10 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

          {/* Attendance */}
          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-cyan-400/10 p-3">
                <CalendarCheck className="h-5 w-5 text-cyan-300" />
              </div>

              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              )}
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Attendance
            </p>

            <p className="mt-1 text-3xl font-bold">
              {overallAttendance}%
            </p>
          </div>

          {/* Academic Average */}
          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-violet-400/10 p-3">
                <TrendingUp className="h-5 w-5 text-violet-300" />
              </div>

              {loading && (
                <Loader2 className="h-4 w-4 animate-spin text-slate-600" />
              )}
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Academic Average
            </p>

            <p className="mt-1 text-3xl font-bold">
              {overallAverage}%
            </p>
          </div>

          {/* Subjects */}
          <div className="nova-card rounded-2xl p-5">
            <div className="rounded-xl bg-blue-400/10 p-3 w-fit">
              <BookOpen className="h-5 w-5 text-blue-300" />
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Subjects
            </p>

            <p className="mt-1 text-3xl font-bold">
              {subjects.length}
            </p>
          </div>

          {/* Academic Risk */}
          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <div className="rounded-xl bg-emerald-400/10 p-3">
                <Activity className="h-5 w-5 text-emerald-300" />
              </div>
            </div>

            <p className="mt-5 text-sm text-slate-500">
              Academic Risk
            </p>

            <p className={`mt-1 text-3xl font-bold ${riskColor}`}>
              {academicRisk}
            </p>
          </div>

        </section>

        {/* ACADEMIC ORBIT */}
        <section className="mb-10">

          <div className="mb-5 flex items-end justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2">
                <GraduationCap className="h-5 w-5 text-violet-300" />

                <p className="text-sm font-medium text-violet-300">
                  ACADEMIC ORBIT
                </p>
              </div>

              <h2 className="text-2xl font-bold">
                Your subjects
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Track the health of every subject.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="nova-card flex min-h-48 items-center justify-center rounded-2xl">
              <div className="text-center">
                <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-400" />

                <p className="mt-3 text-sm text-slate-500">
                  Loading your academic orbit...
                </p>
              </div>
            </div>
          ) : subjects.length === 0 ? (
            <div className="nova-card rounded-2xl p-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-slate-600" />

              <h3 className="mt-4 text-lg font-semibold">
                Your orbit is waiting
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                No subjects have been assigned to your class yet.
                Once your coordinator adds them, they'll appear here.
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">

              {subjects.map((subject) => {
                const subjectAttendance =
                  calculateSubjectAttendance(
                    subject.id,
                    attendance
                  )

                const subjectAverage =
                  calculateSubjectAverage(
                    subject.id,
                    marks
                  )

                const status = getSubjectStatus(
                  subjectAttendance,
                  subjectAverage
                )

                return (
                  <div
                    key={subject.id}
                    className="nova-card nova-card-hover rounded-2xl p-5"
                  >
                    <div className="flex items-start justify-between gap-4">

                      <div className="flex items-start gap-4">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/10">
                          <BookOpen className="h-5 w-5 text-violet-300" />
                        </div>

                        <div>
                          <h3 className="font-semibold text-white">
                            {subject.name}
                          </h3>

                          <div className="mt-1 flex items-center gap-2">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />

                            <span
                              className={`text-xs ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <p className="text-2xl font-bold">
                          {subjectAverage}%
                        </p>

                        <p className="text-[11px] text-slate-600">
                          average
                        </p>
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-4">

                      {/* Attendance */}
                      <div>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-500">
                            Attendance
                          </span>

                          <span className="font-medium text-slate-300">
                            {subjectAttendance}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-cyan-400 transition-all duration-500"
                            style={{
                              width: `${subjectAttendance}%`,
                            }}
                          />
                        </div>
                      </div>

                      {/* Performance */}
                      <div>
                        <div className="mb-2 flex justify-between text-xs">
                          <span className="text-slate-500">
                            Performance
                          </span>

                          <span className="font-medium text-slate-300">
                            {subjectAverage}%
                          </span>
                        </div>

                        <div className="h-2 overflow-hidden rounded-full bg-white/5">
                          <div
                            className="h-full rounded-full bg-violet-400 transition-all duration-500"
                            style={{
                              width: `${subjectAverage}%`,
                            }}
                          />
                        </div>
                      </div>

                    </div>
                  </div>
                )
              })}

            </div>
          )}
        </section>

        {/* SMART RISK DETECTION */}
        <section className="mb-10">

          <div className="nova-card rounded-2xl p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-start gap-4">
                <div className="rounded-xl bg-amber-400/10 p-3">
                  <AlertTriangle className="h-5 w-5 text-amber-300" />
                </div>

                <div>
                  <p className="text-sm font-semibold text-white">
                    Smart Risk Detection
                  </p>

                  <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-500">
                    {riskSubjects.length === 0
                      ? 'Your current academic indicators look healthy. Keep your momentum going.'
                      : `${riskSubjects.length} subject${riskSubjects.length > 1 ? 's' : ''} need${riskSubjects.length === 1 ? 's' : ''} your attention. NovaSphere will help you create a recovery plan.`}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowRiskInsights(true)}
                className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              >
                View insights
                <ArrowRight className="h-4 w-4" />
              </button>

            </div>
          </div>

        </section>

        {/* QUICK ACTIONS */}
        <section>

          <div className="mb-5">
            <p className="text-sm font-medium text-cyan-300">
              QUICK ACTIONS
            </p>

            <h2 className="mt-1 text-2xl font-bold">
              Continue learning
            </h2>
          </div>

          {/* 
            IMPORTANT:
            ALL QUICK ACTION CARDS ARE INSIDE THE SAME GRID.
            This keeps their width and height consistent.
          */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">

            {/* NOVA AI */}
            <button
              type="button"
              onClick={() => setShowNovaAI(true)}
              className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition"
            >
              <div className="rounded-xl bg-violet-400/10 p-3 w-fit">
                <Sparkles className="h-5 w-5 text-violet-300" />
              </div>

              <h3 className="mt-5 font-semibold">
                Nova AI
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Ask questions, understand concepts and study
                smarter with your AI assistant.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-violet-300">
                Open Nova AI
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* NOVADOCS */}
            <button
              type="button"
              onClick={() => setShowNovaDocs(true)}
              className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition"
            >
              <div className="rounded-xl bg-blue-400/10 p-3 w-fit">
                <FileText className="h-5 w-5 text-blue-300" />
              </div>

              <h3 className="mt-5 font-semibold">
                NovaDocs
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Upload notes and PDFs to create smart summaries
                and ask questions from your documents.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-blue-300">
                Open NovaDocs
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            <button
  type="button"
  onClick={() => setShowNovaQuiz(true)}
  className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition"
>
  <div className="flex h-full flex-col">
    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
      <Sparkles size={23} />
    </div>

    <div className="mt-6">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-violet-300">
        Practice
      </p>

      <h3 className="mt-2 text-xl font-bold text-white">
        NovaQuiz
      </h3>

      <p className="mt-3 text-sm leading-6 text-slate-400">
        Test your knowledge with AI-powered quizzes,
        instant feedback, and performance tracking.
      </p>
    </div>

    <div className="mt-auto pt-6">
      <div className="flex items-center gap-2 text-sm font-semibold text-violet-300">
        Start a Quiz
        <ArrowRight size={16} />
      </div>
    </div>
  </div>
</button>

            {/* NOVAPLAN */}
            <button
              type="button"
               onClick={() => setShowNovaPlan(true)}
              className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition"
            >
              <div className="rounded-xl bg-cyan-400/10 p-3 w-fit">
                <Target className="h-5 w-5 text-cyan-300" />
              </div>

              <h3 className="mt-5 font-semibold">
                NovaPlan
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Build a personalized study plan around your
                classes, goals and academic priorities.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-cyan-300">
                Open NovaPlan
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* JOIN A CLASS */}
            <button
              type="button"
              onClick={() => setShowJoinClass(true)}
              className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition hover:border-violet-400/30"
            >
              <div className="rounded-xl bg-violet-400/10 p-3 w-fit">
                <GraduationCap className="h-5 w-5 text-violet-300" />
              </div>

              <h3 className="mt-5 font-semibold">
                Join a Class
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Connect your account to your class using the
                code from your coordinator.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-violet-300">
                Enter Class Code
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            {/* CAMPUS PULSE */}
            <button
              type="button"
              onClick={() => setShowCampusPulse(true)}
              className="nova-card nova-card-hover min-h-[280px] rounded-2xl p-6 text-left transition hover:border-cyan-400/30"
            >
              <div className="rounded-xl bg-cyan-400/10 p-3 w-fit">
                <Megaphone className="h-5 w-5 text-cyan-300" />
              </div>

              <h3 className="mt-5 font-semibold">
                Campus Pulse
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                Stay updated with important announcements and
                class notices from your coordinator.
              </p>

              <div className="mt-5 flex items-center gap-2 text-sm font-medium text-cyan-300">
                Open Campus Pulse
                <ArrowRight className="h-4 w-4" />
              </div>
            </button>

            

          </div>
        </section>

      </div>
    </main>
  )
}