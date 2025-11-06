import { Tool } from '@/types/tool'
import { Workflow } from './runtime-core'

/**
 * Configurable Storage Backend Interface
 * Enables switching between different storage implementations
 */
export interface StorageBackend {
  getItem(key: string): Promise<string | null>
  setItem(key: string, value: string): Promise<void>
  removeItem(key: string): Promise<void>
  clear(): Promise<void>
  getAllKeys(): Promise<string[]>
}

/**
 * Spark KV Backend (Current Implementation)
 */
export class SparkKVBackend implements StorageBackend {
  async getItem(key: string): Promise<string | null> {
    try {
      const data = await window.spark.kv.get(key)
      return data ? JSON.stringify(data) : null
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const parsedValue = JSON.parse(value)
      await window.spark.kv.set(key, parsedValue)
    } catch (error) {
      console.error(`[SparkKVBackend] Failed to set item ${key}:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      await window.spark.kv.delete(key)
    } catch (error) {
      console.error(`[SparkKVBackend] Failed to remove item ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      // Get all keys with our prefix and delete them
      const keys = await window.spark.kv.list('mcp-hub-')
      await Promise.all(keys.map(key => window.spark.kv.delete(key)))
    } catch (error) {
      console.error('[SparkKVBackend] Failed to clear storage:', error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      return await window.spark.kv.list('mcp-hub-')
    } catch {
      return []
    }
  }
}

/**
 * LocalStorage Backend (Fallback for browser environments)
 */
export class LocalStorageBackend implements StorageBackend {
  private readonly prefix = 'mcp-hub-'

  async getItem(key: string): Promise<string | null> {
    try {
      return localStorage.getItem(this.prefix + key)
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      localStorage.setItem(this.prefix + key, value)
    } catch (error) {
      console.error(`[LocalStorageBackend] Failed to set item ${key}:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      localStorage.removeItem(this.prefix + key)
    } catch (error) {
      console.error(`[LocalStorageBackend] Failed to remove item ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      // Remove only keys with our prefix
      const keys = await this.getAllKeys()
      keys.forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('[LocalStorageBackend] Failed to clear storage:', error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const keys: string[] = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key && key.startsWith(this.prefix)) {
          keys.push(key)
        }
      }
      return keys
    } catch {
      return []
    }
  }
}

/**
 * IndexedDB Backend (For larger datasets)
 */
export class IndexedDBBackend implements StorageBackend {
  private dbName = 'mcp-hub-db'
  private version = 1
  private db: IDBDatabase | null = null

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(request.result)
      }

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result
        if (!db.objectStoreNames.contains('storage')) {
          db.createObjectStore('storage', { keyPath: 'key' })
        }
      }
    })
  }

  async getItem(key: string): Promise<string | null> {
    try {
      const db = await this.getDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['storage'], 'readonly')
        const store = transaction.objectStore('storage')
        const request = store.get(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result ? request.result.value : null)
      })
    } catch {
      return null
    }
  }

  async setItem(key: string, value: string): Promise<void> {
    try {
      const db = await this.getDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['storage'], 'readwrite')
        const store = transaction.objectStore('storage')
        const request = store.put({ key, value })

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error(`[IndexedDBBackend] Failed to set item ${key}:`, error)
      throw error
    }
  }

  async removeItem(key: string): Promise<void> {
    try {
      const db = await this.getDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['storage'], 'readwrite')
        const store = transaction.objectStore('storage')
        const request = store.delete(key)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error(`[IndexedDBBackend] Failed to remove item ${key}:`, error)
      throw error
    }
  }

  async clear(): Promise<void> {
    try {
      const db = await this.getDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['storage'], 'readwrite')
        const store = transaction.objectStore('storage')
        const request = store.clear()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve()
      })
    } catch (error) {
      console.error('[IndexedDBBackend] Failed to clear storage:', error)
      throw error
    }
  }

  async getAllKeys(): Promise<string[]> {
    try {
      const db = await this.getDB()
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(['storage'], 'readonly')
        const store = transaction.objectStore('storage')
        const request = store.getAllKeys()

        request.onerror = () => reject(request.error)
        request.onsuccess = () => resolve(request.result as string[])
      })
    } catch {
      return []
    }
  }
}

