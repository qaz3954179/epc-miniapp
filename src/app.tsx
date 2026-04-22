import { PropsWithChildren, useState, useEffect } from 'react'
import { useDidShow, useDidHide } from '@tarojs/taro'
import './app.scss'

function App(props: PropsWithChildren) {
  // 应用启动时检查登录状态
  useEffect(() => {
    // TODO: 检查本地存储的 token
    const token = Taro.getStorageSync('token')
    if (!token) {
      // 未登录，后续跳转到登录页
    }
  }, [])

  useDidShow(() => {
    // 小程序进入前台
  })

  useDidHide(() => {
    // 小程序进入后台
  })

  return props.children
}

export default App
