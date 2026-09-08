import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BarChart3,
  BookOpen,
  CalendarCheck,
  Loader2,
  ShieldAlert,
  TrendingUp,
  Users,
  RefreshCw,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { useAuth } from '../../contexts/AuthContext'
import { supabase } from '../../lib/supabase'

export default function Analytics({ onBack }) {
  const { profile } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const [students, setStudents] = useState([])
  const [subjects, setSubjects] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])

  const [stats, setStats] = useState({
    students: 0,
    attendance: 0,
    performance: 0,
    risk: 0,
  })

  useEffect(() => {
    if (profile?.id) {
      loadAnalytics()
    }
  }, [profile?.id])

  async function loadAnalytics() {
    try {
      setLoading(true)
      setError('')

      if (!profile?.id) {
        setLoading(false)
        return
      }

      // -----------------------------------------
      // GET COORDINATOR CLASSES
      // -----------------------------------------

      const {
        data: classes,
        error: classesError,
      } = await supabase
        .from('classes')
        .select('id, name, section')
        .eq('coordinator_id', profile.id)

      if (classesError) {
        throw classesError
      }

      if (!classes || classes.length === 0) {
        setStudents([])
        setSubjects([])
        setAttendance([])
        setMarks([])

        setStats({
          students: 0,
          attendance: 0,
          performance: 0,
          risk: 0,
        })

        setLoading(false)
        return
      }

      const classIds = classes.map(
        (item) => item.id
      )

      // -----------------------------------------
      // GET STUDENTS
      // -----------------------------------------

      const {
        data: studentRows,
        error: studentsError,
      } = await supabase
        .from('students')
        .select('id, profile_id, class_id')
        .in('class_id', classIds)

      if (studentsError) {
        throw studentsError
      }

      const studentData = studentRows || []

      setStudents(studentData)

      const studentIds = studentData.map(
        (student) => student.id
      )

      // -----------------------------------------
      // GET SUBJECTS
      // -----------------------------------------

      const {
        data: subjectRows,
        error: subjectsError,
      } = await supabase
        .from('subjects')
        .select('id, name, class_id')
        .in('class_id', classIds)
        .order('name')

      if (subjectsError) {
        throw subjectsError
      }

      setSubjects(subjectRows || [])

      // No students = no attendance/marks
      if (studentIds.length === 0) {
        setAttendance([])
        setMarks([])

        setStats({
          students: 0,
          attendance: 0,
          performance: 0,
          risk: 0,
        })

        setLoading(false)
        return
      }

      // -----------------------------------------
      // GET ATTENDANCE
      // -----------------------------------------

      const {
        data: attendanceRows,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select(
          'student_id, subject_id, status, attendance_date'
        )
        .in('student_id', studentIds)

      if (attendanceError) {
        throw attendanceError
      }

      setAttendance(attendanceRows || [])

      // -----------------------------------------
      // GET MARKS
      // -----------------------------------------

      const {
        data: markRows,
        error: marksError,
      } = await supabase
        .from('marks')
        .select(
          'student_id, subject_id, exam_name, marks_obtained, maximum_marks'
        )
        .in('student_id', studentIds)

      if (marksError) {
        throw marksError
      }

      setMarks(markRows || [])

      // -----------------------------------------
      // OVERALL ATTENDANCE
      // -----------------------------------------

      const attendanceData =
        attendanceRows || []

      let presentCount = 0

      attendanceData.forEach((row) => {
        if (row.status === 'present') {
          presentCount += 1
        }
      })

      const attendancePercentage =
        attendanceData.length > 0
          ? Math.round(
              (presentCount /
                attendanceData.length) *
                100
            )
          : 0

      // -----------------------------------------
      // OVERALL PERFORMANCE
      // -----------------------------------------

      const markData = markRows || []

      let totalObtained = 0
      let totalMaximum = 0

      markData.forEach((row) => {
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

      const performancePercentage =
        totalMaximum > 0
          ? Math.round(
              (totalObtained /
                totalMaximum) *
                100
            )
          : 0

      // -----------------------------------------
      // HIGH RISK STUDENTS
      // -----------------------------------------

      let riskCount = 0

      studentData.forEach((student) => {
        const studentAttendance =
          attendanceData.filter(
            (row) =>
              row.student_id === student.id
          )

        const studentMarks =
          markData.filter(
            (row) =>
              row.student_id === student.id
          )

        if (
          studentAttendance.length === 0 &&
          studentMarks.length === 0
        ) {
          return
        }

        let studentAttendancePercentage =
          null

        if (studentAttendance.length > 0) {
          const present =
            studentAttendance.filter(
              (row) =>
                row.status === 'present'
            ).length

          studentAttendancePercentage =
            Math.round(
              (present /
                studentAttendance.length) *
                100
            )
        }

        let studentMarksPercentage = null

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
            studentMarksPercentage =
              Math.round(
                (obtained / maximum) *
                  100
              )
          }
        }

        const isHighRisk =
          (
            studentAttendancePercentage !==
              null &&
            studentAttendancePercentage < 75
          ) ||
          (
            studentMarksPercentage !==
              null &&
            studentMarksPercentage < 50
          )

        if (isHighRisk) {
          riskCount += 1
        }
      })

      setStats({
        students: studentData.length,
        attendance: attendancePercentage,
        performance: performancePercentage,
        risk: riskCount,
      })
    } catch (err) {
      console.error(
        'Coordinator Analytics Error:',
        err
      )

      setError(
        err?.message ||
          'Unable to load analytics.'
      )

      // Still show the page
      setStats({
        students: 0,
        attendance: 0,
        performance: 0,
        risk: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // -----------------------------------------
  // SUBJECT ANALYTICS
  // -----------------------------------------

  function getSubjectAttendance(subjectId) {
    const rows = attendance.filter(
      (item) =>
        item.subject_id === subjectId
    )

    if (!rows.length) {
      return null
    }

    const present = rows.filter(
      (item) =>
        item.status === 'present'
    ).length

    return Math.round(
      (present / rows.length) * 100
    )
  }

  function getSubjectMarks(subjectId) {
    const rows = marks.filter(
      (item) =>
        item.subject_id === subjectId
    )

    if (!rows.length) {
      return null
    }

    let obtained = 0
    let maximum = 0

    rows.forEach((row) => {
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

    if (!maximum) {
      return null
    }

    return Math.round(
      (obtained / maximum) * 100
    )
  }

  // -----------------------------------------
  // LOADING SCREEN
  // -----------------------------------------

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b1a] text-white">

        <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
          <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-10">

            <div className="flex items-center gap-3">

              <div className="flex h-14 w-14 shrink-0 items-center">
                <img
                  src={logo}
                  alt="NovaSphere"
                  className="max-h-12 w-full object-contain object-left"
                />
              </div>

              <div className="hidden sm:block">

                <div className="text-xl font-bold tracking-tight">
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

            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-slate-300"
            >
              <ArrowLeft size={17} />
              Back
            </button>

          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center">

          <div className="flex items-center gap-3 text-slate-400">

            <Loader2
              size={22}
              className="animate-spin"
            />

            Loading Analytics...

          </div>

        </div>

      </div>
    )
  }

  // -----------------------------------------
  // MAIN PAGE
  // -----------------------------------------

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">

        <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-10">

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

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

        </div>

      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-7xl px-6 py-8 lg:px-10">

        {/* INTRO */}
        <section className="mb-8">

          <p className="text-sm font-medium text-cyan-300">
            Coordinator analytics
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Academic Analytics
          </h1>

          <p className="mt-2 text-slate-400">
            Understand class performance, attendance and academic health at a glance.
          </p>

        </section>

        {/* ERROR */}
        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-500/10 p-4 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* SUMMARY CARDS */}
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">

          {/* STUDENTS */}
          <div className="nova-card rounded-2xl p-5">

            <Users
              size={25}
              className="mb-4 text-violet-400"
            />

            <p className="text-sm text-slate-400">
              Total Students
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.students}
            </p>

          </div>

          {/* ATTENDANCE */}
          <div className="nova-card rounded-2xl p-5">

            <CalendarCheck
              size={25}
              className="mb-4 text-emerald-400"
            />

            <p className="text-sm text-slate-400">
              Overall Attendance
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.attendance}%
            </p>

          </div>

          {/* PERFORMANCE */}
          <div className="nova-card rounded-2xl p-5">

            <TrendingUp
              size={25}
              className="mb-4 text-cyan-400"
            />

            <p className="text-sm text-slate-400">
              Class Performance
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.performance}%
            </p>

          </div>

          {/* RISK */}
          <div className="nova-card rounded-2xl p-5">

            <ShieldAlert
              size={25}
              className="mb-4 text-rose-400"
            />

            <p className="text-sm text-slate-400">
              High Risk Students
            </p>

            <p className="mt-1 text-3xl font-bold">
              {stats.risk}
            </p>

          </div>

        </section>

        {/* SUBJECT ANALYTICS */}
        <section className="mt-8">

          <div className="mb-5 flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <BarChart3 size={20} />
            </div>

            <div>

              <h2 className="text-xl font-semibold">
                Subject Performance
              </h2>

              <p className="text-sm text-slate-500">
                Compare subject-wise attendance and marks.
              </p>

            </div>

          </div>

          {subjects.length === 0 ? (

            <div className="nova-card rounded-2xl p-8 text-center">

              <BookOpen
                size={30}
                className="mx-auto mb-3 text-slate-600"
              />

              <p className="text-slate-400">
                No subjects available yet.
              </p>

              <p className="mt-1 text-sm text-slate-600">
                Add subjects from My Class.
              </p>

            </div>

          ) : (

            <div className="grid gap-4 md:grid-cols-2">

              {subjects.map((subject) => {

                const subjectAttendance =
                  getSubjectAttendance(
                    subject.id
                  )

                const subjectMarks =
                  getSubjectMarks(
                    subject.id
                  )

                return (
                  <div
                    key={subject.id}
                    className="nova-card rounded-2xl p-5"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-400/10">
                        <BookOpen
                          size={19}
                          className="text-cyan-400"
                        />
                      </div>

                      <h3 className="font-semibold">
                        {subject.name}
                      </h3>

                    </div>

                    {/* MARKS */}
                    <div className="mt-5">

                      <div className="mb-2 flex justify-between text-sm">

                        <span className="text-slate-400">
                          Performance
                        </span>

                        <span className="text-violet-300">
                          {subjectMarks !== null
                            ? `${subjectMarks}%`
                            : 'No data'}
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">

                        <div
                          className="h-full rounded-full bg-violet-500 transition-all"
                          style={{
                            width: `${subjectMarks ?? 0}%`,
                          }}
                        />

                      </div>

                    </div>

                    {/* ATTENDANCE */}
                    <div className="mt-4">

                      <div className="mb-2 flex justify-between text-sm">

                        <span className="text-slate-400">
                          Attendance
                        </span>

                        <span className="text-emerald-300">
                          {subjectAttendance !== null
                            ? `${subjectAttendance}%`
                            : 'No data'}
                        </span>

                      </div>

                      <div className="h-2 overflow-hidden rounded-full bg-white/5">

                        <div
                          className="h-full rounded-full bg-emerald-500 transition-all"
                          style={{
                            width: `${subjectAttendance ?? 0}%`,
                          }}
                        />

                      </div>

                    </div>

                  </div>
                )
              })}

            </div>

          )}

        </section>

        {/* INSIGHTS */}
        <section className="mt-8 grid gap-6 md:grid-cols-3">

          <div className="nova-card rounded-2xl p-6">

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-500/10">
              <Users
                size={21}
                className="text-cyan-300"
              />
            </div>

            <p className="text-sm text-slate-500">
              Class Size
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {students.length}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              students connected
            </p>

          </div>

          <div className="nova-card rounded-2xl p-6">

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10">
              <CalendarCheck
                size={21}
                className="text-emerald-300"
              />
            </div>

            <p className="text-sm text-slate-500">
              Attendance Health
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {stats.attendance}%
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              class attendance
            </p>

          </div>

          <div className="nova-card rounded-2xl p-6">

            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-rose-500/10">
              <ShieldAlert
                size={21}
                className="text-rose-300"
              />
            </div>

            <p className="text-sm text-slate-500">
              Students Requiring Attention
            </p>

            <h3 className="mt-2 text-2xl font-bold">
              {stats.risk}
            </h3>

            <p className="mt-1 text-sm text-slate-500">
              based on academic risk
            </p>

          </div>

        </section>

        {/* REFRESH */}
        <div className="mt-8 flex justify-end">

          <button
            type="button"
            onClick={loadAnalytics}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <RefreshCw size={17} />
            Refresh Analytics
          </button>

        </div>

      </main>

    </div>
  )
}