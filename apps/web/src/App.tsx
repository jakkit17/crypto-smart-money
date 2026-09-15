import { useEffect, useState } from "react";
import { supabase } from "./lib/supabase";
import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user.email ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user.email ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  async function handleGoogleLogin() {
    setLoading(true);

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin,
      },
    });

    if (error) {
      console.error("Google login error:", error);
      alert(error.message);
      setLoading(false);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    setUserEmail(null);
  }

  if (userEmail) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="logo-mark">🐋</div>

          <h1>Crypto Smart Money</h1>

          <p className="subtitle">
            Welcome back
          </p>

          <div className="user-info">
            <span>Signed in as</span>
            <strong>{userEmail}</strong>
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={handleLogout}
          >
            Sign out
          </button>
        </section>
      </main>
    );
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="logo-mark">🐋</div>

        <h1>Crypto Smart Money</h1>

        <p className="subtitle">
          Track whales. Follow smart money.
        </p>

        <button
          type="button"
          className="google-button"
          onClick={handleGoogleLogin}
          disabled={loading}
        >
          <span className="google-icon">G</span>

          {loading
            ? "Connecting..."
            : "Continue with Google"}
        </button>

        <p className="terms">
          By continuing, you agree to our terms and privacy policy.
        </p>
      </section>
    </main>
  );
}

export default App;
