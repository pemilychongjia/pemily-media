import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import type { RequirementData, QuotationData, FlowData, FeeItem, FlowStep, PersonnelFromQuotation } from '@/types/activity'

// 解析甲方需求单 - 改进版，提取每天时间段
function parseRequirement(sheet: XLSX.WorkSheet): RequirementData {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
  
  const result: RequirementData = {
    theme: '',
    date: '',
    location: '',
    timeRange: '',
    dailyTimeRanges: [],
    package: '基础档',
    days: 1,
    petsPerDay: 20,
    selectedActivities: []
  }
  
  const selectedActivities: string[] = []
  const dailyTimeRanges: string[] = []
  
  // 辅助函数：检查字符串是否是时间格式
  const isTimeFormat = (str: string): boolean => {
    // 匹配 "17:00-20:30"、"17：00-20：30"、"17:00~20:30" 等格式
    return /\d{1,2}[:：]\d{2}\s*[-~至]\s*\d{1,2}[:：]\d{2}/.test(str)
  }
  
  // 遍历查找关键字段
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length < 2) continue
    
    const label = String(row[0] || '').toString().trim()
    const value = String(row[1] || '').toString().trim()
    const col2 = String(row[2] || '').toString().trim()
    const col3 = String(row[3] || '').toString().trim()
    const col4 = String(row[4] || '').toString().trim()
    
    // 解析基本信息
    if (label.includes('活动主题') || label === '活动主题：') {
      result.theme = value
    } else if (label.includes('活动开始日期') || label === '活动开始日期') {
      if (value && value !== 'NaN') {
        // 处理日期格式
        if (typeof row[1] === 'number') {
          const date = XLSX.SSF.parse_date_code(row[1] as number)
          result.date = `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`
        } else {
          result.date = value.split(' ')[0] // 去掉时间部分
        }
      }
    } else if (label.includes('活动地点') || label === '活动地点：') {
      result.location = value
    } else if (label.includes('活动每天时间段') || label === '活动每天时间段：') {
      // 格式1: label 为 '活动每天时间段：'，value 为时间值
      const timeValue = col3 || value
      if (timeValue) {
        result.timeRange = timeValue
        dailyTimeRanges.push(timeValue)
      }
    } else if (label.includes('活动档位') || label === '活动档位：') {
      result.package = value || '基础档'
    } else if (label.includes('活动天数') || label === '活动天数：') {
      result.days = parseInt(value) || 1
    } else if (label.includes('每天宠物数') || label === '每天宠物数：') {
      result.petsPerDay = parseInt(value) || 20
    }
    
    // 特殊处理：col2 包含 "活动每天时间段" 或 "时间段"，时间值在 col3
    // 例如: ['活动地点：', '亲橙park户外广场', '活动每天时间段：', '17：00-20：30']
    if (col2.includes('时间段') || col2.includes('活动每天时间段')) {
      if (col3 && isTimeFormat(col3)) {
        result.timeRange = col3
        if (!dailyTimeRanges.includes(col3)) {
          dailyTimeRanges.push(col3)
        }
      }
    }
    
    // 检查所有单元格是否有时间格式的值
    for (let j = 0; j < row.length; j++) {
      const cellValue = String(row[j] || '').toString().trim()
      const nextCellValue = String(row[j + 1] || '').toString().trim()
      
      // 如果当前单元格包含"时间段"标签，下一个单元格是时间值
      if ((cellValue.includes('时间段') || cellValue.includes('时间')) && nextCellValue && isTimeFormat(nextCellValue)) {
        result.timeRange = nextCellValue
        if (!dailyTimeRanges.includes(nextCellValue)) {
          dailyTimeRanges.push(nextCellValue)
        }
      }
    }
    
    // 继续检查后续行中的时间段信息
    if (col2 && col3 && (col2.includes('第') && col2.includes('天'))) {
      // 格式: 第X天 | 时间段
      dailyTimeRanges.push(col3)
    }
    
    // 解析勾选的活动项目 - 检查第三列是否有√
    if (col2 === '√' || col2 === '✓' || col2 === '✅') {
      selectedActivities.push(value)
    }
    
    // 另一种格式：活动名称在第二列，勾选在第三列
    if (value && !label && (col2 === '√' || col2 === '✓' || col2 === '✅')) {
      selectedActivities.push(value)
    }
  }
  
  // 如果没有提取到时间段列表，尝试从timeRange解析
  if (dailyTimeRanges.length === 0 && result.timeRange) {
    dailyTimeRanges.push(result.timeRange)
  }
  
  result.selectedActivities = selectedActivities
  result.dailyTimeRanges = dailyTimeRanges
  
  return result
}

