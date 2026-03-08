'use client'

import { useState, useEffect, useRef } from 'react'
import QRCode from 'react-qr-code'
import { 
  Trophy, 
  Plus, 
  Medal,
  Download,
  Play,
  Square,
  RotateCcw,
  Crown,
  Trash2,
  QrCode,
  Share2,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react'
import { useActivityStore } from '@/store/activity-store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'

interface Participant {
  id: number
  petName: string
  time?: number // in seconds
  rank?: number
}

export default function SportsEvent() {
  const { currentActivityId, activityList } = useActivityStore()
  const currentActivity = activityList.find(a => a.id === currentActivityId)
  
  const [participants, setParticipants] = useState<Participant[]>([])
  const [isTimerRunning, setIsTimerRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentParticipant, setCurrentParticipant] = useState<Participant | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false)
  const [newPetName, setNewPetName] = useState('')
  
  const timerRef = useRef<NodeJS.Timeout | null>(null)
  
  // 获取分享链接
  const getShareUrl = () => {
    if (typeof window !== 'undefined') {
      const activityName = currentActivity?.name || '宠物运动会'
      return `${window.location.origin}/sports-timer?name=${encodeURIComponent(activityName)}`
    }
    return ''
  }

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

  // 现场报名 - 只需要宠物名
  const handleAddParticipant = () => {
    if (!newPetName.trim()) {
      toast({
        title: '请输入宠物名',
        variant: 'destructive'
      })
      return
    }

    const participant: Participant = {
      id: Date.now(),
      petName: newPetName.trim()
    }
    
    setParticipants(prev => [...prev, participant])
    setNewPetName('')
    setIsAddDialogOpen(false)
    
    toast({
      title: '报名成功',
      description: `${newPetName.trim()} 已加入比赛`,
    })
  }

  // 快速添加（直接输入）
  const handleQuickAdd = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && newPetName.trim()) {
      const participant: Participant = {
        id: Date.now(),
        petName: newPetName.trim()
      }
      setParticipants(prev => [...prev, participant])
      setNewPetName('')
      toast({
        title: '报名成功',
        description: `${participant.petName} 已加入比赛`,
      })
    }
  }

  const handleDeleteParticipant = (id: number) => {
    setParticipants(prev => prev.filter(p => p.id !== id))
    if (currentParticipant?.id === id) {
      setCurrentParticipant(null)
      setElapsedTime(0)
    }
    toast({ title: '已删除' })
  }

  const exportResults = () => {
    if (rankedParticipants.length === 0) {
      toast({ title: '暂无成绩可导出', variant: 'destructive' })
      return
    }

    const csvContent = [
      '排名,宠物名,成绩(秒)',
      ...rankedParticipants.map((p, index) => 
        `${index + 1},${p.petName},${p.time?.toFixed(2) || '未完成'}`
      )
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `运动会成绩_${new Date().toLocaleDateString('zh-CN')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: '成绩表已下载',
    })
  }

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1: return 'text-yellow-500'
      case 2: return 'text-gray-400'
      case 3: return 'text-amber-600'
      default: return 'text-muted-foreground'
    }
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">运动会管理</h1>
          <p className="text-muted-foreground">现场报名 · 计时排名</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline"
            onClick={() => setIsShareDialogOpen(true)}
            className="hover:bg-[oklch(0.95_0.08_95)]"
          >
            <Share2 className="w-4 h-4 mr-2" />
            分享给兼职
          </Button>
          <Button 
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
          >
            <Plus className="w-4 h-4 mr-2" />
            现场报名
          </Button>
          <Button 
            onClick={exportResults}
            variant="outline"
            className="hover:bg-[oklch(0.95_0.08_95)]"
          >
            <Download className="w-4 h-4 mr-2" />
            导出成绩
          </Button>
        </div>
      </div>

      {/* Quick Add - 现场快速报名 */}
      <Card className="border-0 shadow-md bg-[oklch(0.98_0.04_95)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-4">
            <Label className="whitespace-nowrap">快速报名：</Label>
            <Input 
              value={newPetName}
              onChange={(e) => setNewPetName(e.target.value)}
              onKeyDown={handleQuickAdd}
              placeholder="输入宠物名，按回车快速报名"
              className="flex-1"
            />
            <Button 
              onClick={handleAddParticipant}
              disabled={!newPetName.trim()}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
            >
              报名
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Timer Section */}
      <Card className="border-0 shadow-md bg-gradient-to-br from-[oklch(0.25_0.04_145)] to-[oklch(0.2_0.03_145)]">
        <CardContent className="p-8">
          <div className="text-center text-white">
            <div className="mb-4">
              <p className="text-sm opacity-80">当前参赛者</p>
              <p className="text-xl font-medium mt-1">
                {currentParticipant ? currentParticipant.petName : '请选择参赛者'}
              </p>
            </div>
            <div className="text-7xl font-mono font-bold mb-8 tracking-wider">
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
                    className="px-8 border-white/30 text-white hover:bg-white/10"
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                参赛者列表
                <Badge variant="outline" className="ml-2">{participants.length}只</Badge>
              </CardTitle>
              <CardDescription>点击参赛者开始计时</CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无参赛者</p>
                  <p className="text-sm mt-2">使用上方快速报名添加参赛者</p>
                </div>
              ) : (
                <div className="rounded-lg border overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead className="w-12">选择</TableHead>
                        <TableHead>宠物名</TableHead>
                        <TableHead>成绩</TableHead>
                        <TableHead>排名</TableHead>
                        <TableHead className="w-16">操作</TableHead>
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
                            <TableCell>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteParticipant(participant.id)
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
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
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                实时排名榜
              </CardTitle>
              <CardDescription>按成绩升序排列</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
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
                      </div>
                      <div className="text-right">
                        <p className="font-mono font-bold">{participant.time?.toFixed(2)}s</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              
              {top10.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <Button 
                    className="w-full bg-[oklch(0.75_0.15_50)] hover:bg-[oklch(0.7_0.13_50)]"
                    onClick={() => {
                      toast({
                        title: '前十名获奖选手',
                        description: top10.map((p, i) => `第${i+1}名: ${p.petName}`).join('\n'),
                      })
                    }}
                  >
                    <Medal className="w-4 h-4 mr-2" />
                    查看获奖名单
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Add Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>现场报名</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>宠物名 *</Label>
              <Input 
                value={newPetName}
                onChange={(e) => setNewPetName(e.target.value)}
                placeholder="请输入宠物名"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button 
              onClick={handleAddParticipant}
              disabled={!newPetName.trim()}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
            >
              确认报名
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog - 分享给兼职人员 */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Share2 className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
              分享给兼职人员
            </DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
              <AlertDescription className="text-sm">
                兼职人员无需登录系统，扫描二维码或访问链接即可独立操作运动会计时功能
              </AlertDescription>
            </Alert>
            
            {/* QR Code */}
            <div className="flex justify-center py-4">
              <div className="bg-white p-4 rounded-xl shadow-inner">
                <QRCode value={getShareUrl()} size={180} />
              </div>
            </div>
            
            {/* Link */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">访问链接</Label>
              <div className="flex gap-2">
                <Input 
                  value={getShareUrl()} 
                  readOnly 
                  className="flex-1 text-sm"
                />
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => {
                    navigator.clipboard.writeText(getShareUrl())
                    toast({ title: '链接已复制' })
                  }}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* Open in new tab */}
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => window.open(getShareUrl(), '_blank')}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              在新窗口打开计时页面
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
