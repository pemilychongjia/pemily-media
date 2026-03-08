// 活动相关类型定义

// 同步冲突信息
export interface SyncConflict {
  activityId: string
  activityName: string
  localVersion: number
  cloudVersion: number
  localUpdatedAt: string
  cloudUpdatedAt: string
  localData: ActivityData
  cloudData: ActivityData
}

// 活动基本信息
export interface Activity {
  id: string
  name: string
  client: string // 甲方名称
  theme: string // 活动主题
  date: string
  location: string
  timeRange: string // 活动时间段
  dailyTimeRanges: string[] // 每天的时间段列表
  package: string // 活动档位
  days: number // 活动天数
  petsPerDay: number // 每天宠物数
  selectedActivities: string[] // 甲方选择的活动
  status: 'pending' | 'preparing' | 'ongoing' | 'completed'
  projectManager: string // 项目负责人
  createdAt: string
  updatedAt: string
}

// 甲方需求单解析数据
export interface RequirementData {
  theme: string // 活动主题
  date: string // 活动日期
  location: string // 活动地点
  timeRange: string // 活动时间段
  dailyTimeRanges: string[] // 每天的时间段列表
  package: string // 活动档位
  days: number // 活动天数
  petsPerDay: number // 每天宠物数
  selectedActivities: string[] // 甲方选择的活动
}

// 费用明细项
export interface FeeItem {
  id: string
  name: string // 项目
  specification: string // 规格
  unit: string // 单位
  quantity: number // 数量
  unitPrice: number // 单价
  days: number // 天数
  total: number // 合计
  category: 'basic' | 'activity' | 'service' | 'other'
}

// 报价单解析数据
export interface QuotationData {
  basicFees: FeeItem[] // 基础费用明细
  activityFees: FeeItem[] // 活动内容费用
  personnel: PersonnelFromQuotation[] // 从报价单提取的人员信息
  summary: {
    basicTotal: number // 基础费用
    activityTotal: number // 增值服务
    tax: number // 税费
    grandTotal: number // 总计
  }
}

// 活动流程环节
export interface FlowStep {
  id: string
  order: number
  time: string // 时间段
  name: string // 环节名称
  duration: string // 时长
  description: string // 说明
  type: 'standard' | 'premium' // 标配/增值
}

// 流程单解析数据
export interface FlowData {
  steps: FlowStep[]
}

// 物料项
export interface MaterialItem {
  id: string
  activityId: string
  name: string
  specification: string
  quantity: number
  unit: string
  supplier: string
  location: string
  responsible: string
  category: string
  checked: boolean
  checkTime: string
  checker: string
  notes: string
}

// 人员项
export interface StaffMember {
  id: string
  activityId: string
  name: string
  role: 'project_manager' | 'host' | 'executor' // 项目负责人、主持人、执行人员
  type: 'internal' | 'part_time' // 我司派驻/兼职
  workTime: string
  contact: string
  assignments: StaffAssignment[]
  trained?: boolean // 是否已完成培训
  trainingConfirmedAt?: string // 培训确认时间
}

// 人员分工
export interface StaffAssignment {
  stage: string // 活动环节
  time: string
  location: string
  tasks: string
  materials: string
  functions: string
}

// 工资记录
export interface SalaryRecord {
  id: string
  activityId: string
  staffId: string
  name: string
  role: string
  dailyWage: number
  workDays: number
  overtimePay: number
  bonus: number
  deduction: number
  totalSalary: number
  bankAccount: string
  status: 'pending' | 'paid'
}

// 岗位培训手册
export interface TrainingManual {
  id: string
  activityId: string
  role: string
  responsibilities: string[]
  requirements: string[]
  keyPoints: string[]
  emergencyContact: string
  salary: string
}

// 培训确认记录
export interface TrainingConfirmation {
  id: string
  staffId: string
  activityId: string
  confirmerName: string
  confirmerPhone: string
  confirmedAt: string
}

// 招聘需求
export interface RecruitmentNeed {
  id: string
  activityId: string
  role: string
  count: number
  requirements: string
  status: 'pending' | 'submitted' | 'recruiting' | 'filled' | 'training' | 'completed'
  submittedAt: string
  filledAt: string
  trainingAt: string
  completedAt: string
  agency: string // 招聘机构
  wechatGroup: string // 微信群链接
  notes: string
}

