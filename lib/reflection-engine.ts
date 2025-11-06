import { Tool } from '@/types/tool'
import { Workflow, RuntimeContext } from './runtime-core'
import { telemetry, TelemetryEvent } from './runtime-telemetry'

export interface ReflectionInsight {
  id: string
  type: 'performance' | 'error' | 'usage' | 'optimization' | 'security'
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  context: {
    toolId?: string
    workflowId?: string
    sessionId?: string
    timestamp: number
    duration?: number
  }
  evidence: string[]
  recommendations: string[]
  confidence: number // 0-1
  actionable: boolean
  autoFixable?: boolean
  fixSuggestion?: string
}

export interface ReflectionSession {
  id: string
  timestamp: number
  insights: ReflectionInsight[]
  summary: string
  context: {
    toolCount: number
    workflowCount: number
    recentExecutions: number
    errorRate: number
    avgResponseTime: number
  }
}

export class ReflectionEngine {
  private insights: ReflectionInsight[] = []
  private sessions: ReflectionSession[] = []
  private readonly MAX_INSIGHTS = 1000
  private readonly SESSION_RETENTION_DAYS = 30

  /**
   * Analyze recent telemetry data and generate insights
   */
  async reflectOnRuntime(): Promise<ReflectionSession> {
    console.groupCollapsed('[ReflectionEngine] Starting runtime reflection')
    
    const sessionId = `reflection-${Date.now()}`
    const startTime = Date.now()
    
    try {
      // Collect recent telemetry data
      const recentEvents = telemetry.getRecentEvents(100) // Last 100 events
      const context = this.analyzeRuntimeContext(recentEvents)
      
      console.log(`[ReflectionEngine] Analyzing ${recentEvents.length} events`)
      
      // Generate insights from different perspectives
      const performanceInsights = await this.analyzePerformance(recentEvents, context)
      const errorInsights = await this.analyzeErrors(recentEvents, context)
      const usageInsights = await this.analyzeUsagePatterns(recentEvents, context)
      const optimizationInsights = await this.analyzeOptimizations(recentEvents, context)
      
      const allInsights = [
        ...performanceInsights,
        ...errorInsights,
        ...usageInsights,
        ...optimizationInsights
      ].filter(insight => insight.confidence > 0.3) // Filter low-confidence insights
      
      // Generate AI-powered summary
      const summary = await this.generateSummary(allInsights, context)
      
      const session: ReflectionSession = {
        id: sessionId,
        timestamp: startTime,
        insights: allInsights,
        summary,
        context
      }
      
      this.sessions.push(session)
      this.insights.push(...allInsights)
      
      // Clean up old sessions and insights
      this.cleanupOldData()
      
      console.log(`[ReflectionEngine] Generated ${allInsights.length} insights`)
      console.table({
        performance: performanceInsights.length,
        errors: errorInsights.length,
        usage: usageInsights.length,
        optimizations: optimizationInsights.length,
        total: allInsights.length
      })
      console.groupEnd()
      
      return session
    } catch (error) {
      console.error('[ReflectionEngine] Reflection failed:', error)
      console.groupEnd()
      throw error
    }
  }

