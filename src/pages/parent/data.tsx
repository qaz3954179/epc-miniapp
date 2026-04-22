import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function ParentData() {
  useLoad(() => console.log('家长数据页加载'))
  return (
    <View className='container'>
      <Text className='section-title'>📊 数据</Text>
      <View className='empty-state'>
        <Text className='icon'>📊</Text>
        <Text className='text'>监控面板</Text>
        <Text className='sub-text'>查看宝贝的学习数据和成长轨迹</Text>
      </View>
    </View>
  )
}
