"use client"

import { useState } from "react"
import { Info, Github, Globe, Heart, CreditCard, X, QrCode } from "lucide-react"

export default function AboutPage() {
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [selectedMethod, setSelectedMethod] = useState<'paypal' | 'qris' | null>(null)
  const [customAmount, setCustomAmount] = useState('')
  const [showQrisPopup, setShowQrisPopup] = useState(false)
  return (
    <div className="min-h-[70vh] p-3 md:p-8 bg-gradient-to-br from-background via-secondary/20 to-background neural-bg">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* About Content */}
        <div className="space-y-6">
          {/* Main Card */}
          <div className="bg-card rounded-xl border border-border p-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Task Ranker</h2>
              <p className="text-muted-foreground leading-relaxed">
                Task Ranker is an innovative web designed to help users 
                prioritize their tasks effectively using advanced machine learning algorithms. 
                By intelligently analyzing various task attributes such as complexity, deadlines, 
                importance levels, and estimated completion time, Task Ranker assigns dynamic 
                priority scores to help users focus on what matters most. The website features 
                seamless Pomodoro timer integration to boost productivity and maintain optimal 
                focus during work sessions. With its intuitive interface and intelligent prioritization system, Task Ranker 
                transforms overwhelming task lists into manageable and actionable workflows that 
                enhance productivity.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Key Features</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex gap-2">
                    <span className="text-primary font-bold">✓</span>
                    <span>ML-powered task prioritization</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">✓</span>
                    <span>Intuitive task management interface</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-accent font-bold">✓</span>
                    <span>Pomodoro Timer Integration</span>
                  </li>
                </ul>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-3">Version Information</h3>
                <p className="text-muted-foreground">
                  <strong>Version:</strong> 1.0.0
                  <br />
                  <strong>Release Date:</strong> 30 November 2025
                </p>
              </div>
            </div>
          </div>
          {/* Links */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <a
              href="https://github.com/rentsaisy/Task-Ranker-"
              target="_blank"
              rel="noopener noreferrer"
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3"
            >
              <Github className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">GitHub</p>
                <p className="text-xs text-muted-foreground">View Source</p>
              </div>
            </a>
            <a
              href="#"
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3"
            >
              <Globe className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">Developer's portfolio</p>
                <p className="text-xs text-muted-foreground">Get to know the developer</p>
              </div>
            </a>
            <a
              href="#"
              onClick={(e) => {
                e.preventDefault()
                setShowDonationModal(true)
              }}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md smooth-transition flex items-center gap-3 cursor-pointer"
            >
              <Heart className="w-5 h-5 text-primary" />
              <div>
                <p className="font-semibold text-foreground text-sm">Support</p>
                <p className="text-xs text-muted-foreground">Help us</p>
              </div>
            </a>
          </div>
        </div>
      </div>
      {/* Donation Modal */}
      {showDonationModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-2xl max-w-2xl w-full shadow-2xl relative grid grid-cols-1 md:grid-cols-2">
            {/* Left: Animation */}
            <div className="flex items-center justify-center p-8 gap-6">
              {selectedMethod === 'qris' ? (
                <>
                  <div className="flex flex-col items-center justify-center">
                    <img src="/donation.png" alt="Donation Animation" className="w-40 h-40 object-contain rounded-xl shadow-lg mb-6" />
                  </div>
                  <div className="flex flex-col items-center justify-center">
                    <img src="/qris-code.png" alt="QRIS Payment" className="w-40 h-40 object-cover rounded-xl border border-border shadow-2xl bg-background mb-6" />
                    <button
                      onClick={() => setSelectedMethod(null)}
                      className="mt-2 px-6 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border font-semibold"
                    >
                      ← Back to payment methods
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center">
                  <img src="/donation.png" alt="Donation Animation" className="w-64 h-64 object-contain rounded-xl shadow-lg" />
                </div>
              )}
            </div>
            {/* Right: Payment UI */}
            <div className="p-8 relative">
              <button
                onClick={() => {
                  setShowDonationModal(false)
                  setSelectedMethod(null)
                  setCustomAmount('')
                }}
                className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="text-center mb-6">
                {!selectedMethod && (
                  <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                      <Heart className="w-8 h-8 text-green-500" fill="currentColor" />
                    </div>
                    <p className="text-1xl font-bold text-foreground mb-2">Donation for developer</p>
                    <p className="text-sm text-muted-foreground">Choose your payment method</p>
                  </>
                )}
              </div>
              {selectedMethod === null && (
                <div className="space-y-3">
                  <button
                    onClick={() => setSelectedMethod('paypal')}
                    className="block w-full bg-[#0070BA] hover:bg-[#005EA6] text-white rounded-lg p-5 transition-all font-semibold flex items-center justify-center gap-3"
                  >
                    <CreditCard className="w-6 h-6" />
                    <span>PayPal</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowQrisPopup(true)
                    }}
                    className="block w-full bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white rounded-lg p-5 transition-all font-semibold flex items-center justify-center gap-3"
                  >
                    <QrCode className="w-6 h-6" />
                    <span>QRIS</span>
                  </button>
                      {/* QRIS Popup Modal (moved outside donation modal) */}
                      {showQrisPopup && (
                        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
                          <div className="bg-card border border-border rounded-2xl w-full max-w-md shadow-2xl flex flex-col items-center justify-center p-8 relative">
                            <img src="/qris-code.png" alt="QRIS Payment" className="w-80 h-80 object-cover rounded-xl border border-border shadow-2xl bg-background mb-6" />
                            <button
                              onClick={() => {
                                setShowQrisPopup(false)
                                setShowDonationModal(true)
                              }}
                              className="mt-2 px-6 py-2 rounded-lg bg-secondary text-foreground hover:bg-secondary/80 border border-border font-semibold"
                            >
                              ← Back
                            </button>
                          </div>
                        </div>
                      )}
                </div>
              )}
              {selectedMethod === 'paypal' && (
                <div className="space-y-4">
                  <button
                    onClick={() => {
                      setSelectedMethod(null)
                      setCustomAmount('')
                    }}
                    className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                  >
                    ← Back to payment methods
                  </button>
                  {/* Preset Amounts */}
                  <div className="grid grid-cols-3 gap-3">
                    {[3, 10, 75, 100, 120, 250].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => {
                          setCustomAmount((prev) => (prev === '0' ? String(amount) : String(amount)));
                          setTimeout(() => {
                            const input = document.getElementById('custom-amount-input');
                            if (input) input.focus();
                          }, 50);
                        }}
                        className="bg-secondary hover:bg-secondary/80 border border-border text-foreground rounded-lg py-1 px-2 text-sm font-medium transition-all"
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  {/* Custom Amount */}
                  <div className="pt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                        <input
                          id="custom-amount-input"
                          type="number"
                          min="0"
                          placeholder="Custom amount"
                          value={customAmount}
                          onChange={(e) => {
                            let val = e.target.value.replace(/[^0-9]/g, '');
                            // Remove leading zeros
                            val = val.replace(/^0+(?!$)/, '');
                            setCustomAmount(val === '' ? '0' : val);
                          }}
                          className="w-full bg-secondary border border-border rounded-lg py-3 pl-8 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                      <span className="text-sm text-muted-foreground">USD</span>
                    </div>
                  </div>
                  {/* Donate Button */}
                  <button
                    onClick={() => {
                      const amount = customAmount || '10'
                      if (selectedMethod === 'paypal') {
                        window.open(`https://www.paypal.com/paypalme/CurrentsAisy/${amount}`, '_blank')
                      }
                    }}
                    disabled={Number(customAmount) <= 0}
                    className="w-full bg-primary hover:bg-primary/90 disabled:bg-primary/50 disabled:cursor-not-allowed text-primary-foreground rounded-lg py-4 font-bold transition-all"
                  >
                    DONATE
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

