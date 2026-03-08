'use client'

import { useState } from 'react'
import { AlertTriangle, Cloud, Laptop, Clock, User, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import type { SyncConflict, ActivityData } from '@/types/activity'

interface ConflictResolutionDialogProps {
  conflicts: SyncConflict[]
  onResolve: (resolution: { activityId: string; useLocal: boolean }[]) => Promise<void>
  onClose: () => void
}

// 格式化时间
function formatTime(isoString: string): string {
  if (!isoString) return '未知'
  try {
    return new Date(isoString).toLocaleString('zh-CN')
  } catch {
    return isoString
  }
}

// 活动数据差异摘要
function DataDiffSummary({ local, cloud }: { local: ActivityData; cloud: ActivityData }) {
  const [expanded, setExpanded] = useState(false)
  
  const differences: string[] = []
  
  // 比较基本字段
  if (local.activity?.name !== cloud.activity?.name) {
    differences.push(`活动名称: 本地"${local.activity?.name}" vs 云端"${cloud.activity?.name}"`)
  }
  if (local.activity?.status !== cloud.activity?.status) {
    differences.push(`状态: 本地"${local.activity?.status}" vs 云端"${cloud.activity?.status}"`)
  }
  if (local.materials?.length !== cloud.materials?.length) {
    differences.push(`物料数量: 本地${local.materials?.length || 0}个 vs 云端${cloud.materials?.length || 0}个`)
  }
  if (local.staff?.length !== cloud.staff?.length) {
    differences.push(`人员数量: 本地${local.staff?.length || 0}人 vs 云端${cloud.staff?.length || 0}人`)
  }
  if (local.participants?.length !== cloud.participants?.length) {
    differences.push(`参与者数量: 本地${local.participants?.length || 0}人 vs 云端${cloud.participants?.length || 0}人`)
  }
  if (local.registrationEntries?.length !== cloud.registrationEntries?.length) {
    differences.push(`报名数量: 本地${local.registrationEntries?.length || 0}人 vs 云端${cloud.registrationEntries?.length || 0}人`)
  }
  
  if (differences.length === 0) {
    differences.push('数据内容差异较小，主要是版本更新')
  }
  
  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
      >
        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        {expanded ? '收起详情' : '查看差异详情'}
      </button>
      {expanded && (
        <ul className="mt-2 text-xs text-gray-600 space-y-1 bg-gray-50 rounded p-2">
          {differences.map((diff, i) => (
            <li key={i} className="truncate">{diff}</li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default function ConflictResolutionDialog({
  conflicts,
  onResolve,
  onClose
}: ConflictResolutionDialogProps) {
  const [resolutions, setResolutions] = useState<Record<string, 'local' | 'cloud'>>({})
  const [isResolving, setIsResolving] = useState(false)
  
  // 设置单个活动的选择
  const handleSelect = (activityId: string, useLocal: boolean) => {
    setResolutions(prev => ({
      ...prev,
      [activityId]: useLocal ? 'local' : 'cloud'
    }))
  }
  
  // 全部选择本地
  const handleSelectAllLocal = () => {
    const newResolutions: Record<string, 'local' | 'cloud'> = {}
    conflicts.forEach(c => {
      newResolutions[c.activityId] = 'local'
    })
    setResolutions(newResolutions)
  }
  
  // 全部选择云端
  const handleSelectAllCloud = () => {
    const newResolutions: Record<string, 'local' | 'cloud'> = {}
    conflicts.forEach(c => {
      newResolutions[c.activityId] = 'cloud'
    })
    setResolutions(newResolutions)
  }
  
  // 确认解决
  const handleConfirm = async () => {
    setIsResolving(true)
    
    const resolutionList = conflicts.map(c => ({
      activityId: c.activityId,
      useLocal: resolutions[c.activityId] === 'local'
    }))
    
    await onResolve(resolutionList)
    setIsResolving(false)
  }
  
  // 是否所有冲突都已选择
  const allSelected = conflicts.every(c => resolutions[c.activityId])
  
  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-orange-600">
            <AlertTriangle className="h-5 w-5" />
            发现数据冲突
          </DialogTitle>
          <DialogDescription>
            有 {conflicts.length} 个活动存在并发修改，请选择保留哪个版本
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2 mb-3">
          <Button variant="outline" size="sm" onClick={handleSelectAllLocal}>
            <Laptop className="h-3 w-3 mr-1" />
            全选本地
          </Button>
          <Button variant="outline" size="sm" onClick={handleSelectAllCloud}>
            <Cloud className="h-3 w-3 mr-1" />
            全选云端
          </Button>
        </div>
        
        <div className="flex-1 overflow-y-auto space-y-3 pr-2">
          {conflicts.map(conflict => (
            <div
              key={conflict.activityId}
              className="border rounded-lg p-3 bg-gray-50"
            >
              <div className="font-medium text-sm mb-2">{conflict.activityName}</div>
              
              <div className="grid grid-cols-2 gap-3">
                {/* 本地版本 */}
                <button
                  onClick={() => handleSelect(conflict.activityId, true)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    resolutions[conflict.activityId] === 'local'
                      ? "border-blue-500 bg-blue-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Laptop className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium">我的修改</span>
                    {resolutions[conflict.activityId] === 'local' && (
                      <span className="ml-auto text-xs bg-blue-500 text-white px-2 py-0.5 rounded">已选</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(conflict.localUpdatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      版本 {conflict.localVersion}
                    </div>
                  </div>
                </button>
                
                {/* 云端版本 */}
                <button
                  onClick={() => handleSelect(conflict.activityId, false)}
                  className={cn(
                    "p-3 rounded-lg border-2 text-left transition-all",
                    resolutions[conflict.activityId] === 'cloud'
                      ? "border-green-500 bg-green-50"
                      : "border-gray-200 hover:border-gray-300"
                  )}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Cloud className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium">同事的修改</span>
                    {resolutions[conflict.activityId] === 'cloud' && (
                      <span className="ml-auto text-xs bg-green-500 text-white px-2 py-0.5 rounded">已选</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatTime(conflict.cloudUpdatedAt)}
                    </div>
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      版本 {conflict.cloudVersion}
                    </div>
                  </div>
                </button>
              </div>
              
              <DataDiffSummary local={conflict.localData} cloud={conflict.cloudData} />
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-4 border-t mt-4">
          <Button variant="outline" onClick={onClose} disabled={isResolving}>
            取消
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!allSelected || isResolving}
          >
            {isResolving ? '处理中...' : '确认选择'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
