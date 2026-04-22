import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const MENU_ITEMS = [
  { icon: '🏆', title: '我的成就', desc: '已解锁 8/20 个', url: '/pages/achievements/index' },
  { icon: '📈', title: '成长记录', desc: '本周完成 18/24 个任务', url: '/pages/growth/index' },
  { icon: '🪐', title: '我的星球', desc: '2 颗星球', url: '/pages/planet/index' },
  { icon: '📋', title: '兑换记录', desc: '最近：乐高积木', url: '' },
  { icon: '📮', title: '意见反馈', desc: '', url: '' },
  { icon: '⚙️', title: '设置', desc: '', url: '' },
]

export default function Profile() {
  const [user] = useState({
    nickname: '小明',
    coins: 1280,
    streak: 12,
    avatar: ''
  })

  useLoad(() => {
    console.log('我的页加载')
  })

  const handleMenuClick = (url: string) => {
    if (url) {
      Taro.navigateTo({ url })
    }
  }

  return (
    <View className='profile-page'>
      {/* 个人信息卡片 */}
      <View className='profile-card'>
        <View className='avatar'>😊</View>
        <View className='user-info'>
          <Text className='nickname'>{user.nickname}</Text>
          <View className='stats'>
            <View className='stat-item'>
              <Text className='stat-value'>🪙 {user.coins}</Text>
              <Text className='stat-label'>学习币</Text>
            </View>
            <View className='stat-item'>
              <Text className='stat-value'>🔥 {user.streak}</Text>
              <Text className='stat-label'>连续打卡</Text>
            </View>
          </View>
        </View>
      </View>

      {/* 菜单列表 */}
      <View className='menu-list'>
        {MENU_ITEMS.map((item, index) => (
          <View
            className='menu-item'
            key={index}
            onClick={() => handleMenuClick(item.url)}
          >
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

      {/* 退出登录 */}
      <View className='logout-btn'>
        <Text>退出登录</Text>
      </View>
    </View>
  )
}
