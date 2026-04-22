import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function ParentGarden() {
  useLoad(() => console.log('家长花园加载'))
  return (
    <View className='container'>
      <Text className='section-title'>🏠 宝贝花园</Text>
      <View className='empty-state'>
        <Text className='icon'>🌸</Text>
        <Text className='text'>宝贝花园</Text>
        <Text className='sub-text'>查看所有宝贝的星球概览</Text>
      </View>
    </View>
  )
}
