import { MCPServerTemplate } from '@/types/mcp-server'

// Original server data - kept for backward compatibility
export const mcpServerLibraryData: MCPServerTemplate[] = [
  // ... (all the existing server data remains the same)
  {
    id: 'mcp-text-editor',
    name: 'MCP Text Editor',
    description: 'Line-based editing of text files with read-ranges, patching, and multi-file atomic edits.',
    category: 'official',
    githubUrl: 'https://github.com/modelcontextprotocol/servers',
    documentation: 'https://github.com/modelcontextprotocol/servers/tree/main/src/text-editor',
    features: ['Read file ranges', 'Apply patches', 'Multi-file edits', 'Atomic operations'],
    requiresAuth: false,
    localOnly: true,
    setupInstructions: 'Run locally: npx @modelcontextprotocol/server-text-editor',
    version: '1.0.0',
    lastUpdated: '2024-01',
    difficulty: 'beginner',
    installCommand: 'npx @modelcontextprotocol/server-text-editor',
    tags: ['text', 'files', 'editing'],
    troubleshooting: [
      'Ensure Node.js 18+ is installed',
      'Check file permissions for target directory',
      'Use absolute paths when specifying files',
    ],
  },
  // ... (truncated for brevity, all original servers remain)
]

// Configuration for pagination and lazy loading
const PAGINATION_CONFIG = {
  defaultPageSize: 20,
  maxPageSize: 100,
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
} as const

// Cache for paginated results
interface PaginationCache {
  data: MCPServerTemplate[]
  timestamp: number
  total: number
}

class MCPServerLibrary {
  private cache: Map<string, PaginationCache> = new Map()
  private lastCacheCleanup: number = Date.now()

  /**
   * Get paginated MCP servers with optional filtering
   */
  async getServers(options: {
    page?: number
    pageSize?: number
    category?: string
    searchQuery?: string
    difficulty?: string
    tags?: string[]
  } = {}): Promise<{
    servers: MCPServerTemplate[]
    total: number
    page: number
    pageSize: number
    totalPages: number
  }> {
    const {
      page = 1,
      pageSize = PAGINATION_CONFIG.defaultPageSize,
      category,
      searchQuery,
      difficulty,
      tags = []
    } = options

    console.groupCollapsed(`[MCP Library] Fetching servers page ${page}`)
    console.table({ page, pageSize, category, searchQuery, difficulty, tags })

    // Validate pagination parameters
    const validatedPage = Math.max(1, page)
    const validatedPageSize = Math.min(
      Math.max(1, pageSize),
      PAGINATION_CONFIG.maxPageSize
    )

    // Generate cache key
    const cacheKey = this.generateCacheKey({
      page: validatedPage,
      pageSize: validatedPageSize,
      category,
      searchQuery,
      difficulty,
      tags
    })

    // Check cache first
    const cached = this.cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < PAGINATION_CONFIG.cacheTimeout) {
      console.log(`[MCP Library] Using cached results for page ${validatedPage}`)
      console.table({
        cached: true,
        servers: cached.data.length,
        total: cached.total,
        totalPages: Math.ceil(cached.total / validatedPageSize)
      })
      console.groupEnd()
      return {
        servers: cached.data,
        total: cached.total,
        page: validatedPage,
        pageSize: validatedPageSize,
        totalPages: Math.ceil(cached.total / validatedPageSize)
      }
    }

    // Apply filters
    let filteredServers = [...mcpServerLibraryData]

    if (category) {
      filteredServers = filteredServers.filter(server => server.category === category)
      console.log(`[MCP Library] Filtered by category "${category}": ${filteredServers.length} servers`)
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      filteredServers = filteredServers.filter(server =>
        server.name.toLowerCase().includes(query) ||
        server.description.toLowerCase().includes(query) ||
        (server.tags || []).some(tag => tag.toLowerCase().includes(query))
      )
      console.log(`[MCP Library] Filtered by search "${searchQuery}": ${filteredServers.length} servers`)
    }

    if (difficulty) {
      filteredServers = filteredServers.filter(server => server.difficulty === difficulty)
      console.log(`[MCP Library] Filtered by difficulty "${difficulty}": ${filteredServers.length} servers`)
    }

    if (tags.length > 0) {
      filteredServers = filteredServers.filter(server =>
        tags.every(tag => (server.tags || []).includes(tag))
      )
      console.log(`[MCP Library] Filtered by tags [${tags.join(', ')}]: ${filteredServers.length} servers`)
    }

    // Apply pagination
    const startIndex = (validatedPage - 1) * validatedPageSize
    const endIndex = startIndex + validatedPageSize
    const paginatedServers = filteredServers.slice(startIndex, endIndex)

    const total = filteredServers.length
    const totalPages = Math.ceil(total / validatedPageSize)

    // Cache the results
    this.cache.set(cacheKey, {
      data: paginatedServers,
      timestamp: Date.now(),
      total
    })

    // Clean up old cache entries periodically
    this.cleanupCache()

