// ============================================================
// EPC 小程序 — 类型定义（与后端 models.py 对齐）
// ============================================================

// ─── 用户 & 角色 ─────────────────────────────────────────────

export type UserRole = 'admin' | 'parent' | 'child'

export interface UserPublic {
  id: string
  email: string | null
  username: string | null
  is_active: boolean
  is_superuser: boolean
  full_name: string | null
  role: UserRole
  coins: number
  nickname: string | null
  gender: 'boy' | 'girl' | null
  birth_month: string | null   // YYYY-MM
  avatar_url: string | null
  parent_id: string | null
  referral_code: string
  referred_by_id: string | null
}

// ─── 认证 ─────────────────────────────────────────────────────

export interface WeChatTokenResponse {
  access_token: string
  token_type: string
  is_new_user: boolean
}

export interface WeChatConfig {
  app_id: string | null
  login_type: string
  enabled: boolean
}

// ─── 任务 (Item) ─────────────────────────────────────────────

export interface ItemPublic {
  id: string
  owner_id: string
  title: string
  description: string | null
  category: string | null
  task_type: string | null
  target_count: number
  coins_reward: number
}

export interface ItemsResponse {
  data: ItemPublic[]
  count: number
}

// ─── 今日任务 ─────────────────────────────────────────────────

export interface TodayTaskPublic {
  id: string
  title: string
  description: string | null
  category: string | null
  task_type: string | null
  target_count: number
  coins_reward: number
  completed_count: number
  completed_today: boolean
}

export interface TodayTasksResponse {
  data: TodayTaskPublic[]
  count: number
}

// ─── 任务完成 ─────────────────────────────────────────────────

export type TriggerType = 'self_initiated' | 'parent_reminded' | 'deadline_driven'

export interface TaskCompletionPublic {
  id: string
  item_id: string
  user_id: string
  completed_at: string
  trigger_type: TriggerType | null
  is_extra: boolean
  extra_detail: string | null
  quality_score: number | null   // 1-5
}

export interface TaskCompletionCreate {
  item_id: string
  trigger_type?: TriggerType
  is_extra?: boolean
  extra_detail?: string
}

// ─── 学习币 ───────────────────────────────────────────────────

export type TransactionType =
  | 'task_completion'
  | 'prize_redemption'
  | 'admin_adjustment'
  | 'refund'
  | 'referral_bonus'

export interface CoinLogPublic {
  id: string
  amount: number
  balance_after: number
  transaction_type: TransactionType
  description: string
  created_at: string
  related_id: string | null
}

export interface CoinLogsResponse {
  data: CoinLogPublic[]
  count: number
}

// ─── 奖品 ─────────────────────────────────────────────────────

export type PrizeType = 'physical' | 'virtual'

export interface PrizePublic {
  id: string
  name: string
  description: string | null
  image_url: string | null
  product_url: string | null
  price: number | null
  coins_cost: number
  stock: number
  prize_type: PrizeType
  is_active: boolean
  total_redeemed: number
  created_at: string
  updated_at: string
}

export interface PrizesResponse {
  data: PrizePublic[]
  count: number
}

// ─── 兑换 ─────────────────────────────────────────────────────

export type RedemptionStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded'

export interface PrizeRedemptionPublic {
  id: string
  user_id: string
  prize_id: string
  prize_name: string
  prize_type: string
  status: RedemptionStatus
  coins_spent: number
  redeemed_at: string
  recipient_name: string | null
  recipient_phone: string | null
  recipient_address: string | null
  tracking_number: string | null
  shipping_company: string | null
  shipped_at: string | null
  completed_at: string | null
  cancelled_at: string | null
}

export interface RedemptionsResponse {
  data: PrizeRedemptionPublic[]
  count: number
}

// ─── 考试 ─────────────────────────────────────────────────────

export type ExamSubject = 'math' | 'english' | 'chinese' | 'science' | 'other'
export type ExamDifficulty = 'easy' | 'medium' | 'hard'
export type ExamSourceType = 'manual' | 'ai'
export type ExamGameMode = 'classic' | 'countdown' | 'challenge' | 'speed_run'
export type QuestionType = 'choice' | 'fill_blank' | 'true_false' | 'spelling'
export type BookingStatus = 'booked' | 'started' | 'completed' | 'cancelled' | 'expired'
export type SessionStatus = 'in_progress' | 'completed' | 'timeout'

