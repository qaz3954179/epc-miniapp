// ============================================================
// EPC 小程序 — 认证状态管理 (Zustand)
// ============================================================
import { create } from 'zustand'
import Taro from '@tarojs/taro'
import type { UserPublic, UserRole } from '../types'

interface AuthState {
  token: string | null
  user: UserPublic | null
  role: UserRole | null
  childId: string | null  // 家长视角下当前选中的孩子 ID
  initialized: boolean     // 是否完成初始化检查

  // Actions
  setAuth: (token: string, user: UserPublic) => void
  switchRole: (role: UserRole) => void
  switchChild: (childId: string) => void
  updateUser: (partial: Partial<UserPublic>) => void
  logout: () => void
}

const TOKEN_KEY = 'epc_token'
const USER_KEY = 'epc_user'

function loadPersistedState(): Pick<AuthState, 'token' | 'user' | 'role' | 'childId'> {
  try {
    const token = Taro.getStorageSync(TOKEN_KEY) || null
    const userStr = Taro.getStorageSync(USER_KEY)
    const user = userStr ? JSON.parse(userStr) as UserPublic : null
    return {
      token,
      user,
      role: user?.role || null,
      childId: null,
    }
  } catch {
    return { token: null, user: null, role: null, childId: null }
  }
}

const persisted = loadPersistedState()

export const useAuthStore = create<AuthState>((set) => ({
  token: persisted.token,
  user: persisted.user,
  role: persisted.role,
  childId: persisted.childId,
  initialized: true,

  setAuth: (token, user) => {
    Taro.setStorageSync(TOKEN_KEY, token)
    Taro.setStorageSync(USER_KEY, JSON.stringify(user))
    set({ token, user, role: user.role })
  },

  switchRole: (role) => {
    set({ role, childId: null })
  },

  switchChild: (childId) => {
    set({ childId })
  },

  updateUser: (partial) => {
    set((state) => {
      if (!state.user) return state
      const updated = { ...state.user, ...partial }
      Taro.setStorageSync(USER_KEY, JSON.stringify(updated))
      return { user: updated }
    })
  },

  logout: () => {
    Taro.removeStorageSync(TOKEN_KEY)
    Taro.removeStorageSync(USER_KEY)
    set({ token: null, user: null, role: null, childId: null })
  },
}))
