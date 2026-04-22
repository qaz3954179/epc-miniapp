import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'

export default function ExamReport() {
  useLoad(() => console.log('报告页加载'))
  return (
    <View className='container'>
      <Text>考试报告</Text>
    </View>
  )
}
