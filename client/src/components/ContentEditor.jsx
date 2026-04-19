import { useState, useEffect } from 'react'
import { Loader2, Sparkles, AlertCircle, Brain, FileText, BarChart3, Clock, CheckCircle, XCircle, Save } from 'lucide-react'
import { SubscriptionModal } from './SubscriptionModal'
import { useAuth } from '../contexts/AuthContext'

export function ContentEditor({ text, setText, charCount, loading, error, result, handleAnalyze, handleKeyDown }) {
  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-full text-xs font-bold shadow-lg shadow-pink-500/30">
            v1.0 Live
          </span>
          <span className="text-2xl">🚀</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          Content Editor
        </h2>
        <p className="text-white/80 text-lg">
          Paste your content and watch AI transform it into SEO gold ✨
        </p>
      </div>
      
      <div className="glass rounded-3xl border border-white/40 shadow-2xl shadow-purple-500/20 overflow-hidden mb-6 neon-glow">
        <div className="px-6 py-4 border-b border-white/20 flex items-center justify-between bg-gradient-to-r from-pink-500/10 to-violet-500/10">
          <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-white">
              📊 {charCount.toLocaleString()} chars
            </span>
            <span className="text-white/50">|</span>
            <span className="text-sm font-bold text-white">
              📝 {text.trim().split(/\s+/).filter(Boolean).length} words
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Press</span>
            <kbd className="px-2 py-1 bg-slate-100 rounded-lg text-xs font-mono text-slate-600">
              Ctrl + Enter
            </kbd>
            <span className="text-xs text-slate-400">to analyze</span>
          </div>
        </div>
        
        <div className="p-6">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Paste your article, blog post, or web content here for AI-powered SEO analysis..."
            rows={12}
            className="w-full resize-none bg-transparent text-slate-800 placeholder:text-slate-400 text-lg leading-relaxed outline-none"
            style={{ minHeight: '300px' }}
          />
        </div>
        
        <div className="px-6 py-4 bg-gradient-to-r from-pink-500/5 to-violet-500/5 border-t border-white/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {error && (
                <div className="flex items-center gap-2 text-red-200 bg-red-500/20 px-4 py-2 rounded-xl border border-red-400/30">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">{error}</span>
                </div>
              )}
            </div>
            
            <button
              type="button"
              onClick={handleAnalyze}
              disabled={loading || !text.trim()}
              className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-pink-500 via-fuchsia-500 to-violet-600 hover:from-pink-600 hover:via-fuchsia-600 hover:to-violet-700 disabled:from-slate-400 disabled:to-slate-400 text-white rounded-xl font-bold text-lg shadow-xl shadow-fuchsia-500/40 disabled:shadow-none transition-all duration-300 disabled:cursor-not-allowed transform hover:scale-105"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  <span>Analyze with AI</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      {result && <ResultCard result={result} />}
      
      {!result && !loading && (
        <div className="text-center py-16">
          <div className="w-32 h-32 bg-gradient-to-br from-pink-400 via-fuchsia-400 to-violet-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-fuchsia-500/50 floating">
            <Brain className="w-16 h-16 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-white mb-3 drop-shadow-lg">Ready to Analyze 🎯</h3>
          <p className="text-white/80 max-w-md mx-auto text-lg">
            Enter your content and click "Analyze with AI" to unlock powerful SEO insights! 
          </p>
        </div>
      )}
    </div>
  )
}

