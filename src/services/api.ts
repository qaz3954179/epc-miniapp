// ============================================================
// EPC 小程序 — API 封装
// ============================================================
import Taro from '@tarojs/taro'
import { useAuthStore } from '../store/auth'

// ─── 环境配置 ─────────────────────────────────────────────────

const BASE_URL = process.env.TARO_APP_API_URL || 'https://api.epc.example.com'

// ─── 请求封装 ─────────────────────────────────────────────────

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'
  data?: unknown
  needAuth?: boolean
}

async function request<T>(options: RequestOptions): Promise<T> {
  const { url, method = 'GET', data, needAuth = true } = options

  const header: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (needAuth) {
    const token = useAuthStore.getState().token
    if (token) {
      header['Authorization'] = `Bearer ${token}`
    } else {
      // 无 token 且需要认证 → 跳登录
      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('未登录')
    }
  }

  try {
    const res = await Taro.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header,
    })

    // 401 → token 过期，清除并跳登录
    if (res.statusCode === 401) {
      useAuthStore.getState().logout()
      Taro.redirectTo({ url: '/pages/login/index' })
      throw new Error('登录已过期')
    }

    if (res.statusCode >= 400) {
      const errorData = res.data as { detail?: string }
      throw new Error(errorData?.detail || `请求失败 (${res.statusCode})`)
    }

    return res.data as T
  } catch (err) {
    if (err instanceof Error && err.message === '未登录') {
      throw err
    }
    // 网络错误等
    throw new Error(err instanceof Error ? err.message : '网络请求失败')
  }
}

// ─── API 方法 ─────────────────────────────────────────────────

export const api = {
  get: <T>(url: string, needAuth = true) =>
    request<T>({ url, method: 'GET', needAuth }),

  post: <T>(url: string, data?: unknown, needAuth = true) =>
    request<T>({ url, method: 'POST', data, needAuth }),

  put: <T>(url: string, data?: unknown, needAuth = true) =>
    request<T>({ url, method: 'PUT', data, needAuth }),

  patch: <T>(url: string, data?: unknown, needAuth = true) =>
    request<T>({ url, method: 'PATCH', data, needAuth }),

  delete: <T>(url: string, needAuth = true) =>
    request<T>({ url, method: 'DELETE', needAuth }),
}

// ─── 业务 API ─────────────────────────────────────────────────

import type {
  UserPublic,
  WeChatTokenResponse,
  WeChatConfig,
  TodayTasksResponse,
  TaskCompletionPublic,
  TaskCompletionCreate,
  CoinLogsResponse,
  ItemsResponse,
  ItemPublic,
  PrizesResponse,
  PrizeRedemptionPublic,
  RedemptionsResponse,
  ExamBookingsResponse,
  ExamBookingPublic,
  ExamSessionPublic,
  ExamReport,
  AchievementChildSummary,
  AchievementsResponse,
  HeatmapData,
  ProgressReport,
  ChildAccountPublic,
  ChildrenResponse,
  SDIRecordPublic,
  SDIDashboard,
  MessageResponse,
} from '../types'

// 认证
export const authApi = {
  /** 微信登录回调 */
  wechatCallback: (code: string) =>
    api.post<WeChatTokenResponse>('/oauth/wechat/callback', { code }, false),

  /** 获取微信配置 */
  getWechatConfig: () =>
    api.get<WeChatConfig>('/oauth/wechat/config', false),

  /** 获取当前用户信息 */
  getMe: () =>
    api.get<UserPublic>('/users/me'),
}

// 任务
export const taskApi = {
  /** 今日任务列表 */
  getTodayTasks: () =>
    api.get<TodayTasksResponse>('/task-completions/today'),

  /** 完成任务打卡 */
  completeTask: (itemId: string, data?: TaskCompletionCreate) =>
    api.post<TaskCompletionPublic>(`/task-completions/${itemId}/complete`, data || {}),

  /** 今日学习币变动 */
  getTodayCoinLogs: () =>
    api.get<CoinLogsResponse>('/task-completions/coin-logs/today'),

  /** 任务列表 */
  getItems: (skip = 0, limit = 100) =>
    api.get<ItemsResponse>(`/items/?skip=${skip}&limit=${limit}`),

  /** 查看孩子任务完成历史 */
  getChildCompletions: (childId: string, days = 7) =>
    api.get<TaskCompletionPublic[]>(
      `/task-completions/child/${childId}/completions?days=${days}`
    ),

  /** 任务质量评分（家长） */
  rateTaskQuality: (completionId: string, score: number) =>
    api.patch<TaskCompletionPublic>(
      `/task-completions/${completionId}/quality`,
      { quality_score: score }
    ),
}

// 奖品 & 兑换
export const prizeApi = {
  /** 奖品列表 */
  getPrizes: (skip = 0, limit = 100) =>
    api.get<PrizesResponse>(`/prizes/?skip=${skip}&limit=${limit}`),

  /** 兑换奖品 */
  redeemPrize: (prizeId: string, addressId?: string) =>
    api.post<PrizeRedemptionPublic>('/redemptions/', {
      prize_id: prizeId,
      shipping_address_id: addressId,
    }),

  /** 我的兑换记录 */
  getMyRedemptions: (skip = 0, limit = 20) =>
    api.get<RedemptionsResponse>(`/redemptions/?skip=${skip}&limit=${limit}`),
}

