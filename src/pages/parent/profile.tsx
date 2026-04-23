import { View, Text, Input } from '@tarojs/components'
import Taro, { useLoad, usePullDownRefresh } from '@tarojs/taro'
import { useState, useCallback } from 'react'
import { useAuthStore } from '../../store/auth'
import { authApi, childApi, parentApi } from '../../services/api'
import type { ChildAccountPublic } from '../../types'
import './profile.scss'

export default function ParentProfile() {
  const [children, setChildren] = useState<ChildAccountPublic[]>([])
  const [showAddChild, setShowAddChild] = useState(false)
  const [newChild, setNewChild] = useState({ nickname: '', username: '', password: '', gender: 'boy' as 'boy' | 'girl' })
  const [submitting, setSubmitting] = useState(false)

  const user = useAuthStore((s) => s.user)
  const updateUser = useAuthStore((s) => s.updateUser)
  const switchRole = useAuthStore((s) => s.switchRole)
  const logout = useAuthStore((s) => s.logout)

  const loadData = useCallback(async () => {
    try {
      const [userRes, childrenRes] = await Promise.all([
        authApi.getMe(),
        childApi.getChildren(),
      ])
      updateUser(userRes)
      setChildren(childrenRes.data)
    } catch (err) {
      console.error('加载失败:', err)
    } finally {
      Taro.stopPullDownRefresh()
    }
  }, [updateUser])

  useLoad(() => loadData())
  usePullDownRefresh(() => loadData())

  const handleAddChild = async () => {
    if (!newChild.nickname.trim() || !newChild.username.trim() || !newChild.password.trim()) {
      Taro.showToast({ title: '请填写完整信息', icon: 'none' })
      return
    }
    setSubmitting(true)
    try {
      await parentApi.createChild({
        nickname: newChild.nickname.trim(),
        username: newChild.username.trim(),
        password: newChild.password.trim(),
        gender: newChild.gender,
      })
      Taro.showToast({ title: '添加成功 🎉', icon: 'success' })
      setShowAddChild(false)
      setNewChild({ nickname: '', username: '', password: '', gender: 'boy' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: err instanceof Error ? err.message : '添加失败', icon: 'error' })
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteChild = async (child: ChildAccountPublic) => {
    const res = await Taro.showModal({
      title: '确认删除',
      content: `确定要删除宝贝「${child.nickname || child.full_name}」吗？此操作不可恢复。`,
    })
    if (!res.confirm) return
    try {
      await parentApi.deleteChild(child.id)
      Taro.showToast({ title: '已删除', icon: 'success' })
      loadData()
    } catch (err) {
      Taro.showToast({ title: '删除失败', icon: 'error' })
    }
  }

  const handleLogout = async () => {
    const res = await Taro.showModal({ title: '确认退出', content: '确定要退出登录吗？' })
    if (res.confirm) {
      logout()
      Taro.redirectTo({ url: '/pages/login/index' })
    }
  }

  const handleSwitchToChild = () => {
    switchRole('child')
    Taro.switchTab({ url: '/pages/index/index' })
  }

  return (
    <View className='parent-profile-page'>
      {/* 用户卡片 */}
      <View className='profile-card'>
        <View className='avatar'>👨‍👩‍👧</View>
        <View className='user-info'>
          <Text className='nickname'>{user?.full_name || user?.nickname || '家长'}</Text>
          <Text className='email'>{user?.email || ''}</Text>
          {user?.referral_code && (
            <Text className='referral'>推荐码: {user.referral_code}</Text>
          )}
        </View>
      </View>

      {/* 宝贝管理 */}
      <View className='section'>
        <View className='section-header'>
          <Text className='section-title'>👶 我的宝贝</Text>
          <Text className='section-action' onClick={() => setShowAddChild(!showAddChild)}>
            {showAddChild ? '取消' : '+ 添加'}
          </Text>
        </View>

        {showAddChild && (
          <View className='add-child-form'>
            <View className='form-row'>
              <Text className='form-label'>昵称</Text>
              <Input
                className='form-input'
                placeholder='宝贝昵称'
                value={newChild.nickname}
                onInput={(e) => setNewChild({ ...newChild, nickname: e.detail.value })}
              />
            </View>
            <View className='form-row'>
              <Text className='form-label'>账号</Text>
              <Input
                className='form-input'
                placeholder='登录用户名'
                value={newChild.username}
                onInput={(e) => setNewChild({ ...newChild, username: e.detail.value })}
              />
            </View>
            <View className='form-row'>
              <Text className='form-label'>密码</Text>
              <Input
                className='form-input'
                placeholder='登录密码'
                password
                value={newChild.password}
                onInput={(e) => setNewChild({ ...newChild, password: e.detail.value })}
              />
            </View>
            <View className='form-row'>
              <Text className='form-label'>性别</Text>
              <View className='gender-selector'>
                <View
                  className={`gender-option ${newChild.gender === 'boy' ? 'active' : ''}`}
                  onClick={() => setNewChild({ ...newChild, gender: 'boy' })}
                >
                  <Text>👦 男孩</Text>
                </View>
                <View
                  className={`gender-option ${newChild.gender === 'girl' ? 'active' : ''}`}
                  onClick={() => setNewChild({ ...newChild, gender: 'girl' })}
                >
                  <Text>👧 女孩</Text>
                </View>
              </View>
            </View>
            <View
              className={`btn-submit ${submitting ? 'disabled' : ''}`}
              onClick={!submitting ? handleAddChild : undefined}
            >
              <Text>{submitting ? '添加中...' : '确认添加'}</Text>
            </View>
          </View>
        )}

        {children.length === 0 && !showAddChild ? (
          <View className='empty-hint'>
            <Text>还没有宝贝，点击右上角添加</Text>
          </View>
        ) : (
          children.map((child) => (
            <View className='child-item' key={child.id}>
              <View className='child-left'>
                <Text className='child-avatar'>{child.gender === 'girl' ? '👧' : '👦'}</Text>
                <View className='child-detail'>
                  <Text className='child-name'>{child.nickname || child.full_name}</Text>
                  <Text className='child-meta'>🪙 {child.coins} · @{child.username}</Text>
                </View>
              </View>
              <View className='child-actions'>
                <Text className='btn-delete' onClick={() => handleDeleteChild(child)}>删除</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* 菜单 */}
      <View className='menu-list'>
        <View className='menu-item' onClick={() => Taro.navigateTo({ url: '/pages/parent/approve' })}>
          <Text className='menu-icon'>⚡</Text>
          <Text className='menu-title'>审批管理</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item' onClick={() => {
          if (user?.referral_code) {
            Taro.setClipboardData({ data: user.referral_code })
          }
        }}>
          <Text className='menu-icon'>📣</Text>
          <Text className='menu-title'>推广邀请</Text>
          <Text className='menu-desc'>{user?.referral_code || ''}</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
        <View className='menu-item'>
          <Text className='menu-icon'>📮</Text>
          <Text className='menu-title'>意见反馈</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      {/* 角色切换 */}
      <View className='menu-list'>
        <View className='menu-item' onClick={handleSwitchToChild}>
          <Text className='menu-icon'>🔄</Text>
          <Text className='menu-title'>切换到孩子视角</Text>
          <Text className='menu-arrow'>›</Text>
        </View>
      </View>

      <View className='logout-btn' onClick={handleLogout}>
        <Text>退出登录</Text>
      </View>

      <View className='bottom-safe' />
    </View>
  )
}
