import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function Planet() {
  useLoad(() => console.log('星球页加载'))
  return (
    <View className='container'>
      <Text className='section-title'>🪐 我的星球</Text>
      <View className='empty-state'>
        <Text className='icon'>🪐</Text>
        <Text className='text'>星球功能开发中...</Text>
        <Text className='sub-text'>每个愿望都是一颗正在诞生的星球</Text>
      </View>
    </View>
  )
}
