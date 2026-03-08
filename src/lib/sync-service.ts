import { getDatabase, anonymousAuth, COLLECTION_NAME } from './cloudbase'
import type { ActivityData, SyncConflict } from '@/types/activity'

// 同步状态
export type SyncStatus = 'idle' | 'syncing' | 'success' | 'error' | 'conflict'

// 云端数据结构
interface CloudActivityRecord {
  _id: string
  activityId: string
  data: ActivityData
  createdAt: string
  updatedAt: string
  version: number
  lastModifiedBy: string
}

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined'

// 生成用户标识（基于浏览器）- 只在客户端执行
function generateUserId(): string {
  if (!isBrowser) {
    // 服务端返回临时ID
    return `server_${Date.now()}`
  }
  let userId = localStorage.getItem('pemily_user_id')
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    localStorage.setItem('pemily_user_id', userId)
  }
  return userId
}

// 同步服务
export class SyncService {
  private static instance: SyncService
  private isInitialized = false
  private _userId: string | null = null
  private lastSyncVersions: Map<string, number> = new Map() // 记录上次同步时的版本
  
  static getInstance(): SyncService {
    if (!SyncService.instance) {
      SyncService.instance = new SyncService()
    }
    return SyncService.instance
  }
  
  // 私有构造函数
  private constructor() {
    // 延迟初始化 userId
  }
  
  // 获取用户ID（延迟初始化）
  private get userId(): string {
    if (!this._userId) {
      this._userId = generateUserId()
    }
    return this._userId
  }
  
  // 初始化
  async init(): Promise<boolean> {
    if (this.isInitialized) return true
    
    console.log('开始匿名登录...')
    const success = await anonymousAuth()
    if (success) {
      this.isInitialized = true
      console.log('同步服务初始化成功，用户ID:', this.userId)
    } else {
      console.error('同步服务初始化失败')
    }
    return success
  }
  
  // 获取用户ID（公开方法）
  getUserId(): string {
    return this.userId
  }
  
  // 检查是否有云端更新（用于轮询）
  async checkForUpdates(localActivities: Record<string, ActivityData>): Promise<{
    hasUpdates: boolean
    updatedActivities: string[]
    conflicts: SyncConflict[]
  }> {
    const db = getDatabase()
    if (!db) {
      return { hasUpdates: false, updatedActivities: [], conflicts: [] }
    }
    
    try {
      const result = await db.collection(COLLECTION_NAME).get()
      
      const updatedActivities: string[] = []
      const conflicts: SyncConflict[] = []
      
      if (result.data && Array.isArray(result.data)) {
        for (const item of result.data) {
          const cloudRecord = item as CloudActivityRecord
          const activityId = cloudRecord.activityId
          const cloudVersion = cloudRecord.version || 0
          const localData = localActivities[activityId]
          
          // 记录云端版本
          this.lastSyncVersions.set(activityId, cloudVersion)
          
          // 如果本地有这个活动
          if (localData) {
            const localVersion = localData.version || 0
            
            // 云端版本更新，且不是自己修改的
            if (cloudVersion > localVersion && cloudRecord.lastModifiedBy !== this.userId) {
              // 检查本地是否有未同步的修改
              const lastKnownVersion = this.lastSyncVersions.get(activityId) || 0
              if (localVersion > lastKnownVersion) {
                // 本地也有修改，产生冲突
                conflicts.push({
                  activityId,
                  activityName: localData.activity?.name || activityId,
                  localVersion,
                  cloudVersion,
                  localUpdatedAt: localData.activity?.updatedAt || '',
                  cloudUpdatedAt: cloudRecord.updatedAt,
                  localData,
                  cloudData: cloudRecord.data
                })
              } else {
                // 本地没有修改，只是云端有更新
                updatedActivities.push(activityId)
              }
            }
          } else {
            // 本地没有这个活动，是云端新增的
            updatedActivities.push(activityId)
          }
        }
      }
      
      return {
        hasUpdates: updatedActivities.length > 0 || conflicts.length > 0,
        updatedActivities,
        conflicts
      }
    } catch (error: unknown) {
      console.error('检查更新失败:', error)
      return { hasUpdates: false, updatedActivities: [], conflicts: [] }
    }
  }
  
