'use client'

import { useState, useRef } from 'react'
import { 
  Upload, 
  FileText, 
  FileSpreadsheet, 
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  RefreshCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { toast } from '@/hooks/use-toast'
import { useActivityStore } from '@/store/activity-store'
import type { FileType, RequirementData, QuotationData, FlowData } from '@/types/activity'

interface FileUploadProps {
  activityId: string
}

interface UploadingFile {
  id: string
  type: FileType
  name: string
  progress: number
  status: 'uploading' | 'success' | 'error'
  error?: string
}

const fileTypeConfig: Record<FileType, { label: string; icon: typeof FileText; color: string }> = {
  requirement: { label: '甲方需求单', icon: FileSpreadsheet, color: 'text-[oklch(0.9_0.18_95)]' },
  quotation: { label: '报价单', icon: FileSpreadsheet, color: 'text-[oklch(0.75_0.15_50)]' },
  flow: { label: '流程单', icon: FileSpreadsheet, color: 'text-[oklch(0.65_0.15_160)]' },
  registration: { label: '报名表', icon: FileSpreadsheet, color: 'text-[oklch(0.7_0.15_50)]' }
}

export default function FileUpload({ activityId }: FileUploadProps) {
  const { 
    addUploadedFile, 
    updateRequirementData, 
    updateQuotationData, 
    updateFlowData 
  } = useActivityStore()
  
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])
  const requirementInputRef = useRef<HTMLInputElement>(null)
  const quotationInputRef = useRef<HTMLInputElement>(null)
  const flowInputRef = useRef<HTMLInputElement>(null)
  const registrationInputRef = useRef<HTMLInputElement>(null)
  
  const fileInputRefs: Record<FileType, React.RefObject<HTMLInputElement>> = {
    requirement: requirementInputRef,
    quotation: quotationInputRef,
    flow: flowInputRef,
    registration: registrationInputRef
  }
  
  const handleFileSelect = async (type: FileType, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    const fileId = `${type}_${Date.now()}`
    const uploadingFile: UploadingFile = {
      id: fileId,
      type,
      name: file.name,
      progress: 0,
      status: 'uploading'
    }
    
    setUploadingFiles(prev => [...prev, uploadingFile])
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', type)
      formData.append('activityId', activityId)
      
      // 模拟进度
      const progressInterval = setInterval(() => {
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: Math.min(f.progress + 20, 80) }
            : f
        ))
      }, 200)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      clearInterval(progressInterval)
      
      const result = await response.json()
      
      if (result.success) {
        // 更新store
        addUploadedFile(activityId, {
          type,
          name: file.name,
          uploadedAt: new Date().toISOString(),
          parsed: true
        })
        
        // 根据类型更新数据
        switch (type) {
          case 'requirement':
            updateRequirementData(activityId, result.data as RequirementData)
            break
          case 'quotation':
            updateQuotationData(activityId, result.data as QuotationData)
            break
          case 'flow':
            updateFlowData(activityId, result.data as FlowData)
            break
        }
        
        setUploadingFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, progress: 100, status: 'success' }
            : f
        ))
        
        toast({
          title: '上传成功',
          description: `${fileTypeConfig[type].label} 已解析完成`
        })
        
        // 3秒后移除成功的文件
        setTimeout(() => {
          setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
        }, 3000)
        
      } else {
        throw new Error(result.error || '解析失败')
      }
      
    } catch (error) {
      setUploadingFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { ...f, progress: 100, status: 'error', error: String(error) }
          : f
      ))
      
      toast({
        title: '上传失败',
        description: String(error),
        variant: 'destructive'
      })
    }
    
    // 重置input
    event.target.value = ''
  }
  
  const removeUploadingFile = (fileId: string) => {
    setUploadingFiles(prev => prev.filter(f => f.id !== fileId))
  }
  
  const triggerFileInput = (type: FileType) => {
    fileInputRefs[type].current?.click()
  }
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
          文件上传
        </CardTitle>
        <CardDescription>上传Excel文件，系统自动解析数据</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 上传按钮 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {(Object.entries(fileTypeConfig) as [FileType, typeof fileTypeConfig.requirement][]).map(([type, config]) => {
            const Icon = config.icon
            return (
              <div key={type}>
                <input
                  ref={fileInputRefs[type]}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="hidden"
                  onChange={(e) => handleFileSelect(type, e)}
                />
                <Button
                  variant="outline"
                  className="w-full h-auto py-4 flex flex-col gap-2"
                  onClick={() => triggerFileInput(type)}
                >
                  <Icon className={`w-6 h-6 ${config.color}`} />
                  <span className="text-xs">{config.label}</span>
                </Button>
              </div>
            )
          })}
        </div>
        
        {/* 上传进度列表 */}
        {uploadingFiles.length > 0 && (
          <div className="space-y-3 mt-4">
            <h4 className="text-sm font-medium text-muted-foreground">上传中</h4>
            {uploadingFiles.map((file) => {
              const config = fileTypeConfig[file.type]
              return (
                <div 
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg"
                >
                  {file.status === 'uploading' ? (
                    <Loader2 className="w-5 h-5 animate-spin text-[oklch(0.9_0.18_95)]" />
                  ) : file.status === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-[oklch(0.55_0.15_160)]" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{file.name}</span>
                      <Badge variant="outline" className="text-xs">{config.label}</Badge>
                    </div>
                    {file.status === 'uploading' && (
                      <Progress value={file.progress} className="h-1.5 mt-2" />
                    )}
                    {file.status === 'error' && (
                      <p className="text-xs text-red-500 mt-1">{file.error}</p>
                    )}
                  </div>
                  
                  {(file.status === 'success' || file.status === 'error') && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => removeUploadingFile(file.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                  
                  {file.status === 'error' && (
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-8 w-8 p-0"
                      onClick={() => triggerFileInput(file.type)}
                    >
                      <RefreshCcw className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
        
        {/* 提示信息 */}
        <div className="bg-[oklch(0.98_0.04_95)] rounded-lg p-4 text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-2">文件格式说明</p>
          <ul className="list-disc list-inside space-y-1">
            <li>甲方需求单：包含活动主题、日期、地点、档位等信息</li>
            <li>报价单：包含费用明细、活动内容费用、汇总数据</li>
            <li>流程单：包含活动各环节的时间、名称、时长、说明</li>
            <li>报名表：包含宠物名字、主人信息、宠物信息等</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  )
}
