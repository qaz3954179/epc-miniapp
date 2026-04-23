import { View, Text, ScrollView } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { parentApi, sdiApi, growthApi, childApi } from '../../services/api'
import type { ChildAccountPublic, SDIDashboard, HeatmapData, ProgressReport } from '../../types'
import './data.scss'

const DIMENSION_LABELS: Record<string, { label: string; emoji: string }> = {
  initiative: { label: '主动性', emoji: '🚀' },
  exploration: { label: '探索力', emoji: '🔍' },
  persistence: { label: '坚持力', emoji: '💪' },
  quality: { label: '完成质量', emoji: '✨' },
}

export default function ParentData() {
  const [children, setChildren] = useState<ChildAccountPublic[]>([])
  const [dashboard, setDashboard] = useState<{ coins: number; today_tasks: number; total_tasks: number } | null>(null)
  const [sdi, setSdi] = useState<SDIDashboard | null>(null)
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [progress, setProgress] = useState<ProgressReport | null>(null)
  const [loading, setLoading] = useState(true)

  const childId = useAuthStore((s) => s.childId)
  const switchChild = useAuthStore((s) => s.switchChild)
  const currentChild = children.find((c) => c.id === childId) || children[0]

  const loadData = useCallback(async () => {
    try {
      const childrenRes = await childApi.getChildren()
      setChildren(childrenRes.data)
      const cid = childId || childrenRes.data[0]?.id
      if (cid && !childId) switchChild(cid)

      if (cid) {
        const [dashRes, sdiRes, heatRes, progRes] = await Promise.all([
          parentApi.getChildDashboard(cid).catch(() => null),
          sdiApi.getDashboard(cid).catch(() => null),
          growthApi.getHeatmap(30).catch(() => null),
          growthApi.getReport('week').catch(() => null),
        ])
        if (dashRes) setDashboard(dashRes)
        if (sdiRes) setSdi(sdiRes)
        if (heatRes) setHeatmap(heatRes)
        if (progRes) setProgress(progRes)
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

  if (loading) {
    return <View className='data-page'><View className='skeleton-card' /><View className='skeleton-card' /><View className='skeleton-card' /></View>
  }

  if (children.length === 0) {
    return (
      <View className='data-page'>
        <View className='empty-state'>
          <Text className='icon'>👶</Text>
          <Text className='text'>还没有添加宝贝</Text>
          <Text className='sub-text'>请先在"我的"页面添加宝贝</Text>
        </View>
      </View>
    )
  }

  const sdiChange = sdi?.score_change
  const sdiTrend = sdiChange != null ? (sdiChange > 0 ? `↑${sdiChange.toFixed(1)}` : sdiChange < 0 ? `↓${Math.abs(sdiChange).toFixed(1)}` : '→') : ''

  return (
    <View className='data-page'>
      <Text className='page-title'>📊 数据中心</Text>

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

      {/* 概览卡片 */}
      <View className='overview-card'>
        <View className='overview-row'>
          <View className='overview-item'>
            <Text className='overview-value'>🪙 {dashboard?.coins ?? currentChild?.coins ?? 0}</Text>
            <Text className='overview-label'>学习币</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>✅ {dashboard?.today_tasks ?? 0}</Text>
            <Text className='overview-label'>今日完成</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>🔥 {heatmap?.current_streak ?? 0}</Text>
            <Text className='overview-label'>连续天数</Text>
          </View>
          <View className='overview-item'>
            <Text className='overview-value'>📊 {dashboard?.total_tasks ?? 0}</Text>
            <Text className='overview-label'>累计完成</Text>
          </View>
        </View>
      </View>

      {/* SDI 综合指数 */}
      {sdi && (
        <View className='sdi-card'>
          <View className='sdi-header'>
            <Text className='sdi-title'>🧠 自驱力指数 (SDI)</Text>
            <Text className={`sdi-trend ${sdiChange && sdiChange > 0 ? 'up' : sdiChange && sdiChange < 0 ? 'down' : ''}`}>
              {sdiTrend}
            </Text>
          </View>
          <View className='sdi-score-row'>
            <Text className='sdi-score'>{sdi.current_score.toFixed(1)}</Text>
            <Text className='sdi-max'>/ 100</Text>
          </View>
          <View className='sdi-dimensions'>
            {Object.entries(DIMENSION_LABELS).map(([key, { label, emoji }]) => {
              const score = sdi[`${key}_score` as keyof SDIDashboard] as number
              return (
                <View className='sdi-dim' key={key}>
                  <View className='sdi-dim-header'>
                    <Text className='sdi-dim-label'>{emoji} {label}</Text>
                    <Text className='sdi-dim-value'>{score?.toFixed(1) ?? '--'}</Text>
                  </View>
                  <View className='sdi-dim-bar-bg'>
                    <View className='sdi-dim-bar-fill' style={{ width: `${score ?? 0}%` }} />
                  </View>
                </View>
              )
            })}
          </View>
          {sdi.suggestions && sdi.suggestions.length > 0 && (
            <View className='sdi-suggestions'>
              <Text className='sdi-suggestions-title'>💡 建议</Text>
              {sdi.suggestions.map((s, i) => (
                <Text key={i} className='sdi-suggestion-item'>• {s}</Text>
              ))}
            </View>
          )}
        </View>
      )}

      {/* 热力图 */}
      {heatmap && heatmap.days.length > 0 && (
        <View className='card'>
          <Text className='card-title'>📋 完成热力图（近30天）</Text>
          <View className='heatmap-grid'>
            {heatmap.days.slice(-28).map((day) => {
              const level = day.count === 0 ? 0 : day.count <= 2 ? 1 : day.count <= 4 ? 2 : 3
              return <View key={day.date} className={`heatmap-cell level-${level}`} />
            })}
          </View>
          <View className='heatmap-legend'>
            <Text className='legend-text'>少</Text>
            <View className='heatmap-cell level-0 small' />
            <View className='heatmap-cell level-1 small' />
            <View className='heatmap-cell level-2 small' />
            <View className='heatmap-cell level-3 small' />
            <Text className='legend-text'>多</Text>
          </View>
          <View className='streak-row'>
            <Text className='streak-item'>🔥 当前连续 {heatmap.current_streak} 天</Text>
            <Text className='streak-item'>🏆 最长连续 {heatmap.longest_streak} 天</Text>
          </View>
        </View>
      )}

      {/* 周报 */}
      {progress && (
        <View className='card'>
          <Text className='card-title'>📈 本周报告</Text>
          <View className='progress-comparison'>
            <View className='comparison-item'>
              <Text className='comparison-value'>{progress.comparison.current_count}</Text>
              <Text className='comparison-label'>本周完成</Text>
            </View>
            <View className='comparison-vs'>
              <Text className={`comparison-change ${progress.comparison.change_rate >= 0 ? 'up' : 'down'}`}>
                {progress.comparison.change_rate >= 0 ? '↑' : '↓'} {Math.abs(progress.comparison.change_rate).toFixed(0)}%
              </Text>
            </View>
            <View className='comparison-item'>
              <Text className='comparison-value'>{progress.comparison.previous_count}</Text>
              <Text className='comparison-label'>上周完成</Text>
            </View>
          </View>
          {progress.summary && <Text className='progress-summary'>{progress.summary}</Text>}
        </View>
      )}

      <View className='bottom-safe' />
    </View>
  )
}
