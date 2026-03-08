'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { 
  CheckCircle, 
  User, 
  Phone, 
  FileText, 
  Clock,
  AlertCircle,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Loader2
} from 'lucide-react'

// 岗位说明书数据
const jobDescriptions: Record<string, {
  responsibilities: string[]
  requirements: string[]
  keyPoints: string[]
  emergencyContact: string
}> = {
  '项目负责人': {
    responsibilities: [
      '统筹协调全场活动执行',
      '对接甲方，处理客户需求',
      '人员调度与任务分配',
      '现场应急情况处理',
      '活动流程把控与时间管理',
      '物料准备与核对确认',
      '活动验收与复盘报告'
    ],
    requirements: [
      '熟悉宠物活动执行流程',
      '具备现场协调能力',
      '良好的沟通表达能力',
      '能处理突发情况'
    ],
    keyPoints: [
      '活动前1小时到岗检查场地',
      '确认所有物料已到位',
      '与甲方对接人保持沟通',
      '活动结束后组织撤场'
    ],
    emergencyContact: '公司负责人：138****0000'
  },
  '活动主持人': {
    responsibilities: [
      '活动开场主持与品牌介绍',
      '活动规则与安全提示说明',
      '赛事主持与气氛调动',
      '采访参赛者与互动',
      '颁奖环节主持',
      '活动收尾与感谢致辞'
    ],
    requirements: [
      '有宠物活动主持经验优先',
      '活泼开朗，善于互动',
      '熟悉活动流程和规则',
      '着装整洁得体'
    ],
    keyPoints: [
      '提前熟悉主持稿',
      '了解宠物习性，避免惊吓',
      '注意时间把控'
    ],
    emergencyContact: '项目负责人：138****8001'
  },
  '签到岗': {
    responsibilities: [
      '签到登记与信息录入',
      '引导嘉宾入场与站位',
      '发放号码牌和物料',
      '宠物信息登记',
      '解答嘉宾关于活动的疑问'
    ],
    requirements: [
      '喜爱宠物，有耐心',
      '执行力强，听从指挥',
      '准时到岗'
    ],
    keyPoints: [
      '活动前熟悉签到流程',
      '准备好签到物料',
      '与负责人保持沟通'
    ],
    emergencyContact: '项目负责人：138****8001'
  },
  '活动协助': {
    responsibilities: [
      '协助参赛者入场',
      '发放活动道具和器材',
      '记录比赛成绩',
      '维护现场秩序和安全',
      '协助布置和清理活动场地'
    ],
    requirements: [
      '身体健康，能搬运物料',
      '着装方便活动',
      '执行力强，听从指挥'
    ],
    keyPoints: [
      '了解各环节工作内容',
      '注意宠物安全',
      '保持现场整洁'
    ],
    emergencyContact: '项目负责人：138****8001'
  },
  '机动岗': {
    responsibilities: [
      '支援各岗位工作',
      '处理突发情况和紧急事务',
      '负责物料补充和运输',
      '执行临时任务安排',
      '协助现场秩序维护'
    ],
    requirements: [
      '灵活应变能力强',
      '服从安排',
      '身体健康'
    ],
    keyPoints: [
      '随时待命响应需求',
      '熟悉各岗位职责',
      '准备好应急处理'
    ],
    emergencyContact: '项目负责人：138****8001'
  },
  '执行人员': {
    responsibilities: [
      '签到登记与信息录入',
      '引导嘉宾入场与站位',
      '宠物安全检查与看护',
      '活动道具布置与回收',
      '赛事计时与成绩记录',
      '奖品发放与礼品分发',
      '现场秩序维护'
    ],
    requirements: [
      '喜爱宠物，有耐心',
      '执行力强，听从指挥',
      '身体健康，能搬运物料',
      '着装方便活动',
      '准时到岗'
    ],
    keyPoints: [
      '活动前熟悉场地布局',
      '了解各环节工作内容',
      '与负责人保持沟通',
      '注意宠物安全'
    ],
    emergencyContact: '项目负责人：138****8001'
  }
}

