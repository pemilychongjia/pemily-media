'use client'

import { useState, useEffect } from 'react'
import { 
  Package, 
  CheckCircle, 
  Clock,
  Search,
  PackageCheck,
  PackageX,
  FileText,
  Download,
  RefreshCcw,
  AlertCircle,
  ArrowRight
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { useActivityStore } from '@/store/activity-store'
import type { MaterialItem, FeeItem } from '@/types/activity'

// 核对记录
interface CheckRecord {
  materialId: string
  materialName: string
  checkedQuantity: number
  checker: string
  checkTime: string
  notes: string
}

// 从报价单生成物料清单 - 改进版，更通用化处理
function generateMaterialsFromQuotation(quotation: {
  basicFees: FeeItem[]
  activityFees: FeeItem[]
}): MaterialItem[] {
  const materials: MaterialItem[] = []
  
  // 智能识别物料类别
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
  
  // 智能识别负责人
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
  
  // 智能识别存放位置
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
  
  // 处理基础费用
  quotation.basicFees.forEach((fee) => {
    order++
    materials.push({
      id: `mat_${order}_${Date.now()}`,
      activityId: '',
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
  
  // 处理活动内容费用
  quotation.activityFees.forEach((fee) => {
    order++
    materials.push({
      id: `mat_${order}_${Date.now()}`,
      activityId: '',
      name: fee.name,
      specification: fee.specification,
      quantity: fee.quantity,
      unit: fee.unit,
      supplier: '',
      location: getLocation(fee.name),
      category: getCategory(fee.name),
      responsible: getResponsible(fee.name),
      checked: false,
      checkTime: '',
      checker: '',
      notes: fee.specification || ''
    })
  })
  
  return materials
}

export default function MaterialManager() {
  const { 
    currentActivityId, 
    activities, 
    setMaterials 
  } = useActivityStore()
  
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const quotation = currentActivity?.quotation
  const materials = currentActivity?.materials || []
  
  const [searchTerm, setSearchTerm] = useState('')
  const [checkRecords, setCheckRecords] = useState<CheckRecord[]>([])
  const [isCheckDialogOpen, setIsCheckDialogOpen] = useState(false)
  const [currentMaterial, setCurrentMaterial] = useState<MaterialItem | null>(null)
  const [checkerName, setCheckerName] = useState('')
  const [checkNotes, setCheckNotes] = useState('')
  const [checkQuantity, setCheckQuantity] = useState('')
  
  // 检查报价单是否有有效数据
  const hasQuotationData = quotation && 
    (quotation.basicFees?.length > 0 || quotation.activityFees?.length > 0)
  
  // 当报价单变化时自动生成物料清单
  useEffect(() => {
    if (hasQuotationData && currentActivityId && materials.length === 0) {
      const generatedMaterials = generateMaterialsFromQuotation(quotation)
      if (generatedMaterials.length > 0) {
        setMaterials(currentActivityId, generatedMaterials)
        toast({
          title: '物料清单已生成',
          description: `已根据报价单生成 ${generatedMaterials.length} 项物料`
        })
      }
    }
  }, [hasQuotationData, currentActivityId, materials.length, setMaterials, quotation])
  
  // 统计
  const totalMaterials = materials.length
  const checkedMaterials = materials.filter(m => m.checked).length
  const checkProgress = totalMaterials > 0 ? Math.round((checkedMaterials / totalMaterials) * 100) : 0
  
  // 筛选
  const filteredMaterials = materials.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  )
  
  // 打开核对对话框
  const openCheckDialog = (material: MaterialItem) => {
    setCurrentMaterial(material)
    setCheckQuantity(material.quantity.toString())
    setCheckerName('')
    setCheckNotes('')
    setIsCheckDialogOpen(true)
  }
  
  // 确认核对
  const handleConfirmCheck = () => {
    if (!currentMaterial || !checkerName || !currentActivityId) {
      toast({
        title: '请填写核对人员姓名',
        variant: 'destructive'
      })
      return
    }
    
    const now = new Date().toLocaleString('zh-CN')
    
    // 更新物料状态
    const updatedMaterials = materials.map(m => 
      m.id === currentMaterial.id 
        ? { ...m, checked: true, checkTime: now, checker: checkerName, notes: checkNotes }
        : m
    )
    setMaterials(currentActivityId, updatedMaterials)
    
    // 添加核对记录
    const record: CheckRecord = {
      materialId: currentMaterial.id,
      materialName: currentMaterial.name,
      checkedQuantity: parseInt(checkQuantity),
      checker: checkerName,
      checkTime: now,
      notes: checkNotes
    }
    setCheckRecords(prev => [record, ...prev])
    
    setIsCheckDialogOpen(false)
    toast({
      title: '核对完成',
      description: `${currentMaterial.name} 已确认出库`,
    })
  }
  
  // 批量核对
  const handleBatchCheck = () => {
    if (!currentActivityId) return
    
    const now = new Date().toLocaleString('zh-CN')
    const checker = '项目负责人'
    
    const updatedMaterials = materials.map(m => ({
      ...m,
      checked: true,
      checkTime: now,
      checker: checker
    }))
    setMaterials(currentActivityId, updatedMaterials)
    
    toast({
      title: '批量核对完成',
      description: `已确认 ${totalMaterials} 项物料出库`,
    })
  }
  
  // 重置核对 - 根据报价单重新生成
  const handleReset = () => {
    if (!quotation || !currentActivityId) {
      toast({
        title: '请先上传报价单',
        variant: 'destructive'
      })
      return
    }
    
    const generatedMaterials = generateMaterialsFromQuotation(quotation)
    setMaterials(currentActivityId, generatedMaterials)
    setCheckRecords([])
    toast({
      title: '已重置',
      description: '物料清单已根据报价单重新生成',
    })
  }
  
  // 导出核对记录
  const exportRecords = () => {
    const csvContent = [
      '序号,物料名称,规格,数量,单位,类别,存放位置,负责人,核对状态,核对时间,核对人员,备注',
      ...materials.map((m, i) => 
        `${i+1},${m.name},${m.specification},${m.quantity},${m.unit},${m.category},${m.location},${m.responsible},${m.checked ? '已核对' : '待核对'},${m.checkTime || '-'},${m.checker || '-'},${m.notes || '-'}`
      )
    ].join('\n')
    
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `进场物料核对表_${new Date().toLocaleDateString('zh-CN')}.csv`
    a.click()
    URL.revokeObjectURL(url)
    
    toast({
      title: '导出成功',
      description: '物料核对表已下载',
    })
  }
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先选择活动</p>
      </div>
    )
  }
  
  // 检查是否有报价单数据
  if (!hasQuotationData) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <AlertCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先在「项目材料」上传报价单</p>
        <p className="text-sm mt-2">上传报价单后，系统将自动生成物料清单</p>
      </div>
    )
  }
  
  // 如果有报价单但没有物料，提示用户点击重置生成
  const expectedMaterialCount = (quotation?.basicFees?.length || 0) + (quotation?.activityFees?.length || 0)
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">进场物料核对</h1>
        <p className="text-muted-foreground">根据报价单自动生成物料清单，核对确认后进入人员分工</p>
      </div>
      
      {/* 数据来源提示 */}
      {totalMaterials === 0 ? (
        <Alert className="bg-[oklch(0.95_0.05_50)] border-[oklch(0.75_0.15_50)]">
          <AlertCircle className="w-4 h-4 text-[oklch(0.7_0.15_50)]" />
          <AlertDescription className="flex items-center justify-between">
            <span>报价单已上传（{expectedMaterialCount}项），物料清单尚未生成。请点击「重置」按钮生成物料清单。</span>
            <Button size="sm" onClick={handleReset} className="bg-[oklch(0.75_0.15_50)] hover:bg-[oklch(0.7_0.13_50)]">
              <RefreshCcw className="w-4 h-4 mr-2" />
              生成物料清单
            </Button>
          </AlertDescription>
        </Alert>
      ) : totalMaterials !== expectedMaterialCount ? (
        <Alert className="bg-[oklch(0.95_0.05_50)] border-[oklch(0.75_0.15_50)]">
          <AlertCircle className="w-4 h-4 text-[oklch(0.7_0.15_50)]" />
          <AlertDescription>
            报价单有 {expectedMaterialCount} 项，当前物料清单有 {totalMaterials} 项。如需同步，请点击「重置」重新生成。
          </AlertDescription>
        </Alert>
      ) : (
        <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
          <FileText className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
          <AlertDescription>
            物料清单已根据报价单自动生成，共 {totalMaterials} 项。如有变化，请点击「重置」重新生成。
          </AlertDescription>
        </Alert>
      )}
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <Package className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">物料总数</p>
                <p className="text-xl font-bold">{totalMaterials}项</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_160)] flex items-center justify-center">
                <PackageCheck className="w-5 h-5 text-[oklch(0.55_0.15_160)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">已核对</p>
                <p className="text-xl font-bold text-[oklch(0.55_0.15_160)]">{checkedMaterials}项</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.92_0.05_50)] flex items-center justify-center">
                <Clock className="w-5 h-5 text-[oklch(0.7_0.15_50)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">待核对</p>
                <p className="text-xl font-bold text-[oklch(0.6_0.12_50)]">{totalMaterials - checkedMaterials}项</p>
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
                <p className="text-sm text-muted-foreground">核对进度</p>
                <p className="text-xl font-bold">{checkProgress}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">进场物料核对进度</span>
            <span className="text-sm text-muted-foreground">{checkedMaterials}/{totalMaterials} 已核对</span>
          </div>
          <Progress value={checkProgress} className="h-3" />
        </CardContent>
      </Card>
      
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList>
          <TabsTrigger value="checklist">物料核对清单</TabsTrigger>
          <TabsTrigger value="records">核对记录</TabsTrigger>
        </TabsList>
        
        {/* 物料核对清单 */}
        <TabsContent value="checklist">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                    进场物料核对清单
                  </CardTitle>
                  <CardDescription>点击「核对确认」逐项核对出库，核对完成后进入人员分工</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索物料..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9 w-48"
                    />
                  </div>
                  <Button 
                    variant="outline" 
                    onClick={handleReset}
                    className="hover:bg-[oklch(0.92_0.05_50)]"
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" />
                    重置
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleBatchCheck}
                    className="hover:bg-[oklch(0.95_0.08_95)]"
                  >
                    批量核对
                  </Button>
                  <Button 
                    onClick={exportRecords}
                    className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    导出
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">状态</TableHead>
                      <TableHead>物料名称</TableHead>
                      <TableHead>规格</TableHead>
                      <TableHead>数量</TableHead>
                      <TableHead>类别</TableHead>
                      <TableHead>存放位置</TableHead>
                      <TableHead>负责人</TableHead>
                      <TableHead>核对信息</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredMaterials.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          暂无物料数据，请先上传报价单
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredMaterials.map((material, index) => (
                        <TableRow 
                          key={material.id}
                          className={material.checked ? 'bg-[oklch(0.98_0.04_95)]' : ''}
                        >
                          <TableCell>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                              material.checked 
                                ? 'bg-[oklch(0.9_0.18_95)]' 
                                : 'border-2 border-dashed border-gray-300'
                            }`}>
                              {material.checked ? (
                                <CheckCircle className="w-4 h-4 text-white" />
                              ) : (
                                <span className="text-xs text-gray-400">{index + 1}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="font-medium">{material.name}</TableCell>
                          <TableCell>{material.specification || '-'}</TableCell>
                          <TableCell>
                            <span className="font-bold">{material.quantity}</span>
                            <span className="text-muted-foreground ml-1">{material.unit}</span>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="border-[oklch(0.9_0.18_95)] text-[oklch(0.8_0.15_95)]">
                              {material.category}
                            </Badge>
                          </TableCell>
                          <TableCell>{material.location}</TableCell>
                          <TableCell>{material.responsible}</TableCell>
                          <TableCell>
                            {material.checked ? (
                              <div className="text-xs">
                                <p className="text-[oklch(0.9_0.18_95)] font-medium">{material.checker}</p>
                                <p className="text-muted-foreground">{material.checkTime}</p>
                              </div>
                            ) : (
                              <span className="text-muted-foreground text-sm">待核对</span>
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            {material.checked ? (
                              <Badge className="bg-[oklch(0.9_0.18_95)]">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                已核对
                              </Badge>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => openCheckDialog(material)}
                                className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
                              >
                                核对确认
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
          
          {/* 核对完成后显示下一步提示 */}
          {checkProgress === 100 && (
            <Card className="border-0 shadow-md bg-[oklch(0.95_0.04_160)] border-l-4 border-l-[oklch(0.55_0.15_160)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="w-8 h-8 text-[oklch(0.55_0.15_160)]" />
                    <div>
                      <h3 className="font-bold text-[oklch(0.35_0.12_160)]">物料核对已完成</h3>
                      <p className="text-sm text-muted-foreground">所有物料已确认出库，可以进入人员分工阶段</p>
                    </div>
                  </div>
                  <Button className="bg-[oklch(0.55_0.15_160)] hover:bg-[oklch(0.5_0.13_160)]">
                    进入人员分工
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* 核对记录 */}
        <TabsContent value="records">
          <Card className="border-0 shadow-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
                核对记录
              </CardTitle>
              <CardDescription>所有物料核对的历史记录</CardDescription>
            </CardHeader>
            <CardContent>
              {checkRecords.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground">
                  <PackageX className="w-16 h-16 mx-auto mb-4 opacity-50" />
                  <p>暂无核对记录</p>
                  <p className="text-sm mt-2">请在物料核对清单中逐项核对</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {checkRecords.map((record, index) => (
                    <div 
                      key={index}
                      className="flex items-center gap-4 p-4 rounded-lg bg-gradient-to-r from-[oklch(0.98_0.04_95)] to-transparent border-l-4 border-[oklch(0.9_0.18_95)]"
                    >
                      <div className="w-10 h-10 rounded-full bg-[oklch(0.9_0.18_95)] flex items-center justify-center">
                        <CheckCircle className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{record.materialName}</span>
                          <Badge variant="outline" className="border-[oklch(0.9_0.18_95)]">
                            {record.checkedQuantity}项
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          核对人：{record.checker} | {record.checkTime}
                        </p>
                      </div>
                      {record.notes && (
                        <div className="text-sm text-muted-foreground">
                          备注：{record.notes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* 核对对话框 */}
      <Dialog open={isCheckDialogOpen} onOpenChange={setIsCheckDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>物料核对确认</DialogTitle>
            <DialogDescription>请确认物料信息并填写核对人员姓名</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">物料名称</p>
                  <p className="font-medium">{currentMaterial?.name}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">规格</p>
                  <p className="font-medium">{currentMaterial?.specification || '-'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">应出库数量</p>
                  <p className="font-medium">{currentMaterial?.quantity} {currentMaterial?.unit}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">存放位置</p>
                  <p className="font-medium">{currentMaterial?.location}</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Label>实际出库数量 *</Label>
              <Input 
                type="number" 
                value={checkQuantity}
                onChange={(e) => setCheckQuantity(e.target.value)}
                placeholder="请输入实际出库数量"
              />
            </div>
            <div className="space-y-2">
              <Label>核对人员姓名 *</Label>
              <Input 
                value={checkerName}
                onChange={(e) => setCheckerName(e.target.value)}
                placeholder="请输入核对人员姓名"
              />
            </div>
            <div className="space-y-2">
              <Label>备注（可选）</Label>
              <Input 
                value={checkNotes}
                onChange={(e) => setCheckNotes(e.target.value)}
                placeholder="如有问题请填写备注"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCheckDialogOpen(false)}>取消</Button>
            <Button 
              onClick={handleConfirmCheck}
              className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              确认核对
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
