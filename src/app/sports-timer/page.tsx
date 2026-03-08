'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import QRCode from 'react-qr-code'
import { 
  Trophy, 
  Timer, 
  Plus, 
  Medal,
  Download,
  Play,
  Square,
  RotateCcw,
  Crown,
  QrCode,
  ArrowLeft,
  Users
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { toast } from '@/hooks/use-toast'

interface Participant {
  id: string
  name: string
  petName: string
  petType: string
  ownerPhone: string
  time?: number
  rank?: number
}

// 从localStorage读取数据
const STORAGE_KEY = 'sports_timer_data'

function loadData(): { participants: Participant[]; activityName: string } {
  if (typeof window === 'undefined') return { participants: [], activityName: '' }
  try {
    const data = localStorage.getItem(STORAGE_KEY)
    if (data) return JSON.parse(data)
  } catch {
    // ignore
  }
  return { participants: [], activityName: '' }
}

function saveData(data: { participants: Participant[]; activityName: string }) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
}

function SportsTimerContent() {
  const searchParams = useSearchParams()
  const activityId = searchParams.get('activity')
  const activityName = searchParams.get('name') || '宠物运动会'
  
  // 使用惰性初始化从localStorage加载数据
  const [participants, setParticipants] = useState<Participant[]>(() => {
    if (typeof window === 'undefined') return []
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (data) {
        const parsed = JSON.parse(data)
        return parsed.participants || []
      }
    } catch {
      // ignore
    }
    return []
  })
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newParticipant, setNewParticipant] = useState({
    name: '',
    petName: '',
    petType: '',
    ownerPhone: ''
  })
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 保存数据
  useEffect(() => {
    saveData({ participants, activityName })
  }, [participants, activityName])
  
  // Timer effect
  useEffect(() => {
    if (isTimerRunning) {
      timerRef.current = setInterval(() => {
        setElapsedTime(prev => prev + 10)
      }, 10)
    } else if (timerRef.current) {
      clearInterval(timerRef.current)
    }
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current)
      }
    }
  }, [isTimerRunning])
  
  // Calculate ranks
  const rankedParticipants = [...participants]
    .filter(p => p.time !== undefined)
    .sort((a, b) => (a.time || 0) - (b.time || 0))
    .map((p, index) => ({ ...p, rank: index + 1 }))
  
  const top10 = rankedParticipants.slice(0, 10)
  
  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000)
    const seconds = Math.floor((ms % 60000) / 1000)
    const milliseconds = Math.floor((ms % 1000) / 10)
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`
  }
  
  const handleStartTimer = () => {
    if (!currentParticipant) {
      toast({
        title: '请先选择参赛者',
        description: '点击表格中的参赛者开始计时',
        variant: 'destructive'
      })
      return
    }
    setIsTimerRunning(true)
  }
  
  const handleStopTimer = () => {
    setIsTimerRunning(false)
    if (currentParticipant) {
      const timeInSeconds = elapsedTime / 1000
      setParticipants(prev => prev.map(p => 
        p.id === currentParticipant.id 
          ? { ...p, time: timeInSeconds }
          : p
      ))
      
      toast({
        title: '计时完成',
        description: `${currentParticipant.petName} 的成绩: ${timeInSeconds.toFixed(2)}秒`,
      })
    }
  }
  
  const handleResetTimer = () => {
    setIsTimerRunning(false)
    setElapsedTime(0)
    setCurrentParticipant(null)
  }
  
  const selectParticipant = (participant: Participant) => {
    if (isTimerRunning) {
      toast({
        title: '无法切换',
        description: '请先停止当前计时',
        variant: 'destructive'
      })
      return
    }
    setCurrentParticipant(participant)
    setElapsedTime(0)
    toast({
      title: '已选择参赛者',
      description: `${participant.petName} 准备开始`,
    })
  }
  
  const handleAddParticipant = () => {
    if (!newParticipant.name || !newParticipant.petName || !newParticipant.petType) {
      toast({
        title: '请填写完整信息',
        variant: 'destructive'
      })
      return
    }
    
    const participant: Participant = {
      id: `p_${Date.now()}`,
      ...newParticipant
    }
    
    setParticipants(prev => [...prev, participant])
    setNewParticipant({ name: '', petName: '', petType: '', ownerPhone: '' })
    setIsAddDialogOpen(false)
    
    toast({
      title: '添加成功',
      description: `${newParticipant.petName} 已加入比赛`,
    })
  }
  
  const exportResults = () => {
    const csvContent = [
      '排名,参赛者,宠物名,宠物类型,成绩(秒),联系电话',
      ...rankedParticipants.map((p, index) => 
        `${index + 1},${p.name},${p.petName},${p.petType},${p.time?.toFixed(2) || '未完成'},${p.ownerPhone}`
      )
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `运动会成绩_${activityName}_${new Date().toLocaleDateString('zh-CN')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: '成绩表已下载',
    })
  }
  
  const clearAllData = () => {
    if (confirm('确定要清空所有数据吗？')) {
      setParticipants([])
      setCurrentParticipant(null)
      setElapsedTime(0)
      toast({ title: '数据已清空' })
    }
  }
  
  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-amber-600'
      default: return 'text-muted-foreground'
    }
  }
  
  const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
      return window.location.origin
    }
    return ''
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.25_0.04_145)] to-[oklch(0.15_0.03_145)]">
      {/* Header */}
      <div className="bg-white/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <a href="/" className="flex items-center gap-2 text-white/70 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span>返回主页</span>
              </a>
              <div className="h-6 w-px bg-white/20" />
              <div>
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <Trophy className="w-6 h-6 text-[oklch(0.75_0.15_50)]" />
                  {activityName}
                </h1>
                <p className="text-sm text-white/60">运动会计时系统</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-white/60 text-sm">
                <Users className="w-4 h-4 inline mr-1" />
                {participants.length} 名参赛者
              </div>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                    <QrCode className="w-4 h-4 mr-2" />
                    分享二维码
                  </Button>
                </DialogTrigger>
                <DialogContent className="text-center">
                  <DialogHeader>
                    <DialogTitle>分享计时页面</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <div className="bg-white p-4 rounded-xl inline-block mb-4">
                      <QRCode value={`${getBaseUrl()}/sports-timer?name=${encodeURIComponent(activityName)}`} size={200} />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      扫描二维码可独立访问计时页面
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto p-4 space-y-6">
        {/* Timer Section */}
        <Card className="border-0 shadow-xl bg-white">
          <CardContent className="p-8">
            <div className="text-center">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">当前参赛者</p>
                <p className="text-xl font-medium mt-1">
                  {currentParticipant ? `${currentParticipant.petName} (${currentParticipant.petType})` : '请选择参赛者'}
                </p>
              </div>
              <div className="text-7xl md:text-8xl font-mono font-bold mb-8 tracking-wider text-[oklch(0.25_0.04_145)]">
                {formatTime(elapsedTime)}
              </div>
              <div className="flex justify-center gap-4">
                {!isTimerRunning ? (
                  <>
                    <Button 
                      size="lg"
                      onClick={handleStartTimer}
                      disabled={!currentParticipant}
                      className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)] px-8"
                    >
                      <Play className="w-5 h-5 mr-2" />
                      开始计时
                    </Button>
                    <Button 
                      size="lg"
                      variant="outline"
                      onClick={handleResetTimer}
                      className="px-8"
                    >
                      <RotateCcw className="w-5 h-5 mr-2" />
                      重置
                    </Button>
                  </>
                ) : (
                  <Button 
                    size="lg"
                    onClick={handleStopTimer}
                    className="bg-[oklch(0.6_0.15_50)] hover:bg-[oklch(0.55_0.13_50)] px-12"
                  >
                    <Square className="w-5 h-5 mr-2" />
                    停止计时
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Participants List */}
          <div className="lg:col-span-2">
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                    参赛者列表
                  </CardTitle>
                  <CardDescription>点击参赛者开始计时</CardDescription>
                </div>
                <div className="flex gap-2">
                  <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="w-4 h-4 mr-1" />
                        添加
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>添加参赛者</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="space-y-2">
                          <Label>主人姓名 *</Label>
                          <Input 
                            value={newParticipant.name}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, name: e.target.value }))}
                            placeholder="请输入主人姓名"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>宠物名 *</Label>
                          <Input 
                            value={newParticipant.petName}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, petName: e.target.value }))}
                            placeholder="请输入宠物名"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>宠物类型 *</Label>
                          <Input 
                            value={newParticipant.petType}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, petType: e.target.value }))}
                            placeholder="如：金毛犬、泰迪等"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>联系电话</Label>
                          <Input 
                            value={newParticipant.ownerPhone}
                            onChange={(e) => setNewParticipant(prev => ({ ...prev, ownerPhone: e.target.value }))}
                            placeholder="请输入联系电话"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
                        <Button onClick={handleAddParticipant} className="bg-[oklch(0.9_0.18_95)]">
                          确认添加
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button variant="outline" size="sm" onClick={clearAllData}>
                    清空
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {participants.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>暂无参赛者</p>
                    <p className="text-sm mt-2">点击"添加"按钮添加参赛者</p>
                  </div>
                ) : (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-12">选择</TableHead>
                          <TableHead>宠物名</TableHead>
                          <TableHead>宠物类型</TableHead>
                          <TableHead>主人</TableHead>
                          <TableHead>成绩</TableHead>
                          <TableHead>排名</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {participants.map((participant) => {
                          const ranked = rankedParticipants.find(r => r.id === participant.id)
                          return (
                            <TableRow 
                              key={participant.id}
                              className={`cursor-pointer hover:bg-muted/50 ${
                                currentParticipant?.id === participant.id ? 'bg-[oklch(0.95_0.08_95)]' : ''
                              }`}
                              onClick={() => selectParticipant(participant)}
                            >
                              <TableCell>
                                <div className={`w-4 h-4 rounded-full border-2 ${
                                  currentParticipant?.id === participant.id 
                                    ? 'bg-[oklch(0.9_0.18_95)] border-[oklch(0.9_0.18_95)]' 
                                    : 'border-muted-foreground'
                                }`} />
                              </TableCell>
                              <TableCell className="font-medium">{participant.petName}</TableCell>
                              <TableCell>{participant.petType}</TableCell>
                              <TableCell>{participant.name}</TableCell>
                              <TableCell>
                                {participant.time !== undefined ? (
                                  <span className="font-mono">{participant.time.toFixed(2)}s</span>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">未完成</Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {ranked && ranked.rank! <= 3 ? (
                                  <Medal className={`w-5 h-5 ${getMedalColor(ranked.rank!)}`} />
                                ) : ranked ? (
                                  <span className="text-muted-foreground">#{ranked.rank}</span>
                                ) : '-'}
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
          
          {/* Ranking Board */}
          <div>
            <Card className="border-0 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Crown className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                    实时排名
                  </CardTitle>
                  <CardDescription>按成绩升序排列</CardDescription>
                </div>
                <Button 
                  size="sm" 
                  onClick={exportResults}
                  disabled={rankedParticipants.length === 0}
                  className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
                >
                  <Download className="w-4 h-4 mr-1" />
                  导出成绩
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {top10.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">暂无成绩记录</p>
                  ) : (
                    top10.map((participant, index) => (
                      <div 
                        key={participant.id}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          index < 3 ? 'bg-gradient-to-r from-[oklch(0.95_0.08_95)] to-transparent' : 'bg-muted/30'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-amber-600 text-white' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{participant.petName}</p>
                          <p className="text-xs text-muted-foreground">{participant.petType}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold">{participant.time?.toFixed(2)}s</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SportsTimerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.25_0.04_145)] to-[oklch(0.15_0.03_145)]">
        <div className="animate-spin w-8 h-8 border-4 border-white border-t-transparent rounded-full"></div>
      </div>
    }>
      <SportsTimerContent />
    </Suspense>
  )
}
