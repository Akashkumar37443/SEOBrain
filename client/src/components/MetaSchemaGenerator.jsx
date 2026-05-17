import { useState } from 'react'
import { Loader2, Sparkles, AlertCircle, CheckCircle2, Copy, Code, Eye, Globe, ExternalLink } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function MetaSchemaGenerator() {
  const { api } = useAuth()
  const [content, setContent] = useState('')
  const [primaryKeyword, setPrimaryKeyword] = useState('')
  const [schemaType, setSchemaType] = useState('Article')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)
  const [copiedSection, setCopiedSection] = useState('')

  const handleGenerate = async () => {
    setError('')
    setResult(null)

    if (!content.trim() || !primaryKeyword.trim()) {
      setError('Please provide Content and Primary Keyword to generate tags & schema.')
      return
    }

    setLoading(true)
    try {
      const res = await api.post('/api/aistudio/meta-schema', {
        content,
        primaryKeyword,
        primary_keyword: primaryKeyword,
        schemaType,
        schema_type: schemaType
      })
      setResult(res.data)
    } catch (err) {
      setError(err.response?.data?.message || 'Generation failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const copyText = (text, section) => {
    navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(''), 2000)
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <span className="px-3 py-1 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-full text-xs font-bold shadow-lg shadow-pink-500/30">
            Rich Snippet Studio
          </span>
          <span className="text-2xl">✨</span>
        </div>
        <h2 className="text-4xl font-bold text-white mb-2 drop-shadow-lg flex items-center gap-3">
          Meta & Schema Generator
        </h2>
        <p className="text-white/80 text-lg">
          Generate highly optimized Title tags, Meta descriptions, OpenGraph tags, and valid JSON-LD structured data.
        </p>
      </div>

      <div className="glass rounded-3xl p-8 mb-8 border border-white/40 shadow-2xl shadow-purple-500/20 neon-glow">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
              <span>🔑</span> Primary Target Keyword
            </label>
            <input
              type="text"
              value={primaryKeyword}
              onChange={(e) => setPrimaryKeyword(e.target.value)}
              placeholder="e.g. enterprise data pipeline"
              className="w-full px-6 py-4 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-pink-400 focus:outline-none text-lg shadow-inner transition-all"
            />
          </div>

          <div>
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
              <span>🏗️</span> Schema.org Markup Type
            </label>
            <select
              value={schemaType}
              onChange={(e) => setSchemaType(e.target.value)}
              className="w-full px-6 py-4 rounded-2xl bg-slate-900 text-white border border-white/20 focus:border-pink-400 focus:outline-none text-lg shadow-inner transition-all cursor-pointer"
            >
              <option value="Article">Article (Blog, News, Guide)</option>
              <option value="FAQPage">FAQ Page (Questions & Answers)</option>
              <option value="Product">Product / E-Commerce Store</option>
              <option value="Recipe">Recipe / Food Blog</option>
              <option value="SoftwareApplication">Software Application / SaaS</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="text-white font-semibold text-lg block mb-2 flex items-center gap-2">
              <span>📝</span> Article Content or Summary
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Paste your article draft, product description, or FAQ content here..."
              rows={8}
              className="w-full p-6 rounded-2xl bg-white/10 text-white placeholder:text-white/40 border border-white/20 focus:border-pink-400 focus:outline-none text-base shadow-inner resize-none transition-all leading-relaxed"
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
          onClick={handleGenerate}
          disabled={loading || !content || !primaryKeyword}
          className="w-full flex items-center justify-center gap-3 px-8 py-5 bg-gradient-to-r from-pink-500 via-rose-500 to-purple-600 hover:from-pink-600 hover:via-rose-600 hover:to-purple-700 text-white rounded-2xl font-bold text-xl shadow-xl shadow-pink-500/40 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-102"
        >
          {loading ? (
            <>
              <Loader2 className="w-6 h-6 animate-spin" />
              <span>Generating Optimized Tags & JSON-LD...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-6 h-6" />
              <span>Generate SEO Meta Tags & Structured Data</span>
            </>
          )}
        </button>
      </div>

      {result && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="glass rounded-3xl p-8 border border-white/30 shadow-2xl flex flex-col justify-between bg-black/20">
              <div>
                <h3 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 border-b border-white/10 pb-4">
                  <Globe className="w-6 h-6 text-pink-400" />
                  <span>Google SERP Preview</span>
                </h3>

                <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-inner mb-6 space-y-2">
                  <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                    <span>https://yoursite.com/</span>
                    <span className="text-slate-200 font-semibold">{result.url_slug || 'optimized-url-slug'}</span>
                    <span className="text-xs ml-1 px-1.5 py-0.5 bg-slate-800 rounded text-slate-300">⋮</span>
                  </div>
                  <h4 className="text-xl font-medium text-blue-400 hover:underline cursor-pointer leading-snug">
                    {result.title || 'Optimized Title Tag Displayed Here'}
                  </h4>
                  <p className="text-sm text-slate-300 leading-normal">
                    {result.meta_description || 'Compelling meta description snippet that convinces SERP searchers to click through to your content.'}
                  </p>
                </div>

                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white/90">Optimized Title Tag</span>
                      <button
                        onClick={() => copyText(result.title, 'title')}
                        className="text-xs font-semibold px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {copiedSection === 'title' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === 'title' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-white/10 text-white font-medium text-base border border-white/15">
                      {result.title}
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-white/90">Meta Description</span>
                      <button
                        onClick={() => copyText(result.meta_description, 'meta')}
                        className="text-xs font-semibold px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {copiedSection === 'meta' ? <CheckCircle2 className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedSection === 'meta' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="p-4 rounded-xl bg-white/10 text-white font-medium text-base border border-white/15 leading-relaxed">
                      {result.meta_description}
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass rounded-3xl p-8 border border-white/30 shadow-2xl flex flex-col justify-between bg-black/20">
                <div>
                  <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
                    <h3 className="text-2xl font-bold text-white flex items-center gap-3">
                      <Code className="w-6 h-6 text-pink-400" />
                      <span>{schemaType} JSON-LD Schema</span>
                    </h3>
                    <button
                      onClick={() => copyText(`<script type="application/ld+json">\n${result.schema_json}\n</script>`, 'schema')}
                      className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold text-sm rounded-xl transition-all shadow-lg flex items-center gap-2"
                    >
                      {copiedSection === 'schema' ? <CheckCircle2 className="w-4 h-4 text-green-300" /> : <Copy className="w-4 h-4" />}
                      {copiedSection === 'schema' ? 'Schema Copied!' : 'Copy Script Tag'}
                    </button>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-950 text-emerald-400 border border-slate-800 font-mono text-xs overflow-x-auto shadow-inner max-h-96 overflow-y-auto">
                    <pre className="whitespace-pre">{`<script type="application/ld+json">\n${result.schema_json}\n</script>`}</pre>
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-white/70 font-semibold">
                  <span>✨ Validated against Google Rich Results standards</span>
                  <a
                    href="https://search.google.com/test/rich-results"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-pink-400 hover:underline"
                  >
                    <span>Test on Google</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
