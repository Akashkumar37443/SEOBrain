import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle, BarChart3, TrendingUp, CheckCircle2, Copy, FileText, Swords, ArrowRight } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function CompetitorIntelligence() {
  const { api } = useAuth()
  const [yourContent, setYourContent] = useState('')
  const [competitorContent, setCompetitorContent] = useState('')
  const [targetKeyword, setTargetKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleAnalyze = async () => {
    setError('')
    setResult(null)

    if (!yourContent.trim() || !competitorContent.trim() || !targetKeyword.trim()) {
      setError('Please fill in Your Content, Competitor Content, and the Target Keyword.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/competitor/analyze', {
        yourContent,
        competitorContent,
        targetKeyword
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Competitor analysis failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = () => {
    if (!result) return
    const text = `🏆 Competitor Intelligence Report (Keyword: ${targetKeyword})
Your Score: ${result.yourContent.seoScore}/100 | Competitor Score: ${result.competitorContent.seoScore}/100
Word Count: You (${result.yourContent.wordCount}) vs Competitor (${result.competitorContent.wordCount})

💡 AI Strategic Recommendations:
${result.recommendations.map(r => `• ${r}`).join('\n')}

🔍 Content Gaps to Fill:
${result.contentGaps?.map(g => `• ${g}`).join('\n') || 'None detected'}`

    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-amber-500 to-red-500 text-white rounded-full text-xs font-bold shadow-lg shadow-amber-500/30">
            Advanced Neuro-AI
          </span>
          <span className="text-2xl">⚔️</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
          Competitor Intelligence
        </h2>
        <p className="text-white/80 text-lg">
          Perform an elite side-by-side gap analysis against your top SERP rivals.
        </p>
      </div>

      <div className="glass-dark rounded-3xl p-8 mb-8 shadow-2xl shadow-purple-500/20 neon-glow">
        <div className="mb-6">
          <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
            <span>🎯</span> Target Keyword
          </label>
          <input
            type="text"
            value={targetKeyword}
            onChange={(e) => setTargetKeyword(e.target.value)}
            placeholder="e.g. best ai seo software"
            className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-amber-400 focus:outline-none text-lg shadow-inner transition-all"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div>
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2 text-indigo-200">
              <span>🟢</span> Your Content
            </label>
            <textarea
              value={yourContent}
              onChange={(e) => setYourContent(e.target.value)}
              placeholder="Paste your existing article, draft, or webpage text here..."
              rows={10}
              className="w-full p-6 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-indigo-400 focus:outline-none text-base leading-relaxed shadow-inner resize-none transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2 text-rose-200">
              <span>🔴</span> Competitor Content
            </label>
            <textarea
              value={competitorContent}
              onChange={(e) => setCompetitorContent(e.target.value)}
              placeholder="Paste the #1 ranking competitor's article or webpage text here..."
              rows={10}
              className="w-full p-6 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-rose-400 focus:outline-none text-base leading-relaxed shadow-inner resize-none transition-all"
            />
          </div>
        </div>

        {error && (
          <div className="mb-6 flex items-center gap-3 p-4 bg-red-500/20 text-red-200 rounded-2xl border border-red-500/30">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <p className="text-sm font-medium">{error}</p>
          </div>
        )}

        <button
          onClick={handleAnalyze}
          disabled={loading || !yourContent || !competitorContent || !targetKeyword}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 hover:from-amber-600 hover:via-rose-600 hover:to-purple-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-rose-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-102"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Analyzing Combatants...</span>
            </>
          ) : (
            <>
              <Swords className="w-6 h-6" />
              <span>Run Side-by-Side Battle Analysis</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="glass-dark rounded-3xl overflow-hidden shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-amber-500 via-rose-500 to-purple-600 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Swords className="w-7 h-7 text-white" />
              <div>
                <h3 className="text-2xl font-bold text-white">Competitor Combat Report</h3>
                <p className="text-white/80 text-sm font-medium">Target Keyword: &quot;{targetKeyword}&quot;</p>
              </div>
            </div>
            <button
              onClick={copyToClipboard}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm text-white font-semibold text-sm transition-all shadow-md"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Report Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  <span>Copy Report</span>
                </>
              )}
            </button>
          </div>

          <div className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="p-6 rounded-2xl bg-indigo-900/40 border border-indigo-400/30 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-indigo-300 flex items-center gap-2">🟢 Your Content</span>
                    <span className="text-xs font-semibold px-3 py-1 bg-indigo-500/30 text-indigo-200 rounded-full">Candidate</span>
                  </div>
                  <div className="text-5xl font-extrabold text-white mb-6 flex items-baseline gap-2">
                    {result.yourContent.seoScore}
                    <span className="text-xl font-normal text-indigo-300">/100</span>
                  </div>
                  <div className="space-y-3 text-sm text-indigo-100">
                    <div className="flex justify-between py-2 border-b border-indigo-400/20 font-medium">
                      <span>Word Count:</span>
                      <span className="font-bold text-white">{result.yourContent.wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-indigo-400/20 font-medium">
                      <span>Keyword Density:</span>
                      <span className="font-bold text-white">{result.yourContent.keywordDensity}%</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium">
                      <span>Readability Ease:</span>
                      <span className="font-bold text-white">{result.yourContent.readabilityScore}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-rose-900/40 border border-rose-400/30 flex flex-col justify-between shadow-lg">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-lg font-bold text-rose-300 flex items-center gap-2">🔴 Top Competitor</span>
                    <span className="text-xs font-semibold px-3 py-1 bg-rose-500/30 text-rose-200 rounded-full">Rival</span>
                  </div>
                  <div className="text-5xl font-extrabold text-white mb-6 flex items-baseline gap-2">
                    {result.competitorContent.seoScore}
                    <span className="text-xl font-normal text-rose-300">/100</span>
                  </div>
                  <div className="space-y-3 text-sm text-rose-100">
                    <div className="flex justify-between py-2 border-b border-rose-400/20 font-medium">
                      <span>Word Count:</span>
                      <span className="font-bold text-white">{result.competitorContent.wordCount.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-rose-400/20 font-medium">
                      <span>Keyword Density:</span>
                      <span className="font-bold text-white">{result.competitorContent.keywordDensity}%</span>
                    </div>
                    <div className="flex justify-between py-2 font-medium">
                      <span>Readability Ease:</span>
                      <span className="font-bold text-white">{result.competitorContent.readabilityScore}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10">
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <span>📊</span> AI Battle Summary
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-xs text-white/60 block mb-1">Score Advantage</span>
                  <span className="text-xl font-bold text-amber-400 capitalize">{result.comparison.scoreAdvantage || 'Neutral'}</span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-xs text-white/60 block mb-1">Word Count Diff</span>
                  <span className={`text-xl font-bold ${result.comparison.wordCountDiff >= 0 ? 'text-green-400' : 'text-rose-400'}`}>
                    {result.comparison.wordCountDiff > 0 ? `+${result.comparison.wordCountDiff}` : result.comparison.wordCountDiff} words
                  </span>
                </div>
                <div className="p-4 rounded-xl bg-white/5 border border-white/10 text-center">
                  <span className="text-xs text-white/60 block mb-1">Heading Hierarchy</span>
                  <span className="text-xl font-bold text-purple-400 capitalize">{result.comparison.headingAdvantage || 'Equal'}</span>
                </div>
              </div>
            </div>

            {result.contentGaps?.length > 0 && (
              <div className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 border border-amber-400/30">
                <h4 className="text-xl font-bold text-amber-300 mb-4 flex items-center gap-2">
                  <span>🎯</span> Content Gaps to Fill
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.contentGaps.map((gap, idx) => (
                    <div key={idx} className="flex items-center gap-3 p-3 bg-black/30 rounded-xl border border-amber-400/20 text-white font-medium">
                      <ArrowRight className="w-5 h-5 text-amber-400 flex-shrink-0" />
                      <span>{gap}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-rose-400" />
                <span>AI Strategic Recommendations</span>
              </h4>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-4 p-4 rounded-xl bg-white/10 border border-white/15 hover:border-white/30 hover:bg-white/15 transition-all shadow-md">
                    <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-rose-600 flex items-center justify-center font-bold text-white shadow-lg">
                      {idx + 1}
                    </span>
                    <p className="text-white/90 leading-relaxed text-base pt-1">{rec}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