  /**
   * Reflect on a specific tool's behavior
   */
  async reflectOnTool(toolId: string, tool: Tool): Promise<ReflectionInsight[]> {
    console.groupCollapsed(`[ReflectionEngine] Reflecting on tool: ${tool.name}`)
    
    const toolEvents = telemetry.getEventsByTool(toolId, 50)
    const insights: ReflectionInsight[] = []
    
    if (toolEvents.length === 0) {
      console.log(`[ReflectionEngine] No telemetry data for tool ${toolId}`)
      console.groupEnd()
      return insights
    }

    // Analyze tool performance
    const performanceData = this.analyzeToolPerformance(toolEvents)
    if (performanceData.hasIssues) {
      insights.push({
        id: `tool-perf-${toolId}-${Date.now()}`,
        type: 'performance',
        severity: performanceData.severity,
        title: `Performance issues detected for ${tool.name}`,
        description: `Tool execution shows ${performanceData.issues.join(', ')}`,
        context: {
          toolId,
          timestamp: Date.now(),
          duration: performanceData.avgDuration
        },
        evidence: performanceData.evidence,
        recommendations: [
          'Consider optimizing the tool implementation',
          'Check for network latency if using external APIs',
          'Review generated code for inefficiencies'
        ],
        confidence: 0.8,
        actionable: true,
        autoFixable: tool.isAiGenerated,
        fixSuggestion: tool.isAiGenerated ? 
          'Use self-correction to optimize the generated code' : 
          'Review and optimize the tool implementation'
      })
    }

    // Analyze error patterns
    const errorData = this.analyzeToolErrors(toolEvents)
    if (errorData.hasErrors) {
      insights.push({
        id: `tool-errors-${toolId}-${Date.now()}`,
        type: 'error',
        severity: errorData.severity,
        title: `Error patterns detected for ${tool.name}`,
        description: `Tool has ${errorData.errorRate.toFixed(1)}% error rate with common issue: ${errorData.commonError}`,
        context: {
          toolId,
          timestamp: Date.now()
        },
        evidence: errorData.evidence,
        recommendations: [
          'Review error logs for root causes',
          'Add better error handling in tool implementation',
          'Consider adding retry logic for transient errors'
        ],
        confidence: 0.9,
        actionable: true,
        autoFixable: tool.isAiGenerated,
        fixSuggestion: tool.isAiGenerated ?
          'Use self-correction to improve error handling' :
          'Implement robust error handling in the tool'
      })
    }

    console.log(`[ReflectionEngine] Generated ${insights.length} insights for tool ${toolId}`)
    console.groupEnd()
    
    return insights
  }

  /**
   * Reflect on workflow execution patterns
   */
  async reflectOnWorkflow(workflowId: string, workflow: Workflow): Promise<ReflectionInsight[]> {
    console.groupCollapsed(`[ReflectionEngine] Reflecting on workflow: ${workflow.name}`)
    
    const workflowEvents = telemetry.getEventsByWorkflow(workflowId, 50)
    const insights: ReflectionInsight[] = []
    
    if (workflowEvents.length === 0) {
      console.log(`[ReflectionEngine] No telemetry data for workflow ${workflowId}`)
      console.groupEnd()
      return insights
    }

    // Analyze workflow performance
    const performanceData = this.analyzeWorkflowPerformance(workflowEvents, workflow)
    if (performanceData.hasBottlenecks) {
      insights.push({
        id: `workflow-perf-${workflowId}-${Date.now()}`,
        type: 'performance',
        severity: performanceData.severity,
        title: `Workflow performance bottlenecks detected`,
        description: `Workflow has slow steps: ${performanceData.bottlenecks.join(', ')}`,
        context: {
          workflowId,
          timestamp: Date.now(),
          duration: performanceData.avgDuration
        },
        evidence: performanceData.evidence,
        recommendations: [
          'Consider parallelizing independent steps',
          'Optimize slow steps with caching',
          'Review step dependencies for optimization opportunities'
        ],
        confidence: 0.7,
        actionable: true
      })
    }

    // Analyze workflow reliability
    const reliabilityData = this.analyzeWorkflowReliability(workflowEvents, workflow)
    if (reliabilityData.hasIssues) {
      insights.push({
        id: `workflow-reliability-${workflowId}-${Date.now()}`,
        type: 'error',
        severity: reliabilityData.severity,
        title: `Workflow reliability issues detected`,
        description: `Workflow fails ${reliabilityData.failureRate.toFixed(1)}% of executions`,
        context: {
          workflowId,
          timestamp: Date.now()
        },
        evidence: reliabilityData.evidence,
        recommendations: [
          'Add error handling for failing steps',
          'Implement retry logic for transient failures',
          'Consider breaking complex workflows into smaller ones'
        ],
        confidence: 0.8,
        actionable: true
      })
    }

    console.log(`[ReflectionEngine] Generated ${insights.length} insights for workflow ${workflowId}`)
    console.groupEnd()
    
    return insights
  }

