import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { 
  Activity, 
  ActivityData, 
  MaterialItem, 
  StaffMember, 
  SalaryRecord,
  RecruitmentNeed,
  Participant,
  RegistrationEntry,
  RequirementData,
  QuotationData,
  FlowData,
  UploadedFile,
  TrainingManual,
  PromotionProgress,
  Position,
  CloudFile
} from '@/types/activity'

// 生成唯一ID
const generateId = () => Math.random().toString(36).substring(2, 15)

// 创建新活动的默认数据
const createDefaultActivityData = (name: string, client: string): ActivityData => {
  const now = new Date().toISOString()
  const id = generateId()
  
  return {
    activity: {
      id,
      name,
      client,
      theme: '',
      date: '',
      location: '',
      timeRange: '',
      dailyTimeRanges: [],
      package: '基础档',
      days: 1,
      petsPerDay: 20,
      selectedActivities: [],
      status: 'pending',
      projectManager: '',
      createdAt: now,
      updatedAt: now
    },
    materials: [],
    staff: [],
    salaries: [],
    trainingManuals: [],
    recruitmentNeeds: [],
    participants: [],
    registrationEntries: [],
    uploadedFiles: [],
    promotionProgress: {
      xiaohongshuPublished: false,
      xiaohongshuCount: 0,
      xiaohongshuLinks: [],
      communityPublished: false,
      communityCount: 0,
      communityNames: [],
      miniProgramPublished: false,
      registrationCount: 0,
      updatedAt: new Date().toLocaleString('zh-CN')
    },
    positions: []
  }
}

interface ActivityStore {
  // 所有活动数据
  activities: Record<string, ActivityData>
  // 当前选中的活动ID
  currentActivityId: string | null
  // 活动列表
  activityList: Activity[]
  
  // 创建新活动
  createActivity: (name: string, client: string) => string
  // 删除活动
  deleteActivity: (id: string) => void
  // 切换当前活动
  setCurrentActivity: (id: string | null) => void
  // 更新活动基本信息
  updateActivity: (id: string, data: Partial<Activity>) => void
  // 更新活动完整数据（用于云端同步和冲突解决）
  setActivityData: (id: string, data: ActivityData) => void
  // 批量设置活动数据（用于云端同步）
  setActivities: (activities: Record<string, ActivityData>) => void
  
  // 更新需求单数据
  updateRequirementData: (activityId: string, data: RequirementData) => void
  // 更新报价单数据
  updateQuotationData: (activityId: string, data: QuotationData) => void
  // 更新流程单数据
  updateFlowData: (activityId: string, data: FlowData) => void
  
  // 添加上传文件记录
  addUploadedFile: (activityId: string, file: Omit<UploadedFile, 'id'>) => void
  deleteUploadedFile: (activityId: string, fileId: string) => void // 删除上传文件
  
  // 物料管理
  addMaterial: (activityId: string, material: Omit<MaterialItem, 'id' | 'activityId'>) => void
  updateMaterial: (activityId: string, materialId: string, data: Partial<MaterialItem>) => void
  deleteMaterial: (activityId: string, materialId: string) => void
  setMaterials: (activityId: string, materials: MaterialItem[]) => void // 批量设置物料
  
  // 人员管理
  addStaff: (activityId: string, staff: Omit<StaffMember, 'id' | 'activityId'>) => void
  updateStaff: (activityId: string, staffId: string, data: Partial<StaffMember>) => void
  deleteStaff: (activityId: string, staffId: string) => void
  
  // 工资管理
  addSalary: (activityId: string, salary: Omit<SalaryRecord, 'id' | 'activityId'>) => void
  updateSalary: (activityId: string, salaryId: string, data: Partial<SalaryRecord>) => void
  
