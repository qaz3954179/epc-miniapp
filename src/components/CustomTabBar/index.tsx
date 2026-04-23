// ============================================================
// 自定义 TabBar — 根据角色动态切换标签
// ============================================================
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useAuthStore } from '../../store/auth'
import './index.scss'

interface TabItem {
  pagePath: string
  text: string
  icon: string
  activeIcon: string
}

const CHILD_TABS: TabItem[] = [
  { pagePath: '/pages/index/index', text: '首页', icon: '🏠', activeIcon: '🏠' },
  { pagePath: '/pages/tasks/index', text: '任务', icon: '📝', activeIcon: '📝' },
  { pagePath: '/pages/store/index', text: '商城', icon: '🛒', activeIcon: '🛒' },
  { pagePath: '/pages/profile/index', text: '我的', icon: '👤', activeIcon: '👤' },
]

const PARENT_TABS: TabItem[] = [
  { pagePath: '/pages/index/index', text: '花园', icon: '🏠', activeIcon: '🏠' },
  { pagePath: '/pages/tasks/index', text: '数据', icon: '📊', activeIcon: '📊' },
  { pagePath: '/pages/store/index', text: '审批', icon: '⚡', activeIcon: '⚡' },
  { pagePath: '/pages/profile/index', text: '我的', icon: '👤', activeIcon: '👤' },
]

interface CustomTabBarProps {
  current: number
}

export default function CustomTabBar({ current }: CustomTabBarProps) {
  const role = useAuthStore((s) => s.role)
  const tabs = role === 'parent' ? PARENT_TABS : CHILD_TABS

  const handleSwitch = (index: number) => {
    if (index === current) return
    Taro.switchTab({ url: tabs[index].pagePath })
  }

  return (
    <View className='custom-tab-bar'>
      {tabs.map((tab, index) => {
        const isActive = index === current
        return (
          <View
            key={tab.pagePath}
            className={`tab-item ${isActive ? 'active' : ''}`}
            onClick={() => handleSwitch(index)}
          >
            <Text className='tab-icon'>
              {isActive ? tab.activeIcon : tab.icon}
            </Text>
            <Text className='tab-text'>{tab.text}</Text>
          </View>
        )
      })}
    </View>
  )
}
