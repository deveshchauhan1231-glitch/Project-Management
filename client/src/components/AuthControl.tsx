import { useUser, SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/clerk-react'
import { LogIn, User } from 'lucide-react'

type AuthControlProps = {
  isGuest: boolean
  guestName: string
  onToggleGuest: () => void
}

export function AuthControl({ isGuest, guestName, onToggleGuest }: AuthControlProps) {
  const { user, isLoaded } = useUser()

  if (!isLoaded) {
    return <div className="auth-skeleton" />
  }

  return (
    <div className="auth-section">
      <SignedIn>
        <div className="user-profile-badge">
          <div className="user-text-info">
            <span className="user-display-name">
              {user?.fullName || user?.firstName || 'Logged in'}
            </span>
            <span className="user-email-text">
              {user?.primaryEmailAddress?.emailAddress}
            </span>
          </div>
          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-8 h-8 rounded-full border border-orange-300',
              },
            }}
          />
        </div>
      </SignedIn>

      <SignedOut>
        {isGuest ? (
          <div className="guest-badge-wrap">
            <div className="guest-badge">
              <div className="guest-avatar">
                <User size={13} />
              </div>
              <span>Guest: {guestName}</span>
            </div>
            <SignInButton mode="modal">
              <button type="button" className="btn btn-sm btn-primary">
                <LogIn size={14} />
                <span>Sign In with Clerk</span>
              </button>
            </SignInButton>
          </div>
        ) : (
          <div className="auth-actions">
            <button
              type="button"
              className="btn btn-sm btn-outline btn-guest"
              onClick={onToggleGuest}
              title="Continue without signing in"
            >
              Guest Mode
            </button>
            <SignInButton mode="modal">
              <button type="button" className="btn btn-sm btn-primary">
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
              <button type="button" className="btn btn-sm btn-secondary">
                Sign Up
              </button>
            </SignUpButton>
          </div>
        )}
      </SignedOut>
    </div>
  )
}
