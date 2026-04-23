import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh, useShareAppMessage } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { taskApi, authApi, childApi, parentApi } from '../../services/api'
import type { TodayTaskPublic, ChildAccountPublic } from '../../types'
import './index.scss'

const CATEGORY_EMOJI: Record<string, string> = {
  daily: '📚', exam: '📝', game: '🎮', pe: '🏃',
}

// ─── 孩子端首页 ───────────────────────────────────────────────

function ChildHome() {
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
      const [userRes, tasksRes] = await Promise.all([
        authApi.getMe(),
        taskApi.getTodayTasks(),
      ])
      updateUser(userRes)
      setTasks(tasksRes.data)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => loadPage())
  usePullDownRefresh(() => loadPage())

  useShareAppMessage(() => ({
    title: '一起来学习打卡吧！',
    path: '/pages/index/index',
  }))

  const handleCheckIn = async (itemId: string) => {
    if (checkingIn) return
    setCheckingIn(itemId)
    const task = tasks.find((t) => t.id === itemId)

    // 乐观更新
    setTasks((prev) =>
      prev.map((t) =>
        t.id === itemId ? { ...t, completed_today: true, completed_count: t.completed_count + 1 } : t
      )
    )

    try {
      await taskApi.completeTask(itemId)
      const userRes = await authApi.getMe()
      updateUser(userRes)
      Taro.vibrateShort()
      Taro.showToast({ title: `太棒了！+${task?.coins_reward ?? 0} 🪙`, icon: 'success', duration: 1500 })
    } catch (err) {
      loadPage()
      Taro.showToast({ title: err instanceof Error ? err.message : '打卡失败', icon: 'error' })
    } finally {
      setCheckingIn(null)
    }
  }

  const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0
  const pendingTasks = tasks.filter((t) => !t.completed_today).slice(0, 3)

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? '早上好呀' : h < 18 ? '下午好' : '晚上好哦'
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
      <View className='greeting'>
        <Text className='greeting-text'>
          👋 {user?.nickname || user?.full_name || '同学'}，{getGreeting()}！
        </Text>
      </View>

      <View className='coins-card'>
        <View className='coins-left'>
          <Text className='coins-label'>学习币余额</Text>
          <Text className='coins-value'>{balance}</Text>
          <Text className='coins-tip' onClick={() => Taro.switchTab({ url: '/pages/store/index' })}>
            去商城 →
          </Text>
        </View>
        <View className='coins-icon'>🪙</View>
      </View>

      {totalCount > 0 && (
        <View className='progress-card'>
          <Text className='progress-title'>今日任务进度</Text>
          <View className='progress-bar-bg'>
            <View className='progress-bar-fill' style={{ width: `${progressPercent}%` }} />
          </View>
          <Text className='progress-text'>{completedCount}/{totalCount} 完成</Text>
          <Text className='progress-motivation'>
            {completedCount === totalCount ? '🎉 太厉害了！今日任务全部完成！' : `⭐ 再完成 ${totalCount - completedCount} 个任务加油！`}
          </Text>
        </View>
      )}

      <View className='quick-actions'>
        <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/planet/index' })}>
          <Text className='quick-action-icon'>🪐</Text>
          <Text className='quick-action-text'>我的星球</Text>
        </View>
        <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/exam/index' })}>
          <Text className='quick-action-icon'>📝</Text>
          <Text className='quick-action-text'>考试</Text>
        </View>
        <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/achievements/index' })}>
          <Text className='quick-action-icon'>🏆</Text>
          <Text className='quick-action-text'>成就</Text>
        </View>
      </View>

      <View className='section-header'>
        <Text className='section-title'>今日任务</Text>
        <Text className='section-more' onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>查看全部 →</Text>
      </View>

      {pendingTasks.length === 0 ? (
        <View className='empty-state'>
          <Text className='icon'>{completedCount > 0 ? '🎉' : '📝'}</Text>
          <Text className='text'>{completedCount > 0 ? '今日任务全部完成！' : '还没有任务'}</Text>
          <Text className='sub-text'>{completedCount > 0 ? '明天继续加油哦~' : '让家长为你添加任务吧~'}</Text>
        </View>
      ) : (
        <ScrollView scrollY className='task-list'>
          {pendingTasks.map((task) => (
            <View className='task-card' key={task.id}>
              <View className='task-card-inner'>
                <View className='task-emoji'>{CATEGORY_EMOJI[task.category || ''] || '📋'}</View>
                <View className='task-info'>
                  <Text className='task-title'>{task.title}</Text>
                  <Text className='task-coins'>+{task.coins_reward} 🪙</Text>
                </View>
                {checkingIn === task.id ? (
                  <View className='btn-checkin checking'>打卡中...</View>
                ) : (
                  <View className='btn-checkin' onClick={() => handleCheckIn(task.id)}>打卡</View>
                )}
              </View>
            </View>
          ))}
        </ScrollView>
      )}

      <View className='bottom-safe' />
    </View>
  )
}

