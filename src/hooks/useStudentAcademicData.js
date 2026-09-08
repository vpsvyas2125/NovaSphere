import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function useStudentAcademicData() {
  const { user } = useAuth()

  const [subjects, setSubjects] = useState([])
  const [attendance, setAttendance] = useState([])
  const [marks, setMarks] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadAcademicData = useCallback(async () => {
    if (!user?.id) {
      setSubjects([])
      setAttendance([])
      setMarks([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      /*
       * STEP 1
       * Find the student record belonging to the
       * currently logged-in Supabase user.
       *
       * maybeSingle() is intentional.
       * A newly-created account may not have a
       * student record yet.
       */
      const { data: student, error: studentError } = await supabase
        .from('students')
        .select('id, class_id')
        .eq('profile_id', user.id)
        .maybeSingle()

      if (studentError) {
        throw studentError
      }

      /*
       * If the coordinator has not assigned this
       * account as a student yet, simply show an
       * empty academic dashboard.
       */
      if (!student) {
        console.log(
          'NovaSphere: No student record found for this account yet.'
        )

        setSubjects([])
        setAttendance([])
        setMarks([])
        setLoading(false)
        return
      }

      /*
       * STEP 2
       * Load subjects belonging to the student's class.
       */
      let subjectsData = []

      if (student.class_id) {
        const {
          data,
          error: subjectsError,
        } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_id', student.class_id)
          .order('name', { ascending: true })

        if (subjectsError) {
          throw subjectsError
        }

        subjectsData = data || []
      }

      /*
       * STEP 3
       * Load attendance belonging to this student.
       */
      const {
        data: attendanceData,
        error: attendanceError,
      } = await supabase
        .from('attendance')
        .select('*')
        .eq('student_id', student.id)

      if (attendanceError) {
        throw attendanceError
      }

      /*
       * STEP 4
       * Load marks belonging to this student.
       */
      const {
        data: marksData,
        error: marksError,
      } = await supabase
        .from('marks')
        .select('*')
        .eq('student_id', student.id)

      if (marksError) {
        throw marksError
      }

      /*
       * STEP 5
       * Send everything to the dashboard.
       */
      setSubjects(subjectsData)
      setAttendance(attendanceData || [])
      setMarks(marksData || [])
    } catch (err) {
      console.error('Academic data loading error:', err)

      setError(
        err?.message ||
          'Unable to load your academic data.'
      )
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  useEffect(() => {
    loadAcademicData()
  }, [loadAcademicData])

  return {
    subjects,
    attendance,
    marks,
    loading,
    error,
    refresh: loadAcademicData,
  }
}