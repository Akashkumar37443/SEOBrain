import { useMemo, useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from './contexts/AuthContext'
import AuthPages from './components/AuthPages'
import { ContentEditor, AnalysisHistory, AnalyticsDashboard, SettingsPage } from './components/ContentEditor'
import { AdminPanel, AdminGuard } from './components/AdminPanel'
import { CompetitorIntelligence } from './components/CompetitorIntelligence'
import { TechnicalAudit } from './components/TechnicalAudit'
import { KeywordStudio } from './components/KeywordStudio'
import { MetaSchemaGenerator } from './components/MetaSchemaGenerator'
import { ProjectHub } from './components/ProjectHub'
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
  Shield,
  Swords,
  ShieldCheck,
  Compass,
  FolderKanban
} from 'lucide-react'

// Navigation Item Component
function NavItem({ icon: Icon, label, badge, active = false, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
        active 
          ? 'bg-gradient-to-r from-violet-600/80 to-purple-600/80 text-white shadow-lg shadow-violet-500/25 backdrop-blur-sm border border-white/10' 
          : 'text-slate-300 hover:bg-white/8 hover:text-white hover:backdrop-blur-sm'
      }`}
    >
      <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-400 group-hover:text-slate-200'}`} />
      <span className="font-medium text-sm text-left flex-1">{label}</span>
      {badge && (
        <span className="px-2 py-0.5 text-[10px] uppercase font-bold bg-amber-500/30 text-amber-300 border border-amber-400/30 rounded-full">
          {badge}
        </span>
      )}
      {active && <ChevronRight className="w-4 h-4 ml-auto flex-shrink-0" />}
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
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <Loader2 className="w-12 h-12 animate-spin text-purple-400" />
      </div>
    )
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen relative overflow-hidden bg-slate-950">
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
    
    if (text.trim().length < 30) {
      setError('Content must be at least 30 characters for meaningful analysis.')
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

  const handleSelectProjectForEdit = (proj) => {
    if (proj.originalContent) {
      setText(proj.originalContent)
    }
    setActiveTab('editor')
  }
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-slate-950">
      {/* Animated background orbs */}
      <div className="orb orb-1"></div>
      <div className="orb orb-2"></div>
      <div className="orb orb-3"></div>
      
      <div className="flex h-screen relative z-10">
        {/* Sidebar */}
        <aside className="w-72 glass-sidebar flex flex-col shadow-2xl">
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 bg-gradient-to-br from-pink-500 via-fuchsia-500 to-violet-600 rounded-2xl flex items-center justify-center shadow-lg shadow-fuchsia-500/50 floating flex-shrink-0">
                <Brain className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold rainbow-text">
                  SEO-Brain
                </h1>
                <p className="text-xs text-amber-300 font-bold uppercase tracking-wider">Elite Neuro-AI Edition</p>
              </div>
            </div>
          </div>
          
          <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
            <div className="px-3 py-2 text-[11px] uppercase tracking-wider font-extrabold text-white/40">Core AI Tools</div>
            <NavItem 
              icon={FileText} 
              label="Content Editor" 
              active={activeTab === 'editor'}
              onClick={() => setActiveTab('editor')}
            />
            <NavItem 
              icon={FolderKanban} 
              label="Project Hub" 
              badge="New"
              active={activeTab === 'projects'}
              onClick={() => setActiveTab('projects')}
            />

            <div className="pt-4 px-3 py-2 text-[11px] uppercase tracking-wider font-extrabold text-white/40">Market Studio</div>
            <NavItem 
              icon={Swords} 
              label="Competitor Intelligence" 
              badge="AI Engine"
              active={activeTab === 'competitor'}
              onClick={() => setActiveTab('competitor')}
            />
            <NavItem 
              icon={ShieldCheck} 
              label="Technical SEO Audit" 
              active={activeTab === 'audit'}
              onClick={() => setActiveTab('audit')}
            />
            <NavItem 
              icon={Compass} 
              label="Keyword & Topic Studio" 
              active={activeTab === 'keyword'}
              onClick={() => setActiveTab('keyword')}
            />
            <NavItem 
              icon={Sparkles} 
              label="Meta & Schema Generator" 
              active={activeTab === 'schema'}
              onClick={() => setActiveTab('schema')}
            />

            <div className="pt-4 px-3 py-2 text-[11px] uppercase tracking-wider font-extrabold text-white/40">Insights & Settings</div>
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
          
          <div className="p-4 border-t border-white/10">
            {/* User Info */}
            <div className="glass-card rounded-2xl p-4 text-white mb-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-violet-600 rounded-full flex items-center justify-center font-bold text-white shadow">
                  {user?.firstName?.[0] || <User className="w-5 h-5 text-white" />}
                </div>
                <div className="overflow-hidden flex-1">
                  <p className="font-semibold text-sm truncate">{user?.firstName} {user?.lastName}</p>
                  <p className="text-xs text-white/60 truncate">{user?.email}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs pt-2 border-t border-white/10">
                <span className="text-white/60">Tier: <span className="text-pink-400 font-bold capitalize">{user?.subscriptionTier || 'Pro'}</span></span>
                <span className="text-white/60">{user?.remainingAnalyses ?? 100}/{user?.monthlyAnalysisQuota ?? 100} left</span>
              </div>
            </div>
            
            <button
              onClick={logout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-300 hover:bg-red-500/20 rounded-xl transition-all duration-200 border border-transparent hover:border-red-500/30"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-bold text-sm">Sign Out</span>
            </button>
          </div>
        </aside>
        
        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-slate-950/30 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto p-8 lg:p-12">
            {activeTab === 'editor' && (
              <ContentEditor 
                text={text}
                setText={setText}
                charCount={charCount}
                loading={analysisLoading}
                error={error}
                result={result}
                handleAnalyze={handleAnalyze}
                handleKeyDown={handleKeyDown}
              />
            )}
            {activeTab === 'projects' && <ProjectHub onSelectProject={handleSelectProjectForEdit} />}
            {activeTab === 'competitor' && <CompetitorIntelligence />}
            {activeTab === 'audit' && <TechnicalAudit />}
            {activeTab === 'keyword' && <KeywordStudio />}
            {activeTab === 'schema' && <MetaSchemaGenerator />}
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