// 运动会参赛者
export interface Participant {
  id: string
  activityId: string
  name: string
  petName: string
  petType: string
  ownerPhone: string
  order: number // 报名顺序
  time?: number // 成绩（秒）
  rank?: number
}

// 报名表项
export interface RegistrationEntry {
  id: string
  activityId: string
  order: number
  petName: string
  ownerName: string
  phone: string
  petType: string
  petAge: string
  petGender: 'male' | 'female' | 'unknown'
  vaccinated: boolean
  notes: string
}

// 文件类型
export type FileType = 'quotation' | 'requirement' | 'flow' | 'registration' | 'image'

// 云存储文件信息
export interface CloudFile {
  id: string
  name: string // 原始文件名
  cloudPath: string // 云存储路径
  downloadUrl: string // 下载链接
  size: number // 文件大小（字节）
  type: 'image' | 'document' | 'other' // 文件类型
  uploadedAt: string // 上传时间
  uploadedBy?: string // 上传者
}

// 上传文件信息
export interface UploadedFile {
  id: string
  activityId: string
  type: FileType
  name: string
  uploadedAt: string
  parsed: boolean
  parseError?: string
  // 云存储信息
  cloudFileId?: string // 云存储文件ID
  cloudPath?: string // 云存储路径
  downloadUrl?: string // 下载链接
}

// 活动完整数据
export interface ActivityData {
  activity: Activity
  requirement?: RequirementData
  quotation?: QuotationData
  flow?: FlowData
  materials: MaterialItem[]
  staff: StaffMember[]
  salaries: SalaryRecord[]
  trainingManuals: TrainingManual[]
  recruitmentNeeds: RecruitmentNeed[]
  participants: Participant[]
  registrationEntries: RegistrationEntry[]
  uploadedFiles: UploadedFile[]
  promotionProgress?: PromotionProgress
  positions?: Position[] // 岗位配置（自动生成）
  images?: CloudFile[] // 上传的图片（云存储）
  // 版本控制（用于并发冲突检测）
  version?: number // 数据版本号，每次修改递增
  lastModifiedBy?: string // 最后修改者标识
}

// 状态统计
export interface ActivityStats {
  totalActivities: number
  pendingCount: number
  preparingCount: number
  ongoingCount: number
  completedCount: number
}

// 岗位类型
export type PositionType = 
  | 'project_manager' // 项目负责人
  | 'host' // 活动主持人
  | 'checkin' // 签到岗
  | 'assistant' // 活动协助
  | 'mobile' // 机动岗
  | 'teacher' // 老师/DIY老师/簪花老师
  | 'doctor' // 义诊医生

// 岗位配置
export interface Position {
  id: string
  type: PositionType
  name: string // 岗位名称
  count: number // 人数
  source: 'internal' | 'external' // 我司派驻/外聘
  workTime: string // 工作时间
  salary: string // 薪资
  responsibilities: string[] // 职责
  requirements: string[] // 要求
  notes: string // 备注
}

// 从报价单提取的人员信息
export interface PersonnelFromQuotation {
  name: string // 人员类型名称（如：现场执行人员、活动主持人、老师）
  count: number // 人数
  specification: string // 规格/说明
}

// 宣传进度追踪
export interface PromotionProgress {
  // 小红书
  xiaohongshuPublished: boolean // 是否已发布
  xiaohongshuCount: number // 发布数量
  xiaohongshuLinks: string[] // 发布链接
  // 社群
  communityPublished: boolean // 是否已发布
  communityCount: number // 发布社群数量
  communityNames: string[] // 发布的社群名称
  // 小程序
  miniProgramPublished: boolean // 报名小程序是否上架
  registrationCount: number // 已报名数量
  // 时间记录
  updatedAt: string
}

// 活动进度
export interface ActivityProgress {
  recruitmentProgress: number // 招募进度 0-100
  promotionProgress: number // 宣传进度 0-100
  personnelProgress: number // 人员安排进度 0-100
  purchaseProgress: number // 待采购进度 0-100
}
