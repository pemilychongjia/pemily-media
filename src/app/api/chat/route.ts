import { NextRequest, NextResponse } from 'next/server'
import ZAI from 'z-ai-web-dev-sdk'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { message, context } = body

    if (!message) {
      return NextResponse.json({ error: '消息不能为空' }, { status: 400 })
    }

    const zai = await ZAI.create()

    const systemPrompt = `你是一个专业的宠物活动策划助手，具有以下能力：
1. 活动策划和执行建议
2. 项目管理咨询
3. 人员调配和物料管理
4. 活动流程优化
5. 风险预警和应急预案

请以专业、友好、简洁的方式回答问题。`

    const completion = await zai.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        ...(context || []).map((msg: { role: string; content: string }) => ({
          role: msg.role,
          content: msg.content
        })),
        {
          role: 'user',
          content: message
        }
      ],
      temperature: 0.7
    })

    const responseMessage = completion.choices[0]?.message?.content || '抱歉，我无法处理您的请求。'

    return NextResponse.json({ 
      success: true, 
      message: responseMessage 
    })
  } catch (error) {
    console.error('对话错误:', error)
    return NextResponse.json(
      { error: '对话失败，请稍后重试' },
      { status: 500 }
    )
  }
}
