import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './contexts/AuthContext'
import AuthPages from './components/AuthPages'
import { ContentEditor, AnalysisHistory, AnalyticsDashboard, SettingsPage } from './components/ContentEditor'
import { AdminPanel, AdminGuard } from './components/AdminPanel'
import { 
  Brain, 
  FileText, 
  Loader2, 
  Sparkles, 
  Copy, 
  CheckCircle2, 
  TrendingUp, 
  Lightbulb, 
  Zap,
  BarChart3,
  History,
  Settings,
  ChevronRight,
  AlertCircle,
  LogOut,
  User,
  Shield
} from 'lucide-react'

// Animated Score Ring Component
function ScoreRing({ score, size = 120, strokeWidth = 8 }) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (score / 100) * circumference
  
  const getColor = (s) => {
    if (s >= 80) return '#22c55e'
    if (s >= 60) return '#f59e0b'
    if (s >= 40) return '#f97316'
    return '#ef4444'
  }
  
  const color = getColor(score)
  
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#e2e8f0"
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-slate-800">{score}</span>
        <span className="text-xs text-slate-500">/100</span>
      </div>
    </div>
  )
}

// Modern Result Card Component
function ResultCard({ result }) {
  const [copied, setCopied] = useState(false)
  
  if (!result) return null
  
  const copyToClipboard = () => {
    const text = `SEO Score: ${result.score}/100\n\nSummary: ${result.summary}\n\nSuggestions:\n${result.suggestions?.join('\n') || 'None'}`
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 shadow-2xl shadow-slate-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Analysis Results</h2>
                <p className="text-white/70 text-sm">AI-powered SEO insights</p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm transition-all duration-200 text-white text-sm font-medium"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>
        
        <div className="p-8">
          <div className="flex items-center gap-8 mb-8">
            <ScoreRing score={result.score} />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-violet-600" />
                <span className="text-lg font-semibold text-slate-800">Performance Score</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                {result.score >= 80 
                  ? "Excellent! Your content is well-optimized for search engines."
                  : result.score >= 60
                  ? "Good progress. There are a few areas to improve."
                  : "Needs work. Focus on the suggestions below to improve your SEO."}
              </p>
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 bg-violet-50 rounded-full">
                <span className="w-2 h-2 bg-violet-500 rounded-full animate-pulse"></span>
                <span className="text-sm text-violet-700 font-medium">Analysis ID: {result.id?.slice(0, 8)}...</span>
              </div>
            </div>
          </div>
          
          <div className="mb-8 p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-5 h-5 text-amber-500" />
              <span className="font-semibold text-slate-800">Executive Summary</span>
            </div>
            <p className="text-slate-600 leading-relaxed text-lg">{result.summary}</p>
          </div>
          
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Lightbulb className="w-5 h-5 text-violet-600" />
              <span className="font-semibold text-slate-800">AI Recommendations</span>
              <span className="ml-auto text-sm text-slate-500">{result.suggestions?.length || 0} items</span>
            </div>
            <div className="space-y-3">
              {result.suggestions?.map((suggestion, idx) => (
                <div 
                  key={idx}
                  className="group flex items-start gap-4 p-4 bg-white rounded-xl border border-slate-100 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100/50 transition-all duration-300"
                >
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-violet-200">
                    {idx + 1}
                  </div>
                  <p className="text-slate-700 leading-relaxed pt-1">{suggestion}</p>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-violet-400 transition-colors mt-1" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Navigation Item Component
function NavItem({ icon: Icon, label, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
        active 
          ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-200' 
          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-600'}`} />
      <span className="font-medium">{label}</span>
      {active && <ChevronRight className="w-4 h-4 ml-auto" />}
    </button>
  )
}

// Main App Component
function App() {
  const { user, logout, api, isAuthenticated, loading } = useAuth()
  
  const [text, setText] = useState('')
  const [analysisLoading, setAnalysisLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [activeTab, setActiveTab] = useState('editor')
  const [charCount, setCharCount] = useState(0)
  
  useEffect(() => {
    setCharCount(text.length)
  }, [text])
  
  // Show auth pages if not logged in
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-white" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="orb orb-3"></div>
        <AuthPages />
      </div>
    )
  }
  
  const handleAnalyze = async () => {
    setError('')
    setResult(null)
    
    if (!text.trim()) {
      setError('Please enter some content to analyze.')
      return
    }
    
    if (text.trim().length < 50) {
      setError('Content must be at least 50 characters for meaningful analysis.')
      return
    }
    
    setAnalysisLoading(true)
    try {
      const res = await api.post('/api/analysis', { text })
      setResult(res.data)
    } catch (e) {
      const message = e?.response?.data?.message || e?.response?.data?.detail || 'Analysis failed'
      setError(typeof message === 'string' ? message : JSON.stringify(message))
    } finally {
      setAnalysisLoading(false)
    }
  }
  
  const handleKeyDown = (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
      handleAnalyze()
    }
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Animated background orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <aside className="w-72 glass border-r border-white/30 flex flex-col">
          <div className="p-6 border-b border-white/20">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-fuchsia-500/50 floating">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold rainbow-text">
                  SEO-Brain
                </h1>
                <p className="text-xs text-white/70 font-medium">AI-Powered SEO</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-2">
            <NavItem 
              icon={FileText} 
              label="Content Editor" 
              active={activeTab === 'editor'}
              onClick={() => setActiveTab('editor')}
            />
            <NavItem 
              icon={History} 
              label="Analysis History" 
              active={activeTab === 'history'}
              onClick={() => setActiveTab('history')}
            />
            <NavItem 
              icon={BarChart3} 
              label="Analytics" 
              active={activeTab === 'analytics'}
              onClick={() => setActiveTab('analytics')}
            />
            <NavItem 
              icon={Settings} 
              label="Settings" 
              active={activeTab === 'settings'}
              onClick={() => setActiveTab('settings')}
            />
            {user?.role?.toLowerCase() === 'admin' && (
              <NavItem 
                icon={Shield} 
                label="Admin Panel" 
                active={activeTab === 'admin'}
                onClick={() => setActiveTab('admin')}
              />
            )}
          </nav>
          
          <div className="p-4">
            {/* User Info */}
            <div className="glass-dark rounded-2xl p-4 text-white mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-white/60">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/60">Tier: <span className="text-pink-400 font-semibold capitalize">{user?.subscriptionTier}</span></span>
                <span className="text-white/60">{user?.remainingAnalyses}/{user?.monthlyAnalysisQuota} left</span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full mt-4 flex items-center gap-2 px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <div className="max-w-5xl mx-auto p-8">
            {activeTab === 'editor' && (
              <ContentEditor 
                text={text}
                setText={setText}
                charCount={charCount}
                loading={loading}
                error={error}
                result={result}
                handleAnalyze={handleAnalyze}
                handleKeyDown={handleKeyDown}
              />
            )}
            {activeTab === 'history' && <AnalysisHistory />}
            {activeTab === 'analytics' && <AnalyticsDashboard />}
            {activeTab === 'settings' && <SettingsPage />}
            {activeTab === 'admin' && (
              <AdminGuard>
                <AdminPanel />
              </AdminGuard>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