  /**
   * Get actionable insights that can be automatically fixed
   */
  getAutoFixableInsights(): ReflectionInsight[] {
    return this.insights.filter(insight => 
      insight.autoFixable && 
      insight.actionable && 
      insight.severity === 'high' || insight.severity === 'critical'
    )
  }

  /**
   * Get insights by type and severity
   */
  getInsightsByCriteria(options: {
    type?: ReflectionInsight['type']
    severity?: ReflectionInsight['severity']
    timeframe?: number // hours
    actionableOnly?: boolean
  }): ReflectionInsight[] {
    let filtered = this.insights

    if (options.type) {
      filtered = filtered.filter(insight => insight.type === options.type)
    }

    if (options.severity) {
      filtered = filtered.filter(insight => insight.severity === options.severity)
    }

    if (options.timeframe) {
      const cutoff = Date.now() - (options.timeframe * 60 * 60 * 1000)
      filtered = filtered.filter(insight => insight.context.timestamp >= cutoff)
    }

    if (options.actionableOnly) {
      filtered = filtered.filter(insight => insight.actionable)
    }

    return filtered
  }

  /**
   * Clear old insights and sessions
   */
  private cleanupOldData(): void {
    const cutoff = Date.now() - (this.SESSION_RETENTION_DAYS * 24 * 60 * 60 * 1000)
    
    this.sessions = this.sessions.filter(session => session.timestamp >= cutoff)
    this.insights = this.insights.filter(insight => insight.context.timestamp >= cutoff)
    
    // Limit total insights
    if (this.insights.length > this.MAX_INSIGHTS) {
      this.insights = this.insights.slice(-this.MAX_INSIGHTS)
    }
  }

  private analyzeRuntimeContext(events: TelemetryEvent[]): ReflectionSession['context'] {
    const toolEvents = events.filter(e => e.type === 'tool_execution')
    const workflowEvents = events.filter(e => e.type === 'workflow_execution')
    const errorEvents = events.filter(e => !e.success)
    
    const totalExecutions = toolEvents.length + workflowEvents.length
    const errorRate = totalExecutions > 0 ? (errorEvents.length / totalExecutions) * 100 : 0
    
    const responseTimes = [
      ...toolEvents.map(e => e.duration || 0),
      ...workflowEvents.map(e => e.duration || 0)
    ].filter(t => t > 0)
    
    const avgResponseTime = responseTimes.length > 0 ? 
      responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0

    return {
      toolCount: new Set(toolEvents.map(e => e.toolId)).size,
      workflowCount: new Set(workflowEvents.map(e => e.workflowId)).size,
      recentExecutions: totalExecutions,
      errorRate,
      avgResponseTime
    }
  }

  private async analyzePerformance(events: TelemetryEvent[], context: any): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = []
    
    // Analyze slow tools
    const toolEvents = events.filter(e => e.type === 'tool_execution' && e.duration)
    const slowTools = toolEvents.filter(e => e.duration! > 5000) // 5 seconds threshold
    
    if (slowTools.length > 0) {
      const slowToolIds = [...new Set(slowTools.map(e => e.toolId))].slice(0, 3)
      
      insights.push({
        id: `perf-slow-tools-${Date.now()}`,
        type: 'performance',
        severity: slowTools.length > 5 ? 'high' : 'medium',
        title: 'Slow tools detected',
        description: `${slowTools.length} tool executions exceeded 5-second threshold`,
        context: { timestamp: Date.now() },
        evidence: slowToolIds.map(id => `Tool ${id} has slow executions`),
        recommendations: [
          'Optimize slow tool implementations',
          'Consider adding caching for expensive operations',
          'Review network calls for latency issues'
        ],
        confidence: 0.8,
        actionable: true
      })
    }

