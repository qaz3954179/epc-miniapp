import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function ParentProfile() {
  useLoad(() => console.log('家长个人中心加载'))
  return (
    <View className='container'>
      <Text className='section-title'>👤 我的</Text>
      <View className='empty-state'>
        <Text className='icon'>👤</Text>
        <Text className='text'>家长设置</Text>
        <Text className='sub-text'>宝贝管理、推广邀请、设置</Text>
      </View>
    </View>
  )
}
