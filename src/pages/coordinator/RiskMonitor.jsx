import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronDown,
  Loader2,
  RefreshCw,
  ShieldAlert,
  TrendingDown,
  TrendingUp,
  Users,
} from 'lucide-react'

import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

function calculateAttendance(studentId, attendanceRows) {
  const rows = attendanceRows.filter(
    (item) => item.student_id === studentId
  )

  if (!rows.length) return null

  const present = rows.filter(
    (item) => item.status === 'present'
  ).length

  return Math.round((present / rows.length) * 100)
}

function calculateAverageMarks(studentId, marksRows) {
  const rows = marksRows.filter(
    (item) => item.student_id === studentId
  )

  if (!rows.length) return null

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

  if (totalMaximum === 0) return null

  return Math.round(
    (totalObtained / totalMaximum) * 100
  )
}

function getRiskLevel(attendance, marks) {
  const hasAttendance = attendance !== null
  const hasMarks = marks !== null

  if (!hasAttendance && !hasMarks) {
    return 'none'
  }

  const highRisk =
    (hasAttendance && attendance < 75) ||
    (hasMarks && marks < 50)

  if (highRisk) {
    return 'high'
  }

  const attention =
    (hasAttendance && attendance < 85) ||
    (hasMarks && marks < 60)

  if (attention) {
    return 'attention'
  }

  return 'on-track'
}

function getRiskLabel(level) {
  if (level === 'high') return 'High Risk'
  if (level === 'attention') return 'Needs Attention'
  if (level === 'on-track') return 'On Track'
  return 'No Data'
}

function getRiskClasses(level) {
  if (level === 'high') {
    return {
      badge:
        'border-rose-400/20 bg-rose-500/10 text-rose-300',
      icon:
        'border-rose-400/20 bg-rose-500/10 text-rose-300',
    }
  }

  if (level === 'attention') {
    return {
      badge:
        'border-amber-400/20 bg-amber-500/10 text-amber-300',
      icon:
        'border-amber-400/20 bg-amber-500/10 text-amber-300',
    }
  }

  if (level === 'on-track') {
    return {
      badge:
        'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
      icon:
        'border-emerald-400/20 bg-emerald-500/10 text-emerald-300',
    }
  }

  return {
    badge:
      'border-white/10 bg-white/5 text-slate-400',
    icon:
      'border-white/10 bg-white/5 text-slate-400',
  }
}

