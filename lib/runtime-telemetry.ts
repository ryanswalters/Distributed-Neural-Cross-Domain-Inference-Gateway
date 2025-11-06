import { Tool } from '@/types/tool'

export interface TelemetryEvent {
  id: string
  type: 'tool_execution' | 'workflow_execution' | 'self_correction' | 'performance_regression'
  timestamp: number
  sessionId: string
  toolId?: string
  workflowId?: string
  duration: number
  success: boolean
  error?: string
  metadata: Record<string, any>
}

export interface PerformanceBaseline {
  toolId: string
  averageDuration: number
  p50: number
  p95: number
  p99: number
  totalExecutions: number
  successRate: number
  lastUpdated: number
  trend: 'improving' | 'stable' | 'regressing'
  trendPercentage: number
}

export interface SelfCorrectionRecord {
  toolId: string
  originalCodeHash: string
  newCodeHash: string
  directive: string
  changes: string
  securityImprovements: string[]
  newFeatures: string[]
  timestamp: number
  stabilityImpact?: number
  performanceImpact?: number
}

export class RuntimeTelemetry {
  private events: TelemetryEvent[] = []
  private baselines: Map<string, PerformanceBaseline> = new Map()
  private selfCorrections: SelfCorrectionRecord[] = []
  private readonly MAX_EVENTS = 10000
  private readonly BASELINE_WINDOW_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

