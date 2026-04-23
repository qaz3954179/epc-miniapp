import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useRouter } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { examApi } from '../../services/api'
import type { ExamReport as ExamReportType } from '../../types'
import './index.scss'

const SUBJECT_EMOJI: Record<string, string> = {
  math: '🔢', english: '🔤', chinese: '📖', science: '🔬', other: '📋',
}

export default function ExamReport() {
  const router = useRouter()
  const sessionId = router.params.sessionId

  const [report, setReport] = useState<ExamReportType | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadReport = useCallback(async () => {
    if (!sessionId) {
      setError('缺少考试会话 ID')
      setLoading(false)
      return
    }
    try {
      const res = await examApi.getExamReport(sessionId)
      setReport(res)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载报告失败')
    } finally {
      setLoading(false)
    }
  }, [sessionId])

  useLoad(() => loadReport())

  if (loading) {
    return (
      <View className='report-page'>
        <View className='loading-state'>
          <Text className='loading-emoji'>📊</Text>
          <Text className='loading-text'>正在生成报告...</Text>
        </View>
      </View>
    )
  }

  if (error || !report) {
    return (
      <View className='report-page'>
        <View className='loading-state'>
          <Text className='loading-emoji'>😅</Text>
          <Text className='loading-text'>{error || '报告加载失败'}</Text>
          <View className='btn-back' onClick={() => Taro.navigateBack()}>
            <Text>返回</Text>
          </View>
        </View>
      </View>
    )
  }

  const scorePercent = report.total_points > 0
    ? Math.round((report.score / report.total_points) * 100)
    : 0
  const accuracyPercent = Math.round(report.accuracy_rate * 100)
  const emoji = SUBJECT_EMOJI[report.subject] || '📋'
  const grade = scorePercent >= 90 ? 'S' : scorePercent >= 80 ? 'A' : scorePercent >= 70 ? 'B' : scorePercent >= 60 ? 'C' : 'D'
  const gradeColor = grade === 'S' ? '#FFD700' : grade === 'A' ? '#4caf50' : grade === 'B' ? '#2196f3' : grade === 'C' ? '#ff9800' : '#f44336'
  const gradeEmoji = grade === 'S' ? '🏆' : grade === 'A' ? '🌟' : grade === 'B' ? '👍' : grade === 'C' ? '💪' : '📚'

  const minutes = Math.floor(report.time_spent_seconds / 60)
  const seconds = report.time_spent_seconds % 60

  return (
    <View className='report-page'>
      {/* 成绩卡片 */}
      <View className='score-card'>
        <Text className='score-emoji'>{emoji}</Text>
        <Text className='score-title'>{report.template_title}</Text>
        <View className='score-circle' style={{ borderColor: gradeColor }}>
          <Text className='score-grade' style={{ color: gradeColor }}>{gradeEmoji} {grade}</Text>
          <Text className='score-value'>{report.score}</Text>
          <Text className='score-total'>/ {report.total_points}</Text>
        </View>
        <Text className='score-percent'>{scorePercent}%</Text>
      </View>

      {/* 统计数据 */}
      <View className='stats-row'>
        <View className='stat-card'>
          <Text className='stat-icon'>🎯</Text>
          <Text className='stat-value'>{accuracyPercent}%</Text>
          <Text className='stat-label'>正确率</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-icon'>🔥</Text>
          <Text className='stat-value'>{report.combo_max}</Text>
          <Text className='stat-label'>最大连击</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-icon'>⏱️</Text>
          <Text className='stat-value'>{minutes}:{seconds.toString().padStart(2, '0')}</Text>
          <Text className='stat-label'>用时</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-icon'>🪙</Text>
          <Text className='stat-value'>+{report.coins_earned}</Text>
          <Text className='stat-label'>学习币</Text>
        </View>
      </View>

      {/* AI 总结 */}
      {report.summary && (
        <View className='summary-card'>
          <Text className='summary-title'>📝 考试总结</Text>
          <Text className='summary-text'>{report.summary}</Text>
        </View>
      )}

      {/* 答题详情 */}
      {report.answers && report.answers.length > 0 && (
        <View className='answers-section'>
          <Text className='answers-title'>📋 答题详情</Text>
          <ScrollView scrollY className='answers-list'>
            {report.answers.map((ans: any, i: number) => (
              <View className={`answer-item ${ans.is_correct ? 'correct' : 'wrong'}`} key={i}>
                <View className='answer-header'>
                  <Text className='answer-index'>第 {i + 1} 题</Text>
                  <Text className='answer-result'>{ans.is_correct ? '✅ 正确' : '❌ 错误'}</Text>
                </View>
                {ans.question_text && <Text className='answer-question'>{ans.question_text}</Text>}
                <View className='answer-detail'>
                  <Text className='answer-child'>你的答案: {ans.child_answer || '--'}</Text>
                  {!ans.is_correct && <Text className='answer-correct'>正确答案: {ans.correct_answer || '--'}</Text>}
                </View>
                {ans.explanation && <Text className='answer-explain'>💡 {ans.explanation}</Text>}
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* 操作按钮 */}
      <View className='action-row'>
        <View className='btn-secondary' onClick={() => Taro.navigateBack()}>
          <Text>返回</Text>
        </View>
        <View className='btn-primary' onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
          <Text>继续学习</Text>
        </View>
      </View>

      <View className='bottom-safe' />
    </View>
  )
}
