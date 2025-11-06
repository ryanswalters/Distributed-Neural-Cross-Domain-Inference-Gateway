import { useState, useEffect } from 'react'


interface User {
    login: string
    avatar_url: string
    name?: string
    email?: string
    id: number
}

export function useAuth() {
    const [user, setUser] = useState<User | null>(null)
    const [loading, setLoading] = useState(true)
    const [isOwner, setIsOwner] = useState(false)

    useEffect(() => {
    loadUser()
    }, [])

    const loadUser = async () => {
    try {
        const userData = await window.spark.user()
        setUser(userData)
        // Check if user is owner (adjust this logic based on your needs)
        setIsOwner(userData.login === 'your-github-username') // Replace with actual owner check
    } catch (error) {
        console.error('Failed to load user:', error)
        setUser(null)
        setIsOwner(false)
    } finally {
        setLoading(false)
    }
    }

    return {
    user,
    loading,
    isAuthenticated: !!user,
    isOwner,
    reload: loadUser
    }
}