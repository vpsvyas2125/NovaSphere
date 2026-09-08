import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { extractPdfText } from '../../lib/pdf'
import { supabase } from '../../lib/supabase'
import ReactMarkdown from 'react-markdown'

export default function NovaDocs({ onBack }) {
  const [selectedFile, setSelectedFile] = useState(null)

  const [pdfText, setPdfText] = useState('')
  const [pageCount, setPageCount] = useState(0)

  const [extracting, setExtracting] = useState(false)
  const [summarizing, setSummarizing] = useState(false)

  const [summary, setSummary] = useState('')
  const [error, setError] = useState('')

  function handleFileChange(event) {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    setError('')
    setPdfText('')
    setSummary('')
    setPageCount(0)

    if (file.type !== 'application/pdf') {
      setSelectedFile(null)
      setError('Please select a valid PDF file.')
      return
    }

    setSelectedFile(file)
  }

  function removeSelectedFile() {
    setSelectedFile(null)
    setPdfText('')
    setSummary('')
    setPageCount(0)
    setError('')
  }

  async function handleExtractPdf() {
    if (!selectedFile) {
      setError('Please select a PDF file first.')
      return
    }

    setExtracting(true)
    setError('')
    setPdfText('')
    setSummary('')
    setPageCount(0)

    try {
      const result = await extractPdfText(selectedFile)

      setPdfText(result.text)
      setPageCount(result.pageCount)
    } catch (err) {
      console.error('PDF extraction error:', err)

      setPdfText('')
      setPageCount(0)

      setError(
        err?.message ||
          'Unable to extract text from this PDF.'
      )
    } finally {
      setExtracting(false)
    }
  }

  async function handleSummarizePdf() {
    if (!pdfText) {
      setError('Please extract the PDF text first.')
      return
    }

    setSummarizing(true)
    setError('')
    setSummary('')

    try {
      /*
       * Keep the PDF request within a safe size.
       */
      const limitedText = pdfText.slice(0, 30000)

      const { data, error: functionError } =
        await supabase.functions.invoke('ai-assistant', {
          body: {
            type: 'pdf_summary',

            message: `
You are summarizing the following PDF content.

PDF CONTENT:

${limitedText}
            `,
          },
        })

      if (functionError) {
        console.error(
          'AI function error:',
          functionError
        )

        throw new Error(
          functionError.message ||
            'The AI service could not process the PDF.'
        )
      }

      if (!data?.answer) {
        throw new Error(
          'Nova AI did not return a summary.'
        )
      }

      setSummary(data.answer)
    } catch (err) {
      console.error(
        'PDF summarization error:',
        err
      )

      setError(
        err?.message ||
          'Unable to summarize this PDF right now.'
      )
    } finally {
      setSummarizing(false)
    }
  }

  function handleMainAction() {
    if (pdfText) {
      handleSummarizePdf()
    } else {
      handleExtractPdf()
    }
  }

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">
      {/* Header */}
      <header className="h-20 border-b border-white/10 bg-[#070b1a]/95">
        <div className="mx-auto flex h-full w-full max-w-7xl items-center justify-between px-6 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Back"
            >
              <ArrowLeft size={19} />
            </button>

            <div className="h-14 w-32">
              <img
                src={logo}
                alt="NovaSphere"
                className="h-full w-full object-contain object-left"
              />
            </div>
          </div>

          <div className="hidden items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-300 sm:flex">
            <Sparkles size={16} />
            NovaDocs
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl px-6 py-10 lg:px-10">
        {/* Intro */}
        <section className="mb-8">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5 text-xs font-medium text-cyan-300">
            <FileText size={14} />
            AI PDF Study Assistant
          </div>

          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Turn your PDF into{' '}
            <span className="nova-text-gradient">
              study-ready knowledge.
            </span>
          </h1>

          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
            Upload your study material and NovaSphere will extract
            the text and transform it into a clear,
            exam-focused summary.
          </p>
        </section>

        {/* Upload Card */}
        <section className="nova-card rounded-3xl p-6 sm:p-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">
              Upload your PDF
            </h2>

            <p className="mt-1 text-sm text-slate-400">
              Select a text-based PDF from your device.
            </p>
          </div>

          {!selectedFile ? (
            <label
              htmlFor="pdf-upload"
              className="group flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-violet-400/30 bg-violet-500/[0.04] px-6 py-14 text-center transition hover:border-violet-400/50 hover:bg-violet-500/[0.08]"
            >
              <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-500/15 text-violet-300 transition group-hover:scale-105">
                <Upload size={28} />
              </div>

              <h3 className="text-lg font-semibold text-white">
                Choose a PDF file
              </h3>

              <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                Click here to browse your device and select your
                study material.
              </p>

              <span className="mt-5 rounded-xl bg-violet-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-violet-500">
                Select PDF
              </span>

              <input
                id="pdf-upload"
                type="file"
                accept="application/pdf,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-500/10 text-red-300">
                    <FileText size={23} />
                  </div>

                  <div className="min-w-0">
                    <p className="truncate font-medium text-white">
                      {selectedFile.name}
                    </p>

                    <p className="mt-1 text-sm text-slate-400">
                      {(
                        selectedFile.size /
                        (1024 * 1024)
                      ).toFixed(2)}{' '}
                      MB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={removeSelectedFile}
                  disabled={extracting || summarizing}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/10 text-slate-400 transition hover:bg-white/[0.06] hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label="Remove PDF"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-5 rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4">
              <p className="text-sm leading-6 text-rose-300">
                {error}
              </p>
            </div>
          )}

          {/* Main Action */}
          {selectedFile && (
            <button
              type="button"
              onClick={handleMainAction}
              disabled={extracting || summarizing}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-900/20 transition hover:from-violet-500 hover:to-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {extracting || summarizing ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  {summarizing
                    ? 'Nova AI is summarizing...'
                    : 'Extracting PDF...'}
                </>
              ) : (
                <>
                  <Sparkles size={18} />

                  {pdfText
                    ? 'Generate AI Summary'
                    : 'Extract PDF & Continue'}
                </>
              )}
            </button>
          )}
        </section>

        {/* Extracted Text */}
        {pdfText && (
          <section className="nova-card mt-8 rounded-3xl p-6 sm:p-8">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <CheckCircle2
                    size={20}
                    className="text-emerald-400"
                  />

                  <h2 className="text-xl font-semibold text-white">
                    PDF text extracted
                  </h2>
                </div>

                <p className="mt-1 text-sm text-slate-400">
                  Your PDF is ready for AI summarization.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-slate-300">
                {pageCount} page
                {pageCount !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#070b1a]/60 p-5">
              <div className="max-h-[420px] overflow-y-auto pr-2">
                <p className="whitespace-pre-wrap text-sm leading-7 text-slate-300">
                  {pdfText}
                </p>
              </div>
            </div>

            {pdfText.length > 30000 && (
              <p className="mt-4 text-xs leading-5 text-amber-300/80">
                This PDF contains more than 30,000 characters.
                Nova AI will summarize the first 30,000 characters
                in this prototype.
              </p>
            )}
          </section>
        )}

        {/* AI Summary */}
        {summary && (
          <section className="nova-card mt-8 rounded-3xl p-6 sm:p-8">
            <div className="mb-6 flex items-start gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-500/15 text-violet-300">
                <Sparkles size={21} />
              </div>

              <div>
                <h2 className="text-xl font-semibold text-white">
                  Nova AI Summary
                </h2>

                <p className="mt-1 text-sm text-slate-400">
                  Your PDF has been transformed into
                  study-ready notes.
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-[#070b1a]/60 p-6">
              <div className="max-h-[700px] overflow-y-auto pr-2">
                <div className="prose prose-invert max-w-none text-slate-300">
  <ReactMarkdown
    components={{
      h1: ({ children }) => (
        <h1 className="mb-5 text-2xl font-bold text-white">
          {children}
        </h1>
      ),

      h2: ({ children }) => (
        <h2 className="mb-3 mt-7 text-xl font-semibold text-violet-300">
          {children}
        </h2>
      ),

      h3: ({ children }) => (
        <h3 className="mb-2 mt-5 text-lg font-semibold text-cyan-300">
          {children}
        </h3>
      ),

      p: ({ children }) => (
        <p className="mb-4 text-sm leading-7 text-slate-300">
          {children}
        </p>
      ),

      ul: ({ children }) => (
        <ul className="mb-5 ml-5 list-disc space-y-2 text-sm leading-7 text-slate-300">
          {children}
        </ul>
      ),

      ol: ({ children }) => (
        <ol className="mb-5 ml-5 list-decimal space-y-2 text-sm leading-7 text-slate-300">
          {children}
        </ol>
      ),

      li: ({ children }) => (
        <li className="pl-1">
          {children}
        </li>
      ),

      strong: ({ children }) => (
        <strong className="font-semibold text-white">
          {children}
        </strong>
      ),

      code: ({ children }) => (
        <code className="rounded-md bg-white/10 px-1.5 py-0.5 text-violet-200">
          {children}
        </code>
      ),
    }}
  >
    {summary}
  </ReactMarkdown>
</div>
              </div>
            </div>
          </section>
        )}

        {/* Info Cards */}
        <section className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="nova-card rounded-2xl p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-violet-500/10 text-violet-300">
              <FileText size={19} />
            </div>

            <h3 className="font-semibold text-white">
              Smart extraction
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Text is extracted directly from your PDF pages.
            </p>
          </div>

          <div className="nova-card rounded-2xl p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-300">
              <Sparkles size={19} />
            </div>

            <h3 className="font-semibold text-white">
              Nova AI summary
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Your extracted content is processed by Nova AI
              into structured study notes.
            </p>
          </div>

          <div className="nova-card rounded-2xl p-5">
            <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-300">
              <CheckCircle2 size={19} />
            </div>

            <h3 className="font-semibold text-white">
              Exam focused
            </h3>

            <p className="mt-2 text-sm leading-6 text-slate-400">
              Important concepts, definitions, formulas and
              revision points are prioritized.
            </p>
          </div>
        </section>

        {/* Current limitation */}
        <div className="mt-6 rounded-2xl border border-amber-400/15 bg-amber-500/[0.06] p-4">
          <p className="text-center text-xs leading-6 text-amber-200/80">
            <strong className="font-semibold text-amber-200">
              Current limitation:
            </strong>{' '}
            NovaDocs currently supports text-based PDFs.
            Scanned or image-only PDFs will be supported later
            as a Phase 2 enhancement.
          </p>
        </div>
      </main>
    </div>
  )
}