import { View, Text } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { growthApi } from '../../services/api'
import type { HeatmapData, ProgressReport } from '../../types'
import './index.scss'

export default function Growth() {
  const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
  const [report, setReport] = useState<ProgressReport | null>(null)
  const [loading, setLoading] = useState(true)

  const loadData = useCallback(async () => {
    try {
      const [heatRes, reportRes] = await Promise.all([
        growthApi.getHeatmap(30),
        growthApi.getReport('week').catch(() => null),
      ])
      setHeatmap(heatRes)
      if (reportRes) setReport(reportRes)
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
      <View className='growth-page'>
        <View className='skeleton-card' />
        <View className='skeleton-card' />
      </View>
    )
  }

  return (
    <View className='growth-page'>
      {/* 连续打卡 */}
      <View className='streak-card'>
        <View className='streak-main'>
          <Text className='streak-number'>{heatmap?.current_streak ?? 0}</Text>
          <Text className='streak-label'>天连续打卡</Text>
        </View>
        <View className='streak-stats'>
          <View className='streak-stat'>
            <Text className='streak-stat-value'>{heatmap?.longest_streak ?? 0}</Text>
            <Text className='streak-stat-label'>最长连续</Text>
          </View>
          <View className='streak-stat'>
            <Text className='streak-stat-value'>{heatmap?.total_completions ?? 0}</Text>
            <Text className='streak-stat-label'>总完成</Text>
          </View>
        </View>
      </View>

      {/* 热力图 */}
      {heatmap && heatmap.days.length > 0 && (
        <View className='card'>
          <Text className='card-title'>📋 30 天完成热力图</Text>
          <View className='heatmap-grid'>
            {heatmap.days.map((day) => {
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
        </View>
      )}

      {/* 周报 */}
      {report && (
        <View className='card'>
          <Text className='card-title'>📊 本周 vs 上周</Text>
          <View className='compare-row'>
            <View className='compare-item'>
              <Text className='compare-value'>{report.comparison.current_count}</Text>
              <Text className='compare-label'>本周完成</Text>
            </View>
            <View className='compare-vs'>
              <Text className='compare-vs-text'>VS</Text>
            </View>
            <View className='compare-item'>
              <Text className='compare-value'>{report.comparison.previous_count}</Text>
              <Text className='compare-label'>上周完成</Text>
            </View>
          </View>
          <View className='compare-change'>
            <Text className={`change-text ${report.comparison.change_rate >= 0 ? 'up' : 'down'}`}>
              {report.comparison.change_rate >= 0 ? '📈' : '📉'}{' '}
              {report.comparison.change_rate >= 0 ? '+' : ''}
              {Math.round(report.comparison.change_rate * 100)}%
            </Text>
          </View>

          {/* 分类统计 */}
          {report.category_stats.length > 0 && (
            <>
              <Text className='card-subtitle'>分类统计</Text>
              {report.category_stats.map((cat) => (
                <View key={cat.category} className='category-row'>
                  <Text className='category-name'>{cat.category || '其他'}</Text>
                  <Text className='category-count'>{cat.count} 次</Text>
                  <Text className='category-coins'>🪙 {cat.coins_earned}</Text>
                </View>
              ))}
            </>
          )}

          {report.summary && (
            <View className='report-summary'>
              <Text className='summary-text'>{report.summary}</Text>
            </View>
          )}
        </View>
      )}

      {!heatmap && !report && (
        <View className='empty-state'>
          <Text className='icon'>📈</Text>
          <Text className='text'>暂无成长数据</Text>
          <Text className='sub-text'>完成任务后这里会显示你的成长轨迹</Text>
        </View>
      )}
    </View>
  )
}
