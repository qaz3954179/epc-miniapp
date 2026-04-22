import { View, Text } from '@tarojs/components'
import Taro, { useLoad } from '@tarojs/taro'
import { useState } from 'react'
import { useAuthStore } from '../../store/auth'
import { authApi } from '../../services/api'
import './index.scss'

export default function Login() {
  const [loading, setLoading] = useState(false)
  const setAuth = useAuthStore((s) => s.setAuth)
  const navigateToTab = useAuthStore((s) => {
    // 根据角色决定跳转哪个 Tab
    if (s.role === 'child') return '/pages/index/index'
    if (s.role === 'parent') return '/pages/parent/garden'
    return null
  })

  useLoad(() => {
    console.log('登录页加载')
  })

  const handleWechatLogin = async () => {
    if (loading) return
    setLoading(true)

    try {
      // 1. 获取微信 code
      const { code } = await Taro.login()
      if (!code) {
        Taro.showToast({ title: '微信登录失败', icon: 'error' })
        return
      }

      // 2. 发送 code 到后端
      const res = await authApi.wechatCallback(code)

      // 3. 获取用户信息
      const user = await authApi.getMe()

      // 4. 存储认证状态
      setAuth(res.access_token, user)

      Taro.showToast({ title: '登录成功', icon: 'success' })

      // 5. 跳转
      setTimeout(() => {
        Taro.switchTab({ url: '/pages/index/index' })
      }, 500)
    } catch (err) {
      console.error('登录失败:', err)
      Taro.showToast({
        title: err instanceof Error ? err.message : '登录失败',
        icon: 'error',
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <View className='login-page'>
      <View className='login-header'>
        <Text className='logo'>🎓</Text>
        <Text className='title'>EPC 学习</Text>
        <Text className='subtitle'>让学习变成一场冒险</Text>
      </View>

      <View className='login-form'>
        <View
          className={`btn-wechat ${loading ? 'loading' : ''}`}
          onClick={handleWechatLogin}
        >
          <Text>{loading ? '登录中...' : '微信一键登录'}</Text>
        </View>

        <View className='login-tips'>
          <Text className='tips-text'>
            首次登录将自动创建家长账号，后续可添加宝贝
          </Text>
        </View>
      </View>
    </View>
  )
}
