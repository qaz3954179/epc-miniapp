import { View, Text, Input, Button } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import './index.scss'

export default function Login() {
  useLoad(() => {
    console.log('登录页加载')
  })

  const handleWechatLogin = () => {
    // TODO: 微信登录
    Taro.login({
      success: (res) => {
        console.log('wx login code:', res.code)
        // 发送 code 到后端换取 token
      }
    })
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='logo'>🎓</Text>
        <Text className='title'>EPC 学习</Text>
        <Text className='subtitle'>让学习变成一场冒险</Text>
      </View>

      <View className='login-form'>
        <Button className='btn-wechat' onClick={handleWechatLogin}>
          微信登录
        </Button>
      </View>
    </View>
  )
}
