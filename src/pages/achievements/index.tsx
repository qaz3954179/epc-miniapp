import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { achievementApi } from '../../services/api'
import type { AchievementChildView } from '../../types'
import './index.scss'

export default function Achievements() {
  const [achievements, setAchievements] = useState<AchievementChildView[]>([])
  const [unlockedCount, setUnlockedCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const res = await achievementApi.getChildSummary()
      setAchievements(res.achievements)
      setUnlockedCount(res.unlocked_count)
      setTotalCount(res.total_count)
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
    return (
      <View className='achievements-page'>
        <View className='skeleton-card' />
        <View className='skeleton-grid'>
          {[1, 2, 3, 4, 5, 6].map((i) => <View key={i} className='skeleton-item' />)}
        </View>
      </View>
    )
  }

  const unlocked = achievements.filter((a) => a.unlocked)
  const locked = achievements.filter((a) => !a.unlocked)

  return (
    <View className='achievements-page'>
      {/* 概览 */}
      <View className='achieve-summary'>
        <Text className='achieve-summary-title'>🏆 我的成就</Text>
        <Text className='achieve-summary-count'>
          已解锁 {unlockedCount}/{totalCount}
        </Text>
        <View className='achieve-progress-bar'>
          <View
            className='achieve-progress-fill'
            style={{ width: totalCount > 0 ? `${(unlockedCount / totalCount) * 100}%` : '0%' }}
          />
        </View>
      </View>

      {/* 已解锁 */}
      {unlocked.length > 0 && (
        <>
          <View className='achieve-section-title'>
            <Text>✨ 已解锁</Text>
          </View>
          <View className='achieve-grid'>
            {unlocked.map((a) => (
              <View
                key={a.id}
                className='achieve-card unlocked'
                onClick={() => {
                  Taro.showModal({
                    title: `${a.icon} ${a.name}`,
                    content: a.reveal_message || a.description || '恭喜解锁！',
                    showCancel: false,
                  })
                }}
              >
                <Text className='achieve-icon'>{a.icon}</Text>
                <Text className='achieve-name'>{a.name}</Text>
                {a.unlocked_at && (
                  <Text className='achieve-date'>
                    {new Date(a.unlocked_at).toLocaleDateString('zh-CN')}
                  </Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {/* 未解锁 */}
      {locked.length > 0 && (
        <>
          <View className='achieve-section-title'>
            <Text>🔒 未解锁</Text>
          </View>
          <View className='achieve-grid'>
            {locked.map((a) => (
              <View key={a.id} className='achieve-card locked'>
                <Text className='achieve-icon'>
                  {a.category === 'hidden' ? '❓' : a.icon}
                </Text>
                <Text className='achieve-name'>
                  {a.category === 'hidden' ? '???' : a.name}
                </Text>
                {a.category === 'milestone' && a.description && (
                  <Text className='achieve-hint'>{a.description}</Text>
                )}
              </View>
            ))}
          </View>
        </>
      )}

      {achievements.length === 0 && (
        <View className='empty-state'>
          <Text className='icon'>🏆</Text>
          <Text className='text'>暂无成就</Text>
          <Text className='sub-text'>完成任务解锁成就吧！</Text>
        </View>
      )}
    </View>
  )
}
