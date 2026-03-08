import { NextRequest, NextResponse } from 'next/server'

// 获取岗位信息 - 从内存中读取活动数据
// 注意：这是一个临时方案，实际项目中应该使用数据库
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const positionId = searchParams.get('id')
  
  if (!positionId) {
    return NextResponse.json({ error: '缺少岗位ID' }, { status: 400 })
  }
  
  // 根据ID内容判断岗位类型
  let positionType = 'executor'
  let positionName = '执行人员'
  
  if (positionId.includes('project_manager') || positionId.includes('pm')) {
    positionType = 'project_manager'
    positionName = '项目负责人'
  } else if (positionId.includes('host')) {
    positionType = 'host'
    positionName = '活动主持人'
  } else if (positionId.includes('checkin')) {
    positionType = 'checkin'
    positionName = '签到岗'
  } else if (positionId.includes('assistant')) {
    positionType = 'assistant'
    positionName = '活动协助'
  } else if (positionId.includes('mobile')) {
    positionType = 'mobile'
    positionName = '机动岗'
  } else if (positionId.includes('teacher')) {
    positionType = 'teacher'
    positionName = 'DIY老师'
  } else if (positionId.includes('doctor')) {
    positionType = 'doctor'
    positionName = '义诊医生'
  }
  
  return NextResponse.json({
    success: true,
    position: {
      id: positionId,
      type: positionType,
      name: positionName
    }
  })
}
