'use client'

import { useState, useEffect } from 'react'
import QRCode from 'react-qr-code'
import { 
  Users, 
  Clock, 
  MapPin, 
  Package, 
  ClipboardList,
  CheckCircle,
  FileText,
  ChevronDown,
  ChevronRight,
  UserCheck,
  BookOpen,
  AlertCircle,
  QrCode,
  Download,
  Printer,
  Copy,
  Sparkles,
  Calendar,
  Banknote,
  UserPlus,
  LayoutGrid
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Textarea } from '@/components/ui/textarea'
import { toast } from '@/hooks/use-toast'
import { useActivityStore } from '@/store/activity-store'
import type { Position, PositionType } from '@/types/activity'

// 岗位图标映射
const positionIcons: Record<PositionType, string> = {
  project_manager: '👔',
  host: '🎤',
  checkin: '📝',
  assistant: '🤝',
  mobile: '🏃',
  teacher: '👨‍🏫',
  doctor: '🩺'
}

// 岗位颜色映射
const positionColors: Record<PositionType, string> = {
  project_manager: 'bg-[oklch(0.9_0.18_95)]',
  host: 'bg-[oklch(0.75_0.15_50)]',
  checkin: 'bg-[oklch(0.7_0.15_160)]',
  assistant: 'bg-[oklch(0.65_0.15_200)]',
  mobile: 'bg-[oklch(0.6_0.12_145)]',
  teacher: 'bg-purple-500',
  doctor: 'bg-red-500'
}

// 详细招聘要求 - 执行人员
const executorRequirements = [
  '喜爱宠物，有耐心，不怕动物',
  '执行力强，听从指挥，服从安排',
  '身体健康，能搬运物料',
  '准时到岗，不迟到早退',
  '着装方便活动，穿运动鞋',
  '有宠物活动经验者优先',
  '能全程参与活动，不中途离场'
]

// 详细招聘要求 - 主持人
const hostRequirements = [
  '有宠物活动主持经验优先',
  '活泼开朗，善于互动',
  '熟悉活动流程和规则',
  '能调动现场气氛',
  '形象气质佳，口齿清晰',
  '准时到岗，配合彩排'
]

// 确认状态
interface ConfirmationStatus {
  [key: string]: { confirmed: boolean; confirmedAt: string; confirmerName: string }
}

