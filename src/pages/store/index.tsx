import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { prizeApi, authApi } from '../../services/api'
import type { PrizePublic } from '../../types'
import './index.scss'

export default function Store() {
  const [prizes, setPrizes] = useState<PrizePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('全部')

  const balance = useAuthStore((s) => s.user?.coins ?? 0)
  const updateUser = useAuthStore((s) => s.updateUser)

  const loadData = useCallback(async () => {
    try {
      const [prizesRes, userRes] = await Promise.all([
        prizeApi.getPrizes(),
        authApi.getMe(),
      ])
      setPrizes(prizesRes.data)
      updateUser(userRes)
    } catch (err) {
      console.error('加载失败:', err)
      Taro.showToast({ title: '加载失败', icon: 'error' })
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleRedeem = async (prize: PrizePublic) => {
    try {
      const res = await Taro.showModal({
        title: '确认兑换',
        content: `奖品：${prize.name}\n需要：🪙 ${prize.coins_cost}\n余额：🪙 ${balance}\n兑换后：🪙 ${balance - prize.coins_cost}`,
      })

      if (res.confirm) {
        await prizeApi.redeemPrize(prize.id)

        // 刷新余额
        const userRes = await authApi.getMe()
        updateUser(userRes)

        Taro.showToast({ title: '兑换成功 🎉', icon: 'success' })
      }
    } catch (err) {
      Taro.showToast({
        title: err instanceof Error ? err.message : '兑换失败',
        icon: 'error',
      })
    }
  }

  // 提取所有分类
  const categories = ['全部', ...new Set(prizes.map((p) => p.prize_type === 'physical' ? '实物' : '虚拟'))]

  const filteredPrizes = tab === '全部'
    ? prizes
    : prizes.filter((p) =>
        tab === '实物' ? p.prize_type === 'physical' : p.prize_type === 'virtual'
      )

  const activePrizes = filteredPrizes.filter((p) => p.is_active && p.stock > 0)

  if (loading) {
    return (
      <View className='store-page'>
        <View className='skeleton-card' />
        <View className='skeleton-grid'>
          <View className='skeleton-card small' />
          <View className='skeleton-card small' />
          <View className='skeleton-card small' />
          <View className='skeleton-card small' />
        </View>
      </View>
    )
  }

  return (
    <View className='store-page'>
      {/* 余额头 */}
      <View className='coins-header'>
        <Text className='coins-label'>🪙 学习币余额</Text>
        <Text className='coins-value'>{balance}</Text>
      </View>

      {/* Tab 切换 */}
      {categories.length > 1 && (
        <View className='tab-bar'>
          {categories.map((cat) => (
            <View
              key={cat}
              className={`tab-item ${tab === cat ? 'active' : ''}`}
              onClick={() => setTab(cat)}
            >
              {cat}
            </View>
          ))}
        </View>
      )}

      {/* 奖品网格 */}
      <ScrollView scrollY className='prize-list'>
        {activePrizes.length === 0 ? (
          <View className='empty-state'>
            <Text className='icon'>🎁</Text>
            <Text className='text'>暂无奖品</Text>
            <Text className='sub-text'>管理员正在补充中...</Text>
          </View>
        ) : (
          <View className='prize-grid'>
            {activePrizes.map((prize) => (
              <View className='prize-card' key={prize.id}>
                <View className='prize-image'>
                  {prize.image_url ? (
                    <image src={prize.image_url} mode='aspectFill' className='prize-img' />
                  ) : (
                    <Text className='prize-emoji'>🎁</Text>
                  )}
                </View>
                <View className='prize-info'>
                  <Text className='prize-name'>{prize.name}</Text>
                  {prize.description && (
                    <Text className='prize-desc'>{prize.description}</Text>
                  )}
                  <View className='prize-footer'>
                    <Text className='prize-coins'>🪙 {prize.coins_cost}</Text>
                    <View
                      className={`btn-redeem ${balance < prize.coins_cost ? 'disabled' : ''}`}
                      onClick={() =>
                        balance >= prize.coins_cost && handleRedeem(prize)
                      }
                    >
                      {balance < prize.coins_cost ? '攒币中' : '兑换'}
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  )
}