  // 招聘管理
  addRecruitmentNeed: (activityId: string, need: Omit<RecruitmentNeed, 'id' | 'activityId'>) => void
  updateRecruitmentNeed: (activityId: string, needId: string, data: Partial<RecruitmentNeed>) => void
  autoGenerateRecruitmentNeeds: (activityId: string) => void // 自动生成招聘需求
  clearRecruitmentNeeds: (activityId: string) => void // 清空招聘需求
  
  // 参赛者管理
  addParticipant: (activityId: string, participant: Omit<Participant, 'id' | 'activityId'>) => void
  updateParticipant: (activityId: string, participantId: string, data: Partial<Participant>) => void
  deleteParticipant: (activityId: string, participantId: string) => void
  
  // 报名表管理
  addRegistrationEntry: (activityId: string, entry: Omit<RegistrationEntry, 'id' | 'activityId'>) => void
  updateRegistrationEntries: (activityId: string, entries: RegistrationEntry[]) => void
  
  // 培训手册管理
  updateTrainingManuals: (activityId: string, manuals: TrainingManual[]) => void
  
  // 宣传进度管理
  updatePromotionProgress: (activityId: string, progress: Partial<PromotionProgress>) => void
  
  // 岗位管理
  updatePositions: (activityId: string, positions: Position[]) => void
  autoGeneratePositions: (activityId: string) => void // 根据报价单自动生成岗位
  
  // 图片管理
  addImage: (activityId: string, image: Omit<CloudFile, 'id'>) => void
  removeImage: (activityId: string, imageId: string) => void
  setImages: (activityId: string, images: CloudFile[]) => void
  
  // 获取当前活动数据
  getCurrentActivity: () => ActivityData | null
  
  // 导出/导入活动数据
  exportActivity: (id: string) => string | null
  importActivity: (jsonData: string) => boolean
}

