import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { parentApi, redemptionApi, taskApi, childApi } from '../../services/api'
import type { PrizeRedemptionPublic, TaskCompletionPublic, ChildAccountPublic } from '../../types'
import './approve.scss'

const STATUS_MAP: Record<string, { label: string; color: string; emoji: string }> = {
  pending: { label: '待处理', color: '#ff9800', emoji: '⏳' },
  processing: { label: '处理中', color: '#2196f3', emoji: '📦' },
  completed: { label: '已完成', color: '#4caf50', emoji: '✅' },
  cancelled: { label: '已取消', color: '#999', emoji: '❌' },
  refunded: { label: '已退款', color: '#f44336', emoji: '↩️' },
}

export default function ParentApprove() {
  const [redemptions, setRedemptions] = useState<PrizeRedemptionPublic[]>([])
  const [completions, setCompletions] = useState<TaskCompletionPublic[]>([])
  const [children, setChildren] = useState<ChildAccountPublic[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'redemptions' | 'quality'>('redemptions')

  const childId = useAuthStore((s) => s.childId)
  const switchChild = useAuthStore((s) => s.switchChild)

  const loadData = useCallback(async () => {
    try {
      const childrenRes = await childApi.getChildren()
      setChildren(childrenRes.data)
      const cid = childId || childrenRes.data[0]?.id
      if (cid && !childId) switchChild(cid)

      if (cid) {
        const [redemRes, compRes] = await Promise.all([
          parentApi.getChildRedemptions(cid, 0, 50),
          parentApi.getChildCompletions(cid, 0, 20),
        ])
        setRedemptions(redemRes.data)
        setCompletions(compRes)
      }
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      setLoading(false)
      Taro.stopPullDownRefresh()
    }
  }, [childId, switchChild])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleShip = async (id: string) => {
    const res = await Taro.showModal({ title: '确认发货', content: '确认该兑换订单已发货？' })
    if (!res.confirm) return
    try {
      await redemptionApi.ship(id)
      Taro.showToast({ title: '已标记发货', icon: 'success' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleComplete = async (id: string) => {
    const res = await Taro.showModal({ title: '确认完成', content: '确认该兑换已完成？' })
    if (!res.confirm) return
    try {
      await redemptionApi.complete(id)
      Taro.showToast({ title: '已完成', icon: 'success' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleRefund = async (id: string) => {
    const res = await Taro.showModal({ title: '确认退款', content: '确认退还学习币？' })
    if (!res.confirm) return
    try {
      await redemptionApi.refund(id)
      Taro.showToast({ title: '已退款', icon: 'success' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: '操作失败', icon: 'error' })
    }
  }

  const handleRate = async (completionId: string, score: number) => {
    try {
      await taskApi.rateTaskQuality(completionId, score)
      Taro.showToast({ title: `评分 ${score} ⭐`, icon: 'success' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: '评分失败', icon: 'error' })
    }
  }

  const currentChild = children.find((c) => c.id === childId) || children[0]
  const pendingRedemptions = redemptions.filter((r) => r.status === 'pending' || r.status === 'processing')
  const historyRedemptions = redemptions.filter((r) => r.status !== 'pending' && r.status !== 'processing')
  const unratedCompletions = completions.filter((c) => c.quality_score === null)

  if (loading) {
    return <View className='approve-page'><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  return (
    <View className='approve-page'>
      {/* 宝贝切换 */}
      {children.length > 1 && (
        <ScrollView scrollX className='child-selector'>
          {children.map((child) => (
            <View
              key={child.id}
              className={`child-chip ${child.id === currentChild?.id ? 'active' : ''}`}
              onClick={() => { switchChild(child.id); loadData() }}
            >
              <Text>{child.gender === 'girl' ? '👧' : '👦'} {child.nickname || child.full_name}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      {/* Tab 切换 */}
      <View className='tab-bar'>
        <View className={`tab-item ${tab === 'redemptions' ? 'active' : ''}`} onClick={() => setTab('redemptions')}>
          <Text>🎁 兑换审批</Text>
          {pendingRedemptions.length > 0 && <View className='badge'>{pendingRedemptions.length}</View>}
        </View>
        <View className={`tab-item ${tab === 'quality' ? 'active' : ''}`} onClick={() => setTab('quality')}>
          <Text>⭐ 任务评分</Text>
          {unratedCompletions.length > 0 && <View className='badge'>{unratedCompletions.length}</View>}
        </View>
      </View>

      {tab === 'redemptions' ? (
        <ScrollView scrollY className='content-scroll'>
          {pendingRedemptions.length > 0 && (
            <>
              <Text className='section-label'>待处理</Text>
              {pendingRedemptions.map((r) => {
                const st = STATUS_MAP[r.status] || STATUS_MAP.pending
                return (
                  <View className='redemption-card pending' key={r.id}>
                    <View className='redemption-header'>
                      <Text className='redemption-name'>{st.emoji} {r.prize_name}</Text>
                      <Text className='redemption-status' style={{ color: st.color }}>{st.label}</Text>
                    </View>
                    <View className='redemption-meta'>
                      <Text>🪙 {r.coins_spent} · {new Date(r.redeemed_at).toLocaleDateString('zh-CN')}</Text>
                    </View>
                    {r.prize_type === 'physical' && r.recipient_address && (
                      <Text className='redemption-address'>📍 {r.recipient_name} {r.recipient_address}</Text>
                    )}
                    <View className='action-row'>
                      {r.status === 'pending' && (
                        <>
                          <View className='btn-action ship' onClick={() => handleShip(r.id)}><Text>发货</Text></View>
                          <View className='btn-action refund' onClick={() => handleRefund(r.id)}><Text>退款</Text></View>
                        </>
                      )}
                      {r.status === 'processing' && (
                        <View className='btn-action complete' onClick={() => handleComplete(r.id)}><Text>确认完成</Text></View>
                      )}
                    </View>
                  </View>
                )
              })}
            </>
          )}

          {historyRedemptions.length > 0 && (
            <>
              <Text className='section-label'>历史记录</Text>
              {historyRedemptions.slice(0, 10).map((r) => {
                const st = STATUS_MAP[r.status] || STATUS_MAP.pending
                return (
                  <View className='redemption-card' key={r.id}>
                    <View className='redemption-header'>
                      <Text className='redemption-name'>{st.emoji} {r.prize_name}</Text>
                      <Text className='redemption-status' style={{ color: st.color }}>{st.label}</Text>
                    </View>
                    <View className='redemption-meta'>
                      <Text>🪙 {r.coins_spent} · {new Date(r.redeemed_at).toLocaleDateString('zh-CN')}</Text>
                    </View>
                  </View>
                )
              })}
            </>
          )}

          {redemptions.length === 0 && (
            <View className='empty-state'>
              <Text className='icon'>🎁</Text>
              <Text className='text'>暂无兑换记录</Text>
            </View>
          )}
        </ScrollView>
      ) : (
        <ScrollView scrollY className='content-scroll'>
          {unratedCompletions.length > 0 ? (
            <>
              <Text className='section-label'>待评分 ({unratedCompletions.length})</Text>
              {unratedCompletions.map((c) => (
                <View className='completion-card' key={c.id}>
                  <View className='completion-info'>
                    <Text className='completion-time'>
                      {new Date(c.completed_at).toLocaleString('zh-CN', {
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                    <Text className='completion-trigger'>
                      {c.trigger_type === 'self_initiated' ? '🌟 主动完成' :
                       c.trigger_type === 'parent_reminded' ? '📢 提醒后完成' : '⏰ 截止前完成'}
                    </Text>
                  </View>
                  <View className='star-row'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} className='star' onClick={() => handleRate(c.id, s)}>
                        {s <= (c.quality_score || 0) ? '⭐' : '☆'}
                      </Text>
                    ))}
                  </View>
                </View>
              ))}
            </>
          ) : (
            <View className='empty-state'>
              <Text className='icon'>⭐</Text>
              <Text className='text'>所有任务都已评分</Text>
              <Text className='sub-text'>宝贝完成新任务后可以在这里评分</Text>
            </View>
          )}

          {completions.filter((c) => c.quality_score !== null).length > 0 && (
            <>
              <Text className='section-label'>已评分</Text>
              {completions.filter((c) => c.quality_score !== null).slice(0, 10).map((c) => (
                <View className='completion-card rated' key={c.id}>
                  <View className='completion-info'>
                    <Text className='completion-time'>
                      {new Date(c.completed_at).toLocaleString('zh-CN', {
                        month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit',
                      })}
                    </Text>
                  </View>
                  <View className='star-row'>
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Text key={s} className='star'>{s <= (c.quality_score || 0) ? '⭐' : '☆'}</Text>
                    ))}
                  </View>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <View className='bottom-safe' />
    </View>
  )
}
