import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  BookOpen,
  Building2,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Loader2,
  Plus,
  Users,
  X,
  AlertCircle,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function MyClass({ onBack }) {
  const { user, profile } = useAuth()

  const [classData, setClassData] = useState(null)
  const [subjects, setSubjects] = useState([])
  const [studentCount, setStudentCount] = useState(0)

  const [loading, setLoading] = useState(true)
  const [creatingClass, setCreatingClass] = useState(false)
  const [addingSubject, setAddingSubject] = useState(false)

  const [showSubjectForm, setShowSubjectForm] = useState(false)
  const [copied, setCopied] = useState(false)

  const [className, setClassName] = useState('')
  const [classSection, setClassSection] = useState('')
  const [subjectName, setSubjectName] = useState('')

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  async function loadClassData() {
    if (!user?.id) return

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const {
        data: currentClass,
        error: classError,
      } = await supabase
        .from('classes')
        .select('*')
        .eq('coordinator_id', user.id)
        .maybeSingle()

      if (classError) {
        throw classError
      }

      if (!currentClass) {
        setClassData(null)
        setSubjects([])
        setStudentCount(0)
        setLoading(false)
        return
      }

      setClassData(currentClass)

      const {
        data: subjectsData,
        error: subjectsError,
      } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_id', currentClass.id)
        .order('name', { ascending: true })

      if (subjectsError) {
        throw subjectsError
      }

      const {
        count,
        error: studentsError,
      } = await supabase
        .from('students')
        .select('id', {
          count: 'exact',
          head: true,
        })
        .eq('class_id', currentClass.id)

      if (studentsError) {
        throw studentsError
      }

      setSubjects(subjectsData || [])
      setStudentCount(count || 0)
    } catch (error) {
      console.error('My Class loading error:', error)

      setMessage(
        error?.message ||
          'Unable to load your class information.'
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadClassData()
  }, [user?.id])

  async function handleCreateClass(event) {
    event.preventDefault()

    if (!className.trim()) {
      setMessage('Please enter a class name.')
      setMessageType('error')
      return
    }

    setCreatingClass(true)
    setMessage('')
    setMessageType('')

    try {
      // Generate a readable unique class code.
      const randomPart = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase()

      const generatedCode = `NS-${randomPart}`

      const { data, error } = await supabase
        .from('classes')
        .insert({
          name: className.trim(),
          section: classSection.trim() || null,
          coordinator_id: user.id,
          class_code: generatedCode,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setClassData(data)
      setSubjects([])
      setStudentCount(0)

      setClassName('')
      setClassSection('')

      setMessage('Class created successfully.')
      setMessageType('success')
    } catch (error) {
      console.error('Class creation error:', error)

      setMessage(
        error?.message ||
          'Unable to create the class.'
      )
      setMessageType('error')
    } finally {
      setCreatingClass(false)
    }
  }

  async function handleAddSubject(event) {
    event.preventDefault()

    if (!subjectName.trim()) {
      setMessage('Please enter a subject name.')
      setMessageType('error')
      return
    }

    if (!classData?.id) {
      setMessage('Create a class before adding subjects.')
      setMessageType('error')
      return
    }

    setAddingSubject(true)
    setMessage('')
    setMessageType('')

    try {
      const { data, error } = await supabase
        .from('subjects')
        .insert({
          name: subjectName.trim(),
          class_id: classData.id,
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      setSubjects((current) =>
        [...current, data].sort((a, b) =>
          a.name.localeCompare(b.name)
        )
      )

      setSubjectName('')
      setShowSubjectForm(false)

      setMessage('Subject added successfully.')
      setMessageType('success')
    } catch (error) {
      console.error('Subject creation error:', error)

      setMessage(
        error?.message ||
          'Unable to add the subject.'
      )
      setMessageType('error')
    } finally {
      setAddingSubject(false)
    }
  }

  async function handleDeleteSubject(subjectId) {
    const confirmed = window.confirm(
      'Are you sure you want to remove this subject?'
    )

    if (!confirmed) return

    try {
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', subjectId)

      if (error) {
        throw error
      }

      setSubjects((current) =>
        current.filter(
          (subject) => subject.id !== subjectId
        )
      )

      setMessage('Subject removed.')
      setMessageType('success')
    } catch (error) {
      console.error('Subject deletion error:', error)

      setMessage(
        error?.message ||
          'Unable to remove the subject.'
      )
      setMessageType('error')
    }
  }

  async function copyClassCode() {
    if (!classData?.class_code) return

    try {
      await navigator.clipboard.writeText(
        classData.class_code
      )

      setCopied(true)

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Copy error:', error)

      setMessage(
        'Unable to copy the class code. Please copy it manually.'
      )
      setMessageType('error')
    }
  }

  const coordinatorName =
    profile?.full_name ||
    profile?.email?.split('@')[0] ||
    'Coordinator'

  return (
    <main className="min-h-screen bg-[#070b1a] text-white">

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

          <div className="flex items-center gap-4">

            <div className="text-right">
              <p className="text-sm font-semibold text-white">
                {coordinatorName}
              </p>

              <p className="text-xs text-slate-500">
                Class Coordinator
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              {coordinatorName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </div>
      </header>


      {/* CONTENT */}
      <div className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">

        <button
          type="button"
          onClick={onBack}
          className="mb-7 flex items-center gap-2 text-sm font-medium text-slate-400 transition hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Overview
        </button>


        {/* TITLE */}
        <section className="mb-8">

          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-cyan-300">
            <Building2 className="h-4 w-4" />
            CLASS COMMAND CENTER
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            My Class
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Manage your class structure, subjects and students
            from one place.
          </p>

        </section>


        {/* MESSAGE */}
        {message && (
          <div
            className={`mb-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
              messageType === 'success'
                ? 'border-emerald-400/20 bg-emerald-400/10'
                : 'border-rose-400/20 bg-rose-400/10'
            }`}
          >

            {messageType === 'success' ? (
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300" />
            ) : (
              <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-300" />
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


        {/* LOADING */}
        {loading ? (
          <div className="nova-card flex min-h-64 items-center justify-center rounded-3xl">

            <div className="text-center">

              <Loader2 className="mx-auto h-8 w-8 animate-spin text-violet-400" />

              <p className="mt-4 text-sm text-slate-500">
                Loading your class...
              </p>

            </div>

          </div>
        ) : !classData ? (

          /* CREATE CLASS */
          <section className="nova-card mx-auto max-w-2xl rounded-3xl p-7 sm:p-9">

            <div className="mb-7 text-center">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10">
                <GraduationCap className="h-7 w-7 text-violet-300" />
              </div>

              <h2 className="mt-5 text-2xl font-bold">
                Create your class
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Set up your class first. You can then add subjects
                and students.
              </p>

            </div>


            <form
              onSubmit={handleCreateClass}
              className="space-y-5"
            >

              <div>

                <label
                  htmlFor="className"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Class name
                </label>

                <input
                  id="className"
                  type="text"
                  value={className}
                  onChange={(event) =>
                    setClassName(event.target.value)
                  }
                  placeholder="Example: B.Tech ECE 1st Year"
                  required
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
                />

              </div>


              <div>

                <label
                  htmlFor="classSection"
                  className="mb-2 block text-sm font-medium text-slate-300"
                >
                  Section
                  <span className="ml-1 text-slate-600">
                    (optional)
                  </span>
                </label>

                <input
                  id="classSection"
                  type="text"
                  value={classSection}
                  onChange={(event) =>
                    setClassSection(event.target.value)
                  }
                  placeholder="Example: A"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
                />

              </div>


              <button
                type="submit"
                disabled={creatingClass}
                className="nova-gradient flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >

                {creatingClass ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating class...
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Create Class
                  </>
                )}

              </button>

            </form>

          </section>

        ) : (

          <>
            {/* CLASS SUMMARY */}
            <section className="mb-8 grid gap-4 md:grid-cols-4">

              {/* CLASS */}
              <div className="nova-card rounded-2xl p-5">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
                  <Building2 className="h-5 w-5 text-violet-300" />
                </div>

                <p className="mt-5 text-xs uppercase tracking-wider text-slate-600">
                  Class
                </p>

                <h2 className="mt-1 text-xl font-bold">
                  {classData.name}
                </h2>

                {classData.section && (
                  <p className="mt-1 text-sm text-slate-500">
                    Section {classData.section}
                  </p>
                )}

              </div>


              {/* STUDENTS */}
              <div className="nova-card rounded-2xl p-5">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-cyan-400/10">
                  <Users className="h-5 w-5 text-cyan-300" />
                </div>

                <p className="mt-5 text-xs uppercase tracking-wider text-slate-600">
                  Students
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {studentCount}
                </h2>

              </div>


              {/* SUBJECTS */}
              <div className="nova-card rounded-2xl p-5">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10">
                  <BookOpen className="h-5 w-5 text-blue-300" />
                </div>

                <p className="mt-5 text-xs uppercase tracking-wider text-slate-600">
                  Subjects
                </p>

                <h2 className="mt-1 text-3xl font-bold">
                  {subjects.length}
                </h2>

              </div>


              {/* CLASS CODE */}
              <div className="nova-card rounded-2xl border border-violet-400/20 bg-violet-500/[0.05] p-5">

                <div className="flex items-start justify-between">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-400/10">
                    <GraduationCap className="h-5 w-5 text-violet-300" />
                  </div>

                  <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-300">
                    Join Code
                  </span>

                </div>

                <p className="mt-5 text-xs uppercase tracking-wider text-slate-600">
                  Class Code
                </p>

                <div className="mt-1 flex items-center gap-2">

                  <h2 className="font-mono text-xl font-bold tracking-wider text-white">
                    {classData.class_code || 'Not generated'}
                  </h2>

                  {classData.class_code && (
                    <button
                      type="button"
                      onClick={copyClassCode}
                      title="Copy class code"
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/10 hover:text-white"
                    >
                      {copied ? (
                        <Check className="h-4 w-4 text-emerald-300" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  )}

                </div>

                <p className="mt-2 text-xs text-slate-500">
                  Share this code with your students.
                </p>

              </div>

            </section>


            {/* SUBJECTS */}
            <section className="nova-card rounded-3xl p-6 sm:p-7">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <BookOpen className="h-5 w-5 text-violet-300" />

                    <p className="text-sm font-medium text-violet-300">
                      SUBJECTS
                    </p>

                  </div>

                  <h2 className="mt-2 text-2xl font-bold">
                    Class subjects
                  </h2>

                  <p className="mt-1 text-sm text-slate-500">
                    Add the subjects taught in this class.
                  </p>

                </div>


                <button
                  type="button"
                  onClick={() =>
                    setShowSubjectForm(true)
                  }
                  className="flex items-center justify-center gap-2 rounded-xl bg-violet-500/10 px-4 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-500/20"
                >
                  <Plus className="h-4 w-4" />
                  Add Subject
                </button>

              </div>


              {/* ADD SUBJECT FORM */}
              {showSubjectForm && (
                <form
                  onSubmit={handleAddSubject}
                  className="mt-6 rounded-2xl border border-violet-400/10 bg-violet-400/[0.03] p-5"
                >

                  <div className="flex items-center justify-between">

                    <h3 className="font-semibold">
                      Add a subject
                    </h3>

                    <button
                      type="button"
                      onClick={() =>
                        setShowSubjectForm(false)
                      }
                      className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                    >
                      <X className="h-4 w-4" />
                    </button>

                  </div>


                  <div className="mt-4 flex flex-col gap-3 sm:flex-row">

                    <input
                      type="text"
                      value={subjectName}
                      onChange={(event) =>
                        setSubjectName(event.target.value)
                      }
                      placeholder="Example: Mathematics"
                      autoFocus
                      required
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:ring-4 focus:ring-violet-500/10"
                    />

                    <button
                      type="submit"
                      disabled={addingSubject}
                      className="nova-gradient flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60"
                    >

                      {addingSubject ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Plus className="h-4 w-4" />
                      )}

                      Add

                    </button>

                  </div>

                </form>
              )}


              {/* SUBJECT LIST */}
              {subjects.length === 0 ? (

                <div className="mt-8 rounded-2xl border border-dashed border-white/10 p-10 text-center">

                  <BookOpen className="mx-auto h-9 w-9 text-slate-600" />

                  <h3 className="mt-4 font-semibold">
                    No subjects yet
                  </h3>

                  <p className="mt-2 text-sm text-slate-500">
                    Add your first subject to start building
                    your class academic structure.
                  </p>

                </div>

              ) : (

                <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">

                  {subjects.map((subject, index) => (

                    <div
                      key={subject.id}
                      className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.025] p-4 transition hover:border-violet-400/20 hover:bg-white/[0.04]"
                    >

                      <div className="flex min-w-0 items-center gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-500/10 text-sm font-bold text-violet-300">
                          {String(index + 1).padStart(2, '0')}
                        </div>

                        <div className="min-w-0">

                          <p className="truncate text-sm font-semibold text-white">
                            {subject.name}
                          </p>

                          <p className="mt-1 text-xs text-slate-600">
                            Active subject
                          </p>

                        </div>

                      </div>


                      <button
                        type="button"
                        onClick={() =>
                          handleDeleteSubject(subject.id)
                        }
                        className="ml-3 rounded-lg p-2 text-slate-600 opacity-0 transition hover:bg-rose-400/10 hover:text-rose-300 group-hover:opacity-100"
                        title="Remove subject"
                      >
                        <X className="h-4 w-4" />
                      </button>

                    </div>

                  ))}

                </div>

              )}

            </section>
          </>
        )}

      </div>
    </main>
  )
}