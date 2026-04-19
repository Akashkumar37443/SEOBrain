import { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  const api = useMemo(() => axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || ''
  }), [])

  // Add auth header to requests
  api.interceptors.request.use((config) => {
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  })

  // Handle 401 responses
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        logout()
      }
      return Promise.reject(error)
    }
  )

  const login = useCallback(async (email, password) => {
    try {
      const response = await api.post('/api/auth/login', { email, password })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      }
    }
  }, [api])

  const register = useCallback(async (email, password, firstName, lastName) => {
    try {
      const response = await api.post('/api/auth/register', { 
        email, 
        password, 
        firstName, 
        lastName 
      })
      const { token: newToken, user: userData } = response.data
      
      localStorage.setItem('token', newToken)
      setToken(newToken)
      setUser(userData)
      
      return { success: true }
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      }
    }
  }, [api])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    setToken(null)
    setUser(null)
  }, [])

  const fetchUser = useCallback(async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const response = await api.get('/api/auth/me')
      setUser(response.data)
    } catch (error) {
      logout()
    } finally {
      setLoading(false)
    }
  }, [token, api, logout])

  const updateUser = useCallback((userData) => {
    setUser(prev => prev ? { ...prev, ...userData } : userData)
  }, [])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const value = {
    user,
    token,
    login,
    register,
    logout,
    updateUser,
    loading,
    api,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}