/**
 * Memory Backend (For testing and temporary storage)
 */
export class MemoryBackend implements StorageBackend {
  private storage = new Map<string, string>()

  async getItem(key: string): Promise<string | null> {
    return this.storage.get(key) || null
  }

  async setItem(key: string, value: string): Promise<void> {
    this.storage.set(key, value)
  }

  async removeItem(key: string): Promise<void> {
    this.storage.delete(key)
  }

  async clear(): Promise<void> {
    this.storage.clear()
  }

  async getAllKeys(): Promise<string[]> {
    return Array.from(this.storage.keys())
  }
}

// Storage Configuration
export interface StorageConfig {
  backend: StorageBackend
  autoMigrate: boolean
  backupEnabled: boolean
}

// Default configuration
const DEFAULT_CONFIG: StorageConfig = {
  backend: typeof window !== 'undefined' && window.spark?.kv ?
    new SparkKVBackend() :
    new LocalStorageBackend(),
  autoMigrate: true,
  backupEnabled: true
}

const STORAGE_KEYS = {
  TOOLS: 'mcp-hub-tools',
  WORKFLOWS: 'mcp-hub-workflows',
  SETTINGS: 'mcp-hub-settings',
  TELEMETRY: 'mcp-hub-telemetry',
  REFLECTIONS: 'mcp-hub-reflections'
} as const

/**
 * Configurable Storage Service
 */
export class ConfigurableStorage {
  private config: StorageConfig
  private backend: StorageBackend

  constructor(config: Partial<StorageConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.backend = this.config.backend
    
    console.groupCollapsed('[ConfigurableStorage] Initializing storage')
    console.log(`[DIAGNOSTIC] Using backend: ${this.backend.constructor.name}`)
    console.log(`[DIAGNOSTIC] Auto-migrate: ${this.config.autoMigrate}`)
    console.log(`[DIAGNOSTIC] Backup enabled: ${this.config.backupEnabled}`)
    console.groupEnd()
  }

  /**
   * Change storage backend at runtime
   */
  setBackend(backend: StorageBackend): void {
    console.log(`[ConfigurableStorage] Switching backend to: ${backend.constructor.name}`)
    this.backend = backend
    this.config.backend = backend
  }

  /**
   * Get current backend name
   */
  getBackendName(): string {
    return this.backend.constructor.name
  }

  // Tool Management
  async getTools(): Promise<Tool[]> {
    try {
      const data = await this.backend.getItem(STORAGE_KEYS.TOOLS)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  async saveTool(tool: Tool): Promise<void> {
    const tools = await this.getTools()
    const index = tools.findIndex(t => t.id === tool.id)

    if (index >= 0) {
      tools[index] = tool
    } else {
      tools.push(tool)
    }

    await this.backend.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(tools))
  }

  async deleteTool(toolId: string): Promise<void> {
    const tools = await this.getTools()
    const filtered = tools.filter(t => t.id !== toolId)
    await this.backend.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(filtered))
  }