    console.table({
      cached: false,
      servers: paginatedServers.length,
      total,
      totalPages,
      startIndex,
      endIndex
    })
    console.groupEnd()

    return {
      servers: paginatedServers,
      total,
      page: validatedPage,
      pageSize: validatedPageSize,
      totalPages
    }
  }

  /**
   * Get a single server by ID
   */
  async getServerById(id: string): Promise<MCPServerTemplate | null> {
    console.log(`[MCP Library] Fetching server by ID: ${id}`)
    
    const server = mcpServerLibraryData.find(s => s.id === id)
    
    if (server) {
      console.table({ found: true, name: server.name, category: server.category })
    } else {
      console.warn(`[MCP Library] Server not found: ${id}`)
    }
    
    return server || null
  }

  /**
   * Get server categories with counts
   */
  async getCategories(): Promise<Array<{ category: string; count: number }>> {
    console.log('[MCP Library] Fetching categories')
    
    const categories = mcpServerLibraryData.reduce((acc, server) => {
      acc[server.category] = (acc[server.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const result = Object.entries(categories).map(([category, count]) => ({
      category,
      count
    }))

    console.table(result)
    return result
  }

  /**
   * Get available tags with counts
   */
  async getTags(): Promise<Array<{ tag: string; count: number }>> {
    console.log('[MCP Library] Fetching tags')
    
    const tagCounts = mcpServerLibraryData.reduce((acc, server) => {
      (server.tags || []).forEach(tag => {
        acc[tag] = (acc[tag] || 0) + 1
      })
      return acc
    }, {} as Record<string, number>)

    const result = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)

    console.table(result.slice(0, 10)) // Log top 10 tags
    return result
  }

  /**
   * Search servers with fuzzy matching
   */
  async searchServers(query: string, limit: number = 10): Promise<MCPServerTemplate[]> {
    console.groupCollapsed(`[MCP Library] Searching servers: "${query}"`)
    
    if (!query.trim()) {
      console.log('[MCP Library] Empty query, returning empty results')
      console.groupEnd()
      return []
    }

    const lowerQuery = query.toLowerCase()
    
    // Simple fuzzy matching: prioritize exact matches, then partial matches
    const servers = mcpServerLibraryData
      .map(server => {
        let score = 0
        
        // Exact matches get highest score
        if (server.name.toLowerCase() === lowerQuery) score += 100
        if (server.description.toLowerCase().includes(lowerQuery)) score += 50
        if ((server.tags || []).some(tag => tag.toLowerCase() === lowerQuery)) score += 30
        
        // Partial matches
        if (server.name.toLowerCase().includes(lowerQuery)) score += 20
        if ((server.tags || []).some(tag => tag.toLowerCase().includes(lowerQuery))) score += 10
        
        return { server, score }
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
      .map(item => item.server)

    console.table({
      query,
      results: servers.length,
      limitedTo: limit,
      servers: servers.map(s => ({ name: s.name, score: 'calculated' }))
    })
    console.groupEnd()

    return servers
  }

  /**
   * Get server statistics
   */
  async getStatistics(): Promise<{
    total: number
    byCategory: Record<string, number>
    byDifficulty: Record<string, number>
    averageTags: number
  }> {
    console.log('[MCP Library] Generating statistics')
    
    const byCategory = mcpServerLibraryData.reduce((acc, server) => {
      acc[server.category] = (acc[server.category] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byDifficulty = mcpServerLibraryData.reduce((acc, server) => {
      const difficulty = server.difficulty || 'unknown'
      acc[difficulty] = (acc[difficulty] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const totalTags = mcpServerLibraryData.reduce((sum, server) => sum + (server.tags || []).length, 0)
    const averageTags = totalTags / mcpServerLibraryData.length

    const stats = {
      total: mcpServerLibraryData.length,
      byCategory,
      byDifficulty,
      averageTags: Math.round(averageTags * 100) / 100
    }

    console.table(stats)
    return stats
  }

  /**
   * Clear the cache
   */
  clearCache(): void {
    console.log('[MCP Library] Clearing cache')
    this.cache.clear()
    this.lastCacheCleanup = Date.now()
  }

  private generateCacheKey(options: any): string {
    return JSON.stringify(options)
  }

  private cleanupCache(): void {
    const now = Date.now()
    // Clean up every 10 minutes or if cache is too large
    if (now - this.lastCacheCleanup > 10 * 60 * 1000 || this.cache.size > 100) {
      console.log(`[MCP Library] Cleaning up cache, current size: ${this.cache.size}`)
      
      for (const [key, value] of this.cache.entries()) {
        if (now - value.timestamp > PAGINATION_CONFIG.cacheTimeout) {
          this.cache.delete(key)
        }
      }
      
      this.lastCacheCleanup = now
      console.log(`[MCP Library] Cache size after cleanup: ${this.cache.size}`)
    }
  }
}

// Create and export singleton instance
export const mcpLibrary = new MCPServerLibrary()

// For backward compatibility, export the original array
export { mcpServerLibraryData as mcpServerLibrary }