'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { syncService, SyncStatus } from '@/lib/sync-service'
import { useActivityStore } from '@/store/activity-store'
import type { SyncConflict } from '@/types/activity'

interface UseSyncReturn {
  syncStatus: SyncStatus
  lastSyncTime: string | null
  isOnline: boolean
  syncToCloud: () => Promise<boolean>
  syncFromCloud: () => Promise<boolean>
  initSync: () => Promise<boolean>
  // 冲突相关
  conflicts: SyncConflict[]
  resolveConflicts: (resolution: { activityId: string; useLocal: boolean }[]) => Promise<void>
  clearConflicts: () => void
  // 轮询相关
  checkForUpdates: () => Promise<void>
  hasUpdates: boolean
  updatedActivityNames: string[]
}

export function useSync(): UseSyncReturn {
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('idle')
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null)
  const [isOnline, setIsOnline] = useState(true)
  const [isInitialized, setIsInitialized] = useState(false)
  // 冲突状态
  const [conflicts, setConflicts] = useState<SyncConflict[]>([])
  // 更新检测
  const [hasUpdates, setHasUpdates] = useState(false)
  const [updatedActivityNames, setUpdatedActivityNames] = useState<string[]>([])
  
  const { activities, setActivities, setActivityData } = useActivityStore()
  const prevActivitiesRef = useRef(activities)
  const isSyncingRef = useRef(false)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])
  
  // 初始化同步服务
  const initSync = useCallback(async (): Promise<boolean> => {
    if (isInitialized) return true
    
    const success = await syncService.init()
    if (success) {
      setIsInitialized(true)
    }
    return success
  }, [isInitialized])
  
  // 同步本地数据到云端（带冲突检测）
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    if (!isOnline || isSyncingRef.current) {
      return false
    }
    
    isSyncingRef.current = true
    setSyncStatus('syncing')
    
    try {
      await initSync()
      
      // 带冲突检测的上传
      const result = await syncService.uploadAllActivities(activities)
      
      if (result.success) {
        setSyncStatus('success')
        setLastSyncTime(new Date().toLocaleString('zh-CN'))
        prevActivitiesRef.current = activities
        return true
      } else if (result.conflicts.length > 0) {
        // 发现冲突
        setConflicts(result.conflicts)
        setSyncStatus('conflict')
        return false
      } else {
        setSyncStatus('error')
        return false
      }
    } catch (error) {
      console.error('同步到云端失败:', error)
      setSyncStatus('error')
      return false
    } finally {
      isSyncingRef.current = false
    }
  }, [activities, isOnline, initSync])
  
  // 从云端同步数据到本地
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    if (!isOnline || isSyncingRef.current) {
      return false
    }
    
    isSyncingRef.current = true
    setSyncStatus('syncing')
    
    try {
      await initSync()
      
      const cloudData = await syncService.downloadAllActivities()
      
      if (Object.keys(cloudData).length > 0) {
        setActivities(cloudData)
        prevActivitiesRef.current = cloudData
      } else if (Object.keys(activities).length > 0) {
        // 云端为空，上传本地数据
        await syncService.uploadAllActivities(activities, true)
        prevActivitiesRef.current = activities
      }
      
      setSyncStatus('success')
      setLastSyncTime(new Date().toLocaleString('zh-CN'))
      setHasUpdates(false)
      setUpdatedActivityNames([])
      return true
    } catch (error) {
      console.error('从云端同步失败:', error)
      setSyncStatus('error')
      return false
    } finally {
      isSyncingRef.current = false
    }
  }, [activities, isOnline, initSync, setActivities])
  
  // 解决冲突
  const resolveConflicts = useCallback(async (resolution: { activityId: string; useLocal: boolean }[]) => {
    isSyncingRef.current = true
    setSyncStatus('syncing')
    
    try {
      for (const { activityId, useLocal } of resolution) {
        if (useLocal) {
          // 使用本地版本，强制上传
          const localData = activities[activityId]
          if (localData) {
            await syncService.forceUploadActivity(activityId, localData)
          }
        } else {
          // 使用云端版本，更新本地
          const conflict = conflicts.find(c => c.activityId === activityId)
          if (conflict) {
            setActivityData(activityId, conflict.cloudData)
          }
        }
      }
      
      setConflicts([])
      setSyncStatus('success')
      setLastSyncTime(new Date().toLocaleString('zh-CN'))
    } catch (error) {
      console.error('解决冲突失败:', error)
      setSyncStatus('error')
    } finally {
      isSyncingRef.current = false
    }
  }, [activities, conflicts, setActivityData])
  
  // 清除冲突（取消解决）
  const clearConflicts = useCallback(() => {
    setConflicts([])
    setSyncStatus('idle')
  }, [])
  
  // 检查云端更新（轮询用）
  const checkForUpdates = useCallback(async () => {
    if (!isOnline || !isInitialized || isSyncingRef.current) {
      return
    }
    
    try {
      const result = await syncService.checkForUpdates(activities)
      
      if (result.hasUpdates) {
        setHasUpdates(true)
        
        // 获取更新的活动名称
        const names = result.updatedActivityNames.map(id => {
          const activity = activities[id]
          return activity?.activity?.name || id
        })
        setUpdatedActivityNames(names)
        
        // 如果有冲突，显示冲突对话框
        if (result.conflicts.length > 0) {
          setConflicts(result.conflicts)
          setSyncStatus('conflict')
        }
      }
    } catch (error) {
      console.error('检查更新失败:', error)
    }
  }, [activities, isOnline, isInitialized])
  
  // 自动同步：当数据变化时自动同步到云端
  useEffect(() => {
    if (!isInitialized) return
    if (prevActivitiesRef.current === activities || isSyncingRef.current) return
    if (JSON.stringify(prevActivitiesRef.current) === JSON.stringify(activities)) return
    
    const timer = setTimeout(() => {
      if (isOnline && conflicts.length === 0) {
        syncToCloud()
      }
    }, 2000)
    
    return () => clearTimeout(timer)
  }, [activities, isInitialized, isOnline, conflicts.length, syncToCloud])
  
  // 轮询检查更新：每30秒检查一次
  useEffect(() => {
    if (!isInitialized || !isOnline) return
    
    // 初始化后立即检查一次
    checkForUpdates()
    
    // 设置轮询
    pollIntervalRef.current = setInterval(() => {
      checkForUpdates()
    }, 30000) // 30秒
    
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current)
      }
    }
  }, [isInitialized, isOnline, checkForUpdates])
  
  return {
    syncStatus,
    lastSyncTime,
    isOnline,
    syncToCloud,
    syncFromCloud,
    initSync,
    conflicts,
    resolveConflicts,
    clearConflicts,
    checkForUpdates,
    hasUpdates,
    updatedActivityNames
  }
}
