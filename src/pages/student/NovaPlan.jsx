import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CalendarDays,
  CheckCircle2,
  Clock3,
  Edit3,
  Loader2,
  Plus,
  Sparkles,
  Target,
  Trash2,
  X,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'

function NovaPlan({ onBack }) {
  const [subject, setSubject] = useState('')
  const [topics, setTopics] = useState('')
  const [days, setDays] = useState('5')
  const [dailyMinutes, setDailyMinutes] = useState('60')
  const [examDate, setExamDate] = useState('')
  const [weakAreas, setWeakAreas] = useState('')

  const [plan, setPlan] = useState(null)
  const [planId, setPlanId] = useState(null)

  const [savedPlans, setSavedPlans] = useState([])

  const [completedTasks, setCompletedTasks] = useState({})

  const [loading, setLoading] = useState(false)
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [deleting, setDeleting] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [isEditing, setIsEditing] = useState(false)
  const [showForm, setShowForm] = useState(false)

  // =========================================================
  // LOAD ALL SAVED PLANS
  // =========================================================

  useEffect(() => {
    loadSavedPlans()
  }, [])

  async function getCurrentStudent() {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      throw new Error(
        'You must be logged in to access NovaPlan.'
      )
    }

    const { data: student, error: studentError } =
      await supabase
        .from('students')
        .select('id')
        .eq('profile_id', user.id)
        .maybeSingle()

    if (studentError) {
      throw studentError
    }

    if (!student) {
      throw new Error(
        'Student profile was not found.'
      )
    }

    return student
  }

  async function loadSavedPlans(selectLatest = true) {
    setLoadingPlans(true)
    setError('')

    try {
      const student = await getCurrentStudent()

      const { data, error: plansError } =
        await supabase
          .from('study_plans')
          .select(
            'id, subject, goal, plan_data, created_at, updated_at'
          )
          .eq('student_id', student.id)
          .order('updated_at', {
            ascending: false,
          })

      if (plansError) {
        throw plansError
      }

      const plans = data || []

      setSavedPlans(plans)

      if (
        selectLatest &&
        plans.length > 0 &&
        !planId
      ) {
        openPlan(plans[0])
      }
    } catch (err) {
      console.error(
        'Load NovaPlan error:',
        err
      )

      setError(
        err?.message ||
          'Unable to load your saved study plans.'
      )
    } finally {
      setLoadingPlans(false)
    }
  }

  // =========================================================
  // OPEN SAVED PLAN
  // =========================================================

  function openPlan(savedPlan) {
    const savedPlanData =
      savedPlan.plan_data || {}

    setPlan(savedPlanData)
    setPlanId(savedPlan.id)

    setSubject(savedPlan.subject || '')
    setTopics(savedPlanData.topics || '')
    setDays(
      String(
        savedPlanData.total_days ||
          savedPlanData.days?.length ||
          5
      )
    )
    setDailyMinutes(
      String(
        savedPlanData.daily_minutes || 60
      )
    )
    setExamDate(
      savedPlanData.exam_date || ''
    )
    setWeakAreas(
      savedPlanData.weak_areas || ''
    )

    setCompletedTasks(
      savedPlanData.completed_tasks || {}
    )

    setIsEditing(false)
    setShowForm(false)
    setError('')
    setSuccess('')
  }

  // =========================================================
  // CREATE NEW PLAN MODE
  // =========================================================

  function startNewPlan() {
    setPlan(null)
    setPlanId(null)

    setSubject('')
    setTopics('')
    setDays('5')
    setDailyMinutes('60')
    setExamDate('')
    setWeakAreas('')

    setCompletedTasks({})

    setIsEditing(false)
    setShowForm(true)

    setError('')
    setSuccess('')
  }

  // =========================================================
  // EDIT EXISTING PLAN MODE
  // =========================================================

  function startEditing() {
    if (!plan || !planId) return

    setIsEditing(true)
    setShowForm(true)

    setError('')
    setSuccess('')
  }

  function cancelEditing() {
    if (planId) {
      const existingPlan = savedPlans.find(
        (item) => item.id === planId
      )

      if (existingPlan) {
        openPlan(existingPlan)
        return
      }
    }

    setIsEditing(false)
    setShowForm(false)
  }

  // =========================================================
  // GENERATE / CREATE / UPDATE PLAN
  // =========================================================

  async function generatePlan() {
    if (loading) return

    setError('')
    setSuccess('')

    if (!subject.trim()) {
      setError('Please enter a subject.')
      return
    }

    if (!topics.trim()) {
      setError(
        'Please enter the topics you want to study.'
      )
      return
    }

    const totalDays = Number(days)
    const minutes = Number(dailyMinutes)

    if (
      !Number.isInteger(totalDays) ||
      totalDays < 1 ||
      totalDays > 30
    ) {
      setError(
        'Study duration must be between 1 and 30 days.'
      )
      return
    }

    if (
      !Number.isInteger(minutes) ||
      minutes < 15 ||
      minutes > 480
    ) {
      setError(
        'Daily study time must be between 15 and 480 minutes.'
      )
      return
    }

    setLoading(true)

    try {
      const request = `
Create a personalized study plan for a college student.

Subject:
${subject.trim()}

Topics to study:
${topics.trim()}

Number of study days:
${totalDays}

Available study time per day:
${minutes} minutes

Exam date:
${examDate || 'Not specified'}

Weak areas:
${weakAreas.trim() || 'Not specified'}

Create a realistic plan that fits the student's available time.

Prioritize weak areas.

Include learning, practice, revision and exam preparation where appropriate.

The plan must contain exactly ${totalDays} days.

Each day should have tasks whose total duration is reasonably close to ${minutes} minutes.

Return the required JSON structure only.
      `

      const { data, error: functionError } =
        await supabase.functions.invoke(
          'ai-assistant',
          {
            body: {
              type: 'study_plan',
              message: request,
            },
          }
        )

      if (functionError) {
        throw new Error(
          functionError.message
        )
      }

      if (!data?.plan?.plan) {
        throw new Error(
          'NovaPlan did not return a valid study plan.'
        )
      }

      const generatedPlan = {
        ...data.plan.plan,

        topics: topics.trim(),
        exam_date: examDate,
        weak_areas: weakAreas.trim(),

        // New generated plan starts with no completed tasks.
        completed_tasks: {},
      }

      const savedPlan =
        await savePlan(generatedPlan)

      setPlan(savedPlan.plan_data)
      setPlanId(savedPlan.id)

      setCompletedTasks(
        savedPlan.plan_data.completed_tasks || {}
      )

      setIsEditing(false)
      setShowForm(false)

      setSuccess(
        isEditing
          ? 'Your study plan has been updated successfully.'
          : 'Your new study plan has been created successfully.'
      )

      await loadSavedPlans(false)

    } catch (err) {
      console.error(
        'NovaPlan generation error:',
        err
      )

      setError(
        err?.message ||
          'Unable to generate your study plan right now.'
      )
    } finally {
      setLoading(false)
    }
  }

  // =========================================================
  // SAVE PLAN
  // =========================================================

  async function savePlan(planToSave) {
    const student =
      await getCurrentStudent()

    let savedData

    /*
      EDIT MODE
      ----------
      Update only the selected plan.
    */

    if (isEditing && planId) {
      const { data, error } =
        await supabase
          .from('study_plans')
          .update({
            subject: subject.trim(),
            goal: planToSave.goal || '',
            plan_data: planToSave,
          })
          .eq('id', planId)
          .eq('student_id', student.id)
          .select(
            'id, subject, goal, plan_data, created_at, updated_at'
          )
          .single()

      if (error) {
        throw error
      }

      savedData = data
    }

    /*
      CREATE MODE
      -----------
      Always INSERT a new plan.
      Existing plans are never overwritten.
    */

    else {
      const { data, error } =
        await supabase
          .from('study_plans')
          .insert({
            student_id: student.id,
            subject: subject.trim(),
            goal: planToSave.goal || '',
            plan_data: planToSave,
          })
          .select(
            'id, subject, goal, plan_data, created_at, updated_at'
          )
          .single()

      if (error) {
        throw error
      }

      savedData = data
    }

    return savedData
  }

  // =========================================================
  // DELETE PLAN
  // =========================================================

  async function deletePlan() {
    if (!planId || deleting) return

    const confirmed = window.confirm(
      'Are you sure you want to delete this study plan? This action cannot be undone.'
    )

    if (!confirmed) return

    setDeleting(true)
    setError('')
    setSuccess('')

    try {
      const student =
        await getCurrentStudent()

      const { error: deleteError } =
        await supabase
          .from('study_plans')
          .delete()
          .eq('id', planId)
          .eq('student_id', student.id)

      if (deleteError) {
        throw deleteError
      }

      setPlan(null)
      setPlanId(null)

      setSubject('')
      setTopics('')
      setDays('5')
      setDailyMinutes('60')
      setExamDate('')
      setWeakAreas('')

      setCompletedTasks({})

      setIsEditing(false)
      setShowForm(false)

      setSuccess(
        'Study plan deleted successfully.'
      )

      await loadSavedPlans(false)

    } catch (err) {
      console.error(
        'Delete NovaPlan error:',
        err
      )

      setError(
        err?.message ||
          'Unable to delete this study plan.'
      )
    } finally {
      setDeleting(false)
    }
  }

  // =========================================================
  // TASK COMPLETION
  // =========================================================

  async function toggleTask(
    dayIndex,
    taskIndex
  ) {
    const key = `${dayIndex}-${taskIndex}`

    const updatedCompletedTasks = {
      ...completedTasks,
      [key]: !completedTasks[key],
    }

    setCompletedTasks(
      updatedCompletedTasks
    )

    if (!plan || !planId) return

    const updatedPlan = {
      ...plan,
      completed_tasks:
        updatedCompletedTasks,
    }

    setPlan(updatedPlan)

    try {
      const { error: updateError } =
        await supabase
          .from('study_plans')
          .update({
            plan_data: updatedPlan,
          })
          .eq('id', planId)

      if (updateError) {
        console.error(
          'Task progress save error:',
          updateError
        )
      }

      setSavedPlans((currentPlans) =>
        currentPlans.map((item) =>
          item.id === planId
            ? {
                ...item,
                plan_data: updatedPlan,
              }
            : item
        )
      )
    } catch (err) {
      console.error(
        'Task progress save error:',
        err
      )
    }
  }

  // =========================================================
  // HELPERS
  // =========================================================

  function getTotalTasks() {
    if (!plan?.days) return 0

    return plan.days.reduce(
      (total, day) =>
        total +
        (Array.isArray(day.tasks)
          ? day.tasks.length
          : 0),
      0
    )
  }

  function getCompletedTaskCount() {
    return Object.values(
      completedTasks
    ).filter(Boolean).length
  }

  function getProgress() {
    const total = getTotalTasks()

    if (!total) return 0

    return Math.round(
      (getCompletedTaskCount() / total) *
        100
    )
  }

  function formatMinutes(minutes) {
    const value = Number(minutes)

    if (value < 60) {
      return `${value} min`
    }

    const hours = Math.floor(
      value / 60
    )

    const remaining = value % 60

    if (!remaining) {
      return `${hours} hr`
    }

    return `${hours} hr ${remaining} min`
  }

  function formatDate(dateValue) {
    if (!dateValue) return ''

    try {
      return new Date(
        dateValue
      ).toLocaleDateString(
        undefined,
        {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }
      )
    } catch {
      return ''
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingPlans) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#070b1a] text-white">
        <div className="flex flex-col items-center gap-4">
          <Loader2
            size={32}
            className="animate-spin text-violet-400"
          />

          <p className="text-sm text-slate-400">
            Loading your NovaPlans...
          </p>
        </div>
      </div>
    )
  }

  // =========================================================
  // UI
  // =========================================================

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      {/* =====================================================
          HEADER
      ====================================================== */}

      <header className="border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">

          <div className="flex items-center gap-3">

            <div className="flex h-14 w-14 shrink-0 items-center">
              <img
                src={logo}
                alt="NovaSphere"
                className="max-h-12 w-full object-contain object-left"
              />
            </div>

            <div>
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
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

        </div>
      </header>


      <main className="mx-auto w-full max-w-7xl px-6 py-10 lg:px-10">

        {/* ===================================================
            HERO
        ==================================================== */}

        <section className="mb-10">

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-400/10 px-3 py-1.5 text-xs font-medium text-violet-300">
            <Sparkles size={14} />
            AI PERSONALIZED PLANNER
          </div>

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

            <div>

              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Your{' '}
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  study plans
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Create, edit and manage personalized
                study plans built around your goals.
              </p>

            </div>

            <button
              type="button"
              onClick={startNewPlan}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-blue-500"
            >
              <Plus size={18} />
              Create New Plan
            </button>

          </div>

        </section>


        {/* ===================================================
            GLOBAL MESSAGES
        ==================================================== */}

        {error && (
          <div className="mb-6 rounded-xl border border-rose-400/20 bg-rose-400/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-6 rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-300">
            {success}
          </div>
        )}


        {/* ===================================================
            PLAN FORM
        ==================================================== */}

        {showForm && (
          <section className="nova-card mb-8 rounded-3xl p-6 sm:p-8">

            <div className="mb-7 flex items-start justify-between gap-4">

              <div className="flex items-center gap-3">

                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                  {isEditing ? (
                    <Edit3 size={22} />
                  ) : (
                    <Target size={22} />
                  )}
                </div>

                <div>

                  <h2 className="text-lg font-semibold">
                    {isEditing
                      ? 'Edit your study plan'
                      : 'Create a new study plan'}
                  </h2>

                  <p className="text-sm text-slate-500">
                    {isEditing
                      ? 'Update your inputs and NovaPlan will rebuild this plan.'
                      : 'Tell NovaPlan about your goal and let AI build your plan.'}
                  </p>

                </div>

              </div>

              <button
                type="button"
                onClick={
                  isEditing
                    ? cancelEditing
                    : () => setShowForm(false)
                }
                className="rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-white"
                aria-label="Close"
              >
                <X size={18} />
              </button>

            </div>


            <div className="grid gap-5 md:grid-cols-2">

              {/* Subject */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Subject
                </label>

                <input
                  value={subject}
                  onChange={(event) =>
                    setSubject(
                      event.target.value
                    )
                  }
                  placeholder="e.g. Electronic Devices"
                  className="w-full rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                />

              </div>


              {/* Exam date */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Exam date
                </label>

                <input
                  type="date"
                  value={examDate}
                  onChange={(event) =>
                    setExamDate(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                />

              </div>


              {/* Topics */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Topics to study
                </label>

                <textarea
                  value={topics}
                  onChange={(event) =>
                    setTopics(
                      event.target.value
                    )
                  }
                  rows={4}
                  placeholder="e.g. Diodes, Rectifiers, Zener diode, BJT, transistor biasing"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                />

              </div>


              {/* Days */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Study duration
                </label>

                <select
                  value={days}
                  onChange={(event) =>
                    setDays(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                >
                  <option value="1">
                    1 day
                  </option>
                  <option value="3">
                    3 days
                  </option>
                  <option value="5">
                    5 days
                  </option>
                  <option value="7">
                    7 days
                  </option>
                  <option value="10">
                    10 days
                  </option>
                  <option value="14">
                    14 days
                  </option>
                  <option value="21">
                    21 days
                  </option>
                  <option value="30">
                    30 days
                  </option>
                </select>

              </div>


              {/* Daily minutes */}

              <div>

                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Available time per day
                </label>

                <select
                  value={dailyMinutes}
                  onChange={(event) =>
                    setDailyMinutes(
                      event.target.value
                    )
                  }
                  className="w-full rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none focus:border-violet-400/50"
                >
                  <option value="30">
                    30 minutes
                  </option>
                  <option value="45">
                    45 minutes
                  </option>
                  <option value="60">
                    1 hour
                  </option>
                  <option value="90">
                    1.5 hours
                  </option>
                  <option value="120">
                    2 hours
                  </option>
                  <option value="180">
                    3 hours
                  </option>
                  <option value="240">
                    4 hours
                  </option>
                  <option value="360">
                    6 hours
                  </option>
                  <option value="480">
                    8 hours
                  </option>
                </select>

              </div>


              {/* Weak areas */}

              <div className="md:col-span-2">

                <label className="mb-2 block text-sm font-medium text-slate-300">

                  Weak areas

                  <span className="ml-2 text-xs font-normal text-slate-600">
                    Optional
                  </span>

                </label>

                <textarea
                  value={weakAreas}
                  onChange={(event) =>
                    setWeakAreas(
                      event.target.value
                    )
                  }
                  rows={3}
                  placeholder="e.g. Numerical problems and transistor biasing"
                  className="w-full resize-none rounded-xl border border-white/10 bg-[#0a1022] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-400/10"
                />

              </div>

            </div>


            <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

              <button
                type="button"
                onClick={
                  isEditing
                    ? cancelEditing
                    : () => setShowForm(false)
                }
                className="rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={generatePlan}
                disabled={loading}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />

                    {isEditing
                      ? 'Updating plan...'
                      : 'Building plan...'}
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />

                    {isEditing
                      ? 'Update Study Plan'
                      : 'Generate Study Plan'}
                  </>
                )}
              </button>

            </div>

          </section>
        )}


        {/* ===================================================
            SAVED PLANS
        ==================================================== */}

        {savedPlans.length > 0 && (
          <section className="mb-8">

            <div className="mb-4 flex items-center justify-between">

              <div>
                <h2 className="text-lg font-semibold">
                  Saved Plans
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  {savedPlans.length}{' '}
                  {savedPlans.length === 1
                    ? 'plan'
                    : 'plans'}{' '}
                  saved
                </p>
              </div>

            </div>


            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">

              {savedPlans.map(
                (savedPlan) => {
                  const planData =
                    savedPlan.plan_data ||
                    {}

                  const isActive =
                    savedPlan.id === planId

                  const totalTasks =
                    Array.isArray(
                      planData.days
                    )
                      ? planData.days.reduce(
                          (
                            total,
                            day
                          ) =>
                            total +
                            (Array.isArray(
                              day.tasks
                            )
                              ? day
                                  .tasks
                                  .length
                              : 0),
                          0
                        )
                      : 0

                  const completedCount =
                    Object.values(
                      planData.completed_tasks ||
                        {}
                    ).filter(
                      Boolean
                    ).length

                  const progress =
                    totalTasks
                      ? Math.round(
                          (completedCount /
                            totalTasks) *
                            100
                        )
                      : 0

                  return (
                    <button
                      key={
                        savedPlan.id
                      }
                      type="button"
                      onClick={() =>
                        openPlan(
                          savedPlan
                        )
                      }
                      className={`text-left rounded-2xl border p-5 transition ${
                        isActive
                          ? 'border-violet-400/40 bg-violet-500/10'
                          : 'border-white/10 bg-white/[0.025] hover:border-white/20 hover:bg-white/5'
                      }`}
                    >

                      <div className="flex items-start justify-between gap-3">

                        <div className="min-w-0">

                          <div className="truncate text-base font-semibold text-white">
                            {savedPlan.subject ||
                              'Study Plan'}
                          </div>

                          <div className="mt-1 text-xs text-slate-500">
                            Updated{' '}
                            {formatDate(
                              savedPlan.updated_at
                            )}
                          </div>

                        </div>

                        {isActive && (
                          <div className="rounded-full border border-violet-400/20 bg-violet-400/10 px-2.5 py-1 text-[10px] font-medium text-violet-300">
                            ACTIVE
                          </div>
                        )}

                      </div>


                      {savedPlan.goal && (
                        <p className="mt-3 line-clamp-2 text-sm leading-6 text-slate-400">
                          {savedPlan.goal}
                        </p>
                      )}


                      <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">

                        <span className="inline-flex items-center gap-1.5">
                          <CalendarDays size={13} />
                          {planData.total_days ||
                            planData.days
                              ?.length ||
                            0}{' '}
                          days
                        </span>

                        <span className="inline-flex items-center gap-1.5">
                          <Clock3 size={13} />
                          {formatMinutes(
                            planData.daily_minutes ||
                              60
                          )}
                        </span>

                        <span className="inline-flex items-center gap-1.5 text-emerald-400">
                          <CheckCircle2 size={13} />
                          {progress}%
                        </span>

                      </div>

                    </button>
                  )
                }
              )}

            </div>

          </section>
        )}


        {/* ===================================================
            EMPTY STATE
        ==================================================== */}

        {savedPlans.length === 0 &&
          !showForm && (
            <section className="nova-card rounded-3xl p-10 text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Target size={28} />
              </div>

              <h2 className="mt-5 text-xl font-semibold">
                No study plans yet
              </h2>

              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
                Create your first personalized
                NovaPlan and start turning your
                academic goals into daily actions.
              </p>

              <button
                type="button"
                onClick={startNewPlan}
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white"
              >
                <Plus size={18} />
                Create Your First Plan
              </button>

            </section>
          )}


        {/* ===================================================
            ACTIVE PLAN
        ==================================================== */}

        {plan && !showForm && (
          <section>

            <div className="nova-card mb-6 rounded-3xl p-6 sm:p-8">

              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                <div>

                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
                    <Sparkles size={14} />
                    SAVED NOVAPLAN
                  </div>

                  <h2 className="text-2xl font-bold">
                    {plan.title ||
                      'Your Study Plan'}
                  </h2>

                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                    {plan.goal}
                  </p>

                </div>


                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">

                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                    <CalendarDays
                      size={18}
                      className="mb-2 text-violet-300"
                    />

                    <div className="text-xl font-bold">
                      {plan.total_days ||
                        plan.days?.length ||
                        0}
                    </div>

                    <div className="text-xs text-slate-500">
                      Days
                    </div>

                  </div>


                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                    <Clock3
                      size={18}
                      className="mb-2 text-cyan-300"
                    />

                    <div className="text-xl font-bold">
                      {formatMinutes(
                        plan.daily_minutes ||
                          60
                      )}
                    </div>

                    <div className="text-xs text-slate-500">
                      Per day
                    </div>

                  </div>


                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">

                    <CheckCircle2
                      size={18}
                      className="mb-2 text-emerald-300"
                    />

                    <div className="text-xl font-bold">
                      {getProgress()}%
                    </div>

                    <div className="text-xs text-slate-500">
                      Complete
                    </div>

                  </div>

                </div>

              </div>


              {/* Progress */}

              <div className="mt-7">

                <div className="mb-2 flex items-center justify-between text-xs">

                  <span className="text-slate-500">
                    Plan progress
                  </span>

                  <span className="font-medium text-slate-300">
                    {getCompletedTaskCount()} /{' '}
                    {getTotalTasks()} tasks
                  </span>

                </div>

                <div className="h-2 overflow-hidden rounded-full bg-white/5">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-400 transition-all duration-500"
                    style={{
                      width: `${getProgress()}%`,
                    }}
                  />

                </div>

              </div>


              {/* Plan Actions */}

              <div className="mt-7 flex flex-col gap-3 border-t border-white/10 pt-6 sm:flex-row sm:flex-wrap">

                <button
                  type="button"
                  onClick={startEditing}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-400/20 bg-violet-400/10 px-5 py-3 text-sm font-semibold text-violet-300 transition hover:bg-violet-400/15"
                >
                  <Edit3 size={17} />
                  Edit Plan
                </button>


                <button
                  type="button"
                  onClick={startNewPlan}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-3 text-sm font-semibold text-cyan-300 transition hover:bg-cyan-400/15"
                >
                  <Plus size={17} />
                  Create New Plan
                </button>


                <button
                  type="button"
                  onClick={deletePlan}
                  disabled={deleting}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-400/10 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-400/15 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {deleting ? (
                    <Loader2
                      size={17}
                      className="animate-spin"
                    />
                  ) : (
                    <Trash2 size={17} />
                  )}

                  {deleting
                    ? 'Deleting...'
                    : 'Delete Plan'}
                </button>

              </div>

            </div>


            {/* Days */}

            <div className="space-y-5">

              {(plan.days || []).map(
                (day, dayIndex) => {

                  const tasks =
                    Array.isArray(
                      day.tasks
                    )
                      ? day.tasks
                      : []

                  const completedForDay =
                    tasks.filter(
                      (
                        _,
                        taskIndex
                      ) =>
                        completedTasks[
                          `${dayIndex}-${taskIndex}`
                        ]
                    ).length

                  return (
                    <div
                      key={
                        `${planId}-${dayIndex}`
                      }
                      className="nova-card rounded-3xl p-6"
                    >

                      <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                        <div className="flex items-start gap-4">

                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500/20 to-blue-500/20 text-sm font-bold text-violet-300">
                            {day.day}
                          </div>

                          <div>

                            <div className="text-xs font-medium uppercase tracking-[0.15em] text-violet-400">
                              Day {day.day}
                            </div>

                            <h3 className="mt-1 text-lg font-semibold">
                              {day.title}
                            </h3>

                            <p className="mt-1 text-sm text-slate-500">
                              Focus:{' '}
                              {day.focus}
                            </p>

                          </div>

                        </div>


                        <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-400">
                          {completedForDay}/
                          {tasks.length}{' '}
                          complete
                        </div>

                      </div>


                      <div className="space-y-3">

                        {tasks.map(
                          (
                            task,
                            taskIndex
                          ) => {

                            const key = `${dayIndex}-${taskIndex}`

                            const completed =
                              Boolean(
                                completedTasks[
                                  key
                                ]
                              )

                            return (
                              <button
                                key={
                                  taskIndex
                                }
                                type="button"
                                onClick={() =>
                                  toggleTask(
                                    dayIndex,
                                    taskIndex
                                  )
                                }
                                className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${
                                  completed
                                    ? 'border-emerald-400/20 bg-emerald-400/5'
                                    : 'border-white/10 bg-white/[0.025] hover:bg-white/5'
                                }`}
                              >

                                <div
                                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full border ${
                                    completed
                                      ? 'border-emerald-400 bg-emerald-400 text-[#070b1a]'
                                      : 'border-slate-600 text-transparent'
                                  }`}
                                >
                                  <CheckCircle2 size={16} />
                                </div>


                                <div className="min-w-0 flex-1">

                                  <div
                                    className={`text-sm font-medium ${
                                      completed
                                        ? 'text-slate-500 line-through'
                                        : 'text-slate-200'
                                    }`}
                                  >
                                    {
                                      task.title
                                    }
                                  </div>

                                </div>


                                <div className="flex shrink-0 items-center gap-1.5 text-xs text-slate-500">
                                  <Clock3
                                    size={
                                      14
                                    }
                                  />
                                  {formatMinutes(
                                    task.minutes
                                  )}
                                </div>

                              </button>
                            )
                          }
                        )}

                      </div>

                    </div>
                  )
                }
              )}

            </div>


            {/* Bottom actions */}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                type="button"
                onClick={startNewPlan}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
              >
                <Plus size={17} />
                Create New Plan
              </button>

              <button
                type="button"
                onClick={onBack}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:from-violet-500 hover:to-blue-500"
              >
                Back to Dashboard
              </button>

            </div>

          </section>
        )}

      </main>
    </div>
  )
}

export default NovaPlan