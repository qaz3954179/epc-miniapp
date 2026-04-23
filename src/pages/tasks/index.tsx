import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { taskApi, examApi, authApi, childApi, growthApi } from '../../services/api'
import type { TodayTaskPublic, ExamBookingPublic, ChildAccountPublic, HeatmapData, TaskCompletionPublic } from '../../types'
import './index.scss'

const CATEGORY_MAP: Record<string, string> = {
  daily: '日常任务', exam: '模拟考试', game: '互动游戏', pe: '体能项目',
}
const CATEGORY_COLOR: Record<string, string> = {
  daily: '#667eea', exam: '#f5576c', game: '#4facfe', pe: '#43e97b',
}
const CATEGORY_EMOJI: Record<string, string> = {
  daily: '📚', exam: '📝', game: '🎮', pe: '🏃',
}
const SUBJECT_EMOJI: Record<string, string> = {
  math: '🔢', english: '🔤', chinese: '📖', science: '🔬', other: '📋',
}

// ─── 孩子端任务页 ─────────────────────────────────────────────

function ChildTasks() {
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
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())
  useShareAppMessage(() => ({ title: '今天你打卡了吗？', path: '/pages/tasks/index' }))

  const handleCheckIn = async (itemId: string) => {
    if (checkingIn) return
    setCheckingIn(itemId)
    setTasks((prev) =>
      prev.map((t) => t.id === itemId ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t)
    )
    try {
      await taskApi.completeTask(itemId)
      const userRes = await authApi.getMe()
      updateUser(userRes)
      Taro.vibrateShort()
      Taro.showToast({ title: '太棒了！打卡成功 🎉', icon: 'success' })
    } catch (err) {
      loadData()
      Taro.showToast({ title: err instanceof Error ? err.message : '打卡失败', icon: 'error' })
    } finally {
      setCheckingIn(null)
    }
  }

  const filteredTasks = filter ? tasks.filter((t) => t.category === filter) : tasks
  const upcomingBookings = bookings.filter((b) => b.status === 'booked' || b.status === 'started')

  if (loading) {
    return <View className='tasks-page'><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  return (
    <View className='tasks-page'>
      <ScrollView scrollX className='filter-bar'>
        <View className={`filter-item ${!filter ? 'active' : ''}`} onClick={() => setFilter('')}>全部</View>
        {Object.entries(CATEGORY_MAP).map(([key, label]) => (
          <View key={key} className={`filter-item ${filter === key ? 'active' : ''}`} onClick={() => setFilter(key)}>{label}</View>
        ))}
      </ScrollView>

      <View className='task-section'><Text className='section-title'>📅 今日任务</Text></View>

      {filteredTasks.length === 0 ? (
        <View className='empty-state'><Text className='icon'>📝</Text><Text className='text'>暂无任务</Text></View>
      ) : (
        <ScrollView scrollY className='task-list'>
          {filteredTasks
            .sort((a, b) => a.completed_today === b.completed_today ? 0 : a.completed_today ? 1 : -1)
            .map((task) => {
              const color = CATEGORY_COLOR[task.category || ''] || '#667eea'
              const emoji = CATEGORY_EMOJI[task.category || ''] || '📋'
              return (
                <View className={`task-card ${task.completed_today ? 'completed' : ''}`} key={task.id}>
                  <View className='task-header' style={{
                    background: task.completed_today
                      ? 'linear-gradient(135deg, #a8edea, #fed6e3)'
                      : `linear-gradient(135deg, ${color}, ${color}dd)`,
                  }}>
                    <View className='task-emoji'>{task.completed_today ? '✅' : emoji}</View>
                    <View className='task-info'>
                      <Text className='task-title'>{task.title}</Text>
                      {task.description && <Text className='task-desc'>{task.description}</Text>}
                    </View>
                    <View className='task-coins'>🪙 +{task.coins_reward}</View>
                  </View>
                  <View className='task-body'>
                    {task.completed_today ? (
                      <View className='btn-done'>✓ 已完成 ({task.completed_count}/{task.target_count})</View>
                    ) : checkingIn === task.id ? (
                      <View className='btn-checkin checking'>打卡中...</View>
                    ) : (
                      <View className='btn-checkin' onClick={() => handleCheckIn(task.id)}>完成打卡 💪</View>
                    )}
                  </View>
                </View>
              )
            })}
        </ScrollView>
      )}

      {upcomingBookings.length > 0 && (
        <>
          <View className='task-section'><Text className='section-title'>📝 考试预约</Text></View>
          <ScrollView scrollY className='task-list'>
            {upcomingBookings.map((booking) => {
              const t = booking.template
              if (!t) return null
              return (
                <View className='exam-card' key={booking.id}>
                  <View className='exam-header'>
                    <Text className='exam-emoji'>{SUBJECT_EMOJI[t.subject] || '📋'}</Text>
                    <Text className='exam-title'>{t.title}</Text>
                  </View>
                  <View className='exam-body'>
                    <Text className='exam-meta'>
                      {t.difficulty === 'easy' ? '简单' : t.difficulty === 'medium' ? '中等' : '困难'} · {t.question_count} 题
                    </Text>
                  </View>
                  <View className='exam-footer'>
                    <View
                      className='btn-exam-start'
                      onClick={() => Taro.navigateTo({ url: `/pages/exam-play/index?bookingId=${booking.id}` })}
                    >
                      开始考试 →
                    </View>
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

// ─── 家长端数据页 ─────────────────────────────────────────────

function ParentData() {
  const [children, setChildren] = useState<ChildAccountPublic[]>([])
  const [completions, setCompletions] = useState<TaskCompletionPublic[]>([])
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [loading, setLoading] = useState(true)

  const childId = useAuthStore((s) => s.childId)
  const switchChild = useAuthStore((s) => s.switchChild)

  const currentChild = children.find((c) => c.id === childId) || children[0]

  const loadData = useCallback(async () => {
    try {
      const childrenRes = await childApi.getChildren()
      setChildren(childrenRes.data)
      const cid = childId || childrenRes.data[0]?.id
      if (cid) {
        if (!childId) switchChild(cid)
        const [compRes, heatRes] = await Promise.all([
          taskApi.getChildCompletions(cid, 7),
          growthApi.getHeatmap(30),
        ])
        setCompletions(compRes)
        setHeatmap(heatRes)
      }
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [childId, switchChild])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  if (loading) {
    return <View className='tasks-page'><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  return (
    <View className='tasks-page'>
      <View className='parent-data-header'>
        <Text className='section-title'>📊 数据 · {currentChild?.nickname || '宝贝'}</Text>
      </View>

      {/* 宝贝切换 */}
      {children.length > 1 && (
        <ScrollView scrollX className='filter-bar'>
          {children.map((child) => (
            <View
              key={child.id}
              className={`filter-item ${child.id === currentChild?.id ? 'active' : ''}`}
              onClick={() => { switchChild(child.id); loadData() }}
            >
              {child.nickname || child.full_name}
            </View>
          ))}
        </ScrollView>
      )}

      {/* 统计卡片 */}
      <View className='stats-row'>
        <View className='stat-card'>
          <Text className='stat-card-value'>🪙 {currentChild?.coins ?? 0}</Text>
          <Text className='stat-card-label'>余额</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-card-value'>✅ {completions.filter((c) => {
            const today = new Date().toISOString().slice(0, 10)
            return c.completed_at.startsWith(today)
          }).length}</Text>
          <Text className='stat-card-label'>今日完成</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-card-value'>🔥 {heatmap?.current_streak ?? 0}</Text>
          <Text className='stat-card-label'>连续天数</Text>
        </View>
        <View className='stat-card'>
          <Text className='stat-card-value'>📊 {heatmap?.total_completions ?? 0}</Text>
          <Text className='stat-card-label'>总完成</Text>
        </View>
      </View>

      {/* 热力图 */}
      {heatmap && heatmap.days.length > 0 && (
        <View className='card' style={{ margin: '0 24rpx 24rpx', padding: '24rpx' }}>
          <Text className='section-title' style={{ marginBottom: '16rpx', display: 'block' }}>📋 完成热力图</Text>
          <View className='heatmap-grid'>
            {heatmap.days.slice(-28).map((day) => {
              const level = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 4 ? 2 : 3
              return (
                <View key={day.date} className={`heatmap-cell level-${level}`} />
              )
            })}
          </View>
          <View className='heatmap-legend'>
            <Text className='heatmap-legend-text'>少</Text>
            <View className='heatmap-cell level-0 small' />
            <View className='heatmap-cell level-1 small' />
            <View className='heatmap-cell level-2 small' />
            <View className='heatmap-cell level-3 small' />
            <Text className='heatmap-legend-text'>多</Text>
          </View>
        </View>
      )}

      {/* 最近完成 */}
      <View style={{ padding: '0 24rpx' }}>
        <Text className='section-title'>最近完成记录</Text>
      </View>
      {completions.length === 0 ? (
        <View className='empty-state'><Text className='icon'>📋</Text><Text className='text'>暂无记录</Text></View>
      ) : (
        <View style={{ padding: '16rpx 24rpx' }}>
          {completions.slice(0, 10).map((c) => (
            <View key={c.id} className='completion-item'>
              <Text className='completion-time'>
                {new Date(c.completed_at).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </Text>
              <Text className='completion-status'>✓</Text>
            </View>
          ))}
        </View>
      )}

      <View className='bottom-safe' />
    </View>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────

export default function Tasks() {
  const role = useAuthStore((s) => s.role)
  return role === 'parent' ? <ParentData /> : <ChildTasks />
}
