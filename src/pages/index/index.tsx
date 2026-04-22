import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { taskApi, authApi } from '../../services/api'
import type { TodayTaskPublic, UserPublic } from '../../types'
import './index.scss'

const CATEGORY_EMOJI: Record<string, string> = {
  daily: '📚',
  exam: '📝',
  game: '🎮',
  pe: '🏃',
}

export default function Index() {
  const [tasks, setTasks] = useState<TodayTaskPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [checkingIn, setCheckingIn] = useState<string | null>(null)

  const user = useAuthStore((s) => s.user)
  const balance = useAuthStore((s) => s.user?.coins ?? 0)
  const updateUser = useAuthStore((s) => s.updateUser)

  const completedCount = tasks.filter((t) => t.completed_today).length
  const totalCount = tasks.length

  const loadPage = useCallback(async () => {
    try {
      // 并行拉取用户信息和今日任务
      const [userRes, tasksRes] = await Promise.all([
        authApi.getMe(),
        taskApi.getTodayTasks(),
      ])
      updateUser(userRes)
      setTasks(tasksRes.data)
    } catch (err) {
      console.error('加载失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => {
    loadPage()
  })

  usePullDownRefresh(() => {
    loadPage()
  })

  useShareAppMessage(() => ({
    title: '一起来学习打卡吧！',
    path: '/pages/index/index',
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

      const result = await taskApi.completeTask(itemId)

      // 更新余额
      const userRes = await authApi.getMe()
      updateUser(userRes)

      // 震动反馈
      Taro.vibrateShort()

      // 成功提示
      Taro.showToast({
        title: `太棒了！+${tasks.find((t) => t.id === itemId)?.coins_reward ?? 0} 🪙`,
        icon: 'success',
        duration: 1500,
      })
    } catch (err) {
      // 回滚
      loadPage()
      Taro.showToast({
        title: err instanceof Error ? err.message : '打卡失败',
        icon: 'error',
      })
    } finally {
      setCheckingIn(null)
    }
  }

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  // 取前 3 个未完成任务
  const pendingTasks = tasks.filter((t) => !t.completed_today).slice(0, 3)

  const getGreeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return '早上好呀'
    if (hour < 18) return '下午好'
    return '晚上好哦'
  }

  if (loading) {
    return (
      <View className='container'>
        <View className='skeleton-card' />
        <View className='skeleton-card' />
        <View className='skeleton-card' />
      </View>
    )
  }

  return (
    <View className='container'>
      {/* 顶部问候 */}
      <View className='greeting'>
        <Text className='greeting-text'>
          👋 {user?.nickname || user?.full_name || '同学'}，{getGreeting()}！
        </Text>
      </View>

      {/* 余额卡片 */}
      <View className='coins-card'>
        <View className='coins-left'>
          <Text className='coins-label'>学习币余额</Text>
          <Text className='coins-value'>{balance}</Text>
          <Text className='coins-tip'>完成任务赚更多 →</Text>
        </View>
        <View
          className='coins-icon'
          onClick={() => Taro.switchTab({ url: '/pages/store/index' })}
        >
          🪙
        </View>
      </View>

      {/* 今日进度 */}
      {totalCount > 0 && (
        <View className='progress-card'>
          <Text className='progress-title'>今日任务进度</Text>
          <View className='progress-bar-bg'>
            <View
              className='progress-bar-fill'
              style={{ width: `${progressPercent}%` }}
            />
          </View>
          <Text className='progress-text'>
            {completedCount} / {totalCount} 完成 · {progressPercent}%
          </Text>
          {completedCount === totalCount && totalCount > 0 ? (
            <Text className='progress-motivation'>🎉 太厉害了！今日任务全部完成！</Text>
          ) : (
            <Text className='progress-motivation'>
              ⭐ 再完成 {totalCount - completedCount} 个就能解锁...
            </Text>
          )}
        </View>
      )}

      {/* 快捷入口 */}
      <View className='quick-actions'>
        <View
          className='quick-action'
          onClick={() => Taro.navigateTo({ url: '/pages/planet/index' })}
        >
          <Text className='quick-action-icon'>🪐</Text>
          <Text className='quick-action-text'>我的星球</Text>
        </View>
        <View
          className='quick-action'
          onClick={() => Taro.navigateTo({ url: '/pages/exam/index' })}
        >
          <Text className='quick-action-icon'>📝</Text>
          <Text className='quick-action-text'>考试</Text>
        </View>
        <View
          className='quick-action'
          onClick={() => Taro.navigateTo({ url: '/pages/achievements/index' })}
        >
          <Text className='quick-action-icon'>🏆</Text>
          <Text className='quick-action-text'>成就</Text>
        </View>
      </View>

      {/* 今日任务列表 */}
      <View className='section-header'>
        <Text className='section-title'>今日任务</Text>
        <Text
          className='section-more'
          onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}
        >
          查看全部 →
        </Text>
      </View>

      {pendingTasks.length === 0 && completedCount > 0 ? (
        <View className='empty-state'>
          <Text className='icon'>🎉</Text>
          <Text className='text'>今日任务全部完成！</Text>
          <Text className='sub-text'>明天继续加油哦~</Text>
        </View>
      ) : pendingTasks.length === 0 ? (
        <View className='empty-state'>
          <Text className='icon'>📝</Text>
          <Text className='text'>还没有任务</Text>
          <Text className='sub-text'>让家长为你添加任务吧~</Text>
        </View>
      ) : (
        <ScrollView scrollY className='task-list'>
          {pendingTasks.map((task) => {
            const emoji = CATEGORY_EMOJI[task.category || ''] || task.task_type || '📋'
            const isCheckingIn = checkingIn === task.id
            return (
              <View className='task-card' key={task.id}>
                <View className='task-card-inner'>
                  <View className='task-emoji'>{emoji}</View>
                  <View className='task-info'>
                    <Text className='task-title'>{task.title}</Text>
                    <Text className='task-coins'>+{task.coins_reward} 🪙</Text>
                  </View>
                  {isCheckingIn ? (
                    <View className='btn-checkin checking'>打卡中...</View>
                  ) : (
                    <View className='btn-checkin' onClick={() => handleCheckIn(task.id)}>
                      打卡
                    </View>
                  )}
                </View>
              </View>
            )
          })}
        </ScrollView>
      )}

      {/* 底部占位 */}
      <View className='bottom-safe' />
    </View>
  )
}
