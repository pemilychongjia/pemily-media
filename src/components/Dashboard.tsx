'use client'

import { useState, useEffect } from 'react'
import { 
  Users,
  UserCheck,
  Clock,
  Sparkles,
  Share2,
  Send,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Copy,
  ExternalLink,
  Loader2,
  Calendar,
  TrendingUp,
  MessageCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useActivityStore } from '@/store/activity-store'
import { toast } from '@/hooks/use-toast'

interface DashboardProps {
  onNavigate: (tab: string) => void
}

interface PromotionStatus {
  xiaohongshu: { published: boolean; link: string; publishedAt: string }
  community: { published: boolean; groups: number; publishedAt: string }
  pemily: { published: boolean; registrations: number }
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { currentActivityId, activities } = useActivityStore()
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const recruitmentNeeds = currentActivity?.recruitmentNeeds || []
  const staff = currentActivity?.staff || []
  const requirement = currentActivity?.requirement
  const flow = currentActivity?.flow
  
  const [isGeneratingCopy, setIsGeneratingCopy] = useState(false)
  const [xiaohongshuCopy, setXiaohongshuCopy] = useState('')
  const [communityCopy, setCommunityCopy] = useState('')
  const [promotionStatus, setPromotionStatus] = useState<PromotionStatus>({
    xiaohongshu: { published: false, link: '', publishedAt: '' },
    community: { published: false, groups: 0, publishedAt: '' },
    pemily: { published: false, registrations: 0 }
  })
  
  // 计算招聘进度
  const totalRecruitment = recruitmentNeeds.filter(n => n.role !== '项目负责人').length
  const completedRecruitment = recruitmentNeeds.filter(n => n.status === 'completed' && n.role !== '项目负责人').length
  const recruitmentProgress = totalRecruitment > 0 ? Math.round((completedRecruitment / totalRecruitment) * 100) : 0
  
  // 计算培训进度
  const totalStaff = staff.length
  const trainedStaff = staff.filter(s => s.trained).length
  const trainingProgress = totalStaff > 0 ? Math.round((trainedStaff / totalStaff) * 100) : 0
  
  // 生成宣传文案
  const generatePromotionCopy = async () => {
    if (!requirement || !flow) {
      toast({
        title: '请先上传需求单和流程单',
        variant: 'destructive'
      })
      return
    }
    
    setIsGeneratingCopy(true)
    
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'promotion_copy',
          data: {
            theme: requirement.theme,
            date: requirement.date,
            location: requirement.location,
            timeRange: requirement.timeRange,
            selectedActivities: requirement.selectedActivities,
            flow: flow.steps
          }
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setXiaohongshuCopy(result.data.xiaohongshu || '')
        setCommunityCopy(result.data.community || '')
        toast({
          title: '文案生成成功',
          description: '已自动生成小红书和社群宣传文案'
        })
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (error) {
      // 如果API不可用，使用本地生成
      generateLocalCopy()
    } finally {
      setIsGeneratingCopy(false)
    }
  }
  
  // 本地生成文案（备用方案）
  const generateLocalCopy = () => {
    if (!requirement || !flow) return
    
    // 小红书文案
    const xhsCopy = `🐕 ${requirement.theme || '萌宠活动'} 来啦！

📍 坐标：${requirement.location || '待定'}
📅 时间：${requirement.date || '待定'} ${requirement.timeRange || ''}

✨ 活动亮点：
${requirement.selectedActivities.map((a, i) => `${i + 1}. ${a}`).join('\n')}

🎯 这里有：
• 专业宠物互动体验
• 超多惊喜福利等着你
• 萌宠社交新方式

带着毛孩子来一场难忘的约会吧！
评论区扣【报名】获取参与方式👇

#宠物活动 #萌宠 #周末去哪儿 #宠物社交`
    
    // 社群文案
    const communityCopy = `🎉【${requirement.theme || '萌宠活动'}】报名开启！

📅 活动时间：${requirement.date || '待定'} ${requirement.timeRange || ''}
📍 活动地点：${requirement.location || '待定'}

📋 活动流程：
${flow.steps.map((s, i) => `${i + 1}. ${s.name}`).join('\n')}

🎁 参与福利：
• 精美伴手礼一份
• ${requirement.selectedActivities.includes('宠物运动会') ? '运动会优胜奖品' : ''}
• 现场互动抽奖

✅ 报名方式：
点击小程序链接即可报名

⚠️ 名额有限，先到先得！
如有疑问请联系活动负责人`
    
    setXiaohongshuCopy(xhsCopy)
    setCommunityCopy(communityCopy)
  }
  