export default function PersonnelManager() {
  const { 
    currentActivityId, 
    activities,
    autoGeneratePositions
  } = useActivityStore()
  
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const requirement = currentActivity?.requirement
  const quotation = currentActivity?.quotation
  const flow = currentActivity?.flow
  const positions = currentActivity?.positions || []
  
  const [expandedPosition, setExpandedPosition] = useState<string | null>(null)
  const [qrDialogOpen, setQrDialogOpen] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [confirmationStatus, setConfirmationStatus] = useState<ConfirmationStatus>({})
  const [recruitmentDialogOpen, setRecruitmentDialogOpen] = useState(false)
  const [recruitmentPosition, setRecruitmentPosition] = useState<Position | null>(null)

  // 自动生成岗位配置
  const handleAutoGenerate = () => {
    if (!currentActivityId) return
    autoGeneratePositions(currentActivityId)
    toast({
      title: '岗位已生成',
      description: '已根据报价单和需求单自动生成岗位配置'
    })
  }
  
  // 初始加载和定期刷新确认状态
  useEffect(() => {
    const doFetch = async () => {
      try {
        const response = await fetch('/api/confirm')
        const data = await response.json()
        if (data.success && data.records) {
          const status: ConfirmationStatus = {}
          Object.entries(data.records).forEach(([id, record]: [string, unknown]) => {
            const r = record as { confirmedAt: string; confirmerName: string }
            status[id] = {
              confirmed: true,
              confirmedAt: r.confirmedAt,
              confirmerName: r.confirmerName
            }
          })
          setConfirmationStatus(status)
        }
      } catch {
        // 忽略错误
      }
    }
    
    doFetch()
    const interval = setInterval(doFetch, 5000)
    return () => clearInterval(interval)
  }, [])

  // 打开二维码对话框
  const openQrDialog = (position: Position) => {
    setSelectedPosition(position)
    setQrDialogOpen(true)
  }
  
  // 打开招聘信息对话框
  const openRecruitmentDialog = (position: Position) => {
    setRecruitmentPosition(position)
    setRecruitmentDialogOpen(true)
  }
  
  // 计算工作时间（提前1小时）
  const calculateWorkTime = (): string => {
    // 从多个来源获取时间段：优先 requirement，其次 activity 基本信息
    const timeRange = 
      requirement?.dailyTimeRanges?.[0] || 
      requirement?.timeRange || 
      currentActivity?.activity?.dailyTimeRanges?.[0] ||
      currentActivity?.activity?.timeRange ||
      ''
    
    if (!timeRange) return '待定'
    
    return calculateWorkTimeFromRange(timeRange)
  }
  
  // 从时间范围计算工作时间
  const calculateWorkTimeFromRange = (timeRange: string): string => {
    // 支持多种格式："17:00-20:30"、"17：00-20：30"、"17:00 ~ 20:30" 等
    let normalizedTime = timeRange
      .replace(/[：]/g, ':')  // 替换中文冒号
      .replace(/\s*~\s*/g, '-')  // 替换 ~ 为 -
      .replace(/\s*至\s*/g, '-')  // 替换 "至" 为 -
      .trim()
    
    if (normalizedTime.includes('-')) {
      const parts = normalizedTime.split('-')
      if (parts.length === 2) {
        const startTime = parts[0].trim()
        // 解析小时和分钟
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
  
  // 获取岗位的实际工作时间（优先实时计算，其次用存储值）
  const getPositionWorkTime = (position: Position): string => {
    // 始终尝试从活动数据实时计算
    const timeRange = 
      requirement?.dailyTimeRanges?.[0] || 
      requirement?.timeRange || 
      currentActivity?.activity?.dailyTimeRanges?.[0] ||
      currentActivity?.activity?.timeRange ||
      ''
    
    if (timeRange) {
      return calculateWorkTimeFromRange(timeRange)
    }
    
    // 如果实时计算失败，使用岗位存储的时间
    return position.workTime || '待定'
  }
  
  // 获取岗位的详细招聘要求
  const getPositionRequirements = (type: PositionType): string[] => {
    switch (type) {
      case 'host':
        return hostRequirements
      case 'checkin':
      case 'assistant':
      case 'mobile':
        return executorRequirements
      case 'teacher':
        return [
          '有相关教学经验优先',
          '熟悉DIY/手工制作流程',
          '善于指导参与者完成作品',
          '有耐心，善于与宠物主人沟通',
          '准时到岗，配合活动安排'
        ]
      case 'doctor':
        return [
          '持有兽医资格证',
          '有宠物医疗从业经验',
          '熟悉常见宠物健康问题',
          '善于与宠物主人沟通',
          '能提供基础体检服务'
        ]
      default:
        return []
    }
  }
  
  // 获取岗位的详细职责
  const getPositionResponsibilities = (type: PositionType): string[] => {
    switch (type) {
      case 'checkin':
        return [
          '负责嘉宾签到登记工作',
          '发放号码牌和活动物料',
          '登记宠物基本信息',
          '引导嘉宾入场就位',
          '解答嘉宾关于活动的疑问'
        ]
      case 'assistant':
        return [
          '协助参赛者有序入场',
          '发放活动道具和器材',
          '记录比赛成绩',
          '维护现场秩序和安全',
          '协助布置和清理活动场地'
        ]
      case 'mobile':
        return [
          '支援各岗位工作',
          '处理突发情况和紧急事务',
          '负责物料补充和运输',
          '执行临时任务安排',
          '协助现场秩序维护'
        ]
      case 'host':
        return [
          '主持活动开场和品牌介绍',
          '讲解活动规则和安全提示',
          '主持赛事环节和互动游戏',
          '调动现场气氛，与观众互动',
          '配合活动流程推进'
        ]
      case 'teacher':
        return [
          '负责DIY/手工教学活动',
          '指导参与者完成作品',
          '准备教学所需材料',
          '解答参与者疑问',
          '维护教学区域秩序'
        ]
      case 'doctor':
        return [
          '提供宠物健康咨询服务',
          '进行基础体检服务',
          '解答宠物健康问题',
          '提供专业建议',
          '处理紧急医疗情况'
        ]
      default:
        return []
    }
  }
  
  // 生成招聘文案
  const generateRecruitmentCopy = (position: Position): string => {
    const activity = currentActivity?.activity
    const positionWorkTime = getPositionWorkTime(position)
    const location = activity?.location || requirement?.location || '待定'
    const date = activity?.date || requirement?.date || '待定'
    const requirements = getPositionRequirements(position.type)
    
    // 获取原始活动时间段
    const originalTimeRange = requirement?.dailyTimeRanges?.[0] || requirement?.timeRange || ''
    
    return `【招聘】${position.name}

📍 工作地点：${location}
📅 工作日期：${date}
⏰ 工作时间：${positionWorkTime}${originalTimeRange ? `（活动时间${originalTimeRange}，提前1小时到岗）` : ''}
💰 薪资待遇：${position.salary}
👥 招聘人数：${position.count}人

📋 岗位职责：
${getPositionResponsibilities(position.type).map(r => `• ${r}`).join('\n')}

✅ 任职要求：
${requirements.map(r => `• ${r}`).join('\n')}

📞 有意者请联系项目负责人报名！`
  }
  
  // 复制招聘信息
  const copyRecruitmentInfo = (position: Position) => {
    const copy = generateRecruitmentCopy(position)
    navigator.clipboard.writeText(copy)
    toast({
      title: '复制成功',
      description: `${position.name}招聘信息已复制`
    })
  }
  
  // 复制分工详情
  const copyPositionDetails = (position: Position) => {
    const flowSteps = flow?.steps || []
    const details = `【${position.name}分工详情】

${flowSteps.map((step, i) => `环节${i + 1}：${step.name} (${step.time})
职责：${getPositionTask(position.type, step.name)}
物料：${getPositionMaterials(position.type, step.name)}
`).join('\n')}`
    
    navigator.clipboard.writeText(details)
    toast({
      title: '复制成功',
      description: `${position.name}分工详情已复制`
    })
  }
  
  // 根据岗位和环节获取任务
  const getPositionTask = (type: PositionType, stageName: string): string => {
    const tasks: Record<PositionType, Record<string, string>> = {
      project_manager: {
        '签到入场': '统筹签到流程、检查物料、对接甲方',
        '开场环节': '流程把控、人员调度、应急准备',
        'default': '全场统筹、流程把控、应急处理'
      },
      host: {
        '签到入场': '与嘉宾互动、熟悉宠物名字',
        '开场环节': '主持开场、品牌介绍、规则说明',
        'default': '主持活动、调动气氛、互动采访'
      },
      checkin: {
        '签到入场': '嘉宾签到登记、发放号码牌、宠物信息登记、引导入场',
        'default': '签到执行、信息登记'
      },
      assistant: {
        '签到入场': '协助签到、引导入场',
        '运动会': '布置障碍道具、协助参赛者、计时记录',
        'default': '协助执行、发放道具、记录成绩'
      },
      mobile: {
        'default': '支援各岗位、处理突发、物料补充'
      },
      teacher: {
        'default': '负责教学、指导参与者'
      },
      doctor: {
        'default': '宠物健康咨询、基础体检'
      }
    }
    
    return tasks[type]?.[stageName] || tasks[type]?.['default'] || '协助活动现场执行'
  }
  
  // 根据岗位和环节获取物料
  const getPositionMaterials = (type: PositionType, stageName: string): string => {
    const materials: Record<PositionType, Record<string, string>> = {
      checkin: {
        '签到入场': '签到表、号码牌、宠物登记表、笔',
        'default': '签到物料'
      },
      assistant: {
        '签到入场': '指示牌、宠物牵引绳',
        '运动会': '障碍杠、跨栏、钻圈、计时器',
        'default': '活动道具'
      },
      default: {
        'default': '岗位相关物料'
      }
    }
    
    return materials[type]?.[stageName] || materials['default']?.['default'] || '岗位相关物料'
  }

  // 统计
  const totalPositions = positions.reduce((sum, p) => sum + p.count, 0)
  const confirmedCount = Object.values(confirmationStatus).filter(s => s.confirmed).length
  const trainingProgress = totalPositions > 0 ? Math.round((confirmedCount / totalPositions) * 100) : 0
  const workTime = calculateWorkTime()

  // 获取基础URL
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }

  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先选择活动</p>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">人员分工与招聘管理</h1>
          <p className="text-muted-foreground">根据报价单自动生成岗位配置，支持智能分岗和招聘信息复制</p>
        </div>
        <Button 
          onClick={handleAutoGenerate}
          className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          智能生成分岗
        </Button>
      </div>
      
      {/* 数据来源提示 */}
      <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
        <FileText className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
        <AlertDescription>
          <strong>岗位配置规则：</strong>项目负责人（我司派驻，不招聘）→ 主持人（外聘）→ 执行人员分岗：
          1人→签到岗；2人→签到+协助；3人→签到+协助+机动；4人→签到+协助×2+机动
        </AlertDescription>
      </Alert>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <Users className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">人员需求</p>
                <p className="text-xl font-bold">{totalPositions}人</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_160)] flex items-center justify-center">
                <UserCheck className="w-5 h-5 text-[oklch(0.55_0.15_160)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">培训确认</p>
                <p className="text-xl font-bold text-[oklch(0.55_0.15_160)]">{confirmedCount}/{totalPositions}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">培训进度</p>
                <p className="text-xl font-bold">{trainingProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_50)] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[oklch(0.7_0.15_50)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">岗位数量</p>
                <p className="text-xl font-bold">{positions.length}个</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Training Progress */}
      {positions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">培训确认进度（兼职人员扫码确认）</span>
              <span className="text-sm text-muted-foreground">{confirmedCount}/{totalPositions} 已确认</span>
            </div>
            <Progress value={trainingProgress} className="h-3" />
          </CardContent>
        </Card>
      )}

      {/* 整体流程分工表 */}
      {flow && flow.steps.length > 0 && positions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <LayoutGrid className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              整体流程分工表
            </CardTitle>
            <CardDescription>一眼看清所有人的工作内容</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="w-20">环节</TableHead>
                    <TableHead className="w-20">时间</TableHead>
                    <TableHead>工作内容</TableHead>
                    <TableHead className="w-32">涉及物料</TableHead>
                    <TableHead className="w-40">负责人</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {flow.steps.map((step, stepIndex) => {
                    // 获取该环节所有岗位的任务
                    const positionTasks = positions.map(pos => ({
                      position: pos,
                      task: getPositionTask(pos.type, step.name),
                      materials: getPositionMaterials(pos.type, step.name)
                    })).filter(pt => pt.task && pt.task !== '协助活动现场执行')
                    
                    // 汇总所有物料
                    const allMaterials = [...new Set(positionTasks.map(pt => pt.materials).flat())]
                    
                    return (
                      <TableRow key={step.id}>
                        <TableCell className="font-medium">
                          <div className="flex flex-col">
                            <span className="text-[oklch(0.8_0.15_95)]">{stepIndex + 1}</span>
                            <span className="text-xs text-muted-foreground">{step.name}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">{step.time}</Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          <div className="space-y-1">
                            {positionTasks.map((pt, idx) => (
                              <div key={idx} className="flex items-start gap-1">
                                <span className="text-xs px-1.5 py-0.5 rounded bg-muted shrink-0">
                                  {positionIcons[pt.position.type]}
                                </span>
                                <span className="text-muted-foreground">{pt.task}</span>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          <div className="flex flex-wrap gap-1">
                            {allMaterials.slice(0, 3).map((m, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {m}
                              </Badge>
                            ))}
                            {allMaterials.length > 3 && (
                              <span className="text-xs text-muted-foreground">+{allMaterials.length - 3}</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {positions.map((pos, idx) => (
                              <Badge 
                                key={idx} 
                                className={`${positionColors[pos.type]} text-white text-xs`}
                              >
                                {positionIcons[pos.type]} {pos.name}×{pos.count}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Positions List */}
      {positions.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="p-8 text-center">
            <Users className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-muted-foreground mb-4">暂无岗位配置</p>
            <Button 
              onClick={handleAutoGenerate}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              智能生成分岗
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {positions.map((position) => {
            const status = confirmationStatus[position.id]
            const isExpanded = expandedPosition === position.id
            const isExternal = position.source === 'external'
            const positionRequirements = getPositionRequirements(position.type)
            const positionResponsibilities = getPositionResponsibilities(position.type)
            
            return (
              <Card key={position.id} className="border-0 shadow-md overflow-hidden">
                <button
                  className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-[oklch(0.95_0.08_95)] to-transparent hover:from-[oklch(0.92_0.1_95)] transition-colors"
                  onClick={() => setExpandedPosition(isExpanded ? null : position.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className="relative">
                      <div className={`w-12 h-12 rounded-xl ${positionColors[position.type]} flex items-center justify-center text-2xl`}>
                        {positionIcons[position.type]}
                      </div>
                      {status?.confirmed && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-[oklch(0.55_0.15_160)] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="text-left">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{position.name}</span>
                        <Badge className={position.source === 'internal' ? 'bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)]' : 'bg-[oklch(0.75_0.15_50)] text-white'}>
                          {position.source === 'internal' ? '我司派驻' : '外聘'}
                        </Badge>
                        {status?.confirmed && (
                          <Badge className="bg-[oklch(0.55_0.15_160)]">已确认</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {position.count}人 | {position.salary} | 工作时间：{getPositionWorkTime(position)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isExternal && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          copyRecruitmentInfo(position)
                        }}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        复制招聘
                      </Button>
                    )}
                    {isExternal && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          openQrDialog(position)
                        }}
                      >
                        <QrCode className="w-4 h-4 mr-1" />
                        培训码
                      </Button>
                    )}
                    {isExpanded ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>
                
                {isExpanded && (
                  <div className="p-4 bg-white border-t">
                    {/* 招聘信息卡片 - 仅外聘岗位显示 */}
                    {isExternal && (
                      <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-[oklch(0.98_0.06_95)] to-white border border-[oklch(0.9_0.18_95)]">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-bold text-lg flex items-center gap-2">
                            <UserPlus className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                            招聘信息
                          </h4>
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => openRecruitmentDialog(position)}
                            >
                              <FileText className="w-4 h-4 mr-1" />
                              预览
                            </Button>
                            <Button 
                              size="sm"
                              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
                              onClick={() => copyRecruitmentInfo(position)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              一键复制招聘信息
                            </Button>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                            <div>
                              <p className="text-xs text-muted-foreground">工作地点</p>
                              <p className="text-sm font-medium">{currentActivity?.activity.location || requirement?.location || '待定'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                            <div>
                              <p className="text-xs text-muted-foreground">工作日期</p>
                              <p className="text-sm font-medium">{currentActivity?.activity.date || requirement?.date || '待定'}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                            <div>
                              <p className="text-xs text-muted-foreground">工作时间</p>
                              <p className="text-sm font-medium">{getPositionWorkTime(position)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Banknote className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                            <div>
                              <p className="text-xs text-muted-foreground">薪资待遇</p>
                              <p className="text-sm font-medium">{position.salary}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="font-medium mb-2 text-sm flex items-center gap-1">
                              <CheckCircle className="w-3 h-3 text-[oklch(0.9_0.18_95)]" />
                              岗位职责
                            </h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {positionResponsibilities.slice(0, 4).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h5 className="font-medium mb-2 text-sm flex items-center gap-1">
                              <Users className="w-3 h-3 text-[oklch(0.75_0.15_50)]" />
                              任职要求
                            </h5>
                            <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                              {positionRequirements.slice(0, 4).map((item, i) => (
                                <li key={i}>{item}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* 岗位职责 - 完整版 */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                          岗位职责（完整）
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {positionResponsibilities.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 岗位要求 - 完整版 */}
                      <div>
                        <h4 className="font-medium mb-2 flex items-center gap-2">
                          <Users className="w-4 h-4 text-[oklch(0.75_0.15_50)]" />
                          任职要求（完整）
                        </h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {positionRequirements.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* 分工详情 */}
                      {flow && flow.steps.length > 0 && (
                        <div className="md:col-span-2">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium flex items-center gap-2">
                              <ClipboardList className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                              分工详情（结合流程单）
                            </h4>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => copyPositionDetails(position)}
                            >
                              <Copy className="w-4 h-4 mr-1" />
                              复制
                            </Button>
                          </div>
                          <div className="rounded-lg border overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-muted/50">
                                  <TableHead className="w-24">活动环节</TableHead>
                                  <TableHead className="w-28">时间</TableHead>
                                  <TableHead>工作内容</TableHead>
                                  <TableHead>准备物料</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {flow.steps.map((step) => (
                                  <TableRow key={step.id}>
                                    <TableCell className="font-medium">{step.name}</TableCell>
                                    <TableCell>
                                      <Badge variant="outline">{step.time}</Badge>
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {getPositionTask(position.type, step.name)}
                                    </TableCell>
                                    <TableCell className="text-sm">
                                      {getPositionMaterials(position.type, step.name)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                      
                      {/* 备注 */}
                      {position.notes && (
                        <div className="md:col-span-2">
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[oklch(0.7_0.15_50)]" />
                            注意事项
                          </h4>
                          <p className="text-sm text-muted-foreground">{position.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* 二维码对话框 */}
      <Dialog open={qrDialogOpen} onOpenChange={setQrDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPosition?.name} - 培训确认二维码</DialogTitle>
            <DialogDescription>扫码查看培训内容并确认</DialogDescription>
          </DialogHeader>
          {selectedPosition && (
            <div className="text-center">
              <div className="bg-white p-6 rounded-xl inline-block mb-4">
                <QRCode value={`${getBaseUrl()}/confirm?id=${selectedPosition.id}`} size={200} />
              </div>
              <p className="text-sm text-muted-foreground mb-4">
                {selectedPosition.name} | {selectedPosition.count}人 | 外聘
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => window.print()} className="flex-1">
                  <Printer className="w-4 h-4 mr-2" />
                  打印
                </Button>
                <Button 
                  className="flex-1 bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
                  onClick={() => {
                    navigator.clipboard.writeText(`${getBaseUrl()}/confirm?id=${selectedPosition.id}`)
                    toast({ title: '链接已复制' })
                  }}
                >
                  <Download className="w-4 h-4 mr-2" />
                  复制链接
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
      
      {/* 招聘信息对话框 */}
      <Dialog open={recruitmentDialogOpen} onOpenChange={setRecruitmentDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{recruitmentPosition?.name} - 招聘信息</DialogTitle>
            <DialogDescription>可一键复制发送到招聘群</DialogDescription>
          </DialogHeader>
          {recruitmentPosition && (
            <div className="space-y-4">
              <Textarea
                value={generateRecruitmentCopy(recruitmentPosition)}
                readOnly
                className="min-h-[350px]"
              />
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => setRecruitmentDialogOpen(false)}
                >
                  关闭
                </Button>
                <Button 
                  className="flex-1 bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] text-[oklch(0.25_0.05_90)]"
                  onClick={() => copyRecruitmentInfo(recruitmentPosition)}
                >
                  <Copy className="w-4 h-4 mr-2" />
                  一键复制
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