function ConfirmContent() {
  const searchParams = useSearchParams()
  const positionId = searchParams.get('id')
  
  const [step, setStep] = useState<'loading' | 'info' | 'training' | 'confirm' | 'success'>('loading')
  const [position, setPosition] = useState<{ id: string; type: string; name: string } | null>(null)
  const [expandedSections, setExpandedSections] = useState<string[]>(['responsibilities'])
  const [confirmerName, setConfirmerName] = useState('')
  const [confirmerPhone, setConfirmerPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmedAt, setConfirmedAt] = useState('')

  useEffect(() => {
    if (positionId) {
      // 从 API 获取岗位信息
      fetch(`/api/position?id=${positionId}`)
        .then(res => res.json())
        .then(data => {
          if (data.success && data.position) {
            setPosition(data.position)
            setStep('info')
            
            // 检查是否已确认
            fetch(`/api/confirm?staffId=${positionId}`)
              .then(res => res.json())
              .then(confirmData => {
                if (confirmData.confirmed) {
                  setStep('success')
                  setConfirmedAt(confirmData.record?.confirmedAt || '')
                }
              })
          } else {
            setStep('info')
          }
        })
        .catch(() => {
          setStep('info')
        })
    } else {
      setStep('info')
    }
  }, [positionId])

  const toggleSection = (section: string) => {
    setExpandedSections(prev => 
      prev.includes(section) 
        ? prev.filter(s => s !== section)
        : [...prev, section]
    )
  }

  const handleSubmit = async () => {
    setError('')
    
    if (!confirmerName.trim()) {
      setError('请输入您的姓名')
      return
    }
    
    if (!confirmerPhone.trim()) {
      setError('请输入您的手机号')
      return
    }
    
    const phoneRegex = /^1[3-9]\d{9}$/
    if (!phoneRegex.test(confirmerPhone)) {
      setError('请输入正确的手机号')
      return
    }

    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          staffId: positionId,
          staffName: confirmerName,
          staffRole: position?.name || '执行人员',
          confirmerName,
          confirmerPhone
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setStep('success')
        setConfirmedAt(data.record.confirmedAt)
      } else {
        setError(data.error || '提交失败，请重试')
      }
    } catch {
      setError('网络错误，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 获取岗位说明书
  const getJobDesc = (role: string) => {
    if (role.includes('项目负责人')) return jobDescriptions['项目负责人']
    if (role.includes('主持')) return jobDescriptions['活动主持人']
    if (role.includes('签到')) return jobDescriptions['签到岗']
    if (role.includes('协助')) return jobDescriptions['活动协助']
    if (role.includes('机动')) return jobDescriptions['机动岗']
    return jobDescriptions['执行人员']
  }

  // 加载中
  if (step === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.98_0.04_95)] to-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[oklch(0.9_0.18_95)] animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    )
  }

  // 无效二维码
  if (!position) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.98_0.04_95)] to-white p-4">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-800 mb-2">二维码无效</h1>
          <p className="text-gray-600">请使用正确的培训确认二维码</p>
        </div>
      </div>
    )
  }

  const jobDesc = getJobDesc(position.name)

  return (
    <div className="min-h-screen bg-gradient-to-br from-[oklch(0.98_0.04_95)] to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-[oklch(0.25_0.04_145)] to-[oklch(0.35_0.06_145)] text-white p-6">
        <div className="max-w-lg mx-auto text-center">
          <h1 className="text-xl font-bold">宠物活动 · 岗位培训确认</h1>
          <p className="text-white/70 text-sm mt-1">扫码确认培训信息</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 pb-20">
        {/* Step 1: 岗位信息 */}
        {step === 'info' && (
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)] flex items-center justify-center text-white text-2xl font-bold mx-auto mb-3">
                  {position.name.charAt(0)}
                </div>
                <h2 className="text-xl font-bold text-gray-800">{position.name}</h2>
                <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs bg-[oklch(0.92_0.05_50)] text-[oklch(0.5_0.12_50)]">
                  外聘岗位
                </span>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-3 text-sm">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">请查看岗位培训内容后确认</span>
                </div>
              </div>
              
              <button
                onClick={() => setStep('training')}
                className="w-full py-3 bg-gradient-to-r from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)] text-white rounded-xl font-medium shadow-lg"
              >
                查看岗位培训内容
              </button>
            </div>
          </div>
        )}

        {/* Step 2: 培训内容 */}
        {step === 'training' && (
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
              <div className="bg-gradient-to-r from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)] text-white p-4">
                <h2 className="font-bold flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {position.name} 岗位说明书
                </h2>
              </div>
              
              <div className="p-4 space-y-3">
                {/* 岗位职责 */}
                <div className="border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-gray-50"
                    onClick={() => toggleSection('responsibilities')}
                  >
                    <span className="font-medium text-gray-700">岗位职责</span>
                    {expandedSections.includes('responsibilities') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.includes('responsibilities') && (
                    <ul className="p-3 space-y-2 text-sm text-gray-600">
                      {jobDesc.responsibilities.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[oklch(0.9_0.18_95)] mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 岗位要求 */}
                <div className="border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-gray-50"
                    onClick={() => toggleSection('requirements')}
                  >
                    <span className="font-medium text-gray-700">岗位要求</span>
                    {expandedSections.includes('requirements') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.includes('requirements') && (
                    <ul className="p-3 space-y-2 text-sm text-gray-600">
                      {jobDesc.requirements.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-[oklch(0.9_0.18_95)] mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 注意事项 */}
                <div className="border rounded-xl overflow-hidden">
                  <button
                    className="w-full flex items-center justify-between p-3 bg-gray-50"
                    onClick={() => toggleSection('keyPoints')}
                  >
                    <span className="font-medium text-gray-700">注意事项</span>
                    {expandedSections.includes('keyPoints') ? (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                  {expandedSections.includes('keyPoints') && (
                    <ul className="p-3 space-y-2 text-sm text-gray-600">
                      {jobDesc.keyPoints.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <AlertCircle className="w-4 h-4 text-[oklch(0.75_0.15_50)] mt-0.5 flex-shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* 应急联系 */}
                <div className="bg-[oklch(0.98_0.04_95)] rounded-xl p-3">
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">应急联系：</span>
                    {jobDesc.emergencyContact}
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setStep('confirm')}
              className="w-full py-3 bg-gradient-to-r from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)] text-white rounded-xl font-medium shadow-lg"
            >
              我已阅读，前往确认
            </button>
            
            <button
              onClick={() => setStep('info')}
              className="w-full py-3 bg-white text-gray-600 rounded-xl font-medium border"
            >
              返回上一步
            </button>
          </div>
        )}

        {/* Step 3: 确认信息 */}
        {step === 'confirm' && (
          <div className="space-y-4 mt-4">
            <div className="bg-white rounded-2xl shadow-lg p-6">
              <div className="text-center mb-6">
                <div className="w-16 h-16 rounded-full bg-[oklch(0.95_0.08_95)] flex items-center justify-center mx-auto mb-3">
                  <FileText className="w-8 h-8 text-[oklch(0.9_0.18_95)]" />
                </div>
                <h2 className="text-lg font-bold text-gray-800">培训确认</h2>
                <p className="text-gray-500 text-sm mt-1">请填写以下信息完成培训确认</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    您的姓名 *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={confirmerName}
                      onChange={(e) => setConfirmerName(e.target.value)}
                      placeholder="请输入您的真实姓名"
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[oklch(0.9_0.18_95)] focus:border-transparent"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    手机号码 *
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="tel"
                      value={confirmerPhone}
                      onChange={(e) => setConfirmerPhone(e.target.value)}
                      placeholder="请输入您的手机号"
                      maxLength={11}
                      className="w-full pl-10 pr-4 py-3 border rounded-xl focus:ring-2 focus:ring-[oklch(0.9_0.18_95)] focus:border-transparent"
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl">
                    {error}
                  </div>
                )}

                <div className="bg-gray-50 rounded-xl p-3 text-sm text-gray-600">
                  <p>确认即表示您已：</p>
                  <ul className="mt-2 space-y-1">
                    <li>• 阅读并理解岗位说明书内容</li>
                    <li>• 知晓工作时间、地点和职责</li>
                    <li>• 了解应急联系方式</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[oklch(0.9_0.18_95)] to-[oklch(0.8_0.15_95)] text-white rounded-xl font-medium shadow-lg disabled:opacity-50"
            >
              {isSubmitting ? '提交中...' : '确认已完成培训'}
            </button>

            <button
              onClick={() => setStep('training')}
              className="w-full py-3 bg-white text-gray-600 rounded-xl font-medium border"
            >
              返回查看培训内容
            </button>
          </div>
        )}

        {/* Step 4: 确认成功 */}
        {step === 'success' && (
          <div className="mt-4">
            <div className="bg-white rounded-2xl shadow-lg p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[oklch(0.9_0.18_95)] flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">培训确认成功</h2>
              <p className="text-gray-500 mb-4">
                您已完成「{position.name}」岗位培训确认
              </p>
              
              <div className="bg-gray-50 rounded-xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">确认岗位</span>
                  <span className="font-medium text-gray-700">{position.name}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">确认时间</span>
                  <span className="font-medium text-gray-700">{confirmedAt}</span>
                </div>
              </div>

              <div className="mt-6 p-4 bg-[oklch(0.98_0.04_95)] rounded-xl text-sm text-gray-600">
                <p className="font-medium text-gray-700 mb-1">温馨提示</p>
                <p>请准时到岗参加活动，如有问题请联系项目负责人</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ConfirmPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[oklch(0.98_0.04_95)] to-white">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-[oklch(0.9_0.18_95)] animate-spin" />
          <p className="text-gray-500">加载中...</p>
        </div>
      </div>
    }>
      <ConfirmContent />
    </Suspense>
  )
}
