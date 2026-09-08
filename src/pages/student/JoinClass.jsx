import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Users,
  AlertCircle,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function JoinClass({ onBack, onJoined }) {
  const { user, profile } = useAuth()

  const [classCode, setClassCode] = useState('')
  const [loading, setLoading] = useState(false)

  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  async function handleJoinClass(event) {
    event.preventDefault()

    const cleanedCode = classCode
      .trim()
      .toUpperCase()

    if (!cleanedCode) {
      setMessage('Please enter your class code.')
      setMessageType('error')
      return
    }

    if (!user?.id) {
      setMessage('Your account session is unavailable. Please sign in again.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      // Find the class using the class code.
      const {
        data: classData,
        error: classError,
      } = await supabase
        .from('classes')
        .select('id, name, section, class_code')
        .eq('class_code', cleanedCode)
        .maybeSingle()

      if (classError) {
        throw classError
      }

      if (!classData) {
        setMessage(
          'Class not found. Please check the code and try again.'
        )
        setMessageType('error')
        setLoading(false)
        return
      }

      // Find the student's record.
    const { data: student, error: studentError } = await supabase
  .from('students')
  .select('id, class_id')
  .eq('profile_id', profile.id)
  .maybeSingle()

if (studentError) {
  throw studentError
}

let studentRecord = student

// If the student record doesn't exist yet, create it automatically.
if (!studentRecord) {
  const { data: newStudent, error: createStudentError } = await supabase
    .from('students')
    .insert({
      profile_id: profile.id,
    })
    .select('id, class_id')
    .single()

  if (createStudentError) {
    throw createStudentError
  }

  studentRecord = newStudent
}

      // Prevent unnecessary re-joining.
      if (studentRecord.class_id === classData.id) {
        setMessage(
          `You are already enrolled in ${classData.name}.`
        )
        setMessageType('success')
        setLoading(false)
        return
      }

      // Update student's class.
      const {
  error: updateError,
} = await supabase
  .from('students')
  .update({
    class_id: classData.id,
  })
  .eq('id', studentRecord.id)

      if (updateError) {
        throw updateError
      }

      setMessage(
        `Successfully joined ${classData.name}${classData.section ? ` - Section ${classData.section}` : ''}.`
      )
      setMessageType('success')

      setClassCode('')

      if (onJoined) {
        setTimeout(() => {
          onJoined(classData)
        }, 1000)
      }
    } catch (error) {
      console.error('Join class error:', error)

      setMessage(
        error?.message ||
          'Unable to join the class. Please try again.'
      )
      setMessageType('error')
    } finally {
      setLoading(false)
    }
  }

  const studentName =
    profile?.full_name ||
    profile?.email?.split('@')[0] ||
    'Student'

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
                {studentName}
              </p>

              <p className="text-xs text-slate-500">
                Student
              </p>
            </div>

            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-violet-500/20">
              {studentName
                .charAt(0)
                .toUpperCase()}
            </div>

          </div>

        </div>
      </header>


      {/* CONTENT */}
      <div className="mx-auto w-full max-w-4xl px-6 py-10 lg:px-10">

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
            <GraduationCap className="h-4 w-4" />
            CLASS CONNECTION
          </div>

          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Join your class
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Enter the class code shared by your coordinator to connect
            your NovaSphere account with your class.
          </p>

        </section>


        {/* JOIN CARD */}
        <section className="nova-card mx-auto max-w-2xl rounded-3xl p-7 sm:p-9">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10">
            <Users className="h-8 w-8 text-violet-300" />
          </div>

          <div className="mt-6 text-center">

            <h2 className="text-2xl font-bold">
              Enter Class Code
            </h2>

            <p className="mt-2 text-sm leading-6 text-slate-500">
              Ask your class coordinator for the unique
              NovaSphere class code.
            </p>

          </div>


          {/* MESSAGE */}
          {message && (
            <div
              className={`mt-6 flex items-start gap-3 rounded-2xl border px-5 py-4 ${
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


          {/* FORM */}
          <form
            onSubmit={handleJoinClass}
            className="mt-7"
          >

            <label
              htmlFor="classCode"
              className="mb-2 block text-sm font-medium text-slate-300"
            >
              Class code
            </label>

            <input
              id="classCode"
              type="text"
              value={classCode}
              onChange={(event) =>
                setClassCode(event.target.value.toUpperCase())
              }
              placeholder="Example: NS-A4F82C"
              maxLength={9}
              autoComplete="off"
              required
              className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center font-mono text-lg font-bold tracking-[0.2em] text-white uppercase outline-none transition placeholder:text-sm placeholder:font-normal placeholder:tracking-normal placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
            />

            <button
              type="submit"
              disabled={loading}
              className="nova-gradient mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:-translate-y-0.5 hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Joining class...
                </>
              ) : (
                <>
                  <Users className="h-4 w-4" />
                  Join Class
                </>
              )}

            </button>

          </form>


          {/* INFO */}
          <div className="mt-7 rounded-2xl border border-cyan-400/10 bg-cyan-400/[0.03] p-4">

            <div className="flex gap-3">

              <GraduationCap className="mt-0.5 h-5 w-5 shrink-0 text-cyan-300" />

              <div>

                <p className="text-sm font-semibold text-white">
                  How it works
                </p>

                <p className="mt-1 text-xs leading-5 text-slate-500">
                  Once you join, your class subjects will become
                  available in your Academic Orbit and your coordinator
                  will be able to see you in the class.
                </p>

              </div>

            </div>

          </div>

        </section>

      </div>
    </main>
  )
}