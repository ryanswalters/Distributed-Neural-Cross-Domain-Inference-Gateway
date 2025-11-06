import { ReactNode } from 'react'
import { useAuth } from './AuthProvider'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GithubLogo, LockKey, Sparkle } from '@phosphor-icons/react'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

interface AuthGuardProps {
  children: ReactNode
  requireOwner?: boolean
}

export function AuthGuard({ children, requireOwner = false }: AuthGuardProps) {
  const { user, isLoading, isAuthenticated } = useAuth()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4 mb-2" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-20 w-full" />
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-primary/10 rounded-full p-4 w-fit">
                <LockKey size={40} className="text-primary" weight="duotone" />
              </div>
              <CardTitle className="text-2xl">Authentication Required</CardTitle>
              <CardDescription>
                Please sign in with GitHub to access the Local MCP & API Hub
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-muted rounded-lg p-4 space-y-2">
                <div className="flex items-start gap-3">
                  <Sparkle size={20} className="text-accent mt-0.5" weight="fill" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Seamless Integration</p>
                    <p className="text-xs text-muted-foreground">
                      Sign in once with your GitHub account to access all features
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <GithubLogo size={20} className="text-accent mt-0.5" weight="fill" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">GitHub Authentication</p>
                    <p className="text-xs text-muted-foreground">
                      Secure OAuth authentication powered by GitHub
                    </p>
                  </div>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                This app uses the Spark runtime's built-in authentication.
                You should already be authenticated.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  if (requireOwner && !user?.isOwner) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="w-full max-w-md">
            <CardHeader className="text-center space-y-4">
              <div className="mx-auto bg-destructive/10 rounded-full p-4 w-fit">
                <LockKey size={40} className="text-destructive" weight="duotone" />
              </div>
              <CardTitle className="text-2xl">Owner Access Required</CardTitle>
              <CardDescription>
                This feature is only available to the app owner
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-lg p-4 text-center">
                <p className="text-sm text-muted-foreground">
                  Signed in as <span className="font-medium text-foreground">@{user?.login}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Contact the app owner for access
                </p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    )
  }

  return <>{children}</>
}