  /**
   * Record a telemetry event
   */
  recordEvent(event: Omit<TelemetryEvent, 'id' | 'timestamp'>): void {
    const fullEvent: TelemetryEvent = {
      ...event,
      id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    }

    this.events.push(fullEvent)

    // Maintain event limit
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS)
    }

    // Update performance baselines for tool executions
    if (event.type === 'tool_execution' && event.toolId) {
      this.updatePerformanceBaseline(event.toolId, fullEvent)
    }

    console.groupCollapsed(`[Telemetry] Recorded ${event.type}`)
    console.table({
      type: event.type,
      toolId: event.toolId,
      workflowId: event.workflowId,
      duration: `${event.duration}ms`,
      success: event.success,
      timestamp: new Date(fullEvent.timestamp).toISOString()
    })
    console.groupEnd()
  }

  /**
   * Update performance baseline for a tool
   */
  private updatePerformanceBaseline(toolId: string, event: TelemetryEvent): void {
    const recentEvents = this.getRecentToolEvents(toolId)
    const durations = recentEvents.map(e => e.duration).sort((a, b) => a - b)
    
    if (durations.length === 0) return

    const average = durations.reduce((sum, d) => sum + d, 0) / durations.length
    const p50 = this.percentile(durations, 50)
    const p95 = this.percentile(durations, 95)
    const p99 = this.percentile(durations, 99)
    
    const successRate = recentEvents.filter(e => e.success).length / recentEvents.length

    const previousBaseline = this.baselines.get(toolId)
    let trend: 'improving' | 'stable' | 'regressing' = 'stable'
    let trendPercentage = 0

    if (previousBaseline) {
      trendPercentage = ((previousBaseline.averageDuration - average) / previousBaseline.averageDuration) * 100
      
      if (trendPercentage > 10) {
        trend = 'improving'
      } else if (trendPercentage < -10) {
        trend = 'regressing'
        
        // Log performance regression
        console.warn(`[Telemetry] Performance regression detected for tool ${toolId}: ${trendPercentage.toFixed(2)}%`)
        this.recordEvent({
          type: 'performance_regression',
          sessionId: event.sessionId,
          toolId,
          duration: average,
          success: true,
          metadata: {
            previousAverage: previousBaseline.averageDuration,
            currentAverage: average,
            trendPercentage,
            totalExecutions: recentEvents.length
          }
        })
      }
    }

    const baseline: PerformanceBaseline = {
      toolId,
      averageDuration: average,
      p50,
      p95,
      p99,
      totalExecutions: recentEvents.length,
      successRate,
      lastUpdated: Date.now(),
      trend,
      trendPercentage
    }

    this.baselines.set(toolId, baseline)

    console.groupCollapsed(`[Telemetry] Updated baseline for ${toolId}`)
    console.table({
      averageDuration: `${average.toFixed(2)}ms`,
      p50: `${p50.toFixed(2)}ms`,
      p95: `${p95.toFixed(2)}ms`,
      p99: `${p99.toFixed(2)}ms`,
      successRate: `${(successRate * 100).toFixed(1)}%`,
      trend,
      trendPercentage: `${trendPercentage.toFixed(2)}%`,
      sampleSize: recentEvents.length
    })
    console.groupEnd()
  }

  /**
   * Record a self-correction event
   */
  recordSelfCorrection(record: Omit<SelfCorrectionRecord, 'timestamp'>): void {
    const fullRecord: SelfCorrectionRecord = {
      ...record,
      timestamp: Date.now()
    }

    this.selfCorrections.push(fullRecord)

    // Calculate impact metrics
    this.calculateCorrectionImpact(fullRecord)

    console.groupCollapsed(`[Telemetry] Recorded self-correction for ${record.toolId}`)
    console.table({
      toolId: record.toolId,
      changes: record.changes,
      securityImprovements: record.securityImprovements.length,
      newFeatures: record.newFeatures.length,
      stabilityImpact: fullRecord.stabilityImpact ? `${fullRecord.stabilityImpact}%` : 'Calculating...',
      performanceImpact: fullRecord.performanceImpact ? `${fullRecord.performanceImpact}%` : 'Calculating...'
    })
    console.groupEnd()
  }

  /**
   * Calculate the impact of a self-correction
   */
  private calculateCorrectionImpact(record: SelfCorrectionRecord): void {
    // Get events before and after correction for this tool
    const beforeEvents = this.events.filter(e => 
      e.toolId === record.toolId && 
      e.timestamp < record.timestamp &&
      e.type === 'tool_execution'
    )

    const afterEvents = this.events.filter(e => 
      e.toolId === record.toolId && 
      e.timestamp >= record.timestamp &&
      e.type === 'tool_execution'
    )

    if (beforeEvents.length > 5 && afterEvents.length > 5) {
      const beforeSuccessRate = beforeEvents.filter(e => e.success).length / beforeEvents.length
      const afterSuccessRate = afterEvents.filter(e => e.success).length / afterEvents.length
      
      const beforeAvgDuration = beforeEvents.reduce((sum, e) => sum + e.duration, 0) / beforeEvents.length
      const afterAvgDuration = afterEvents.reduce((sum, e) => sum + e.duration, 0) / afterEvents.length

      record.stabilityImpact = ((afterSuccessRate - beforeSuccessRate) / beforeSuccessRate) * 100
      record.performanceImpact = ((beforeAvgDuration - afterAvgDuration) / beforeAvgDuration) * 100
    }
  }

  /**
   * Get performance report for a tool
   */
  getToolPerformance(toolId: string): PerformanceBaseline | null {
    const baseline = this.baselines.get(toolId)
    if (!baseline) return null

    const recentEvents = this.getRecentToolEvents(toolId)
    const currentSuccessRate = recentEvents.filter(e => e.success).length / recentEvents.length

    return {
      ...baseline,
      successRate: currentSuccessRate
    }
  }

  /**
   * Get overall system health report
   */
  getSystemHealth(): {
    totalTools: number
    averageSuccessRate: number
    regressingTools: number
    mostImprovedTools: Array<{ toolId: string; improvement: number }>
    recentSelfCorrections: number
  } {
    const toolIds = Array.from(this.baselines.keys())
    const regressingTools = toolIds.filter(id => {
      const baseline = this.baselines.get(id)!
      return baseline.trend === 'regressing'
    })

    const mostImprovedTools = toolIds
      .map(id => {
        const baseline = this.baselines.get(id)!
        return { toolId: id, improvement: baseline.trendPercentage }
      })
      .filter(tool => tool.improvement > 0)
      .sort((a, b) => b.improvement - a.improvement)
      .slice(0, 5)

    const recentSelfCorrections = this.selfCorrections.filter(
      sc => Date.now() - sc.timestamp < this.BASELINE_WINDOW_MS
    ).length

    const averageSuccessRate = toolIds.length > 0 
      ? toolIds.reduce((sum, id) => sum + (this.baselines.get(id)?.successRate || 0), 0) / toolIds.length
      : 0

    return {
      totalTools: toolIds.length,
      averageSuccessRate,
      regressingTools: regressingTools.length,
      mostImprovedTools,
      recentSelfCorrections
    }
  }

  /**
   * Get self-correction effectiveness report
   */
  getSelfCorrectionEffectiveness(): {
    totalCorrections: number
    averageStabilityImpact: number
    averagePerformanceImpact: number
    mostEffectiveCorrections: Array<SelfCorrectionRecord & { effectivenessScore: number }>
  } {
    const effectiveCorrections = this.selfCorrections.filter(
      sc => sc.stabilityImpact !== undefined && sc.performanceImpact !== undefined
    )

    const averageStabilityImpact = effectiveCorrections.length > 0
      ? effectiveCorrections.reduce((sum, sc) => sum + (sc.stabilityImpact || 0), 0) / effectiveCorrections.length
      : 0

    const averagePerformanceImpact = effectiveCorrections.length > 0
      ? effectiveCorrections.reduce((sum, sc) => sum + (sc.performanceImpact || 0), 0) / effectiveCorrections.length
      : 0

    const mostEffectiveCorrections = effectiveCorrections
      .map(sc => ({
        ...sc,
        effectivenessScore: ((sc.stabilityImpact || 0) + (sc.performanceImpact || 0)) / 2
      }))
      .sort((a, b) => b.effectivenessScore - a.effectivenessScore)
      .slice(0, 5)

    return {
      totalCorrections: this.selfCorrections.length,
      averageStabilityImpact,
      averagePerformanceImpact,
      mostEffectiveCorrections
    }
  }

  /**
   * Export telemetry data for analysis
   */
  exportData(): {
    events: TelemetryEvent[]
    baselines: PerformanceBaseline[]
    selfCorrections: SelfCorrectionRecord[]
    summary: {
      totalEvents: number
      timeRange: { start: number; end: number }
      toolsTracked: number
    }
  } {
    const startTime = this.events.length > 0 ? Math.min(...this.events.map(e => e.timestamp)) : Date.now()
    const endTime = this.events.length > 0 ? Math.max(...this.events.map(e => e.timestamp)) : Date.now()

    return {
      events: [...this.events],
      baselines: Array.from(this.baselines.values()),
      selfCorrections: [...this.selfCorrections],
      summary: {
        totalEvents: this.events.length,
        timeRange: { start: startTime, end: endTime },
        toolsTracked: this.baselines.size
      }
    }
  }

  /**
   * Clear old data to manage memory
   */
  cleanupOldData(): void {
    const cutoffTime = Date.now() - this.BASELINE_WINDOW_MS
    
    this.events = this.events.filter(event => event.timestamp > cutoffTime)
    
    // Remove baselines for tools with no recent events
    for (const [toolId, baseline] of this.baselines.entries()) {
      const recentEvents = this.getRecentToolEvents(toolId)
      if (recentEvents.length === 0) {
        this.baselines.delete(toolId)
      }
    }

    this.selfCorrections = this.selfCorrections.filter(sc => sc.timestamp > cutoffTime)

    console.log(`[Telemetry] Cleaned up data older than ${new Date(cutoffTime).toISOString()}`)
  }

  private getRecentToolEvents(toolId: string): TelemetryEvent[] {
    const cutoffTime = Date.now() - this.BASELINE_WINDOW_MS
    return this.events.filter(e => 
      e.toolId === toolId && 
      e.type === 'tool_execution' && 
      e.timestamp > cutoffTime
    )
  }

  private percentile(arr: number[], p: number): number {
    if (arr.length === 0) return 0
    const index = (p / 100) * (arr.length - 1)
    const lower = Math.floor(index)
    const upper = Math.ceil(index)
    
    if (lower === upper) return arr[lower]
    
    return arr[lower] + (arr[upper] - arr[lower]) * (index - lower)
  }
}

// Create and export singleton instance
export const telemetry = new RuntimeTelemetry()