export function ResultCard({ result }) {
  const score = result.score || 0
  const suggestions = result.suggestions || []
  const summary = result.summary || ''
  const keywords = result.keywords || []
  
  const getScoreColor = (score) => {
    if (score >= 80) return 'from-green-400 to-emerald-500'
    if (score >= 60) return 'from-yellow-400 to-orange-500'
    return 'from-red-400 to-pink-500'
  }

  const getScoreLabel = (score) => {
    if (score >= 80) return 'Excellent'
    if (score >= 60) return 'Good'
    if (score >= 40) return 'Fair'
    return 'Needs Improvement'
  }

  return (
    <div className="glass rounded-3xl border border-white/40 shadow-2xl shadow-purple-500/20 overflow-hidden mb-6 neon-glow animate-fade-in">
      <div className="p-8">
        {/* Score Header */}
        <div className="flex items-center gap-6 mb-8">
          <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${getScoreColor(score)} flex items-center justify-center shadow-xl`}>
            <span className="text-4xl font-bold text-white">{score}</span>
          </div>
          <div>
            <h3 className="text-2xl font-bold text-white mb-1">{getScoreLabel(score)}</h3>
            <p className="text-white/80">SEO Score</p>
          </div>
        </div>

        {/* Summary */}
        {summary && (
          <div className="mb-6 p-4 bg-white/10 rounded-xl">
            <h4 className="text-lg font-semibold text-white mb-2 flex items-center gap-2">
              <FileText className="w-5 h-5 text-pink-400" />
              Summary
            </h4>
            <p className="text-white/90">{summary}</p>
          </div>
        )}

        {/* Keywords */}
        {keywords.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-pink-400" />
              Keywords Detected
            </h4>
            <div className="flex flex-wrap gap-2">
              {keywords.map((keyword, index) => (
                <span 
                  key={index}
                  className="px-3 py-1 bg-gradient-to-r from-pink-500/20 to-violet-500/20 text-white rounded-full text-sm border border-pink-400/30"
                >
                  {keyword.term} ({keyword.count})
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Suggestions */}
        <div>
          <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-400" />
            Suggestions ({suggestions.length})
          </h4>
          <div className="space-y-3">
            {suggestions.map((suggestion, index) => (
              <div 
                key={index}
                className="flex items-start gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
              >
                <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center text-xs font-bold text-white">
                  {index + 1}
                </span>
                <p className="text-white/90">{suggestion}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function AnalysisHistory() {
  const [analyses, setAnalyses] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchHistory()
  }, [])

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5120/api/analysis/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setAnalyses(data)
      }
    } catch (error) {
      console.error('Failed to fetch history:', error)
    } finally {
      setLoading(false)
    }
  }

  const getScoreColor = (score) => {
    if (score >= 80) return 'text-green-400'
    if (score >= 60) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          Analysis History 📚
        </h2>
        <p className="text-white/80 text-lg">
          View all your past SEO analyses and track your progress
        </p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-4" />
          <p className="text-white/80">Loading history...</p>
        </div>
      ) : analyses.length === 0 ? (
        <div className="text-center py-16 glass rounded-3xl">
          <Clock className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">No analyses yet</h3>
          <p className="text-white/60">Start analyzing content to build your history!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {analyses.map((analysis) => (
            <div key={analysis.id} className="glass rounded-2xl p-6 hover:bg-white/10 transition-colors cursor-pointer">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <span className={`text-3xl font-bold ${getScoreColor(analysis.score)}`}>
                    {analysis.score}
                  </span>
                  <div>
                    <p className="text-white font-medium">
                      {analysis.summary?.substring(0, 60)}...
                    </p>
                    <p className="text-white/60 text-sm">
                      {new Date(analysis.createdAt).toLocaleDateString()} • {analysis.wordCount} words
                    </p>
                  </div>
                </div>
                <FileText className="w-6 h-6 text-white/40" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export function AnalyticsDashboard() {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
  }, [])

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5120/api/analytics/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="text-center py-16">
        <Loader2 className="w-12 h-12 text-pink-400 animate-spin mx-auto mb-4" />
        <p className="text-white/80">Loading analytics...</p>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          Analytics Dashboard 📊
        </h2>
        <p className="text-white/80 text-lg">
          Track your SEO performance and content metrics
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard 
            title="Total Analyses" 
            value={stats.totalAnalyses} 
            icon={FileText}
            color="from-pink-500 to-rose-500"
          />
          <StatCard 
            title="Average Score" 
            value={stats.averageScore} 
            icon={BarChart3}
            color="from-violet-500 to-purple-500"
          />
          <StatCard 
            title="This Month" 
            value={stats.analysesThisMonth} 
            icon={Clock}
            color="from-fuchsia-500 to-pink-500"
          />
          <StatCard 
            title="Remaining Quota" 
            value={stats.remainingQuota} 
            icon={CheckCircle}
            color="from-emerald-500 to-green-500"
          />
        </div>
      )}

      <div className="glass rounded-3xl p-8">
        <h3 className="text-2xl font-bold text-white mb-6">Recent Activity</h3>
        {stats?.recentActivity?.length > 0 ? (
          <div className="space-y-4">
            {stats.recentActivity.map((activity, index) => (
              <div key={index} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-violet-500 rounded-full flex items-center justify-center">
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium">{activity.summary}</p>
                  <p className="text-white/60 text-sm">
                    {new Date(activity.createdAt).toLocaleDateString()} • Score: {activity.score}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-white/60 text-center py-8">No recent activity</p>
        )}
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color }) {
  return (
    <div className="glass rounded-2xl p-6 hover:bg-white/10 transition-all duration-300 transform hover:scale-105">
      <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <p className="text-white/60 text-sm mb-1">{title}</p>
      <p className="text-3xl font-bold text-white">{value}</p>
    </div>
  )
}

export function SettingsPage() {
  const { user: authUser, api, updateUser } = useAuth()
  const [user, setUser] = useState({ firstName: '', lastName: '', email: '' })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState(null)

  // Only load user data on initial mount or when authUser changes and we're not editing
  useEffect(() => {
    if (authUser && !isEditing) {
      setUser({
        firstName: authUser.firstName || '',
        lastName: authUser.lastName || '',
        email: authUser.email || ''
      })
    }
  }, [authUser?.id, authUser?.email, isEditing])

  const handleSave = async () => {
    try {
      setIsSaving(true)
      const response = await api.put('/api/auth/profile', {
        firstName: user.firstName,
        lastName: user.lastName
      })
      // Update auth context with new user data
      updateUser(response.data)
      setMessage({ type: 'success', text: 'Profile updated successfully!' })
      setIsEditing(false)
      setTimeout(() => setMessage(null), 3000)
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update profile' })
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg">
          Settings ⚙️
        </h2>
        <p className="text-white/80 text-lg">
          Manage your account and preferences
        </p>
      </div>

      <div className="space-y-6">
        {/* Profile Section */}
        <div className="glass rounded-3xl p-8">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-500 rounded-lg flex items-center justify-center text-sm">👤</span>
              Profile Information
            </h3>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-violet-500 hover:from-pink-600 hover:to-violet-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            )}
          </div>

          {message && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              message.type === 'success' 
                ? 'bg-green-500/20 text-green-200 border border-green-500/30' 
                : 'bg-red-500/20 text-red-200 border border-red-500/30'
            }`}>
              {message.text}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-white/60 text-sm block mb-2">First Name</label>
              <input 
                type="text" 
                value={user.firstName}
                onChange={(e) => setUser({ ...user, firstName: e.target.value })}
                readOnly={!isEditing}
                className={`w-full px-4 py-3 rounded-xl text-white border border-white/20 focus:border-pink-500 focus:outline-none transition-colors ${
                  isEditing ? 'bg-white/20' : 'bg-white/10'
                }`}
              />
            </div>
            <div>
              <label className="text-white/60 text-sm block mb-2">Last Name</label>
              <input 
                type="text" 
                value={user.lastName}
                onChange={(e) => setUser({ ...user, lastName: e.target.value })}
                readOnly={!isEditing}
                className={`w-full px-4 py-3 rounded-xl text-white border border-white/20 focus:border-pink-500 focus:outline-none transition-colors ${
                  isEditing ? 'bg-white/20' : 'bg-white/10'
                }`}
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-white/60 text-sm block mb-2">Email</label>
              <input 
                type="email" 
                value={user.email}
                readOnly
                className="w-full px-4 py-3 bg-white/10 rounded-xl text-white/60 border border-white/20 cursor-not-allowed"
              />
              <p className="text-white/40 text-xs mt-1">Email cannot be changed</p>
            </div>
          </div>
        </div>

        {/* Subscription Section */}
        <div className="glass rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-500 rounded-lg flex items-center justify-center text-sm">⭐</span>
            Subscription
          </h3>
          <div className="flex items-center justify-between p-4 bg-gradient-to-r from-pink-500/10 to-violet-500/10 rounded-xl">
            <div>
              <p className="text-white font-medium capitalize">{user?.subscriptionTier || 'Free'} Plan</p>
              <p className="text-white/60 text-sm">
                {user?.remainingAnalyses} analyses remaining this month
              </p>
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-violet-500 text-white rounded-xl font-medium hover:from-pink-600 hover:to-violet-600 transition-all"
            >
              Upgrade
            </button>
          </div>
        </div>

        {/* API Keys Section */}
        <div className="glass rounded-3xl p-8">
          <h3 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
            <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm">🔑</span>
            API Keys
          </h3>
          <div className="p-4 bg-white/5 rounded-xl">
            <p className="text-white/60 text-sm mb-2">Your API Key</p>
            <div className="flex items-center gap-3">
              <code className="flex-1 px-4 py-3 bg-black/30 rounded-lg text-green-400 font-mono text-sm">
                {localStorage.getItem('token')?.substring(0, 20)}...
              </code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(localStorage.getItem('token') || '')
                }}
                className="px-4 py-3 bg-white/10 rounded-lg text-white hover:bg-white/20 transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>
      </div>

      <SubscriptionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        currentTier={user?.subscriptionTier || 'free'}
      />
    </div>
  )
}
