import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  Bell,
  CheckCircle2,
  Loader2,
  Megaphone,
  Send,
  Trash2,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'
import { useAuth } from '../../contexts/AuthContext'

export default function Announcements({ onBack }) {
  const { profile } = useAuth()

  const [classes, setClasses] = useState([])
  const [announcements, setAnnouncements] = useState([])

  const [selectedClass, setSelectedClass] = useState('')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [priority, setPriority] = useState('normal')

  const [loading, setLoading] = useState(true)
  const [publishing, setPublishing] = useState(false)
  const [deletingId, setDeletingId] = useState(null)

  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [profile?.id])

  async function loadData() {
    if (!profile?.id) return

    setLoading(true)
    setError('')

    try {
      const { data: classData, error: classError } = await supabase
        .from('classes')
        .select('id, name, section, class_code')
        .eq('coordinator_id', profile.id)
        .order('name')

      if (classError) {
        throw classError
      }

      setClasses(classData || [])

      if (classData?.length > 0 && !selectedClass) {
        setSelectedClass(classData[0].id)
      }

      const classIds = (classData || []).map((item) => item.id)

      if (classIds.length === 0) {
        setAnnouncements([])
        return
      }

      const { data: announcementData, error: announcementError } =
        await supabase
          .from('announcements')
          .select(
            `
              id,
              class_id,
              title,
              message,
              priority,
              created_at,
              classes (
                name,
                section,
                class_code
              )
            `
          )
          .in('class_id', classIds)
          .order('created_at', { ascending: false })

      if (announcementError) {
        throw announcementError
      }

      setAnnouncements(announcementData || [])
    } catch (err) {
      console.error('Announcements load error:', err)
      setError(err.message || 'Failed to load announcements.')
    } finally {
      setLoading(false)
    }
  }

  async function publishAnnouncement() {
    setSuccess('')
    setError('')

    const cleanTitle = title.trim()
    const cleanMessage = message.trim()

    if (!selectedClass) {
      setError('Please select a class.')
      return
    }

    if (!cleanTitle) {
      setError('Please enter an announcement title.')
      return
    }

    if (!cleanMessage) {
      setError('Please enter an announcement message.')
      return
    }

    if (!profile?.id) {
      setError('Coordinator profile not found.')
      return
    }

    setPublishing(true)

    try {
      const { error: insertError } = await supabase
        .from('announcements')
        .insert({
          class_id: selectedClass,
          created_by: profile.id,
          title: cleanTitle,
          message: cleanMessage,
          priority,
        })

      if (insertError) {
        throw insertError
      }

      setTitle('')
      setMessage('')
      setPriority('normal')

      setSuccess('Announcement published successfully.')

      await loadData()
    } catch (err) {
      console.error('Publish announcement error:', err)
      setError(err.message || 'Failed to publish announcement.')
    } finally {
      setPublishing(false)
    }
  }

  async function deleteAnnouncement(id) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this announcement?'
    )

    if (!confirmed) return

    setDeletingId(id)
    setSuccess('')
    setError('')

    try {
      const { error: deleteError } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id)

      if (deleteError) {
        throw deleteError
      }

      setAnnouncements((current) =>
        current.filter((item) => item.id !== id)
      )

      setSuccess('Announcement deleted successfully.')
    } catch (err) {
      console.error('Delete announcement error:', err)
      setError(err.message || 'Failed to delete announcement.')
    } finally {
      setDeletingId(null)
    }
  }

  function formatDate(dateString) {
    if (!dateString) return ''

    return new Date(dateString).toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  function getPriorityClasses(value) {
    if (value === 'high') {
      return 'border-rose-400/20 bg-rose-500/10 text-rose-300'
    }

    if (value === 'low') {
      return 'border-cyan-400/20 bg-cyan-500/10 text-cyan-300'
    }

    return 'border-amber-400/20 bg-amber-500/10 text-amber-300'
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      {/* Header */}
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
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-white/10"
          >
            <ArrowLeft size={17} />
            Back to Dashboard
          </button>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-6 py-8 lg:px-10">
        {/* Page heading */}
        <div className="mb-8">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <Megaphone size={23} />
            </div>

            <div>
              <p className="text-sm font-medium text-violet-300">
                CAMPUS PULSE
              </p>

              <h1 className="text-3xl font-bold tracking-tight">
                Announcements
              </h1>
            </div>
          </div>

          <p className="max-w-2xl text-slate-400">
            Share important updates, academic notices and class
            announcements with your students.
          </p>
        </div>

        {/* Messages */}
        {success && (
          <div className="mb-5 flex items-center gap-3 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            <CheckCircle2 size={18} />
            {success}
          </div>
        )}

        {error && (
          <div className="mb-5 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
            {error}
          </div>
        )}

        {/* Create announcement */}
        <section className="nova-card mb-8 rounded-2xl border border-white/10 bg-[#0d1328] p-6">
          <div className="mb-6 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-500/10 text-blue-300">
              <Bell size={20} />
            </div>

            <div>
              <h2 className="text-lg font-semibold">
                Create Announcement
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Publish an update to one of your classes.
              </p>
            </div>
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            {/* Class */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Class
              </label>

              <select
                value={selectedClass}
                onChange={(event) =>
                  setSelectedClass(event.target.value)
                }
                disabled={loading || classes.length === 0}
                className="w-full rounded-xl border border-white/10 bg-[#111936] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {classes.length === 0 ? (
                  <option value="">No classes available</option>
                ) : (
                  classes.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                      {item.section ? ` - ${item.section}` : ''}
                      {item.class_code
                        ? ` (${item.class_code})`
                        : ''}
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Priority
              </label>

              <select
                value={priority}
                onChange={(event) =>
                  setPriority(event.target.value)
                }
                className="w-full rounded-xl border border-white/10 bg-[#111936] px-4 py-3 text-sm text-white outline-none transition focus:border-violet-400/50"
              >
                <option value="normal">Normal</option>
                <option value="high">High Priority</option>
                <option value="low">Low Priority</option>
              </select>
            </div>

            {/* Title */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Announcement Title
              </label>

              <input
                type="text"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="e.g. Internal Examination Schedule"
                maxLength={120}
                className="w-full rounded-xl border border-white/10 bg-[#111936] px-4 py-3 text-sm text-white placeholder:text-slate-600 outline-none transition focus:border-violet-400/50"
              />
            </div>

            {/* Message */}
            <div className="md:col-span-2">
              <label className="mb-2 block text-sm font-medium text-slate-300">
                Message
              </label>

              <textarea
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Write the announcement for your students..."
                rows={5}
                maxLength={1000}
                className="w-full resize-none rounded-xl border border-white/10 bg-[#111936] px-4 py-3 text-sm leading-6 text-white placeholder:text-slate-600 outline-none transition focus:border-violet-400/50"
              />

              <div className="mt-2 text-right text-xs text-slate-600">
                {message.length}/1000
              </div>
            </div>
          </div>

          <div className="mt-5 flex justify-end">
            <button
              type="button"
              onClick={publishAnnouncement}
              disabled={publishing || loading || classes.length === 0}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {publishing ? (
                <>
                  <Loader2 size={17} className="animate-spin" />
                  Publishing...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Publish Announcement
                </>
              )}
            </button>
          </div>
        </section>

        {/* Existing announcements */}
        <section>
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">
                Published Announcements
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Recent updates shared with your classes.
              </p>
            </div>

            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {announcements.length}{' '}
              {announcements.length === 1
                ? 'announcement'
                : 'announcements'}
            </span>
          </div>

          {loading ? (
            <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-[#0d1328]">
              <Loader2
                size={28}
                className="animate-spin text-violet-400"
              />
            </div>
          ) : announcements.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-white/10 bg-[#0d1328] px-6 py-14 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                <Megaphone size={25} />
              </div>

              <h3 className="font-semibold">
                No announcements yet
              </h3>

              <p className="mx-auto mt-2 max-w-md text-sm text-slate-500">
                Create your first announcement above to keep your
                students informed.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {announcements.map((announcement) => (
                <article
                  key={announcement.id}
                  className="rounded-2xl border border-white/10 bg-[#0d1328] p-5 transition hover:border-white/15"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${getPriorityClasses(
                            announcement.priority
                          )}`}
                        >
                          {announcement.priority || 'normal'}
                        </span>

                        <span className="text-xs text-slate-500">
                          {announcement.classes?.name || 'Class'}
                          {announcement.classes?.section
                            ? ` - ${announcement.classes.section}`
                            : ''}
                        </span>
                      </div>

                      <h3 className="text-lg font-semibold text-white">
                        {announcement.title}
                      </h3>

                      <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-400">
                        {announcement.message}
                      </p>

                      <p className="mt-4 text-xs text-slate-600">
                        Published {formatDate(announcement.created_at)}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        deleteAnnouncement(announcement.id)
                      }
                      disabled={deletingId === announcement.id}
                      className="flex shrink-0 items-center justify-center gap-2 rounded-xl border border-rose-400/10 bg-rose-500/5 px-3 py-2 text-xs font-medium text-rose-300 transition hover:bg-rose-500/10 disabled:opacity-50"
                    >
                      {deletingId === announcement.id ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <Trash2 size={15} />
                      )}

                      Delete
                    </button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}