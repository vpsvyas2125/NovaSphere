import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  Loader2,
  Send,
  Sparkles,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'

const suggestions = [
  'Explain KVL in simple words',
  'How can I improve my attendance?',
  'Give me a study plan for tomorrow',
  'Explain Ohm’s law with an example',
]

function cleanAIResponse(text) {
  if (!text) return ''

  let cleaned = String(text)

  cleaned = cleaned.replace(/```[\s\S]*?```/g, (match) =>
    match
      .replace(/```[a-zA-Z0-9_-]*/g, '')
      .replace(/```/g, '')
  )

  cleaned = cleaned.replace(/\$\$/g, '')
  cleaned = cleaned.replace(/\\\(/g, '')
  cleaned = cleaned.replace(/\\\)/g, '')
  cleaned = cleaned.replace(/\\\[/g, '')
  cleaned = cleaned.replace(/\\\]/g, '')

  cleaned = cleaned.replace(/^\s*#{1,6}\s*/gm, '')

  cleaned = cleaned.replace(/\*\*\*(.*?)\*\*\*/gs, '$1')
  cleaned = cleaned.replace(/\*\*(.*?)\*\*/gs, '$1')
  cleaned = cleaned.replace(/__(.*?)__/gs, '$1')

  cleaned = cleaned.replace(
    /(?<!\*)\*(?!\s)(.*?)(?<!\s)\*(?!\*)/gs,
    '$1'
  )

  cleaned = cleaned.replace(
    /(?<!_)_(?!\s)(.*?)(?<!\s)_(?!_)/gs,
    '$1'
  )

  cleaned = cleaned.replace(/`([^`]+)`/g, '$1')

  cleaned = cleaned.replace(/^\s*[-*+]\s+/gm, '• ')

  cleaned = cleaned.replace(/^\s*(\d+)\.\s+/gm, '$1. ')

  cleaned = cleaned.replace(
    /\[([^\]]+)\]\([^)]+\)/g,
    '$1'
  )

  cleaned = cleaned.replace(
    /^\s*([-*_])(?:\s*\1){2,}\s*$/gm,
    ''
  )

  cleaned = cleaned.replace(/^\s*>\s?/gm, '')

  cleaned = cleaned.replace(/\|/g, ' ')

  cleaned = cleaned.replace(
    /\\([\\`*_{}\[\]()#+.!>~-])/g,
    '$1'
  )

  cleaned = cleaned.replace(/[ \t]+/g, ' ')
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n')

  return cleaned.trim()
}

