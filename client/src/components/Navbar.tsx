import { useUser, SignInButton, SignUpButton } from '@clerk/clerk-react';
import { LogIn } from 'lucide-react';

type NavBarProps = {
  isGuest: boolean;
  guestName: string;
  onToggleGuest: () => void;
};

export function NavBar({ isGuest, onToggleGuest }: NavBarProps) {
  const { isSignedIn } = useUser();

  const isUserAuthenticated = Boolean(isSignedIn);

  return (
    <header className="app-topbar">


      <div className="topbar-actions">
        {/* Show auth options only when not signed in */}
        {!isUserAuthenticated && (
          <>
            {/* Quick sign‑in / guest toggle */}
            <button
              type="button"
              className="unauth-indicator-pill"
              onClick={() => {
                onToggleGuest();
              }}
            >
              <LogIn size={13} />
              <span>{isGuest ? 'Guest Mode On' : 'Quick Sign‑In'}</span>
            </button>
            {/* Clerk sign‑in */}
            <SignInButton mode="modal">
              <button type="button" className="btn btn-sm btn-primary">
                <LogIn size={14} />
                <span>Sign In</span>
              </button>
            </SignInButton>
            {/* Clerk sign‑up */}
            <SignUpButton mode="modal">
              <button type="button" className="btn btn-sm btn-secondary">
                Sign Up
              </button>
            </SignUpButton>
          </>
        )}
      </div>
    </header>
  );
}
