import { NextRequest, NextResponse } from 'next/server'

// 模拟存储确认记录（实际项目中应使用数据库）
// 使用全局变量存储，确保数据持久性
globalThis.confirmationRecords = globalThis.confirmationRecords || {}

// 获取确认记录
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const staffId = searchParams.get('staffId')
  
  const records = globalThis.confirmationRecords as Record<string, unknown>
  
  if (staffId) {
    const record = records[staffId]
    return NextResponse.json({ 
      success: true, 
      confirmed: !!record,
      record: record || null
    })
  }
  
  return NextResponse.json({ 
    success: true, 
    records: records
  })
}

// 提交确认
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { staffId, staffName, staffRole, confirmerName, confirmerPhone } = body

    if (!staffId || !confirmerName || !confirmerPhone) {
      return NextResponse.json({ 
        error: '请填写完整信息' 
      }, { status: 400 })
    }

    // 验证手机号格式
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(confirmerPhone)) {
      return NextResponse.json({ 
        error: '请输入正确的手机号' 
      }, { status: 400 })
    }

    // 获取IP地址
    const forwarded = request.headers.get('x-forwarded-for')
    const ipAddress = forwarded ? forwarded.split(',')[0] : 'unknown'

    const record = {
      staffId,
      staffName,
      staffRole,
      confirmerName,
      confirmerPhone: confirmerPhone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2'), // 脱敏处理
      confirmedAt: new Date().toLocaleString('zh-CN'),
      ipAddress
    }

    globalThis.confirmationRecords = globalThis.confirmationRecords || {}
    ;(globalThis.confirmationRecords as Record<string, typeof record>)[staffId] = record

    return NextResponse.json({ 
      success: true, 
      message: '培训确认成功',
      record 
    })
  } catch {
    return NextResponse.json({ 
      error: '确认失败，请稍后重试' 
    }, { status: 500 })
  }
}
