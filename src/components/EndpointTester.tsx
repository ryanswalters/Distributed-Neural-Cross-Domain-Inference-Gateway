import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PlayCircle, CircleNotch, CheckCircle, XCircle } from '@phosphor-icons/react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

interface EndpointTesterProps {
  initialEndpoint?: string
  initialApiKey?: string
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'

interface TestResult {
  status: number
  statusText: string
  data: unknown
  headers: Record<string, string>
  duration: number
}

export function EndpointTester({ initialEndpoint = '', initialApiKey = '' }: EndpointTesterProps) {
  const [endpoint, setEndpoint] = useState(initialEndpoint)
  const [method, setMethod] = useState<HttpMethod>('GET')
  const [apiKey, setApiKey] = useState(initialApiKey)
  const [body, setBody] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<TestResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleTest = async () => {
    if (!endpoint.trim()) {
      toast.error('Please enter an endpoint URL')
      return
    }

    setIsLoading(true)
    setError(null)
    setResult(null)

    const startTime = performance.now()

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      if (apiKey) {
        headers['Authorization'] = `Bearer ${apiKey}`
      }

      const options: RequestInit = {
        method,
        headers,
      }

      if ((method === 'POST' || method === 'PUT') && body) {
        try {
          JSON.parse(body)
          options.body = body
        } catch (e) {
          setError('Invalid JSON in request body')
          setIsLoading(false)
          return
        }
      }

      const response = await fetch(endpoint, options)
      const duration = performance.now() - startTime

      const responseHeaders: Record<string, string> = {}
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value
      })

      let data: unknown
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        data = await response.json()
      } else {
        data = await response.text()
      }

      setResult({
        status: response.status,
        statusText: response.statusText,
        data,
        headers: responseHeaders,
        duration: Math.round(duration),
      })

      if (response.ok) {
        toast.success('Request successful')
      } else {
        toast.error(`Request failed with status ${response.status}`)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
      toast.error(`Request failed: ${message}`)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <div className="w-32">
          <Select value={method} onValueChange={(value) => setMethod(value as HttpMethod)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="GET">GET</SelectItem>
              <SelectItem value="POST">POST</SelectItem>
              <SelectItem value="PUT">PUT</SelectItem>
              <SelectItem value="DELETE">DELETE</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Input
          placeholder="http://localhost:3000/api or https://api.example.com"
          value={endpoint}
          onChange={(e) => setEndpoint(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleTest} disabled={isLoading} className="flex items-center gap-2">
          {isLoading ? (
            <CircleNotch size={18} className="animate-spin" />
          ) : (
            <PlayCircle size={18} weight="fill" />
          )}
          Test
        </Button>
      </div>

      <div className="space-y-2">
        <Label htmlFor="api-key">API Key / Authorization (Optional)</Label>
        <Input
          id="api-key"
          type="password"
          placeholder="Your API key"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
        />
      </div>

      {(method === 'POST' || method === 'PUT') && (
        <div className="space-y-2">
          <Label htmlFor="request-body">Request Body (JSON)</Label>
          <Textarea
            id="request-body"
            placeholder='{"query": "SELECT * FROM users"}'
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={4}
            className="font-mono text-sm"
          />
        </div>
      )}

      {error && (
        <Card className="p-4 border-destructive bg-destructive/5">
          <div className="flex items-start gap-2">
            <XCircle size={20} className="text-destructive flex-shrink-0 mt-0.5" weight="fill" />
            <div>
              <p className="font-medium text-destructive">Error</p>
              <p className="text-sm text-destructive/90 mt-1">{error}</p>
            </div>
          </div>
        </Card>
      )}

      {result && (
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            {result.status >= 200 && result.status < 300 ? (
              <CheckCircle size={20} className="text-green-600" weight="fill" />
            ) : (
              <XCircle size={20} className="text-destructive" weight="fill" />
            )}
            <div className="flex-1">
              <p className="font-medium">
                {result.status} {result.statusText}
              </p>
              <p className="text-xs text-muted-foreground">Response time: {result.duration}ms</p>
            </div>
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Response Data</p>
              <div className="bg-muted rounded-md p-3 max-h-64 overflow-auto">
                <pre className="text-xs font-mono">
                  {typeof result.data === 'string'
                    ? result.data
                    : JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            </div>

            <details className="group">
              <summary className="text-sm font-medium cursor-pointer list-none flex items-center gap-2">
                <span className="transition-transform group-open:rotate-90">▶</span>
                Response Headers
              </summary>
              <div className="bg-muted rounded-md p-3 mt-2 max-h-48 overflow-auto">
                <pre className="text-xs font-mono">
                  {JSON.stringify(result.headers, null, 2)}
                </pre>
              </div>
            </details>
          </div>
        </Card>
      )}
    </div>
  )
}
