
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
   * Check whether the Supabase user already has
   * a local users row in our database.
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

      /*
       * If Supabase authentication exists but
       * the local account does not exist,
       * the user needs to accept Terms.
       */
      setAccountStatus("terms");

      return null;
    }
  }

  /*
   * --------------------------------------------------
   * Load settings after local account exists.
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
   *
   * This calls:
   *
   * POST /me/accept-terms
   *
   * Backend creates the local users row.
   * --------------------------------------------------
   */
  async function handleAcceptTerms() {
    try {
      setAcceptingTerms(true);

      await acceptTerms();

      console.log(
        "Terms accepted successfully",
      );

      /*
       * Local account now exists.
       */
      setAccountStatus("ready");

      /*
       * Load settings for the newly created account.
       */
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
      console.error("Failed to sign out:", error);
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

    /*
     * Check existing session when the app starts.
     */
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

        /*
         * IMPORTANT:
         *
         * Do NOT call /me/settings first.
         *
         * First check whether the local
         * users row exists.
         */
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

    /*
     * Listen for future auth changes.
     */
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

          /*
           * Check local account first.
           */
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
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        Checking your account...
      </div>
    );
  }

  /*
   * --------------------------------------------------
   * TERMS
   *
   * IMPORTANT:
   * This comes BEFORE the userEmail/Dashboard
   * condition.
   *
   * Otherwise userEmail would cause Dashboard
   * to render before Terms.
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
   *
   * Only reachable when:
   *
   * accountStatus === "ready"
   *
   * and userEmail exists.
   * --------------------------------------------------
   */
  if (userEmail) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="logo-mark">
            🐋
          </div>

          <h1>
            Crypto Smart Money
          </h1>

          <p className="subtitle">
            Welcome back
          </p>

          <div className="user-info">
            <span>
              Signed in as
            </span>

            <strong>
              {userEmail}
            </strong>

            <hr />

            <h1>
              Crypto Smart Money
            </h1>

            <Settings />

            <hr />

            <br />
          </div>

          <button
            type="button"
            className="logout-button"
            onClick={
              handleLogout
            }
          >
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
    <main className="auth-page">
      <section className="auth-card">
        <div className="logo-mark">
          🐋
        </div>

        <h1>
          Crypto Smart Money
        </h1>

        <p className="subtitle">
          Track whales. Follow
          smart money.
        </p>

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
          By continuing, you
          agree to our terms and
          privacy policy.
        </p>
      </section>
    </main>
  );
}

export default App;
