import { useState } from 'react'
import {
  ArrowRight,
  Sparkles,
  Eye,
  EyeOff,
  UserPlus,
  LogIn,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'

export default function Login() {
  const [isSignup, setIsSignup] = useState(false)

  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState('')

  function switchMode() {
    setIsSignup((current) => !current)

    setMessage('')
    setMessageType('')

    setFullName('')
    setEmail('')
    setPassword('')
  }

  async function handleLogin(event) {
    event.preventDefault()

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        })

      if (error) {
        throw error
      }

      if (!data.user) {
        throw new Error('Login failed. Please try again.')
      }

      const { data: profile, error: profileError } =
        await supabase
          .from('profiles')
          .select('full_name, email, role')
          .eq('id', data.user.id)
          .single()

      if (profileError) {
        console.error('Profile error:', profileError)
      }

      setMessage(
        `Welcome back${
          profile?.full_name
            ? `, ${profile.full_name}`
            : ''
        }!`
      )

      setMessageType('success')

      console.log('NovaSphere login successful:', {
        user: data.user,
        profile,
        role: profile?.role,
        rememberMe,
      })

    } catch (error) {
      console.error('Login error:', error)

      setMessage(
        error?.message ||
          'Unable to sign in. Please check your details.'
      )

      setMessageType('error')

    } finally {
      setLoading(false)
    }
  }

  async function handleSignup(event) {
    event.preventDefault()

    if (password.length < 6) {
      setMessage(
        'Password must contain at least 6 characters.'
      )
      setMessageType('error')
      return
    }

    if (!fullName.trim()) {
      setMessage('Please enter your full name.')
      setMessageType('error')
      return
    }

    setLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const { data, error } =
        await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            data: {
              full_name: fullName.trim(),

              // Public signup is always a Student account.
              // Coordinator accounts are created separately.
              role: 'student',
            },
          },
        })

      if (error) {
        throw error
      }

      if (data.session) {
        setMessage(
          'Student account created successfully. You are now signed in.'
        )

        setMessageType('success')
      } else {
        setMessage(
          'Student account created! Please check your email to confirm your account before signing in.'
        )

        setMessageType('success')
      }

      console.log('NovaSphere student signup successful:', data)

    } catch (error) {
      console.error('Signup error:', error)

      setMessage(
        error?.message ||
          'Unable to create your account.'
      )

      setMessageType('error')

    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#070b1a] text-white">

      {/* =========================
          AMBIENT BACKGROUND
      ========================== */}

      <div className="pointer-events-none absolute inset-0">

        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl nova-pulse" />

        <div
          className="absolute -bottom-40 -right-32 h-[30rem] w-[30rem] rounded-full bg-blue-600/20 blur-3xl nova-pulse"
          style={{ animationDelay: '1.5s' }}
        />

        <div
          className="absolute left-[45%] top-[35%] h-72 w-72 rounded-full bg-cyan-500/10 blur-3xl nova-pulse"
          style={{ animationDelay: '3s' }}
        />

      </div>


      {/* =========================
          DECORATIVE PARTICLES
      ========================== */}

      <div className="pointer-events-none absolute inset-0">

        <span className="absolute left-[10%] top-[20%] h-1 w-1 rounded-full bg-cyan-300/70" />

        <span className="absolute left-[28%] top-[75%] h-1.5 w-1.5 rounded-full bg-violet-300/60" />

        <span className="absolute left-[58%] top-[15%] h-1 w-1 rounded-full bg-blue-300/70" />

        <span className="absolute right-[14%] top-[30%] h-1.5 w-1.5 rounded-full bg-cyan-300/60" />

        <span className="absolute right-[25%] bottom-[18%] h-1 w-1 rounded-full bg-violet-300/70" />

        <span className="absolute left-[48%] bottom-[10%] h-1 w-1 rounded-full bg-blue-300/60" />

      </div>


      {/* =========================
          MAIN CONTAINER
      ========================== */}

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl items-center px-6 py-10 lg:px-12">

        <div className="grid w-full items-center gap-14 lg:grid-cols-2">


          {/* =========================
              LEFT SIDE
          ========================== */}

          <section className="hidden lg:block">

            <div className="max-w-xl">

              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 backdrop-blur-xl">

                <Sparkles className="h-4 w-4 text-cyan-300" />

                Your academic universe

              </div>


              <img
                src={logo}
                alt="NovaSphere"
                className="mb-8 h-auto w-72 object-contain"
              />


              <h1 className="text-5xl font-bold leading-tight tracking-tight">

                Learn smarter.

                <br />

                <span className="nova-text-gradient">
                  Grow stronger.
                </span>

              </h1>


              <p className="mt-6 max-w-lg text-lg leading-8 text-slate-400">

                One intelligent space for your classes, progress,
                study plans, quizzes, notes and AI-powered learning.

              </p>


              <div className="mt-10 flex items-center gap-8 text-sm text-slate-500">

                <div>

                  <div className="text-lg font-semibold text-white">
                    AI
                  </div>

                  <div>
                    Powered learning
                  </div>

                </div>


                <div className="h-8 w-px bg-white/10" />


                <div>

                  <div className="text-lg font-semibold text-white">
                    Smart
                  </div>

                  <div>
                    Academic insights
                  </div>

                </div>


                <div className="h-8 w-px bg-white/10" />


                <div>

                  <div className="text-lg font-semibold text-white">
                    Personal
                  </div>

                  <div>
                    Study experience
                  </div>

                </div>

              </div>

            </div>

          </section>


          {/* =========================
              RIGHT SIDE
          ========================== */}

          <section className="mx-auto w-full max-w-md lg:ml-auto">

            <div className="nova-card nova-glow rounded-3xl p-7 sm:p-9">


              {/* Mobile Logo */}

              <div className="mb-8 flex justify-center lg:hidden">

                <img
                  src={logo}
                  alt="NovaSphere"
                  className="h-auto w-52 object-contain"
                />

              </div>


              {/* =========================
                  HEADER
              ========================== */}

              <div className="mb-7">

                <div className="mb-2 flex items-center gap-2">

                  {isSignup ? (
                    <UserPlus className="h-4 w-4 text-cyan-300" />
                  ) : (
                    <LogIn className="h-4 w-4 text-cyan-300" />
                  )}

                  <p className="text-sm font-medium text-cyan-300">

                    {isSignup
                      ? 'Start your journey'
                      : 'Welcome back'}

                  </p>

                </div>


                <h2 className="text-3xl font-bold tracking-tight">

                  {isSignup
                    ? 'Create your universe'
                    : 'Enter your universe'}

                </h2>


                <p className="mt-2 text-sm leading-6 text-slate-400">

                  {isSignup
                    ? 'Create your NovaSphere student account and begin learning smarter.'
                    : 'Sign in to continue your learning journey.'}

                </p>

              </div>


              {/* =========================
                  MESSAGE
              ========================== */}

              {message && (

                <div
                  className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 text-sm ${
                    messageType === 'success'
                      ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                      : 'border-rose-400/20 bg-rose-400/10 text-rose-300'
                  }`}
                >

                  {messageType === 'success' ? (
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  )}

                  <span>
                    {message}
                  </span>

                </div>

              )}


              {/* =========================
                  FORM
              ========================== */}

              <form
                className="space-y-5"
                onSubmit={
                  isSignup
                    ? handleSignup
                    : handleLogin
                }
              >


                {/* Full name — signup only */}

                {isSignup && (

                  <div>

                    <label
                      htmlFor="fullName"
                      className="mb-2 block text-sm font-medium text-slate-300"
                    >
                      Full name
                    </label>

                    <input
                      id="fullName"
                      type="text"
                      value={fullName}
                      onChange={(event) =>
                        setFullName(event.target.value)
                      }
                      placeholder="Enter your full name"
                      autoComplete="name"
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
                    />

                  </div>

                )}


                {/* Email */}

                <div>

                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-medium text-slate-300"
                  >
                    Email address
                  </label>

                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="you@example.com"
                    autoComplete="email"
                    required
                    className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
                  />

                </div>


                {/* Password */}

                <div>

                  <div className="mb-2 flex items-center justify-between">

                    <label
                      htmlFor="password"
                      className="text-sm font-medium text-slate-300"
                    >
                      Password
                    </label>

                    {!isSignup && (

                      <button
                        type="button"
                        className="text-xs font-medium text-violet-300 transition hover:text-violet-200"
                      >
                        Forgot password?
                      </button>

                    )}

                  </div>


                  <div className="relative">

                    <input
                      id="password"
                      type={
                        showPassword
                          ? 'text'
                          : 'password'
                      }
                      value={password}
                      onChange={(event) =>
                        setPassword(event.target.value)
                      }
                      placeholder={
                        isSignup
                          ? 'Create a password'
                          : 'Enter your password'
                      }
                      autoComplete={
                        isSignup
                          ? 'new-password'
                          : 'current-password'
                      }
                      required
                      className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 py-3.5 pr-12 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/60 focus:bg-white/[0.06] focus:ring-4 focus:ring-violet-500/10"
                    />


                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword(
                          (current) => !current
                        )
                      }
                      aria-label={
                        showPassword
                          ? 'Hide password'
                          : 'Show password'
                      }
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-slate-500 transition hover:bg-white/5 hover:text-slate-300"
                    >

                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}

                    </button>

                  </div>

                </div>


                {/* Remember me */}

                {!isSignup && (

                  <label className="flex cursor-pointer items-center gap-3 text-sm text-slate-400">

                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(event) =>
                        setRememberMe(event.target.checked)
                      }
                      className="h-4 w-4 rounded border-white/20 bg-white/5 accent-violet-600"
                    />

                    Remember me

                  </label>

                )}


                {/* Submit */}

                <button
                  type="submit"
                  disabled={loading}
                  className="nova-gradient nova-shimmer group flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3.5 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition duration-200 hover:-translate-y-0.5 hover:shadow-violet-900/40 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />

                      {isSignup
                        ? 'Creating account...'
                        : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {isSignup
                        ? 'Create NovaSphere Account'
                        : 'Enter NovaSphere'}

                      {isSignup ? (
                        <UserPlus className="h-4 w-4" />
                      ) : (
                        <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      )}
                    </>
                  )}

                </button>

              </form>


              {/* =========================
                  SWITCH LOGIN / SIGNUP
              ========================== */}

              <div className="mt-8 text-center text-sm text-slate-500">

                {isSignup
                  ? 'Already have an account?'
                  : 'New to NovaSphere?'}

                <button
                  type="button"
                  onClick={switchMode}
                  className="ml-1 font-semibold text-violet-300 transition hover:text-violet-200"
                >

                  {isSignup
                    ? 'Sign in'
                    : 'Create your account'}

                </button>

              </div>

            </div>


            {/* Footer */}

            <p className="mt-6 text-center text-xs text-slate-600">
              NovaSphere • Learn • Grow • Achieve
            </p>

          </section>

        </div>

      </div>

    </main>
  )
}