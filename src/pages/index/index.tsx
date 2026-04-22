import { View, Text, ScrollView, Image } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

// TODO: 替换为真实 API
const MOCK_USER = {
  nickname: '小明',
  coins: 1280,
  streak: 12,
  avatar: ''
}

const MOCK_TASKS = [
  { id: '1', title: '阅读 30 分钟', category: 'daily', emoji: '📚', coins: 10, completed: false },
  { id: '2', title: '跳绳 100 下', category: 'pe', emoji: '🏃', coins: 10, completed: true },
  { id: '3', title: '数学练习', category: 'exam', emoji: '📝', coins: 15, completed: false },
]

export default function Index() {
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const completedCount = tasks.filter(t => t.completed).length

  useLoad(() => {
    console.log('首页加载')
    // TODO: 检查登录状态
  })

  useShareAppMessage(() => ({
    title: '一起来学习打卡吧！',
    path: '/pages/index/index'
  }))

  const handleCheckIn = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true } : t
    ))
    Taro.showToast({ title: '太棒了！打卡成功 🎉', icon: 'success' })
  }

  const progressPercent = tasks.length > 0
    ? Math.round((completedCount / tasks.length) * 100)
    : 0

  return (
    <View className='container'>
      {/* 顶部问候 */}
      <View className='greeting'>
        <Text className='greeting-text'>👋 {MOCK_USER.nickname}，今天加油哦！</Text>
      </View>

      {/* 余额卡片 */}
      <View className='coins-card'>
        <View className='coins-left'>
          <Text className='coins-label'>学习币余额</Text>
          <Text className='coins-value'>{MOCK_USER.coins}</Text>
          <Text className='coins-tip'>完成任务赚更多 →</Text>
        </View>
        <View className='coins-icon'>🪙</View>
      </View>

      {/* 今日进度 */}
      <View className='progress-card'>
        <Text className='progress-title'>今日任务进度</Text>
        <View className='progress-bar-bg'>
          <View
            className='progress-bar-fill'
            style={{ width: `${progressPercent}%` }}
          />
        </View>
        <Text className='progress-text'>{completedCount} / {tasks.length} 完成 · {progressPercent}%</Text>
      </View>

      {/* 快捷入口 */}
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

      {/* 今日任务列表 */}
      <View className='section-header'>
        <Text className='section-title'>今日任务</Text>
        <Text className='section-more' onClick={() => Taro.navigateTo({ url: '/pages/tasks/index' })}>
          查看全部 →
        </Text>
      </View>

      <ScrollView scrollY className='task-list'>
        {tasks.map(task => (
          <View className={`task-card ${task.completed ? 'completed' : ''}`} key={task.id}>
            <View className='task-card-inner'>
              <View className='task-emoji'>{task.completed ? '✅' : task.emoji}</View>
              <View className='task-info'>
                <Text className='task-title'>{task.title}</Text>
                <Text className='task-coins'>+{task.coins} 🪙</Text>
              </View>
              {task.completed ? (
                <View className='task-status done'>已完成</View>
              ) : (
                <View className='btn-checkin' onClick={() => handleCheckIn(task.id)}>
                  打卡
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* 底部占位 */}
      <View className='bottom-safe' />
    </View>
  )
}
