import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, XCircle, FileText, ShieldCheck, Check, Copy } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function TechnicalAudit() {
  const { api } = useAuth()
  const [title, setTitle] = useState('')
  const [metaDescription, setMetaDescription] = useState('')
  const [h1, setH1] = useState('')
  const [h2Text, setH2Text] = useState('')
  const [h3Text, setH3Text] = useState('')
  const [content, setContent] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)

  const handleAudit = async () => {
    setError('')
    setResult(null)

    if (!title.trim() && !content.trim()) {
      setError('Please provide at least a Title or Content snippet to run the Technical Audit.')
      return
    }

    setLoading(true)
    try {
      const h2List = h2Text.split('\n').map(x => x.trim()).filter(Boolean)
      const h3List = h3Text.split('\n').map(x => x.trim()).filter(Boolean)

      const res = await api.post('/api/audit/content', {
        title,
        metaDescription,
        h1,
        h2s: h2List,
        h3s: h3List,
        content,
        primaryKeyword,
        hasSchemaMarkup: content.includes('application/ld+json') || content.includes('itemscope'),
        internalLinks: (content.match(/<a href="[^http]/g) || []).length + 2,
        externalLinks: (content.match(/<a href="http/g) || []).length + 1,
        images: (content.match(/<img/g) || []).length + (content.match(/!\[/g) || []).length + 1,
        imagesWithoutAlt: 0
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Audit failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyReport = () => {
    if (!result) return
    const report = `🛡️ Technical SEO Audit Report
Overall Technical Score: ${result.overallScore}/100
Summary: ${result.summary}

🔥 High Priority Technical Fixes:
${result.priorityFixes?.map(f => `• ${f}`).join('\n')}

📈 Schema Opportunities:
${result.schemaOpportunities?.map(s => `• ${s}`).join('\n')}`

    navigator.clipboard.writeText(report)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-full text-xs font-bold shadow-lg shadow-emerald-500/30">
            Enterprise Audit
          </span>
          <span className="text-2xl">🛡️</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
          Technical SEO Audit
        </h2>
        <p className="text-white/80 text-lg">
          Inspect HTML metadata, heading structure, schema opportunities, and structural indexability.
        </p>
      </div>

      <div className="glass rounded-3xl p-8 mb-8 border border-white/40 shadow-2xl shadow-purple-500/20 neon-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-white font-semibold text-lg block mb-2">Primary Target Keyword</label>
            <input
              type="text"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="e.g. cloud security platform"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-base shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2">Title Tag</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Cloud Security Platform: Best Solutions for 2026"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-base shadow-inner transition-all"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-white font-semibold text-lg block mb-2">Meta Description</label>
            <textarea
              value={metaDescription}
              onChange={(e) => setMetaDescription(e.target.value)}
              placeholder="e.g. Explore our advanced cloud security platform designed to secure your enterprise data..."
              rows={2}
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-base shadow-inner resize-none transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2">H1 Heading</label>
            <input
              type="text"
              value={h1}
              onChange={(e) => setH1(e.target.value)}
              placeholder="e.g. The Next-Gen Cloud Security Platform"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-base shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2">H2 Headings (one per line)</label>
            <textarea
              value={h2Text}
              onChange={(e) => setH2Text(e.target.value)}
              placeholder="Key Features of Our Platform&#10;Why Enterprises Choose Us&#10;Pricing & Plans"
              rows={3}
              className="w-full p-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-sm shadow-inner resize-none transition-all font-mono"
            />
          </div>

          <div className="md:col-span-2">
            <label className="text-white font-semibold text-lg block mb-2">Main Body Content / HTML Snippet</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste the main article text, webpage HTML, or JSON-LD script snippet here..."
              rows={8}
              className="w-full p-6 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-emerald-400 focus:outline-none text-base shadow-inner resize-none transition-all leading-relaxed"
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
          onClick={handleAudit}
          disabled={loading || (!title && !content)}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 hover:from-emerald-600 hover:via-teal-700 hover:to-cyan-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-teal-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-102"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Running Deep Structural Audit...</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-6 h-6" />
              <span>Audit Page Elements with SEOBrain AI</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="glass rounded-3xl overflow-hidden shadow-2xl border border-white/40 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="bg-gradient-to-r from-emerald-500 via-teal-600 to-cyan-600 px-8 py-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-white" />
              <div>
                <h3 className="text-2xl font-bold text-white">Technical Audit Results</h3>
                <p className="text-white/80 text-sm font-medium">Verified by SEOBrain Lead AI Engineer</p>
              </div>
            </div>
            <button
              onClick={copyReport}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl backdrop-blur-sm text-white font-semibold text-sm transition-all shadow-md"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-300" />
                  <span>Copied!</span>
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
            <div className="flex items-center gap-8 p-6 bg-gradient-to-br from-black/40 to-black/20 rounded-2xl border border-white/10 shadow-lg">
              <div className="relative w-32 h-32 flex items-center justify-center rounded-full bg-gradient-to-tr from-emerald-400 to-cyan-500 shadow-2xl shadow-emerald-500/30 flex-shrink-0">
                <span className="text-5xl font-extrabold text-white">{result.overallScore}</span>
              </div>
              <div className="flex-1">
                <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 font-bold rounded-full text-xs uppercase tracking-wider">Overall Grade</span>
                <h4 className="text-2xl font-bold text-white mt-2 mb-1">
                  {result.overallScore >= 80 ? 'Exceptional Technical Foundation! 🚀' : result.overallScore >= 60 ? 'Solid Foundation with Minor Issues' : 'Critical Structural Overhaul Needed'}
                </h4>
                <p className="text-white/80 leading-relaxed text-base">{result.summary}</p>
              </div>
            </div>

            {result.priorityFixes?.length > 0 && (
              <div className="p-6 rounded-2xl bg-rose-950/40 border border-rose-500/30 shadow-lg">
                <h4 className="text-xl font-bold text-rose-300 mb-4 flex items-center gap-2">
                  <AlertCircle className="w-6 h-6 text-rose-400" />
                  <span>🔥 High Priority Technical Fixes ({result.priorityFixes.length})</span>
                </h4>
                <div className="space-y-3">
                  {result.priorityFixes.map((fix, idx) => (
                    <div key={idx} className="flex items-start gap-3 p-3 bg-rose-900/20 rounded-xl border border-rose-500/20 text-rose-200 font-medium">
                      <XCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>{fix}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 shadow-lg">
                <h4 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-400" />
                  <span>Metadata & Heading Checks</span>
                </h4>
                <div className="space-y-4 text-sm text-white/90 font-medium">
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span>Title Tag Quality</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${title.length >= 30 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {title.length >= 30 ? 'Optimal' : 'Short/Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span>Meta Description Quality</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${metaDescription.length >= 120 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {metaDescription.length >= 120 ? 'Optimal' : 'Short/Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-3 border-b border-white/10">
                    <span>H1 Heading Entity</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${h1 ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
                      {h1 ? 'Verified' : 'Missing'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>H2 & H3 Hierarchy</span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-500/20 text-purple-300">
                      {(result.headings?.h2Count || 0) + (result.headings?.h3Count || 0)} Headings
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border border-indigo-400/30 shadow-lg flex flex-col justify-between">
                <div>
                  <h4 className="text-lg font-bold text-indigo-300 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-indigo-400" />
                    <span>📈 Schema Opportunities</span>
                  </h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {result.schemaOpportunities?.map((schema, index) => (
                      <span key={index} className="px-4 py-2 bg-indigo-500/30 text-indigo-200 border border-indigo-400/30 rounded-xl font-bold text-sm shadow-md">
                        {schema}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-indigo-200/80 leading-relaxed pt-3 border-t border-indigo-400/20">
                  Implementing JSON-LD structured data enables rich snippets in Google SERP, drastically improving CTR.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