// 解析报价单 - 改进版，提取人员信息
function parseQuotation(workbook: XLSX.WorkBook): QuotationData {
  const result: QuotationData = {
    basicFees: [],
    activityFees: [],
    personnel: [],
    summary: {
      basicTotal: 0,
      activityTotal: 0,
      tax: 0,
      grandTotal: 0
    }
  }
  
  // 人员关键词列表
  const personnelKeywords = ['现场执行人员', '执行人员', '活动主持人', '主持人', '老师', 'DIY老师', '簪花老师', '义诊医生', '摄影师', '安全员']
  
  // 遍历所有sheet
  for (const sheetName of workbook.SheetNames) {
    const sheet = workbook.Sheets[sheetName]
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
    
    let currentCategory: 'basic' | 'activity' = 'basic'
    let isInSection = false
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i]
      if (!Array.isArray(row) || row.length < 1) continue
      
      const firstCol = String(row[0] || '').toString().trim()
      const specification = String(row[2] || '').toString().trim() // C列：规格/内容
      
      // 跳过空行
      if (!firstCol) continue
      
      // 先检测汇总行（必须在分类标题检测之前，避免"基础费用小计"匹配"基础费用"）
      if (firstCol.includes('基础费用小计') || firstCol.includes('基础费用合计') || firstCol === '基础费用小计：') {
        const val = row[row.length - 1] || row[1]
        result.summary.basicTotal = parseFloat(String(val).replace(/[^\d.]/g, '')) || 0
        continue
      } else if (firstCol.includes('增值服务小计') || firstCol.includes('活动内容合计') || firstCol.includes('活动内容小计') || firstCol === '增值服务小计：') {
        const val = row[row.length - 1] || row[1]
        result.summary.activityTotal = parseFloat(String(val).replace(/[^\d.]/g, '')) || 0
        continue
      } else if (firstCol.includes('税费')) {
        const val = row[row.length - 1] || row[1]
        result.summary.tax = parseFloat(String(val).replace(/[^\d.]/g, '')) || 0
        continue
      } else if (firstCol === '总计：' || firstCol === '总计' || firstCol.includes('总计')) {
        const val = row[row.length - 1] || row[1]
        result.summary.grandTotal = parseFloat(String(val).replace(/[^\d.]/g, '')) || 0
        continue
      }
      
      // 检测分类标题 - 支持多种格式
      // 格式1: "一、基础费用" 格式2: "基础费用" 格式3: "一.基础费用"
      if (/^一[、.．\s]+基础费用/.test(firstCol) || firstCol === '一、基础费用' || firstCol === '基础费用') {
        currentCategory = 'basic'
        isInSection = true
        continue
      } else if (/^二[、.．\s]+活动内容/.test(firstCol) || /^二[、.．\s]+增值服务/.test(firstCol) || firstCol === '二、活动内容' || firstCol === '二、增值服务' || firstCol === '活动内容' || firstCol === '增值服务') {
        currentCategory = 'activity'
        isInSection = true
        continue
      } else if (/^三[、.．\s]+费用汇总/.test(firstCol) || firstCol === '三、费用汇总' || firstCol === '费用汇总') {
        isInSection = false
        continue
      }
      
      // 解析费用明细行 - 跳过标题行和非数字行
      if (firstCol === '序号' || firstCol.includes('报价日期') || firstCol.includes('宠物活动') || firstCol.includes('报价明细表')) {
        continue
      }
      
      // 确保是数字序号开头（支持整数和小数）
      const seqNum = parseFloat(firstCol)
      if (!isNaN(seqNum) && seqNum > 0 && isInSection) {
        const itemName = String(row[1] || '').toString().trim()
        const item: FeeItem = {
          id: `fee_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
          name: itemName,
          specification: specification,
          unit: String(row[3] || '').toString().trim() || '项',
          quantity: parseFloat(String(row[4] || '1')) || 1,
          unitPrice: parseFloat(String(row[5] || '0')) || 0,
          days: parseFloat(String(row[6] || '1')) || 1,
          total: parseFloat(String(row[7] || '0')) || 0,
          category: currentCategory
        }
        
        if (item.name) {
          if (currentCategory === 'basic') {
            result.basicFees.push(item)
          } else if (currentCategory === 'activity') {
            result.activityFees.push(item)
          }
        }
        
        // 检查是否包含人员关键词 - 从项目名称或规格/内容中提取
        for (const keyword of personnelKeywords) {
          if (specification.includes(keyword) || itemName.includes(keyword)) {
            // 人数优先从"数量"列获取（E列，index 4），其次从字符串中匹配
            let count = item.quantity // 默认使用数量列的值
            
            // 如果规格中明确有"X人"格式，使用规格中的数字
            const countMatch = specification.match(/(\d+)\s*人/) || itemName.match(/(\d+)\s*人/)
            if (countMatch && parseInt(countMatch[1]) > 0) {
              count = parseInt(countMatch[1])
            }
            
            // 确定人员名称：优先使用规格内容，其次使用关键词
            const personName = specification && specification.length > 0 ? specification : keyword
            
            result.personnel.push({
              name: personName,
              count: count,
              specification: specification
            })
            break
          }
        }
      }
    }
  }
  
  return result
}

// 解析流程单 - 改进版
function parseFlow(sheet: XLSX.WorkSheet): FlowData {
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
  
  const steps: FlowStep[] = []
  let order = 0
  
  for (let i = 0; i < data.length; i++) {
    const row = data[i]
    if (!Array.isArray(row) || row.length < 3) continue
    
    const firstCol = String(row[0] || '').toString().trim()
    
    // 跳过标题行
    if (firstCol.includes('序号') || firstCol.includes('环节') || firstCol === '') {
      continue
    }
    
    // 解析流程环节
    // 格式：序号、时间、环节名称、时长、说明、类型
    const seqNum = parseInt(firstCol)
    if (!isNaN(seqNum) && seqNum > 0) {
      order++
      const step: FlowStep = {
        id: `step_${Date.now()}_${order}`,
        order,
        time: String(row[1] || '').toString().trim(),
        name: String(row[2] || '').toString().trim(),
        duration: String(row[3] || '').toString().trim(),
        description: String(row[4] || '').toString().trim(),
        type: String(row[5] || '').includes('增值') ? 'premium' : 'standard'
      }
      if (step.name) {
        steps.push(step)
      }
    }
  }
  
  return { steps }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const type = formData.get('type') as string // 'quotation' | 'requirement' | 'flow' | 'registration'
    const activityId = formData.get('activityId') as string
    
    if (!file || !type || !activityId) {
      return NextResponse.json(
        { success: false, error: '缺少必要参数' },
        { status: 400 }
      )
    }
    
    // 读取文件内容
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // 解析Excel文件
    const workbook = XLSX.read(buffer, { type: 'buffer' })
    
    let parsedData: unknown = null
    
    switch (type) {
      case 'requirement': {
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        parsedData = parseRequirement(sheet)
        break
      }
      case 'quotation': {
        parsedData = parseQuotation(workbook)
        break
      }
      case 'flow': {
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        parsedData = parseFlow(sheet)
        break
      }
      case 'registration': {
        // 报名表解析 - 返回原始二维数组数据供前端处理
        const sheet = workbook.Sheets[workbook.SheetNames[0]]
        // 使用 header: 1 获取原始二维数组，保留所有行的原始数据
        const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1 }) as unknown[][]
        parsedData = rawData
        break
      }
      default:
        return NextResponse.json(
          { success: false, error: '不支持的文件类型' },
          { status: 400 }
        )
    }
    
    return NextResponse.json({
      success: true,
      data: parsedData,
      fileName: file.name,
      activityId
    })
    
  } catch (error) {
    console.error('文件解析错误:', error)
    return NextResponse.json(
      { success: false, error: '文件解析失败，请检查文件格式' },
      { status: 500 }
    )
  }
}
