import { PropsWithChildren, useState, useEffect } from 'react'
import { useDidShow } from '@tarojs/taro'
import { useAuthStore } from './store/auth'
import { authApi } from './services/api'
import './app.scss'

function App(props: PropsWithChildren) {
  const setAuth = useAuthStore((s) => s.setAuth)
  const logout = useAuthStore((s) => s.logout)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    const token = useAuthStore.getState().token
    if (token) {
      try {
        const user = await authApi.getMe()
        setAuth(token, user)
      } catch {
        // Token 失效
        logout()
      }
    }
    setChecking(false)
  }

  useDidShow(() => {
    // 小程序进入前台时可刷新状态
  })

  // TODO: 后续加一个 loading 页，checking 时显示
  return props.children
}

export default App
