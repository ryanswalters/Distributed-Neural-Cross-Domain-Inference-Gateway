   declare global {
      interface Window {
        spark: {
          llm: (prompt: string, model?: string, jsonMode?: boolean) => Promise<string>
          llmPrompt: (strings: TemplateStringsArray, ...values: any[]) => string
          kv: {
            get: (key: string) => Promise<any>
            set: (key: string, value: any) => Promise<void>
            delete: (key: string) => Promise<void>
            list: (prefix?: string) => Promise<string[]>
          }
          user: () => Promise<{
            login: string
            avatar_url: string
            name?: string
            email?: string
            id: number
          }>
        }
      }
    }

