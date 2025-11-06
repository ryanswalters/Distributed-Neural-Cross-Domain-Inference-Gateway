import { Tool } from '@/types/tool'
import { Workflow } from './middleware-runtime'


const STORAGE_KEYS = {
TOOLS: 'mcp-hub-tools',
WORKFLOWS: 'mcp-hub-workflows',
SETTINGS: 'mcp-hub-settings'
} as const


export const storage = {
async getTools(): Promise<Tool[]> {
try {
    const data = await window.spark.kv.get(STORAGE_KEYS.TOOLS)
    return data || []
} catch {
    return []
}
},

async saveTool(tool: Tool): Promise<void> {
const tools = await this.getTools()
const index = tools.findIndex(t => t.id === tool.id)

if (index >= 0) {
    tools[index] = tool
} else {
    tools.push(tool)
}

await window.spark.kv.set(STORAGE_KEYS.TOOLS, tools)
},

async deleteTool(toolId: string): Promise<void> {
const tools = await this.getTools()
const filtered = tools.filter(t => t.id !== toolId)
await window.spark.kv.set(STORAGE_KEYS.TOOLS, filtered)
},

async getWorkflows(): Promise<Workflow[]> {
try {
    const data = await window.spark.kv.get(STORAGE_KEYS.WORKFLOWS)
    return data || []
} catch {
    return []
}
},

async saveWorkflow(workflow: Workflow): Promise<void> {
const workflows = await this.getWorkflows()
const index = workflows.findIndex(w => w.id === workflow.id)

if (index >= 0) {
    workflows[index] = workflow
} else {
    workflows.push(workflow)
}

await window.spark.kv.set(STORAGE_KEYS.WORKFLOWS, workflows)
},

async deleteWorkflow(workflowId: string): Promise<void> {
const workflows = await this.getWorkflows()
const filtered = workflows.filter(w => w.id !== workflowId)
await window.spark.kv.set(STORAGE_KEYS.WORKFLOWS, filtered)
},

async exportData(): Promise<string> {
const tools = await this.getTools()
const workflows = await this.getWorkflows()

return JSON.stringify({
    version: '1.0',
    exportedAt: Date.now(),
    tools,
    workflows
}, null, 2)
},

async importData(jsonString: string): Promise<{ tools: number; workflows: number }> {
const data = JSON.parse(jsonString)

if (data.tools) {
    await window.spark.kv.set(STORAGE_KEYS.TOOLS, data.tools)
}

if (data.workflows) {
    await window.spark.kv.set(STORAGE_KEYS.WORKFLOWS, data.workflows)
}

return {
    tools: data.tools?.length || 0,
    workflows: data.workflows?.length || 0
}
}
}
