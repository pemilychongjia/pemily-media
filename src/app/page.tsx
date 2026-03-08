'use client'

import { useState } from 'react'
import Sidebar from '@/components/Sidebar'
import ProjectMaterials from '@/components/ProjectMaterials'
import MaterialManager from '@/components/MaterialManager'
import PersonnelManager from '@/components/PersonnelManager'
import SportsEvent from '@/components/SportsEvent'
import ActivityManager from '@/components/ActivityManager'
import RecruitmentManager from '@/components/RecruitmentManager'
import RegistrationManager from '@/components/RegistrationManager'
import PromotionTracker from '@/components/PromotionTracker'
import ImageManager from '@/components/ImageManager'
import { useActivityStore } from '@/store/activity-store'
import { AlertCircle } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export default function Home() {
  const { currentActivityId } = useActivityStore()
  const [activeTab, setActiveTab] = useState('activities')
  
  const renderContent = () => {
    // 如果没有选中活动，显示提示
    if (!currentActivityId && activeTab !== 'activities') {
      return (
        <div className="p-6">
          <Alert className="border-[oklch(0.9_0.18_95)] bg-[oklch(0.98_0.08_95)]">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>请先选择或创建活动</AlertTitle>
            <AlertDescription>
              您需要先选择一个活动或创建新活动，才能使用其他功能。
            </AlertDescription>
          </Alert>
          <div className="mt-4">
            <ActivityManager />
          </div>
        </div>
      )
    }
    
    switch (activeTab) {
      case 'activities':
        return (
          <div className="p-6 space-y-6 animate-fade-in">
            <div>
              <h1 className="text-2xl font-bold text-foreground">活动管理</h1>
              <p className="text-muted-foreground">上传甲方需求单创建活动，查看活动排期，分配项目负责人</p>
            </div>
            <ActivityManager onActivityChange={() => setActiveTab('materials')} />
          </div>
        )
      case 'materials':
        return <ProjectMaterials />
      case 'promotion':
        return <PromotionTracker />
      case 'inventory':
        return <MaterialManager />
      case 'personnel':
        return <PersonnelManager />
      case 'recruitment':
        return <RecruitmentManager />
      case 'registration':
        return <RegistrationManager />
      case 'images':
        return <ImageManager />
      case 'sports':
        return <SportsEvent />
      default:
        return <ProjectMaterials />
    }
  }

  return (
    <div className="flex min-h-screen bg-[oklch(0.99_0.005_95)]">
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />
      <main className="flex-1 overflow-auto pt-14 pb-20 md:pt-0 md:pb-0">
        {renderContent()}
      </main>
    </div>
  )
}
