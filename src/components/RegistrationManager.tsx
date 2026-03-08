'use client'

import { useState, useRef, useEffect } from 'react'
import { 
  ClipboardList, 
  Upload, 
  Download, 
  SortAsc,
  FileSpreadsheet,
  Loader2,
  CheckCircle,
  AlertCircle,
  Trash2,
  Eye
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { useActivityStore } from '@/store/activity-store'
import { toast } from '@/hooks/use-toast'
import type { RegistrationEntry } from '@/types/activity'

export default function RegistrationManager() {
  const { currentActivityId, activities, updateRegistrationEntries } = useActivityStore()
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const registrationEntries = currentActivity?.registrationEntries || []
  
  const [isUploading, setIsUploading] = useState(false)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)
  const [processedEntries, setProcessedEntries] = useState<RegistrationEntry[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 拼音首字母状态
  const [petNameInitials, setPetNameInitials] = useState<Record<string, string>>({})
  const [isLoadingInitials, setIsLoadingInitials] = useState(false)
  
  // 按宠物名字升序排序的最终报名表
  const sortedEntries = [...registrationEntries].sort((a, b) => 
    a.petName.localeCompare(b.petName, 'zh-CN')
  )
  
  // 当报名数据变化时，获取拼音首字母
  useEffect(() => {
    const fetchInitials = async () => {
      if (sortedEntries.length === 0) return
      
      setIsLoadingInitials(true)
      try {
        const petNames = sortedEntries.map(entry => entry.petName)
        const response = await fetch('/api/pinyin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ names: petNames })
        })
        
        const result = await response.json()
        if (result.success && result.initials) {
          const initialsMap: Record<string, string> = {}
          sortedEntries.forEach((entry, index) => {
            initialsMap[entry.id] = result.initials[index] || entry.petName.charAt(0).toUpperCase()
          })
          setPetNameInitials(initialsMap)
        }
      } catch {
        // 如果API调用失败，使用首字符
        const initialsMap: Record<string, string> = {}
        sortedEntries.forEach(entry => {
          initialsMap[entry.id] = entry.petName.charAt(0).toUpperCase()
        })
        setPetNameInitials(initialsMap)
      } finally {
        setIsLoadingInitials(false)
      }
    }
    
    fetchInitials()
  }, [sortedEntries.length > 0]) // 只在数据条数变化时触发
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentActivityId) return
    
    setIsUploading(true)
    
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'registration')
      formData.append('activityId', currentActivityId)
      
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })
      
      const result = await response.json()
      
      if (result.success) {
        // 解析报名表数据 - 二维数组格式
        const rawData = result.data as unknown[][]
        
        if (!Array.isArray(rawData) || rawData.length < 3) {
          throw new Error('报名表格式不正确或数据为空')
        }
        
        const entries: RegistrationEntry[] = []
        
        // 检测是否为pemily小程序导出的合并表头格式
        // 特征：第一行有"活动名称"在第一列，第二行有"宠物名称"
        const firstRow = rawData[0] as unknown[]
        const secondRow = rawData[1] as unknown[]
        
        const isFirstRowHeader = String(firstRow?.[0] || '').includes('活动名称')
        const isSecondRowPetHeader = String(secondRow?.[9] || '').includes('宠物名称')
        
        // 辅助函数：检查值是否有效（非空、非undefined、非nan、非None）
        const isValidValue = (val: unknown): boolean => {
          const str = String(val || '').trim().toLowerCase()
          return str !== '' && str !== 'undefined' && str !== 'nan' && str !== 'none' && str !== 'null'
        }
        
        if (isFirstRowHeader && isSecondRowPetHeader) {
          // pemily小程序格式：合并表头，数据从第三行开始
          // 列索引映射：
          // 用户信息: 0=活动名称, 1=用户名, 2=用户手机号, 3=签到状态, 4=报名来源, 5=签到时间, 6=创建时间, 7=备注, 8=参与日期
          // 宠物信息: 9=宠物名称, 10=宠物性别, 11=绝育状态, 12=已打疫苗, 13=生日, 14=省, 15=市, 16=区, 17=种类, 18=宠物品种
          
          let currentUser = { name: '', phone: '', notes: '' }
          let orderIndex = 0
          
          for (let i = 2; i < rawData.length; i++) {
            const row = rawData[i] as unknown[]
            if (!Array.isArray(row) || row.length < 10) continue
            
            // 获取用户信息（如果有）
            const userName = String(row[1] || '').trim()
            const userPhone = String(row[2] || '').trim()
            const userNotes = String(row[7] || '').trim()
            
            // 如果有有效用户信息，更新当前用户
            if (isValidValue(userName)) {
              currentUser = { 
                name: userName, 
                phone: isValidValue(userPhone) ? userPhone : currentUser.phone, 
                notes: isValidValue(userNotes) ? userNotes : currentUser.notes 
              }
            }
            
            // 获取宠物信息
            const petName = String(row[9] || '').trim()
            
            // 跳过没有宠物名的行
            if (!isValidValue(petName)) continue
            
            orderIndex++
            
            // 解析宠物性别
            const genderValue = String(row[10] || '').toLowerCase()
            let petGender: 'male' | 'female' | 'unknown' = 'unknown'
            if (genderValue.includes('公') || genderValue === 'male' || genderValue === 'm') {
              petGender = 'male'
            } else if (genderValue.includes('母') || genderValue === 'female' || genderValue === 'f') {
              petGender = 'female'
            }
            
            // 解析疫苗接种状态
            const vaccineValue = String(row[12] || '')
            const vaccinated = vaccineValue.includes('是') || vaccineValue.toLowerCase() === 'yes'
            
            // 解析年龄（从生日计算）
            const birthDateRaw = row[13]
            let petAge = '未知'
            if (birthDateRaw && isValidValue(birthDateRaw)) {
              try {
                let birth: Date
                if (typeof birthDateRaw === 'number') {
                  // Excel日期序列号
                  birth = new Date((birthDateRaw - 25569) * 86400 * 1000)
                } else {
                  birth = new Date(String(birthDateRaw))
                }
                if (!isNaN(birth.getTime())) {
                  const now = new Date()
                  const diffMs = now.getTime() - birth.getTime()
                  const ageYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365))
                  if (ageYears > 0) {
                    petAge = `${ageYears}岁`
                  } else {
                    const ageMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
                    petAge = `${ageMonths}个月`
                  }
                }
              } catch {
                petAge = '未知'
              }
            }
            
            // 宠物品种
            const petBreed = String(row[18] || '').trim()
            const petKind = String(row[17] || '').trim()
            const petType = isValidValue(petBreed) ? petBreed : (isValidValue(petKind) ? petKind : '未知')
            
            entries.push({
              id: `reg_${Date.now()}_${orderIndex}`,
              activityId: currentActivityId,
              order: orderIndex,
              petName: petName,
              ownerName: currentUser.name,
              phone: currentUser.phone,
              petType: petType,
              petAge: petAge,
              petGender,
              vaccinated,
              notes: currentUser.notes
            })
          }
        } else {
          // 通用格式：单行表头，使用列名匹配
          // 将二维数组转换为对象数组
          const headers = rawData[0] as string[]
          const dataRows = rawData.slice(1)
          
          // 辅助函数：从行中获取指定列名的值
          const getValue = (row: unknown[], columnNames: string[]): unknown => {
            for (const name of columnNames) {
              const colIndex = headers.findIndex(h => String(h).includes(name))
              if (colIndex >= 0 && row[colIndex] !== undefined && row[colIndex] !== null && row[colIndex] !== '') {
                return row[colIndex]
              }
            }
            return ''
          }
          
          let orderIndex = 0
          for (const row of dataRows) {
            if (!Array.isArray(row)) continue
            
            const petName = String(getValue(row, ['宠物名称', '宠物名字', '宠物名', '名字'])).trim()
            if (!isValidValue(petName)) continue
            
            orderIndex++
            
            // 解析宠物性别
            const genderValue = String(getValue(row, ['宠物性别', '性别'])).toLowerCase()
            let petGender: 'male' | 'female' | 'unknown' = 'unknown'
            if (genderValue.includes('公') || genderValue === 'male' || genderValue === 'm') {
              petGender = 'male'
            } else if (genderValue.includes('母') || genderValue === 'female' || genderValue === 'f') {
              petGender = 'female'
            }
            
            // 解析疫苗接种状态
            const vaccineValue = String(getValue(row, ['已打疫苗', '是否接种疫苗', '疫苗']))
            const vaccinated = vaccineValue.includes('是') || vaccineValue.toLowerCase() === 'yes'
            
            // 解析年龄
            const birthDateRaw = getValue(row, ['生日', '出生日期'])
            let petAge = String(getValue(row, ['宠物年龄', '年龄']) || '未知')
            if ((!petAge || petAge === '未知') && birthDateRaw && isValidValue(birthDateRaw)) {
              try {
                const birth = new Date(String(birthDateRaw))
                if (!isNaN(birth.getTime())) {
                  const now = new Date()
                  const diffMs = now.getTime() - birth.getTime()
                  const ageYears = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 365))
                  if (ageYears > 0) {
                    petAge = `${ageYears}岁`
                  } else {
                    const ageMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30))
                    petAge = `${ageMonths}个月`
                  }
                }
              } catch {
                petAge = '未知'
              }
            }
            
            entries.push({
              id: `reg_${Date.now()}_${orderIndex}`,
              activityId: currentActivityId,
              order: orderIndex,
              petName: petName,
              ownerName: String(getValue(row, ['用户名', '主人姓名', '姓名', '报名人姓名', '联系人'])),
              phone: String(getValue(row, ['用户手机号', '联系电话', '电话', '手机号'])),
              petType: String(getValue(row, ['宠物品种', '品种', '种类']) || '未知'),
              petAge: petAge,
              petGender,
              vaccinated,
              notes: String(getValue(row, ['备注', '说明']) || '')
            })
          }
        }
        
        if (entries.length === 0) {
          throw new Error('未能从报名表中解析到有效数据')
        }
        
        setProcessedEntries(entries)
        setIsPreviewOpen(true)
        
        toast({
          title: '解析成功',
          description: `共解析 ${entries.length} 条报名记录`
        })
      } else {
        throw new Error(result.error || '解析失败')
      }
    } catch (error) {
      toast({
        title: '上传失败',
        description: String(error),
        variant: 'destructive'
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }
  
  const handleConfirmImport = () => {
    if (!currentActivityId || processedEntries.length === 0) return
    
    updateRegistrationEntries(currentActivityId, processedEntries)
    setIsPreviewOpen(false)
    setProcessedEntries([])
    
    toast({
      title: '导入成功',
      description: `已导入 ${processedEntries.length} 条报名记录`
    })
  }
  
  // 获取宠物名首字母（拼音a-z）
  const getPetNameInitial = (name: string): string => {
    if (!name) return ''
    
    // 获取第一个字符
    const firstChar = name.charAt(0)
    
    // 如果是英文字母，直接返回大写
    if (/[a-zA-Z]/.test(firstChar)) {
      return firstChar.toUpperCase()
    }
    
    // 如果是中文字符，先返回占位符，后续通过API获取
    // 导出时会通过API批量转换
    return firstChar
  }
  
  // 批量获取拼音首字母
  const getBatchPinyinInitials = async (names: string[]): Promise<string[]> => {
    try {
      const response = await fetch('/api/pinyin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ names })
      })
      
      const result = await response.json()
      if (result.success) {
        return result.initials
      }
      return names.map(n => n.charAt(0).toUpperCase())
    } catch {
      return names.map(n => n.charAt(0).toUpperCase())
    }
  }
  
  const handleDownload = async () => {
    if (sortedEntries.length === 0) {
      toast({ title: '暂无报名数据', variant: 'destructive' })
      return
    }
    
    try {
      // 动态导入 xlsx-js-style 库（支持样式）
      const XLSX = await import('xlsx-js-style')
      
      // 批量获取拼音首字母
      const petNames = sortedEntries.map(entry => entry.petName)
      const initials = await getBatchPinyinInitials(petNames)
      
      // 准备数据 - 新字段：宠物名首字母、宠物名字、主人姓名、宠物品种、年龄
      const headers = ['宠物名首字母', '宠物名字', '主人姓名', '宠物品种', '年龄']
      const rows = sortedEntries.map((entry, index) => [
        initials[index] || entry.petName.charAt(0).toUpperCase(),
        entry.petName,
        entry.ownerName,
        entry.petType,
        entry.petAge
      ])
      
      // 创建工作表数据
      const wsData = [headers, ...rows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      
      // 定义样式：微软雅黑字体、黑色边框
      const headerStyle = {
        font: { name: '微软雅黑', sz: 11, bold: true },
        alignment: { horizontal: 'center' as const, vertical: 'center' as const },
        border: {
          top: { style: 'thin' as const, color: { rgb: '000000' } },
          bottom: { style: 'thin' as const, color: { rgb: '000000' } },
          left: { style: 'thin' as const, color: { rgb: '000000' } },
          right: { style: 'thin' as const, color: { rgb: '000000' } }
        },
        fill: { fgColor: { rgb: 'F5F5F5' } }
      }
      
      const cellStyle = {
        font: { name: '微软雅黑', sz: 11 },
        alignment: { horizontal: 'center' as const, vertical: 'center' as const },
        border: {
          top: { style: 'thin' as const, color: { rgb: '000000' } },
          bottom: { style: 'thin' as const, color: { rgb: '000000' } },
          left: { style: 'thin' as const, color: { rgb: '000000' } },
          right: { style: 'thin' as const, color: { rgb: '000000' } }
        }
      }
      
      // 设置列宽
      ws['!cols'] = [
        { wch: 14 }, // 宠物名首字母
        { wch: 14 }, // 宠物名字
        { wch: 12 }, // 主人姓名
        { wch: 14 }, // 宠物品种
        { wch: 10 }, // 年龄
      ]
      
      // 设置行高
      ws['!rows'] = [{ hpt: 20 }] // 表头行高
      
      // 应用样式到所有单元格
      const range = XLSX.utils.decode_range(ws['!ref'] || 'A1')
      for (let R = range.s.r; R <= range.e.r; ++R) {
        for (let C = range.s.c; C <= range.e.c; ++C) {
          const cellAddress = XLSX.utils.encode_cell({ r: R, c: C })
          if (!ws[cellAddress]) continue
          
          // 表头使用特殊样式，其他单元格使用普通样式
          if (R === 0) {
            ws[cellAddress].s = headerStyle
          } else {
            ws[cellAddress].s = cellStyle
          }
        }
      }
      
      // 创建工作簿
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, '最终报名表')
      
      // 生成Excel文件
      const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
      const blob = new Blob([wbout], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
      
      // 下载文件
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `最终报名表_${currentActivity?.activity.name || '活动'}_${new Date().toLocaleDateString('zh-CN')}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
      
      toast({ title: '导出成功', description: '最终报名表已下载（微软雅黑字体、黑色边框）' })
    } catch (error) {
      console.error('导出失败:', error)
      toast({ title: '导出失败', description: '请稍后重试', variant: 'destructive' })
    }
  }
  
  const handleClearData = () => {
    if (!currentActivityId) return
    updateRegistrationEntries(currentActivityId, [])
    toast({ title: '数据已清空' })
  }
  
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
          <h1 className="text-2xl font-bold text-foreground">报名管理</h1>
          <p className="text-muted-foreground">上传原始报名表，处理后下载最终报名表（按宠物名字升序排序）</p>
        </div>
        <div className="flex gap-3">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileUpload}
          />
          <Button 
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 mr-2" />
            )}
            上传原始报名表
          </Button>
          <Button 
            onClick={handleDownload}
            disabled={sortedEntries.length === 0}
            className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
          >
            <Download className="w-4 h-4 mr-2" />
            下载最终报名表
          </Button>
        </div>
      </div>
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <ClipboardList className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">报名总数</p>
                <p className="text-xl font-bold">{sortedEntries.length}</p>
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
                <p className="text-sm text-muted-foreground">已接种疫苗</p>
                <p className="text-xl font-bold">{sortedEntries.filter(e => e.vaccinated).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[oklch(0.95_0.08_95)] flex items-center justify-center">
                <SortAsc className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">排序方式</p>
                <p className="text-xl font-bold">宠物名字升序</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Table */}
      <Card className="border-0 shadow-md">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-[oklch(0.9_0.18_95)]" />
              最终报名表
            </CardTitle>
            <CardDescription>按宠物名字升序排序</CardDescription>
          </div>
          {sortedEntries.length > 0 && (
            <Button variant="outline" size="sm" onClick={handleClearData}>
              <Trash2 className="w-4 h-4 mr-1" />
              清空数据
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {sortedEntries.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileSpreadsheet className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>暂无报名数据</p>
              <p className="text-sm mt-2">上传原始报名表后，系统自动处理并排序</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="w-16">序号</TableHead>
                      <TableHead>宠物名首字母</TableHead>
                      <TableHead>宠物名字</TableHead>
                      <TableHead>主人姓名</TableHead>
                      <TableHead>宠物品种</TableHead>
                      <TableHead>年龄</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedEntries.map((entry, index) => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium">{index + 1}</TableCell>
                        <TableCell className="font-medium text-[oklch(0.8_0.15_95)]">
                          {isLoadingInitials ? '...' : (petNameInitials[entry.id] || entry.petName.charAt(0).toUpperCase())}
                        </TableCell>
                        <TableCell className="font-medium text-[oklch(0.8_0.15_95)]">{entry.petName}</TableCell>
                        <TableCell>{entry.ownerName}</TableCell>
                        <TableCell>{entry.petType}</TableCell>
                        <TableCell>{entry.petAge}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
      
      {/* 说明 */}
      <Card className="border-0 shadow-md bg-[oklch(0.98_0.04_95)]">
        <CardContent className="p-4">
          <h4 className="font-medium mb-2">使用说明</h4>
          <ol className="list-decimal list-inside text-sm text-muted-foreground space-y-1">
            <li>从小程序下载原始报名表</li>
            <li>点击"上传原始报名表"按钮上传Excel文件</li>
            <li>系统自动解析并按宠物名字升序排序</li>
            <li>点击"下载最终报名表"导出处理后的数据</li>
          </ol>
        </CardContent>
      </Card>
      
      {/* 预览对话框 */}
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>报名表预览</DialogTitle>
            <DialogDescription>
              共解析 {processedEntries.length} 条记录，确认后将导入系统
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="rounded-lg border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>宠物名字</TableHead>
                    <TableHead>主人姓名</TableHead>
                    <TableHead>联系电话</TableHead>
                    <TableHead>宠物品种</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedEntries.slice(0, 20).map((entry, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{entry.petName}</TableCell>
                      <TableCell>{entry.ownerName}</TableCell>
                      <TableCell>{entry.phone}</TableCell>
                      <TableCell>{entry.petType}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {processedEntries.length > 20 && (
                <div className="p-4 text-center text-muted-foreground text-sm">
                  还有 {processedEntries.length - 20} 条记录未显示...
                </div>
              )}
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewOpen(false)}>取消</Button>
            <Button onClick={handleConfirmImport} className="bg-[oklch(0.9_0.18_95)]">
              <CheckCircle className="w-4 h-4 mr-2" />
              确认导入
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
