'use client'

import { useEffect, useState } from 'react'
import { Cloud, CloudOff, Loader2, CheckCircle, AlertCircle, Bug, Upload, Download, RefreshCw, AlertTriangle, Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSync } from '@/hooks/useSync'
import { cn } from '@/lib/utils'
import { debugCloudBase } from '@/lib/cloudbase'
import ConflictResolutionDialog from './ConflictResolutionDialog'

export default function SyncStatus() {
  const { 
    syncStatus, 
    lastSyncTime, 
    isOnline, 
    syncToCloud, 
    syncFromCloud, 
    initSync,
    conflicts,
    resolveConflicts,
    clearConflicts,
    hasUpdates,
    updatedActivityNames
  } = useSync()
  
  const [debugResult, setDebugResult] = useState<string | null>(null)
  const [showActions, setShowActions] = useState(false)
  
  // 初始化同步服务
  useEffect(() => {
    const init = async () => {
      console.log('初始化同步服务...')
      await initSync()
    }
    init()
  }, [initSync])
  
  const handleUpload = async () => {
    setShowActions(false)
    await syncToCloud()
  }
  
  const handleDownload = async () => {
    setShowActions(false)
    await syncFromCloud()
  }
  
  const handleDebug = async () => {
    setDebugResult('测试中...')
    const result = await debugCloudBase()
    setDebugResult(JSON.stringify(result, null, 2))
  }
  
  const getStatusIcon = () => {
    if (!isOnline) {
      return <CloudOff className="h-4 w-4 text-red-500" />
    }
    
    switch (syncStatus) {
      case 'syncing':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      case 'conflict':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />
      default:
        return <Cloud className="h-4 w-4 text-gray-400" />
    }
  }
  
  const getStatusText = () => {
    if (!isOnline) {
      return '离线'
    }
    
    switch (syncStatus) {
      case 'syncing':
        return '同步中...'
      case 'success':
        return hasUpdates ? '有新更新' : '已同步'
      case 'error':
        return '同步失败'
      case 'conflict':
        return `发现冲突(${conflicts.length})`
      default:
        return '点击管理'
    }
  }
  
  return (
    <>
      <div className="space-y-2">
        {/* 有更新提示 */}
        {hasUpdates && syncStatus !== 'conflict' && (
          <div className="flex items-center gap-2 px-3 py-2 bg-yellow-50 rounded-lg border border-yellow-200">
            <Bell className="h-4 w-4 text-yellow-600" />
            <span className="text-xs text-yellow-700 flex-1 truncate">
              同事有新修改
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="h-6 px-2 text-xs bg-yellow-100 hover:bg-yellow-200"
            >
              拉取更新
            </Button>
          </div>
        )}
        
        <div className="flex items-center gap-2 px-3 py-2 bg-white/50 rounded-lg border border-gray-200">
          {getStatusIcon()}
          
          <span 
            className={cn(
              "text-xs text-gray-600 flex-1 truncate cursor-pointer",
              syncStatus === 'error' && "text-red-600",
              syncStatus === 'success' && !hasUpdates && "text-green-600",
              syncStatus === 'conflict' && "text-orange-600",
              hasUpdates && "text-yellow-600"
            )}
            onClick={() => setShowActions(!showActions)}
          >
            {getStatusText()}
          </span>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            disabled={!isOnline || syncStatus === 'syncing'}
            className="h-7 px-2"
            title="刷新云端数据"
          >
            <RefreshCw className={cn("h-3 w-3", syncStatus === 'syncing' && "animate-spin")} />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDebug}
            className="h-7 px-2"
            title="诊断连接"
          >
            <Bug className="h-3 w-3" />
          </Button>
        </div>
        
        {/* 同步操作按钮 */}
        {showActions && (
          <div className="flex gap-2 px-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handleUpload}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="flex-1 h-7 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
              title="上传本地数据到云端（覆盖云端数据）"
            >
              <Upload className="h-3 w-3 mr-1" />
              上传
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              disabled={!isOnline || syncStatus === 'syncing'}
              className="flex-1 h-7 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
              title="从云端下载数据（覆盖本地数据）"
            >
              <Download className="h-3 w-3 mr-1" />
              下载
            </Button>
          </div>
        )}
        
        {debugResult && (
          <div className="text-xs bg-gray-100 rounded p-2 overflow-auto max-h-32">
            <pre className="whitespace-pre-wrap break-all">{debugResult}</pre>
          </div>
        )}
        
        {syncStatus === 'success' && lastSyncTime && !hasUpdates && (
          <p className="text-xs text-gray-400 text-center">
            最后同步: {lastSyncTime}
          </p>
        )}
      </div>
      
      {/* 冲突解决对话框 */}
      {conflicts.length > 0 && (
        <ConflictResolutionDialog
          conflicts={conflicts}
          onResolve={resolveConflicts}
          onClose={clearConflicts}
        />
      )}
    </>
  )
}