// 考试
export const examApi = {
  /** 考试预约列表 */
  getBookings: () =>
    api.get<ExamBookingsResponse>('/exams/bookings'),

  /** 开始考试 → 创建会话 */
  startExam: (bookingId?: string) => {
    const body: Record<string, string> = {}
    if (bookingId) body.booking_id = bookingId
    return api.post<ExamSessionPublic>('/exams/sessions', Object.keys(body).length ? body : undefined)
  },

  /** 提交答案 */
  submitAnswer: (sessionId: string, questionId: string, answer: string, timeMs: number) =>
    api.post<ExamSessionPublic>(`/exams/sessions/${sessionId}/answers`, {
      question_id: questionId,
      child_answer: answer,
      time_spent_ms: timeMs,
    }),

  /** 考试报告 */
  getExamReport: (sessionId: string) =>
    api.get<ExamReport>(`/exams/sessions/${sessionId}/report`),
}

// 成就
export const achievementApi = {
  /** 孩子成就概览 */
  getChildSummary: () =>
    api.get<AchievementChildSummary>('/achievements/child/summary'),

  /** 孩子成就列表 */
  getChildAchievements: () =>
    api.get<AchievementsResponse>('/achievements/child/'),
}

// 成长
export const growthApi = {
  /** 热力图数据 */
  getHeatmap: (days = 30) =>
    api.get<HeatmapData>(`/growth/heatmap?days=${days}`),

  /** 进步报告 */
  getReport: (period = 'week') =>
    api.get<ProgressReport>(`/growth/report?period=${period}`),
}

// 宝贝
export const childApi = {
  /** 宝贝列表（家长） */
  getChildren: () =>
    api.get<ChildrenResponse>('/children/'),

  /** 创建宝贝 */
  createChild: (data: {
    username: string
    password: string
    full_name?: string
    nickname: string
    gender: 'boy' | 'girl'
    birth_month?: string
    avatar_url?: string
  }) =>
    api.post<ChildAccountPublic>('/children/', data),
}

// SDI（家长）
export const sdiApi = {
  /** SDI 仪表盘 */
  getDashboard: (childId: string) =>
    api.get<SDIDashboard>(`/parent/sdi/${childId}`),

  /** SDI 记录列表 */
  getRecords: (childId: string, days = 30) =>
    api.get<SDIRecordPublic[]>(`/parent/sdi/${childId}/records?days=${days}`),
}

// 家长
export const parentApi = {
  /** 家长监控面板 */
  getMonitor: (childId: string) =>
    api.get(`/parent/monitor/${childId}`),

  /** 宝贝概览 */
  getChildDashboard: (childId: string) =>
    api.get<{ child_id: string; nickname: string; coins: number; today_tasks: number; total_tasks: number }>(
      `/parent/children/${childId}/dashboard`
    ),

  /** 宝贝任务完成记录 */
  getChildCompletions: (childId: string, skip = 0, limit = 20) =>
    api.get<TaskCompletionPublic[]>(
      `/parent/children/${childId}/task-completions?skip=${skip}&limit=${limit}`
    ),

  /** 宝贝学习币明细 */
  getChildCoinLogs: (childId: string, skip = 0, limit = 20) =>
    api.get<CoinLogsResponse>(
      `/parent/children/${childId}/coin-logs?skip=${skip}&limit=${limit}`
    ),

  /** 宝贝兑换记录 */
  getChildRedemptions: (childId: string, skip = 0, limit = 20) =>
    api.get<RedemptionsResponse>(
      `/parent/children/${childId}/redemptions?skip=${skip}&limit=${limit}`
    ),

  /** 宝贝列表 */
  getChildren: () =>
    api.get<ChildAccountPublic[]>('/parent/children'),

  /** 创建宝贝 */
  createChild: (data: {
    username: string; password: string; nickname: string;
    gender: 'boy' | 'girl'; full_name?: string; birth_month?: string;
  }) =>
    api.post<ChildAccountPublic>('/parent/children', data),

  /** 更新宝贝 */
  updateChild: (childId: string, data: Record<string, unknown>) =>
    api.put<ChildAccountPublic>(`/parent/children/${childId}`, data),

  /** 删除宝贝 */
  deleteChild: (childId: string) =>
    api.delete<MessageResponse>(`/parent/children/${childId}`),
}

// 兑换管理
export const redemptionApi = {
  /** 所有兑换记录（管理员/家长） */
  getAll: (skip = 0, limit = 20) =>
    api.get<RedemptionsResponse>(`/redemptions/all?skip=${skip}&limit=${limit}`),

  /** 发货 */
  ship: (id: string, data?: { tracking_number?: string; shipping_company?: string }) =>
    api.put<PrizeRedemptionPublic>(`/redemptions/${id}/ship`, data),

  /** 完成 */
  complete: (id: string) =>
    api.put<PrizeRedemptionPublic>(`/redemptions/${id}/complete`),

  /** 退款 */
  refund: (id: string) =>
    api.put<PrizeRedemptionPublic>(`/redemptions/${id}/refund`),
}
