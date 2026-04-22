import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, useShareAppMessage } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const MOCK_TASKS = [
  { id: '1', title: '阅读 30 分钟', category: 'daily', emoji: '📚', coins: 10, completed: false, desc: '每天坚持阅读' },
  { id: '2', title: '跳绳 100 下', category: 'pe', emoji: '🏃', coins: 10, completed: true, desc: '锻炼身体' },
  { id: '3', title: '数学练习', category: 'exam', emoji: '📝', coins: 15, completed: false, desc: '完成 20 道题' },
  { id: '4', title: '英语单词', category: 'daily', emoji: '🔤', coins: 10, completed: false, desc: '背诵 10 个新单词' },
]

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

export default function Tasks() {
  const [tasks, setTasks] = useState(MOCK_TASKS)
  const [filter, setFilter] = useState('')

  useLoad(() => {
    console.log('任务页加载')
  })

  useShareAppMessage(() => ({
    title: '今天你打卡了吗？',
    path: '/pages/tasks/index'
  }))

  const handleCheckIn = (id: string) => {
    setTasks(prev => prev.map(t =>
      t.id === id ? { ...t, completed: true } : t
    ))
    Taro.showToast({ title: '太棒了！+10 🪙', icon: 'success' })
  }

  const filteredTasks = filter
    ? tasks.filter(t => t.category === filter)
    : tasks

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

      {/* 任务列表 */}
      <View className='task-section'>
        <Text className='section-title'>📅 今日任务</Text>
      </View>

      <ScrollView scrollY className='task-list'>
        {filteredTasks.map(task => {
          const color = CATEGORY_COLOR[task.category] || '#667eea'
          return (
            <View className={`task-card ${task.completed ? 'completed' : ''}`} key={task.id}>
              <View className='task-header' style={{ background: task.completed
                ? 'linear-gradient(135deg, #a8edea, #fed6e3)'
                : `linear-gradient(135deg, ${color}, ${color}dd)`
              }}>
                <View className='task-emoji'>{task.completed ? '✅' : task.emoji}</View>
                <View className='task-info'>
                  <Text className='task-title'>{task.title}</Text>
                  {task.desc && <Text className='task-desc'>{task.desc}</Text>}
                </View>
                <View className='task-coins'>🪙 +{task.coins}</View>
              </View>
              <View className='task-body'>
                {task.completed ? (
                  <View className='btn-done'>✓ 已完成</View>
                ) : (
                  <View className='btn-checkin' onClick={() => handleCheckIn(task.id)}>
                    完成打卡 💪
                  </View>
                )}
              </View>
            </View>
          )
        })}
      </ScrollView>
    </View>
  )
}
