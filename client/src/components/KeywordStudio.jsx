import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Copy, Compass, Target, BarChart, Layers } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function KeywordStudio() {
  const { api } = useAuth()
  const [topic, setTopic] = useState('')
  const [targetAudience, setTargetAudience] = useState('General')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleGenerate = async () => {
    setError('')
    setResult(null)

    if (!topic.trim()) {
      setError('Please provide a broad topic or niche to generate keyword clusters.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/aistudio/keyword-cluster', {
        topic,
        targetAudience,
        target_audience: targetAudience
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Keyword clustering failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyClusters = () => {
    if (!result || !result.clusters) return
    const text = `🗺️ Topical Authority Map: ${result.topic}
Target Audience: ${targetAudience}

${result.clusters.map(c => `=== Cluster: ${c.cluster_name} ===
Intent: ${c.intent} | Difficulty: ${c.difficulty} | Volume: ${c.search_volume}
Suggested Title: "${c.suggested_title}"
Keywords: ${c.keywords.join(', ')}
`).join('\n')}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  const getIntentBadge = (intent) => {
    const text = intent?.toLowerCase() || ''
    if (text.includes('info')) return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    if (text.includes('trans')) return 'bg-emerald-500/20 text-emerald-300 border-emerald-400/30'
    if (text.includes('comm')) return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
    return 'bg-amber-500/20 text-amber-300 border-amber-400/30'
  }

  const getDifficultyBadge = (diff) => {
    const text = diff?.toLowerCase() || ''
    if (text.includes('easy')) return 'bg-green-500/20 text-green-300'
    if (text.includes('med')) return 'bg-amber-500/20 text-amber-300'
    return 'bg-rose-500/20 text-rose-300'
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-full text-xs font-bold shadow-lg shadow-purple-500/30">
            Topical Authority Studio
          </span>
          <span className="text-2xl">🗺️</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
          Keyword & Topic Studio
        </h2>
        <p className="text-white/80 text-lg">
          Generate an absolute topical authority map grouped by search intent and buyer journey.
        </p>
      </div>

      <div className="glass rounded-3xl p-8 mb-8 border border-white/40 shadow-2xl shadow-purple-500/20 neon-glow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="md:col-span-2">
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
              <span>🎯</span> Core Topic or Niche
            </label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. SaaS Content Marketing or Organic Hydroponic Gardening"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-purple-400 focus:outline-none text-lg shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
              <span>👥</span> Target Audience
            </label>
            <select
              value={targetAudience}
              onChange={(e) => setTargetAudience(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-900 text-white border border-white/20 focus:border-purple-400 focus:outline-none text-lg shadow-inner transition-all cursor-pointer"
            >
              <option value="General">General Consumers</option>
              <option value="B2B Decision Makers">B2B Decision Makers</option>
              <option value="Advanced Professionals">Advanced Professionals</option>
              <option value="Beginners">Beginners & Novices</option>
              <option value="Small Business Owners">Small Business Owners</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/20 text-red-200 rounded-2xl border border-red-500/30">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={loading || !topic}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-purple-500 via-indigo-600 to-blue-600 hover:from-purple-600 hover:via-indigo-700 hover:to-blue-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-102"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Mapping Topical Clusters with SEOBrain AI...</span>
            </>
          ) : (
            <>
              <Compass className="w-6 h-6" />
              <span>Generate Topical Authority Clusters</span>
            </>
          )}
        </button>
      </div>

      {result && result.clusters && (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="glass rounded-3xl p-6 bg-gradient-to-r from-purple-500/20 via-indigo-500/20 to-blue-500/20 flex items-center justify-between border border-white/30">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-white/20 rounded-2xl">
                <Layers className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-white">Topical Clusters for &quot;{result.topic}&quot;</h3>
                <p className="text-white/80 text-sm">Generated {result.clusters.length} distinct SEO content pillars</p>
              </div>
            </div>
            <button
              onClick={copyClusters}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm text-white font-semibold text-sm transition-all shadow-md"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Map Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Map</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {result.clusters.map((cluster, idx) => (
              <div key={idx} className="glass rounded-3xl p-8 border border-white/30 hover:border-purple-400/50 transition-all duration-300 shadow-xl flex flex-col justify-between bg-black/20">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className={`px-3.5 py-1 rounded-full text-xs font-bold border ${getIntentBadge(cluster.intent)} uppercase tracking-wider`}>
                      {cluster.intent} Intent
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${getDifficultyBadge(cluster.difficulty)}`}>
                      {cluster.difficulty} Diff
                    </span>
                  </div>

                  <h4 className="text-2xl font-extrabold text-white mb-2">{cluster.cluster_name}</h4>
                  <p className="text-amber-300 font-semibold text-base mb-6 flex items-center gap-2">
                    <span>💡 Title:</span> &quot;{cluster.suggested_title}&quot;
                  </p>

                  <div className="mb-6">
                    <span className="text-xs uppercase tracking-wider text-white/60 font-bold block mb-3">Cluster Long-Tail Keywords</span>
                    <div className="flex flex-wrap gap-2">
                      {cluster.keywords.map((kw, kwIdx) => (
                        <span key={kwIdx} className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm font-medium border border-white/15 transition-all shadow-sm">
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-white/10 text-sm text-white/70 font-semibold">
                  <span className="flex items-center gap-1.5">
                    <BarChart className="w-4 h-4 text-purple-400" /> Est. Search Vol:
                  </span>
                  <span className="text-white font-bold px-2.5 py-1 bg-white/10 rounded-lg">{cluster.search_volume || '1k - 10k'} / mo</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
