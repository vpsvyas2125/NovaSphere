import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  GraduationCap,
  KeyRound,
  LogOut,
  Mail,
  Shield,
  User,
  Users,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Settings({ onBack }) {
  const { user, profile, signOut } = useAuth()

  const [student, setStudent] = useState(null)
  const [studentClass, setStudentClass] = useState(null)

  const [loading, setLoading] = useState(true)
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadStudentData()
  }, [])

  async function loadStudentData() {
    try {
      setLoading(true)
      setError('')

      if (!profile?.id) {
        setLoading(false)
        return
      }

      const { data: studentData, error: studentError } =
        await supabase
          .from('students')
          .select(`
            id,
            profile_id,
            class_id,
            roll_number,
            register_number
          `)
          .eq('profile_id', profile.id)
          .maybeSingle()

      if (studentError) {
        throw studentError
      }

      setStudent(studentData)

      if (studentData?.class_id) {
        const { data: classData, error: classError } =
          await supabase
            .from('classes')
            .select(`
              id,
              name,
              section,
              class_code
            `)
            .eq('id', studentData.class_id)
            .maybeSingle()

        if (classError) {
          throw classError
        }

        setStudentClass(classData)
      } else {
        setStudentClass(null)
      }
    } catch (err) {
      console.error('Settings load error:', err)
      setError(
        err?.message ||
          'Unable to load your student information.'
      )
    } finally {
      setLoading(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()

    setMessage('')
    setError('')

    if (!password || !confirmPassword) {
      setError('Please enter and confirm your new password.')
      return
    }

    if (password.length < 6) {
      setError(
        'Password must contain at least 6 characters.'
      )
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.')
      return
    }

    try {
      setPasswordLoading(true)

      const { error: updateError } =
        await supabase.auth.updateUser({
          password,
        })

      if (updateError) {
        throw updateError
      }

      setPassword('')
      setConfirmPassword('')
      setMessage('Password updated successfully.')
    } catch (err) {
      console.error('Password update error:', err)
      setError(
        err?.message ||
          'Unable to update your password.'
      )
    } finally {
      setPasswordLoading(false)
    }
  }

  async function handleLogout() {
    try {
      await signOut()
    } catch (err) {
      console.error('Logout error:', err)
      setError('Unable to log out right now.')
    }
  }

  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Student'

  const email = user?.email || '—'

  const rollNumber =
    student?.roll_number ||
    student?.register_number ||
    'Not assigned'

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex min-h-20 w-full max-w-7xl items-center justify-between gap-4 px-6 lg:px-10">
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
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={17} />
            Back
          </button>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl px-6 py-8 lg:px-10">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-cyan-400">
            NovaSphere Settings
          </p>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Account & Settings
          </h1>

          <p className="mt-2 max-w-2xl text-slate-400">
            Manage your profile, academic information and
            account security.
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-200">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-6 flex items-center gap-3 rounded-2xl border border-emerald-400/20 bg-emerald-500/10 px-5 py-4 text-sm text-emerald-200">
            <CheckCircle2 size={18} />
            {message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Profile */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <User size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Profile
                </h2>
                <p className="text-sm text-slate-500">
                  Your NovaSphere account
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <User size={14} />
                  Full Name
                </div>

                <p className="text-sm font-medium text-white">
                  {displayName}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <Mail size={14} />
                  Email
                </div>

                <p className="break-all text-sm font-medium text-white">
                  {email}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                  <Shield size={14} />
                  Account Role
                </div>

                <p className="text-sm font-medium capitalize text-white">
                  {profile?.role || 'Student'}
                </p>
              </div>
            </div>
          </section>

          {/* Academic information */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/15 text-cyan-300">
                <GraduationCap size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Academic Information
                </h2>
                <p className="text-sm text-slate-500">
                  Your current academic details
                </p>
              </div>
            </div>

            {loading ? (
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5 text-sm text-slate-400">
                Loading academic information...
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <GraduationCap size={14} />
                    Class
                  </div>

                  <p className="text-sm font-medium text-white">
                    {studentClass
                      ? `${studentClass.name}${
                          studentClass.section
                            ? ` • Section ${studentClass.section}`
                            : ''
                        }`
                      : 'Not joined'}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <Users size={14} />
                    Class Code
                  </div>

                  <p className="font-mono text-sm font-medium text-cyan-300">
                    {studentClass?.class_code || '—'}
                  </p>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-1 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-slate-500">
                    <User size={14} />
                    Roll / Register Number
                  </div>

                  <p className="text-sm font-medium text-white">
                    {rollNumber}
                  </p>
                </div>
              </div>
            )}
          </section>

          {/* Change password */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/15 text-amber-300">
                <KeyRound size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Change Password
                </h2>
                <p className="text-sm text-slate-500">
                  Keep your account secure
                </p>
              </div>
            </div>

            <form
              onSubmit={handleChangePassword}
              className="space-y-4"
            >
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  New Password
                </label>

                <input
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(e.target.value)
                  }
                  placeholder="Enter new password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">
                  Confirm Password
                </label>

                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) =>
                    setConfirmPassword(e.target.value)
                  }
                  placeholder="Confirm new password"
                  className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/50 focus:ring-2 focus:ring-violet-500/10"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="w-full rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {passwordLoading
                  ? 'Updating...'
                  : 'Update Password'}
              </button>
            </form>
          </section>

          {/* Account */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-500/15 text-rose-300">
                <Shield size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Account
                </h2>
                <p className="text-sm text-slate-500">
                  Account actions
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-400/10 bg-rose-500/[0.03] p-5">
              <p className="text-sm leading-6 text-slate-400">
                You can safely sign out of NovaSphere from
                here. Your academic data remains securely
                stored in your account.
              </p>

              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
              >
                <LogOut size={17} />
                Log Out
              </button>
            </div>
          </section>
        </div>

        {/* App info */}
        <section className="nova-card mt-6 rounded-2xl border border-white/10 p-6">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-white">
                NovaSphere
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Smart Education Platform
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-medium uppercase tracking-wider text-slate-600">
                Learn • Grow • Achieve
              </p>

              <p className="mt-1 text-xs text-slate-600">
                SIH26207 • Smart Education
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}