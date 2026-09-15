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

  async function testBackendAuth() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("No Supabase session");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/me`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    const data = await response.json();

    console.log("🔐 Backend auth:", data);

    if (!response.ok) {
      alert(`Backend auth failed: ${data.error ?? "Unknown error"}`);
      return;
    }

    alert(`Backend authenticated:\n${data.authUserId}`);
  }

  async function testMySettings() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("No Supabase session");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/me/settings`,
      {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      },
    );

    const data = await response.json();

    console.log("⚙️ My Settings:", data);

    if (!response.ok) {
      alert(
        `Get settings failed:\n${
          data.error ?? "Unknown error"
        }`,
      );
      return;
    }

    alert(
      `Settings loaded!\nUser ID: ${data.user.id}`,
    );
  }

  async function testMyTracking() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("No Supabase session");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/me/tracking`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          threshold: "10",
          enabled: true,
        }),
      },
    );

    const data = await response.json();

    console.log("🐋 My Tracking:", data);

    if (!response.ok) {
      alert(
        `Tracking update failed:\n${
          data.error ?? "Unknown error"
        }`,
      );
      return;
    }

    alert(
      `Tracking saved!\nThreshold: ${data.tracking.threshold}`,
    );
  }

  async function testMySmartMoneyRule() {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      alert("No Supabase session");
      return;
    }

    const response = await fetch(
      `${import.meta.env.VITE_API_URL}/me/smart-money-rule`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          netFlowWeight: 50,
          largeTransactionsWeight: 25,
          activityWeight: 15,
          positiveFlowWeight: 10,
          netFlowThresholdUsd: "10000",
          largeTransactionCount: 2,
          activityCount: 3,
          positiveFlowThresholdUsd: "1000",
          enabled: true,
        }),
      },
    );

    const data = await response.json();

    console.log("🧠 My Smart Money Rule:", data);

    if (!response.ok) {
      alert(
        `Smart Money Rule failed:\n${
          data.error ?? "Unknown error"
        }`,
      );
      return;
    }

    alert("Smart Money Rule saved!");
  }

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


            <button
              type="button"
              onClick={testBackendAuth}
            >
              Test Backend Auth
            </button>

            <button
              type="button"
              onClick={testMySettings}
            >
              Test My Settings
            </button>

            <button
              type="button"
              onClick={testMyTracking}
            >
              Test My Tracking
            </button>

            <button
              type="button"
              onClick={testMySmartMoneyRule}
            >
              Test My Smart Money Rule
            </button>

            <br />
            
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
