import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { content, type } = body

    if (!content) {
      return NextResponse.json({ error: '内容不能为空' }, { status: 400 })
    }

    const zai = await ZAI.create()

    let prompt = ''
    if (type === 'quotation') {
      prompt = `你是一个专业的活动策划分析师。请分析以下报价单内容，提取关键信息并以JSON格式返回：
      
内容：
${content}

请返回以下格式的JSON（不要添加任何其他文字说明）：
{
  "projectName": "项目名称",
  "totalAmount": "总金额",
  "items": [
    {"name": "项目名称", "quantity": "数量", "unitPrice": "单价", "amount": "金额"}
  ],
  "keyDates": ["关键日期"],
  "requirements": ["主要需求"]
}`
    } else if (type === 'requirement') {
      prompt = `你是一个专业的活动策划分析师。请分析以下甲方需求单内容，提取关键信息并以JSON格式返回：
      
内容：
${content}

请返回以下格式的JSON（不要添加任何其他文字说明）：
{
  "projectName": "项目名称",
  "clientName": "客户名称",
  "eventDate": "活动日期",
  "location": "活动地点",
  "participantCount": "预计参与人数",
  "mainRequirements": ["主要需求列表"],
  "specialRequests": ["特殊要求"],
  "budget": "预算范围"
}`
    } else if (type === 'schedule') {
      prompt = `你是一个专业的活动策划分析师。请分析以下活动流程单内容，提取关键信息并以JSON格式返回：
      
内容：
${content}

请返回以下格式的JSON（不要添加任何其他文字说明）：
{
  "projectName": "项目名称",
  "eventDate": "活动日期",
  "timeline": [
    {"time": "时间", "activity": "活动内容", "responsible": "负责人", "notes": "备注"}
  ],
  "keyPoints": ["关键要点"],
  "resources": ["所需资源"],
  "staffing": ["人员需求"]
}`
    } else {
      prompt = `请分析以下文档内容，提取关键信息并以JSON格式返回：
      
内容：
${content}

请返回提取的关键信息（不要添加任何其他文字说明）。`
    }

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: '你是一个专业的文档分析助手，擅长提取结构化信息。请只返回JSON格式的数据，不要添加任何其他说明文字。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3
    })

    const responseText = completion.choices[0]?.message?.content || '{}'
    
    // 尝试解析JSON，如果失败则返回原始文本
    try {
      const jsonResponse = JSON.parse(responseText)
      return NextResponse.json({ success: true, data: jsonResponse })
    } catch {
      return NextResponse.json({ success: true, data: { rawText: responseText } })
    }
  } catch (error) {
    console.error('分析错误:', error)
    return NextResponse.json(
      { error: '分析失败，请稍后重试' },
      { status: 500 }
    )
  }
}
