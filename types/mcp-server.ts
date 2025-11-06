export type HealthStatus = 'healthy' | 'unhealthy' | 'unknown' | 'checking'

export interface MCPServerTemplate {
  id: string
  name: string
  description: string
  category: 'official' | 'community' | 'commercial'
  endpoint?: string
  githubUrl?: string
  documentation?: string
  features: string[]
  requiresAuth: boolean
  localOnly?: boolean
  setupInstructions?: string
  version?: string
  lastUpdated?: string
  troubleshooting?: string[]
  tags?: string[]
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  installCommand?: string
  health?: HealthStatus
  healthCheckedAt?: number
  healthResponseTime?: number
}
