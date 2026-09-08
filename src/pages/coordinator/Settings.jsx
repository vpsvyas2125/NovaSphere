import {
  ArrowLeft,
  GraduationCap,
  LogOut,
  Mail,
  Shield,
  User,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { useAuth } from '../../contexts/AuthContext'

export default function CoordinatorSettings({ onBack }) {
  const { user, profile, signOut } = useAuth()

  async function handleLogout() {
    try {
      await signOut()
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const displayName =
    profile?.full_name ||
    profile?.name ||
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'Coordinator'

  const email = user?.email || '—'

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      {/* HEADER */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">

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
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft size={17} />
            Back
          </button>

        </div>
      </header>

      {/* MAIN */}
      <main className="mx-auto max-w-5xl px-6 py-8 lg:px-10">

        <div className="mb-8">
          <p className="text-sm font-medium uppercase tracking-[0.18em] text-cyan-400">
            NovaSphere Settings
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Coordinator Settings
          </h1>

          <p className="mt-2 text-slate-400">
            Manage your coordinator account and profile information.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">

          {/* PROFILE */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">

            <div className="mb-6 flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
                <User size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Profile
                </h2>

                <p className="text-sm text-slate-500">
                  Coordinator account
                </p>
              </div>

            </div>

            <div className="space-y-4">

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <User size={14} />
                  Full Name
                </div>

                <p className="text-sm font-medium text-white">
                  {displayName}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <Mail size={14} />
                  Email
                </div>

                <p className="break-all text-sm font-medium text-white">
                  {email}
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4">
                <div className="mb-1 flex items-center gap-2 text-xs uppercase tracking-wider text-slate-500">
                  <Shield size={14} />
                  Account Role
                </div>

                <p className="text-sm font-medium capitalize text-white">
                  {profile?.role || 'Coordinator'}
                </p>
              </div>

            </div>

          </section>

          {/* ROLE */}
          <section className="nova-card rounded-2xl border border-white/10 p-6">

            <div className="mb-6 flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
                <GraduationCap size={23} />
              </div>

              <div>
                <h2 className="text-lg font-semibold">
                  Coordinator Access
                </h2>

                <p className="text-sm text-slate-500">
                  NovaSphere management role
                </p>
              </div>

            </div>

            <div className="rounded-xl border border-cyan-400/10 bg-cyan-500/[0.04] p-5">

              <p className="text-sm leading-6 text-slate-400">
                As a Class Coordinator, you can manage
                your class, attendance, marks, academic
                risk information and announcements.
              </p>

              <div className="mt-5 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-4">

                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-300">
                  <Shield size={18} />
                </div>

                <div>
                  <p className="text-sm font-medium text-white">
                    Coordinator
                  </p>

                  <p className="text-xs text-slate-500">
                    Class management access
                  </p>
                </div>

              </div>

            </div>

          </section>

        </div>

        {/* LOGOUT */}
        <section className="nova-card mt-6 rounded-2xl border border-white/10 p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div>

              <h2 className="text-lg font-semibold">
                Account
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Sign out of your NovaSphere coordinator account.
              </p>

            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-300 transition hover:bg-rose-500/20"
            >
              <LogOut size={17} />
              Log Out
            </button>

          </div>

        </section>

        {/* APP INFO */}
        <section className="nova-card mt-6 rounded-2xl border border-white/10 p-6">

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

            <div>
              <p className="font-semibold text-white">
                NovaSphere
              </p>

              <p className="mt-1 text-sm text-slate-500">
                Smart Education Platform
              </p>
            </div>

            <div className="text-left sm:text-right">
              <p className="text-xs font-medium tracking-[0.15em] text-cyan-400">
                LEARN • GROW • ACHIEVE
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