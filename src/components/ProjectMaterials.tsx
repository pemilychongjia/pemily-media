'use client'

import { useState } from 'react'
import { 
  Upload, 
  FileText, 
  Download, 
  Sparkles, 
  Table,
  Loader2,
  CheckCircle,
  FileSpreadsheet,
  Trash2,
  AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Table as DataTable, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { useActivityStore } from '@/store/activity-store'
import type { RequirementData, QuotationData, FlowData } from '@/types/activity'

const fileTypeLabels: Record<string, string> = {
  quotation: '报价单',
  requirement: '需求单',
  flow: '流程单'
}

const fileTypeIcons: Record<string, typeof FileSpreadsheet> = {
  quotation: FileSpreadsheet,
  requirement: FileText,
  flow: Table
}

export default function ProjectMaterials() {
  const { 
    currentActivityId, 
    activities, 
    updateRequirementData,
    updateQuotationData,
    updateFlowData,
    addUploadedFile,
    deleteUploadedFile,
    setMaterials,
    autoGeneratePositions
  } = useActivityStore()
  
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const uploadedFiles = currentActivity?.uploadedFiles || []
  const requirement = currentActivity?.requirement
  const quotation = currentActivity?.quotation
  const flow = currentActivity?.flow
  
  const [uploadingType, setUploadingType] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  
  // 删除已上传文件
  const handleDeleteFile = (fileId: string, fileType: string) => {
    if (!currentActivityId) return
    
    deleteUploadedFile(currentActivityId, fileId)
    
    toast({
      title: '删除成功',
      description: `${fileTypeLabels[fileType]}已删除`
    })
  }
  
  // 检查各文件是否已上传（甲方需求单在创建活动时已上传，这里只需要报价单和流程单）
  const hasRequirement = uploadedFiles.some(f => f.type === 'requirement' && f.parsed)
  const hasQuotation = uploadedFiles.some(f => f.type === 'quotation' && f.parsed)
  const hasFlow = uploadedFiles.some(f => f.type === 'flow' && f.parsed)
  // 只需要报价单和流程单（甲方需求单已在创建活动时上传）
  const allFilesUploaded = hasQuotation && hasFlow
  
  const handleFileSelect = async (type: string) => {
    if (!currentActivityId) {
      toast({ title: '请先选择活动', variant: 'destructive' })
      return
    }
    
    setUploadingType(type)
    
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.xlsx,.xls'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) {
        setUploadingType(null)
        return
      }
      
      setIsUploading(true)
      
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('type', type)
        formData.append('activityId', currentActivityId)
        
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const result = await response.json()
        
        if (result.success) {
          // 记录上传文件
          addUploadedFile(currentActivityId, {
            type: type as 'quotation' | 'requirement' | 'flow' | 'registration',
            name: file.name,
            uploadedAt: new Date().toLocaleString('zh-CN'),
            parsed: true
          })
          
          // 更新对应数据
          switch (type) {
            case 'requirement':
              updateRequirementData(currentActivityId, result.data as RequirementData)
              break
            case 'quotation':
              updateQuotationData(currentActivityId, result.data as QuotationData)
              // 报价单上传后，自动生成物料清单和岗位配置
              const quotationData = result.data as QuotationData
              if (quotationData.basicFees?.length > 0 || quotationData.activityFees?.length > 0) {
                // 自动生成物料清单
                autoGenerateMaterialsFromQuotation(quotationData)
                // 自动生成岗位配置
                setTimeout(() => {
                  autoGeneratePositions(currentActivityId)
                  toast({
                    title: '岗位已生成',
                    description: '已根据报价单自动生成岗位配置'
                  })
                }, 100)
              }
              break
            case 'flow':
              updateFlowData(currentActivityId, result.data as FlowData)
              break
          }
          
          toast({
            title: '上传成功',
            description: `${fileTypeLabels[type]}已解析完成`,
          })
        } else {
          toast({
            title: '解析失败',
            description: result.error || '文件格式不正确',
            variant: 'destructive'
          })
        }
      } catch {
        toast({
          title: '上传失败',
          description: '请稍后重试',
          variant: 'destructive'
        })
      } finally {
        setIsUploading(false)
        setUploadingType(null)
      }
    }
    
    input.click()
  }
  
  // 从报价单自动生成物料清单
  const autoGenerateMaterialsFromQuotation = (quotationData: QuotationData) => {
    if (!currentActivityId) return
    
    const materials: { id: string; activityId: string; name: string; specification: string; quantity: number; unit: string; supplier: string; location: string; responsible: string; category: string; checked: boolean; checkTime: string; checker: string; notes: string }[] = []
    
    const getCategory = (name: string): string => {
      const nameLower = name.toLowerCase()
      if (nameLower.includes('音响') || nameLower.includes('设备')) return '音响设备'
      if (nameLower.includes('运输')) return '运输'
      if (nameLower.includes('搭建') || nameLower.includes('工人')) return '搭建人员'
      if (nameLower.includes('执行') || nameLower.includes('人员')) return '执行人员'
      if (nameLower.includes('主持')) return '主持人员'
      if (nameLower.includes('礼') || nameLower.includes('奖品') || nameLower.includes('奖牌')) return '奖品礼品'
      if (nameLower.includes('运动会') || nameLower.includes('障碍') || nameLower.includes('跨栏')) return '运动会道具'
      if (nameLower.includes('定力')) return '定力赛道具'
      if (nameLower.includes('彩笔') || nameLower.includes('笔')) return '文具用品'
      if (nameLower.includes('宠粮')) return '宠粮奖品'
      return '活动物料'
    }
    
    const getResponsible = (name: string): string => {
      const nameLower = name.toLowerCase()
      if (nameLower.includes('音响')) return '主持人'
      if (nameLower.includes('运输')) return '项目负责人'
      if (nameLower.includes('搭建') || nameLower.includes('工人')) return '搭建团队'
      if (nameLower.includes('主持')) return '项目负责人'
      if (nameLower.includes('执行')) return '执行人员'
      if (nameLower.includes('运动会')) return '执行人员'
      if (nameLower.includes('定力')) return '执行人员'
      return '项目负责人'
    }
    
    const getLocation = (name: string): string => {
      const nameLower = name.toLowerCase()
      if (nameLower.includes('音响')) return '主舞台区域'
      if (nameLower.includes('运输')) return '物料仓库'
      if (nameLower.includes('签到') || nameLower.includes('彩笔')) return '签到处'
      if (nameLower.includes('礼') || nameLower.includes('奖品')) return '奖品存放区'
      if (nameLower.includes('运动会')) return '运动会区域'
      if (nameLower.includes('定力')) return '定力赛区域'
      return '活动现场'
    }
    
    let order = 0
    const allFees = [...quotationData.basicFees, ...quotationData.activityFees]
    
    allFees.forEach((fee) => {
      order++
      materials.push({
        id: `mat_${order}_${Date.now()}`,
        activityId: currentActivityId,
        name: fee.name,
        specification: fee.specification,
        quantity: fee.quantity,
        unit: fee.unit,
        supplier: '',
        location: getLocation(fee.name),
        responsible: getResponsible(fee.name),
        category: getCategory(fee.name),
        checked: false,
        checkTime: '',
        checker: '',
        notes: fee.specification || ''
      })
    })
    
    if (materials.length > 0) {
      setMaterials(currentActivityId, materials)
      toast({
        title: '物料清单已生成',
        description: `已根据报价单生成 ${materials.length} 项物料`
      })
    }
  }
  
  // 导出Excel
  const exportToExcel = (type: string) => {
    let data: unknown[] = []
    let headers: string[] = []
    let fileName = ''
    
    switch (type) {
      case 'materials':
        if (quotation) {
          headers = ['项目', '规格', '单位', '数量', '单价', '天数', '合计']
          data = [...quotation.basicFees, ...quotation.activityFees].map(item => [
            item.name, item.specification, item.unit, item.quantity, item.unitPrice, item.days, item.total
          ])
          fileName = '进场物料单'
        }
        break
      case 'summary':
        if (quotation) {
          headers = ['项目', '金额']
          data = [
            ['基础费用', quotation.summary.basicTotal],
            ['增值服务', quotation.summary.activityTotal],
            ['税费', quotation.summary.tax],
            ['总计', quotation.summary.grandTotal]
          ]
          fileName = '费用汇总'
        }
        break
    }
    
    if (data.length === 0) {
      toast({ title: '暂无数据可导出', variant: 'destructive' })
      return
    }
    
    const csvContent = [
      headers.join(','),
      ...data.map(row => row.join(','))
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}_${new Date().toLocaleDateString('zh-CN')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({ title: '导出成功' })
  }
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先在「活动管理」中选择或创建活动</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">项目材料管理</h1>
        <p className="text-muted-foreground">上传甲方提供的报价单、流程单，系统自动解析数据</p>
      </div>

      {/* Upload Status */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
            文件上传
          </CardTitle>
          <CardDescription>
            上传甲方提供的原始Excel文件，系统将自动解析数据并生成物料清单、岗位配置
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Upload Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>上传进度</span>
              <span>{[hasQuotation, hasFlow].filter(Boolean).length}/2 已完成</span>
            </div>
            <Progress value={[hasQuotation, hasFlow].filter(Boolean).length / 2 * 100} className="h-2" />
          </div>
          
          {/* Upload Buttons - 只需要报价单和流程单（甲方需求单在创建活动时已上传） */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['quotation', 'flow'].map((type) => {
              const isUploaded = type === 'requirement' ? hasRequirement : type === 'quotation' ? hasQuotation : hasFlow
              const Icon = fileTypeIcons[type]
              const isLoading = uploadingType === type
              
              return (
                <div 
                  key={type}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                    isUploaded 
                      ? 'border-[oklch(0.9_0.18_95)] bg-[oklch(0.98_0.04_95)]' 
                      : 'border-gray-200 hover:border-[oklch(0.9_0.18_95)] hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Icon className={`w-5 h-5 ${isUploaded ? 'text-[oklch(0.9_0.18_95)]' : 'text-muted-foreground'}`} />
                      <span className="font-medium">{fileTypeLabels[type]}</span>
                    </div>
                    {isUploaded && (
                      <Badge className="bg-[oklch(0.9_0.18_95)]">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        已上传
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={isUploaded ? 'outline' : 'default'}
                    className={`w-full ${!isUploaded ? 'bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]' : ''}`}
                    onClick={() => handleFileSelect(type)}
                    disabled={isUploading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : isUploaded ? (
                      <Upload className="w-4 h-4 mr-2" />
                    ) : (
                      <FileSpreadsheet className="w-4 h-4 mr-2" />
                    )}
                    {isUploaded ? '重新上传' : '上传文件'}
                  </Button>
                </div>
              )
            })}
          </div>
          
          {/* Uploaded Files List */}
          {uploadedFiles.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">已上传文件</h4>
              <div className="space-y-2">
                {uploadedFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                      <div>
                        <p className="font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {fileTypeLabels[file.type]} · {file.uploadedAt}
                        </p>
                      </div>
                      {file.parsed && (
                        <Badge className="bg-[oklch(0.92_0.05_160)] text-[oklch(0.35_0.12_160)]">
                          已解析
                        </Badge>
                      )}
                    </div>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                      onClick={() => handleDeleteFile(file.id, file.type)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Parsed Data Display - 只要上传了任一文件就显示对应tab */}
      {(hasQuotation || hasFlow) && (
        <Tabs defaultValue={hasQuotation ? "quotation" : "flow"} className="w-full">
          <TabsList className="grid w-full grid-cols-3 max-w-lg">
            <TabsTrigger value="quotation" disabled={!hasQuotation}>报价单</TabsTrigger>
            <TabsTrigger value="flow" disabled={!hasFlow}>流程单</TabsTrigger>
            <TabsTrigger value="requirement" disabled={!hasRequirement}>需求单</TabsTrigger>
          </TabsList>

          {/* Quotation Data */}
          <TabsContent value="quotation">
            {quotation ? (
              quotation.basicFees.length > 0 || quotation.activityFees.length > 0 ? (
              <Card className="border-0 shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle>报价单解析结果</CardTitle>
                  <Button size="sm" variant="outline" onClick={() => exportToExcel('materials')}>
                    <Download className="w-4 h-4 mr-1" />
                    导出
                  </Button>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* 基础费用 */}
                  {quotation.basicFees.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <Table className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                      基础费用 ({quotation.basicFees.length}项)
                    </h4>
                    <div className="rounded-lg border overflow-hidden">
                      <DataTable>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead>项目</TableHead>
                            <TableHead>规格</TableHead>
                            <TableHead>数量</TableHead>
                            <TableHead>单价</TableHead>
                            <TableHead>天数</TableHead>
                            <TableHead className="text-right">合计</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {quotation.basicFees.map((item) => (
                            <TableRow key={item.id}>
                              <TableCell className="font-medium">{item.name}</TableCell>
                              <TableCell>{item.specification}</TableCell>
                              <TableCell>{item.quantity}{item.unit}</TableCell>
                              <TableCell>¥{item.unitPrice}</TableCell>
                              <TableCell>{item.days}</TableCell>
                              <TableCell className="text-right font-medium">¥{item.total}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </DataTable>
                    </div>
                  </div>
                  )}
                  
                  {/* 活动内容费用 */}
                  {quotation.activityFees.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[oklch(0.75_0.15_50)]" />
                        增值服务 ({quotation.activityFees.length}项)
                      </h4>
                      <div className="rounded-lg border overflow-hidden">
                        <DataTable>
                          <TableHeader>
                            <TableRow className="bg-muted/50">
                              <TableHead>项目</TableHead>
                              <TableHead>规格</TableHead>
                              <TableHead>数量</TableHead>
                              <TableHead>单价</TableHead>
                              <TableHead className="text-right">合计</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quotation.activityFees.map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="font-medium">{item.name}</TableCell>
                                <TableCell>{item.specification}</TableCell>
                                <TableCell>{item.quantity}{item.unit}</TableCell>
                                <TableCell>¥{item.unitPrice}</TableCell>
                                <TableCell className="text-right font-medium">¥{item.total}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </DataTable>
                      </div>
                    </div>
                  )}
                  
                  {/* 费用汇总 */}
                  <div className="p-4 bg-[oklch(0.98_0.04_95)] rounded-xl">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">基础费用</p>
                        <p className="text-xl font-bold">¥{quotation.summary.basicTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">增值服务</p>
                        <p className="text-xl font-bold">¥{quotation.summary.activityTotal.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">税费(1%)</p>
                        <p className="text-xl font-bold">¥{quotation.summary.tax.toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">总计</p>
                        <p className="text-2xl font-bold text-[oklch(0.9_0.18_95)]">¥{quotation.summary.grandTotal.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  
                  {/* 提取的人员信息 */}
                  {quotation.personnel && quotation.personnel.length > 0 && (
                    <div>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
                        提取的人员配置
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {quotation.personnel.map((p, idx) => (
                          <div key={idx} className="p-3 bg-muted/30 rounded-lg">
                            <p className="text-sm text-muted-foreground">{p.name}</p>
                            <p className="text-lg font-bold">{p.count}人</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
              ) : (
                <Card className="border-0 shadow-md">
                  <CardContent className="py-8">
                    <div className="text-center text-muted-foreground">
                      <AlertCircle className="w-10 h-10 mx-auto mb-3 opacity-50" />
                      <p className="font-medium">报价单解析结果为空</p>
                      <p className="text-sm mt-1">请点击"清除缓存"按钮后重新上传报价单</p>
                    </div>
                  </CardContent>
                </Card>
              )
            ) : (
              <Card className="border-0 shadow-md">
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <FileSpreadsheet className="w-10 h-10 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">请上传报价单</p>
                    <p className="text-sm mt-1">上传后系统将自动解析数据</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Flow Data */}
          <TabsContent value="flow">
            {flow && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>活动流程单解析结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {flow.steps.map((step, index) => (
                      <div 
                        key={step.id}
                        className={`flex items-start gap-4 p-4 rounded-xl ${
                          step.type === 'premium' 
                            ? 'bg-[oklch(0.95_0.05_50)] border border-[oklch(0.75_0.15_50)]' 
                            : 'bg-muted/50'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold ${
                          step.type === 'premium'
                            ? 'bg-[oklch(0.75_0.15_50)] text-white'
                            : 'bg-[oklch(0.9_0.18_95)] text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{step.name}</span>
                            {step.type === 'premium' && (
                              <Badge className="bg-[oklch(0.75_0.15_50)] text-white">增值</Badge>
                            )}
                            <Badge variant="outline" className="ml-auto">{step.time}</Badge>
                            <Badge variant="outline">{step.duration}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{step.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Requirement Data */}
          <TabsContent value="requirement">
            {requirement && (
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle>甲方需求单解析结果</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">活动主题</p>
                      <p className="font-medium mt-1">{requirement.theme || '-'}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">活动日期</p>
                      <p className="font-medium mt-1">{requirement.date || '-'}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">活动地点</p>
                      <p className="font-medium mt-1">{requirement.location || '-'}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">时间段</p>
                      <p className="font-medium mt-1">{requirement.timeRange || '-'}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">活动档位</p>
                      <p className="font-medium mt-1">{requirement.package}</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">活动天数</p>
                      <p className="font-medium mt-1">{requirement.days}天</p>
                    </div>
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <p className="text-sm text-muted-foreground">每天宠物数</p>
                      <p className="font-medium mt-1">{requirement.petsPerDay}只</p>
                    </div>
                    <div className="p-4 bg-[oklch(0.98_0.04_95)] rounded-lg">
                      <p className="text-sm text-muted-foreground">选择活动</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {requirement.selectedActivities.map((act, idx) => (
                          <Badge key={idx} className="bg-[oklch(0.9_0.18_95)]">{act}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}
      
      {/* Tips */}
      <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
        <Sparkles className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
        <AlertDescription>
          <strong>提示：</strong>上传报价单后，系统会自动生成物料清单和岗位配置。上传流程单后，宣传文案会自动生成。
        </AlertDescription>
      </Alert>
    </div>
  )
}
