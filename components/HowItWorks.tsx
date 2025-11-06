import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  Database, 
  Terminal, 
  CheckCircle,
  Lightning,
  NumberCircleOne,
  NumberCircleTwo,
  NumberCircleThree,
  NumberCircleFour,
  ArrowsClockwise,
  GlobeHemisphereWest
} from '@phosphor-icons/react'
import { motion } from 'framer-motion'

export function HowItWorks() {
  return (
    <div className="space-y-12">
      <section className="text-center max-w-3xl mx-auto">
        <Badge className="mb-4" variant="outline">Understanding MCP</Badge>
        <h2 className="text-3xl font-semibold mb-4">What is Model Context Protocol?</h2>
        <p className="text-muted-foreground leading-relaxed">
          Model Context Protocol (MCP) is a standardized way for AI models to communicate with external tools and data sources. 
          Think of it as a universal adapter that lets AI assistants securely access databases, APIs, files, and services 
          to provide more accurate, up-to-date, and contextual responses.
        </p>
      </section>

      <section className="max-w-5xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-center">The Three Components</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Brain size={24} className="text-primary" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg">AI Models</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Local or cloud AI models (like GPT, Claude, or Llama) that need access to external capabilities beyond their training data.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-accent/10">
                  <ArrowsClockwise size={24} className="text-accent" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg">MCP Protocol</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                A standardized way for AI models to discover, communicate with, and use external tools through defined endpoints and parameters.
              </p>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="p-6 h-full">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-3 rounded-lg bg-secondary/10">
                  <Lightning size={24} className="text-secondary" weight="fill" />
                </div>
                <h3 className="font-semibold text-lg">Tools & APIs</h3>
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                External capabilities like databases, web APIs, file systems, or custom services that extend what AI can do.
              </p>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-center">Using This Hub</h3>
        <div className="space-y-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="p-6">
              <div className="flex gap-4">
                <NumberCircleOne size={32} className="text-primary flex-shrink-0" weight="fill" />
                <div>
                  <h4 className="font-semibold mb-2">Add Your Tools</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Click "Add Tool" to create entries for databases, APIs, or services you want your AI to access. 
                    Categorize them (Code, Data, Web, etc.) and add descriptions so you know what each tool does.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="p-6">
              <div className="flex gap-4">
                <NumberCircleTwo size={32} className="text-primary flex-shrink-0" weight="fill" />
                <div>
                  <h4 className="font-semibold mb-2">Configure Connections</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Set up endpoints, API keys, and parameters for each tool. This hub stores your configuration 
                    securely in your browser, so you can easily manage and reference connection details.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="p-6">
              <div className="flex gap-4">
                <NumberCircleThree size={32} className="text-primary flex-shrink-0" weight="fill" />
                <div>
                  <h4 className="font-semibold mb-2">Test & Verify</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Use the built-in endpoint tester to verify connections work correctly. Send test requests, 
                    view responses, and debug issues before integrating with your AI workflow.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.7 }}
          >
            <Card className="p-6">
              <div className="flex gap-4">
                <NumberCircleFour size={32} className="text-primary flex-shrink-0" weight="fill" />
                <div>
                  <h4 className="font-semibold mb-2">Enable & Use</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Enable tools when ready to use. Your AI can then reference these configured tools 
                    to access external data, run queries, fetch files, or interact with services on your behalf.
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </section>

      <section className="max-w-3xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-center">Tool Categories</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { name: 'Code', icon: Terminal, desc: 'Git, IDEs, linters' },
            { name: 'Data', icon: Database, desc: 'Databases, analytics' },
            { name: 'Web', icon: GlobeHemisphereWest, desc: 'APIs, webhooks' },
            { name: 'AI', icon: Brain, desc: 'ML models, embeddings' },
          ].map((category, i) => {
            const Icon = category.icon
            return (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 + i * 0.1 }}
              >
                <Card className="p-4 text-center">
                  <Icon size={28} className="mx-auto mb-2 text-primary" weight="fill" />
                  <h4 className="font-medium mb-1">{category.name}</h4>
                  <p className="text-xs text-muted-foreground">{category.desc}</p>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </section>

      <section className="max-w-4xl mx-auto">
        <h3 className="text-2xl font-semibold mb-6 text-center">Popular MCP Servers</h3>
        <p className="text-center text-muted-foreground mb-6">
          Browse our MCP Library tab to explore and add popular servers with a single click
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <Card className="p-5">
            <h4 className="font-semibold mb-2">Cloudflare MCP</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Access Cloudflare Workers, KV storage, and other Cloudflare services
            </p>
            <Badge variant="secondary" className="text-xs">Commercial</Badge>
          </Card>

          <Card className="p-5">
            <h4 className="font-semibold mb-2">MCP Filesystem Server</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Secure file operations (read/write/search) for AI agents
            </p>
            <Badge variant="secondary" className="text-xs">Official</Badge>
          </Card>

          <Card className="p-5">
            <h4 className="font-semibold mb-2">MCP Git Tools</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Read, search, and manipulate Git repositories through MCP
            </p>
            <Badge variant="secondary" className="text-xs">Official</Badge>
          </Card>

          <Card className="p-5">
            <h4 className="font-semibold mb-2">MCP Memory Server</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Persistent knowledge graph and context for AI agents
            </p>
            <Badge variant="secondary" className="text-xs">Official</Badge>
          </Card>
        </div>
        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Visit the <strong className="text-foreground">MCP Library</strong> tab to explore 16+ MCP servers
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto">
        <Card className="p-8 bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="flex items-start gap-4">
            <CheckCircle size={32} className="text-accent flex-shrink-0" weight="fill" />
            <div>
              <h3 className="text-xl font-semibold mb-3">Why Use MCP?</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-foreground">Real-time Data:</strong> AI can access current information beyond its training cutoff</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-foreground">Automation:</strong> Connect AI to your tools and workflows for intelligent automation</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-foreground">Customization:</strong> Tailor AI capabilities to your specific use case and data sources</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5">•</span>
                  <span><strong className="text-foreground">Privacy:</strong> Keep sensitive data local while still enabling AI interactions</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>
      </section>
    </div>
  )
}