    // Analyze high error rate
    if (context.errorRate > 10) {
      insights.push({
        id: `perf-high-error-rate-${Date.now()}`,
        type: 'performance',
        severity: context.errorRate > 20 ? 'critical' : 'high',
        title: 'High error rate detected',
        description: `System has ${context.errorRate.toFixed(1)}% error rate`,
        context: { timestamp: Date.now() },
        evidence: [`Overall error rate: ${context.errorRate.toFixed(1)}%`],
        recommendations: [
          'Investigate root causes of failures',
          'Improve error handling in tools and workflows',
          'Consider implementing circuit breakers for failing components'
        ],
        confidence: 0.9,
        actionable: true
      })
    }

    return insights
  }

  private async analyzeErrors(events: TelemetryEvent[], context: any): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = []
    const errorEvents = events.filter(e => !e.success)
    
    if (errorEvents.length === 0) return insights

    // Group errors by type
    const errorTypes = new Map<string, number>()
    errorEvents.forEach(event => {
      const errorKey = event.error || 'Unknown error'
      errorTypes.set(errorKey, (errorTypes.get(errorKey) || 0) + 1)
    })

    // Create insights for common errors
    const commonErrors = Array.from(errorTypes.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)

    commonErrors.forEach(([error, count]) => {
      insights.push({
        id: `error-common-${Date.now()}-${error.substring(0, 20)}`,
        type: 'error',
        severity: count > 5 ? 'high' : 'medium',
        title: `Frequent error: ${error.substring(0, 50)}`,
        description: `This error occurred ${count} times in recent executions`,
        context: { timestamp: Date.now() },
        evidence: [`Error pattern: ${error}`, `Occurrences: ${count}`],
        recommendations: [
          'Investigate the root cause of this error',
          'Add specific error handling for this case',
          'Consider adding retry logic for transient errors'
        ],
        confidence: 0.7,
        actionable: true
      })
    })

    return insights
  }

  private async analyzeUsagePatterns(events: TelemetryEvent[], context: any): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = []
    
    // Analyze tool usage distribution
    const toolEvents = events.filter(e => e.type === 'tool_execution')
    const toolUsage = new Map<string, number>()
    
    toolEvents.forEach(event => {
      if (event.toolId) {
        toolUsage.set(event.toolId, (toolUsage.get(event.toolId) || 0) + 1)
      }
    })

    const usageArray = Array.from(toolUsage.entries()).sort((a, b) => b[1] - a[1])
    
    if (usageArray.length > 0) {
      const mostUsed = usageArray[0]
      const leastUsed = usageArray[usageArray.length - 1]
      
      if (mostUsed[1] > leastUsed[1] * 10) { // Significant imbalance
        insights.push({
          id: `usage-imbalance-${Date.now()}`,
          type: 'usage',
          severity: 'low',
          title: 'Tool usage imbalance detected',
          description: `Tool ${mostUsed[0]} is used ${mostUsed[1]} times while ${leastUsed[0]} is used only ${leastUsed[1]} times`,
          context: { timestamp: Date.now() },
          evidence: [
            `Most used: ${mostUsed[0]} (${mostUsed[1]} executions)`,
            `Least used: ${leastUsed[0]} (${leastUsed[1]} executions)`
          ],
          recommendations: [
            'Consider if underused tools can be deprecated',
            'Evaluate if overused tools need scaling optimization',
            'Review tool documentation and discoverability'
          ],
          confidence: 0.6,
          actionable: true
        })
      }
    }

    return insights
  }

  private async analyzeOptimizations(events: TelemetryEvent[], context: any): Promise<ReflectionInsight[]> {
    const insights: ReflectionInsight[] = []
    
    // Suggest optimizations based on patterns
    if (context.avgResponseTime > 1000) {
      insights.push({
        id: `opt-slow-system-${Date.now()}`,
        type: 'optimization',
        severity: 'medium',
        title: 'System response time optimization opportunity',
        description: `Average response time is ${context.avgResponseTime.toFixed(0)}ms`,
        context: { timestamp: Date.now() },
        evidence: [`Average response time: ${context.avgResponseTime.toFixed(0)}ms`],
        recommendations: [
          'Implement caching for frequently used data',
          'Optimize database queries and API calls',
          'Consider parallelizing independent operations'
        ],
        confidence: 0.7,
        actionable: true
      })
    }

    return insights
  }

  private async generateSummary(insights: ReflectionInsight[], context: any): Promise<string> {
    const criticalInsights = insights.filter(i => i.severity === 'critical')
    const highInsights = insights.filter(i => i.severity === 'high')
    
    if (criticalInsights.length > 0) {
      return `Critical issues detected: ${criticalInsights.length} critical and ${highInsights.length} high severity insights. Immediate attention recommended.`
    } else if (highInsights.length > 0) {
      return `System health: ${highInsights.length} high severity insights requiring review. ${insights.length} total insights generated.`
    } else {
      return `System operating normally. ${insights.length} optimization and monitoring insights generated.`
    }
  }

  private analyzeToolPerformance(events: TelemetryEvent[]): any {
    const durations = events.filter(e => e.duration).map(e => e.duration!)
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    const maxDuration = Math.max(...durations, 0)
    
    const issues: string[] = []
    const evidence: string[] = []
    
    if (avgDuration > 2000) issues.push('slow average response time')
    if (maxDuration > 10000) issues.push('very slow maximum response time')
    
    if (avgDuration > 0) evidence.push(`Average duration: ${avgDuration.toFixed(0)}ms`)
    if (maxDuration > 0) evidence.push(`Max duration: ${maxDuration}ms`)
    
    return {
      hasIssues: issues.length > 0,
      issues,
      severity: maxDuration > 10000 ? 'high' : avgDuration > 2000 ? 'medium' : 'low',
      avgDuration,
      maxDuration,
      evidence
    }
  }

  private analyzeToolErrors(events: TelemetryEvent[]): any {
    const errorEvents = events.filter(e => !e.success)
    const totalEvents = events.length
    const errorRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0
    
    const errorMessages = errorEvents.map(e => e.error || 'Unknown error')
    const commonError = errorMessages.length > 0 ? 
      errorMessages.reduce((a, b, i, arr) => 
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b, '') : 'No errors'
    
    return {
      hasErrors: errorEvents.length > 0,
      errorRate,
      commonError,
      severity: errorRate > 20 ? 'high' : errorRate > 10 ? 'medium' : 'low',
      evidence: [
        `Error rate: ${errorRate.toFixed(1)}%`,
        `Total errors: ${errorEvents.length}`,
        `Most common error: ${commonError.substring(0, 100)}`
      ]
    }
  }

  private analyzeWorkflowPerformance(events: TelemetryEvent[], workflow: Workflow): any {
    const durations = events.filter(e => e.duration).map(e => e.duration!)
    const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0
    
    // Simple bottleneck detection - in a real implementation, this would analyze step-level timing
    const bottlenecks: string[] = []
    if (avgDuration > 30000) bottlenecks.push('overall workflow duration')
    
    return {
      hasBottlenecks: bottlenecks.length > 0,
      bottlenecks,
      severity: avgDuration > 60000 ? 'high' : avgDuration > 30000 ? 'medium' : 'low',
      avgDuration,
      evidence: [
        `Average workflow duration: ${avgDuration.toFixed(0)}ms`,
        `Workflow steps: ${workflow.steps.length}`
      ]
    }
  }

  private analyzeWorkflowReliability(events: TelemetryEvent[], workflow: Workflow): any {
    const errorEvents = events.filter(e => !e.success)
    const totalEvents = events.length
    const failureRate = totalEvents > 0 ? (errorEvents.length / totalEvents) * 100 : 0
    
    return {
      hasIssues: failureRate > 0,
      failureRate,
      severity: failureRate > 20 ? 'high' : failureRate > 10 ? 'medium' : 'low',
      evidence: [
        `Workflow failure rate: ${failureRate.toFixed(1)}%`,
        `Total failures: ${errorEvents.length}`,
        `Total executions: ${totalEvents}`
      ]
    }
  }
}

// Export singleton instance
export const reflectionEngine = new ReflectionEngine()