import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function ExamPlay() {
  useLoad(() => console.log('答题页加载'))
  return (
    <View className='container'>
      <View className='empty-state'>
        <Text className='icon'>✏️</Text>
        <Text className='text'>答题中</Text>
      </View>
    </View>
  )
}
