import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function Achievements() {
  useLoad(() => console.log('成就页加载'))
  return (
    <View className='container'>
      <Text className='section-title'>🏆 我的成就</Text>
      <View className='empty-state'>
        <Text className='icon'>🏆</Text>
        <Text className='text'>已解锁 8/20 个</Text>
      </View>
    </View>
  )
}
