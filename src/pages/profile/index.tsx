import { View, Text } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { authApi, achievementApi, growthApi, childApi } from '../../services/api'
import type { AchievementChildSummary, HeatmapData, ChildAccountPublic } from '../../types'
import './index.scss'

// ─── 孩子端我的 ───────────────────────────────────────────────

function ChildProfile() {
  const [achieveSummary, setAchieveSummary] = useState<AchievementChildSummary | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)

  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const switchRole = useAuthStore((s) => s.switchRole)
  const logout = useAuthStore((s) => s.logout)

  const loadData = useCallback(async () => {
    try {
      const [userRes, achieveRes, heatRes] = await Promise.all([
        authApi.getMe(),
        achievementApi.getChildSummary().catch(() => null),
        growthApi.getHeatmap(7).catch(() => null),
      ])
      updateUser(userRes)
      if (achieveRes) setAchieveSummary(achieveRes)
      if (heatRes) setHeatmap(heatRes)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleLogout = async () => {
    const res = await Taro.showModal({ title: '确认退出', content: '确定要退出登录吗？' })
    if (res.confirm) {
      logout()
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  const handleSwitchRole = () => {
    switchRole('parent')
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const weekCompleted = heatmap?.days.reduce((sum, d) => sum + d.count, 0) ?? 0

  const MENU_ITEMS = [
    { icon: '🏆', title: '我的成就', desc: achieveSummary ? `已解锁 ${achieveSummary.unlocked_count}/${achieveSummary.total_count}` : '', url: '/pages/achievements/index' },
    { icon: '📈', title: '成长记录', desc: `本周完成 ${weekCompleted} 个任务`, url: '/pages/growth/index' },
    { icon: '🪐', title: '我的星球', desc: '即将上线', url: '/pages/planet/index' },
    { icon: '📋', title: '兑换记录', desc: '', url: '' },
    { icon: '📮', title: '意见反馈', desc: '', url: '' },
    { icon: '⚙️', title: '设置', desc: '', url: '' },
  ]

  return (
    <View className='profile-page'>
      <View className='profile-card'>
        <View className='avatar'>{user?.gender === 'girl' ? '👧' : user?.gender === 'boy' ? '👦' : '😊'}</View>
        <View className='user-info'>
          <Text className='nickname'>{user?.nickname || user?.full_name || '同学'}</Text>
          <View className='stats'>
            <View className='stat-item'>
              <Text className='stat-value'>🪙 {user?.coins ?? 0}</Text>
              <Text className='stat-label'>学习币</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>🔥 {heatmap?.current_streak ?? 0}</Text>
              <Text className='stat-label'>连续打卡</Text>
            </View>
          </View>
        </View>
      </View>

      <View className='menu-list'>
        {MENU_ITEMS.map((item, i) => (
          <View key={i} className='menu-item' onClick={() => item.url && Taro.navigateTo({ url: item.url })}>
            <View className='menu-left'>
              <Text className='menu-icon'>{item.icon}</Text>
              <Text className='menu-title'>{item.title}</Text>
            </View>
            <View className='menu-right'>
              {item.desc && <Text className='menu-desc'>{item.desc}</Text>}
              <Text className='menu-arrow'>›</Text>
            </View>
          </View>
        ))}
      </View>

      {/* 角色切换 */}
      {user?.parent_id === null && (
        <View className='menu-list' style={{ marginTop: '24rpx' }}>
          <View className='menu-item' onClick={handleSwitchRole}>
            <View className='menu-left'>
              <Text className='menu-icon'>🔄</Text>
              <Text className='menu-title'>切换到家长</Text>
            </View>
            <View className='menu-right'><Text className='menu-arrow'>›</Text></View>
          </View>
        </View>
      )}

      <View className='logout-btn' onClick={handleLogout}>
        <Text>退出登录</Text>
      </View>
    </View>
  )
}

// ─── 家长端我的 ───────────────────────────────────────────────

function ParentProfile() {
  const [children, setChildren] = useState<ChildAccountPublic[]>([])

  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const switchRole = useAuthStore((s) => s.switchRole)
  const logout = useAuthStore((s) => s.logout)

  const loadData = useCallback(async () => {
    try {
      const [userRes, childrenRes] = await Promise.all([
        authApi.getMe(),
        childApi.getChildren(),
      ])
      updateUser(userRes)
      setChildren(childrenRes.data)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleLogout = async () => {
    const res = await Taro.showModal({ title: '确认退出', content: '确定要退出登录吗？' })
    if (res.confirm) {
      logout()
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  const handleSwitchToChild = () => {
    switchRole('child')
    Taro.switchTab({ url: '/pages/index/index' })
  }

  const childNames = children.map((c) => c.nickname || c.full_name).join(' · ')

  const MENU_ITEMS = [
    { icon: '👶', title: '我的宝贝', desc: childNames || '暂无', url: '' },
    { icon: '📋', title: '任务管理', desc: '跳转 Web 端', url: '' },
    { icon: '🎁', title: '奖品管理', desc: '跳转 Web 端', url: '' },
    { icon: '📣', title: '推广邀请', desc: `推荐码: ${user?.referral_code || ''}`, url: '' },
    { icon: '📮', title: '意见反馈', desc: '', url: '' },
    { icon: '⚙️', title: '设置', desc: '', url: '' },
  ]

  return (
    <View className='profile-page'>
      <View className='profile-card parent'>
        <View className='avatar'>👨‍👩‍👧</View>
        <View className='user-info'>
          <Text className='nickname'>{user?.full_name || user?.nickname || '家长'}</Text>
          <Text className='user-email'>{user?.email || ''}</Text>
        </View>
      </View>

      <View className='menu-list'>
        {MENU_ITEMS.map((item, i) => (
          <View key={i} className='menu-item' onClick={() => item.url && Taro.navigateTo({ url: item.url })}>
            <View className='menu-left'>
              <Text className='menu-icon'>{item.icon}</Text>
              <Text className='menu-title'>{item.title}</Text>
            </View>
            <View className='menu-right'>
              {item.desc && <Text className='menu-desc'>{item.desc}</Text>}
              <Text className='menu-arrow'>›</Text>
            </View>
          </View>
        ))}
      </View>

      <View className='menu-list' style={{ marginTop: '24rpx' }}>
        <View className='menu-item' onClick={handleSwitchToChild}>
          <View className='menu-left'>
            <Text className='menu-icon'>🔄</Text>
            <Text className='menu-title'>切换到孩子</Text>
          </View>
          <View className='menu-right'><Text className='menu-arrow'>›</Text></View>
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>
        <Text>退出登录</Text>
      </View>
    </View>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────

export default function Profile() {
  const role = useAuthStore((s) => s.role)
  return role === 'parent' ? <ParentProfile /> : <ChildProfile />
}
