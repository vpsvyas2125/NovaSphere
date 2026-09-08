import { useState } from 'react'
import {
  ArrowLeft,
  CheckCircle2,
  Loader2,
  Sparkles,
  Trophy,
  XCircle,
} from 'lucide-react'

import logo from '../../assets/novasphere-logo.png'
import { supabase } from '../../lib/supabase'

export default function NovaQuiz({ onBack }) {
  const [topic, setTopic] = useState('')
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState(null)
  const [answered, setAnswered] = useState(false)
  const [score, setScore] = useState(0)

  const [quizStarted, setQuizStarted] = useState(false)
  const [quizFinished, setQuizFinished] = useState(false)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function generateQuiz() {
    const selectedTopic = topic.trim()

    if (!selectedTopic) {
      setError('Please enter a topic first.')
      return
    }

    setLoading(true)
    setError('')

    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setScore(0)
    setQuizStarted(false)
    setQuizFinished(false)

    try {
      const { data, error: functionError } =
        await supabase.functions.invoke('ai-assistant', {
          body: {
            type: 'quiz',
            message: `
Generate a 5-question multiple-choice quiz for a college student.

Topic:
${selectedTopic}

Make the questions educational and suitable for B.Tech/ECE students.

Cover different aspects of the topic.

Use clear language.

Avoid duplicate questions.

Return exactly 5 questions.
            `,
          },
        })

      if (functionError) {
        console.error('Quiz function error:', functionError)

        throw new Error(
          functionError.message ||
            'Nova AI could not generate the quiz.'
        )
      }

      if (!data?.quiz?.questions) {
        console.error(
          'Unexpected quiz response:',
          data
        )

        throw new Error(
          'Nova AI returned an invalid quiz.'
        )
      }

      const generatedQuestions =
        data.quiz.questions

      if (
        !Array.isArray(generatedQuestions) ||
        generatedQuestions.length === 0
      ) {
        throw new Error(
          'No quiz questions were generated.'
        )
      }

      const validQuestions =
        generatedQuestions.filter(
          (question) =>
            question &&
            typeof question.question === 'string' &&
            Array.isArray(question.options) &&
            question.options.length === 4 &&
            Number.isInteger(question.answer) &&
            question.answer >= 0 &&
            question.answer <= 3
        )

      if (validQuestions.length === 0) {
        throw new Error(
          'Nova AI generated an invalid quiz format.'
        )
      }

      setQuestions(validQuestions)
      setQuizStarted(true)
    } catch (err) {
      console.error(
        'Quiz generation error:',
        err
      )

      setError(
        err?.message ||
          'Unable to generate the quiz right now.'
      )
    } finally {
      setLoading(false)
    }
  }

  function handleAnswer(index) {
    if (answered) return

    const question =
      questions[currentQuestion]

    setSelectedAnswer(index)
    setAnswered(true)

    if (index === question.answer) {
      setScore((previous) => previous + 1)
    }
  }

  function nextQuestion() {
    if (
      currentQuestion <
      questions.length - 1
    ) {
      setCurrentQuestion(
        (previous) => previous + 1
      )

      setSelectedAnswer(null)
      setAnswered(false)
    } else {
      setQuizFinished(true)
    }
  }

  function restartQuiz() {
    setQuestions([])
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setAnswered(false)
    setScore(0)
    setQuizStarted(false)
    setQuizFinished(false)
    setError('')
  }

  function getScoreMessage() {
    const percentage =
      questions.length > 0
        ? Math.round(
            (score / questions.length) * 100
          )
        : 0

    if (percentage >= 80) {
      return 'Excellent work! You have a strong understanding of this topic.'
    }

    if (percentage >= 60) {
      return 'Good job! A little more revision will make you stronger.'
    }

    return 'Keep learning! Review the explanations and try again.'
  }

  // ==========================
  // RESULT SCREEN
  // ==========================

  if (quizFinished) {
    const percentage =
      questions.length > 0
        ? Math.round(
            (score / questions.length) * 100
          )
        : 0

    return (
      <div className="min-h-screen bg-[#070b1a] text-white">

        <header className="border-b border-white/10 bg-[#070b1a]/95">
          <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">

            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
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
                <div className="text-lg font-bold text-white">
                  Nova<span className="text-violet-400">Sphere</span>
                </div>

                <div className="text-[8px] tracking-[0.18em] text-cyan-400">
                  LEARN • GROW • ACHIEVE
                </div>
              </div>

            </div>

            <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
              <Sparkles size={16} />
              NovaQuiz
            </div>

          </div>
        </header>

        <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-3xl items-center justify-center px-6 py-10">

          <div className="w-full rounded-3xl border border-white/10 bg-[#0d1328] p-8 text-center shadow-2xl">

            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-violet-500/10 text-violet-300">
              <Trophy size={38} />
            </div>

            <p className="text-sm font-medium uppercase tracking-wider text-violet-300">
              Quiz Complete
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Your NovaQuiz Result
            </h1>

            <div className="mx-auto mt-8 flex h-36 w-36 items-center justify-center rounded-full border-8 border-violet-500/30">

              <div>

                <div className="text-4xl font-bold">
                  {percentage}%
                </div>

                <div className="mt-1 text-xs text-slate-400">
                  Score
                </div>

              </div>

            </div>

            <p className="mt-7 text-lg text-slate-200">
              {score} / {questions.length} correct
            </p>

            <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-400">
              {getScoreMessage()}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">

              <button
                type="button"
                onClick={restartQuiz}
                className="rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-6 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Generate Another Quiz
              </button>

              <button
                type="button"
                onClick={onBack}
                className="rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10"
              >
                Back to Dashboard
              </button>

            </div>

          </div>

        </main>

      </div>
    )
  }

  // ==========================
  // ACTIVE QUIZ
  // ==========================

  if (
    quizStarted &&
    questions.length > 0
  ) {
    const question =
      questions[currentQuestion]

    const progress =
      ((currentQuestion + 1) /
        questions.length) *
      100

    return (
      <div className="min-h-screen bg-[#070b1a] text-white">

        <header className="border-b border-white/10 bg-[#070b1a]/95">

          <div className="mx-auto flex h-20 w-full max-w-5xl items-center justify-between px-6">

            <div className="flex items-center gap-4">

              <button
                type="button"
                onClick={onBack}
                className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10"
              >
                <ArrowLeft size={19} />
              </button>

              <div>

                <p className="text-sm font-semibold text-white">
                  NovaQuiz
                </p>

                <p className="text-xs text-slate-500">
                  {topic}
                </p>

              </div>

            </div>

            <div className="text-sm text-slate-400">
              {currentQuestion + 1} / {questions.length}
            </div>

          </div>

        </header>

        <main className="mx-auto w-full max-w-4xl px-6 py-10">

          <div className="mb-8">

            <div className="mb-2 flex justify-between text-xs text-slate-500">
              <span>Quiz progress</span>
              <span>
                {Math.round(progress)}%
              </span>
            </div>

            <div className="h-2 overflow-hidden rounded-full bg-white/5">

              <div
                className="h-full rounded-full bg-gradient-to-r from-violet-600 to-blue-500 transition-all duration-300"
                style={{
                  width: `${progress}%`,
                }}
              />

            </div>

          </div>

          <div className="rounded-3xl border border-white/10 bg-[#0d1328] p-6 shadow-2xl sm:p-8">

            <p className="text-sm font-medium text-violet-300">
              Question {currentQuestion + 1}
            </p>

            <h1 className="mt-4 text-xl font-semibold leading-8 text-white sm:text-2xl">
              {question.question}
            </h1>

            <div className="mt-8 space-y-3">

              {question.options.map(
                (option, index) => {

                  const isCorrect =
                    index === question.answer

                  const isSelected =
                    index === selectedAnswer

                  let optionClass =
                    'border-white/10 bg-white/[0.03] hover:border-violet-400/40 hover:bg-violet-500/[0.05]'

                  if (
                    answered &&
                    isCorrect
                  ) {
                    optionClass =
                      'border-emerald-400/40 bg-emerald-500/10'
                  }

                  if (
                    answered &&
                    isSelected &&
                    !isCorrect
                  ) {
                    optionClass =
                      'border-rose-400/40 bg-rose-500/10'
                  }

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() =>
                        handleAnswer(index)
                      }
                      disabled={answered}
                      className={`flex w-full items-center gap-4 rounded-2xl border p-4 text-left transition ${optionClass}`}
                    >

                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-sm font-semibold text-slate-300">
                        {String.fromCharCode(
                          65 + index
                        )}
                      </span>

                      <span className="flex-1 text-sm leading-6 text-slate-200">
                        {option}
                      </span>

                      {answered &&
                        isCorrect && (
                          <CheckCircle2
                            size={20}
                            className="shrink-0 text-emerald-400"
                          />
                        )}

                      {answered &&
                        isSelected &&
                        !isCorrect && (
                          <XCircle
                            size={20}
                            className="shrink-0 text-rose-400"
                          />
                        )}

                    </button>
                  )
                }
              )}

            </div>

            {answered && (
              <div
                className={`mt-6 rounded-2xl border p-5 ${
                  selectedAnswer ===
                  question.answer
                    ? 'border-emerald-400/20 bg-emerald-500/5'
                    : 'border-amber-400/20 bg-amber-500/5'
                }`}
              >

                <div className="flex items-center gap-2">

                  {selectedAnswer ===
                  question.answer ? (
                    <CheckCircle2
                      size={18}
                      className="text-emerald-400"
                    />
                  ) : (
                    <XCircle
                      size={18}
                      className="text-amber-400"
                    />
                  )}

                  <p className="text-sm font-semibold text-white">
                    {selectedAnswer ===
                    question.answer
                      ? 'Correct!'
                      : 'Not quite'}
                  </p>

                </div>

                {question.explanation && (
                  <p className="mt-3 text-sm leading-6 text-slate-300">
                    {question.explanation}
                  </p>
                )}

              </div>
            )}

            {answered && (
              <button
                type="button"
                onClick={nextQuestion}
                className="mt-6 w-full rounded-xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                {currentQuestion ===
                questions.length - 1
                  ? 'Finish Quiz'
                  : 'Next Question'}
              </button>
            )}

          </div>

        </main>

      </div>
    )
  }

  // ==========================
  // GENERATE QUIZ SCREEN
  // ==========================

  return (
    <div className="min-h-screen bg-[#070b1a] text-white">

      <header className="border-b border-white/10 bg-[#070b1a]/95">

        <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-6 lg:px-10">

          <div className="flex items-center gap-4">

            <button
              type="button"
              onClick={onBack}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-300 transition hover:bg-white/10 hover:text-white"
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

              <div className="text-lg font-bold text-white">
                Nova<span className="text-violet-400">
                  Sphere
                </span>
              </div>

              <div className="text-[8px] tracking-[0.18em] text-cyan-400">
                LEARN • GROW • ACHIEVE
              </div>

            </div>

          </div>

          <div className="flex items-center gap-2 rounded-full border border-violet-400/20 bg-violet-500/10 px-4 py-2 text-sm text-violet-200">
            <Sparkles size={16} />
            NovaQuiz
          </div>

        </div>

      </header>

      <main className="mx-auto w-full max-w-4xl px-6 py-12 lg:px-10">

        <div className="mx-auto max-w-2xl text-center">

          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-blue-500 shadow-lg shadow-violet-500/20">
            <Sparkles size={30} />
          </div>

          <p className="mt-6 text-sm font-medium uppercase tracking-wider text-violet-300">
            AI-Powered Practice
          </p>

          <h1 className="mt-3 text-4xl font-bold">
            Test your knowledge
          </h1>

          <p className="mt-4 leading-7 text-slate-400">
            Enter a topic and Nova AI will generate
            five personalized multiple-choice
            questions for you.
          </p>

        </div>

        <div className="mx-auto mt-10 max-w-2xl rounded-3xl border border-white/10 bg-[#0d1328] p-6 shadow-2xl sm:p-8">

          <label className="mb-3 block text-sm font-medium text-slate-300">
            What do you want to practice?
          </label>

          <input
            type="text"
            value={topic}
            onChange={(event) => {
              setTopic(event.target.value)
              setError('')
            }}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                generateQuiz()
              }
            }}
            placeholder="Example: Kirchhoff's Voltage Law"
            disabled={loading}
            className="w-full rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-white outline-none transition placeholder:text-slate-600 focus:border-violet-400/40"
          />

          {error && (
            <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-300">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={generateQuiz}
            disabled={
              !topic.trim() || loading
            }
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 px-5 py-4 text-sm font-semibold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >

            {loading ? (
              <>
                <Loader2
                  size={19}
                  className="animate-spin"
                />
                Nova AI is generating your quiz...
              </>
            ) : (
              <>
                <Sparkles size={19} />
                Generate AI Quiz
              </>
            )}

          </button>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">

              <p className="text-lg font-bold text-white">
                5
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Questions
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">

              <p className="text-lg font-bold text-white">
                AI
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Generated
              </p>

            </div>

            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 text-center">

              <p className="text-lg font-bold text-white">
                Instant
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Feedback
              </p>

            </div>

          </div>

        </div>

      </main>

    </div>
  )
}