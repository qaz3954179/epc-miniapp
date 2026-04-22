import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

const MOCK_PRIZES = [
  { id: '1', name: '乐高积木', coins: 500, image: '', desc: '经典积木套装' },
  { id: '2', name: '彩色铅笔', coins: 100, image: '', desc: '36 色彩色铅笔' },
  { id: '3', name: '故事书', coins: 200, image: '', desc: '经典童话故事合集' },
  { id: '4', name: '跳绳', coins: 150, image: '', desc: '儿童专用跳绳' },
  { id: '5', name: '拼图', coins: 300, image: '', desc: '500 片拼图' },
  { id: '6', name: '画笔套装', coins: 400, image: '', desc: '专业画笔 24 支装' },
]

export default function Store() {
  const [coins] = useState(1280)
  const [tab, setTab] = useState('store')

  useLoad(() => {
    console.log('商城页加载')
  })

  const handleRedeem = (prize: typeof MOCK_PRIZES[0]) => {
    Taro.showModal({
      title: '确认兑换',
      content: `奖品：${prize.name}\n需要：🪙 ${prize.coins}\n兑换后余额：🪙 ${coins - prize.coins}`,
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '兑换成功 🎉', icon: 'success' })
        }
      }
    })
  }

  return (
    <View className='store-page'>
      {/* 余额头 */}
      <View className='coins-header'>
        <Text className='coins-label'>🪙 学习币余额</Text>
        <Text className='coins-value'>{coins}</Text>
      </View>

      {/* Tab 切换 */}
      <View className='tab-bar'>
        <View
          className={`tab-item ${tab === 'store' ? 'active' : ''}`}
          onClick={() => setTab('store')}
        >
          全部
        </View>
        <View
          className={`tab-item ${tab === '文具' ? 'active' : ''}`}
          onClick={() => setTab('文具')}
        >
          文具
        </View>
        <View
          className={`tab-item ${tab === '玩具' ? 'active' : ''}`}
          onClick={() => setTab('玩具')}
        >
          玩具
        </View>
        <View
          className={`tab-item ${tab === 'virtual' ? 'active' : ''}`}
          onClick={() => setTab('virtual')}
        >
          虚拟
        </View>
      </View>

      {/* 奖品网格 */}
      <ScrollView scrollY className='prize-list'>
        <View className='prize-grid'>
          {MOCK_PRIZES.map(prize => (
            <View className='prize-card' key={prize.id}>
              <View className='prize-image'>🎁</View>
              <View className='prize-info'>
                <Text className='prize-name'>{prize.name}</Text>
                <Text className='prize-desc'>{prize.desc}</Text>
                <View className='prize-footer'>
                  <Text className='prize-coins'>🪙 {prize.coins}</Text>
                  <View
                    className={`btn-redeem ${coins < prize.coins ? 'disabled' : ''}`}
                    onClick={() => coins >= prize.coins && handleRedeem(prize)}
                  >
                    {coins < prize.coins ? '币不足' : '兑换'}
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
