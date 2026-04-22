import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { taskApi, examApi, authApi } from '../../services/api'
import type { TodayTaskPublic, ExamBookingPublic } from '../../types'
import './index.scss'

const CATEGORY_MAP: Record<string, string> = {
  daily: '日常任务',
  exam: '模拟考试',
  game: '互动游戏',
  pe: '体能项目',
}

const CATEGORY_COLOR: Record<string, string> = {
  daily: '#667eea',
  exam: '#f5576c',
  game: '#4facfe',
  pe: '#43e97b',
}

const CATEGORY_EMOJI: Record<string, string> = {
  daily: '📚',
  exam: '📝',
  game: '🎮',
  pe: '🏃',
}

const SUBJECT_EMOJI: Record<string, string> = {
  math: '🔢',
  english: '🔤',
  chinese: '📖',
  science: '🔬',
  other: '📋',
}

export default function Tasks() {
  const [tasks, setTasks] = useState<TodayTaskPublic[]>([])
  const [bookings, setBookings] = useState<ExamBookingPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('')
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  const updateUser = useAuthStore((s) => s.updateUser)

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, bookingsRes] = await Promise.all([
        taskApi.getTodayTasks(),
        examApi.getBookings(),
      ])
      setTasks(tasksRes.data)
      setBookings(bookingsRes.data)
    } catch (err) {
      console.error('加载失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  useShareAppMessage(() => ({
    title: '今天你打卡了吗？',
    path: '/pages/tasks/index',
  }))

  const handleCheckIn = async (itemId: string) => {
    if (checkingIn) return
    setCheckingIn(itemId)

    try {
      // 乐观更新
      setTasks((prev) =>
        prev.map((t) =>
          t.id === itemId ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
        )
      )

      await taskApi.completeTask(itemId)

      // 刷新用户余额
      const userRes = await authApi.getMe()
      updateUser(userRes)

      Taro.vibrateShort()
      Taro.showToast({ title: '太棒了！打卡成功 🎉', icon: 'success' })
    } catch (err) {
      loadData() // 回滚
      Taro.showToast({
        title: err instanceof Error ? err.message : '打卡失败',
        icon: 'error',
      })
    } finally {
      setCheckingIn(null)
    }
  }

  const filteredTasks = filter
    ? tasks.filter((t) => t.category === filter)
    : tasks

  const upcomingBookings = bookings.filter(
    (b) => b.status === 'booked' || b.status === 'started'
  )

  if (loading) {
    return (
      <View className='tasks-page'>
        <View className='skeleton-card' />
        <View className='skeleton-card' />
      </View>
    )
  }

  return (
    <View className='tasks-page'>
      {/* 筛选 */}
      <ScrollView scrollX className='filter-bar'>
        <View
          className={`filter-item ${!filter ? 'active' : ''}`}
          onClick={() => setFilter('')}
        >
          全部
        </View>
        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
          <View
            key={key}
            className={`filter-item ${filter === key ? 'active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {label}
          </View>
        ))}
      </ScrollView>

      {/* 今日任务 */}
      <View className='task-section'>
        <Text className='section-title'>📅 今日任务</Text>
      </View>

      {filteredTasks.length === 0 ? (
        <View className='empty-state'>
          <Text className='icon'>📝</Text>
          <Text className='text'>暂无任务</Text>
          <Text className='sub-text'>让家长添加任务吧~</Text>
        </View>
      ) : (
        <ScrollView scrollY className='task-list'>
          {filteredTasks
            .sort((a, b) => {
              // 未完成在前
              if (a.completed_today !== b.completed_today) return a.completed_today ? 1 : -1
              return 0
            })
            .map((task) => {
              const color = CATEGORY_COLOR[task.category || ''] || '#667eea'
              const emoji = CATEGORY_EMOJI[task.category || ''] || '📋'
              const isCheckingIn = checkingIn === task.id
              return (
                <View
                  className={`task-card ${task.completed_today ? 'completed' : ''}`}
                  key={task.id}
                >
                  <View
                    className='task-header'
                    style={{
                      background: task.completed_today
                        ? 'linear-gradient(135deg, #a8edea, #fed6e3)'
                        : `linear-gradient(135deg, ${color}, ${color}dd)`,
                    }}
                  >
                    <View className='task-emoji'>
                      {task.completed_today ? '✅' : emoji}
                    </View>
                    <View className='task-info'>
                      <Text className='task-title'>{task.title}</Text>
                      {task.description && (
                        <Text className='task-desc'>{task.description}</Text>
                      )}
                    </View>
                    <View className='task-coins'>🪙 +{task.coins_reward}</View>
                  </View>
                  <View className='task-body'>
                    {task.completed_today ? (
                      <View className='btn-done'>
                        ✓ 已完成 ({task.completed_count}/{task.target_count})
                      </View>
                    ) : isCheckingIn ? (
                      <View className='btn-checkin checking'>打卡中...</View>
                    ) : (
                      <View
                        className='btn-checkin'
                        onClick={() => handleCheckIn(task.id)}
                      >
                        完成打卡 💪
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
        </ScrollView>
      )}

      {/* 考试预约 */}
      {upcomingBookings.length > 0 && (
        <>
          <View className='task-section'>
            <Text className='section-title'>📝 考试预约</Text>
          </View>
          <ScrollView scrollY className='task-list'>
            {upcomingBookings.map((booking) => {
              const template = booking.template
              if (!template) return null
              const subjectEmoji = SUBJECT_EMOJI[template.subject] || '📋'
              const scheduledDate = new Date(booking.scheduled_at)
              const now = new Date()
              const isReady = scheduledDate <= now && booking.status === 'started'

              return (
                <View className='exam-card' key={booking.id}>
                  <View className='exam-header'>
                    <Text className='exam-emoji'>{subjectEmoji}</Text>
                    <Text className='exam-title'>{template.title}</Text>
                  </View>
                  <View className='exam-body'>
                    <Text className='exam-meta'>
                      难度: {template.difficulty === 'easy' ? '简单' : template.difficulty === 'medium' ? '中等' : '困难'}
                      {' · '}
                      {template.question_count} 题
                      {template.time_limit_seconds
                        ? ` · ${Math.round(template.time_limit_seconds / 60)} 分钟`
                        : ''}
                    </Text>
                    <Text className='exam-time'>
                      {booking.status === 'started'
                        ? '进行中'
                        : `预约时间: ${scheduledDate.toLocaleString('zh-CN')}`}
                    </Text>
                  </View>
                  <View className='exam-footer'>
                    {isReady ? (
                      <View
                        className='btn-exam-start'
                        onClick={() => {
                          Taro.navigateTo({ url: `/pages/exam-play/index?bookingId=${booking.id}` })
                        }}
                      >
                        开始考试 →
                      </View>
                    ) : (
                      <View className='exam-status'>
                        {booking.status === 'started' ? '进行中' : '等待中'}
                      </View>
                    )}
                  </View>
                </View>
              )
            })}
          </ScrollView>
        </>
      )}
    </View>
  )
}
