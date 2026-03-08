'use client'

import { useState, useRef } from 'react'
import { 
  Image as ImageIconLucide, 
  Upload, 
  Trash2, 
  Loader2,
  X,
  ImageIcon
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { toast } from '@/hooks/use-toast'
import { useActivityStore } from '@/store/activity-store'
import { uploadFileToCloud, deleteFileFromCloud } from '@/lib/cloudbase'
import type { CloudFile } from '@/types/activity'

export default function ImageManager() {
  const { currentActivityId, activities, addImage, removeImage } = useActivityStore()
  const currentActivity = currentActivityId ? activities[currentActivityId] : null
  const images = currentActivity?.images || []
  
  const [isUploading, setIsUploading] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // 处理图片上传
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !currentActivityId) return
    
    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      toast({ title: '请选择图片文件', variant: 'destructive' })
      return
    }
    
    // 检查文件大小（最大5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: '图片大小不能超过5MB', variant: 'destructive' })
      return
    }
    
    setIsUploading(true)
    
    try {
      // 上传到云存储
      const result = await uploadFileToCloud(file)
      
      if (result.success && result.downloadUrl) {
        // 保存图片信息到store
        addImage(currentActivityId, {
          name: file.name,
          cloudPath: result.fileId || '',
          downloadUrl: result.downloadUrl,
          size: file.size,
          type: 'image',
          uploadedAt: new Date().toLocaleString('zh-CN')
        })
        
        toast({ title: '上传成功', description: '图片已保存到云端' })
      } else {
        throw new Error(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传图片失败:', error)
      toast({ 
        title: '上传失败', 
        description: error instanceof Error ? error.message : '请稍后重试',
        variant: 'destructive' 
      })
    } finally {
      setIsUploading(false)
      event.target.value = ''
    }
  }
  
  // 删除图片
  const handleDeleteImage = async (imageId: string, cloudPath: string) => {
    if (!currentActivityId) return
    
    try {
      // 从云存储删除
      if (cloudPath) {
        await deleteFileFromCloud(cloudPath)
      }
      
      // 从store中删除
      removeImage(currentActivityId, imageId)
      
      toast({ title: '删除成功' })
    } catch (error) {
      console.error('删除图片失败:', error)
      toast({ title: '删除失败', variant: 'destructive' })
    }
  }
  
  // 格式化文件大小
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B'
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
  }
  
  if (!currentActivityId) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>请先选择活动</p>
      </div>
    )
  }
  
  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">图片管理</h1>
          <p className="text-muted-foreground">上传活动相关图片，自动同步到云端，团队成员共享</p>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
        />
        <Button 
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
          className="bg-[oklch(0.9_0.18_95)] hover:bg-[oklch(0.85_0.16_95)]"
        >
          {isUploading ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Upload className="w-4 h-4 mr-2" />
          )}
          上传图片
        </Button>
      </div>
      
      {/* 说明 */}
      <Alert className="bg-[oklch(0.98_0.04_95)] border-[oklch(0.9_0.18_95)]">
        <ImageIconLucide className="w-4 h-4 text-[oklch(0.9_0.18_95)]" />
        <AlertDescription>
          <strong>云端存储说明：</strong>图片上传后存储在腾讯云，永久保存，团队成员可同步查看。支持 JPG、PNG、GIF 格式，单张最大 5MB。
        </AlertDescription>
      </Alert>
      
      {/* 图片列表 */}
      {images.length === 0 ? (
        <Card className="border-0 shadow-md">
          <CardContent className="py-12">
            <div className="text-center text-muted-foreground">
              <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-medium">暂无图片</p>
              <p className="text-sm mt-1">点击上方按钮上传图片</p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((img) => (
            <Card key={img.id} className="border-0 shadow-md overflow-hidden group">
              <div className="relative aspect-square">
                <img 
                  src={img.downloadUrl} 
                  alt={img.name}
                  className="w-full h-full object-cover cursor-pointer"
                  onClick={() => setPreviewImage(img.downloadUrl)}
                />
                <button
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-600"
                  onClick={() => handleDeleteImage(img.id, img.cloudPath)}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <CardContent className="p-3">
                <p className="text-sm font-medium truncate" title={img.name}>{img.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatSize(img.size)} · {img.uploadedAt}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      {/* 图片预览对话框 */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <button
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/20 text-white hover:bg-white/30 flex items-center justify-center"
            onClick={() => setPreviewImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={previewImage} 
            alt="图片预览"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  )
}