function getInitials(name) {
  if (!name) return 'ST'

  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

function getRiskReasons(student) {
  const reasons = []

  if (
    student.attendance !== null &&
    student.attendance < 75
  ) {
    reasons.push(
      `Attendance is below the 75% threshold (${student.attendance}%).`
    )
  }

  if (
    student.marks !== null &&
    student.marks < 50
  ) {
    reasons.push(
      `Academic performance is below 50% (${student.marks}%).`
    )
  }

  if (
    student.attendance !== null &&
    student.attendance >= 75 &&
    student.attendance < 85
  ) {
    reasons.push(
      `Attendance is below the preferred 85% level (${student.attendance}%).`
    )
  }

  if (
    student.marks !== null &&
    student.marks >= 50 &&
    student.marks < 60
  ) {
    reasons.push(
      `Academic performance is below the preferred 60% level (${student.marks}%).`
    )
  }

  return reasons
}

function getRecommendation(student) {
  if (student.riskLevel === 'high') {
    return 'Consider academic support, attendance follow-up, and a review of recent learning difficulties.'
  }

  if (student.riskLevel === 'attention') {
    return 'Monitor this student closely and provide support before performance declines further.'
  }

  if (student.riskLevel === 'on-track') {
    return 'The student is currently performing within healthy academic indicators.'
  }

  return 'Record attendance or marks to generate meaningful academic insights.'
}

export default function RiskMonitor({ onBack }) {
  const { profile } = useAuth()

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')

  const [students, setStudents] = useState([])
  const [profiles, setProfiles] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])

  const [selectedStudent, setSelectedStudent] =
    useState(null)

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadClasses()
  }, [profile?.id])

  useEffect(() => {
    if (selectedClass) {
      loadClassData(selectedClass)
    }
  }, [selectedClass])

  async function loadClasses() {
    if (!profile?.id) return

    setLoading(true)
    setError('')

    try {
      const { data, error: classError } = await supabase
        .from('classes')
        .select('id, name, section, class_code')
        .eq('coordinator_id', profile.id)
        .order('name')

      if (classError) {
        throw classError
      }

      const classList = data || []

      setClasses(classList)

      if (classList.length > 0) {
        setSelectedClass((current) =>
          current &&
          classList.some((item) => item.id === current)
            ? current
            : classList[0].id
        )
      } else {
        setSelectedClass('')
        setStudents([])
        setProfiles([])
        setAttendance([])
        setMarks([])
      }
    } catch (err) {
      console.error(
        'Risk Monitor class loading error:',
        err
      )

      setError(
        err?.message ||
          'Unable to load coordinator classes.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function loadClassData(classId) {
    setRefreshing(true)
    setError('')

    try {
      const { data: studentData, error: studentError } =
        await supabase
          .from('students')
          .select(
            'id, profile_id, class_id, roll_number, register_number'
          )
          .eq('class_id', classId)
          .order('roll_number')

      if (studentError) {
        throw studentError
      }

      const studentList = studentData || []

      setStudents(studentList)

      const profileIds = studentList
        .map((student) => student.profile_id)
        .filter(Boolean)

      let profileList = []

      if (profileIds.length > 0) {
        const { data: profileData, error: profileError } =
          await supabase
            .from('profiles')
            .select(
              'id, full_name, email, role'
            )
            .in('id', profileIds)

        if (profileError) {
          throw profileError
        }

        profileList = profileData || []
      }

      setProfiles(profileList)

      const studentIds = studentList.map(
        (student) => student.id
      )

      if (studentIds.length === 0) {
        setAttendance([])
        setMarks([])
        setSelectedStudent(null)
        return
      }

      const [
        {
          data: attendanceData,
          error: attendanceError,
        },
        {
          data: marksData,
          error: marksError,
        },
      ] = await Promise.all([
        supabase
          .from('attendance')
          .select(
            'id, student_id, subject_id, attendance_date, status'
          )
          .in('student_id', studentIds),

        supabase
          .from('marks')
          .select(
            'id, student_id, subject_id, exam_name, marks_obtained, maximum_marks'
          )
          .in('student_id', studentIds),
      ])

      if (attendanceError) {
        throw attendanceError
      }

      if (marksError) {
        throw marksError
      }

      setAttendance(attendanceData || [])
      setMarks(marksData || [])
      setSelectedStudent(null)
    } catch (err) {
      console.error(
        'Risk Monitor data loading error:',
        err
      )

      setError(
        err?.message ||
          'Unable to load academic risk data.'
      )

      setStudents([])
      setProfiles([])
      setAttendance([])
      setMarks([])
      setSelectedStudent(null)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  async function refreshData() {
    if (!selectedClass) return

    await loadClassData(selectedClass)
  }

  const profileMap = useMemo(() => {
    const map = {}

    profiles.forEach((item) => {
      map[item.id] = item
    })

    return map
  }, [profiles])

  const riskStudents = useMemo(() => {
    return students.map((student) => {
      const profileData =
        profileMap[student.profile_id] || null

      const attendancePercentage =
        calculateAttendance(
          student.id,
          attendance
        )

      const marksPercentage =
        calculateAverageMarks(
          student.id,
          marks
        )

      const riskLevel = getRiskLevel(
        attendancePercentage,
        marksPercentage
      )

      return {
        ...student,

        profile: profileData,

        name:
          profileData?.full_name ||
          profileData?.email ||
          `Student ${student.roll_number || ''}`.trim(),

        email: profileData?.email || '',

        attendance: attendancePercentage,

        marks: marksPercentage,

        riskLevel,

        riskLabel: getRiskLabel(riskLevel),
      }
    })
  }, [
    students,
    profiles,
    profileMap,
    attendance,
    marks,
  ])

  const summary = useMemo(() => {
    const highRisk = riskStudents.filter(
      (student) => student.riskLevel === 'high'
    ).length

    const attention = riskStudents.filter(
      (student) => student.riskLevel === 'attention'
    ).length

    const onTrack = riskStudents.filter(
      (student) => student.riskLevel === 'on-track'
    ).length

    const noData = riskStudents.filter(
      (student) => student.riskLevel === 'none'
    ).length

    return {
      total: riskStudents.length,
      highRisk,
      attention,
      onTrack,
      noData,
    }
  }, [riskStudents])

  const sortedStudents = useMemo(() => {
    const priority = {
      high: 0,
      attention: 1,
      'on-track': 2,
      none: 3,
    }

    return [...riskStudents].sort((a, b) => {
      return (
        priority[a.riskLevel] -
        priority[b.riskLevel]
      )
    })
  }, [riskStudents])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b1a] text-white">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 text-slate-300">
            <Loader2 className="h-6 w-6 animate-spin text-violet-400" />
            <span>Loading Risk Monitor...</span>
          </div>
        </div>
      </div>
    )
  }

  /* Student Detail View */
  if (selectedStudent) {
    const riskClasses = getRiskClasses(
      selectedStudent.riskLevel
    )

    const reasons = getRiskReasons(
      selectedStudent
    )

    return (
      <div className="min-h-screen bg-[#070b1a] text-white">
        <div className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">

          <button
            type="button"
            onClick={() => setSelectedStudent(null)}
            className="mb-6 flex items-center gap-2 text-sm text-slate-400 transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Risk Monitor
          </button>

          <div className="mb-8">
            <p className="text-sm font-medium uppercase tracking-[0.18em] text-violet-400">
              Student Academic Profile
            </p>

            <h1 className="mt-2 text-3xl font-bold">
              {selectedStudent.name}
            </h1>

            <p className="mt-2 text-sm text-slate-400">
              {selectedStudent.email ||
                'Academic risk analysis'}
            </p>
          </div>

          {/* Student Header */}
          <div className="mb-6 rounded-3xl border border-white/10 bg-[#0d1328] p-6">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-violet-400/20 bg-violet-500/10 text-lg font-bold text-violet-200">
                  {getInitials(
                    selectedStudent.name
                  )}
                </div>

                <div>
                  <h2 className="text-xl font-semibold">
                    {selectedStudent.name}
                  </h2>

                  {(selectedStudent.roll_number ||
  selectedStudent.register_number) && (
  <p className="mt-1 text-sm text-slate-500">
    Roll No:{' '}
    {selectedStudent.roll_number ||
      selectedStudent.register_number}
  </p>
)}
                </div>
              </div>

              <span
                className={`inline-flex w-fit items-center rounded-full border px-4 py-2 text-sm font-medium ${riskClasses.badge}`}
              >
                {selectedStudent.riskLabel}
              </span>
            </div>
          </div>

          {/* Metrics */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">

            <div className="rounded-2xl border border-white/10 bg-[#0d1328] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Attendance
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {selectedStudent.attendance ===
                    null
                      ? '—'
                      : `${selectedStudent.attendance}%`}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                  <Users className="h-5 w-5 text-blue-300" />
                </div>
              </div>

              {selectedStudent.attendance !==
                null && (
                <div className="mt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{
                        width: `${Math.min(
                          selectedStudent.attendance,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    Recommended minimum: 75%
                  </p>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#0d1328] p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">
                    Academic Performance
                  </p>

                  <p className="mt-2 text-3xl font-bold">
                    {selectedStudent.marks ===
                    null
                      ? '—'
                      : `${selectedStudent.marks}%`}
                  </p>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
                  {selectedStudent.marks !== null &&
                  selectedStudent.marks < 50 ? (
                    <TrendingDown className="h-5 w-5 text-rose-300" />
                  ) : (
                    <TrendingUp className="h-5 w-5 text-violet-300" />
                  )}
                </div>
              </div>

              {selectedStudent.marks !==
                null && (
                <div className="mt-5">
                  <div className="h-2 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-violet-500"
                      style={{
                        width: `${Math.min(
                          selectedStudent.marks,
                          100
                        )}%`,
                      }}
                    />
                  </div>

                  <p className="mt-2 text-xs text-slate-500">
                    High-risk threshold: below 50%
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Risk Reasons */}
          <div className="mb-6 rounded-2xl border border-white/10 bg-[#0d1328] p-6">
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-xl border ${riskClasses.icon}`}
              >
                {selectedStudent.riskLevel ===
                'high' ? (
                  <ShieldAlert className="h-5 w-5" />
                ) : selectedStudent.riskLevel ===
                  'attention' ? (
                  <AlertTriangle className="h-5 w-5" />
                ) : (
                  <CheckCircle2 className="h-5 w-5" />
                )}
              </div>

              <div>
                <h2 className="font-semibold">
                  Risk Analysis
                </h2>

                <p className="text-sm text-slate-500">
                  Why this student has this status
                </p>
              </div>
            </div>

            {reasons.length > 0 ? (
              <div className="mt-6 space-y-3">
                {reasons.map((reason, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 rounded-xl border border-white/5 bg-white/[0.025] p-4"
                  >
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />

                    <p className="text-sm leading-6 text-slate-300">
                      {reason}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-emerald-400/10 bg-emerald-500/5 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

                <p className="text-sm leading-6 text-slate-300">
                  No immediate academic concerns
                  were detected from the available
                  data.
                </p>
              </div>
            )}
          </div>

          {/* Recommendation */}
          <div className="rounded-2xl border border-violet-400/10 bg-violet-500/5 p-6">
            <p className="text-sm font-medium text-violet-300">
              Coordinator Recommendation
            </p>

            <p className="mt-2 text-sm leading-6 text-slate-300">
              {getRecommendation(
                selectedStudent
              )}
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      <div className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">

        {/* Header */}
        <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex items-start gap-4">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
                title="Back"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
            )}

            <div>
              <div className="mb-2 flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10">
                  <ShieldAlert className="h-5 w-5 text-rose-300" />
                </div>

                <span className="text-sm font-medium uppercase tracking-[0.18em] text-slate-400">
                  Academic Intelligence
                </span>
              </div>

              <h1 className="text-3xl font-bold tracking-tight">
                Risk Monitor
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-400">
                Identify students who may need academic
                support using attendance and marks data.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">

            <div className="relative">
              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(
                    event.target.value
                  )
                }
                className="min-w-[220px] appearance-none rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400/50"
              >
                {classes.length === 0 ? (
                  <option value="">
                    No classes available
                  </option>
                ) : (
                  classes.map((item) => (
                    <option
                      key={item.id}
                      value={item.id}
                    >
                      {item.name}
                      {item.section
                        ? ` - ${item.section}`
                        : ''}
                    </option>
                  ))
                )}
              </select>

              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            </div>

            <button
              type="button"
              onClick={refreshData}
              disabled={
                refreshing ||
                !selectedClass
              }
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
              title="Refresh"
            >
              <RefreshCw
                className={`h-5 w-5 ${
                  refreshing
                    ? 'animate-spin'
                    : ''
                }`}
              />
            </button>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />

            <div>
              <p className="font-medium text-rose-200">
                Unable to load risk data
              </p>

              <p className="mt-1 text-sm text-rose-200/70">
                {error}
              </p>
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">

          <div className="nova-card rounded-2xl border border-white/10 bg-[#0d1328] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-blue-400/20 bg-blue-500/10">
                <Users className="h-5 w-5 text-blue-300" />
              </div>

              <span className="text-xs uppercase tracking-wider text-slate-500">
                Total
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold">
              {summary.total}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Students
            </p>
          </div>

          <div className="nova-card rounded-2xl border border-rose-400/10 bg-[#0d1328] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-rose-400/20 bg-rose-500/10">
                <ShieldAlert className="h-5 w-5 text-rose-300" />
              </div>

              <span className="text-xs uppercase tracking-wider text-rose-300">
                Critical
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-rose-200">
              {summary.highRisk}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              High risk
            </p>
          </div>

          <div className="nova-card rounded-2xl border border-amber-400/10 bg-[#0d1328] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-500/10">
                <AlertTriangle className="h-5 w-5 text-amber-300" />
              </div>

              <span className="text-xs uppercase tracking-wider text-amber-300">
                Watch
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-amber-200">
              {summary.attention}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              Need attention
            </p>
          </div>

          <div className="nova-card rounded-2xl border border-emerald-400/10 bg-[#0d1328] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-500/10">
                <CheckCircle2 className="h-5 w-5 text-emerald-300" />
              </div>

              <span className="text-xs uppercase tracking-wider text-emerald-300">
                Healthy
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-emerald-200">
              {summary.onTrack}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              On track
            </p>
          </div>

          <div className="nova-card rounded-2xl border border-white/10 bg-[#0d1328] p-5">
            <div className="flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5">
                <AlertCircle className="h-5 w-5 text-slate-400" />
              </div>

              <span className="text-xs uppercase tracking-wider text-slate-500">
                Missing
              </span>
            </div>

            <p className="mt-4 text-3xl font-bold text-slate-200">
              {summary.noData}
            </p>

            <p className="mt-1 text-sm text-slate-400">
              No academic data
            </p>
          </div>
        </div>

        {/* Explanation */}
        <div className="mb-6 rounded-2xl border border-violet-400/10 bg-violet-500/5 p-5">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-400/20 bg-violet-500/10">
              <TrendingDown className="h-5 w-5 text-violet-300" />
            </div>

            <div>
              <h2 className="font-semibold text-white">
                How Risk Monitor works
              </h2>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                Students are evaluated using available
                attendance and marks. Attendance below
                75% or marks below 50% is treated as
                high risk. Moderate warning thresholds
                identify students who may need attention
                before performance declines further.
              </p>
            </div>
          </div>
        </div>

        {/* Student Table */}
        <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0d1328]">

          <div className="flex flex-col gap-3 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Student Risk Overview
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Click a student to view detailed risk
                analysis.
              </p>
            </div>
          </div>

          {sortedStudents.length === 0 ? (
            <div className="flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
                <Users className="h-7 w-7 text-slate-500" />
              </div>

              <h3 className="mt-4 text-lg font-semibold text-slate-200">
                No students found
              </h3>

              <p className="mt-2 max-w-md text-sm text-slate-500">
                Add students to this class and record
                attendance or marks to see academic risk
                insights here.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[850px]">
                <thead>
                  <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-slate-500">
                    <th className="px-5 py-4 font-medium">
                      Student
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Roll No.
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Attendance
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Marks
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Academic Status
                    </th>

                    <th className="px-5 py-4 font-medium">
                      Details
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {sortedStudents.map((student) => {
                    const riskClasses =
                      getRiskClasses(
                        student.riskLevel
                      )

                    return (
                      <tr
                        key={student.id}
                        onClick={() =>
                          setSelectedStudent(
                            student
                          )
                        }
                        className="cursor-pointer border-b border-white/5 transition hover:bg-white/[0.04]"
                      >
                        <td className="px-5 py-5">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-violet-400/20 bg-violet-500/10 text-xs font-bold text-violet-200">
                              {getInitials(
                                student.name
                              )}
                            </div>

                            <div className="min-w-0">
                              <p className="truncate font-medium text-white">
                                {student.name}
                              </p>

                              {student.email && (
                                <p className="mt-0.5 truncate text-xs text-slate-500">
                                  {student.email}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>

                        <td className="px-5 py-5 text-sm text-slate-300">
                          {student.roll_number ||
                            student.register_number ||
                            '—'}
                        </td>

                        <td className="px-5 py-5">
                          {student.attendance ===
                          null ? (
                            <span className="text-sm text-slate-500">
                              No data
                            </span>
                          ) : (
                            <div className="min-w-[130px]">
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`text-sm font-semibold ${
                                    student.attendance <
                                    75
                                      ? 'text-rose-300'
                                      : student.attendance <
                                        85
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                                  }`}
                                >
                                  {student.attendance}%
                                </span>

                                {student.attendance <
                                75 ? (
                                  <TrendingDown className="h-4 w-4 text-rose-300" />
                                ) : (
                                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                                )}
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-blue-500"
                                  style={{
                                    width: `${Math.min(
                                      student.attendance,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          {student.marks === null ? (
                            <span className="text-sm text-slate-500">
                              No data
                            </span>
                          ) : (
                            <div className="min-w-[130px]">
                              <div className="mb-2 flex items-center justify-between">
                                <span
                                  className={`text-sm font-semibold ${
                                    student.marks <
                                    50
                                      ? 'text-rose-300'
                                      : student.marks <
                                        60
                                      ? 'text-amber-300'
                                      : 'text-emerald-300'
                                  }`}
                                >
                                  {student.marks}%
                                </span>

                                {student.marks <
                                50 ? (
                                  <TrendingDown className="h-4 w-4 text-rose-300" />
                                ) : (
                                  <TrendingUp className="h-4 w-4 text-emerald-300" />
                                )}
                              </div>

                              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                                <div
                                  className="h-full rounded-full bg-violet-500"
                                  style={{
                                    width: `${Math.min(
                                      student.marks,
                                      100
                                    )}%`,
                                  }}
                                />
                              </div>
                            </div>
                          )}
                        </td>

                        <td className="px-5 py-5">
                          <span
                            className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-medium ${riskClasses.badge}`}
                          >
                            {student.riskLabel}
                          </span>
                        </td>

                        <td className="px-5 py-5">
                          <span className="text-sm font-medium text-violet-300">
                            View analysis →
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Bottom Support Banner */}
        {summary.highRisk > 0 && (
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-500/5 p-5">
            <ShieldAlert className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />

            <div>
              <p className="font-semibold text-rose-200">
                Academic support recommended
              </p>

              <p className="mt-1 text-sm leading-6 text-slate-400">
                {summary.highRisk}{' '}
                {summary.highRisk === 1
                  ? 'student is'
                  : 'students are'}{' '}
                currently in the high-risk category.
                Click a student above to review the
                specific indicators.
              </p>
            </div>
          </div>
        )}

        {summary.highRisk === 0 &&
          summary.attention === 0 &&
          summary.onTrack > 0 && (
            <div className="mt-6 flex items-start gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/5 p-5">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />

              <div>
                <p className="font-semibold text-emerald-200">
                  Class is currently on track
                </p>

                <p className="mt-1 text-sm leading-6 text-slate-400">
                  No students are currently showing
                  attendance or marks patterns that
                  require immediate attention.
                </p>
              </div>
            </div>
          )}
      </div>
    </div>
  )
}