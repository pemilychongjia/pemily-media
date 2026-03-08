'use client'

import { useState } from 'react'
import { 
  UserPlus, 
  Clock, 
  CheckCircle, 
  Users,
  MessageCircle,
  Send,
  Loader2,
  ChevronRight,
  Building2,
  Link
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useActivityStore } from '@/store/activity-store'
import { toast } from '@/hooks/use-toast'
import type { RecruitmentNeed } from '@/types/activity'

const statusConfig: Record<RecruitmentNeed['status'], { label: string; className: string; icon: typeof Clock }> = {
  pending: { label: '待提交', className: 'bg-gray-100 text-gray-600', icon: Clock },
  submitted: { label: '已提交', className: 'bg-blue-100 text-blue-600', icon: Send },
  recruiting: { label: '招聘中', className: 'bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)]', icon: UserPlus },
  filled: { label: '已招满', className: 'bg-purple-100 text-purple-600', icon: Users },
  training: { label: '培训中', className: 'bg-[oklch(0.95_0.08_95)] text-[oklch(0.75_0.12_95)]', icon: MessageCircle },
  completed: { label: '培训完成', className: 'bg-[oklch(0.92_0.05_160)] text-[oklch(0.35_0.12_160)]', icon: CheckCircle }
}

const roleOptions = [
  { value: 'host', label: '主持人' },
  { value: 'executor', label: '执行人员' },
  { value: 'photographer', label: '摄影师' },
  { value: 'security', label: '安全员' },
  { value: 'other', label: '其他' }
]