export interface ExamTemplatePublic {
  id: string
  title: string
  subject: ExamSubject
  source_type: ExamSourceType
  difficulty: ExamDifficulty
  question_count: number
  time_limit_seconds: number | null
  coins_reward_rules: Record<string, unknown>
  game_mode: ExamGameMode
  is_active: boolean
  is_public: boolean
  created_by: string
  created_at: string
  updated_at: string
}

export interface ExamBookingPublic {
  id: string
  template_id: string
  child_id: string
  status: BookingStatus
  scheduled_at: string
  booking_type: string
  created_at: string
  template: ExamTemplatePublic | null
}

export interface ExamBookingsResponse {
  data: ExamBookingPublic[]
  count: number
}

export interface QuestionPublic {
  id: string
  template_id: string
  question_type: QuestionType
  content: Record<string, unknown>
  answer: string
  explanation: string | null
  difficulty: ExamDifficulty
  points: number
  created_at: string
}

export interface ExamSessionPublic {
  id: string
  booking_id: string | null
  child_id: string
  template_id: string
  started_at: string
  finished_at: string | null
  score: number
  total_points: number
  coins_earned: number
  combo_max: number
  accuracy_rate: number
  status: SessionStatus
}

export interface ExamAnswerCreate {
  question_id: string
  child_answer: string
  time_spent_ms: number
}

export interface ExamReport {
  session_id: string
  template_title: string
  subject: string
  score: number
  total_points: number
  accuracy_rate: number
  combo_max: number
  coins_earned: number
  time_spent_seconds: number
  answers: Record<string, unknown>[]
  summary: string
}

// ─── 成就 ─────────────────────────────────────────────────────

export type AchievementCategory = 'hidden' | 'milestone'
export type AchievementConditionType = 'streak' | 'count' | 'rate' | 'composite'

export interface AchievementPublic {
  id: string
  name: string
  description: string | null
  icon: string
  reveal_message: string
  category: AchievementCategory
  condition_type: AchievementConditionType
  condition_config: Record<string, unknown>
  coins_bonus: number
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface AchievementChildView {
  id: string
  name: string
  icon: string
  description: string | null
  reveal_message: string | null
  category: AchievementCategory
  unlocked: boolean
  unlocked_at: string | null
}

export interface AchievementChildSummary {
  achievements: AchievementChildView[]
  unlocked_count: number
  total_count: number
}

export interface AchievementsResponse {
  data: AchievementChildView[]
  count: number
}

// ─── 成长 ─────────────────────────────────────────────────────

export interface DailyCompletionPoint {
  date: string
  count: number
}

export interface HeatmapData {
  days: DailyCompletionPoint[]
  current_streak: number
  longest_streak: number
  total_completions: number
}

export interface CategoryStats {
  category: string
  count: number
  coins_earned: number
}

export interface PeriodComparison {
  current_count: number
  previous_count: number
  current_coins: number
  previous_coins: number
  change_rate: number
}

export interface ProgressReport {
  period: string
  comparison: PeriodComparison
  category_stats: CategoryStats[]
  daily_trend: DailyCompletionPoint[]
  summary: string
}

// ─── SDI ──────────────────────────────────────────────────────

export interface SDIRecordPublic {
  id: string
  user_id: string
  record_date: string
  period_type: 'daily' | 'weekly'
  sdi_score: number
  initiative_score: number
  exploration_score: number
  persistence_score: number
  quality_score: number
  detail: Record<string, unknown>
  created_at: string
}

export interface SDIDashboard {
  current_score: number
  previous_score: number | null
  score_change: number | null
  initiative_score: number
  exploration_score: number
  persistence_score: number
  quality_score: number
  trend: SDIRecordPublic[]
  analysis: Record<string, unknown>
  suggestions: string[]
}

// ─── 宝贝 ─────────────────────────────────────────────────────

export interface ChildAccountPublic {
  id: string
  username: string | null
  full_name: string | null
  nickname: string | null
  gender: 'boy' | 'girl' | null
  birth_month: string | null
  avatar_url: string | null
  coins: number
  is_active: boolean
  created_at: string | null
}

export interface ChildrenResponse {
  data: ChildAccountPublic[]
  count: number
}

// ─── 通用 ─────────────────────────────────────────────────────

export interface MessageResponse {
  message: string
}

export interface ApiResponse<T> {
  data: T
  count?: number
}
