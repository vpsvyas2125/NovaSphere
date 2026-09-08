import { useEffect, useState } from 'react'
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  BookOpen,
  ShieldAlert,
  CalendarCheck,
  Megaphone,
  Users,
  Settings,
  LogOut,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

import MyClass from './MyClass.jsx'
import Attendance from './Attendance.jsx'
import Marks from './Marks.jsx'
import RiskMonitor from './RiskMonitor'
import Announcements from './Announcements'
import CoordinatorSettings from './Settings.jsx'
import Analytics from './Analytics.jsx'

export default function CoordinatorDashboard() {
  const { profile, signOut } = useAuth()

  const [showMyClass, setShowMyClass] = useState(false)
  const [showAttendance, setShowAttendance] = useState(false)
  const [showMarks, setShowMarks] = useState(false)
  const [showRiskMonitor, setShowRiskMonitor] = useState(false)
  const [showAnnouncements, setShowAnnouncements] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [showAnalytics, setShowAnalytics] = useState(false)

  // Dashboard statistics
  const [stats, setStats] = useState({
    students: 0,
    attendance: 0,
    classAverage: 0,
    studentsAtRisk: 0,
  })

  const [statsLoading, setStatsLoading] = useState(true)

  // Load coordinator dashboard statistics
  useEffect(() => {
    if (profile?.id) {
      loadDashboardStats()
    }
  }, [profile?.id])

  async function loadDashboardStats() {
    try {
      setStatsLoading(true)

      if (!profile?.id) {
        return
      }

      // -----------------------------------------
      // 1. Get coordinator's classes
      // -----------------------------------------
      const { data: classes, error: classesError } =
        await supabase
          .from('classes')
          .select('id')
          .eq('coordinator_id', profile.id)

      if (classesError) {
        throw classesError
      }

      if (!classes || classes.length === 0) {
        setStats({
          students: 0,
          attendance: 0,
          classAverage: 0,
          studentsAtRisk: 0,
        })

        return
      }

      const classIds = classes.map((item) => item.id)

      // -----------------------------------------
      // 2. Get students in coordinator's classes
      // -----------------------------------------
      const { data: students, error: studentsError } =
        await supabase
          .from('students')
          .select('id, profile_id, class_id')
          .in('class_id', classIds)

      if (studentsError) {
        throw studentsError
      }

      const studentRows = students || []

      const studentCount = studentRows.length

      if (studentCount === 0) {
        setStats({
          students: 0,
          attendance: 0,
          classAverage: 0,
          studentsAtRisk: 0,
        })

        return
      }

      const studentIds = studentRows.map(
        (student) => student.id
      )

      // -----------------------------------------
      // 3. Get attendance
      // -----------------------------------------
      const { data: attendance, error: attendanceError } =
        await supabase
          .from('attendance')
          .select(
            'student_id, status'
          )
          .in('student_id', studentIds)

      if (attendanceError) {
        throw attendanceError
      }

      const attendanceRows = attendance || []

      // -----------------------------------------
      // 4. Get marks
      // -----------------------------------------
      const { data: marks, error: marksError } =
        await supabase
          .from('marks')
          .select(
            'student_id, marks_obtained, maximum_marks'
          )
          .in('student_id', studentIds)

      if (marksError) {
        throw marksError
      }

      const marksRows = marks || []

      // -----------------------------------------
      // 5. Calculate overall attendance
      // -----------------------------------------
      let totalPresent = 0
      let totalAttendanceRecords = 0

      attendanceRows.forEach((row) => {
        totalAttendanceRecords += 1

        if (row.status === 'present') {
          totalPresent += 1
        }
      })

      const overallAttendance =
        totalAttendanceRecords > 0
          ? Math.round(
              (totalPresent /
                totalAttendanceRecords) *
                100
            )
          : 0

      // -----------------------------------------
      // 6. Calculate class average
      // -----------------------------------------
      let totalObtained = 0
      let totalMaximum = 0

      marksRows.forEach((row) => {
        const obtained = Number(
          row.marks_obtained ?? 0
        )

        const maximum = Number(
          row.maximum_marks ?? 0
        )

        if (maximum > 0) {
          totalObtained += obtained
          totalMaximum += maximum
        }
      })

      const classAverage =
        totalMaximum > 0
          ? Math.round(
              (totalObtained /
                totalMaximum) *
                100
            )
          : 0

      // -----------------------------------------
      // 7. Calculate students at risk
      // -----------------------------------------
      let studentsAtRisk = 0

      studentRows.forEach((student) => {
        const studentAttendance =
          attendanceRows.filter(
            (row) =>
              row.student_id === student.id
          )

        const studentMarks =
          marksRows.filter(
            (row) =>
              row.student_id === student.id
          )

        // No data = don't falsely classify as risk
        if (
          studentAttendance.length === 0 &&
          studentMarks.length === 0
        ) {
          return
        }

        // Attendance
        let attendancePercentage = null

        if (studentAttendance.length > 0) {
          const presentCount =
            studentAttendance.filter(
              (row) =>
                row.status === 'present'
            ).length

          attendancePercentage = Math.round(
            (presentCount /
              studentAttendance.length) *
              100
          )
        }

        // Marks
        let marksPercentage = null

        if (studentMarks.length > 0) {
          let obtained = 0
          let maximum = 0

          studentMarks.forEach((row) => {
            const rowObtained = Number(
              row.marks_obtained ?? 0
            )

            const rowMaximum = Number(
              row.maximum_marks ?? 0
            )

            if (rowMaximum > 0) {
              obtained += rowObtained
              maximum += rowMaximum
            }
          })

          if (maximum > 0) {
            marksPercentage = Math.round(
              (obtained / maximum) * 100
            )
          }
        }

        // Same high-risk logic used in Risk Monitor
        const highRisk =
          (attendancePercentage !== null &&
            attendancePercentage < 75) ||
          (marksPercentage !== null &&
            marksPercentage < 50)

        if (highRisk) {
          studentsAtRisk += 1
        }
      })

      setStats({
        students: studentCount,
        attendance: overallAttendance,
        classAverage,
        studentsAtRisk,
      })
    } catch (error) {
      console.error(
        'Coordinator dashboard statistics error:',
        error
      )

      setStats({
        students: 0,
        attendance: 0,
        classAverage: 0,
        studentsAtRisk: 0,
      })
    } finally {
      setStatsLoading(false)
    }
  }

  // Logout
  async function handleLogout() {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  // Open My Class page
  if (showMyClass) {
    return (
      <MyClass
        onBack={() => setShowMyClass(false)}
      />
    )
  }

  if (showAttendance) {
    return (
      <Attendance
        onBack={() => setShowAttendance(false)}
      />
    )
  }

  if (showMarks) {
    return (
      <Marks
        onBack={() => setShowMarks(false)}
      />
    )
  }

  if (showRiskMonitor) {
    return (
      <RiskMonitor
        onBack={() => setShowRiskMonitor(false)}
      />
    )
  }

  if (showAnnouncements) {
    return (
      <Announcements
        onBack={() => setShowAnnouncements(false)}
      />
    )
  }

  if (showSettings) {
    return (
      <CoordinatorSettings
        onBack={() => setShowSettings(false)}
      />
    )
  }

  if (showAnalytics) {
  return (
    <Analytics
      onBack={() => setShowAnalytics(false)}
    />
  )
}


  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">

          {/* NOVASPHERE BRANDING */}
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
                Nova
                <span className="text-violet-400">
                  Sphere
                </span>
              </div>

              <div className="text-[9px] font-medium tracking-[0.22em] text-cyan-400">
                LEARN • GROW • ACHIEVE
              </div>
            </div>

          </div>

          {/* HEADER ACTIONS */}
          <div className="flex items-center gap-2">

            {/* SETTINGS */}
            <button
              type="button"
              onClick={() => setShowSettings(true)}
              title="Settings"
              aria-label="Settings"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <Settings size={19} />
            </button>

            {/* LOGOUT */}
            <button
              type="button"
              onClick={handleLogout}
              title="Logout"
              aria-label="Logout"
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10 text-rose-300 transition hover:bg-rose-500/20"
            >
              <LogOut size={19} />
            </button>

          </div>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

        {/* PAGE INTRO */}
        <section className="mb-8">

          <p className="text-sm font-medium text-cyan-300">
            Coordinator overview
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Class Command Center
          </h1>

          <p className="mt-2 text-slate-400">
            Monitor your class, attendance, marks and academic health.
          </p>

        </section>

        {/* STATS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* Students */}
          <div className="nova-card rounded-2xl p-5">

            <Users className="mb-4 h-6 w-6 text-violet-400" />

            <p className="text-sm text-slate-400">
              Students
            </p>

            <p className="mt-1 text-3xl font-bold">
              {statsLoading
                ? '...'
                : stats.students}
            </p>

          </div>

          {/* Attendance */}
          <div className="nova-card rounded-2xl p-5">

            <CalendarCheck className="mb-4 h-6 w-6 text-emerald-400" />

            <p className="text-sm text-slate-400">
              Attendance
            </p>

            <p className="mt-1 text-3xl font-bold">
              {statsLoading
                ? '...'
                : `${stats.attendance}%`}
            </p>

          </div>

          {/* Class Average */}
          <div className="nova-card rounded-2xl p-5">

            <BarChart3 className="mb-4 h-6 w-6 text-cyan-400" />

            <p className="text-sm text-slate-400">
              Class Average
            </p>

            <p className="mt-1 text-3xl font-bold">
              {statsLoading
                ? '...'
                : `${stats.classAverage}%`}
            </p>

          </div>

          {/* Students At Risk */}
          <div className="nova-card rounded-2xl p-5">

            <AlertTriangle className="mb-4 h-6 w-6 text-amber-400" />

            <p className="text-sm text-slate-400">
              Students at Risk
            </p>

            <p className="mt-1 text-3xl font-bold">
              {statsLoading
                ? '...'
                : stats.studentsAtRisk}
            </p>

          </div>

        </section>

        {/* MANAGEMENT */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">

          {/* MY CLASS */}
          <button
            type="button"
            onClick={() => setShowMyClass(true)}
            className="nova-card nova-card-hover w-full rounded-3xl p-6 text-left"
          >

            <Users className="mb-5 h-7 w-7 text-violet-400" />

            <h2 className="text-lg font-semibold">
              My Class
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              View students, profiles and class information.
            </p>

            <div className="mt-5 flex items-center gap-2 text-sm font-medium text-violet-300">
              Open My Class

              <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
            </div>

          </button>

          {/* ATTENDANCE */}
          <button
            type="button"
            onClick={() => setShowAttendance(true)}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
          >

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10">
              <CalendarCheck className="h-6 w-6 text-cyan-400" />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Attendance
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Mark and manage attendance for your students.
            </p>

            <div className="mt-4 text-sm font-medium text-cyan-400">
              Manage Attendance →
            </div>

          </button>

          {/* MARKS */}
          <button
            type="button"
            onClick={() => setShowMarks(true)}
            className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-violet-400/30 hover:bg-white/[0.06]"
          >

            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-violet-400/10">
              <BookOpen className="h-6 w-6 text-violet-400" />
            </div>

            <h3 className="text-lg font-semibold text-white">
              Marks
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Enter and manage academic marks for your students.
            </p>

            <div className="mt-4 text-sm font-medium text-violet-400">
              Manage Marks →
            </div>

          </button>

          {/* ANALYTICS */}
<button
  type="button"
  onClick={() => setShowAnalytics(true)}
  className="group rounded-2xl border border-white/10 bg-white/[0.03] p-6 text-left transition hover:border-cyan-400/30 hover:bg-white/[0.06]"
>
  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-400/10">
    <BarChart3 className="h-6 w-6 text-cyan-400" />
  </div>

  <h3 className="text-lg font-semibold text-white">
    Analytics
  </h3>

  <p className="mt-2 text-sm leading-6 text-slate-400">
    Analyze class performance, attendance and academic risk.
  </p>

  <div className="mt-4 text-sm font-medium text-cyan-400">
    View Analytics →
  </div>
</button>


          {/* RISK MONITOR */}
          <button
            type="button"
            onClick={() => setShowRiskMonitor(true)}
            className="group rounded-2xl border border-white/10 bg-[#0d1328] p-6 text-left transition hover:-translate-y-1 hover:border-rose-400/30 hover:bg-[#111936]"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10">
                <ShieldAlert className="h-6 w-6 text-rose-300" />
              </div>

              <ArrowRight className="h-5 w-5 text-slate-600 transition group-hover:translate-x-1 group-hover:text-rose-300" />

            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              Risk Monitor
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Identify students who may need academic support
              using attendance and marks insights.
            </p>

            <div className="mt-5 flex items-center gap-2 text-xs font-medium text-rose-300">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Academic Risk Detection
            </div>

          </button>

          {/* ANNOUNCEMENTS */}
          <button
            type="button"
            onClick={() => setShowAnnouncements(true)}
            className="group rounded-2xl border border-white/10 bg-[#0d1328] p-5 text-left transition hover:-translate-y-1 hover:border-violet-400/30 hover:bg-[#111936]"
          >

            <div className="flex items-start justify-between">

              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <Megaphone size={22} />
              </div>

              <ArrowRight
                size={18}
                className="text-slate-600 transition group-hover:translate-x-1 group-hover:text-violet-300"
              />

            </div>

            <h3 className="mt-5 text-lg font-semibold text-white">
              Announcements
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Publish important updates and notices for your students.
            </p>

          </button>

        </section>

      </main>

    </div>
  )
}