export const useActivityStore = create<ActivityStore>()(
  persist(
    (set, get) => ({
      activities: {},
      currentActivityId: null,
      activityList: [],
      
      createActivity: (name, client) => {
        const newActivityData = createDefaultActivityData(name, client)
        const id = newActivityData.activity.id
        
        set(state => {
          const newActivities = { ...state.activities, [id]: newActivityData }
          const newActivityList = [...state.activityList, newActivityData.activity]
          return { 
            activities: newActivities, 
            activityList: newActivityList,
            currentActivityId: id 
          }
        })
        
        return id
      },
      
      deleteActivity: (id) => {
        set(state => {
          // 使用解构移除指定id的活动，_前缀表示有意忽略该变量
          const { [id]: _removed, ...restActivities } = state.activities
          const newActivityList = state.activityList.filter(a => a.id !== id)
          const newCurrentId = state.currentActivityId === id 
            ? (newActivityList.length > 0 ? newActivityList[0].id : null)
            : state.currentActivityId
          
          return { 
            activities: restActivities, 
            activityList: newActivityList,
            currentActivityId: newCurrentId
          }
        })
      },
      
      setCurrentActivity: (id) => {
        set({ currentActivityId: id })
      },
      
      setActivities: (newActivities) => {
        const activityList = Object.values(newActivities).map(a => a.activity)
        const currentId = activityList.length > 0 ? activityList[0].id : null
        set({ 
          activities: newActivities, 
          activityList,
          currentActivityId: currentId
        })
      },
      
      updateActivity: (id, data) => {
        set(state => {
          if (!state.activities[id]) return state
          
          const updatedActivity = { 
            ...state.activities[id].activity, 
            ...data,
            updatedAt: new Date().toISOString()
          }
          
          const newActivities = {
            ...state.activities,
            [id]: {
              ...state.activities[id],
              activity: updatedActivity
            }
          }
          
          const newActivityList = state.activityList.map(a => 
            a.id === id ? updatedActivity : a
          )
          
          return { activities: newActivities, activityList: newActivityList }
        })
      },
      
      setActivityData: (id, data) => {
        set(state => {
          if (!state.activities[id] && !data.activity) return state
          
          const newActivities = {
            ...state.activities,
            [id]: data
          }
          
          // 更新活动列表
          const exists = state.activityList.some(a => a.id === id)
          const newActivityList = exists
            ? state.activityList.map(a => a.id === id ? data.activity : a)
            : [...state.activityList, data.activity]
          
          return { activities: newActivities, activityList: newActivityList }
        })
      },
      
      updateRequirementData: (activityId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const updatedActivity = {
            ...state.activities[activityId].activity,
            theme: data.theme,
            date: data.date,
            location: data.location,
            timeRange: data.timeRange,
            dailyTimeRanges: data.dailyTimeRanges || [],
            package: data.package,
            days: data.days,
            petsPerDay: data.petsPerDay,
            selectedActivities: data.selectedActivities,
            updatedAt: new Date().toISOString()
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              activity: updatedActivity,
              requirement: data
            }
          }
          
          const newActivityList = state.activityList.map(a => 
            a.id === activityId ? updatedActivity : a
          )
          
          return { activities: newActivities, activityList: newActivityList }
        })
      },
      
      updateQuotationData: (activityId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              quotation: data
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateFlowData: (activityId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              flow: data
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addUploadedFile: (activityId, file) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newFile: UploadedFile = {
            ...file,
            id: generateId()
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              uploadedFiles: [...state.activities[activityId].uploadedFiles, newFile]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      deleteUploadedFile: (activityId, fileId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newFiles = state.activities[activityId].uploadedFiles.filter(f => f.id !== fileId)
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              uploadedFiles: newFiles
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addMaterial: (activityId, material) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newMaterial: MaterialItem = {
            ...material,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              materials: [...state.activities[activityId].materials, newMaterial]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateMaterial: (activityId, materialId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newMaterials = state.activities[activityId].materials.map(m =>
            m.id === materialId ? { ...m, ...data } : m
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              materials: newMaterials
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      deleteMaterial: (activityId, materialId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newMaterials = state.activities[activityId].materials.filter(
            m => m.id !== materialId
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              materials: newMaterials
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      setMaterials: (activityId, materials) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              materials
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addStaff: (activityId, staff) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newStaff: StaffMember = {
            ...staff,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              staff: [...state.activities[activityId].staff, newStaff]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateStaff: (activityId, staffId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newStaff = state.activities[activityId].staff.map(s =>
            s.id === staffId ? { ...s, ...data } : s
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              staff: newStaff
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      deleteStaff: (activityId, staffId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newStaff = state.activities[activityId].staff.filter(
            s => s.id !== staffId
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              staff: newStaff
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addSalary: (activityId, salary) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newSalary: SalaryRecord = {
            ...salary,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              salaries: [...state.activities[activityId].salaries, newSalary]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateSalary: (activityId, salaryId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newSalaries = state.activities[activityId].salaries.map(s =>
            s.id === salaryId ? { ...s, ...data } : s
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              salaries: newSalaries
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addRecruitmentNeed: (activityId, need) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newNeed: RecruitmentNeed = {
            ...need,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              recruitmentNeeds: [...state.activities[activityId].recruitmentNeeds, newNeed]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateRecruitmentNeed: (activityId, needId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newNeeds = state.activities[activityId].recruitmentNeeds.map(n =>
            n.id === needId ? { ...n, ...data } : n
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              recruitmentNeeds: newNeeds
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      autoGenerateRecruitmentNeeds: (activityId) => {
        set(state => {
          const activity = state.activities[activityId]
          if (!activity || !activity.requirement) return state
          
          const { petsPerDay, days, selectedActivities } = activity.requirement
          
          // 根据宠物数计算人员配置
          // 规则：≤50只宠物 → 4人（1项目负责人+1主持人+2执行人员）
          let hostCount = 1
          let executorCount = 2
          
          if (petsPerDay > 50 && petsPerDay <= 100) {
            hostCount = 1
            executorCount = 3
          } else if (petsPerDay > 100) {
            hostCount = 1
            executorCount = 4
          }
          
          // 如果有运动会，增加1个执行人员
          if (selectedActivities.some(a => a.includes('运动会'))) {
            executorCount += 1
          }
          
          // 生成招聘需求（项目负责人除外，因为是公司派驻）
          const now = new Date().toLocaleString('zh-CN')
          const newNeeds: RecruitmentNeed[] = []
          
          // 主持人招聘需求
          newNeeds.push({
            id: generateId(),
            activityId,
            role: '主持人',
            count: hostCount,
            requirements: '有宠物活动主持经验优先，活泼开朗，善于互动，熟悉活动流程和规则',
            status: 'pending',
            submittedAt: '',
            filledAt: '',
            trainingAt: '',
            completedAt: '',
            agency: '',
            wechatGroup: '',
            notes: `薪资标准：300-400元/天，工作时间：提前1小时到岗`
          })
          
          // 执行人员招聘需求
          newNeeds.push({
            id: generateId(),
            activityId,
            role: '执行人员',
            count: executorCount,
            requirements: '喜爱宠物有耐心，执行力强听从指挥，身体健康能搬运物料，准时到岗',
            status: 'pending',
            submittedAt: '',
            filledAt: '',
            trainingAt: '',
            completedAt: '',
            agency: '',
            wechatGroup: '',
            notes: `薪资标准：26-30元/小时，工作时间：提前1小时到岗`
          })
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              recruitmentNeeds: newNeeds
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      clearRecruitmentNeeds: (activityId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              recruitmentNeeds: []
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addParticipant: (activityId, participant) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newParticipant: Participant = {
            ...participant,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              participants: [...state.activities[activityId].participants, newParticipant]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateParticipant: (activityId, participantId, data) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newParticipants = state.activities[activityId].participants.map(p =>
            p.id === participantId ? { ...p, ...data } : p
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              participants: newParticipants
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      deleteParticipant: (activityId, participantId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newParticipants = state.activities[activityId].participants.filter(
            p => p.id !== participantId
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              participants: newParticipants
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      addRegistrationEntry: (activityId, entry) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newEntry: RegistrationEntry = {
            ...entry,
            id: generateId(),
            activityId
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              registrationEntries: [...state.activities[activityId].registrationEntries, newEntry]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateRegistrationEntries: (activityId, entries) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              registrationEntries: entries
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updateTrainingManuals: (activityId, manuals) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              trainingManuals: manuals
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updatePromotionProgress: (activityId, progress) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const currentProgress = state.activities[activityId].promotionProgress || {
            xiaohongshuPublished: false,
            xiaohongshuCount: 0,
            xiaohongshuLinks: [],
            communityPublished: false,
            communityCount: 0,
            communityNames: [],
            miniProgramPublished: false,
            registrationCount: 0,
            updatedAt: ''
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              promotionProgress: {
                ...currentProgress,
                ...progress,
                updatedAt: new Date().toLocaleString('zh-CN')
              }
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      updatePositions: (activityId, positions) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              positions
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      autoGeneratePositions: (activityId) => {
        set(state => {
          const activity = state.activities[activityId]
          if (!activity) return state
          
          const quotation = activity.quotation
          const requirement = activity.requirement
          
          if (!quotation && !requirement) return state
          
          // 计算提前1小时的工作时间
          const calculateWorkTime = (timeRange: string | undefined): string => {
            if (!timeRange) return '待定'
            
            let normalizedTime = timeRange
              .replace(/[：]/g, ':')
              .replace(/\s*~\s*/g, '-')
              .replace(/\s*至\s*/g, '-')
              .trim()
            
            if (normalizedTime.includes('-')) {
              const parts = normalizedTime.split('-')
              if (parts.length === 2) {
                const startTime = parts[0].trim()
                const hourMatch = startTime.match(/(\d{1,2}):(\d{2})/)
                if (hourMatch) {
                  const hour = parseInt(hourMatch[1])
                  const minute = hourMatch[2]
                  const newHour = Math.max(0, hour - 1)
                  const newStartTime = `${String(newHour).padStart(2, '0')}:${minute}`
                  return `${newStartTime}-${parts[1].trim()}`
                }
              }
            }
            return timeRange
          }
          
          // 获取活动时间段
          const activityTimeRange = requirement?.dailyTimeRanges?.[0] || requirement?.timeRange || ''
          const workTime = calculateWorkTime(activityTimeRange)
          
          // 从报价单提取执行人员数量
          let executorCount = 0
          let hostCount = 0
          
          if (quotation?.personnel) {
            // 查找主持人
            const host = quotation.personnel.find(p => 
              p.name.includes('主持人') || p.name.includes('主持')
            )
            hostCount = host?.count || 0
            
            // 查找执行人员
            const executor = quotation.personnel.find(p => 
              p.name.includes('执行人员') || p.name.includes('执行') || p.name.includes('现场执行')
            )
            executorCount = executor?.count || 0
          }
          
          // 如果没有从报价单获取到，则从宠物数量估算
          if (executorCount === 0 && requirement) {
            const petsPerDay = requirement.petsPerDay
            if (petsPerDay <= 50) executorCount = 2
            else if (petsPerDay <= 100) executorCount = 3
            else executorCount = 4
          }
          
          // 如果没有找到主持人，但有主持相关活动，默认1个主持人
          if (hostCount === 0 && requirement?.selectedActivities?.some(a => a.includes('主持'))) {
            hostCount = 1
          }
          
          // 执行人员自动分岗规则
          // 1人：签到岗1人
          // 2人：签到岗1人、活动协助1人（无机动岗）
          // 3人：签到岗1人、活动协助1人、机动岗1人
          // 4人：签到岗1人、活动协助2人、机动岗1人
          
          const positions: Position[] = []
          
          // 项目负责人（公司派驻）- 始终第一个
          positions.push({
            id: generateId(),
            type: 'project_manager',
            name: '项目负责人',
            count: 1,
            source: 'internal',
            workTime: workTime,
            salary: '活动总价×10%',
            responsibilities: [
              '统筹协调全场活动执行',
              '对接甲方，处理客户需求',
              '人员调度与任务分配',
              '现场应急情况处理'
            ],
            requirements: [
              '熟悉宠物活动执行流程',
              '具备现场协调能力'
            ],
            notes: '公司派驻'
          })
          
          // 主持人（外聘）- 报价单中有主持人时添加
          if (hostCount > 0) {
            positions.push({
              id: generateId(),
              type: 'host',
              name: '活动主持人',
              count: hostCount,
              source: 'external',
              workTime: workTime,
              salary: '300-400元/天',
              responsibilities: [
                '活动开场主持与品牌介绍',
                '活动规则与安全提示说明',
                '赛事主持与气氛调动'
              ],
            requirements: [
              '有宠物活动主持经验优先',
              '活泼开朗，善于互动'
            ],
            notes: '需提前1小时到岗'
            })
          }
          
          // 执行人员分岗
          if (executorCount >= 1) {
            // 签到岗 - 始终1人
            positions.push({
              id: generateId(),
              type: 'checkin',
              name: '签到岗',
              count: 1,
              source: 'external',
              workTime: workTime,
              salary: '26-30元/小时',
              responsibilities: [
                '嘉宾签到登记',
                '发放号码牌和物料',
                '宠物信息登记',
                '引导入场'
              ],
              requirements: [
                '喜爱宠物，有耐心',
                '执行力强，听从指挥'
              ],
              notes: '需提前1小时到岗'
            })
          }
          
          if (executorCount >= 2) {
            // 活动协助 - 根据人数分配
            const assistantCount = executorCount >= 4 ? 2 : 1
            positions.push({
              id: generateId(),
              type: 'assistant',
              name: '活动协助',
              count: assistantCount,
              source: 'external',
              workTime: workTime,
              salary: '26-30元/小时',
              responsibilities: [
                '协助参赛者入场',
                '发放道具',
                '记录成绩',
                '维护现场秩序'
              ],
              requirements: [
                '身体健康，能搬运物料',
                '着装方便活动'
              ],
              notes: '需提前1小时到岗'
            })
          }
          
          // 机动岗 - 3人或以上才有
          if (executorCount >= 3) {
            positions.push({
              id: generateId(),
              type: 'mobile',
              name: '机动岗',
              count: 1,
              source: 'external',
              workTime: workTime,
              salary: '26-30元/小时',
              responsibilities: [
                '协助各岗位工作',
                '处理突发情况',
                '物料补充',
                '临时任务支援'
              ],
              requirements: [
                '灵活应变能力强',
                '服从安排'
              ],
              notes: '需提前1小时到岗'
            })
          }
          
          // 检查是否有老师
          const teacherFromQuotation = quotation?.personnel?.find(p => 
            p.name.includes('老师') || p.name.includes('DIY') || p.name.includes('簪花')
          )
          if (teacherFromQuotation) {
            positions.push({
              id: generateId(),
              type: 'teacher',
              name: teacherFromQuotation.name,
              count: teacherFromQuotation.count,
              source: 'external',
              workTime: requirement?.timeRange || '待定',
              salary: '面议',
              responsibilities: [
                '负责DIY/簪花教学',
                '指导参与者完成作品'
              ],
              requirements: [
                '有相关教学经验',
                '熟悉活动流程'
              ],
              notes: '专业技能人员'
            })
          }
          
          // 检查是否有义诊医生
          const doctorFromQuotation = quotation?.personnel?.find(p => 
            p.name.includes('医生') || p.name.includes('义诊')
          )
          if (doctorFromQuotation) {
            positions.push({
              id: generateId(),
              type: 'doctor',
              name: '义诊医生',
              count: doctorFromQuotation.count,
              source: 'external',
              workTime: requirement?.timeRange || '待定',
              salary: '面议',
              responsibilities: [
                '宠物健康咨询',
                '基础体检服务'
              ],
              requirements: [
                '持有兽医资格证',
                '有宠物医疗经验'
              ],
              notes: '专业技能人员'
            })
          }
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              positions
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      // ==================== 图片管理 ====================
      
      addImage: (activityId, image) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newImage: CloudFile = {
            ...image,
            id: generateId()
          }
          
          const currentImages = state.activities[activityId].images || []
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              images: [...currentImages, newImage]
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      removeImage: (activityId, imageId) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newImages = (state.activities[activityId].images || []).filter(
            img => img.id !== imageId
          )
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              images: newImages
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      setImages: (activityId, images) => {
        set(state => {
          if (!state.activities[activityId]) return state
          
          const newActivities = {
            ...state.activities,
            [activityId]: {
              ...state.activities[activityId],
              images
            }
          }
          
          return { activities: newActivities }
        })
      },
      
      getCurrentActivity: () => {
        const state = get()
        if (!state.currentActivityId) return null
        return state.activities[state.currentActivityId] || null
      },
      
      exportActivity: (id) => {
        const state = get()
        const activityData = state.activities[id]
        if (!activityData) return null
        return JSON.stringify(activityData, null, 2)
      },
      
      importActivity: (jsonData) => {
        try {
          const data = JSON.parse(jsonData) as ActivityData
          if (!data.activity || !data.activity.id) return false
          
          set(state => {
            const newActivities = { ...state.activities, [data.activity.id]: data }
            const exists = state.activityList.some(a => a.id === data.activity.id)
            const newActivityList = exists 
              ? state.activityList.map(a => a.id === data.activity.id ? data.activity : a)
              : [...state.activityList, data.activity]
            
            return { activities: newActivities, activityList: newActivityList }
          })
          
          return true
        } catch {
          return false
        }
      }
    }),
    {
      name: 'activity-storage',
      partialize: (state) => ({ 
        activities: state.activities, 
        currentActivityId: state.currentActivityId,
        activityList: state.activityList 
      })
    }
  )
)
