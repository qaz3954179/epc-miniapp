import { View, Text, Input } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { examApi } from '../../services/api'
import type { ExamSessionPublic, QuestionPublic } from '../../types'
import './index.scss'

export default function ExamPlay() {
  const router = useRouter()
  const bookingId = router.params.bookingId

  const [session, setSession] = useState<ExamSessionPublic | null>(null)
  const [questions, setQuestions] = useState<QuestionPublic[]>([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answer, setAnswer] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [feedback, setFeedback] = useState<{ correct: boolean; explanation?: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [finished, setFinished] = useState(false)

  const startExam = useCallback(async () => {
    try {
      const sess = await examApi.startExam(bookingId)
      setSession(sess)
      // TODO: 后端需要提供获取题目的 API
      // const qs = await examApi.getQuestions(sess.template_id)
      // setQuestions(qs)
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '开始考试失败', icon: 'error' })
      setTimeout(() => Taro.navigateBack(), 1500)
    } finally {
      setLoading(false)
    }
  }, [bookingId])

  useLoad(() => startExam())

  const handleSubmitAnswer = async () => {
    if (!session || !questions[currentIndex] || submitting || !answer.trim()) return
    setSubmitting(true)

    const question = questions[currentIndex]
    const startTime = Date.now()

    try {
      const result = await examApi.submitAnswer(
        session.id,
        question.id,
        answer.trim(),
        Date.now() - startTime
      )

      const isCorrect = answer.trim().toLowerCase() === question.answer.toLowerCase()
      setFeedback({ correct: isCorrect, explanation: question.explanation || undefined })

      // 1.5 秒后进入下一题
      setTimeout(() => {
        setFeedback(null)
        setAnswer('')
        if (currentIndex < questions.length - 1) {
          setCurrentIndex((prev) => prev + 1)
        } else {
          setFinished(true)
          // 跳转到报告页
          Taro.redirectTo({ url: `/pages/exam-report/index?sessionId=${session.id}` })
        }
      }, 1500)
    } catch (err) {
      Taro.showToast({ title: '提交失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <View className='exam-play-page'>
        <View className='loading-state'>
          <Text className='loading-emoji'>📝</Text>
          <Text className='loading-text'>正在准备考试...</Text>
        </View>
      </View>
    )
  }

  if (questions.length === 0) {
    return (
      <View className='exam-play-page'>
        <View className='loading-state'>
          <Text className='loading-emoji'>📝</Text>
          <Text className='loading-text'>考试会话已创建</Text>
          <Text className='loading-sub'>题目加载功能开发中...</Text>
          <View className='btn-back' onClick={() => Taro.navigateBack()}>
            <Text>返回</Text>
          </View>
        </View>
      </View>
    )
  }

  const question = questions[currentIndex]
  const content = question?.content as { text?: string; options?: string[] }

  return (
    <View className='exam-play-page'>
      {/* 进度条 */}
      <View className='exam-progress'>
        <View className='exam-progress-bar'>
          <View
            className='exam-progress-fill'
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </View>
        <Text className='exam-progress-text'>{currentIndex + 1}/{questions.length}</Text>
      </View>

      {/* 题目 */}
      <View className='question-card'>
        <Text className='question-text'>{content?.text || '题目加载中...'}</Text>

        {/* 选择题选项 */}
        {question.question_type === 'choice' && content?.options && (
          <View className='options'>
            {content.options.map((opt, i) => (
              <View
                key={i}
                className={`option ${answer === opt ? 'selected' : ''}`}
                onClick={() => setAnswer(opt)}
              >
                <Text className='option-label'>{String.fromCharCode(65 + i)}</Text>
                <Text className='option-text'>{opt}</Text>
              </View>
            ))}
          </View>
        )}

        {/* 填空题 */}
        {(question.question_type === 'fill_blank' || question.question_type === 'spelling') && (
          <Input
            className='answer-input'
            placeholder='输入你的答案'
            value={answer}
            onInput={(e) => setAnswer(e.detail.value)}
          />
        )}

        {/* 判断题 */}
        {question.question_type === 'true_false' && (
          <View className='options'>
            <View className={`option ${answer === 'true' ? 'selected' : ''}`} onClick={() => setAnswer('true')}>
              <Text className='option-text'>✅ 正确</Text>
            </View>
            <View className={`option ${answer === 'false' ? 'selected' : ''}`} onClick={() => setAnswer('false')}>
              <Text className='option-text'>❌ 错误</Text>
            </View>
          </View>
        )}
      </View>

      {/* 反馈 */}
      {feedback && (
        <View className={`feedback ${feedback.correct ? 'correct' : 'wrong'}`}>
          <Text className='feedback-icon'>{feedback.correct ? '✅' : '❌'}</Text>
          <Text className='feedback-text'>{feedback.correct ? '回答正确！' : '回答错误'}</Text>
          {feedback.explanation && <Text className='feedback-explain'>{feedback.explanation}</Text>}
        </View>
      )}

      {/* 提交按钮 */}
      {!feedback && (
        <View
          className={`btn-submit ${!answer.trim() || submitting ? 'disabled' : ''}`}
          onClick={handleSubmitAnswer}
        >
          <Text>{submitting ? '提交中...' : currentIndex < questions.length - 1 ? '下一题' : '提交'}</Text>
        </View>
      )}
    </View>
  )
}
