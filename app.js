const { useState, useEffect, useMemo } = React;

// ---------- CONFIG ----------
const API_BASE = (window.__PT_API_BASE__ || "/api/v1").replace(/\/+$/, "");
const LS_TOKEN_KEY = "pt_auth_token";
const LS_CLIENTS_KEY = "ptClients";

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

async function apiFetch(path, { method = "GET", token, headers = {}, body, skipAuthReset = false } = {}) {
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

// ---------- Main App ----------
function PTClientTracker() {
  const [authToken, setAuthToken] = useState(localStorage.getItem(LS_TOKEN_KEY) || "");
  const [me, setMe] = useState(null);
  const [authMessage, setAuthMessage] = useState("");

  const [clients, setClients] = useState([]);
  const [currentView, setCurrentView] = useState("list");
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState("");
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split("T")[0],
    exercises: "",
    notes: ""
  });

  // Load local clients/sessions
  useEffect(() => {
    const saved = localStorage.getItem(LS_CLIENTS_KEY);
    if (saved) {
      try { setClients(JSON.parse(saved)); } catch (_) {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(LS_CLIENTS_KEY, JSON.stringify(clients));
  }, [clients]);

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

  const logout = () => {
    localStorage.removeItem(LS_TOKEN_KEY);
    setAuthToken("");
    setMe(null);
    setCurrentView("list");
    setAuthMessage("");
  };

  // If not logged in (or token invalid), show login
  if (!authToken || !me) {
    return (
      <>
        <LoginScreen onLoginSuccess={handleLoginSuccess} sessionMessage={authMessage} />
      </>
    );
  }

  const isAdmin = me?.role === "admin";

  // ---------- Existing functions (local storage) ----------
  const addClient = () => {
    if (!newClientName.trim()) return;

    const newClient = {
      id: Date.now(),
      name: newClientName.trim(),
      sessions: []
    };

    setClients([...clients, newClient]);
    setNewClientName("");
    setCurrentView("list");
  };

  const addSession = () => {
    if (!sessionData.exercises.trim()) return;

    const newSession = {
      id: Date.now(),
      date: sessionData.date,
      exercises: sessionData.exercises,
      notes: sessionData.notes
    };

    const updatedClients = clients.map((client) => {
      if (client.id === selectedClient.id) {
        return {
          ...client,
          sessions: [newSession, ...client.sessions]
        };
      }
      return client;
    });

    setClients(updatedClients);
    setSessionData({
      date: new Date().toISOString().split("T")[0],
      exercises: "",
      notes: ""
    });

    const updated = updatedClients.find((c) => c.id === selectedClient.id);
    setSelectedClient(updated);
    setCurrentView("client");
  };

  const deleteSession = (sessionId) => {
    const updatedClients = clients.map((client) => {
      if (client.id === selectedClient.id) {
        return {
          ...client,
          sessions: client.sessions.filter((s) => s.id !== sessionId)
        };
      }
      return client;
    });

    setClients(updatedClients);
    const updated = updatedClients.find((c) => c.id === selectedClient.id);
    setSelectedClient(updated);
  };

  const deleteClient = (clientId) => {
    if (window.confirm("Delete this client and all their sessions?")) {
      setClients(clients.filter((c) => c.id !== clientId));
      setCurrentView("list");
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
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported)) {
          if (window.confirm("This will replace all current data. Continue?")) {
            setClients(imported);
            setCurrentView("list");
            alert("Data imported successfully!");
          }
        } else {
          alert("Invalid backup file format");
        }
      } catch (err) {
        alert("Error reading backup file");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
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

          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mt-6 shadow-md">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">💡 Backup Tips</h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Download backups regularly (weekly recommended)</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Save backup files to Google Drive/Dropbox or email them to yourself</span></li>
              <li className="flex items-start gap-2"><span className="text-amber-500 font-bold">•</span><span>Keep multiple backups in case one gets corrupted</span></li>
            </ul>
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
                <p className="text-xs text-gray-500">{me.email || "Unknown email"} · {isAdmin ? "admin" : (me.role || "user")}</p>
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

          <div className="space-y-3">
            {clients.length === 0 && (
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
            <p className="text-gray-600 mt-1">{selectedClient.sessions?.length || 0} sessions</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-6 border border-purple-100 mb-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Calendar /> Add Session
            </h3>

            <div className="space-y-3">
              <input
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData({ ...sessionData, date: e.target.value })}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white"
              />

              <textarea
                value={sessionData.exercises}
                onChange={(e) => setSessionData({ ...sessionData, exercises: e.target.value })}
                placeholder="Exercises (e.g., Squat 3x5, Bench 3x8...)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[110px]"
              />

              <textarea
                value={sessionData.notes}
                onChange={(e) => setSessionData({ ...sessionData, notes: e.target.value })}
                placeholder="Notes (optional)"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400 bg-white min-h-[90px]"
              />

              <button
                onClick={addSession}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-semibold text-lg hover:shadow-lg hover:scale-[1.01] transition-all"
              >
                Add Session
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {(selectedClient.sessions || []).map((s) => (
              <div key={s.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow p-5 border border-purple-100">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-bold text-gray-800">{s.date}</div>
                    <div className="text-gray-700 whitespace-pre-wrap mt-2">{s.exercises}</div>
                    {s.notes?.trim() ? (
                      <div className="text-sm text-gray-600 whitespace-pre-wrap mt-2">{s.notes}</div>
                    ) : null}
                  </div>
                  <button
                    onClick={() => deleteSession(s.id)}
                    className="p-3 rounded-xl hover:bg-red-50 text-red-600 transition"
                    title="Delete session"
                  >
                    <Trash2 />
                  </button>
                </div>
              </div>
            ))}

            {(selectedClient.sessions || []).length === 0 && (
              <div className="text-center text-gray-600 bg-white/70 rounded-2xl p-8 border border-purple-100">
                No sessions yet — add the first one above.
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Mount
ReactDOM.createRoot(document.getElementById("root")).render(<PTClientTracker />);
