import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  CalendarCheck,
  Check,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Save,
  Users,
  X,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Attendance({ onBack }) {
  const { profile } = useAuth()

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )

  const [attendanceMap, setAttendanceMap] = useState({})

  const [loading, setLoading] = useState(true)
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  // --------------------------------------------------
  // LOAD COORDINATOR CLASSES
  // --------------------------------------------------

  useEffect(() => {
    async function loadClasses() {
      if (!profile?.id) return

      setLoading(true)
      setMessage('')

      try {
        const { data, error } = await supabase
          .from('classes')
          .select('id, name, section, class_code')
          .eq('coordinator_id', profile.id)
          .order('name')

        if (error) {
          throw error
        }

        setClasses(data || [])

        if (data?.length > 0) {
          setSelectedClass(data[0].id)
        }
      } catch (error) {
        console.error('Load classes error:', error)

        setMessage(
          error?.message ||
            'Unable to load your classes.'
        )
        setMessageType('error')
      } finally {
        setLoading(false)
      }
    }

    loadClasses()
  }, [profile?.id])

  // --------------------------------------------------
  // LOAD SUBJECTS WHEN CLASS CHANGES
  // --------------------------------------------------

  useEffect(() => {
    async function loadSubjects() {
      if (!selectedClass) {
        setSubjects([])
        setSelectedSubject('')
        return
      }

      try {
        setMessage('')

        const { data, error } = await supabase
          .from('subjects')
          .select('id, name')
          .eq('class_id', selectedClass)
          .order('name')

        if (error) {
          throw error
        }

        setSubjects(data || [])

        if (data?.length > 0) {
          setSelectedSubject(data[0].id)
        } else {
          setSelectedSubject('')
        }
      } catch (error) {
        console.error('Load subjects error:', error)

        setSubjects([])
        setSelectedSubject('')

        setMessage(
          error?.message ||
            'Unable to load subjects.'
        )
        setMessageType('error')
      }
    }

    loadSubjects()
  }, [selectedClass])

  // --------------------------------------------------
  // LOAD STUDENTS + EXISTING ATTENDANCE
  // --------------------------------------------------

  useEffect(() => {
    async function loadAttendanceData() {
      if (!selectedClass || !selectedSubject || !selectedDate) {
        setStudents([])
        setAttendanceMap({})
        return
      }

      setLoadingStudents(true)
      setMessage('')

      try {
        // Get students belonging to this class.
        const {
          data: studentRows,
          error: studentError,
        } = await supabase
          .from('students')
          .select('id, profile_id, class_id, roll_number, register_number')
          .eq('class_id', selectedClass)
          .order('roll_number')

        if (studentError) {
          throw studentError
        }

        const baseStudents = studentRows || []

        // Get profile information separately.
        const profileIds = baseStudents
          .map((student) => student.profile_id)
          .filter(Boolean)

        let profileMap = {}

        if (profileIds.length > 0) {
          const {
            data: profileRows,
            error: profileError,
          } = await supabase
            .from('profiles')
            .select('id, full_name, email')
            .in('id', profileIds)

          if (profileError) {
            throw profileError
          }

          profileMap = Object.fromEntries(
            (profileRows || []).map((item) => [
              item.id,
              item,
            ])
          )
        }

        const enrichedStudents = baseStudents.map(
          (student) => ({
            ...student,
            profile:
              profileMap[student.profile_id] || null,
          })
        )
console.log('ENRICHED STUDENTS:', enrichedStudents)
        setStudents(enrichedStudents)

        // Load attendance already saved for this date/subject.
        const {
          data: existingAttendance,
          error: attendanceError,
        } = await supabase
          .from('attendance')
          .select(
            'id, student_id, subject_id, attendance_date, status'
          )
          .eq('subject_id', selectedSubject)
          .eq('attendance_date', selectedDate)

        if (attendanceError) {
          throw attendanceError
        }

        const nextMap = {}

        enrichedStudents.forEach((student) => {
          const existing = (existingAttendance || []).find(
            (row) => row.student_id === student.id
          )

          nextMap[student.id] =
            existing?.status || 'present'
        })

        setAttendanceMap(nextMap)
      } catch (error) {
        console.error(
          'Load attendance data error:',
          error
        )

        setStudents([])
        setAttendanceMap({})

        setMessage(
          error?.message ||
            'Unable to load attendance data.'
        )
        setMessageType('error')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadAttendanceData()
  }, [
    selectedClass,
    selectedSubject,
    selectedDate,
  ])

  // --------------------------------------------------
  // CURRENT CLASS / SUBJECT
  // --------------------------------------------------

  const currentClass = useMemo(
    () =>
      classes.find(
        (item) => item.id === selectedClass
      ),
    [classes, selectedClass]
  )

  const currentSubject = useMemo(
    () =>
      subjects.find(
        (item) => item.id === selectedSubject
      ),
    [subjects, selectedSubject]
  )

  // --------------------------------------------------
  // ATTENDANCE COUNTS
  // --------------------------------------------------

  const presentCount = students.filter(
    (student) =>
      attendanceMap[student.id] === 'present'
  ).length

  const absentCount = students.filter(
    (student) =>
      attendanceMap[student.id] === 'absent'
  ).length

  // --------------------------------------------------
  // SET STUDENT STATUS
  // --------------------------------------------------

  function setStudentStatus(studentId, status) {
    setAttendanceMap((current) => ({
      ...current,
      [studentId]: status,
    }))
  }

  function markAll(status) {
    const nextMap = {}

    students.forEach((student) => {
      nextMap[student.id] = status
    })

    setAttendanceMap(nextMap)
  }

  // --------------------------------------------------
  // SAVE ATTENDANCE
  // --------------------------------------------------

  async function handleSaveAttendance() {
    if (!selectedClass) {
      setMessage('Please select a class.')
      setMessageType('error')
      return
    }

    if (!selectedSubject) {
      setMessage('Please select a subject.')
      setMessageType('error')
      return
    }

    if (!selectedDate) {
      setMessage('Please select a date.')
      setMessageType('error')
      return
    }

    if (students.length === 0) {
      setMessage(
        'There are no students in this class yet.'
      )
      setMessageType('error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const rows = students.map((student) => ({
        student_id: student.id,
        subject_id: selectedSubject,
        attendance_date: selectedDate,
        status:
          attendanceMap[student.id] || 'present',
      }))

      const { error } = await supabase
        .from('attendance')
        .upsert(rows, {
          onConflict:
            'student_id,subject_id,attendance_date',
        })

      if (error) {
        throw error
      }

      setMessage(
        `Attendance saved successfully for ${currentSubject?.name || 'this subject'}.`
      )
      setMessageType('success')
    } catch (error) {
      console.error(
        'Save attendance error:',
        error
      )

      setMessage(
        error?.message ||
          'Unable to save attendance.'
      )
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // LOADING SCREEN
  // --------------------------------------------------

  if (loading) {
    return (
      <main className="min-h-screen bg-[#070b1a] text-white">
        <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
          <div className="mx-auto flex h-full w-full max-w-7xl items-center px-6 lg:px-10">
            <div className="flex h-16 w-32 items-center">
              <img
                src={logo}
                alt="NovaSphere"
                className="max-h-14 w-full object-contain object-left"
              />
            </div>
          </div>
        </header>

        <div className="flex min-h-[70vh] items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-400" />
            <p className="mt-4 text-sm text-slate-500">
              Loading attendance...
            </p>
          </div>
        </div>
      </main>
    )
  }

  // --------------------------------------------------
  // PAGE
  // --------------------------------------------------

  return (
    <main className="min-h-screen bg-[#070b1a] text-white">
      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex h-16 w-32 items-center">
            <img
              src={logo}
              alt="NovaSphere"
              className="max-h-14 w-full object-contain object-left"
            />
          </div>

          <div className="flex items-center gap-3 text-sm text-slate-400">
            <CalendarCheck className="h-4 w-4 text-cyan-300" />
            Attendance Management
          </div>
        </div>
      </header>

      {/* CONTENT */}
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">
        {/* BACK */}
        <button
          type="button"
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </button>

        {/* TITLE */}
        <section className="mb-8">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-300">
            <CalendarCheck className="h-4 w-4" />
            ATTENDANCE
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Mark attendance
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Record daily attendance for your students and
            keep their Academic Orbit up to date.
          </p>
        </section>

        {/* SELECTORS */}
        <section className="nova-card rounded-3xl p-6">
          <div className="grid gap-5 md:grid-cols-3">
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Class
              </label>

              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(event) =>
                    setSelectedClass(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
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
                        className="bg-[#0d1328]"
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

              {currentClass?.class_code && (
                <p className="mt-2 text-xs text-slate-500">
                  Code: {currentClass.class_code}
                </p>
              )}
            </div>

            {/* SUBJECT */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Subject
              </label>

              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(event) =>
                    setSelectedSubject(event.target.value)
                  }
                  className="w-full appearance-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
                >
                  {subjects.length === 0 ? (
                    <option value="">
                      No subjects available
                    </option>
                  ) : (
                    subjects.map((subject) => (
                      <option
                        key={subject.id}
                        value={subject.id}
                        className="bg-[#0d1328]"
                      >
                        {subject.name}
                      </option>
                    ))
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {/* DATE */}
            <div>
              <label
                htmlFor="attendanceDate"
                className="mb-2 block text-sm font-medium text-slate-300"
              >
                Date
              </label>

              <input
                id="attendanceDate"
                type="date"
                value={selectedDate}
                onChange={(event) =>
                  setSelectedDate(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50 focus:ring-4 focus:ring-violet-500/10"
              />
            </div>
          </div>
        </section>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mt-5 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
              messageType === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10'
                : 'border-rose-400/20 bg-rose-400/10'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : (
              <X className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
            )}

            <p
              className={`text-sm ${
                messageType === 'success'
                  ? 'text-emerald-200'
                  : 'text-rose-200'
              }`}
            >
              {message}
            </p>
          </div>
        )}

        {/* SUMMARY */}
        <section className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-blue-400/10 p-3">
                <Users className="h-5 w-5 text-blue-300" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Total Students
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-emerald-400/10 p-3">
                <Check className="h-5 w-5 text-emerald-300" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Present
                </p>

                <p className="mt-1 text-2xl font-bold text-emerald-300">
                  {presentCount}
                </p>
              </div>
            </div>
          </div>

          <div className="nova-card rounded-2xl p-5">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-rose-400/10 p-3">
                <X className="h-5 w-5 text-rose-300" />
              </div>

              <div>
                <p className="text-xs text-slate-500">
                  Absent
                </p>

                <p className="mt-1 text-2xl font-bold text-rose-300">
                  {absentCount}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STUDENTS */}
        <section className="mt-6">
          <div className="nova-card overflow-hidden rounded-3xl">
            {/* TOOLBAR */}
            <div className="flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-semibold">
                  {currentSubject?.name ||
                    'Student Attendance'}
                </h2>

                <p className="mt-1 text-xs text-slate-500">
                  {selectedDate}
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => markAll('present')}
                  disabled={students.length === 0}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-xs font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:opacity-40"
                >
                  Mark All Present
                </button>

                <button
                  type="button"
                  onClick={() => markAll('absent')}
                  disabled={students.length === 0}
                  className="rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-2 text-xs font-semibold text-rose-300 transition hover:bg-rose-400/15 disabled:opacity-40"
                >
                  Mark All Absent
                </button>
              </div>
            </div>

            {/* LOADING */}
            {loadingStudents ? (
              <div className="flex min-h-64 items-center justify-center">
                <div className="text-center">
                  <Loader2 className="mx-auto h-7 w-7 animate-spin text-violet-400" />
                  <p className="mt-3 text-sm text-slate-500">
                    Loading students...
                  </p>
                </div>
              </div>
            ) : students.length === 0 ? (
              <div className="px-6 py-16 text-center">
                <Users className="mx-auto h-10 w-10 text-slate-600" />

                <h3 className="mt-4 text-lg font-semibold">
                  No students yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                  Students who join this class using the
                  class code will appear here.
                </p>
              </div>
            ) : (
              <>
                {/* STUDENT LIST */}
<div className="divide-y divide-white/5">
  {students.map((student, index) => {
    const name =
      student.profile?.full_name?.trim() ||
      student.profile?.email?.split('@')[0] ||
      student.register_number ||
      student.roll_number ||
      `Student ${index + 1}`

    const status =
      attendanceMap[student.id] || 'present'
                    return (
                      <div
                        key={student.id}
                        className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold">
                            {name
                              .charAt(0)
                              .toUpperCase()}
                          </div>

                          <div>
                            <p className="font-semibold text-white">
                              {name}
                            </p>

                            <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
                              {student.roll_number && (
                                <span>
                                  Roll No: {student.roll_number}
                                </span>
                              )}

                              {student.register_number && (
                                <span>
                                  Reg No: {student.register_number}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* STATUS BUTTONS */}
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setStudentStatus(
                                student.id,
                                'present'
                              )
                            }
                            className={`flex min-w-28 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                              status === 'present'
                                ? 'border-emerald-400/30 bg-emerald-400/15 text-emerald-300'
                                : 'border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                            }`}
                          >
                            <Check className="h-4 w-4" />
                            Present
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setStudentStatus(
                                student.id,
                                'absent'
                              )
                            }
                            className={`flex min-w-28 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                              status === 'absent'
                                ? 'border-rose-400/30 bg-rose-400/15 text-rose-300'
                                : 'border-white/10 bg-white/[0.03] text-slate-500 hover:bg-white/[0.06] hover:text-slate-300'
                            }`}
                          >
                            <X className="h-4 w-4" />
                            Absent
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* SAVE */}
                <div className="border-t border-white/10 p-5">
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={saving}
                    className="nova-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5 hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {saving ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving Attendance...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Save Attendance
                      </>
                    )}
                  </button>
                </div>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  )
}