'use client'

import { useState, useRef } from 'react'
import { 
  Plus, 
  FolderKanban, 
  Calendar as CalendarIcon, 
  MoreVertical,
  Trash2,
  CheckCircle,
  Loader2,
  FileSpreadsheet,
  AlertCircle,
  FileText,
  ChevronLeft,
  ChevronRight,
  Users,
  LayoutGrid,
  CalendarDays,
  UserCog,
  Megaphone,
  ShoppingCart,
  X,
  RefreshCcw
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Progress } from '@/components/ui/progress'
import { useActivityStore } from '@/store/activity-store'
import { toast } from '@/hooks/use-toast'
import type { Activity, RequirementData, ActivityData } from '@/types/activity'

interface ActivityManagerProps {
  onActivityChange?: (activityId: string) => void
}

// 项目负责人列表
const projectManagers = [
  '猫哥',
  '大院',
  'kido',
  '盼盼',
  '海哥',
  '辣辣'
]

// 计算单个活动的进度
function calculateActivityProgress(activityData: ActivityData | undefined) {
  if (!activityData) {
    return { recruitment: 0, promotion: 0, personnel: 0, purchase: 0 }
  }
  
  // 招募进度：根据招聘需求完成状态计算
  const recruitmentNeeds = activityData.recruitmentNeeds || []
  let recruitmentProgress = 0
  if (recruitmentNeeds.length > 0) {
    const filledCount = recruitmentNeeds.filter(n => n.status === 'filled' || n.status === 'completed').length
    recruitmentProgress = Math.round((filledCount / recruitmentNeeds.length) * 100)
  }
  
  // 宣传进度：根据promotionProgress计算
  const promo = activityData.promotionProgress
  let promotionProgress = 0
  if (promo) {
    let completed = 0
    if (promo.xiaohongshuPublished) completed++
    if (promo.communityPublished) completed++
    if (promo.miniProgramPublished) completed++
    if (promo.registrationCount > 0) completed++
    promotionProgress = Math.round((completed / 4) * 100)
  }
  
  // 人员安排进度：根据positions和staff计算
  const positions = activityData.positions || []
  const staff = activityData.staff || []
  let personnelProgress = 0
  if (positions.length > 0) {
    const totalNeeded = positions.reduce((sum, p) => sum + p.count, 0)
    personnelProgress = Math.min(100, Math.round((staff.length / totalNeeded) * 100))
  }
  
  // 待采购进度：根据物料核对情况计算
  const materials = activityData.materials || []
  let purchaseProgress = 0
  if (materials.length > 0) {
    const checkedCount = materials.filter(m => m.checked).length
    purchaseProgress = Math.round((checkedCount / materials.length) * 100)
  }
  
  return {
    recruitment: recruitmentProgress,
    promotion: promotionProgress,
    personnel: personnelProgress,
    purchase: purchaseProgress
  }
}

