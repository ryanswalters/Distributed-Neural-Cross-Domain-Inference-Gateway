 export function isValidUrl(url: string): boolean {
      try {
        new URL(url)
        return true
      } catch {
        return false
      }
    }


    export function isValidJson(str: string): boolean {
      try {
        JSON.parse(str)
        return true
      } catch {
        return false
      }
    }


    export function isLocalUrl(url: string): boolean {
      try {
        const parsed = new URL(url)
        return parsed.hostname === 'localhost' || 
               parsed.hostname === '127.0.0.1' || 
               parsed.hostname.endsWith('.local')
      } catch {
        return false
      }
    }


    export function sanitizeToolName(name: string): string {
      return name
        .trim()
        .replace(/[^a-zA-Z0-9\s-_]/g, '')
        .replace(/\s+/g, '-')
        .toLowerCase()
    }


    export function validateToolFormData(data: any): { valid: boolean; errors:
    string[] } {
      const errors: string[] = []
      
      if (!data.name?.trim()) errors.push('Name is required')
      if (!data.description?.trim()) errors.push('Description is required')
      if (!data.category) errors.push('Category is required')
      
      if (data.endpoint && !isValidUrl(data.endpoint)) {
        errors.push('Invalid endpoint URL')
      }
      
      if (data.parameters) {
        try {
          JSON.parse(data.parameters)
        } catch {
          errors.push('Parameters must be valid JSON')
        }
      }
      
      return { valid: errors.length === 0, errors }
    }