// ─── 家长端花园 ───────────────────────────────────────────────

function ParentGarden() {
  const [children, setChildren] = useState<ChildAccountPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [activities, setActivities] = useState<any[]>([])

  const childId = useAuthStore((s) => s.childId)
  const switchChild = useAuthStore((s) => s.switchChild)
  const user = useAuthStore((s) => s.user)

  const currentChild = children.find((c) => c.id === childId) || children[0]

  const loadData = useCallback(async () => {
    try {
      const childrenRes = await childApi.getChildren()
      setChildren(childrenRes.data)
      if (childrenRes.data.length > 0 && !childId) {
        switchChild(childrenRes.data[0].id)
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
    return (
      <View className='container'>
        <View className='skeleton-card' />
        <View className='skeleton-card' />
      </View>
    )
  }

  if (children.length === 0) {
    return (
      <View className='container'>
        <View className='empty-state'>
          <Text className='icon'>👶</Text>
          <Text className='text'>还没有添加宝贝</Text>
          <Text className='sub-text'>点击下方按钮添加第一个宝贝</Text>
        </View>
        <View className='btn-primary' style={{ margin: '0 24rpx' }}>
          <Text>添加宝贝</Text>
        </View>
      </View>
    )
  }

  return (
    <View className='container'>
      <View className='greeting'>
        <Text className='greeting-text'>🏠 宝贝花园</Text>
      </View>

      {/* 宝贝切换 */}
      {children.length > 1 && (
        <ScrollView scrollX className='baby-selector'>
          {children.map((child) => (
            <View
              key={child.id}
              className={`baby-chip ${child.id === currentChild?.id ? 'active' : ''}`}
              onClick={() => switchChild(child.id)}
            >
              <Text className='baby-avatar'>{child.gender === 'girl' ? '👧' : '👦'}</Text>
              <Text className='baby-name'>{child.nickname || child.full_name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* 宝贝卡片 */}
      {currentChild && (
        <View className='baby-card'>
          <View className='baby-card-header'>
            <Text className='baby-card-avatar'>{currentChild.gender === 'girl' ? '👧' : '👦'}</Text>
            <View className='baby-card-info'>
              <Text className='baby-card-name'>{currentChild.nickname || currentChild.full_name}</Text>
              <Text className='baby-card-coins'>🪙 {currentChild.coins} 学习币</Text>
            </View>
          </View>
          <View className='baby-card-stats'>
            <View className='baby-stat'>
              <Text className='baby-stat-value'>🪙 {currentChild.coins}</Text>
              <Text className='baby-stat-label'>余额</Text>
            </View>
            <View className='baby-stat'>
              <Text className='baby-stat-value'>📊 --</Text>
              <Text className='baby-stat-label'>今日任务</Text>
            </View>
            <View className='baby-stat'>
              <Text className='baby-stat-value'>🔥 --</Text>
              <Text className='baby-stat-label'>连续打卡</Text>
            </View>
          </View>
          <View
            className='baby-card-action'
            onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}
          >
            <Text>查看详情 →</Text>
          </View>
        </View>
      )}

      {/* 待办事项 */}
      <View className='section-header'>
        <Text className='section-title'>⚡ 待办事项</Text>
      </View>

      <View className='empty-state' style={{ padding: '40rpx 0' }}>
        <Text className='icon'>✅</Text>
        <Text className='text'>暂无待办</Text>
        <Text className='sub-text'>所有事项都已处理完毕</Text>
      </View>

      {/* 最近动态 */}
      <View className='section-header'>
        <Text className='section-title'>📋 最近动态</Text>
      </View>

      <View className='empty-state' style={{ padding: '40rpx 0' }}>
        <Text className='icon'>📋</Text>
        <Text className='text'>暂无动态</Text>
        <Text className='sub-text'>宝贝的学习动态会显示在这里</Text>
      </View>

      <View className='bottom-safe' />
    </View>
  )
}

// ─── 主页面（根据角色切换） ────────────────────────────────────

export default function Index() {
  const role = useAuthStore((s) => s.role)
  return role === 'parent' ? <ParentGarden /> : <ChildHome />
}
