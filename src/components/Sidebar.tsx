'use client'

import { useState } from 'react'
import { 
  FileText, 
  Package, 
  Users, 
  Trophy, 
  Menu,
  FolderKanban,
  ClipboardList,
  X,
  Share2,
  Image as ImageIcon
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useActivityStore } from '@/store/activity-store'
import { Button } from '@/components/ui/button'
import SyncStatus from '@/components/SyncStatus'
import Image from 'next/image'

interface SidebarProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

const menuItems = [
  { id: 'activities', label: '活动管理', icon: FolderKanban },
  { id: 'materials', label: '项目材料', icon: FileText },
  { id: 'promotion', label: '宣传进度', icon: Share2 },
  { id: 'inventory', label: '物料核对', icon: Package },
  { id: 'personnel', label: '人员分工', icon: Users },
  { id: 'registration', label: '报名管理', icon: ClipboardList },
  { id: 'images', label: '图片管理', icon: ImageIcon },
  { id: 'sports', label: '运动会', icon: Trophy },
]

// 菜单项组件
function MenuItem({ 
  item, 
  isActive, 
  isDisabled, 
  onClick,
  isMobile 
}: { 
  item: typeof menuItems[0]
  isActive: boolean
  isDisabled: boolean
  onClick: () => void
  isMobile?: boolean
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200',
        isMobile && 'touch-manipulation',
        isActive 
          ? 'bg-[oklch(0.9_0.18_95)] text-[oklch(0.25_0.05_90)] shadow-lg' 
          : isDisabled
          ? 'text-white/30 cursor-not-allowed'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{item.label}</span>
    </button>
  )
}

// 底部导航项组件
function BottomNavItem({
  item,
  isActive,
  isDisabled,
  onClick
}: {
  item: typeof menuItems[0]
  isActive: boolean
  isDisabled: boolean
  onClick: () => void
}) {
  const Icon = item.icon
  return (
    <button
      onClick={onClick}
      disabled={isDisabled}
      className={cn(
        'flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] touch-manipulation',
        isActive 
          ? 'text-[oklch(0.9_0.18_95)]' 
          : isDisabled
          ? 'text-gray-300'
          : 'text-gray-500'
      )}
    >
      <Icon className={cn('w-5 h-5', isActive && 'font-bold')} />
      <span className="text-[10px] mt-0.5 font-medium">{item.label.slice(0, 2)}</span>
    </button>
  )
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { currentActivityId, activityList } = useActivityStore()
  const currentActivity = activityList.find(a => a.id === currentActivityId)
  const [isOpen, setIsOpen] = useState(false)
  
  const handleTabChange = (tab: string) => {
    onTabChange(tab)
    setIsOpen(false)
  }

  return (
    <>
      {/* 移动端顶部栏 */}
      <header className="fixed top-0 left-0 right-0 bg-gradient-to-r from-[oklch(0.22_0.03_70)] to-[oklch(0.18_0.02_70)] md:hidden z-40 safe-area-top">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[oklch(0.9_0.18_95)] flex items-center justify-center overflow-hidden">
              <Image src="/logo.png" alt="pemily" width={32} height={32} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">pemily</h1>
              {currentActivity && (
                <p className="text-[10px] text-white/60 truncate max-w-[150px]">{currentActivity.name}</p>
              )}
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="text-white hover:bg-white/10 p-2"
          >
            <Menu className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* 移动端底部导航 */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 md:hidden z-50 safe-area-bottom">
        <div className="flex justify-around items-center py-2 px-1">
          {menuItems.slice(0, 5).map((item) => (
            <BottomNavItem
              key={item.id}
              item={item}
              isActive={activeTab === item.id}
              isDisabled={item.id !== 'activities' && !currentActivityId}
              onClick={() => handleTabChange(item.id)}
            />
          ))}
          <button
            onClick={() => setIsOpen(true)}
            className="flex flex-col items-center justify-center py-1 px-2 rounded-lg min-w-[56px] text-gray-500 touch-manipulation"
          >
            <Menu className="w-5 h-5" />
            <span className="text-[10px] mt-0.5 font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 抽屉式菜单遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      {/* 抽屉式菜单 */}
      <aside className={cn(
        'fixed top-0 right-0 bottom-0 w-72 bg-gradient-to-b from-[oklch(0.22_0.03_70)] to-[oklch(0.18_0.02_70)] z-50 flex flex-col shadow-xl transition-transform duration-300 md:hidden',
        isOpen ? 'translate-x-0' : 'translate-x-full'
      )}>
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.9_0.18_95)] flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/logo.png" alt="pemily" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">pemily</h1>
              <p className="text-xs text-white/60">执行智能体</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-white/10 p-2"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>
        
        {currentActivity && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-1">当前活动</p>
              <p className="text-sm text-white font-medium truncate">{currentActivity.name}</p>
              <p className="text-xs text-white/60 mt-1">{currentActivity.client}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <MenuItem
                  item={item}
                  isActive={activeTab === item.id}
                  isDisabled={item.id !== 'activities' && !currentActivityId}
                  onClick={() => handleTabChange(item.id)}
                  isMobile
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <SyncStatus />
          <div className="bg-white/5 rounded-xl p-3">
            <p className="text-xs text-white/50 text-center">
              © 2024 Pemily
            </p>
          </div>
        </div>
      </aside>

      {/* 桌面端侧边栏 */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-[oklch(0.22_0.03_70)] to-[oklch(0.18_0.02_70)] min-h-screen flex-col shadow-xl">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[oklch(0.9_0.18_95)] flex items-center justify-center shadow-lg overflow-hidden">
              <Image src="/logo.png" alt="pemily" width={40} height={40} className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">pemily</h1>
              <p className="text-xs text-white/60">执行智能体</p>
            </div>
          </div>
        </div>
        
        {currentActivity && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="bg-white/10 rounded-lg p-3">
              <p className="text-xs text-white/50 mb-1">当前活动</p>
              <p className="text-sm text-white font-medium truncate">{currentActivity.name}</p>
              <p className="text-xs text-white/60 mt-1">{currentActivity.client}</p>
            </div>
          </div>
        )}

        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <MenuItem
                  item={item}
                  isActive={activeTab === item.id}
                  isDisabled={item.id !== 'activities' && !currentActivityId}
                  onClick={() => onTabChange(item.id)}
                />
              </li>
            ))}
          </ul>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <SyncStatus />
          <div className="bg-white/5 rounded-xl p-4">
            <p className="text-xs text-white/50 text-center">
              © 2024 Pemily
            </p>
          </div>
        </div>
      </aside>
    </>
  )
}