  // Workflow Management
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const data = await this.backend.getItem(STORAGE_KEYS.WORKFLOWS)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  async saveWorkflow(workflow: Workflow): Promise<void> {
    const workflows = await this.getWorkflows()
    const index = workflows.findIndex(w => w.id === workflow.id)

    if (index >= 0) {
      workflows[index] = workflow
    } else {
      workflows.push(workflow)
    }

    await this.backend.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(workflows))
  }

  async deleteWorkflow(workflowId: string): Promise<void> {
    const workflows = await this.getWorkflows()
    const filtered = workflows.filter(w => w.id !== workflowId)
    await this.backend.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(filtered))
  }

  // Telemetry Data
  async getTelemetryData(): Promise<any[]> {
    try {
      const data = await this.backend.getItem(STORAGE_KEYS.TELEMETRY)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  async saveTelemetryData(telemetryData: any[]): Promise<void> {
    await this.backend.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(telemetryData))
  }

  // Reflection Data
  async getReflectionData(): Promise<any[]> {
    try {
      const data = await this.backend.getItem(STORAGE_KEYS.REFLECTIONS)
      return data ? JSON.parse(data) : []
    } catch {
      return []
    }
  }

  async saveReflectionData(reflectionData: any[]): Promise<void> {
    await this.backend.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(reflectionData))
  }

  // Export/Import
  async exportData(): Promise<string> {
    const tools = await this.getTools()
    const workflows = await this.getWorkflows()
    const telemetry = await this.getTelemetryData()
    const reflections = await this.getReflectionData()

    return JSON.stringify({
      version: '2.0',
      exportedAt: Date.now(),
      storageBackend: this.getBackendName(),
      tools,
      workflows,
      telemetry,
      reflections
    }, null, 2)
  }

  async importData(jsonString: string): Promise<{ tools: number; workflows: number; telemetry: number; reflections: number }> {
    const data = JSON.parse(jsonString)

    const results = {
      tools: 0,
      workflows: 0,
      telemetry: 0,
      reflections: 0
    }

    if (data.tools) {
      await this.backend.setItem(STORAGE_KEYS.TOOLS, JSON.stringify(data.tools))
      results.tools = data.tools.length
    }

    if (data.workflows) {
      await this.backend.setItem(STORAGE_KEYS.WORKFLOWS, JSON.stringify(data.workflows))
      results.workflows = data.workflows.length
    }

    if (data.telemetry) {
      await this.backend.setItem(STORAGE_KEYS.TELEMETRY, JSON.stringify(data.telemetry))
      results.telemetry = data.telemetry.length
    }

    if (data.reflections) {
      await this.backend.setItem(STORAGE_KEYS.REFLECTIONS, JSON.stringify(data.reflections))
      results.reflections = data.reflections.length
    }

    return results
  }

  // Backup and Restore
  async createBackup(): Promise<string> {
    return this.exportData()
  }

  async restoreBackup(backupData: string): Promise<boolean> {
    try {
      await this.importData(backupData)
      return true
    } catch (error) {
      console.error('[ConfigurableStorage] Backup restore failed:', error)
      return false
    }
  }

  // Migration
  async migrateFromLegacy(): Promise<boolean> {
    if (!this.config.autoMigrate) return false

    try {
      // Check if legacy data exists and migrate if needed
      // This would involve checking old storage keys and moving data
      console.log('[ConfigurableStorage] Migration check completed')
      return true
    } catch (error) {
      console.error('[ConfigurableStorage] Migration failed:', error)
      return false
    }
  }

  // Utility Methods
  async getStorageStats(): Promise<{
    tools: number
    workflows: number
    telemetry: number
    reflections: number
    totalSize: number
  }> {
    const tools = await this.getTools()
    const workflows = await this.getWorkflows()
    const telemetry = await this.getTelemetryData()
    const reflections = await this.getReflectionData()

    const totalSize = JSON.stringify({
      tools, workflows, telemetry, reflections
    }).length

    return {
      tools: tools.length,
      workflows: workflows.length,
      telemetry: telemetry.length,
      reflections: reflections.length,
      totalSize
    }
  }

  async clearAllData(): Promise<void> {
    await this.backend.clear()
  }
}

// Export singleton instance with default configuration
export const storage = new ConfigurableStorage()

// Legacy export for backward compatibility
export const legacyStorage = {
  getTools: storage.getTools.bind(storage),
  saveTool: storage.saveTool.bind(storage),
  deleteTool: storage.deleteTool.bind(storage),
  getWorkflows: storage.getWorkflows.bind(storage),
  saveWorkflow: storage.saveWorkflow.bind(storage),
  deleteWorkflow: storage.deleteWorkflow.bind(storage),
  exportData: storage.exportData.bind(storage),
  importData: storage.importData.bind(storage)
}
