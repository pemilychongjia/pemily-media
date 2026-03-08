import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, context, data } = body

    if (!type) {
      return NextResponse.json({ error: '生成类型不能为空' }, { status: 400 })
    }

    const zai = await ZAI.create()

    let prompt = ''
    
    if (type === 'materials') {
      prompt = `基于以下项目信息，生成进场物料清单：
      
${context || '宠物活动项目'}

请以JSON格式返回物料清单（不要添加任何其他文字说明）：
{
  "items": [
    {"id": 1, "name": "物料名称", "specification": "规格", "quantity": "数量", "unit": "单位", "supplier": "供应商", "notes": "备注"}
  ],
  "categories": ["分类列表"],
  "totalItems": "总项目数"
}`
    } else if (type === 'personnel') {
      prompt = `基于以下项目信息，生成人员分工表：
      
${context || '宠物活动项目'}

请以JSON格式返回人员分工表（不要添加任何其他文字说明）：
{
  "staff": [
    {"id": 1, "name": "姓名", "role": "岗位", "department": "部门", "responsibilities": "职责", "contact": "联系方式", "workTime": "工作时间"}
  ],
  "departments": ["部门列表"],
  "totalStaff": "总人数"
}`
    } else if (type === 'salary') {
      prompt = `基于以下项目信息，生成人员工资表：
      
${context || '宠物活动项目'}

请以JSON格式返回人员工资表（不要添加任何其他文字说明）：
{
  "salaries": [
    {"id": 1, "name": "姓名", "role": "岗位", "dailyWage": "日薪", "workDays": "工作天数", "overtimePay": "加班费", "bonus": "奖金", "deduction": "扣款", "totalSalary": "实发工资", "bankAccount": "银行账号"}
  ],
  "totalAmount": "工资总额",
  "paymentDate": "发放日期"
}`
    } else if (type === 'acceptance-ppt') {
      prompt = `基于以下项目信息，生成活动验收PPT大纲：
      
${context || '宠物活动项目'}

请以JSON格式返回PPT大纲（不要添加任何其他文字说明）：
{
  "title": "PPT标题",
  "slides": [
    {"pageNumber": 1, "title": "页面标题", "content": ["内容要点"], "images": ["建议配图描述"]}
  ],
  "summary": "总结"
}`
    } else if (type === 'review-ppt') {
      prompt = `基于以下项目信息，生成复盘报告PPT大纲：
      
${context || '宠物活动项目'}

请以JSON格式返回PPT大纲（不要添加任何其他文字说明）：
{
  "title": "PPT标题",
  "slides": [
    {"pageNumber": 1, "title": "页面标题", "content": ["内容要点"], "images": ["建议配图描述"]}
  ],
  "summary": "总结",
  "improvements": ["改进建议"]
}`
    } else if (type === 'promotion_copy') {
      // 宣传文案生成
      const { theme, date, location, timeRange, selectedActivities, flow } = data || {}
      
      // 获取当前季节和假日
      const now = new Date()
      const month = now.getMonth() + 1
      let season = ''
      let holiday = ''
      
      if (month >= 3 && month <= 5) season = '春暖花开的季节'
      else if (month >= 6 && month <= 8) season = '炎炎夏日'
      else if (month >= 9 && month <= 11) season = '秋高气爽的时节'
      else season = '冬日暖阳'
      
      // 判断临近假日
      const day = now.getDate()
      if (month === 1 && day <= 15) holiday = '新年伊始'
      else if (month === 2 && day >= 10 && day <= 20) holiday = '情人节期间'
      else if (month === 5 && day >= 1 && day <= 5) holiday = '五一假期'
      else if (month === 10 && day >= 1 && day <= 7) holiday = '国庆假期'
      
      // 提取增值活动亮点
      const highlights = flow?.filter((s: { type: string }) => s.type === 'premium').map((s: { name: string }) => s.name) || []
      const allFlowSteps = flow?.map((s: { name: string, description: string }) => `${s.name}：${s.description || ''}`) || []
      
      prompt = `你是一个专业的宠物活动文案策划师，擅长撰写吸引人的宣传文案。请根据以下活动信息，分别生成小红书文案和社群文案。

【活动信息】
- 活动主题：${theme || '宠物活动'}
- 活动日期：${date || '待定'}
- 活动地点：${location || '待定'}
- 活动时间：${timeRange || '待定'}
- 增值活动亮点：${highlights?.join('、') || '精彩互动'}
- 活动流程：${allFlowSteps?.join('；') || '丰富活动'}
- 当前季节：${season}
${holiday ? `- 临近假日：${holiday}` : ''}

【小红书文案要求】
1. 只需要重点介绍增值活动亮点（${highlights?.join('、') || '精彩活动'}），不需要介绍常规环节
2. 结合当前季节节点「${season}」${holiday ? `和「${holiday}」` : ''}，营造氛围感
3. 写得有趣生动，符合小红书种草分享风格
4. 使用emoji增加趣味性
5. 使用吸引人的标题
6. **绝对不要使用任何序号（1. 2. 3. 或 一、二、三等都不要）**
7. 用自然的段落或符号分隔内容
8. 突出活动的独特体验和情感价值

【社群文案要求】
1. 写清楚活动流程（不包含具体时间）
2. 写清楚活动福利
3. **绝对不要使用任何序号（1. 2. 3. 或 一、二、三等都不要）**
4. **不要写每个环节的具体时间（如30分钟、1小时等）**
5. 用自然的段落分隔内容
6. 简洁明了，适合群发通知
7. 包含报名方式引导

请以JSON格式返回（不要添加任何其他文字说明）：
{
  "xiaohongshu": "小红书文案内容（包含emoji，无序号，只有增值活动亮点）...",
  "community": "社群文案内容（流程+福利，无序号，无具体时间）..."
}`
    } else {
      prompt = `请根据以下内容生成相关数据：\n${context || ''}`
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的活动策划助手，擅长生成各类活动相关文档和表格。请只返回JSON格式的数据，不要添加任何其他说明文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    
    try {
      const jsonResponse = JSON.parse(responseText)
      return NextResponse.json({ success: true, data: jsonResponse })
    } catch {
      return NextResponse.json({ success: true, data: { rawText: responseText } })
    }
  } catch (error) {
    console.error('生成错误:', error)
    return NextResponse.json(
      { error: '生成失败，请稍后重试' },
      { status: 500 }
    )
  }
}
