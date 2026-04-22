import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function ParentApprove() {
  useLoad(() => console.log('家长审批页加载'))
  return (
    <View className='container'>
      <Text className='section-title'>⚡ 审批</Text>
      <View className='empty-state'>
        <Text className='icon'>⚡</Text>
        <Text className='text'>待处理事项</Text>
        <Text className='sub-text'>愿望回应、考试安排、兑换审批</Text>
      </View>
    </View>
  )
}