  // 上传所有活动数据到云端（带冲突检测）
  async uploadAllActivities(
    activities: Record<string, ActivityData>, 
    forceOverwrite = false
  ): Promise<{ success: boolean; conflicts: SyncConflict[] }> {
    const db = getDatabase()
    if (!db) {
      console.error('数据库未初始化')
      return { success: false, conflicts: [] }
    }
    
    const conflicts: SyncConflict[] = []
    
    try {
      console.log('开始上传数据，共', Object.keys(activities).length, '个活动')
      
      // 先获取云端所有数据，检查是否有冲突
      if (!forceOverwrite) {
        const cloudResult = await db.collection(COLLECTION_NAME).get()
        const cloudDataMap = new Map<string, CloudActivityRecord>()
        
        if (cloudResult.data && Array.isArray(cloudResult.data)) {
          for (const item of cloudResult.data) {
            const record = item as CloudActivityRecord
            cloudDataMap.set(record.activityId, record)
          }
        }
        
        // 检查每个活动是否有冲突
        for (const [id, activityData] of Object.entries(activities)) {
          const cloudRecord = cloudDataMap.get(id)
          if (cloudRecord) {
            const localVersion = activityData.version || 0
            const cloudVersion = cloudRecord.version || 0
            
            // 如果云端版本比本地新，且不是自己修改的，则有冲突
            if (cloudVersion > localVersion && cloudRecord.lastModifiedBy !== this.userId) {
              conflicts.push({
                activityId: id,
                activityName: activityData.activity?.name || id,
                localVersion,
                cloudVersion,
                localUpdatedAt: activityData.activity?.updatedAt || '',
                cloudUpdatedAt: cloudRecord.updatedAt,
                localData: activityData,
                cloudData: cloudRecord.data
              })
            }
          }
        }
        
        // 如果有冲突，返回冲突列表
        if (conflicts.length > 0) {
          console.log('发现', conflicts.length, '个冲突')
          return { success: false, conflicts }
        }
      }
      
      // 没有冲突，执行上传
      for (const [id, activityData] of Object.entries(activities)) {
        // 递增版本号
        const newVersion = (activityData.version || 0) + 1
        const dataWithVersion: ActivityData = {
          ...activityData,
          version: newVersion,
          lastModifiedBy: this.userId
        }
        
        try {
          // 先尝试查询是否存在
          const existingResult = await db.collection(COLLECTION_NAME)
            .where({ activityId: id })
            .get()
          
          if (existingResult.data && existingResult.data.length > 0) {
            // 更新现有记录
            await db.collection(COLLECTION_NAME)
              .where({ activityId: id })
              .update({
                data: dataWithVersion,
                updatedAt: new Date().toISOString(),
                version: newVersion,
                lastModifiedBy: this.userId
              })
            console.log('更新活动成功:', id, '版本:', newVersion)
          } else {
            // 添加新记录
            await db.collection(COLLECTION_NAME).add({
              activityId: id,
              data: dataWithVersion,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              version: newVersion,
              lastModifiedBy: this.userId
            })
            console.log('添加活动成功:', id, '版本:', newVersion)
          }
          
          // 更新本地数据的版本号
          activities[id] = dataWithVersion
          this.lastSyncVersions.set(id, newVersion)
        } catch (itemError) {
          console.error('处理活动失败:', id, itemError)
        }
      }
      
      console.log('数据上传完成')
      return { success: true, conflicts: [] }
    } catch (error: unknown) {
      console.error('上传失败:', error)
      return { success: false, conflicts: [] }
    }
  }
  
  // 强制上传单个活动（用于解决冲突时选择本地版本）
  async forceUploadActivity(activityId: string, activityData: ActivityData): Promise<boolean> {
    const db = getDatabase()
    if (!db) return false
    
    try {
      // 强制使用新版本号
      const newVersion = (activityData.version || 0) + 1
      const dataWithVersion: ActivityData = {
        ...activityData,
        version: newVersion,
        lastModifiedBy: this.userId
      }
      
      await db.collection(COLLECTION_NAME)
        .where({ activityId })
        .update({
          data: dataWithVersion,
          updatedAt: new Date().toISOString(),
          version: newVersion,
          lastModifiedBy: this.userId
        })
      
      console.log('强制上传活动成功:', activityId, '版本:', newVersion)
      this.lastSyncVersions.set(activityId, newVersion)
      return true
    } catch (error) {
      console.error('强制上传活动失败:', error)
      return false
    }
  }
  
  // 从云端下载所有活动数据
  async downloadAllActivities(): Promise<Record<string, ActivityData>> {
    const db = getDatabase()
    if (!db) {
      console.error('数据库未初始化')
      return {}
    }
    
    try {
      console.log('开始从云端下载数据...')
      const result = await db.collection(COLLECTION_NAME).get()
      
      const activities: Record<string, ActivityData> = {}
      
      if (result.data && Array.isArray(result.data)) {
        for (const item of result.data) {
          const record = item as CloudActivityRecord
          if (record.data && record.activityId) {
            activities[record.activityId] = {
              ...record.data,
              version: record.version || 0,
              lastModifiedBy: record.lastModifiedBy
            }
            // 记录版本
            this.lastSyncVersions.set(record.activityId, record.version || 0)
          }
        }
      }
      
      console.log('数据下载成功，共', Object.keys(activities).length, '条记录')
      return activities
    } catch (error: unknown) {
      console.error('下载失败:', error)
      return {}
    }
  }
  
  // 删除云端活动
  async deleteActivity(activityId: string): Promise<boolean> {
    const db = getDatabase()
    if (!db) return false
    
    try {
      await db.collection(COLLECTION_NAME)
        .where({ activityId })
        .remove()
      this.lastSyncVersions.delete(activityId)
      return true
    } catch (error) {
      console.error('删除活动失败:', error)
      return false
    }
  }
}

export const syncService = SyncService.getInstance()
