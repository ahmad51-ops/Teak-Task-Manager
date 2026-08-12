import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { getAuthConfig } from "../../api/authApi";

const GIS_SRC = "https://accounts.google.com/gsi/client";

// Loads the Google Identity Services script once per page, shared by
// anyone who asks — Login and Register both mount this component, and
// injecting the script twice causes GIS to misbehave.
let gisPromise = null;
const loadGoogleScript = () => {
  if (gisPromise) return gisPromise;
  gisPromise = new Promise((resolve, reject) => {
    if (window.google?.accounts?.id) return resolve();
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Failed to load Google sign-in"));
    document.head.appendChild(script);
  });
  return gisPromise;
};

const GoogleSignInButton = ({ onCredential, onError }) => {
  const buttonRef = useRef(null);
  const [scriptReady, setScriptReady] = useState(false);
  const [loadFailed, setLoadFailed] = useState(false);

  // The client ID comes from the server rather than a VITE_ env var, so
  // there's exactly one place it's configured (the server's .env) and no
  // chance of the two drifting apart.
  const { data: config, isLoading } = useQuery({
    queryKey: ["auth", "config"],
    queryFn: getAuthConfig,
    staleTime: Infinity, // never changes during a session
    retry: false,
  });

  useEffect(() => {
    if (!config?.googleEnabled) return;
    loadGoogleScript()
      .then(() => setScriptReady(true))
      .catch(() => setLoadFailed(true));
  }, [config?.googleEnabled]);

  useEffect(() => {
    if (!scriptReady || !config?.googleClientId || !buttonRef.current) return;

    window.google.accounts.id.initialize({
      client_id: config.googleClientId,
      callback: (response) => {
        if (response?.credential) {
          onCredential(response.credential);
        } else {
          onError?.("Google didn't return a sign-in credential. Try again.");
        }
      },
    });

    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "filled_black", // closest match to this app's dark surfaces
      size: "large",
      shape: "pill",
      text: "continue_with",
      // GIS needs a number, not a CSS value — so clamp to the actual
      // container width on small screens instead of overflowing it.
      width: Math.min(320, buttonRef.current.offsetWidth || 320),
    });
  }, [scriptReady, config?.googleClientId, onCredential, onError]);

  // Server hasn't configured Google — render nothing at all rather than
  // a broken button. Same for a still-loading config check.
  if (isLoading || !config?.googleEnabled) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-surface-3" />
        <span className="text-[13px] text-ink-faint">or</span>
        <span className="h-px flex-1 bg-surface-3" />
      </div>

      {loadFailed ? (
        <p className="text-center text-[13px] text-ink-muted">
          Google sign-in couldn't load. You can still use email and password.
        </p>
      ) : (
        <div className="flex min-h-[44px] justify-center">
          {!scriptReady && <Loader2 size={20} className="animate-spin text-ink-faint" />}
          <div ref={buttonRef} />
        </div>
      )}
    </div>
  );
};

export default GoogleSignInButton;
