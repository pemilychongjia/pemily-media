import { NextRequest, NextResponse } from 'next/server'
import { pinyin } from 'pinyin-pro'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    // 支持单个文本和批量处理
    let texts: string[] = []
    if (body.text) {
      texts = [body.text]
    } else if (body.names && Array.isArray(body.names)) {
      texts = body.names
    } else {
      return NextResponse.json({ success: false, error: '缺少文本参数' }, { status: 400 })
    }
    
    const initials: string[] = texts.map(text => {
      if (!text || typeof text !== 'string') return ''
      
      // 获取第一个字符
      const firstChar = text.charAt(0)
      
      // 如果是英文字母，直接返回大写
      if (/[a-zA-Z]/.test(firstChar)) {
        return firstChar.toUpperCase()
      }
      
      // 如果是中文字符，获取拼音首字母
      try {
        const py = pinyin(firstChar, { pattern: 'first', toneType: 'none' })
        return py.toUpperCase()
      } catch {
        return firstChar.toUpperCase()
      }
    })
    
    // 如果是单个请求，返回单个结果
    if (body.text) {
      return NextResponse.json({ success: true, initial: initials[0] })
    }
    
    return NextResponse.json({ success: true, initials })
    
  } catch (error) {
    console.error('拼音转换错误:', error)
    return NextResponse.json({ success: false, error: '拼音转换失败' }, { status: 500 })
  }
}
