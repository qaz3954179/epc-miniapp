import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { childApi, parentApi, growthApi } from '../../services/api'
import type { ChildAccountPublic, HeatmapData } from '../../types'
import './garden.scss'

interface ChildDashboard {
  child: ChildAccountPublic
  todayTasks: number
  heatmap: HeatmapData | null
}

export default function ParentGarden() {
  const [childDashboards, setChildDashboards] = useState<ChildDashboard[]>([])
  const [loading, setLoading] = useState(true)

  const user = useAuthStore((s) => s.user)
  const switchChild = useAuthStore((s) => s.switchChild)

  const loadData = useCallback(async () => {
    try {
      const childrenRes = await childApi.getChildren()
      const dashboards: ChildDashboard[] = await Promise.all(
        childrenRes.data.map(async (child) => {
          const [dashRes, heatRes] = await Promise.all([
            parentApi.getChildDashboard(child.id).catch(() => null),
            growthApi.getHeatmap(7).catch(() => null),
          ])
          return {
            child,
            todayTasks: dashRes?.today_tasks ?? 0,
            heatmap: heatRes,
          }
        })
      )
      setChildDashboards(dashboards)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleAddChild = () => {
    // TODO: 跳转到添加宝贝页面
    Taro.showToast({ title: '请在 Web 端添加宝贝', icon: 'none' })
  }

  const handleViewChild = (childId: string) => {
    switchChild(childId)
    Taro.switchTab({ url: '/pages/tasks/index' })
  }

  const getGreeting = () => {
    const h = new Date().getHours()
    return h < 12 ? '早上好' : h < 18 ? '下午好' : '晚上好'
  }

  if (loading) {
    return <View className='garden-page'><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  return (
    <View className='garden-page'>
      <View className='greeting'>
        <Text className='greeting-text'>🏠 {getGreeting()}，{user?.full_name || user?.nickname || '家长'}</Text>
        <Text className='greeting-sub'>宝贝花园 · {childDashboards.length} 个宝贝</Text>
      </View>

      {childDashboards.length === 0 ? (
        <View className='empty-state'>
          <Text className='icon'>👶</Text>
          <Text className='text'>还没有添加宝贝</Text>
          <Text className='sub-text'>添加第一个宝贝开始学习之旅</Text>
          <View className='btn-add' onClick={handleAddChild}><Text>+ 添加宝贝</Text></View>
        </View>
      ) : (
        <ScrollView scrollY className='garden-list'>
          {childDashboards.map(({ child, todayTasks, heatmap }) => (
            <View className='child-card' key={child.id} onClick={() => handleViewChild(child.id)}>
              <View className='child-card-header'>
                <Text className='child-avatar'>{child.gender === 'girl' ? '👧' : '👦'}</Text>
                <View className='child-info'>
                  <Text className='child-name'>{child.nickname || child.full_name}</Text>
                  <Text className='child-coins'>🪙 {child.coins} 学习币</Text>
                </View>
                <Text className='child-arrow'>›</Text>
              </View>

              <View className='child-stats'>
                <View className='child-stat'>
                  <Text className='stat-value'>✅ {todayTasks}</Text>
                  <Text className='stat-label'>今日完成</Text>
                </View>
                <View className='child-stat'>
                  <Text className='stat-value'>🔥 {heatmap?.current_streak ?? 0}</Text>
                  <Text className='stat-label'>连续打卡</Text>
                </View>
                <View className='child-stat'>
                  <Text className='stat-value'>🏆 {heatmap?.longest_streak ?? 0}</Text>
                  <Text className='stat-label'>最长连续</Text>
                </View>
              </View>

              {/* 迷你热力图 */}
              {heatmap && heatmap.days.length > 0 && (
                <View className='mini-heatmap'>
                  {heatmap.days.slice(-7).map((day) => {
                    const level = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 4 ? 2 : 3
                    return <View key={day.date} className={`mini-cell level-${level}`} />
                  })}
                </View>
              )}
            </View>
          ))}

          <View className='btn-add-bottom' onClick={handleAddChild}>
            <Text>+ 添加宝贝</Text>
          </View>
        </ScrollView>
      )}

      {/* 快捷入口 */}
      {childDashboards.length > 0 && (
        <View className='quick-actions'>
          <View className='quick-action' onClick={() => Taro.switchTab({ url: '/pages/tasks/index' })}>
            <Text className='qa-icon'>📊</Text>
            <Text className='qa-text'>数据</Text>
          </View>
          <View className='quick-action' onClick={() => Taro.navigateTo({ url: '/pages/parent/approve' })}>
            <Text className='qa-icon'>⚡</Text>
            <Text className='qa-text'>审批</Text>
          </View>
          <View className='quick-action' onClick={() => Taro.switchTab({ url: '/pages/store/index' })}>
            <Text className='qa-icon'>🎁</Text>
            <Text className='qa-text'>商城</Text>
          </View>
        </View>
      )}

      <View className='bottom-safe' />
    </View>
  )
}
