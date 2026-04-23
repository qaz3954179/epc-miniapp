import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { prizeApi, authApi, examApi } from '../../services/api'
import type { PrizePublic, ExamBookingPublic, PrizeRedemptionPublic } from '../../types'
import './index.scss'

// ─── 孩子端商城 ───────────────────────────────────────────────

function ChildStore() {
  const [prizes, setPrizes] = useState<PrizePublic[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('全部')

  const balance = useAuthStore((s) => s.user?.coins ?? 0)
  const updateUser = useAuthStore((s) => s.updateUser)

  const loadData = useCallback(async () => {
    try {
      const [prizesRes, userRes] = await Promise.all([prizeApi.getPrizes(), authApi.getMe()])
      setPrizes(prizesRes.data)
      updateUser(userRes)
    } catch (err) {
      console.error('加载失败:', err)
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
        const userRes = await authApi.getMe()
        updateUser(userRes)
        Taro.showToast({ title: '兑换成功 🎉', icon: 'success' })
      }
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '兑换失败', icon: 'error' })
    }
  }

  const categories = ['全部', ...new Set(prizes.map((p) => p.prize_type === 'physical' ? '实物' : '虚拟'))]
  const filteredPrizes = tab === '全部' ? prizes : prizes.filter((p) => tab === '实物' ? p.prize_type === 'physical' : p.prize_type === 'virtual')
  const activePrizes = filteredPrizes.filter((p) => p.is_active && p.stock > 0)

  if (loading) {
    return <View className='store-page'><View className='skeleton-card' /></View>
  }

  return (
    <View className='store-page'>
      <View className='coins-header'>
        <Text className='coins-label'>🪙 学习币余额</Text>
        <Text className='coins-value'>{balance}</Text>
      </View>

      {categories.length > 1 && (
        <View className='tab-bar'>
          {categories.map((cat) => (
            <View key={cat} className={`tab-item ${tab === cat ? 'active' : ''}`} onClick={() => setTab(cat)}>{cat}</View>
          ))}
        </View>
      )}

      <ScrollView scrollY className='prize-list'>
        {activePrizes.length === 0 ? (
          <View className='empty-state'><Text className='icon'>🎁</Text><Text className='text'>暂无奖品</Text></View>
        ) : (
          <View className='prize-grid'>
            {activePrizes.map((prize) => (
              <View className='prize-card' key={prize.id}>
                <View className='prize-image'>
                  <Text className='prize-emoji'>🎁</Text>
                </View>
                <View className='prize-info'>
                  <Text className='prize-name'>{prize.name}</Text>
                  {prize.description && <Text className='prize-desc'>{prize.description}</Text>}
                  <View className='prize-footer'>
                    <Text className='prize-coins'>🪙 {prize.coins_cost}</Text>
                    <View
                      className={`btn-redeem ${balance < prize.coins_cost ? 'disabled' : ''}`}
                      onClick={() => balance >= prize.coins_cost && handleRedeem(prize)}
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

// ─── 家长端审批页 ─────────────────────────────────────────────

function ParentApproval() {
  const [bookings, setBookings] = useState<ExamBookingPublic[]>([])
  const [redemptions, setRedemptions] = useState<PrizeRedemptionPublic[]>([])
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [bookingsRes, redemptionsRes] = await Promise.all([
        examApi.getBookings(),
        prizeApi.getMyRedemptions(),
      ])
      setBookings(bookingsRes.data)
      setRedemptions(redemptionsRes.data)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending')
  const upcomingBookings = bookings.filter((b) => b.status === 'booked')

  if (loading) {
    return <View className='store-page'><View className='skeleton-card' /></View>
  }

  return (
    <View className='store-page'>
      <View className='approval-header'>
        <Text className='approval-title'>⚡ 审批中心</Text>
      </View>

      {/* 兑换审批 */}
      <View className='approval-section'>
        <Text className='approval-section-title'>🎁 兑换审批 ({pendingRedemptions.length})</Text>
      </View>

      {pendingRedemptions.length === 0 ? (
        <View className='empty-state' style={{ padding: '40rpx 0' }}>
          <Text className='text'>暂无待审批兑换</Text>
        </View>
      ) : (
        <View style={{ padding: '0 24rpx' }}>
          {pendingRedemptions.map((r) => (
            <View key={r.id} className='approval-card'>
              <View className='approval-card-header'>
                <Text className='approval-card-title'>🎁 {r.prize_name}</Text>
                <View className='approval-badge pending'>待确认</View>
              </View>
              <View className='approval-card-body'>
                <Text className='approval-card-meta'>花费 🪙 {r.coins_spent}</Text>
                <Text className='approval-card-meta'>
                  {new Date(r.redeemed_at).toLocaleString('zh-CN')}
                </Text>
              </View>
              <View className='approval-card-actions'>
                <View className='btn-approve'>确认</View>
                <View className='btn-reject'>拒绝</View>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 考试安排 */}
      <View className='approval-section'>
        <Text className='approval-section-title'>📝 考试安排 ({upcomingBookings.length})</Text>
      </View>

      {upcomingBookings.length === 0 ? (
        <View className='empty-state' style={{ padding: '40rpx 0' }}>
          <Text className='text'>暂无考试安排</Text>
        </View>
      ) : (
        <View style={{ padding: '0 24rpx' }}>
          {upcomingBookings.map((b) => (
            <View key={b.id} className='approval-card'>
              <View className='approval-card-header'>
                <Text className='approval-card-title'>📝 {b.template?.title || '考试'}</Text>
                <View className='approval-badge booked'>已预约</View>
              </View>
              <View className='approval-card-body'>
                <Text className='approval-card-meta'>
                  {new Date(b.scheduled_at).toLocaleString('zh-CN')}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* 已完成 */}
      {redemptions.filter((r) => r.status !== 'pending').length > 0 && (
        <>
          <View className='approval-section'>
            <Text className='approval-section-title'>✅ 已处理</Text>
          </View>
          <View style={{ padding: '0 24rpx' }}>
            {redemptions.filter((r) => r.status !== 'pending').slice(0, 5).map((r) => (
              <View key={r.id} className='approval-card done'>
                <View className='approval-card-header'>
                  <Text className='approval-card-title'>{r.prize_name}</Text>
                  <View className={`approval-badge ${r.status}`}>
                    {r.status === 'completed' ? '已完成' : r.status === 'processing' ? '处理中' : r.status === 'cancelled' ? '已取消' : r.status}
                  </View>
                </View>
              </View>
            ))}
          </View>
        </>
      )}

      <View className='bottom-safe' />
    </View>
  )
}

// ─── 主页面 ───────────────────────────────────────────────────

export default function Store() {
  const role = useAuthStore((s) => s.role)
  return role === 'parent' ? <ParentApproval /> : <ChildStore />
}