export default function NovaAI({ onBack }) {
  const [message, setMessage] = useState('')
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function sendMessage(customMessage = null) {
    const text = String(customMessage ?? message).trim()

    if (!text || loading) return

    setError('')

    setMessages((previous) => [
      ...previous,
      {
        role: 'user',
        content: text,
      },
    ])

    setMessage('')
    setLoading(true)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('ai-assistant', {
          body: {
            type: 'chat',
            message: text,
          },
        })

      if (functionError) {
        console.error('Nova AI function error:', functionError)

        throw new Error(
          functionError.message ||
            'Nova AI could not process your question.'
        )
      }

      if (!data?.answer) {
        console.error('Unexpected Nova AI response:', data)

        throw new Error(
          'Nova AI did not return an answer.'
        )
      }

      const cleanedAnswer = cleanAIResponse(data.answer)

      setMessages((previous) => [
        ...previous,
        {
          role: 'assistant',
          content: cleanedAnswer,
        },
      ])
    } catch (err) {
      console.error('Nova AI error:', err)

      setError(
        err?.message ||
          'Unable to connect to Nova AI right now.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      <header className="border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="flex h-14 w-32 items-center">
              <img
                src={logo}
                alt="NovaSphere"
                className="max-h-12 w-full object-contain object-left"
              />
            </div>

            <div className="hidden sm:block">
              <div className="text-lg font-bold tracking-tight text-white">
                Nova<span className="text-violet-400">Sphere</span>
              </div>

              <div className="text-[8px] font-medium tracking-[0.18em] text-cyan-400">
                LEARN • GROW • ACHIEVE
              </div>
            </div>

          </div>

          <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={16} />
            Nova AI
          </div>

        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">

        <section className="mb-8">

          <div className="mb-3 flex items-center gap-3">

            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
              <Sparkles size={23} />
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                How can I help you learn?
              </h1>

              <p className="mt-1 text-slate-400">
                Ask Nova AI anything about your studies.
              </p>
            </div>

          </div>

        </section>

        {messages.length === 0 && (
          <section className="mb-8">

            <p className="mb-3 text-sm font-medium text-slate-400">
              Try asking
            </p>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">

              {suggestions.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => sendMessage(suggestion)}
                  className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left transition hover:border-violet-400/30 hover:bg-violet-500/[0.06]"
                >

                  <span className="text-sm text-slate-200">
                    {suggestion}
                  </span>

                  <ArrowRight
                    size={17}
                    className="text-slate-500 transition group-hover:translate-x-1 group-hover:text-violet-300"
                  />

                </button>
              ))}

            </div>

          </section>
        )}

        <section className="overflow-hidden rounded-3xl border border-white/10 bg-[#0d1328] shadow-2xl shadow-black/20">

          <div className="min-h-[420px] max-h-[620px] overflow-y-auto p-6">

            {messages.length === 0 && !loading && (
              <div className="flex min-h-[360px] items-center justify-center text-center">

                <div>

                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/10 text-violet-300">
                    <Sparkles size={28} />
                  </div>

                  <h2 className="text-lg font-semibold text-white">
                    Your AI study companion
                  </h2>

                  <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-400">
                    Ask questions, understand difficult concepts,
                    revise topics, or get help planning your studies.
                  </p>

                </div>

              </div>
            )}

            <div className="space-y-5">

              {messages.map((item, index) => (
                <div
                  key={`${item.role}-${index}`}
                  className={`flex ${
                    item.role === 'user'
                      ? 'justify-end'
                      : 'justify-start'
                  }`}
                >

                  <div
                    className={`max-w-[85%] rounded-2xl px-5 py-4 ${
                      item.role === 'user'
                        ? 'rounded-br-md bg-violet-600 text-white'
                        : 'rounded-bl-md border border-white/10 bg-[#111936] text-slate-200'
                    }`}
                  >

                    <div
                      className={`whitespace-pre-wrap text-sm leading-7 ${
                        item.role === 'user'
                          ? 'text-white'
                          : 'text-slate-200'
                      }`}
                    >
                      {item.content}
                    </div>

                  </div>

                </div>
              ))}

              {loading && (
                <div className="flex justify-start">

                  <div className="flex items-center gap-3 rounded-2xl rounded-bl-md border border-white/10 bg-[#111936] px-5 py-4 text-sm text-slate-400">

                    <Loader2
                      size={18}
                      className="animate-spin text-violet-400"
                    />

                    Nova AI is thinking...

                  </div>

                </div>
              )}

            </div>

          </div>

          {error && (
            <div className="mx-6 mb-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-300">
              {error}
            </div>
          )}

          <div className="border-t border-white/10 bg-[#0b1124] p-4">

            <div className="flex items-end gap-3 rounded-2xl border border-white/10 bg-white/[0.03] p-2 focus-within:border-violet-400/40">

              <textarea
                value={message}
                onChange={(event) =>
                  setMessage(event.target.value)
                }
                onKeyDown={handleKeyDown}
                placeholder="Ask Nova AI a question..."
                rows={2}
                disabled={loading}
                className="min-h-[52px] flex-1 resize-none bg-transparent px-3 py-3 text-sm text-white outline-none placeholder:text-slate-500 disabled:cursor-not-allowed"
              />

              <button
                type="button"
                onClick={() => sendMessage()}
                disabled={!message.trim() || loading}
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Send message"
              >
                {loading ? (
                  <Loader2
                    size={19}
                    className="animate-spin"
                  />
                ) : (
                  <Send size={19} />
                )}
              </button>

            </div>

            <p className="mt-2 text-center text-xs text-slate-600">
              Press Enter to send • Shift + Enter for a new line
            </p>

          </div>

        </section>

      </main>

    </div>
  )
}