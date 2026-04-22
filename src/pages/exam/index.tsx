import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Exam() {
  useLoad(() => console.log('考试页加载'))
  return (
    <View className='container'>
      <View className='empty-state'>
        <Text className='icon'>📝</Text>
        <Text className='text'>我的考试</Text>
        <Text className='sub-text'>暂无考试预约</Text>
      </View>
    </View>
  )
}
