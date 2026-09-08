import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  Loader2,
  Save,
  Users,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Marks({ onBack }) {
  const { profile } = useAuth()

  const [classes, setClasses] = useState([])
  const [subjects, setSubjects] = useState([])
  const [students, setStudents] = useState([])

  const [selectedClass, setSelectedClass] = useState('')
  const [selectedSubject, setSelectedSubject] = useState('')

  const [examName, setExamName] = useState('Internal 1')
  const [maximumMarks, setMaximumMarks] = useState('100')

  const [marksMap, setMarksMap] = useState({})

  const [loadingClasses, setLoadingClasses] = useState(false)
  const [loadingSubjects, setLoadingSubjects] = useState(false)
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

      setLoadingClasses(true)
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
        setLoadingClasses(false)
      }
    }

    loadClasses()
  }, [profile?.id])

  // --------------------------------------------------
  // LOAD SUBJECTS
  // --------------------------------------------------

  useEffect(() => {
    async function loadSubjects() {
      if (!selectedClass) {
        setSubjects([])
        setSelectedSubject('')
        return
      }

      setLoadingSubjects(true)
      setMessage('')

      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('id, name, code, class_id')
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

        setMessage(
          error?.message ||
            'Unable to load subjects.'
        )
        setMessageType('error')
      } finally {
        setLoadingSubjects(false)
      }
    }

    loadSubjects()
  }, [selectedClass])

  // --------------------------------------------------
  // LOAD STUDENTS + EXISTING MARKS
  // --------------------------------------------------

  useEffect(() => {
    async function loadStudentsAndMarks() {
      if (!selectedClass || !selectedSubject || !examName) {
        setStudents([])
        setMarksMap({})
        return
      }

      setLoadingStudents(true)
      setMessage('')

      try {
        // Load students belonging to selected class.
        const {
          data: studentRows,
          error: studentError,
        } = await supabase
          .from('students')
          .select(
            'id, profile_id, class_id, roll_number, register_number'
          )
          .eq('class_id', selectedClass)
          .order('roll_number')

        if (studentError) {
          throw studentError
        }

        const baseStudents = studentRows || []

        // Load profile information separately.
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

        setStudents(enrichedStudents)

        // Load marks already saved for this
        // student + subject + exam.
        const {
          data: existingMarks,
          error: marksError,
        } = await supabase
          .from('marks')
          .select(
            'id, student_id, subject_id, exam_name, marks_obtained, maximum_marks'
          )
          .eq('subject_id', selectedSubject)
          .eq('exam_name', examName)

        if (marksError) {
          throw marksError
        }

        const existingMap = {}

        ;(existingMarks || []).forEach((mark) => {
          existingMap[mark.student_id] =
            mark.marks_obtained
        })

        setMarksMap(existingMap)

        // If saved marks exist, use the saved maximum
        // marks value.
        if (existingMarks?.length > 0) {
          const savedMaximum =
            existingMarks.find(
              (item) =>
                item.maximum_marks !== null &&
                item.maximum_marks !== undefined
            )?.maximum_marks

          if (savedMaximum !== undefined) {
            setMaximumMarks(String(savedMaximum))
          }
        }
      } catch (error) {
        console.error(
          'Load students/marks error:',
          error
        )

        setMessage(
          error?.message ||
            'Unable to load students and marks.'
        )
        setMessageType('error')
      } finally {
        setLoadingStudents(false)
      }
    }

    loadStudentsAndMarks()
  }, [selectedClass, selectedSubject, examName])

  // --------------------------------------------------
  // SELECTED CLASS / SUBJECT
  // --------------------------------------------------

  const selectedClassData = useMemo(
    () =>
      classes.find(
        (item) => item.id === selectedClass
      ),
    [classes, selectedClass]
  )

  const selectedSubjectData = useMemo(
    () =>
      subjects.find(
        (item) => item.id === selectedSubject
      ),
    [subjects, selectedSubject]
  )

  // --------------------------------------------------
  // UPDATE MARK
  // --------------------------------------------------

  function updateMark(studentId, value) {
    if (value === '') {
      setMarksMap((current) => ({
        ...current,
        [studentId]: '',
      }))
      return
    }

    const numericValue = Number(value)

    if (Number.isNaN(numericValue)) {
      return
    }

    const max = Number(maximumMarks)

    if (max > 0 && numericValue > max) {
      return
    }

    if (numericValue < 0) {
      return
    }

    setMarksMap((current) => ({
      ...current,
      [studentId]: value,
    }))
  }

  // --------------------------------------------------
  // SAVE MARKS
  // --------------------------------------------------

  async function saveMarks() {
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

    if (!examName.trim()) {
      setMessage('Please enter an exam name.')
      setMessageType('error')
      return
    }

    const maximum = Number(maximumMarks)

    if (!maximum || maximum <= 0) {
      setMessage(
        'Maximum marks must be greater than 0.'
      )
      setMessageType('error')
      return
    }

    setSaving(true)
    setMessage('')

    try {
      const rows = students.map((student) => {
        const rawValue = marksMap[student.id]

        const obtained =
          rawValue === '' ||
          rawValue === undefined ||
          rawValue === null
            ? 0
            : Number(rawValue)

        return {
          student_id: student.id,
          subject_id: selectedSubject,
          exam_name: examName.trim(),
          marks_obtained: obtained,
          maximum_marks: maximum,
        }
      })

      const { error } = await supabase
        .from('marks')
        .upsert(rows, {
          onConflict:
            'student_id,subject_id,exam_name',
        })

      if (error) {
        throw error
      }

      setMessage(
        `Marks saved successfully for ${
          selectedSubjectData?.name || 'this subject'
        }.`
      )
      setMessageType('success')
    } catch (error) {
      console.error('Save marks error:', error)

      setMessage(
        error?.message ||
          'Unable to save marks.'
      )
      setMessageType('error')
    } finally {
      setSaving(false)
    }
  }

  // --------------------------------------------------
  // UI
  // --------------------------------------------------

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex h-16 w-32 shrink-0 items-center">
            <img
              src={logo}
              alt="NovaSphere"
              className="max-h-14 w-full object-contain object-left"
            />
          </div>

          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/[0.07] hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
        {/* PAGE TITLE */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-500/10">
              <BookOpen className="h-6 w-6 text-violet-400" />
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Marks Management
              </h1>

              <p className="text-sm text-slate-400">
                Enter and manage academic marks for your class.
              </p>
            </div>
          </div>
        </div>

        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 flex items-center gap-3 rounded-2xl border px-4 py-3 text-sm ${
              messageType === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
            }`}
          >
            {messageType === 'success' ? (
              <CheckCircle2 className="h-5 w-5 shrink-0" />
            ) : (
              <span className="font-bold">!</span>
            )}

            <span>{message}</span>
          </div>
        )}

        {/* CONTROLS */}
        <section className="mb-8 rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <BookOpen className="h-5 w-5 text-blue-400" />
            </div>

            <div>
              <h2 className="font-semibold">
                Assessment Details
              </h2>

              <p className="text-xs text-slate-500">
                Select the class, subject and examination.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {/* CLASS */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Class
              </label>

              <div className="relative">
                <select
                  value={selectedClass}
                  onChange={(event) =>
                    setSelectedClass(event.target.value)
                  }
                  disabled={loadingClasses}
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400/50"
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

              {selectedClassData?.class_code && (
                <p className="mt-2 text-xs text-slate-500">
                  Code: {selectedClassData.class_code}
                </p>
              )}
            </div>

            {/* SUBJECT */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Subject
              </label>

              <div className="relative">
                <select
                  value={selectedSubject}
                  onChange={(event) =>
                    setSelectedSubject(event.target.value)
                  }
                  disabled={
                    loadingSubjects ||
                    subjects.length === 0
                  }
                  className="w-full appearance-none rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 pr-10 text-sm text-white outline-none transition focus:border-violet-400/50"
                >
                  {subjects.length === 0 ? (
                    <option value="">
                      No subjects available
                    </option>
                  ) : (
                    subjects.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                      >
                        {item.name}
                        {item.code
                          ? ` (${item.code})`
                          : ''}
                      </option>
                    ))
                  )}
                </select>

                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>

            {/* EXAM */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Exam
              </label>

              <input
                type="text"
                value={examName}
                onChange={(event) =>
                  setExamName(event.target.value)
                }
                placeholder="e.g. Internal 1"
                className="w-full rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 text-sm text-white outline-none placeholder:text-slate-600 transition focus:border-violet-400/50"
              />
            </div>

            {/* MAXIMUM MARKS */}
            <div>
              <label className="mb-2 block text-xs font-medium uppercase tracking-wider text-slate-500">
                Maximum Marks
              </label>

              <input
                type="number"
                min="1"
                value={maximumMarks}
                onChange={(event) =>
                  setMaximumMarks(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
              />
            </div>
          </div>
        </section>

        {/* STUDENT SUMMARY */}
        <section className="mb-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                <Users className="h-5 w-5 text-cyan-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Students
                </p>

                <p className="mt-1 text-2xl font-bold">
                  {students.length}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
                <BookOpen className="h-5 w-5 text-violet-400" />
              </div>

              <div>
                <p className="text-xs uppercase tracking-wider text-slate-500">
                  Assessment
                </p>

                <p className="mt-1 text-lg font-bold">
                  {examName || 'Not selected'}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* STUDENT LIST */}
        <section className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.03]">
          <div className="flex flex-col gap-4 border-b border-white/10 p-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold">
                Student Marks
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                {selectedSubjectData?.name ||
                  'Select a subject'}{' '}
                • {examName}
              </p>
            </div>

            <button
              type="button"
              onClick={saveMarks}
              disabled={
                saving ||
                loadingStudents ||
                students.length === 0
              }
              className="flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Marks
                </>
              )}
            </button>
          </div>

          {loadingStudents ? (
            <div className="flex min-h-64 items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-slate-400">
                <Loader2 className="h-5 w-5 animate-spin" />
                Loading students and marks...
              </div>
            </div>
          ) : students.length === 0 ? (
            <div className="flex min-h-64 items-center justify-center px-6 text-center">
              <div>
                <Users className="mx-auto mb-3 h-8 w-8 text-slate-600" />

                <p className="font-medium text-slate-300">
                  No students found
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  Add students to this class before entering marks.
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* TABLE HEADER */}
              <div className="hidden grid-cols-[80px_1fr_160px_140px] gap-4 border-b border-white/5 bg-white/[0.02] px-6 py-3 text-xs font-medium uppercase tracking-wider text-slate-500 md:grid">
                <div>Roll</div>
                <div>Student</div>
                <div>Marks</div>
                <div>Maximum</div>
              </div>

              <div className="divide-y divide-white/5">
                {students.map((student, index) => {
                  const name =
                    student.profile?.full_name?.trim() ||
                    student.profile?.email?.split('@')[0] ||
                    student.register_number ||
                    student.roll_number ||
                    `Student ${index + 1}`

                  const currentMark =
                    marksMap[student.id] ?? ''

                  return (
                    <div
                      key={student.id}
                      className="grid gap-4 px-6 py-5 transition hover:bg-white/[0.02] md:grid-cols-[80px_1fr_160px_140px] md:items-center"
                    >
                      {/* ROLL */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-slate-600 md:hidden">
                          Roll
                        </span>

                        <p className="font-semibold text-slate-300">
                          {student.roll_number ||
                            student.register_number ||
                            index + 1}
                        </p>
                      </div>

                      {/* STUDENT */}
                      <div>
                        <span className="text-xs uppercase tracking-wider text-slate-600 md:hidden">
                          Student
                        </span>

                        <p className="font-medium text-white">
                          {name}
                        </p>

                        {student.register_number && (
                          <p className="mt-1 text-xs text-slate-500">
                            Reg: {student.register_number}
                          </p>
                        )}
                      </div>

                      {/* MARKS */}
                      <div>
                        <span className="mb-2 block text-xs uppercase tracking-wider text-slate-600 md:hidden">
                          Marks Obtained
                        </span>

                        <input
                          type="number"
                          min="0"
                          max={maximumMarks}
                          step="0.01"
                          value={currentMark}
                          onChange={(event) =>
                            updateMark(
                              student.id,
                              event.target.value
                            )
                          }
                          placeholder="0"
                          className="w-full rounded-xl border border-white/10 bg-[#0d1328] px-4 py-3 text-center text-sm font-semibold text-white outline-none transition focus:border-violet-400/50"
                        />
                      </div>

                      {/* MAXIMUM */}
                      <div>
                        <span className="mb-2 block text-xs uppercase tracking-wider text-slate-600 md:hidden">
                          Maximum
                        </span>

                        <div className="rounded-xl border border-white/5 bg-white/[0.02] px-4 py-3 text-center text-sm text-slate-400">
                          {maximumMarks}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  )
}