  // 复制文案
  const copyToClipboard = (text: string, platform: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: '复制成功',
      description: `${platform}文案已复制到剪贴板`
    })
  }
  
  // 更新宣传状态
  const updatePromotionStatus = (platform: keyof PromotionStatus, updates: Partial<PromotionStatus[keyof PromotionStatus]>) => {
    setPromotionStatus(prev => ({
      ...prev,
      [platform]: { ...prev[platform], ...updates }
    }))
  }
  
  // 初始加载时如果有数据则生成本地文案
  useEffect(() => {
    if (requirement && flow && !xiaohongshuCopy && !communityCopy) {
      generateLocalCopy()
    }
  }, [requirement, flow])
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先选择或创建活动</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">活动执行概览</h1>
          <p className="text-muted-foreground">{currentActivity?.activity.name || '活动管理'}</p>
        </div>
        <Button 
          variant="outline" 
          onClick={() => onNavigate('activities')}
        >
          <Calendar className="w-4 h-4 mr-2" />
          切换活动
        </Button>
      </div>
      
      {/* 进度概览 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* 招聘进度 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
              招聘人员进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">招聘完成度</span>
                <span className="text-2xl font-bold">{recruitmentProgress}%</span>
              </div>
              <Progress value={recruitmentProgress} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[oklch(0.75_0.15_50)]" />
                  <span>进行中: {totalRecruitment - completedRecruitment}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.15_160)]" />
                  <span>已完成: {completedRecruitment}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onNavigate('recruitment')}
              >
                查看招聘详情
              </Button>
            </div>
          </CardContent>
        </Card>
        
        {/* 培训进度 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              人员培训进度
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">培训完成度</span>
                <span className="text-2xl font-bold">{trainingProgress}%</span>
              </div>
              <Progress value={trainingProgress} className="h-3" />
              <div className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-1">
                  <Clock className="w-4 h-4 text-[oklch(0.75_0.15_50)]" />
                  <span>待培训: {totalStaff - trainedStaff}</span>
                </div>
                <div className="flex items-center gap-1">
                  <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.15_160)]" />
                  <span>已培训: {trainedStaff}</span>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="w-full mt-2"
                onClick={() => onNavigate('personnel')}
              >
                查看培训详情
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* 宣传内容 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                活动宣传内容
              </CardTitle>
              <CardDescription>根据甲方需求和活动流程自动生成宣传文案</CardDescription>
            </div>
            <Button 
              onClick={generatePromotionCopy}
              disabled={isGeneratingCopy || !requirement || !flow}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
            >
              {isGeneratingCopy ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              重新生成
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="xiaohongshu">
            <TabsList className="mb-4">
              <TabsTrigger value="xiaohongshu" className="flex items-center gap-2">
                <Share2 className="w-4 h-4" />
                小红书文案
              </TabsTrigger>
              <TabsTrigger value="community" className="flex items-center gap-2">
                <MessageCircle className="w-4 h-4" />
                社群文案
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="xiaohongshu">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[oklch(0.95_0.08_95)] text-[oklch(0.75_0.12_95)]">
                    重点打概念，吸引眼球
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(xiaohongshuCopy, '小红书')}
                    disabled={!xiaohongshuCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={xiaohongshuCopy}
                  onChange={(e) => setXiaohongshuCopy(e.target.value)}
                  placeholder="点击上方「重新生成」按钮自动生成小红书宣传文案..."
                  className="min-h-[300px]"
                />
              </div>
            </TabsContent>
            
            <TabsContent value="community">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Badge className="bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)]">
                    包含流程和福利信息
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => copyToClipboard(communityCopy, '社群')}
                    disabled={!communityCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <Textarea
                  value={communityCopy}
                  onChange={(e) => setCommunityCopy(e.target.value)}
                  placeholder="点击上方「重新生成」按钮自动生成社群宣传文案..."
                  className="min-h-[300px]"
                />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* 宣传进度跟踪 */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
            宣传进度跟踪
          </CardTitle>
          <CardDescription>追踪各渠道发布状态和报名情况</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 小红书 */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              promotionStatus.xiaohongshu.published 
                ? 'border-[oklch(0.55_0.15_160)] bg-[oklch(0.95_0.04_160)]' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Share2 className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                  <span className="font-medium">小红书</span>
                </div>
                {promotionStatus.xiaohongshu.published ? (
                  <Badge className="bg-[oklch(0.55_0.15_160)]">已发布</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">待发布</Badge>
                )}
              </div>
              {promotionStatus.xiaohongshu.published ? (
                <div className="text-sm text-muted-foreground">
                  <p>发布时间: {promotionStatus.xiaohongshu.publishedAt}</p>
                  {promotionStatus.xiaohongshu.link && (
                    <a href={promotionStatus.xiaohongshu.link} target="_blank" rel="noopener noreferrer" className="text-[oklch(0.9_0.18_95)] flex items-center gap-1 mt-1">
                      查看笔记 <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    updatePromotionStatus('xiaohongshu', { 
                      published: true, 
                      publishedAt: new Date().toLocaleString('zh-CN') 
                    })
                    toast({ title: '已标记为发布' })
                  }}
                >
                  标记已发布
                </Button>
              )}
            </div>
            
            {/* 社群 */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              promotionStatus.community.published 
                ? 'border-[oklch(0.55_0.15_160)] bg-[oklch(0.95_0.04_160)]' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                  <span className="font-medium">社群</span>
                </div>
                {promotionStatus.community.published ? (
                  <Badge className="bg-[oklch(0.55_0.15_160)]">
                    {promotionStatus.community.groups}个群
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">待发布</Badge>
                )}
              </div>
              {promotionStatus.community.published ? (
                <div className="text-sm text-muted-foreground">
                  <p>发布时间: {promotionStatus.community.publishedAt}</p>
                  <p>已发群数: {promotionStatus.community.groups}</p>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    updatePromotionStatus('community', { 
                      published: true, 
                      groups: 1,
                      publishedAt: new Date().toLocaleString('zh-CN') 
                    })
                    toast({ title: '已标记为发布' })
                  }}
                >
                  标记已发布
                </Button>
              )}
            </div>
            
            {/* Pemily小程序 */}
            <div className={`p-4 rounded-xl border-2 transition-all ${
              promotionStatus.pemily.published 
                ? 'border-[oklch(0.55_0.15_160)] bg-[oklch(0.95_0.04_160)]' 
                : 'border-gray-200'
            }`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Send className="w-5 h-5 text-[oklch(0.65_0.15_160)]" />
                  <span className="font-medium">Pemily小程序</span>
                </div>
                {promotionStatus.pemily.published ? (
                  <Badge className="bg-[oklch(0.55_0.15_160)]">
                    {promotionStatus.pemily.registrations}人报名
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">未上架</Badge>
                )}
              </div>
              {promotionStatus.pemily.published ? (
                <div className="text-sm text-muted-foreground">
                  <p>已报名: {promotionStatus.pemily.registrations}人</p>
                  <Button 
                    variant="link" 
                    size="sm" 
                    className="p-0 h-auto text-[oklch(0.9_0.18_95)]"
                    onClick={() => onNavigate('registration')}
                  >
                    查看报名详情
                  </Button>
                </div>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => {
                    updatePromotionStatus('pemily', { 
                      published: true, 
                      registrations: 0 
                    })
                    toast({ title: '已标记为上架' })
                  }}
                >
                  标记已上架
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
