import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { examApi } from '../../services/api'
import type { ExamBookingPublic } from '../../types'
import './index.scss'

const SUBJECT_EMOJI: Record<string, string> = {
  math: '🔢', english: '🔤', chinese: '📖', science: '🔬', other: '📋',
}

const STATUS_MAP: Record<string, { text: string; color: string }> = {
  booked: { text: '已预约', color: '#2196f3' },
  started: { text: '进行中', color: '#ff9800' },
  completed: { text: '已完成', color: '#4caf50' },
  cancelled: { text: '已取消', color: '#999' },
  expired: { text: '已过期', color: '#999' },
}

export default function Exam() {
  const [bookings, setBookings] = useState<ExamBookingPublic[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await examApi.getBookings()
      setBookings(res.data)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  if (loading) {
    return <View className='exam-page'><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  const upcoming = bookings.filter((b) => b.status === 'booked' || b.status === 'started')
  const completed = bookings.filter((b) => b.status === 'completed')

  return (
    <View className='exam-page'>
      <View className='exam-page-header'>
        <Text className='exam-page-title'>📝 考试中心</Text>
      </View>

      {/* 待考试 */}
      {upcoming.length > 0 && (
        <>
          <View className='exam-section-title'><Text>即将开始</Text></View>
          <ScrollView scrollY>
            {upcoming.map((booking) => {
              const t = booking.template
              if (!t) return null
              const status = STATUS_MAP[booking.status] || STATUS_MAP.booked
              return (
                <View className='exam-item' key={booking.id}>
                  <View className='exam-item-left'>
                    <Text className='exam-item-emoji'>{SUBJECT_EMOJI[t.subject] || '📋'}</Text>
                  </View>
                  <View className='exam-item-center'>
                    <Text className='exam-item-title'>{t.title}</Text>
                    <Text className='exam-item-meta'>
                      {t.difficulty === 'easy' ? '简单' : t.difficulty === 'medium' ? '中等' : '困难'}
                      {' · '}{t.question_count} 题
                      {t.time_limit_seconds ? ` · ${Math.round(t.time_limit_seconds / 60)}分钟` : ''}
                    </Text>
                    <Text className='exam-item-time'>
                      {new Date(booking.scheduled_at).toLocaleString('zh-CN')}
                    </Text>
                  </View>
                  <View className='exam-item-right'>
                    <View
                      className='exam-item-btn'
                      onClick={() => Taro.navigateTo({ url: `/pages/exam-play/index?bookingId=${booking.id}` })}
                    >
                      <Text>{booking.status === 'started' ? '继续' : '开始'}</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </>
      )}

      {/* 已完成 */}
      {completed.length > 0 && (
        <>
          <View className='exam-section-title'><Text>已完成</Text></View>
          <ScrollView scrollY>
            {completed.map((booking) => {
              const t = booking.template
              if (!t) return null
              return (
                <View className='exam-item done' key={booking.id}>
                  <View className='exam-item-left'>
                    <Text className='exam-item-emoji'>{SUBJECT_EMOJI[t.subject] || '📋'}</Text>
                  </View>
                  <View className='exam-item-center'>
                    <Text className='exam-item-title'>{t.title}</Text>
                    <Text className='exam-item-meta'>
                      {new Date(booking.scheduled_at).toLocaleDateString('zh-CN')}
                    </Text>
                  </View>
                  <View className='exam-item-right'>
                    <View
                      className='exam-item-btn secondary'
                      onClick={() => Taro.navigateTo({ url: `/pages/exam-report/index?bookingId=${booking.id}` })}
                    >
                      <Text>报告</Text>
                    </View>
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </>
      )}

      {bookings.length === 0 && (
        <View className='empty-state'>
          <Text className='icon'>📝</Text>
          <Text className='text'>暂无考试安排</Text>
          <Text className='sub-text'>家长会为你安排考试哦~</Text>
        </View>
      )}
    </View>
  )
}