export default function RecruitmentManager() {
  const { currentActivityId, activities, addRecruitmentNeed, updateRecruitmentNeed } = useActivityStore()
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const recruitmentNeeds = currentActivity?.recruitmentNeeds || []
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [selectedNeed, setSelectedNeed] = useState<RecruitmentNeed | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [newNeed, setNewNeed] = useState({
    role: '',
    count: 1,
    requirements: '',
    agency: '',
    wechatGroup: '',
    notes: ''
  })
  
  const handleAddNeed = () => {
    if (!currentActivityId || !newNeed.role) {
      toast({ title: '请选择岗位', variant: 'destructive' })
      return
    }
    
    setIsSubmitting(true)
    addRecruitmentNeed(currentActivityId, {
      ...newNeed,
      status: 'pending',
      submittedAt: '',
      filledAt: '',
      trainingAt: '',
      completedAt: '',
      notes: newNeed.notes
    })
    
    setIsAddDialogOpen(false)
    setNewNeed({ role: '', count: 1, requirements: '', agency: '', wechatGroup: '', notes: '' })
    setIsSubmitting(false)
    
    toast({ title: '招聘需求已添加' })
  }
  
  const handleUpdateStatus = (needId: string, newStatus: RecruitmentNeed['status']) => {
    if (!currentActivityId) return
    
    const updates: Partial<RecruitmentNeed> = { status: newStatus }
    const now = new Date().toLocaleString('zh-CN')
    
    switch (newStatus) {
      case 'submitted':
        updates.submittedAt = now
        break
      case 'filled':
        updates.filledAt = now
        break
      case 'training':
        updates.trainingAt = now
        break
      case 'completed':
        updates.completedAt = now
        break
    }
    
    updateRecruitmentNeed(currentActivityId, needId, updates)
    toast({ title: '状态已更新' })
  }
  
  const handleOpenUpdate = (need: RecruitmentNeed) => {
    setSelectedNeed(need)
    setIsUpdateDialogOpen(true)
  }
  
  const handleUpdateNeed = () => {
    if (!currentActivityId || !selectedNeed) return
    
    updateRecruitmentNeed(currentActivityId, selectedNeed.id, {
      agency: selectedNeed.agency,
      wechatGroup: selectedNeed.wechatGroup,
      notes: selectedNeed.notes
    })
    
    setIsUpdateDialogOpen(false)
    setSelectedNeed(null)
    toast({ title: '信息已更新' })
  }
  
  // 统计
  const totalNeeds = recruitmentNeeds.length
  const completedCount = recruitmentNeeds.filter(n => n.status === 'completed').length
  const progress = totalNeeds > 0 ? Math.round((completedCount / totalNeeds) * 100) : 0
  
  // 按状态分组
  const groupedNeeds = recruitmentNeeds.reduce((acc, need) => {
    if (!acc[need.status]) acc[need.status] = []
    acc[need.status].push(need)
    return acc
  }, {} as Record<string, RecruitmentNeed[]>)
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        请先选择活动
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">招聘管理</h1>
          <p className="text-muted-foreground">兼职招聘流程管理，从提交需求到培训完成</p>
        </div>
        <Button 
          onClick={() => setIsAddDialogOpen(true)}
          className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
        >
          <UserPlus className="w-4 h-4 mr-2" />
          添加招聘需求
        </Button>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <Users className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">招聘需求</p>
                <p className="text-xl font-bold">{totalNeeds}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_50)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[oklch(0.6_0.12_50)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">进行中</p>
                <p className="text-xl font-bold">{totalNeeds - completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_160)] flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-[oklch(0.55_0.15_160)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已完成</p>
                <p className="text-xl font-bold text-[oklch(0.55_0.15_160)]">{completedCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">完成率</p>
                <p className="text-xl font-bold">{progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress */}
      {totalNeeds > 0 && (
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">招聘进度</span>
              <span className="text-sm text-muted-foreground">{completedCount}/{totalNeeds} 已完成</span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>
      )}
      
      {/* Recruitment List */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
            招聘需求列表
          </CardTitle>
          <CardDescription>按状态管理招聘流程</CardDescription>
        </CardHeader>
        <CardContent>
          {recruitmentNeeds.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <UserPlus className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无招聘需求</p>
              <p className="text-sm mt-2">点击上方按钮添加招聘需求</p>
            </div>
          ) : (
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>岗位</TableHead>
                    <TableHead>人数</TableHead>
                    <TableHead>要求</TableHead>
                    <TableHead>招聘机构</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruitmentNeeds.map((need) => {
                    const config = statusConfig[need.status]
                    const StatusIcon = config.icon
                    return (
                      <TableRow key={need.id}>
                        <TableCell className="font-medium">{need.role}</TableCell>
                        <TableCell>{need.count}人</TableCell>
                        <TableCell className="max-w-[200px] truncate">{need.requirements || '-'}</TableCell>
                        <TableCell>{need.agency || '-'}</TableCell>
                        <TableCell>
                          <Badge className={config.className}>
                            <StatusIcon className="w-3 h-3 mr-1" />
                            {config.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-2">
                            {need.status === 'pending' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(need.id, 'submitted')}>
                                提交
                              </Button>
                            )}
                            {need.status === 'submitted' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(need.id, 'recruiting')}>
                                开始招聘
                              </Button>
                            )}
                            {need.status === 'recruiting' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(need.id, 'filled')}>
                                已招满
                              </Button>
                            )}
                            {need.status === 'filled' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(need.id, 'training')}>
                                开始培训
                              </Button>
                            )}
                            {need.status === 'training' && (
                              <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(need.id, 'completed')}>
                                完成培训
                              </Button>
                            )}
                            <Button size="sm" variant="ghost" onClick={() => handleOpenUpdate(need)}>
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          </div>
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
      
      {/* 流程说明 */}
      <Card className="border-0 shadow-md bg-[oklch(0.98_0.04_95)]">
        <CardContent className="p-4">
          <h4 className="font-medium mb-3">招聘流程说明</h4>
          <div className="flex items-center gap-2 flex-wrap">
            {['待提交', '已提交', '招聘中', '已招满', '培训中', '培训完成'].map((step, index) => (
              <div key={step} className="flex items-center gap-2">
                <Badge variant="outline" className="border-[oklch(0.9_0.18_95)]">
                  {index + 1}. {step}
                </Badge>
                {index < 5 && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      
      {/* 添加招聘需求对话框 */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>添加招聘需求</DialogTitle>
            <DialogDescription>提交兼职招聘需求给外部招聘机构</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>岗位 *</Label>
              <Select value={newNeed.role} onValueChange={(v) => setNewNeed(prev => ({ ...prev, role: v }))}>
                <SelectTrigger>
                  <SelectValue placeholder="选择岗位" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map(opt => (
                    <SelectItem key={opt.value} value={opt.label}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>招聘人数</Label>
              <Input 
                type="number" 
                value={newNeed.count}
                onChange={(e) => setNewNeed(prev => ({ ...prev, count: parseInt(e.target.value) || 1 }))}
                min={1}
              />
            </div>
            <div className="space-y-2">
              <Label>岗位要求</Label>
              <Textarea 
                value={newNeed.requirements}
                onChange={(e) => setNewNeed(prev => ({ ...prev, requirements: e.target.value }))}
                placeholder="描述岗位要求和技能需求..."
              />
            </div>
            <div className="space-y-2">
              <Label>招聘机构</Label>
              <Input 
                value={newNeed.agency}
                onChange={(e) => setNewNeed(prev => ({ ...prev, agency: e.target.value }))}
                placeholder="外部招聘机构名称"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>取消</Button>
            <Button onClick={handleAddNeed} disabled={isSubmitting} className="bg-[oklch(0.9_0.18_95)]">
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              添加
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 更新招聘需求对话框 */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>更新招聘信息</DialogTitle>
            <DialogDescription>更新招聘机构、微信群等信息</DialogDescription>
          </DialogHeader>
          {selectedNeed && (
            <div className="space-y-4 py-4">
              <div className="p-3 bg-muted/30 rounded-lg">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{selectedNeed.role}</span>
                  <Badge className={statusConfig[selectedNeed.status].className}>
                    {statusConfig[selectedNeed.status].label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">招聘人数: {selectedNeed.count}人</p>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  招聘机构
                </Label>
                <Input 
                  value={selectedNeed.agency}
                  onChange={(e) => setSelectedNeed(prev => prev ? { ...prev, agency: e.target.value } : null)}
                  placeholder="招聘机构名称"
                />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Link className="w-4 h-4" />
                  微信群链接
                </Label>
                <Input 
                  value={selectedNeed.wechatGroup}
                  onChange={(e) => setSelectedNeed(prev => prev ? { ...prev, wechatGroup: e.target.value } : null)}
                  placeholder="微信群二维码链接或群号"
                />
              </div>
              <div className="space-y-2">
                <Label>备注</Label>
                <Textarea 
                  value={selectedNeed.notes}
                  onChange={(e) => setSelectedNeed(prev => prev ? { ...prev, notes: e.target.value } : null)}
                  placeholder="其他备注信息..."
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateDialogOpen(false)}>取消</Button>
            <Button onClick={handleUpdateNeed} className="bg-[oklch(0.9_0.18_95)]">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
