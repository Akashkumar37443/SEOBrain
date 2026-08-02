import { useState, useEffect, useCallback } from 'react'
import { Loader2, Sparkles, AlertCircle, Plus, Trash2, Edit3, ArrowRight, FolderKanban, CheckCircle2, BarChart2, FileText, Calendar } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function ProjectHub({ onSelectProject }) {
  const { api, user } = useAuth()
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Modal / Create State
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState('')
  const [originalContent, setOriginalContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Selected Project Detail State
  const [selectedProject, setSelectedProject] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [editingContent, setEditingContent] = useState(false)
  const [updatedContent, setUpdatedContent] = useState('')

  const fetchProjects = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api.get('/api/projects')
      setProjects(res.data)
    } catch (err) {
      setError('Failed to load projects. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [api])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const handleCreateProject = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      alert('Please enter a project title')
      return
    }

    setSubmitting(true)
    try {
      const res = await api.post('/api/projects', {
        title,
        originalContent,
        userId: user?.id
      })
      setProjects([res.data, ...projects])
      setIsCreating(false)
      setTitle('')
      setOriginalContent('')
    } catch (err) {
      alert('Failed to create project')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteProject = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this project?')) return

    try {
      await api.delete(`/api/projects/${id}`)
      setProjects(projects.filter(p => p.id !== id))
      if (selectedProject?.id === id) setSelectedProject(null)
    } catch (err) {
      alert('Failed to delete project')
    }
  }

  const handleAnalyzeProject = async (id) => {
    setAnalyzing(true)
    try {
      const res = await api.post(`/api/projects/${id}/analyze`)
      setSelectedProject(res.data)
      setProjects(projects.map(p => p.id === id ? res.data : p))
    } catch (err) {
      alert('Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleUpdateContent = async () => {
    if (!selectedProject) return
    try {
      const res = await api.put(`/api/projects/${selectedProject.id}`, {
        title: selectedProject.title,
        originalContent: updatedContent,
        optimizedContent: selectedProject.optimizedContent,
        seO_Score: selectedProject.seO_Score
      })
      setSelectedProject(res.data)
      setProjects(projects.map(p => p.id === selectedProject.id ? res.data : p))
      setEditingContent(false)
    } catch (err) {
      alert('Failed to update content')
    }
  }

  const selectProjectDetail = (proj) => {
    setSelectedProject(proj)
    setUpdatedContent(proj.originalContent || '')
    setEditingContent(false)
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-500/30">
              Campaign Manager
            </span>
            <span className="text-2xl">📁</span>
          </div>
          <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
            Project Hub
          </h2>
          <p className="text-white/80 text-lg">
            Organize content campaigns, track SEO scores across pages, and deploy SEOBrain AI rewrites.
          </p>
        </div>

        <button
          onClick={() => setIsCreating(true)}
          className="flex items-center gap-2 px-6 py-3.5 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white rounded-2xl font-bold text-base shadow-xl shadow-blue-500/30 transition-all transform hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          <span>New Campaign Project</span>
        </button>
      </div>

      {isCreating && (
        <div className="glass-dark rounded-3xl p-8 mb-8 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 neon-glow">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
            <h3 className="text-2xl font-bold text-white flex items-center gap-2">
              <FolderKanban className="w-6 h-6 text-blue-400" />
              <span>Create New SEO Campaign Project</span>
            </h3>
            <button
              onClick={() => setIsCreating(false)}
              className="text-white/60 hover:text-white px-3 py-1 bg-white/10 hover:bg-white/20 rounded-xl transition-all font-semibold text-sm"
            >
              Cancel
            </button>
          </div>

          <form onSubmit={handleCreateProject} className="space-y-6">
            <div>
              <label className="text-white font-semibold text-base block mb-2">Project Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Q3 Cloud Storage Landing Page or November SEO Blog Series"
                className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-blue-400 focus:outline-none text-lg shadow-inner transition-all"
                required
              />
            </div>

            <div>
              <label className="text-white font-semibold text-base block mb-2">Initial Article Draft or Text (Optional)</label>
              <textarea
                value={originalContent}
                onChange={(e) => setOriginalContent(e.target.value)}
                placeholder="Paste the draft article or copy you want to analyze and optimize..."
                rows={6}
                className="w-full p-6 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-blue-400 focus:outline-none text-base shadow-inner resize-none transition-all"
              />
            </div>

            <div className="flex justify-end gap-4">
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl transition-all"
              >
                Dismiss
              </button>
              <button
                type="submit"
                disabled={submitting || !title.trim()}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg disabled:opacity-50"
              >
                {submitting && <Loader2 className="w-5 h-5 animate-spin" />}
                <span>Save Project</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {error && (
        <div className="mb-8 p-4 bg-red-500/20 border border-red-500/30 text-red-200 rounded-2xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-semibold">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-white">
          <Loader2 className="w-12 h-12 animate-spin text-blue-400 mb-4" />
          <p className="text-lg font-medium text-white/80">Loading SEO Projects...</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass-card rounded-3xl p-16 text-center shadow-xl">
          <FolderKanban className="w-16 h-16 text-white/40 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-white mb-2">No Projects Created Yet</h3>
          <p className="text-white/70 max-w-md mx-auto mb-6 text-base">
            Start organizing your SEO content workflows by creating your first campaign project.
          </p>
          <button
            onClick={() => setIsCreating(true)}
            className="px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold rounded-2xl transition-all shadow-lg"
          >
            Create Your First Project
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-xl font-bold text-white flex items-center justify-between px-2">
              <span>Campaigns ({projects.length})</span>
              <span className="text-xs font-semibold px-2.5 py-1 bg-white/10 rounded-full">Updated Live</span>
            </h3>
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {projects.map((proj) => (
                <div
                  key={proj.id}
                  onClick={() => selectProjectDetail(proj)}
                  className={`glass-card p-5 rounded-2xl transition-all cursor-pointer relative group ${selectedProject?.id === proj.id ? 'border-blue-400 bg-white/15 shadow-lg shadow-blue-500/20' : 'hover:border-white/30 hover:bg-white/8'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-lg font-bold text-white pr-8 leading-snug group-hover:text-blue-300 transition-colors">
                      {proj.title}
                    </h4>
                    <button
                      onClick={(e) => handleDeleteProject(proj.id, e)}
                      className="absolute top-4 right-4 p-2 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {new Date(proj.createdAt || Date.now()).toLocaleDateString()}
                    </span>

                    <span className={`px-2.5 py-1 rounded-full font-bold ${proj.seO_Score >= 80 ? 'bg-green-500/20 text-green-300' : proj.seO_Score >= 50 ? 'bg-amber-500/20 text-amber-300' : 'bg-white/10 text-white/80'}`}>
                      {proj.seO_Score > 0 ? `${proj.seO_Score} / 100` : 'Not Scored'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedProject ? (
              <div className="glass-dark rounded-3xl p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
                <div className="flex flex-wrap items-center justify-between gap-4 pb-6 mb-6 border-b border-white/10">
                  <div>
                    <span className="text-xs font-bold text-blue-300 uppercase tracking-wider block mb-1">Active Project Overview</span>
                    <h3 className="text-3xl font-extrabold text-white">{selectedProject.title}</h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleAnalyzeProject(selectedProject.id)}
                      disabled={analyzing || !selectedProject.originalContent}
                      className="flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-bold rounded-xl shadow-lg transition-all disabled:opacity-50"
                    >
                      {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                      <span>{analyzing ? 'AI Optimizing...' : 'Run SEOBrain AI Analysis'}</span>
                    </button>
                    {onSelectProject && (
                      <button
                        onClick={() => onSelectProject(selectedProject)}
                        className="flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg transition-all"
                      >
                        <span>Open in Editor</span>
                        <ArrowRight className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="p-6 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-blue-500/20 text-blue-400">
                      <BarChart2 className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs text-white/60 font-semibold block mb-1">Overall Campaign Score</span>
                      <span className="text-4xl font-extrabold text-white">{selectedProject.seO_Score || 0}<span className="text-xl font-normal text-white/60">/100</span></span>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-black/30 border border-white/10 flex items-center gap-5">
                    <div className="p-4 rounded-2xl bg-purple-500/20 text-purple-400">
                      <FileText className="w-8 h-8" />
                    </div>
                    <div>
                      <span className="text-xs text-white/60 font-semibold block mb-1">Content Status</span>
                      <span className="text-lg font-bold text-white capitalize">
                        {selectedProject.optimizedContent ? 'Optimized Copy Ready ✅' : selectedProject.originalContent ? 'Draft Saved ✏️' : 'Empty Draft ⚠️'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-bold text-white flex items-center gap-2">
                        <span>✏️</span> Original Content Draft
                      </h4>
                      <button
                        onClick={() => setEditingContent(!editingContent)}
                        className="text-xs font-semibold px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>{editingContent ? 'Discard Edit' : 'Edit Content'}</span>
                      </button>
                    </div>

                    {editingContent ? (
                      <div className="space-y-4">
                        <textarea
                          value={updatedContent}
                          onChange={(e) => setUpdatedContent(e.target.value)}
                          rows={10}
                          className="w-full p-6 rounded-2xl bg-slate-900 text-white border border-blue-400/50 focus:outline-none text-base leading-relaxed shadow-inner"
                        />
                        <div className="flex justify-end gap-3">
                          <button
                            onClick={handleUpdateContent}
                            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all shadow-md"
                          >
                            Save Draft Updates
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 rounded-2xl bg-white/5 border border-white/15 text-white/90 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed text-base font-sans">
                        {selectedProject.originalContent || <span className="text-white/40 italic">No content saved yet. Click &apos;Edit Content&apos; above to add your draft text.</span>}
                      </div>
                    )}
                  </div>

                  {selectedProject.optimizedContent && (
                    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 to-teal-950/40 border border-emerald-500/40 shadow-xl">
                      <h4 className="text-lg font-bold text-emerald-300 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-400" />
                        <span>SEOBrain Optimized Copy Recommendation</span>
                      </h4>
                      <div className="p-5 rounded-xl bg-black/40 text-emerald-100/90 whitespace-pre-wrap max-h-96 overflow-y-auto leading-relaxed text-base font-sans border border-emerald-500/20">
                        {selectedProject.optimizedContent}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="glass-card rounded-3xl p-16 text-center shadow-xl flex flex-col items-center justify-center min-h-[500px]">
                <FolderKanban className="w-16 h-16 text-white/30 mb-4 animate-pulse" />
                <h3 className="text-2xl font-bold text-white mb-2">Select a Campaign Project</h3>
                <p className="text-white/70 max-w-md mx-auto text-base">
                  Choose a project from the left sidebar to view its full SEO metrics, edit draft content, or run SEOBrain AI optimizations.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
