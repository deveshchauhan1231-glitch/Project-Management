import { useState } from 'react'
import { LogIn, Key, UserCheck, X, Sparkles, Shield } from 'lucide-react'

type SignInModalProps = {
  isOpen: boolean
  onClose: () => void
  onLocalSignIn: (name: string, email?: string) => void
  onSetClerkKey: (key: string) => void
  isClerkConfigured: boolean
  onOpenClerkSignIn?: () => void
}

export function SignInModal({
  isOpen,
  onClose,
  onLocalSignIn,
  onSetClerkKey,
  isClerkConfigured,
  onOpenClerkSignIn,
}: SignInModalProps) {
  const [activeTab, setActiveTab] = useState<'quick' | 'clerk'>('quick')
  const [nameInput, setNameInput] = useState('')
  const [clerkKeyInput, setClerkKeyInput] = useState('')

  if (!isOpen) return null

  const handleQuickLogin = (name: string, email: string) => {
    onLocalSignIn(name, email)
    onClose()
  }

  const handleCustomQuickLogin = (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    onLocalSignIn(nameInput.trim(), `${nameInput.trim().toLowerCase().replace(/\s+/g, '')}@example.com`)
    onClose()
  }

  const handleSaveClerkKey = (e: React.FormEvent) => {
    e.preventDefault()
    if (!clerkKeyInput.trim()) return
    onSetClerkKey(clerkKeyInput.trim())
    onClose()
  }

  return (
    <div className="dialog-overlay" onClick={onClose} role="presentation">
      <div
        className="dialog-card form-card sign-in-modal-card"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <button
          type="button"
          className="dialog-close-btn"
          onClick={onClose}
          aria-label="Close sign in modal"
        >
          <X size={18} />
        </button>

        <div className="form-header">
          <div className="form-icon-badge auth-badge">
            <LogIn size={20} />
          </div>
          <div>
            <h2 className="form-title">Authentication Required</h2>
            <p className="form-subtitle">
              Sign in to manage projects, create tasks, and track activity.
            </p>
          </div>
        </div>

        {isClerkConfigured && onOpenClerkSignIn ? (
          <div className="clerk-direct-signin-box">
            <div className="clerk-info-card">
              <Shield size={24} className="text-primary" />
              <div>
                <strong>Clerk Auth is Active</strong>
                <p>Sign in or register with your email or social accounts.</p>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary btn-full"
              onClick={() => {
                onClose()
                onOpenClerkSignIn()
              }}
            >
              <LogIn size={16} />
              <span>Continue with Clerk Sign In</span>
            </button>
          </div>
        ) : (
          <div className="auth-modal-content">
            <div className="auth-tab-switch">
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'quick' ? 'active' : ''}`}
                onClick={() => setActiveTab('quick')}
              >
                <UserCheck size={14} />
                <span>Quick Sign In</span>
              </button>
              <button
                type="button"
                className={`auth-tab-btn ${activeTab === 'clerk' ? 'active' : ''}`}
                onClick={() => setActiveTab('clerk')}
              >
                <Key size={14} />
                <span>Connect Clerk Key</span>
              </button>
            </div>

            {activeTab === 'quick' ? (
              <div className="quick-login-section">
                <p className="section-help-text">
                  Choose a team member persona or enter your name to authenticate immediately:
                </p>

                <div className="persona-grid">
                  {[
                    { name: 'Alex Rivera', role: 'Engineering Lead', email: 'alex.rivera@team.io' },
                    { name: 'Sarah Miller', role: 'Product Manager', email: 'sarah.m@team.io' },
                    { name: 'David Kim', role: 'Designer', email: 'david.k@team.io' },
                  ].map((p) => (
                    <button
                      key={p.name}
                      type="button"
                      className="persona-card"
                      onClick={() => handleQuickLogin(p.name, p.email)}
                    >
                      <div className="persona-avatar">{p.name[0]}</div>
                      <div className="persona-meta">
                        <span className="persona-name">{p.name}</span>
                        <span className="persona-role">{p.role}</span>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="divider"><span>or enter custom name</span></div>

                <form onSubmit={handleCustomQuickLogin} className="custom-login-form">
                  <div className="form-group">
                    <input
                      type="text"
                      placeholder="Your full name (e.g. John Doe)"
                      value={nameInput}
                      onChange={(e) => setNameInput(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <Sparkles size={15} />
                    <span>Sign In</span>
                  </button>
                </form>
              </div>
            ) : (
              <div className="clerk-config-section">
                <p className="section-help-text">
                  Paste your Clerk Publishable Key (from <a href="https://dashboard.clerk.com" target="_blank" rel="noreferrer" className="link-clerk">clerk.com</a>) to activate official Clerk authentication:
                </p>

                <form onSubmit={handleSaveClerkKey} className="clerk-key-form">
                  <div className="form-group">
                    <label htmlFor="clerk-key-input">Clerk Publishable Key</label>
                    <input
                      id="clerk-key-input"
                      type="text"
                      placeholder="pk_test_..."
                      value={clerkKeyInput}
                      onChange={(e) => setClerkKeyInput(e.target.value)}
                      required
                    />
                  </div>
                  <button type="submit" className="btn btn-primary btn-full">
                    <Key size={15} />
                    <span>Save Key & Enable Clerk</span>
                  </button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
