import { useEffect, useState } from "react";

import { supabase } from "./lib/supabase";
import {
  acceptTerms,
  getMySettings,
  getMyStatus,
} from "./lib/api";

import TermsAndConditions from "./components/TermsAndConditions";
import Settings from "./components/Settings";

import "./App.css";

function App() {
  const [loading, setLoading] = useState(false);

  const [userEmail, setUserEmail] =
    useState<string | null>(null);

  const [accountStatus, setAccountStatus] = useState<
    "checking" | "terms" | "ready"
  >("checking");

  const [acceptingTerms, setAcceptingTerms] =
    useState(false);

  /*
   * --------------------------------------------------
   * Check local account status
   * --------------------------------------------------
   */
  async function checkAccountStatus() {
    try {
      const result = await getMyStatus();

      console.log(
        "Account status:",
        result,
      );

      if (result.hasLocalUser) {
        setAccountStatus("ready");
      } else {
        setAccountStatus("terms");
      }

      return result;
    } catch (error) {
      console.error(
        "Failed to check account status:",
        error,
      );

      setAccountStatus("terms");

      return null;
    }
  }

  /*
   * --------------------------------------------------
   * Load settings
   * --------------------------------------------------
   */
  async function loadMySettings() {
    try {
      const result =
        await getMySettings();

      console.log(
        "My settings:",
        result,
      );
    } catch (error) {
      console.error(
        "Failed to load settings:",
        error,
      );
    }
  }

  /*
   * --------------------------------------------------
   * Accept Terms
   * --------------------------------------------------
   */
  async function handleAcceptTerms() {
    try {
      setAcceptingTerms(true);

      await acceptTerms();

      console.log(
        "Terms accepted successfully",
      );

      setAccountStatus("ready");

      await loadMySettings();
    } catch (error) {
      console.error(
        "Failed to accept terms:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "ไม่สามารถสร้าง Account ได้",
      );
    } finally {
      setAcceptingTerms(false);
    }
  }

  /*
   * --------------------------------------------------
   * Google Login
   * --------------------------------------------------
   */
  async function handleGoogleLogin() {
    try {
      setLoading(true);

      const { error } =
        await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            redirectTo:
              window.location.origin,
          },
        });

      if (error) {
        console.error(
          "Google login error:",
          error,
        );

        alert(error.message);

        setLoading(false);
      }
    } catch (error) {
      console.error(
        "Google login error:",
        error,
      );

      alert(
        error instanceof Error
          ? error.message
          : "Google login failed",
      );

      setLoading(false);
    }
  }

  /*
   * --------------------------------------------------
   * Logout
   * --------------------------------------------------
   */
  async function handleLogout() {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(
        "Failed to sign out:",
        error,
      );
    } finally {
      setUserEmail(null);
      setAccountStatus("ready");
    }
  }

  /*
   * --------------------------------------------------
   * Supabase Auth initialization
   * --------------------------------------------------
   */
  useEffect(() => {
    let mounted = true;

    supabase.auth
      .getSession()
      .then(async ({ data }) => {
        if (!mounted) {
          return;
        }

        const session =
          data.session;

        setUserEmail(
          session?.user.email ?? null,
        );

        if (!session) {
          setAccountStatus(
            "ready",
          );

          return;
        }

        const status =
          await checkAccountStatus();

        if (
          mounted &&
          status?.hasLocalUser
        ) {
          await loadMySettings();
        }
      })
      .catch((error) => {
        console.error(
          "Failed to get Supabase session:",
          error,
        );

        if (mounted) {
          setAccountStatus(
            "ready",
          );
        }
      });

    const {
      data: { subscription },
    } =
      supabase.auth.onAuthStateChange(
        async (
          _event,
          session,
        ) => {
          if (!mounted) {
            return;
          }

          setUserEmail(
            session?.user.email ??
              null,
          );

          if (!session) {
            setAccountStatus(
              "ready",
            );

            return;
          }

          const status =
            await checkAccountStatus();

          if (
            mounted &&
            status?.hasLocalUser
          ) {
            await loadMySettings();
          }
        },
      );

    return () => {
      mounted = false;

      subscription.unsubscribe();
    };
  }, []);

  /*
   * --------------------------------------------------
   * CHECKING
   * --------------------------------------------------
   */
  if (
    accountStatus ===
    "checking"
  ) {
    return (
      <main className="auth-page">
        <section className="auth-card checking-card">
          <div className="logo-mark">
            🐋
          </div>

          <div className="loading-spinner" />

          <h1>
            Crypto Smart Money
          </h1>

          <p className="subtitle">
            Checking your account...
          </p>
        </section>
      </main>
    );
  }

  /*
   * --------------------------------------------------
   * TERMS
   * --------------------------------------------------
   */
  if (
    accountStatus ===
    "terms"
  ) {
    return (
      <TermsAndConditions
        onAccept={
          handleAcceptTerms
        }
        loading={
          acceptingTerms
        }
      />
    );
  }

  /*
   * --------------------------------------------------
   * DASHBOARD
   * --------------------------------------------------
   */
  if (userEmail) {
    return (
      <main className="auth-page dashboard-page">
        <section className="auth-card dashboard-card">

          <div className="dashboard-topbar">
            <div className="brand">
              <div className="logo-mark small">
                🐋
              </div>

              <div>
                <strong>
                  Crypto Smart Money
                </strong>

                <span>
                  Smart money analytics
                </span>
              </div>
            </div>

            <div className="status-pill">
              <span />
              Connected
            </div>
          </div>

          <div className="dashboard-intro">
            <span className="settings-eyebrow">
              ACCOUNT
            </span>

            <h1>
              Welcome back
            </h1>

            <p>
              Manage your Smart Money
              detection and notification
              preferences.
            </p>
          </div>

          <div className="account-banner">
            <div className="account-avatar">
              {userEmail
                .charAt(0)
                .toUpperCase()}
            </div>

            <div>
              <span>
                Signed in as
              </span>

              <strong>
                {userEmail}
              </strong>
            </div>
          </div>

          <Settings />

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
            <span>
              ↪
            </span>

            Sign out
          </button>
        </section>
      </main>
    );
  }

  /*
   * --------------------------------------------------
   * LOGIN PAGE
   * --------------------------------------------------
   */
  return (
    <main className="auth-page login-page">
      <section className="auth-card login-card">

        <div className="login-glow" />

        <div className="logo-mark">
          🐋
        </div>

        <div className="login-badge">
          <span />
          Smart Money Intelligence
        </div>

        <h1>
          Crypto Smart Money
        </h1>

        <p className="subtitle">
          Track whales.
          <br />
          Follow smart money.
          <br />
          Make better crypto decisions.
        </p>

        <div className="feature-list">
          <div className="feature-item">
            <span className="feature-icon">
              🐋
            </span>

            <div>
              <strong>
                Whale Tracking
              </strong>

              <span>
                Monitor large wallet movements
              </span>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">
              🧠
            </span>

            <div>
              <strong>
                Smart Money Detection
              </strong>

              <span>
                Identify high-value wallet behavior
              </span>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">
              🔔
            </span>

            <div>
              <strong>
                Telegram Alerts
              </strong>

              <span>
                Get notified when signals appear
              </span>
            </div>
          </div>
        </div>

        <button
          type="button"
          className="google-button"
          onClick={
            handleGoogleLogin
          }
          disabled={loading}
        >
          <span className="google-icon">
            G
          </span>

          {loading
            ? "Connecting..."
            : "Continue with Google"}
        </button>

        <p className="terms">
          By continuing, you agree to
          our terms and privacy policy.
        </p>
      </section>
    </main>
  );
}

export default App;
