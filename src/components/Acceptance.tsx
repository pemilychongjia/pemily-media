'use client'

import { useState } from 'react'
import { 
  CheckSquare, 
  Camera, 
  FileText, 
  Presentation,
  Sparkles,
  CheckCircle,
  Circle,
  Loader2,
  Download
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { toast } from '@/hooks/use-toast'

interface PhotoTask {
  id: number
  itemName: string
  description: string
  completed: boolean
  photoUrl?: string
}

interface PPTSlide {
  pageNumber: number
  title: string
  content: string[]
  images: string[]
}

interface PPTContent {
  title: string
  slides: PPTSlide[]
  summary: string
  improvements?: string[]
}

const mockPhotoTasks: PhotoTask[] = [
  { id: 1, itemName: '场地布置', description: '活动主场地全景照片', completed: true },
  { id: 2, itemName: '签到处', description: '签到台及工作人员照片', completed: true },
  { id: 3, itemName: '活动道具', description: '宠物用品及道具展示', completed: false },
  { id: 4, itemName: '活动现场', description: '参与人员及宠物活动照片', completed: false },
  { id: 5, itemName: '获奖环节', description: '颁奖仪式照片', completed: false },
  { id: 6, itemName: '安全保障', description: '安全设施及人员照片', completed: true },
  { id: 7, itemName: '服务台', description: '客服咨询台照片', completed: false },
  { id: 8, itemName: '物料清点', description: '剩余物料清点照片', completed: false },
]

export default function Acceptance() {
  const [photoTasks, setPhotoTasks] = useState<PhotoTask[]>(mockPhotoTasks)
  const [isGenerating, setIsGenerating] = useState<string | null>(null)
  const [acceptancePPT, setAcceptancePPT] = useState<PPTContent | null>(null)
  const [reviewPPT, setReviewPPT] = useState<PPTContent | null>(null)

  const completedTasks = photoTasks.filter(t => t.completed).length
  const progress = Math.round((completedTasks / photoTasks.length) * 100)

  const toggleTask = (taskId: number) => {
    setPhotoTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, completed: !t.completed } : t
    ))
  }

  const generateAcceptancePPT = async () => {
    setIsGenerating('acceptance')
    try {
      const completedItems = photoTasks
        .filter(t => t.completed)
        .map(t => t.itemName)
        .join('、')
      
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'acceptance-ppt',
          context: `宠物活动项目，已完成拍照验收项目：${completedItems}`
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setAcceptancePPT(result.data)
        toast({
          title: '生成成功',
          description: '活动验收PPT大纲已生成',
        })
      }
    } catch (error) {
      toast({
        title: '生成失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const generateReviewPPT = async () => {
    setIsGenerating('review')
    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'review-ppt',
          context: '宠物活动项目复盘，包括活动效果、问题分析、改进建议'
        })
      })
      
      const result = await response.json()
      
      if (result.success) {
        setReviewPPT(result.data)
        toast({
          title: '生成成功',
          description: '复盘报告PPT大纲已生成',
        })
      }
    } catch (error) {
      toast({
        title: '生成失败',
        description: '请稍后重试',
        variant: 'destructive'
      })
    } finally {
      setIsGenerating(null)
    }
  }

  const exportPPT = (type: string) => {
    const content = type === 'acceptance' ? acceptancePPT : reviewPPT
    if (!content) return

    const text = `${content.title}\n\n${content.slides.map(s => 
      `【${s.title}】\n${s.content.join('\n')}`
    ).join('\n\n')}\n\n${content.summary}`
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${type === 'acceptance' ? '活动验收PPT大纲' : '复盘报告PPT大纲'}_${new Date().toLocaleDateString('zh-CN')}.txt`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: 'PPT大纲已导出',
    })
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">验收管理</h1>
        <p className="text-muted-foreground">活动验收拍照任务与PPT报告生成</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <Camera className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">拍照任务</p>
                <p className="text-xl font-bold">{photoTasks.length}</p>
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
                <p className="text-xl font-bold text-[oklch(0.55_0.15_160)]">{completedTasks}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <FileText className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">完成进度</p>
                <p className="text-xl font-bold">{progress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">验收拍照进度</span>
            <span className="text-sm text-muted-foreground">{completedTasks}/{photoTasks.length}</span>
          </div>
          <Progress value={progress} className="h-3" />
        </CardContent>
      </Card>

      <Tabs defaultValue="photos" className="w-full">
        <TabsList>
          <TabsTrigger value="photos">拍照任务清单</TabsTrigger>
          <TabsTrigger value="acceptance">验收PPT</TabsTrigger>
          <TabsTrigger value="review">复盘报告</TabsTrigger>
        </TabsList>

        {/* Photo Tasks Tab */}
        <TabsContent value="photos">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                拍照任务清单
              </CardTitle>
              <CardDescription>按报价单项目列出，点击标记完成状态</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {photoTasks.map((task) => (
                  <div 
                    key={task.id}
                    className={`flex items-center gap-4 p-4 rounded-lg border transition-all cursor-pointer ${
                      task.completed 
                        ? 'bg-[oklch(0.95_0.08_95)] border-[oklch(0.9_0.18_95)]' 
                        : 'bg-white hover:bg-muted/50'
                    }`}
                    onClick={() => toggleTask(task.id)}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                      task.completed 
                        ? 'bg-[oklch(0.9_0.18_95)]' 
                        : 'border-2 border-muted-foreground/30'
                    }`}>
                      {task.completed && <CheckCircle className="w-4 h-4 text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{task.itemName}</span>
                        {task.completed && (
                          <Badge className="bg-[oklch(0.9_0.18_95)]">已完成</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Acceptance PPT Tab */}
        <TabsContent value="acceptance">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                  活动验收PPT
                </CardTitle>
                <CardDescription>AI自动生成验收报告PPT大纲</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={generateAcceptancePPT}
                  disabled={isGenerating !== null}
                  className="hover:bg-[oklch(0.95_0.08_95)]"
                >
                  {isGenerating === 'acceptance' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  生成PPT
                </Button>
                {acceptancePPT && (
                  <Button 
                    onClick={() => exportPPT('acceptance')}
                    className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {acceptancePPT ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div className="text-center py-4 border-b">
                      <h3 className="text-xl font-bold">{acceptancePPT.title}</h3>
                    </div>
                    {acceptancePPT.slides.map((slide) => (
                      <div key={slide.pageNumber} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-[oklch(0.9_0.18_95)]">
                            第 {slide.pageNumber} 页
                          </Badge>
                          <h4 className="font-medium">{slide.title}</h4>
                        </div>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {slide.content.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <div className="p-4 bg-[oklch(0.95_0.08_95)] rounded-lg">
                      <h4 className="font-medium mb-2">总结</h4>
                      <p className="text-sm text-muted-foreground">{acceptancePPT.summary}</p>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <Presentation className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>点击"生成PPT"按钮，AI将自动生成验收报告大纲</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review PPT Tab */}
        <TabsContent value="review">
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                  复盘报告PPT
                </CardTitle>
                <CardDescription>AI自动生成活动复盘报告PPT大纲</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline"
                  onClick={generateReviewPPT}
                  disabled={isGenerating !== null}
                  className="hover:bg-[oklch(0.95_0.08_95)]"
                >
                  {isGenerating === 'review' ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Sparkles className="w-4 h-4 mr-2" />
                  )}
                  生成PPT
                </Button>
                {reviewPPT && (
                  <Button 
                    onClick={() => exportPPT('review')}
                    className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {reviewPPT ? (
                <ScrollArea className="h-[400px] pr-4">
                  <div className="space-y-4">
                    <div className="text-center py-4 border-b">
                      <h3 className="text-xl font-bold">{reviewPPT.title}</h3>
                    </div>
                    {reviewPPT.slides.map((slide) => (
                      <div key={slide.pageNumber} className="p-4 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline" className="border-[oklch(0.75_0.15_50)]">
                            第 {slide.pageNumber} 页
                          </Badge>
                          <h4 className="font-medium">{slide.title}</h4>
                        </div>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {slide.content.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    {reviewPPT.improvements && (
                      <div className="p-4 bg-[oklch(0.92_0.05_50)] rounded-lg">
                        <h4 className="font-medium mb-2">改进建议</h4>
                        <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1">
                          {reviewPPT.improvements.map((item, index) => (
                            <li key={index}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="p-4 bg-[oklch(0.95_0.08_95)] rounded-lg">
                      <h4 className="font-medium mb-2">总结</h4>
                      <p className="text-sm text-muted-foreground">{reviewPPT.summary}</p>
                    </div>
                  </div>
                </ScrollArea>
              ) : (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>点击"生成PPT"按钮，AI将自动生成复盘报告大纲</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
