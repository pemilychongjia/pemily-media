'use client'

import { useState, useEffect } from 'react'
import { 
  Share2,
  MessageCircle,
  Smartphone,
  Users,
  CheckCircle,
  XCircle,
  Plus,
  Minus,
  ExternalLink,
  Calendar,
  Copy,
  Loader2,
  FileText,
  Sparkles
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { useActivityStore } from '@/store/activity-store'
import { toast } from '@/hooks/use-toast'
import type { PromotionProgress } from '@/types/activity'

export default function PromotionTracker() {
  const { currentActivityId, activities, updatePromotionProgress } = useActivityStore()
  
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const promotionProgress = currentActivity?.promotionProgress
  const flow = currentActivity?.flow
  const requirement = currentActivity?.requirement
  
  const [localProgress, setLocalProgress] = useState<PromotionProgress>(() => ({
    xiaohongshuPublished: promotionProgress?.xiaohongshuPublished ?? false,
    xiaohongshuCount: promotionProgress?.xiaohongshuCount ?? 0,
    xiaohongshuLinks: promotionProgress?.xiaohongshuLinks ?? [],
    communityPublished: promotionProgress?.communityPublished ?? false,
    communityCount: promotionProgress?.communityCount ?? 0,
    communityNames: promotionProgress?.communityNames ?? [],
    miniProgramPublished: promotionProgress?.miniProgramPublished ?? false,
    registrationCount: promotionProgress?.registrationCount ?? 0,
    updatedAt: promotionProgress?.updatedAt ?? ''
  }))
  
  // 文案生成状态
  const [isGenerating, setIsGenerating] = useState(false)
  const [xiaohongshuCopy, setXiaohongshuCopy] = useState('')
  const [communityCopy, setCommunityCopy] = useState('')
  
  // 当流程单或需求单数据变化时自动生成文案
  useEffect(() => {
    if (requirement) {
      // 延迟一点执行，确保数据已经更新
      const timer = setTimeout(() => {
        generateCopywriting()
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [requirement?.theme, requirement?.date, requirement?.location, flow?.steps?.length])
  
  // 自动生成文案
  const generateCopywriting = async () => {
    if (!requirement) return
    
    setIsGenerating(true)
    try {
      // 准备流程步骤数据
      const flowSteps = flow?.steps || []
      
      // 先尝试API生成
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
              flow: flowSteps.map(s => ({
                name: s.name,
                description: s.description,
                type: s.type
              }))
            }
          })
        })
        
        const result = await response.json()
        if (result.success && result.data && result.data.xiaohongshu) {
          setXiaohongshuCopy(result.data.xiaohongshu || '')
          setCommunityCopy(result.data.community || '')
          setIsGenerating(false)
          return
        }
      } catch {
        // API失败，使用本地生成
      }
      
      // 本地生成文案
      generateLocalCopy()
    } finally {
      setIsGenerating(false)
    }
  }
  
  // 本地生成文案（备用方案）- 确保总是能生成
  const generateLocalCopy = () => {
    if (!requirement) return
    
    const premiumSteps = flow?.steps?.filter(s => s.type === 'premium') || []
    const highlights = premiumSteps.map(s => s.name)
    const flowSteps = flow?.steps || []
    
    // 获取当前季节
    const now = new Date()
    const month = now.getMonth() + 1
    let seasonText = ''
    if (month >= 3 && month <= 5) seasonText = '春暖花开'
    else if (month >= 6 && month <= 8) seasonText = '炎炎夏日'
    else if (month >= 9 && month <= 11) seasonText = '秋高气爽'
    else seasonText = '冬日暖阳'
    
    // 小红书文案 - 增值活动亮点+季节节点+有趣风格，无序号
    const xhsCopy = `✨${requirement.theme || '萌宠活动'}来啦✨

📍 坐标：${requirement.location || '待定'}
📅 时间：${requirement.date || '待定'}

${highlights.length > 0 ? `🌟 活动亮点：\n${highlights.map(h => `• ${h}`).join('\n')}` : '精彩活动等你来！'}

${seasonText}的季节，带着毛孩子来一场难忘的约会吧！
评论区扣【报名】获取参与方式

#宠物活动 #萌宠 #周末去哪儿`
    
    // 社群文案 - 活动流程+时间段+福利
    const communityCopyText = `🎉【${requirement.theme || '萌宠活动'}】报名开启！

📅 活动时间：${requirement.date || '待定'}
📍 活动地点：${requirement.location || '待定'}

📋 活动流程：
${flowSteps.length > 0 ? flowSteps.map(s => `• ${s.time || ''} ${s.name}`).join('\n') : '精彩活动等你来'}

🎁 参与福利：
• 精美伴手礼一份
• 现场互动抽奖
• 超多惊喜等着你

✅ 报名方式：点击小程序链接即可报名
⚠️ 名额有限，先到先得！`
    
    setXiaohongshuCopy(xhsCopy)
    setCommunityCopy(communityCopyText)
  }
  
  // 更新状态
  const handleUpdate = (updates: Partial<PromotionProgress>) => {
    if (!currentActivityId) return
    
    const newProgress = { ...localProgress, ...updates }
    setLocalProgress(newProgress)
    updatePromotionProgress(currentActivityId, updates)
    
    toast({
      title: '已更新',
      description: '宣传进度已保存'
    })
  }
  
  // 计算宣传进度百分比
  const calculateProgress = () => {
    let completed = 0
    let total = 4
    
    if (localProgress.xiaohongshuPublished) completed++
    if (localProgress.communityPublished) completed++
    if (localProgress.miniProgramPublished) completed++
    if (localProgress.registrationCount > 0) completed++
    
    return Math.round((completed / total) * 100)
  }
  
  const progress = calculateProgress()
  
  // 一键复制
  const handleCopy = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      toast({
        title: '复制成功',
        description: `${type}文案已复制到剪贴板`
      })
    } catch {
      toast({
        title: '复制失败',
        description: '请手动复制',
        variant: 'destructive'
      })
    }
  }
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <Share2 className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先选择活动</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">宣传进度追踪</h1>
          <p className="text-muted-foreground">自动生成宣传文案，追踪发布状态</p>
        </div>
        <Badge className="text-lg px-4 py-2 bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)]">
          完成度 {progress}%
        </Badge>
      </div>
      
      {/* 活动信息提示 */}
      <Card className="border-0 shadow-md bg-[oklch(0.98_0.04_95)]">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-sm">
            <FileText className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
            <span className="text-muted-foreground">当前活动：</span>
            <span className="font-medium">{currentActivity?.activity.name || '未选择'}</span>
            {currentActivity?.activity.date && (
              <>
                <span className="text-muted-foreground mx-1">·</span>
                <span>{currentActivity.activity.date}</span>
              </>
            )}
            {currentActivity?.activity.location && (
              <>
                <span className="text-muted-foreground mx-1">·</span>
                <span>{currentActivity.activity.location}</span>
              </>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* 宣传文案区域 - 放在最上面 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
            <h2 className="text-lg font-bold">宣传文案</h2>
            {isGenerating && (
              <Badge className="bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)]">
                <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                生成中...
              </Badge>
            )}
          </div>
          {requirement && (
            <Button 
              variant="outline" 
              size="sm" 
              onClick={generateCopywriting}
              disabled={isGenerating}
            >
              <Sparkles className="w-4 h-4 mr-1" />
              重新生成
            </Button>
          )}
        </div>
        
        {requirement ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* 小红书文案 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Share2 className="w-4 h-4 text-[oklch(0.7_0.15_200)]" />
                    小红书文案
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(xiaohongshuCopy, '小红书')}
                    disabled={!xiaohongshuCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  增值活动亮点+季节节点+有趣风格，无序号
                </CardDescription>
              </CardHeader>
              <CardContent>
                {xiaohongshuCopy ? (
                  <Textarea
                    value={xiaohongshuCopy}
                    onChange={(e) => setXiaohongshuCopy(e.target.value)}
                    className="min-h-[200px] resize-none text-sm"
                  />
                ) : (
                  <div className="min-h-[200px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">请先上传流程单</p>
                      <p className="text-xs mt-1">文案将自动生成</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
            
            {/* 社群文案 */}
            <Card className="border-0 shadow-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <MessageCircle className="w-4 h-4 text-[oklch(0.75_0.15_50)]" />
                    社群文案
                  </CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleCopy(communityCopy, '社群')}
                    disabled={!communityCopy}
                  >
                    <Copy className="w-4 h-4 mr-1" />
                    复制
                  </Button>
                </div>
                <CardDescription className="text-xs">
                  活动流程+时间段+福利
                </CardDescription>
              </CardHeader>
              <CardContent>
                {communityCopy ? (
                  <Textarea
                    value={communityCopy}
                    onChange={(e) => setCommunityCopy(e.target.value)}
                    className="min-h-[200px] resize-none text-sm"
                  />
                ) : (
                  <div className="min-h-[200px] border-2 border-dashed rounded-lg flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">请先上传流程单</p>
                      <p className="text-xs mt-1">文案将自动生成</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card className="border-0 shadow-md">
            <CardContent className="py-8">
              <div className="text-center text-muted-foreground">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">请先在「项目材料」上传流程单</p>
                <p className="text-sm mt-1">上传后文案将自动生成</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
      
      {/* 进度追踪区域 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
          <h2 className="text-lg font-bold">进度追踪</h2>
        </div>
        
        {/* Progress Bar */}
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-medium">整体宣传进度</span>
              <span className="text-sm text-muted-foreground">
                {[
                  localProgress.xiaohongshuPublished && '小红书',
                  localProgress.communityPublished && '社群',
                  localProgress.miniProgramPublished && '小程序',
                  localProgress.registrationCount > 0 && '有报名'
                ].filter(Boolean).join(' + ') || '未开始'}
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </CardContent>
        </Card>
        
        {/* 小红书发布 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Share2 className="w-5 h-5 text-[oklch(0.7_0.15_200)]" />
                小红书发布
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="xhs-switch" className="text-sm">已发布</Label>
                <Switch
                  id="xhs-switch"
                  checked={localProgress.xiaohongshuPublished}
                  onCheckedChange={(checked) => handleUpdate({ xiaohongshuPublished: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ xiaohongshuCount: Math.max(0, localProgress.xiaohongshuCount - 1) })}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{localProgress.xiaohongshuCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ xiaohongshuCount: localProgress.xiaohongshuCount + 1 })}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-muted-foreground">篇笔记已发布</span>
            </div>
            
            {localProgress.xiaohongshuCount > 0 && (
              <div className="space-y-2">
                <Label>发布链接</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="粘贴小红书笔记链接..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        if (input.value.trim()) {
                          handleUpdate({
                            xiaohongshuLinks: [...localProgress.xiaohongshuLinks, input.value.trim()]
                          })
                          input.value = ''
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const input = document.querySelector('input[placeholder*="小红书"]') as HTMLInputElement
                      if (input?.value.trim()) {
                        handleUpdate({
                          xiaohongshuLinks: [...localProgress.xiaohongshuLinks, input.value.trim()]
                        })
                        input.value = ''
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                {localProgress.xiaohongshuLinks.length > 0 && (
                  <div className="space-y-2 mt-2">
                    {localProgress.xiaohongshuLinks.map((link, i) => (
                      <div key={i} className="flex items-center gap-2 p-2 bg-muted/30 rounded-lg">
                        <ExternalLink className="w-4 h-4 text-muted-foreground" />
                        <a 
                          href={link} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-[oklch(0.9_0.18_95)] hover:underline flex-1 truncate"
                        >
                          {link}
                        </a>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleUpdate({
                            xiaohongshuLinks: localProgress.xiaohongshuLinks.filter((_, idx) => idx !== i)
                          })}
                        >
                          <XCircle className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {localProgress.xiaohongshuPublished ? (
                <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.15_160)]" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {localProgress.xiaohongshuPublished 
                  ? `已发布 ${localProgress.xiaohongshuCount} 篇小红书笔记` 
                  : '尚未在小红书发布活动宣传'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* 社群发布 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <MessageCircle className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                社群发布
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="community-switch" className="text-sm">已发布</Label>
                <Switch
                  id="community-switch"
                  checked={localProgress.communityPublished}
                  onCheckedChange={(checked) => handleUpdate({ communityPublished: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ communityCount: Math.max(0, localProgress.communityCount - 1) })}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <span className="w-12 text-center font-bold text-lg">{localProgress.communityCount}</span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ communityCount: localProgress.communityCount + 1 })}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-muted-foreground">个社群已发布</span>
            </div>
            
            {localProgress.communityCount > 0 && (
              <div className="space-y-2">
                <Label>发布社群名称</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="输入社群名称..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        const input = e.target as HTMLInputElement
                        if (input.value.trim()) {
                          handleUpdate({
                            communityNames: [...localProgress.communityNames, input.value.trim()]
                          })
                          input.value = ''
                        }
                      }
                    }}
                  />
                  <Button
                    variant="outline"
                    onClick={() => {
                      const inputs = document.querySelectorAll('input[placeholder*="社群"]')
                      const input = inputs[inputs.length - 1] as HTMLInputElement
                      if (input?.value.trim()) {
                        handleUpdate({
                          communityNames: [...localProgress.communityNames, input.value.trim()]
                        })
                        input.value = ''
                      }
                    }}
                  >
                    添加
                  </Button>
                </div>
                {localProgress.communityNames.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {localProgress.communityNames.map((name, i) => (
                      <Badge 
                        key={i} 
                        className="bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)] cursor-pointer hover:bg-[oklch(0.88_0.07_50)]"
                        onClick={() => handleUpdate({
                          communityNames: localProgress.communityNames.filter((_, idx) => idx !== i)
                        })}
                      >
                        {name} ×
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {localProgress.communityPublished ? (
                <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.15_160)]" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {localProgress.communityPublished 
                  ? `已在 ${localProgress.communityCount} 个社群发布` 
                  : '尚未在社群发布活动宣传'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* 小程序上架 */}
        <Card className="border-0 shadow-md">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5 text-[oklch(0.7_0.15_160)]" />
                pemily活动报名小程序
              </CardTitle>
              <div className="flex items-center gap-2">
                <Label htmlFor="miniprogram-switch" className="text-sm">已上架</Label>
                <Switch
                  id="miniprogram-switch"
                  checked={localProgress.miniProgramPublished}
                  onCheckedChange={(checked) => handleUpdate({ miniProgramPublished: checked })}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Users className="w-5 h-5 text-muted-foreground" />
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ registrationCount: Math.max(0, localProgress.registrationCount - 1) })}
                >
                  <Minus className="w-4 h-4" />
                </Button>
                <Input
                  type="number"
                  value={localProgress.registrationCount}
                  onChange={(e) => handleUpdate({ registrationCount: parseInt(e.target.value) || 0 })}
                  className="w-20 text-center"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleUpdate({ registrationCount: localProgress.registrationCount + 1 })}
                >
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <span className="text-muted-foreground">人已报名</span>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {localProgress.miniProgramPublished ? (
                <CheckCircle className="w-4 h-4 text-[oklch(0.55_0.15_160)]" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>
                {localProgress.miniProgramPublished 
                  ? `小程序已上架，${localProgress.registrationCount} 人已报名` 
                  : '报名小程序尚未上架'}
              </span>
            </div>
          </CardContent>
        </Card>
        
        {/* 最后更新时间 */}
        {localProgress.updatedAt && (
          <div className="text-center text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 inline mr-1" />
            最后更新：{localProgress.updatedAt}
          </div>
        )}
      </div>
    </div>
  )
}
