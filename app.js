const { useState, useEffect } = React;

// ---------- CONFIG ----------
const API_BASE = (window.__PT_API_BASE__ || "/api/v1").replace(/\/+$/, "");
const DEFAULT_BUILD = window.__PT_BUILD__ || "unknown";
const LS_TOKEN_KEY = "pt_auth_token";

// ---------- Icons ----------
const Plus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const ArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const User = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const Calendar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const Trash2 = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const Download = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const Upload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const Menu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const Dumbbell = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4L9.6 9.6"></path><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"></path><path d="m21.5 21.5-1.4-1.4"></path><path d="M3.9 3.9 2.5 2.5"></path><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"></path></svg>;

// ---------- API helpers ----------
let onUnauthorized = null;

function setUnauthorizedHandler(handler) {
  onUnauthorized = handler;
}

async function apiFetch(path, { method = "POST", token, headers = {}, body, skipAuthReset = false } = {}) {
  const url = `${API_BASE}${path}`;
  const finalHeaders = { ...headers };
  if (token) finalHeaders["Authorization"] = `Bearer ${token}`;
  if (body !== undefined && !finalHeaders["Content-Type"]) finalHeaders["Content-Type"] = "application/json";

  const res = await fetch(url, {
    method,
    headers: finalHeaders,
    body: body !== undefined ? (typeof body === "string" ? body : JSON.stringify(body)) : undefined
  });

  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (_) { data = text; }

  if (!res.ok) {
    if (res.status === 401 && !skipAuthReset && typeof onUnauthorized === "function") {
      onUnauthorized();
    }
    const msg = (data && data.detail) ? (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : `Request failed (${res.status})`;
    const err = new Error(msg);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}

async function login(email, password) {
  return apiFetch("/auth/login", {
    method: "POST",
    body: { email, password },
    skipAuthReset: true
  });
}

async function fetchMe(token) {
  return apiFetch("/auth/me", {
    method: "POST",
    token
  });
}

async function fetchClients(token) {
  return apiFetch("/clients", {
    method: "GET",
    token
  });
}

async function createClientRequest(token, payload) {
  return apiFetch("/clients", {
    method: "POST",
    token,
    body: payload
  });
}

async function deleteClientRequest(token, clientId) {
  return apiFetch(`/clients/${clientId}`, {
    method: "DELETE",
    token
  });
}

async function fetchClientSessions(token, clientId) {
  return apiFetch(`/clients/${clientId}/sessions`, {
    method: "GET",
    token
  });
}

async function createSessionRequest(token, clientId, payload) {
  return apiFetch(`/clients/${clientId}/sessions`, {
    method: "POST",
    token,
    body: payload
  });
}

async function fetchSessionRequest(token, sessionId) {
  return apiFetch(`/sessions/${sessionId}`, {
    method: "GET",
    token
  });
}

async function updateSessionRequest(token, sessionId, payload) {
  return apiFetch(`/sessions/${sessionId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

async function createSessionItemRequest(token, sessionId, payload) {
  return apiFetch(`/sessions/${sessionId}/items`, {
    method: "POST",
    token,
    body: payload
  });
}

async function fetchExerciseHistory(token, clientId, name, { limit = 20, offset = 0 } = {}) {
  const params = new URLSearchParams({
    name: name || "",
    limit: String(limit),
    offset: String(offset)
  });
  return apiFetch(`/clients/${clientId}/exercise-history?${params.toString()}`, {
    method: "GET",
    token
  });
}

async function updateSessionItemRequest(token, sessionId, itemId, payload) {
  return apiFetch(`/sessions/${sessionId}/items/${itemId}`, {
    method: "PATCH",
    token,
    body: payload
  });
}

async function deleteSessionItemRequest(token, sessionId, itemId) {
  return apiFetch(`/sessions/${sessionId}/items/${itemId}`, {
    method: "DELETE",
    token
  });
}

async function createInvite(token) {
  return apiFetch("/admin/invites", {
    method: "POST",
    token,
    body: {}
  });
}

async function listInvites(token) {
  return apiFetch("/admin/invites", {
    method: "GET",
    token
  });
}

async function signupWithInvite(payload) {
  return apiFetch("/auth/signup-with-invite", {
    method: "POST",
    body: payload
  });
}

async function fetchVersion() {
  return apiFetch("/version", {
    method: "GET",
    skipAuthReset: true
  });
}

function parseHashRoute() {
  const raw = window.location.hash || "";
  if (!raw.startsWith("#/")) return { path: "", query: {} };
  const [pathPart, queryString] = raw.slice(2).split("?");
  const params = new URLSearchParams(queryString || "");
  const query = {};
  for (const [key, value] of params.entries()) {
    query[key] = value;
  }
  return { path: pathPart || "", query };
}

function copyTextToClipboard(text) {
  if (navigator.clipboard?.writeText) {
    return navigator.clipboard.writeText(text);
  }
  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.style.position = "fixed";
  textarea.style.top = "-1000px";
  document.body.appendChild(textarea);
  textarea.focus();
  textarea.select();
  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
  return Promise.resolve();
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? null : parsed;
}

function toInt(value) {
  if (value === "" || value === null || value === undefined) return null;
  const parsed = parseInt(value, 10);
  return Number.isNaN(parsed) ? null : parsed;
}

// ---------- UI: Login Screen ----------
function LoginScreen({ onLoginSuccess, sessionMessage }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  const doLogin = async () => {
    setErr("");
    if (!email.trim() || !password) return setErr("Enter email + password.");

    setBusy(true);
    try {
      const auth = await login(email.trim(), password);
      // auth = { access_token, token_type, user }
      const token = auth?.access_token;
      if (!token) throw new Error("Login response missing access_token.");
      onLoginSuccess(token);
    } catch (e) {
      if (e?.status === 401) {
        setErr("Invalid email or password.");
      } else {
        setErr(e.message || "Login failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4 flex items-center">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
              <Dumbbell />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">PT Tracker</h1>
              <p className="text-gray-600">Sign in to continue</p>
            </div>
          </div>

          {sessionMessage && (
            <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 mb-4 text-sm">
              {sessionMessage}
            </div>
          )}
          {err && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm">
              {err}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">Email</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-sm font-semibold text-gray-700">Password</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete="current-password"
                onKeyDown={(e) => { if (e.key === "Enter") doLogin(); }}
              />
              <p className="mt-2 text-xs text-gray-500">
                Tip: keep password under 72 characters (bcrypt limit).
              </p>
            </div>

            <button
              onClick={doLogin}
              disabled={busy}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100"
            >
              {busy ? "Signing in…" : "Sign In"}
            </button>

            <div className="text-xs text-gray-500">
              API: <span className="font-mono">{API_BASE || "(not set)"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------- UI: Invite Signup Screen ----------
function InviteSignupScreen({ inviteCode, onGoToLogin }) {
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [success, setSuccess] = useState(false);

  const doSignup = async () => {
    setErr("");
    if (!inviteCode) return setErr("Invite code is missing.");
    if (!email.trim()) return setErr("Email is required.");
    if (!password) return setErr("Password is required.");
    if (password !== confirmPassword) return setErr("Passwords do not match.");

    setBusy(true);
    try {
      await signupWithInvite({
        invite_code: inviteCode,
        email: email.trim(),
        display_name: displayName.trim() || null,
        password
      });
      setSuccess(true);
    } catch (e) {
      setErr(e.message || "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4 flex items-center">
      <div className="max-w-md mx-auto w-full">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
              <Dumbbell />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Create Account</h1>
              <p className="text-gray-600">Use your invite to join</p>
            </div>
          </div>

          {success ? (
            <div className="bg-green-50 border border-green-200 text-green-900 rounded-xl p-3 mb-4 text-sm">
              Account created. You can now sign in.
            </div>
          ) : null}

          {err && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm">
              {err}
            </div>
          )}

          {!success && (
            <div className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">Email</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Display Name</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Optional"
                  autoComplete="name"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Password</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">Confirm Password</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  type="password"
                  autoComplete="new-password"
                  onKeyDown={(e) => { if (e.key === "Enter") doSignup(); }}
                />
              </div>

              <button
                onClick={doSignup}
                disabled={busy}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all disabled:opacity-60 disabled:hover:scale-100"
              >
                {busy ? "Creating..." : "Create Account"}
              </button>
            </div>
          )}

          <button
            onClick={onGoToLogin}
            className="mt-4 text-sm text-purple-700 font-semibold underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------- Main App ----------
function PTClientTracker() {
  const [route, setRoute] = useState(() => parseHashRoute());
  const [authToken, setAuthToken] = useState(localStorage.getItem(LS_TOKEN_KEY) || "");
  const [me, setMe] = useState(null);
  const [authMessage, setAuthMessage] = useState("");
  const [buildCommit, setBuildCommit] = useState(DEFAULT_BUILD);

  const [clients, setClients] = useState([]);
  const [clientsLoading, setClientsLoading] = useState(false);
  const [clientsError, setClientsError] = useState("");
  const [currentView, setCurrentView] = useState("list");
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [sessionSaveStatus, setSessionSaveStatus] = useState(null);
  const [itemSaveStatus, setItemSaveStatus] = useState({});
  const [clientTab, setClientTab] = useState("sessions");
  const [progressName, setProgressName] = useState("");
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressError, setProgressError] = useState("");
  const [progressResults, setProgressResults] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [sessionItems, setSessionItems] = useState([]);
  const [sessionForm, setSessionForm] = useState({
    session_date: new Date().toISOString().split("T")[0],
    status: "planned",
    notes: ""
  });
  const [newItem, setNewItem] = useState({
    name: "",
    planned_weight: "",
    planned_reps: "",
    planned_sets: ""
  });
  const [invites, setInvites] = useState([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [lastInviteCode, setLastInviteCode] = useState("");
  const [inviteListBusy, setInviteListBusy] = useState(false);
  const [inviteListError, setInviteListError] = useState("");

  useEffect(() => {
    if (!authToken) return;
    let cancelled = false;
    async function loadClients() {
      setClientsLoading(true);
      setClientsError("");
      try {
        const data = await fetchClients(authToken);
        if (cancelled) return;
        setClients(Array.isArray(data) ? data : []);
      } catch (e) {
        if (cancelled) return;
        setClientsError(e.message || "Failed to load clients");
      } finally {
        if (!cancelled) setClientsLoading(false);
      }
    }
    loadClients();
    return () => { cancelled = true; };
  }, [authToken]);

  useEffect(() => {
    let cancelled = false;
    fetchVersion()
      .then((data) => {
        if (cancelled) return;
        setBuildCommit(data?.commit || DEFAULT_BUILD);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleHashChange = () => setRoute(parseHashRoute());
    window.addEventListener("hashchange", handleHashChange);
    return () => window.removeEventListener("hashchange", handleHashChange);
  }, []);

  useEffect(() => {
    if (clientTab !== "progress" || !selectedClient) return;
    const key = `pt_progress_exercise_${selectedClient.id}`;
    const saved = sessionStorage.getItem(key);
    if (saved && saved !== progressName) {
      setProgressName(saved);
    }
  }, [clientTab, selectedClient, progressName]);

  // If token exists, load /auth/me
  useEffect(() => {
    let cancelled = false;

    async function loadMe() {
      if (!authToken) {
        setMe(null);
        return;
      }
      try {
        const user = await fetchMe(authToken);
        if (cancelled) return;
        setMe(user);
        setAuthMessage("");

        const name = user?.display_name || "PT Tracker";
        document.title = `${name} @ Maxx`;
      } catch (e) {
        if (cancelled) return;
        if (e?.status !== 401) {
          setAuthMessage(e.message || "Auth error");
        }
        setMe(null);
      }
    }

    loadMe();
    return () => { cancelled = true; };
  }, [authToken]);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      localStorage.removeItem(LS_TOKEN_KEY);
      setAuthToken("");
      setMe(null);
      setAuthMessage("Session expired, please log in again.");
      setCurrentView("list");
    });
  }, []);

  useEffect(() => {
    if (me?.is_admin !== true && currentView === "invites") {
      setCurrentView("list");
    }
  }, [currentView, me]);

  const handleLoginSuccess = async (token) => {
    localStorage.setItem(LS_TOKEN_KEY, token);
    setAuthToken(token);
    try {
      const user = await fetchMe(token);
      setMe(user);
      setAuthMessage("");
    } catch (e) {
      if (e?.status !== 401) {
        setAuthMessage(e.message || "Auth error");
      }
    }
  };

  const goToLogin = () => {
    window.location.hash = "";
  };

  const logout = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    setAuthToken("");
    setMe(null);
    setClients([]);
    setSessions([]);
    setSessionDetails(null);
    setSessionItems([]);
    setCurrentView("list");
    setAuthMessage("");
  };

  const handleCreateInvite = async () => {
    setInviteError("");
    setInviteSuccess("");
    setLastInviteCode("");
    if (!inviteEmail.trim()) {
      setInviteError("Enter an email to label the invite.");
      return;
    }
    setInviteBusy(true);
    try {
      const invite = await createInvite(authToken);
      const inviteLink = `https://tracker.rubyavenue.co.uk/#/signup?invite=${encodeURIComponent(invite.code)}`;
      setInviteSuccess(`Invite created for ${inviteEmail.trim()}. Code: ${invite.code}`);
      setLastInviteCode(invite.code);
      setInviteEmail("");
      await copyTextToClipboard(inviteLink);
      await refreshInvites();
    } catch (e) {
      setInviteError(e.message || "Failed to create invite");
    } finally {
      setInviteBusy(false);
    }
  };

  const refreshInvites = async () => {
    setInviteListError("");
    setInviteListBusy(true);
    try {
      const data = await listInvites(authToken);
      setInvites(Array.isArray(data) ? data : []);
    } catch (e) {
      setInviteListError(e.message || "Failed to load invites");
    } finally {
      setInviteListBusy(false);
    }
  };

  const loadSessions = async (clientId) => {
    setSessionsLoading(true);
    setSessionsError("");
    try {
      const data = await fetchClientSessions(authToken, clientId);
      setSessions(Array.isArray(data) ? data : []);
    } catch (e) {
      setSessionsError(e.message || "Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const openSession = async (sessionId) => {
    setSelectedSession(sessionId);
    setSessionDetails(null);
    setSessionItems([]);
    try {
      const data = await fetchSessionRequest(authToken, sessionId);
      setSessionDetails(data);
      setSessionItems(Array.isArray(data.items) ? data.items : []);
      setSessionForm({
        session_date: data.session_date,
        status: data.status || "planned",
        notes: data.notes || ""
      });
      setCurrentView("session");
    } catch (e) {
      setSessionsError(e.message || "Failed to load session");
    }
  };

  const handleCreateSession = async () => {
    if (!selectedClient) return;
    setSessionsError("");
    try {
      await createSessionRequest(authToken, selectedClient.id, {
        session_date: sessionForm.session_date,
        status: sessionForm.status,
        notes: sessionForm.notes || null
      });
      await loadSessions(selectedClient.id);
    } catch (e) {
      setSessionsError(e.message || "Failed to create session");
    }
  };

  const handleUpdateSession = async () => {
    if (!selectedSession) return;
    setSessionsError("");
    try {
      const data = await updateSessionRequest(authToken, selectedSession, {
        session_date: sessionForm.session_date,
        status: sessionForm.status,
        notes: sessionForm.notes || null
      });
      setSessionDetails(data);
      await loadSessions(data.client_id);
      setSessionSaveStatus({ type: "success", message: "Session saved" });
      setTimeout(() => setSessionSaveStatus(null), 2000);
    } catch (e) {
      setSessionsError(e.message || "Failed to update session");
      setSessionSaveStatus({ type: "error", message: "Save failed" });
      setTimeout(() => setSessionSaveStatus(null), 4000);
    }
  };

  const handleAddItem = async () => {
    if (!selectedSession) return;
    if (!newItem.name.trim()) return;
    setSessionsError("");
    try {
      await createSessionItemRequest(authToken, selectedSession, {
        name: newItem.name.trim(),
        planned_weight: toNumber(newItem.planned_weight),
        planned_reps: toInt(newItem.planned_reps),
        planned_sets: toInt(newItem.planned_sets)
      });
      const data = await fetchSessionRequest(authToken, selectedSession);
      setSessionItems(Array.isArray(data.items) ? data.items : []);
      setNewItem({ name: "", planned_weight: "", planned_reps: "", planned_sets: "" });
    } catch (e) {
      setSessionsError(e.message || "Failed to add item");
    }
  };

  const handleUpdateItem = async (item) => {
    if (!selectedSession) return;
    setSessionsError("");
    try {
      const payload = {
        name: item.name,
        order_index: item.order_index,
        planned_weight: toNumber(item.planned_weight),
        planned_reps: toInt(item.planned_reps),
        planned_sets: toInt(item.planned_sets),
        actual_weight: toNumber(item.actual_weight),
        actual_reps: toInt(item.actual_reps),
        actual_sets: toInt(item.actual_sets),
        notes: item.notes || null,
        metrics: item.metrics || null
      };
      const updated = await updateSessionItemRequest(authToken, selectedSession, item.id, payload);
      setSessionItems((prev) => prev.map((row) => (row.id === updated.id ? updated : row)));
      setItemSaveStatus((prev) => ({ ...prev, [item.id]: { type: "success", message: "Saved" } }));
      setTimeout(() => {
        setItemSaveStatus((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }, 2000);
    } catch (e) {
      setSessionsError(e.message || "Failed to update item");
      setItemSaveStatus((prev) => ({ ...prev, [item.id]: { type: "error", message: "Save failed" } }));
      setTimeout(() => {
        setItemSaveStatus((prev) => {
          const next = { ...prev };
          delete next[item.id];
          return next;
        });
      }, 4000);
    }
  };

  const handleDeleteItem = async (itemId) => {
    if (!selectedSession) return;
    setSessionsError("");
    try {
      await deleteSessionItemRequest(authToken, selectedSession, itemId);
      setSessionItems((prev) => prev.filter((row) => row.id !== itemId));
    } catch (e) {
      setSessionsError(e.message || "Failed to delete item");
    }
  };

  if (route.path === "signup") {
    return (
      <InviteSignupScreen inviteCode={route.query.invite || ""} onGoToLogin={goToLogin} />
    );
  }

  // If not logged in (or token invalid), show login
  if (!authToken || !me) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} sessionMessage={authMessage} />
      </>
    );
  }

  const isAdmin = me?.is_admin === true;

  // ---------- Existing functions (local storage) ----------
  const addClient = () => {
    if (!newClientName.trim()) return;
    setClientsError("");
    createClientRequest(authToken, { name: newClientName.trim() })
      .then((created) => {
        setClients((prev) => [created, ...prev]);
        setNewClientName("");
        setCurrentView("list");
      })
      .catch((e) => setClientsError(e.message || "Failed to create client"));
  };

  const deleteClient = (clientId) => {
    if (window.confirm("Delete this client and all their sessions?")) {
      setClientsError("");
      deleteClientRequest(authToken, clientId)
        .then(() => {
          setClients((prev) => prev.filter((c) => c.id !== clientId));
          setCurrentView("list");
        })
        .catch((e) => setClientsError(e.message || "Failed to delete client"));
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pt-clients-backup-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const importData = (e) => {
    alert("Import is not supported yet. Please create clients through the app.");
    e.target.value = "";
  };

  const formatSetsRepsWeight = (sets, reps, weight) => {
    if (sets == null && reps == null && weight == null) return null;
    const parts = [];
    if (sets != null) parts.push(`${sets} sets`);
    if (reps != null) parts.push(`${reps} reps`);
    if (weight != null) parts.push(`${weight} kg`);
    return parts.join(" · ");
  };

  const statusBadgeClass = (status) => {
    const base = "px-2 py-1 rounded-full text-xs font-semibold";
    if (status === "completed") return `${base} bg-green-100 text-green-700`;
    if (status === "in_progress") return `${base} bg-blue-100 text-blue-700`;
    return `${base} bg-amber-100 text-amber-700`;
  };

  const handleProgressSearch = async () => {
    if (!selectedClient) return;
    const trimmed = progressName.trim();
    if (!trimmed) {
      setProgressError("Enter an exercise name.");
      return;
    }
    setProgressError("");
    setProgressLoading(true);
    try {
      const data = await fetchExerciseHistory(authToken, selectedClient.id, trimmed);
      setProgressResults(Array.isArray(data) ? data : []);
      sessionStorage.setItem(`pt_progress_exercise_${selectedClient.id}`, trimmed);
    } catch (e) {
      setProgressError(e.message || "Failed to load exercise history");
    } finally {
      setProgressLoading(false);
    }
  };

  // ---------- MENU VIEW ----------
  if (currentView === "menu") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("list")}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-purple-100">
            <div className="flex items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
                  <Download />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Backup & Settings</h2>
                  <p className="text-gray-600">
                    Signed in as <span className="font-semibold">{me.display_name || me.email}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={logout}
                className="px-4 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold transition"
              >
                Logout
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={exportData}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              <Download /> Download Backup File
            </button>

            <label className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-5 rounded-2xl font-semibold text-lg flex items-center justify-center gap-3 hover:shadow-lg hover:scale-[1.02] transition-all cursor-pointer">
              <Upload /> Restore from Backup
              <input type="file" accept=".json" onChange={importData} className="hidden" />
            </label>
          </div>

          {isAdmin && (
            <div className="mt-6">
              <button
                onClick={() => {
                  setCurrentView("invites");
                  refreshInvites();
                }}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all"
              >
                Manage Invites
              </button>
            </div>
          )}

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mt-6 shadow-md">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">💡 Backup Tips</h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Download backups regularly (weekly recommended)</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Save backup files to Google Drive/Dropbox or email them to yourself</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Keep multiple backups in case one gets corrupted</span></li>
            </ul>
          </div>

          <div className="mt-6 text-center text-xs text-gray-500">
            PT Tracker · build {buildCommit}
          </div>
        </div>
      </div>
    );
  }

  // ---------- INVITES VIEW ----------
  if (currentView === "invites" && isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("menu")}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Admin Invites</h2>

            {inviteError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm">
                {inviteError}
              </div>
            )}
            {inviteSuccess && (
              <div className="bg-green-50 border border-green-200 text-green-900 rounded-xl p-3 mb-4 text-sm">
                <div className="mb-2">{inviteSuccess}</div>
                {lastInviteCode && (
                  <button
                    onClick={() => copyTextToClipboard(`https://tracker.rubyavenue.co.uk/#/signup?invite=${encodeURIComponent(lastInviteCode)}`)}
                    className="px-3 py-2 text-xs font-semibold rounded-lg bg-green-100 text-green-800 hover:bg-green-200 transition"
                  >
                    Copy invite link
                  </button>
                )}
              </div>
            )}

            <div className="flex flex-col gap-3">
              <input
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="Invitee email (for your reference)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <div className="flex gap-3 flex-wrap">
                <button
                  onClick={handleCreateInvite}
                  disabled={inviteBusy}
                  className="flex-1 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition disabled:opacity-60"
                >
                  {inviteBusy ? "Creating..." : "Create invite"}
                </button>
                <button
                  onClick={refreshInvites}
                  disabled={inviteListBusy}
                  className="flex-1 bg-white text-gray-800 border border-gray-200 py-3 rounded-xl font-semibold hover:bg-gray-50 transition disabled:opacity-60"
                >
                  {inviteListBusy ? "Refreshing..." : "Refresh invites"}
                </button>
              </div>
            </div>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-800">Recent Invites</h3>
              <span className="text-xs text-gray-500">{invites.length} total</span>
            </div>

            {inviteListError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm">
                {inviteListError}
              </div>
            )}

            {invites.length === 0 ? (
              <div className="text-sm text-gray-600">No invites yet.</div>
            ) : (
              <div className="space-y-3">
                {invites.map((invite) => {
                  const inviteLink = `https://tracker.rubyavenue.co.uk/#/signup?invite=${encodeURIComponent(invite.code)}`;
                  return (
                    <div key={invite.id} className="bg-white border border-gray-200 rounded-xl p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <div className="font-mono text-sm text-gray-800">{invite.code}</div>
                          <div className="text-xs text-gray-500">
                            Created: {invite.created_at ? new Date(invite.created_at).toLocaleString() : "unknown"}
                          </div>
                          <div className="text-xs text-gray-500">
                            Status: {invite.used_at ? "used" : "unused"}
                          </div>
                        </div>
                        <button
                          onClick={() => copyTextToClipboard(inviteLink)}
                          className="px-3 py-2 text-xs font-semibold rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition"
                        >
                          Copy invite link
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- SESSION VIEW ----------
  if (currentView === "session" && sessionDetails) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setCurrentView("client")}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Session Editor</h2>

            {sessionsError && (
              <div className="bg-red-50 border border-red-200 text-red-800 rounded-xl p-3 mb-4 text-sm">
                {sessionsError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
              <input
                type="date"
                value={sessionForm.session_date}
                onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <select
                value={sessionForm.status}
                onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              >
                <option value="planned">Planned</option>
                <option value="in_progress">In progress</option>
                <option value="completed">Completed</option>
              </select>
              <div className="flex flex-col gap-2">
                <button
                  onClick={handleUpdateSession}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
                >
                  Save Session
                </button>
                {sessionSaveStatus && (
                  <div
                    className={`text-xs font-semibold px-2 py-1 rounded-full w-fit ${
                      sessionSaveStatus.type === "success"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {sessionSaveStatus.message}
                  </div>
                )}
              </div>
            </div>

            <textarea
              value={sessionForm.notes}
              onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
              placeholder="Session notes (optional)"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[90px]"
            />
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Add Item</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Exercise name"
                className="md:col-span-2 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <input
                value={newItem.planned_weight}
                onChange={(e) => setNewItem({ ...newItem, planned_weight: e.target.value })}
                placeholder="Planned wt"
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <input
                value={newItem.planned_reps}
                onChange={(e) => setNewItem({ ...newItem, planned_reps: e.target.value })}
                placeholder="Planned reps"
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <input
                value={newItem.planned_sets}
                onChange={(e) => setNewItem({ ...newItem, planned_sets: e.target.value })}
                placeholder="Planned sets"
                className="px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
            </div>
            <button
              onClick={handleAddItem}
              className="mt-4 w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition"
            >
              Add Item
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Session Items</h3>
            {sessionItems.length === 0 ? (
              <div className="text-sm text-gray-600">No items yet.</div>
            ) : (
              <div className="space-y-4">
                {sessionItems.map((item) => (
                  <div key={item.id} className="border border-gray-200 rounded-xl p-4">
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
                      <input
                        value={item.name || ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, name: e.target.value } : row))}
                        placeholder="Exercise"
                        className="md:col-span-2 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.planned_weight ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, planned_weight: e.target.value } : row))}
                        placeholder="Plan wt"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.planned_reps ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, planned_reps: e.target.value } : row))}
                        placeholder="Plan reps"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.planned_sets ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, planned_sets: e.target.value } : row))}
                        placeholder="Plan sets"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.actual_weight ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, actual_weight: e.target.value } : row))}
                        placeholder="Actual wt"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.actual_reps ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, actual_reps: e.target.value } : row))}
                        placeholder="Actual reps"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.actual_sets ?? ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, actual_sets: e.target.value } : row))}
                        placeholder="Actual sets"
                        className="px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <input
                        value={item.notes || ""}
                        onChange={(e) => setSessionItems((prev) => prev.map((row) => row.id === item.id ? { ...row, notes: e.target.value } : row))}
                        placeholder="Notes"
                        className="md:col-span-3 px-3 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                      />
                      <div className="flex gap-2 md:col-span-3">
                        <button
                          onClick={() => handleUpdateItem(item)}
                          className="flex-1 bg-white border border-gray-200 text-gray-800 py-2 rounded-lg font-semibold hover:bg-gray-50 transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="flex-1 bg-red-50 text-red-700 border border-red-200 py-2 rounded-lg font-semibold hover:bg-red-100 transition"
                        >
                          Delete
                        </button>
                        {itemSaveStatus[item.id] && (
                          <span
                            className={`self-center text-xs font-semibold px-2 py-1 rounded-full ${
                              itemSaveStatus[item.id].type === "success"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {itemSaveStatus[item.id].message}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ---------- LIST VIEW ----------
  if (currentView === "list") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl text-white">
                <Dumbbell />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">{(me.display_name || "PT Tracker")} @ Maxx</h1>
                <p className="text-gray-600">{clients.length} clients</p>
                <p className="text-xs text-gray-500">{me.email || "Unknown email"} · {isAdmin ? "admin" : "trainer"}</p>
              </div>
            </div>

            <button
              onClick={() => setCurrentView("menu")}
              className="p-3 rounded-xl bg-white/70 hover:bg-white shadow transition"
              title="Menu"
            >
              <Menu />
            </button>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Plus /> Add Client
            </h2>
            <div className="flex gap-3">
              <input
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                placeholder="Client name"
                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />
              <button
                onClick={addClient}
                className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition"
              >
                Add
              </button>
            </div>
          </div>

          {clientsError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-3 mb-4 text-sm">
              {clientsError}
            </div>
          )}

          <div className="space-y-3">
            {clientsLoading && (
              <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-6 border border-purple-100">
                Loading clients...
              </div>
            )}

            {!clientsLoading && clients.length === 0 && (
              <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-8 border border-purple-100">
                No clients yet — add your first one above.
              </div>
            )}

            {clients.map((client) => (
              <div
                key={client.id}
                className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-5 border border-purple-100 flex items-center justify-between"
              >
                <button
                  className="flex-1 text-left"
                  onClick={() => {
                    setSelectedClient(client);
                    setClientTab("sessions");
                    setProgressName("");
                    setProgressError("");
                    setProgressResults([]);
                    setSessionForm({
                      session_date: new Date().toISOString().split("T")[0],
                      status: "planned",
                      notes: ""
                    });
                    loadSessions(client.id);
                    setCurrentView("client");
                  }}
                >
                  <div className="font-bold text-gray-800 text-lg flex items-center gap-2">
                    <User /> {client.name}
                  </div>
                  <div className="text-sm text-gray-600 mt-1">
                    {client.sessions?.length || 0} sessions
                  </div>
                </button>

                <button
                  onClick={() => deleteClient(client.id)}
                  className="p-3 rounded-xl hover:bg-red-50 text-red-600 transition"
                  title="Delete client"
                >
                  <Trash2 />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ---------- CLIENT VIEW ----------
  if (currentView === "client" && selectedClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView("list")}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User /> {selectedClient.name}
            </h2>
            <p className="text-gray-600 mt-1">{sessions.length} sessions</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-2 border border-purple-100 mb-6">
            <div className="grid grid-cols-3 text-sm font-semibold text-gray-600">
              {["sessions", "progress", "compare"].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setClientTab(tab)}
                  className={`px-4 py-3 rounded-xl transition ${
                    clientTab === tab
                      ? "bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      : "hover:bg-gray-50"
                  }`}
                >
                  {tab === "sessions" ? "Sessions" : tab === "progress" ? "Progress" : "Compare"}
                </button>
              ))}
            </div>
          </div>

          {clientTab === "sessions" && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar /> Create Session
                </h3>

                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="date"
                      value={sessionForm.session_date}
                      onChange={(e) => setSessionForm({ ...sessionForm, session_date: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    />
                    <select
                      value={sessionForm.status}
                      onChange={(e) => setSessionForm({ ...sessionForm, status: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                    >
                      <option value="planned">Planned</option>
                      <option value="in_progress">In progress</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <textarea
                    value={sessionForm.notes}
                    onChange={(e) => setSessionForm({ ...sessionForm, notes: e.target.value })}
                    placeholder="Session notes (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[90px]"
                  />

                  <button
                    onClick={handleCreateSession}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all"
                  >
                    Create Session
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                {sessionsError && (
                  <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-3 text-sm">
                    {sessionsError}
                  </div>
                )}

                {sessionsLoading && (
                  <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-6 border border-purple-100">
                    Loading sessions...
                  </div>
                )}

                {!sessionsLoading && sessions.length === 0 && (
                  <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-8 border border-purple-100">
                    No sessions yet — create the first one above.
                  </div>
                )}

                {sessions.map((s) => (
                  <div key={s.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-5 border border-purple-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-gray-800">{s.session_date}</div>
                        <div className="text-sm text-gray-600 mt-1">Status: {s.status || "planned"}</div>
                        {s.notes?.trim() ? (
                          <div className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{s.notes}</div>
                        ) : null}
                      </div>
                      <button
                        onClick={() => openSession(s.id)}
                        className="px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-800 font-semibold hover:bg-gray-50 transition"
                      >
                        Open
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {clientTab === "progress" && (
            <>
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
                <h3 className="text-lg font-bold text-gray-800 mb-4">Exercise Progress</h3>
                <div className="flex gap-3 flex-wrap">
                  <input
                    value={progressName}
                    onChange={(e) => setProgressName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleProgressSearch();
                    }}
                    placeholder="Exercise name (e.g. Bench Press)"
                    className="flex-1 min-w-[200px] px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
                  />
                  <button
                    onClick={handleProgressSearch}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold hover:shadow-lg transition"
                  >
                    Search
                  </button>
                </div>
              </div>

              {progressError && (
                <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-3 text-sm mb-4">
                  {progressError}
                </div>
              )}

              {progressLoading && (
                <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-6 border border-purple-100">
                  Loading progress...
                </div>
              )}

              {!progressLoading && progressResults.length === 0 && progressName.trim() && !progressError && (
                <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-6 border border-purple-100">
                  No history found for that exercise.
                </div>
              )}

              {!progressLoading && progressResults.length > 0 && (
                <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
                  <div className="text-sm font-semibold text-gray-600 mb-4">
                    History for “{progressName.trim()}”
                  </div>
                  <div className="space-y-6 border-l-2 border-purple-100 pl-6">
                    {progressResults.map((item) => {
                      const planned = formatSetsRepsWeight(item.planned_sets, item.planned_reps, item.planned_weight);
                      const actual = formatSetsRepsWeight(item.actual_sets, item.actual_reps, item.actual_weight);
                      return (
                        <div key={item.item_id} className="relative">
                          <div className="absolute -left-[33px] top-2 h-3 w-3 rounded-full bg-purple-400"></div>
                          <div className="flex items-center justify-between gap-3 flex-wrap">
                            <button
                              onClick={() => openSession(item.session_id)}
                              className="font-semibold text-purple-700 hover:underline"
                            >
                              {item.session_date}
                            </button>
                            <span className={statusBadgeClass(item.session_status || "planned")}>
                              {item.session_status || "planned"}
                            </span>
                          </div>
                          {planned && (
                            <div className="text-sm text-gray-700 mt-2">
                              Planned: {planned}
                            </div>
                          )}
                          {actual && (
                            <div className="text-sm text-gray-700 mt-1">
                              Actual: {actual}
                            </div>
                          )}
                          {item.notes?.trim() ? (
                            <div className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{item.notes}</div>
                          ) : null}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}

          {clientTab === "compare" && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Compare Sessions</h3>
              <p className="text-gray-600 text-sm">Coming soon.</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return null;
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<PTClientTracker />);
