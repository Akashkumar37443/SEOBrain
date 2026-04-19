import { useState, useEffect } from 'react'
import { X, Check, Loader2, Sparkles, Zap, Building2 } from 'lucide-react'
import axios from 'axios'

const API_URL = 'http://localhost:5120'

export function SubscriptionModal({ isOpen, onClose, currentTier = 'free' }) {
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [checkoutLoading, setCheckoutLoading] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (isOpen) {
      fetchTiers()
    }
  }, [isOpen])

  const fetchTiers = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await axios.get(`${API_URL}/api/subscription/tiers`)
      setTiers(response.data)
    } catch (err) {
      setError('Failed to load subscription plans')
      console.error('Error fetching tiers:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubscribe = async (tier) => {
    if (tier.id === 'free') {
      onClose()
      return
    }

    if (!tier.stripePriceId) {
      setError('Payment not configured for this plan. Please contact support.')
      return
    }

    try {
      setCheckoutLoading(tier.id)
      const token = localStorage.getItem('token')
      
      const response = await axios.post(
        `${API_URL}/api/subscription/checkout`,
        {
          priceId: tier.stripePriceId,
          successUrl: `${window.location.origin}/dashboard?subscription=success`,
          cancelUrl: `${window.location.origin}/dashboard?subscription=cancelled`
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data?.url) {
        window.location.href = response.data.url
      } else {
        setError('Payment session creation failed')
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to start checkout'
      setError(typeof message === 'string' ? message : 'Checkout failed')
      console.error('Checkout error:', err)
    } finally {
      setCheckoutLoading(null)
    }
  }

  const getTierIcon = (tierId) => {
    switch (tierId) {
      case 'free':
        return <Sparkles className="w-6 h-6" />
      case 'pro':
        return <Zap className="w-6 h-6" />
      case 'enterprise':
        return <Building2 className="w-6 h-6" />
      default:
        return <Sparkles className="w-6 h-6" />
    }
  }

  const getTierColor = (tierId) => {
    switch (tierId) {
      case 'free':
        return 'from-slate-400 to-slate-500'
      case 'pro':
        return 'from-pink-500 to-violet-500'
      case 'enterprise':
        return 'from-violet-600 to-indigo-600'
      default:
        return 'from-slate-400 to-slate-500'
    }
  }

  const getButtonText = (tierId) => {
    if (currentTier === tierId) return 'Current Plan'
    if (tierId === 'free') return 'Downgrade'
    return 'Upgrade'
  }

  const isCurrentPlan = (tierId) => currentTier === tierId

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-5xl max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl">
        <div className="sticky top-0 bg-white/95 backdrop-blur-xl border-b border-slate-200 p-6 flex items-center justify-between z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Choose Your Plan</h2>
            <p className="text-slate-500 mt-1">Unlock more powerful SEO analysis capabilities</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                <span className="text-red-500 text-lg">!</span>
              </div>
              <p className="text-red-600">{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-10 h-10 text-pink-500 animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className={`relative rounded-2xl border-2 transition-all duration-300 ${
                    isCurrentPlan(tier.id)
                      ? 'border-pink-500 shadow-xl shadow-pink-200'
                      : 'border-slate-200 hover:border-pink-300 hover:shadow-lg'
                  }`}
                >
                  {isCurrentPlan(tier.id) && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="px-4 py-1 bg-gradient-to-r from-pink-500 to-violet-500 text-white text-sm font-semibold rounded-full">
                        Current
                      </span>
                    </div>
                  )}

                  <div className="p-6">
                    <div className={`w-12 h-12 bg-gradient-to-br ${getTierColor(tier.id)} rounded-xl flex items-center justify-center text-white mb-4`}>
                      {getTierIcon(tier.id)}
                    </div>

                    <h3 className="text-xl font-bold text-slate-800 mb-1">{tier.name}</h3>
                    <p className="text-slate-500 text-sm mb-4">{tier.description}</p>

                    <div className="mb-6">
                      <span className="text-4xl font-bold text-slate-800">
                        ${tier.price}
                      </span>
                      <span className="text-slate-400">/month</span>
                    </div>

                    <div className="mb-6 p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm text-slate-600">
                        <span className="font-semibold text-pink-600">{tier.analysisQuota}</span> analyses per month
                      </p>
                    </div>

                    <ul className="space-y-3 mb-6">
                      {tier.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3">
                          <div className={`w-5 h-5 rounded-full bg-gradient-to-br ${getTierColor(tier.id)} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                          <span className="text-slate-600 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    <button
                      onClick={() => handleSubscribe(tier)}
                      disabled={isCurrentPlan(tier.id) || checkoutLoading === tier.id}
                      className={`w-full py-3 rounded-xl font-semibold transition-all duration-200 ${
                        isCurrentPlan(tier.id)
                          ? 'bg-slate-100 text-slate-400 cursor-default'
                          : tier.id === 'free'
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-gradient-to-r from-pink-500 to-violet-500 text-white hover:from-pink-600 hover:to-violet-600 shadow-lg shadow-pink-200'
                      } ${checkoutLoading === tier.id ? 'opacity-70 cursor-wait' : ''}`}
                    >
                      {checkoutLoading === tier.id ? (
                        <span className="flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </span>
                      ) : (
                        getButtonText(tier.id)
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-8 text-center">
            <p className="text-slate-400 text-sm">
              Secure payment powered by Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
