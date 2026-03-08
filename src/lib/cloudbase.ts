import cloudbase from '@cloudbase/js-sdk'

// 腾讯云开发配置
const envId = 'mumu303-zhou-5gowo02876f7b6d8'

// 初始化云开发实例
let app: ReturnType<typeof cloudbase.init> | null = null
let db: ReturnType<typeof cloudbase.init>['database'] | null = null

// 调试函数
export const debugCloudBase = async () => {
  console.log('=== 开始诊断云开发连接 ===')
  console.log('环境ID:', envId)
  console.log('当前域名:', window.location.hostname)
  
  const results: { step: string; success: boolean; message: string }[] = []
  
  try {
    // 1. 测试 SDK 加载
    console.log('1. SDK版本:', cloudbase.version || '未知')
    results.push({ step: 'SDK加载', success: true, message: cloudbase.version || '未知' })
    
    // 2. 测试初始化
    console.log('2. 开始初始化...')
    const testApp = cloudbase.init({
      env: envId,
      region: 'ap-shanghai'
    })
    console.log('初始化成功:', !!testApp)
    results.push({ step: '初始化', success: true, message: 'OK' })
    
    // 3. 测试认证
    console.log('3. 开始匿名登录...')
    const auth = testApp.auth()
    
    try {
      const loginResult = await auth.signInAnonymously()
      console.log('登录成功:', loginResult)
      results.push({ step: '匿名登录', success: true, message: JSON.stringify(loginResult) })
    } catch (loginError) {
      console.error('登录失败:', loginError)
      results.push({ step: '匿名登录', success: false, message: String(loginError) })
      throw loginError
    }
    
    // 4. 测试数据库
    console.log('4. 测试数据库连接...')
    const testDb = testApp.database()
    
    try {
      const result = await testDb.collection('pet_activities').limit(1).get()
      console.log('数据库查询成功，记录数:', result.data?.length || 0)
      results.push({ step: '数据库连接', success: true, message: `记录数: ${result.data?.length || 0}` })
    } catch (dbError) {
      console.error('数据库查询失败:', dbError)
      results.push({ step: '数据库连接', success: false, message: String(dbError) })
      throw dbError
    }
    
    console.log('=== 诊断完成：全部正常 ===')
    return { success: true, message: '连接正常', results }
  } catch (error) {
    console.error('=== 诊断失败 ===')
    console.error('错误详情:', error)
    if (error instanceof Error) {
      console.error('错误名称:', error.name)
      console.error('错误消息:', error.message)
    }
    return { success: false, message: String(error), results }
  }
}

// 在 window 上暴露调试函数
if (typeof window !== 'undefined') {
  (window as unknown as { debugCloudBase: () => Promise<unknown> }).debugCloudBase = debugCloudBase
}

export const initCloudBase = () => {
  if (typeof window === 'undefined') return null
  
  if (!app) {
    console.log('正在初始化云开发...', { envId })
    try {
      app = cloudbase.init({
        env: envId,
        region: 'ap-shanghai'
      })
      console.log('云开发初始化成功')
      db = app.database()
    } catch (error) {
      console.error('云开发初始化失败:', error)
      return null
    }
  }
  
  return { app, db }
}

export const getDatabase = () => {
  const instance = initCloudBase()
  return instance?.db || null
}

export const getApp = () => {
  const instance = initCloudBase()
  return instance?.app || null
}

// 匿名登录
export const anonymousAuth = async () => {
  const appInstance = getApp()
  if (!appInstance) {
    console.error('无法获取云开发实例')
    return false
  }
  
  try {
    const auth = appInstance.auth()
    console.log('检查登录状态...')
    
    try {
      const loginState = await auth.getLoginState()
      if (loginState) {
        console.log('已登录，用户ID:', loginState.user?.uid)
        return true
      }
    } catch {
      console.log('未登录，尝试匿名登录...')
    }
    
    const result = await auth.signInAnonymously()
    console.log('匿名登录成功:', result)
    return true
  } catch (error: unknown) {
    console.error('登录失败详情:', error)
    if (error instanceof Error) {
      console.error('错误消息:', error.message)
    }
    return false
  }
}

// ==================== 文件存储功能 ====================

// 上传文件到云存储
export const uploadFileToCloud = async (
  file: File, 
  cloudPath?: string
): Promise<{ success: boolean; fileId?: string; downloadUrl?: string; error?: string }> => {
  const appInstance = getApp()
  if (!appInstance) {
    return { success: false, error: '云开发未初始化' }
  }
  
  try {
    // 确保已登录
    await anonymousAuth()
    
    // 生成云存储路径
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 8)
    const ext = file.name.split('.').pop() || 'bin'
    const path = cloudPath || `pemily_files/${timestamp}_${randomStr}.${ext}`
    
    console.log('开始上传文件:', file.name, '→', path)
    
    // 上传文件
    const result = await appInstance.uploadFile({
      cloudPath: path,
      filePath: file  // Web SDK 直接使用 File 对象
    })
    
    console.log('文件上传成功:', result)
    
    // 获取下载链接
    const downloadUrl = await getFileDownloadUrl(path)
    
    return {
      success: true,
      fileId: result.fileID,
      downloadUrl
    }
  } catch (error) {
    console.error('文件上传失败:', error)
    const errorMessage = error instanceof Error ? error.message : String(error)
    return { success: false, error: errorMessage }
  }
}

// 获取文件下载链接
export const getFileDownloadUrl = async (fileId: string): Promise<string> => {
  const appInstance = getApp()
  if (!appInstance) {
    return ''
  }
  
  try {
    const result = await appInstance.getTempFileURL({
      fileList: [fileId]
    })
    
    if (result.fileList && result.fileList[0]) {
      return result.fileList[0].tempFileURL || ''
    }
    return ''
  } catch (error) {
    console.error('获取下载链接失败:', error)
    return ''
  }
}

// 删除云存储文件
export const deleteFileFromCloud = async (fileId: string): Promise<boolean> => {
  const appInstance = getApp()
  if (!appInstance) {
    return false
  }
  
  try {
    await appInstance.deleteFile({
      fileList: [fileId]
    })
    console.log('文件删除成功:', fileId)
    return true
  } catch (error) {
    console.error('文件删除失败:', error)
    return false
  }
}

// 数据库集合名称
export const COLLECTION_NAME = 'pet_activities'

const cloudbaseService = { 
  initCloudBase, 
  getDatabase, 
  getApp, 
  anonymousAuth, 
  uploadFileToCloud,
  getFileDownloadUrl,
  deleteFileFromCloud,
  COLLECTION_NAME 
}
export default cloudbaseService
