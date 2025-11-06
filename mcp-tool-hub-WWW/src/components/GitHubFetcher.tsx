import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'
import { GithubLogo, CircleNotch, CheckCircle, XCircle, File, Folder } from '@phosphor-icons/react'
import { toast } from 'sonner'

interface GitHubFile {
  name: string
  path: string
  type: 'file' | 'dir'
  content?: string
  download_url?: string
  html_url: string
}

export function GitHubFetcher() {
  const [repoUrl, setRepoUrl] = useState('')
  const [filePath, setFilePath] = useState('')
  const [githubToken, setGithubToken] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [files, setFiles] = useState<GitHubFile[]>([])
  const [selectedFile, setSelectedFile] = useState<GitHubFile | null>(null)
  const [fileContent, setFileContent] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const parseRepoUrl = (url: string) => {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/)
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') }
    }
    return null
  }

  const handleFetch = async () => {
    if (!repoUrl.trim()) {
      toast.error('Please enter a GitHub repository URL')
      return
    }

    const parsed = parseRepoUrl(repoUrl)
    if (!parsed) {
      toast.error('Invalid GitHub URL format')
      return
    }

    setIsLoading(true)
    setError(null)
    setFiles([])
    setSelectedFile(null)
    setFileContent(null)

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      }

      if (githubToken) {
        headers.Authorization = `Bearer ${githubToken}`
      }

      const apiUrl = `https://api.github.com/repos/${parsed.owner}/${parsed.repo}/contents/${filePath}`
      const response = await fetch(apiUrl, { headers })

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Repository or path not found')
        } else if (response.status === 403) {
          throw new Error('Rate limit exceeded. Please add a GitHub token.')
        } else {
          throw new Error(`GitHub API error: ${response.statusText}`)
        }
      }

      const data = await response.json()

      if (Array.isArray(data)) {
        setFiles(data)
        toast.success(`Found ${data.length} items`)
      } else if (data.type === 'file') {
        const fileData: GitHubFile = {
          name: data.name,
          path: data.path,
          type: 'file',
          download_url: data.download_url,
          html_url: data.html_url,
        }

        if (data.content) {
          fileData.content = atob(data.content)
        }

        setSelectedFile(fileData)
        setFileContent(fileData.content || null)
        toast.success('File loaded')
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(message)
      toast.error(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileClick = async (file: GitHubFile) => {
    if (file.type === 'dir') {
      setFilePath(file.path)
      return
    }

    setIsLoading(true)
    setSelectedFile(file)
    setFileContent(null)

    try {
      if (file.download_url) {
        const response = await fetch(file.download_url)
        if (!response.ok) {
          throw new Error('Failed to fetch file content')
        }
        const content = await response.text()
        setFileContent(content)
      }
    } catch (err) {
      toast.error('Failed to load file content')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCopyContent = () => {
    if (fileContent) {
      navigator.clipboard.writeText(fileContent)
      toast.success('Content copied to clipboard')
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="repo-url">GitHub Repository URL</Label>
        <div className="flex gap-2">
          <Input
            id="repo-url"
            placeholder="https://github.com/owner/repository"
            value={repoUrl}
            onChange={(e) => setRepoUrl(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleFetch} disabled={isLoading} className="flex items-center gap-2">
            {isLoading ? (
              <CircleNotch size={18} className="animate-spin" />
            ) : (
              <GithubLogo size={18} weight="fill" />
            )}
            Fetch
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="file-path">File Path (Optional)</Label>
        <Input
          id="file-path"
          placeholder="src/index.ts or leave empty for root"
          value={filePath}
          onChange={(e) => setFilePath(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="github-token">GitHub Token (Optional, for private repos)</Label>
        <Input
          id="github-token"
          type="password"
          placeholder="ghp_xxxxxxxxxxxx"
          value={githubToken}
          onChange={(e) => setGithubToken(e.target.value)}
        />
        <p className="text-xs text-muted-foreground">
          Recommended to avoid rate limits. Generate at github.com/settings/tokens
        </p>
      </div>

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

      {files.length > 0 && (
        <Card className="p-4">
          <p className="font-medium mb-3">Repository Contents</p>
          <div className="space-y-1 max-h-64 overflow-auto">
            {files.map((file) => (
              <button
                key={file.path}
                onClick={() => handleFileClick(file)}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-muted transition-colors text-left"
              >
                {file.type === 'dir' ? (
                  <Folder size={16} className="text-blue-600 flex-shrink-0" weight="fill" />
                ) : (
                  <File size={16} className="text-muted-foreground flex-shrink-0" />
                )}
                <span className="text-sm">{file.name}</span>
              </button>
            ))}
          </div>
        </Card>
      )}

      {selectedFile && fileContent && (
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <CheckCircle size={20} className="text-green-600" weight="fill" />
              <p className="font-medium">{selectedFile.name}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleCopyContent}>
              Copy
            </Button>
          </div>

          <div className="bg-muted rounded-md p-3 max-h-96 overflow-auto">
            <pre className="text-xs font-mono">
              {fileContent}
            </pre>
          </div>

          <div className="mt-3 pt-3 border-t">
            <a
              href={selectedFile.html_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline"
            >
              View on GitHub →
            </a>
          </div>
        </Card>
      )}
    </div>
  )
}
