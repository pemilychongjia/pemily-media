'use client'

import { useState } from 'react'
import { 
  BookOpen, 
  FileText, 
  Printer, 
  CheckCircle, 
  Clock,
  Users,
  ChevronRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'

interface TrainingManual {
  id: string
  title: string
  position: string
  sections: { title: string; content: string }[]
}

interface TrainingProgress {
  position: string
  totalStaff: number
  completed: number
  inProgress: number
  notStarted: number
}

const trainingManuals: TrainingManual[] = [
  {
    id: 'manager',
    title: '活动经理培训手册',
    position: '活动经理',
    sections: [
      { title: '岗位职责', content: '1. 统筹协调活动整体运营\n2. 与客户对接需求\n3. 管理团队工作分配\n4. 处理突发事件\n5. 确保活动顺利进行' },
      { title: '工作流程', content: '1. 活动前：方案制定、人员安排、物料准备\n2. 活动中：现场指挥、进度跟踪、问题处理\n3. 活动后：验收总结、复盘报告' },
      { title: '宠物知识', content: '1. 常见宠物品种特点\n2. 宠物行为解读\n3. 宠物安全注意事项\n4. 应急处理方法' },
      { title: '客户沟通', content: '1. 需求确认技巧\n2. 问题解决方案\n3. 满意度提升方法' },
    ]
  },
  {
    id: 'executor',
    title: '现场执行培训手册',
    position: '现场执行',
    sections: [
      { title: '岗位职责', content: '1. 场地布置与搭建\n2. 物料搬运与管理\n3. 现场秩序维护\n4. 协助其他岗位' },
      { title: '安全规范', content: '1. 重物搬运注意事项\n2. 高空作业安全\n3. 电气设备使用\n4. 紧急撤离流程' },
      { title: '宠物互动', content: '1. 正确的宠物接触方式\n2. 避免惊吓宠物\n3. 宠物安全围护\n4. 基本护理知识' },
    ]
  },
  {
    id: 'caregiver',
    title: '宠物护理培训手册',
    position: '宠物护理',
    sections: [
      { title: '岗位职责', content: '1. 宠物日常照看\n2. 喂食与清洁\n3. 健康状况监测\n4. 基础医疗服务' },
      { title: '护理技能', content: '1. 宠物清洁技巧\n2. 毛发梳理方法\n3. 耳朵清洁\n4. 指甲修剪' },
      { title: '健康监测', content: '1. 体温测量\n2. 精神状态观察\n3. 食欲判断\n4. 异常行为识别' },
      { title: '应急处理', content: '1. 常见突发状况\n2. 基础急救知识\n3. 就医流程\n4. 联系方式' },
    ]
  },
  {
    id: 'security',
    title: '安全员培训手册',
    position: '安全员',
    sections: [
      { title: '岗位职责', content: '1. 现场安全巡查\n2. 人流引导\n3. 应急响应\n4. 设备检查' },
      { title: '安全规范', content: '1. 消防安全知识\n2. 应急预案熟悉\n3. 疏散路线\n4. 危险品识别' },
      { title: '突发事件处理', content: '1. 人员受伤处理\n2. 宠物走失处理\n3. 设备故障处理\n4. 恶劣天气应对' },
    ]
  },
  {
    id: 'service',
    title: '客服培训手册',
    position: '客服',
    sections: [
      { title: '岗位职责', content: '1. 活动咨询接待\n2. 现场引导服务\n3. 投诉处理\n4. 信息收集' },
      { title: '服务标准', content: '1. 礼貌用语\n2. 着装规范\n3. 服务态度\n4. 响应时效' },
      { title: '常见问题', content: '1. 活动流程咨询\n2. 收费标准说明\n3. 宠物参与条件\n4. 特殊需求处理' },
    ]
  },
]

const trainingProgress: TrainingProgress[] = [
  { position: '活动经理', totalStaff: 3, completed: 2, inProgress: 1, notStarted: 0 },
  { position: '现场执行', totalStaff: 10, completed: 6, inProgress: 3, notStarted: 1 },
  { position: '宠物护理', totalStaff: 8, completed: 5, inProgress: 2, notStarted: 1 },
  { position: '安全员', totalStaff: 5, completed: 4, inProgress: 1, notStarted: 0 },
  { position: '客服', totalStaff: 4, completed: 3, inProgress: 1, notStarted: 0 },
]

const registrationFormFields = [
  { label: '活动名称', type: 'text' },
  { label: '宠物姓名', type: 'text' },
  { label: '宠物品种', type: 'text' },
  { label: '宠物年龄', type: 'text' },
  { label: '宠物性别', type: 'select', options: ['公', '母'] },
  { label: '主人姓名', type: 'text' },
  { label: '联系电话', type: 'tel' },
  { label: '是否接种疫苗', type: 'checkbox' },
  { label: '特殊说明', type: 'textarea' },
]

export default function TrainingDocs() {
  const [selectedManual, setSelectedManual] = useState<TrainingManual>(trainingManuals[0])
  const [expandedSection, setExpandedSection] = useState<string | null>(null)

  const handlePrint = () => {
    window.print()
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">培训资料管理</h1>
        <p className="text-muted-foreground">各岗位培训手册、报名表模板与培训进度追踪</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Training Manuals */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                岗位培训手册
              </CardTitle>
              <CardDescription>选择不同岗位查看对应培训内容</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs 
                value={selectedManual.id} 
                onValueChange={(value) => {
                  setSelectedManual(trainingManuals.find(m => m.id === value) || trainingManuals[0])
                  setExpandedSection(null)
                }}
              >
                <TabsList className="flex flex-wrap h-auto gap-1 mb-4">
                  {trainingManuals.map((manual) => (
                    <TabsTrigger 
                      key={manual.id} 
                      value={manual.id}
                      className="data-[state=active]:bg-[oklch(0.9_0.18_95)] data-[state=active]:text-white"
                    >
                      {manual.position}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {trainingManuals.map((manual) => (
                  <TabsContent key={manual.id} value={manual.id} className="mt-0">
                    <ScrollArea className="h-[400px] pr-4">
                      <div className="space-y-4">
                        {manual.sections.map((section, index) => (
                          <div 
                            key={index}
                            className="border rounded-lg overflow-hidden"
                          >
                            <button
                              className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                              onClick={() => setExpandedSection(
                                expandedSection === `${manual.id}-${index}` 
                                  ? null 
                                  : `${manual.id}-${index}`
                              )}
                            >
                              <span className="font-medium">{section.title}</span>
                              <ChevronRight 
                                className={`w-5 h-5 transition-transform ${
                                  expandedSection === `${manual.id}-${index}` ? 'rotate-90' : ''
                                }`}
                              />
                            </button>
                            {expandedSection === `${manual.id}-${index}` && (
                              <div className="p-4 bg-white">
                                <pre className="whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                                  {section.content}
                                </pre>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>

          {/* Registration Form */}
          <Card className="border-0 shadow-md">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-[oklch(0.75_0.15_50)]" />
                  宠物活动报名表
                </CardTitle>
                <CardDescription>报名表模板预览</CardDescription>
              </div>
              <Button 
                onClick={handlePrint}
                className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
              >
                <Printer className="w-4 h-4 mr-2" />
                打印报名表
              </Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white print:shadow-none">
                <div className="text-center mb-6">
                  <h3 className="text-lg font-bold">宠物活动报名表</h3>
                  <p className="text-sm text-muted-foreground">请如实填写以下信息</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {registrationFormFields.map((field, index) => (
                    <div key={index} className={field.type === 'textarea' ? 'md:col-span-2' : ''}>
                      <label className="text-sm font-medium text-muted-foreground mb-1 block">
                        {field.label}
                      </label>
                      {field.type === 'text' || field.type === 'tel' ? (
                        <div className="border-b border-dashed border-gray-300 py-1 min-h-[24px]">
                          &nbsp;
                        </div>
                      ) : field.type === 'select' ? (
                        <div className="flex gap-4 py-1">
                          {field.options?.map((opt, i) => (
                            <label key={i} className="flex items-center gap-2">
                              <div className="w-4 h-4 border rounded-full" />
                              <span className="text-sm">{opt}</span>
                            </label>
                          ))}
                        </div>
                      ) : field.type === 'checkbox' ? (
                        <div className="flex items-center gap-2 py-1">
                          <div className="w-4 h-4 border rounded" />
                          <span className="text-sm">是</span>
                        </div>
                      ) : (
                        <div className="border-b border-dashed border-gray-300 py-1 min-h-[48px]">
                          &nbsp;
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-6 pt-4 border-t">
                  <p className="text-xs text-muted-foreground text-center">
                    签名: _______________ &nbsp;&nbsp;&nbsp;&nbsp; 日期: _______________
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Training Progress */}
        <div className="space-y-6">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                培训进度追踪
              </CardTitle>
              <CardDescription>各岗位培训完成情况</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {trainingProgress.map((progress) => {
                  const completionRate = Math.round((progress.completed / progress.totalStaff) * 100)
                  return (
                    <div key={progress.position} className="p-4 bg-muted/30 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{progress.position}</span>
                        <Badge variant="outline" className="border-[oklch(0.9_0.18_95)] text-[oklch(0.8_0.15_95)]">
                          {progress.completed}/{progress.totalStaff}
                        </Badge>
                      </div>
                      <Progress value={completionRate} className="h-2 mb-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-[oklch(0.9_0.18_95)]" />
                          <span>已完成 {progress.completed}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-[oklch(0.75_0.15_50)]" />
                          <span>进行中 {progress.inProgress}</span>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>

          {/* Summary Stats */}
          <Card className="border-0 shadow-md bg-gradient-to-br from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)]">
            <CardContent className="p-6">
              <div className="text-center text-white">
                <p className="text-sm opacity-80">总体培训完成率</p>
                <p className="text-4xl font-bold mt-2">
                  {Math.round(
                    trainingProgress.reduce((sum, p) => sum + p.completed, 0) / 
                    trainingProgress.reduce((sum, p) => sum + p.totalStaff, 0) * 100
                  )}%
                </p>
                <div className="mt-4 flex justify-center gap-4 text-sm">
                  <div>
                    <p className="opacity-80">已培训</p>
                    <p className="font-bold">{trainingProgress.reduce((sum, p) => sum + p.completed, 0)}人</p>
                  </div>
                  <div className="w-px bg-white/30" />
                  <div>
                    <p className="opacity-80">总人数</p>
                    <p className="font-bold">{trainingProgress.reduce((sum, p) => sum + p.totalStaff, 0)}人</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
