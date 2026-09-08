import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  CalendarDays,
  Loader2,
  Megaphone,
  RefreshCw,
  Sparkles,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'

function CampusPulse({ onBack }) {
  const [announcements, setAnnouncements] = useState([])
  const [className, setClassName] = useState('')
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    loadAnnouncements()
  }, [])

  async function loadAnnouncements(isRefresh = false) {
    if (isRefresh) {
      setRefreshing(true)
    } else {
      setLoading(true)
    }

    setError('')

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        throw new Error('Please log in again.')
      }

      // -------------------------------------------------------
      // Find student's class
      // -------------------------------------------------------

      const { data: student, error: studentError } =
        await supabase
          .from('students')
          .select('id, class_id')
          .eq('profile_id', user.id)
          .maybeSingle()

      if (studentError) {
        throw studentError
      }

      if (!student) {
        throw new Error(
          'Your student profile could not be found.'
        )
      }

      if (!student.class_id) {
        setAnnouncements([])
        setClassName('')
        return
      }

      // -------------------------------------------------------
      // Load class
      // -------------------------------------------------------

      const { data: classData, error: classError } =
        await supabase
          .from('classes')
          .select('id, name')
          .eq('id', student.class_id)
          .maybeSingle()

      if (classError) {
        throw classError
      }

      setClassName(classData?.name || 'Your Class')

      // -------------------------------------------------------
      // Load announcements
      // -------------------------------------------------------

      const {
        data: announcementData,
        error: announcementError,
      } = await supabase
        .from('announcements')
        .select(
          'id, title, message, priority, created_at, created_by'
        )
        .eq('class_id', student.class_id)
        .order('created_at', {
          ascending: false,
        })

      if (announcementError) {
        throw announcementError
      }

      setAnnouncements(announcementData || [])
    } catch (err) {
      console.error('Campus Pulse error:', err)

      setError(
        err?.message ||
          'Unable to load Campus Pulse right now.'
      )
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''

    const date = new Date(dateString)

    if (Number.isNaN(date.getTime())) {
      return ''
    }

    return date.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  function getPriorityStyle(priority) {
    const value = String(priority || '').toLowerCase()

    if (
      value === 'high' ||
      value === 'urgent' ||
      value === 'important'
    ) {
      return {
        badge:
          'border-rose-400/20 bg-rose-400/10 text-rose-300',
        icon: 'bg-rose-400/10 text-rose-300',
        label: 'High Priority',
      }
    }

    if (value === 'medium') {
      return {
        badge:
          'border-amber-400/20 bg-amber-400/10 text-amber-300',
        icon: 'bg-amber-400/10 text-amber-300',
        label: 'Important',
      }
    }

    return {
      badge:
        'border-cyan-400/20 bg-cyan-400/10 text-cyan-300',
      icon: 'bg-cyan-400/10 text-cyan-300',
      label: 'Announcement',
    }
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      {/* Header */}
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
                Nova<span className="text-violet-400">Sphere</span>
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

      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
        {/* Hero */}
        <section className="mb-8">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
            <Sparkles size={14} />
            CAMPUS PULSE
          </div>

          <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                Stay in the{' '}
                <span className="bg-gradient-to-r from-violet-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  loop
                </span>
              </h1>

              <p className="mt-3 max-w-2xl text-slate-400">
                Important updates and announcements from your
                class, all in one place.
              </p>

              {className && (
                <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-400">
                  <Megaphone size={15} className="text-violet-400" />
                  {className}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => loadAnnouncements(true)}
              disabled={loading || refreshing}
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-slate-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw
                size={16}
                className={
                  refreshing ? 'animate-spin' : ''
                }
              />
              Refresh
            </button>
          </div>
        </section>

        {/* Error */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm text-rose-300">
            <AlertCircle
              size={19}
              className="mt-0.5 shrink-0"
            />

            <div>
              <div className="font-medium">
                Unable to load announcements
              </div>

              <div className="mt-1 text-rose-300/80">
                {error}
              </div>
            </div>
          </div>
        )}

        {/* Loading */}
        {loading && (
          <div className="nova-card flex min-h-[300px] items-center justify-center rounded-3xl">
            <div className="flex flex-col items-center gap-4">
              <Loader2
                size={32}
                className="animate-spin text-violet-400"
              />

              <p className="text-sm text-slate-500">
                Loading Campus Pulse...
              </p>
            </div>
          </div>
        )}

        {/* Empty state */}
        {!loading &&
          !error &&
          announcements.length === 0 && (
            <div className="nova-card flex min-h-[360px] flex-col items-center justify-center rounded-3xl px-6 text-center">
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Bell size={30} />
              </div>

              <h2 className="text-xl font-semibold">
                No announcements yet
              </h2>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
                Your class announcements will appear here when
                your coordinator posts an update.
              </p>
            </div>
          )}

        {/* Announcement Feed */}
        {!loading &&
          announcements.length > 0 && (
            <div className="space-y-4">
              {announcements.map((announcement) => {
                const priority = getPriorityStyle(
                  announcement.priority
                )

                return (
                  <article
                    key={announcement.id}
                    className="nova-card rounded-3xl p-6 transition hover:border-white/20"
                  >
                    <div className="flex gap-4">
                      <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${priority.icon}`}
                      >
                        <Megaphone size={20} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h2 className="text-lg font-semibold text-white">
                              {announcement.title ||
                                'Class Announcement'}
                            </h2>

                            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-slate-500">
                              <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={13} />
                                {formatDate(
                                  announcement.created_at
                                )}
                              </span>
                            </div>
                          </div>

                          <span
                            className={`inline-flex w-fit shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${priority.badge}`}
                          >
                            {priority.label}
                          </span>
                        </div>

                        {announcement.message && (
                          <div className="mt-5 rounded-2xl border border-white/5 bg-white/[0.025] p-4">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                              {announcement.message}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}

        {/* Bottom info */}
        {!loading && announcements.length > 0 && (
          <div className="mt-8 flex items-center justify-center gap-2 text-xs text-slate-600">
            <Bell size={13} />
            Showing the latest announcements for your class
          </div>
        )}
      </main>
    </div>
  )
}

export default CampusPulse