// 日历组件 - 只显示活动名称和负责人
function CalendarView({ activityList, activities, onSelectActivity, onDeleteActivity }: { 
  activityList: Activity[], 
  activities: Record<string, ActivityData>,
  onSelectActivity: (id: string) => void,
  onDeleteActivity: (activity: Activity) => void
}) {
  const [currentDate, setCurrentDate] = useState(new Date())
  
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDayOfMonth = new Date(year, month, 1).getDay()
  
  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月']
  const weekDays = ['日', '一', '二', '三', '四', '五', '六']
  
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const goToToday = () => setCurrentDate(new Date())
  
  const getActivitiesForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
    return activityList.filter(a => a.date === dateStr)
  }
  
  const calendarDays = []
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarDays.push(null)
  }
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }
  
  const today = new Date()
  const isToday = (day: number) => {
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day
  }
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
            活动排期日历
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday} className="text-xs sm:text-sm">
              今天
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={prevMonth}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="px-1 sm:px-3 font-medium min-w-[70px] sm:min-w-[100px] text-center text-sm sm:text-base">
                {year}年 {monthNames[month]}
              </span>
              <Button variant="ghost" size="sm" onClick={nextMonth}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 mb-1">
          {weekDays.map((day, i) => (
            <div key={day} className={`text-center text-xs sm:text-sm font-medium py-1 sm:py-2 ${i === 0 || i === 6 ? 'text-red-400' : 'text-muted-foreground'}`}>
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
          {calendarDays.map((day, index) => {
            if (day === null) {
              return <div key={`empty-${index}`} className="h-20 sm:h-28 md:h-36" />
            }
            
            const dayActivities = getActivitiesForDay(day)
            const hasActivity = dayActivities.length > 0
            const isTodayDate = isToday(day)
            
            return (
              <div 
                key={day}
                className={`h-20 sm:h-28 md:h-36 border rounded-lg p-0.5 sm:p-1 transition-all ${
                  isTodayDate 
                    ? 'border-[oklch(0.9_0.18_95)] bg-[oklch(0.98_0.04_95)]' 
                    : hasActivity 
                      ? 'border-[oklch(0.75_0.15_50)] bg-[oklch(0.97_0.03_50)]' 
                      : 'border-gray-100 hover:border-gray-200'
                }`}
              >
                <div className={`text-xs sm:text-sm font-medium mb-0.5 ${isTodayDate ? 'text-[oklch(0.9_0.18_95)]' : ''}`}>
                  {day}
                </div>
                <div className="space-y-0.5 overflow-hidden">
                  {dayActivities.slice(0, 2).map((activity) => (
                    <div 
                      key={activity.id}
                      className="group relative bg-white/80 rounded p-0.5 sm:p-1 cursor-pointer hover:bg-white/90"
                      onClick={() => onSelectActivity(activity.id)}
                    >
                      <div 
                        className="text-[10px] sm:text-xs px-1 py-0.5 rounded bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)] truncate hover:bg-[oklch(0.85_0.16_95)]"
                        title={activity.name}
                      >
                        {activity.name}
                      </div>
                      {/* 删除按钮 */}
                      <button
                        className="absolute right-0.5 top-0.5 w-3 h-3 sm:w-4 sm:h-4 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                        onClick={(e) => {
                          e.stopPropagation()
                          onDeleteActivity(activity)
                        }}
                        title="删除活动"
                      >
                        <X className="w-2 h-2 sm:w-3 sm:h-3" />
                      </button>
                      {activity.projectManager && (
                        <div className="text-[8px] sm:text-[9px] px-1 text-muted-foreground truncate">
                          {activity.projectManager}
                        </div>
                      )}
                    </div>
                  ))}
                  {dayActivities.length > 2 && (
                    <div className="text-[10px] sm:text-xs text-muted-foreground px-1">
                      +{dayActivities.length - 2} 更多
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
        
        <div className="flex items-center gap-4 mt-4 text-xs sm:text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded border-2 border-[oklch(0.9_0.18_95)] bg-[oklch(0.98_0.04_95)]" />
            <span>今天</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-[oklch(0.9_0.18_95)]" />
            <span>有活动</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// 列表视图 - 显示所有活动及进度
function ListView({ activityList, activities, currentActivityId, onSelectActivity, onDeleteActivity, onEditManager, editingManager, onUpdateManager }: { 
  activityList: Activity[], 
  activities: Record<string, ActivityData>,
  currentActivityId: string | null,
  onSelectActivity: (id: string) => void,
  onDeleteActivity: (activity: Activity) => void,
  onEditManager: (id: string) => void,
  editingManager: string | null,
  onUpdateManager: (activityId: string, manager: string) => void
}) {
  const getStatusBadge = (status: Activity['status']) => {
    const statusConfig = {
      pending: { label: '待准备', className: 'bg-gray-100 text-gray-600' },
      preparing: { label: '准备中', className: 'bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)]' },
      ongoing: { label: '进行中', className: 'bg-[oklch(0.95_0.08_95)] text-[oklch(0.75_0.12_95)]' },
      completed: { label: '已完成', className: 'bg-[oklch(0.92_0.05_160)] text-[oklch(0.35_0.12_160)]' }
    }
    const config = statusConfig[status]
    return <Badge className={config.className}>{config.label}</Badge>
  }
  
  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Users className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
          所有活动 ({activityList.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="p-4 space-y-3">
            {activityList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                暂无活动
              </div>
            ) : (
              activityList.map((activity) => {
                const activityData = activities[activity.id]
                const progress = calculateActivityProgress(activityData)
                
                return (
                  <div 
                    key={activity.id}
                    className={`p-4 rounded-xl border transition-all cursor-pointer hover:bg-muted/50 ${
                      currentActivityId === activity.id 
                        ? 'border-[oklch(0.9_0.18_95)] bg-[oklch(0.98_0.04_95)]' 
                        : 'border-gray-200'
                    }`}
                    onClick={() => onSelectActivity(activity.id)}
                  >
                    {/* 头部信息 */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          currentActivityId === activity.id 
                            ? 'bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)]' 
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {activity.name.charAt(0)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{activity.name}</span>
                            {getStatusBadge(activity.status)}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span>{activity.client}</span>
                            {activity.date && (
                              <span className="flex items-center gap-1">
                                <CalendarIcon className="w-3 h-3" />
                                {activity.date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onEditManager(activity.id)
                          }}>
                            <UserCog className="w-4 h-4 mr-2" />
                            分配负责人
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-red-600"
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteActivity(activity)
                            }}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            删除
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    
                    {/* 项目负责人 */}
                    <div className="flex items-center gap-2 mb-3 text-sm">
                      <UserCog className="w-4 h-4 text-muted-foreground" />
                      {editingManager === activity.id ? (
                        <Select 
                          value={activity.projectManager || ''} 
                          onValueChange={(v) => onUpdateManager(activity.id, v)}
                        >
                          <SelectTrigger className="w-28 h-7" onClick={(e) => e.stopPropagation()}>
                            <SelectValue placeholder="选择负责人" />
                          </SelectTrigger>
                          <SelectContent>
                            {projectManagers.map(m => (
                              <SelectItem key={m} value={m}>{m}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <span 
                          className="cursor-pointer hover:text-[oklch(0.9_0.18_95)]"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditManager(activity.id)
                          }}
                        >
                          {activity.projectManager || '分配负责人'}
                        </span>
                      )}
                    </div>
                    
                    {/* 进度条 */}
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { key: 'recruitment', label: '招募', value: progress.recruitment, icon: Users, color: 'bg-[oklch(0.9_0.18_95)]' },
                        { key: 'promotion', label: '宣传', value: progress.promotion, icon: Megaphone, color: 'bg-[oklch(0.75_0.15_50)]' },
                        { key: 'personnel', label: '人员', value: progress.personnel, icon: UserCog, color: 'bg-[oklch(0.7_0.15_160)]' },
                        { key: 'purchase', label: '采购', value: progress.purchase, icon: ShoppingCart, color: 'bg-[oklch(0.65_0.15_200)]' }
                      ].map((item) => (
                        <div key={item.key} className="p-2 bg-muted/30 rounded-lg">
                          <div className="flex items-center gap-1 mb-1">
                            <item.icon className="w-3 h-3 text-muted-foreground" />
                            <span className="text-xs">{item.label}</span>
                            <span className="text-xs ml-auto font-medium">{item.value}%</span>
                          </div>
                          <Progress value={item.value} className="h-1.5" />
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}

export default function ActivityManager({ onActivityChange }: ActivityManagerProps) {
  const { 
    activityList, 
    activities,
    currentActivityId, 
    createActivity, 
    deleteActivity, 
    setCurrentActivity,
    updateActivity,
    updateRequirementData,
    addUploadedFile
  } = useActivityStore()
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const [activityToDelete, setActivityToDelete] = useState<Activity | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [uploadedFileName, setUploadedFileName] = useState('')
  const [parsedData, setParsedData] = useState<RequirementData | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('calendar')
  const [editingManager, setEditingManager] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 处理文件上传
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    setIsCreating(true)
    setUploadedFileName(file.name)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'requirement')
      formData.append('activityId', 'temp')
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        setParsedData(result.data)
        toast({
          title: '解析成功',
          description: `已提取活动信息：${result.data.theme || '未知活动'}${result.data.dailyTimeRanges?.length ? `，时间段：${result.data.dailyTimeRanges.join(', ')}` : ''}`
        })
      } else {
        throw new Error(result.error || '文件解析失败')
      }
    } catch (error) {
      toast({
        title: '解析失败',
        description: String(error),
        variant: 'destructive'
      })
      setParsedData(null)
      setUploadedFileName('')
    } finally {
      setIsCreating(false)
      event.target.value = ''
    }
  }
  
  // 确认创建活动
  const handleConfirmCreate = () => {
    if (!parsedData) {
      toast({
        title: '请先上传需求单',
        variant: 'destructive'
      })
      return
    }
    
    setIsCreating(true)
    
    const activityName = parsedData.theme || '未命名活动'
    const clientName = '甲方'
    
    const id = createActivity(activityName, clientName)
    
    updateActivity(id, {
      theme: parsedData.theme,
      date: parsedData.date,
      location: parsedData.location,
      timeRange: parsedData.timeRange,
      dailyTimeRanges: parsedData.dailyTimeRanges || [],
      package: parsedData.package,
      days: parsedData.days,
      petsPerDay: parsedData.petsPerDay,
      selectedActivities: parsedData.selectedActivities,
      projectManager: ''
    })
    
    updateRequirementData(id, parsedData)
    
    addUploadedFile(id, {
      activityId: id,
      type: 'requirement',
      name: uploadedFileName,
      uploadedAt: new Date().toLocaleString('zh-CN'),
      parsed: true
    })
    
    setIsCreateDialogOpen(false)
    setParsedData(null)
    setUploadedFileName('')
    setIsCreating(false)
    
    toast({
      title: '创建成功',
      description: `活动「${activityName}」已创建`
    })
    
    onActivityChange?.(id)
  }
  
  const handleSelectActivity = (id: string) => {
    setCurrentActivity(id)
    onActivityChange?.(id)
  }
  
  const handleDeleteActivity = () => {
    if (activityToDelete) {
      deleteActivity(activityToDelete.id)
      toast({
        title: '删除成功',
        description: `活动「${activityToDelete.name}」已删除`
      })
      setIsDeleteDialogOpen(false)
      setActivityToDelete(null)
    }
  }
  
  // 打开删除确认对话框
  const handleOpenDeleteDialog = (activity: Activity) => {
    setActivityToDelete(activity)
    setIsDeleteDialogOpen(true)
  }
  
  // 更新项目负责人
  const handleUpdateManager = (activityId: string, manager: string) => {
    updateActivity(activityId, { projectManager: manager })
    setEditingManager(null)
    toast({
      title: '已分配',
      description: `项目负责人已设置为 ${manager}`
    })
  }
  
  // 清除所有本地缓存数据
  const handleClearCache = () => {
    // 清除 Zustand 持久化数据
    localStorage.removeItem('activity-storage')
    // 刷新页面以重新加载
    window.location.reload()
  }
  
  return (
    <div className="space-y-4">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
          活动管理
        </h2>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            onClick={handleClearCache}
            title="清除缓存并刷新"
          >
            <RefreshCcw className="w-4 h-4 mr-1" />
            清除缓存
          </Button>
          <Button 
            size="sm" 
            onClick={() => setIsCreateDialogOpen(true)}
            className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
          >
            <Plus className="w-4 h-4 mr-1" />
            新建活动
          </Button>
        </div>
      </div>
      
      {/* 日历视图 */}
      <CalendarView 
        activityList={activityList}
        activities={activities}
        onSelectActivity={handleSelectActivity}
        onDeleteActivity={handleOpenDeleteDialog}
      />
      
      {/* 活动列表 */}
      <ListView 
        activityList={activityList}
        activities={activities}
        currentActivityId={currentActivityId}
        onSelectActivity={handleSelectActivity}
        onDeleteActivity={handleOpenDeleteDialog}
        onEditManager={setEditingManager}
        editingManager={editingManager}
        onUpdateManager={handleUpdateManager}
      />
      
      {/* 创建活动对话框 */}
      <Dialog open={isCreateDialogOpen} onOpenChange={(open) => {
        setIsCreateDialogOpen(open)
        if (!open) {
          setParsedData(null)
          setUploadedFileName('')
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>创建新活动</DialogTitle>
            <DialogDescription>
              上传甲方需求单，系统自动提取活动信息
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div 
              className={`border-2 border-dashed rounded-xl p-6 text-center transition-all ${
                parsedData 
                  ? 'border-[oklch(0.55_0.15_160)] bg-[oklch(0.98_0.04_160)]' 
                  : 'border-gray-200 hover:border-[oklch(0.9_0.18_95)] hover:bg-muted/30'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={handleFileSelect}
              />
              
              {isCreating ? (
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-[oklch(0.9_0.18_95)] animate-spin" />
                  <p className="text-sm text-muted-foreground">正在解析需求单...</p>
                </div>
              ) : parsedData ? (
                <div className="flex flex-col items-center gap-2">
                  <CheckCircle className="w-10 h-10 text-[oklch(0.55_0.15_160)]" />
                  <p className="font-medium">{uploadedFileName}</p>
                  <p className="text-sm text-muted-foreground">解析成功</p>
                </div>
              ) : (
                <div 
                  className="cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <FileSpreadsheet className="w-10 h-10 mx-auto text-muted-foreground mb-3" />
                  <p className="font-medium mb-1">点击上传甲方需求单</p>
                  <p className="text-sm text-muted-foreground">支持 .xlsx, .xls 格式</p>
                </div>
              )}
            </div>
            
            {parsedData && (
              <div className="space-y-3">
                <h4 className="font-medium text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                  提取的活动信息
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">活动主题</p>
                    <p className="font-medium">{parsedData.theme || '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">活动日期</p>
                    <p className="font-medium">{parsedData.date || '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">活动地点</p>
                    <p className="font-medium">{parsedData.location || '-'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">时间段</p>
                    <p className="font-medium">{parsedData.timeRange || '-'}</p>
                  </div>
                  {/* 每天时间段 */}
                  {parsedData.dailyTimeRanges && parsedData.dailyTimeRanges.length > 0 && (
                    <div className="col-span-2 p-3 bg-[oklch(0.98_0.04_95)] rounded-lg">
                      <p className="text-muted-foreground text-xs mb-1">每天时间段</p>
                      <div className="flex flex-wrap gap-2">
                        {parsedData.dailyTimeRanges.map((time, idx) => (
                          <Badge key={idx} className="bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)]">
                            第{idx + 1}天: {time}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">活动档位</p>
                    <p className="font-medium">{parsedData.package || '基础档'}</p>
                  </div>
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <p className="text-muted-foreground text-xs">每天宠物数</p>
                    <p className="font-medium">{parsedData.petsPerDay || 20}只</p>
                  </div>
                </div>
                
                {parsedData.selectedActivities.length > 0 && (
                  <div className="p-3 bg-[oklch(0.98_0.04_95)] rounded-lg">
                    <p className="text-muted-foreground text-xs mb-2">甲方选择的活动</p>
                    <div className="flex flex-wrap gap-2">
                      {parsedData.selectedActivities.map((act, idx) => (
                        <Badge key={idx} className="bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)]">{act}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
              <AlertCircle className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
              <AlertDescription className="text-sm">
                上传需求单后，系统自动提取活动信息创建活动。后续可在「项目材料」上传报价单、流程单。
              </AlertDescription>
            </Alert>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              取消
            </Button>
            <Button 
              onClick={handleConfirmCreate}
              disabled={!parsedData || isCreating}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : null}
              确认创建活动
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 删除确认对话框 */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认删除</DialogTitle>
            <DialogDescription>
              确定要删除活动「{activityToDelete?.name}」吗？此操作不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              取消
            </Button>
            <Button 
              variant="destructive"
              onClick={handleDeleteActivity}
            >
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
