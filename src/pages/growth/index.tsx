import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function Growth() {
  useLoad(() => console.log('成长记录页加载'))
  return (
    <View className='container'>
      <Text className='section-title'>📈 成长记录</Text>
      <View className='empty-state'>
        <Text className='icon'>📈</Text>
        <Text className='text'>成长记录</Text>
        <Text className='sub-text'>热力图、进步报告等功能开发中...</Text>
      </View>
    </View>
  )
}
