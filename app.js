const { useState, useEffect } = React;

// Icons
const Plus = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>;
const ArrowLeft = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12"></line><polyline points="12 19 5 12 12 5"></polyline></svg>;
const User = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const Calendar = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const Trash2 = () => <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>;
const Download = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>;
const Upload = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>;
const Menu = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>;
const TrendingUp = () => <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline><polyline points="17 6 23 6 23 12"></polyline></svg>;
const Dumbbell = () => <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.4 14.4L9.6 9.6"></path><path d="M18.657 21.485a2 2 0 1 1-2.829-2.828l-1.767 1.768a2 2 0 1 1-2.829-2.829l6.364-6.364a2 2 0 1 1 2.829 2.829l-1.768 1.767a2 2 0 1 1 2.828 2.829z"></path><path d="m21.5 21.5-1.4-1.4"></path><path d="M3.9 3.9 2.5 2.5"></path><path d="M6.404 12.768a2 2 0 1 1-2.829-2.829l1.768-1.767a2 2 0 1 1-2.828-2.829l2.828-2.828a2 2 0 1 1 2.829 2.828l1.767-1.768a2 2 0 1 1 2.829 2.829z"></path></svg>;

function PTClientTracker() {
  const [clients, setClients] = useState([]);
  const [currentView, setCurrentView] = useState('list');
  const [selectedClient, setSelectedClient] = useState(null);
  const [newClientName, setNewClientName] = useState('');
  const [sessionData, setSessionData] = useState({
    date: new Date().toISOString().split('T')[0],
    exercises: '',
    notes: ''
  });

  useEffect(() => {
    const saved = localStorage.getItem('ptClients');
    if (saved) {
      setClients(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('ptClients', JSON.stringify(clients));
  }, [clients]);

  const addClient = () => {
    if (!newClientName.trim()) return;
    
    const newClient = {
      id: Date.now(),
      name: newClientName.trim(),
      sessions: []
    };
    
    setClients([...clients, newClient]);
    setNewClientName('');
    setCurrentView('list');
  };

  const addSession = () => {
    if (!sessionData.exercises.trim()) return;
    
    const newSession = {
      id: Date.now(),
      date: sessionData.date,
      exercises: sessionData.exercises,
      notes: sessionData.notes
    };
    
    const updatedClients = clients.map(client => {
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
      date: new Date().toISOString().split('T')[0],
      exercises: '',
      notes: ''
    });
    
    const updated = updatedClients.find(c => c.id === selectedClient.id);
    setSelectedClient(updated);
    setCurrentView('client');
  };

  const deleteSession = (sessionId) => {
    const updatedClients = clients.map(client => {
      if (client.id === selectedClient.id) {
        return {
          ...client,
          sessions: client.sessions.filter(s => s.id !== sessionId)
        };
      }
      return client;
    });
    
    setClients(updatedClients);
    const updated = updatedClients.find(c => c.id === selectedClient.id);
    setSelectedClient(updated);
  };

  const deleteClient = (clientId) => {
    if (window.confirm('Delete this client and all their sessions?')) {
      setClients(clients.filter(c => c.id !== clientId));
      setCurrentView('list');
    }
  };

  const exportData = () => {
    const dataStr = JSON.stringify(clients, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `pt-clients-backup-${new Date().toISOString().split('T')[0]}.json`;
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
          if (window.confirm('This will replace all current data. Continue?')) {
            setClients(imported);
            setCurrentView('list');
            alert('Data imported successfully!');
          }
        } else {
          alert('Invalid backup file format');
        }
      } catch (err) {
        alert('Error reading backup file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // MENU VIEW
  if (currentView === 'menu') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('list')}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-purple-100">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <Download />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Backup & Settings</h2>
                <p className="text-gray-600">Protect your client data</p>
              </div>
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
              <input
                type="file"
                accept=".json"
                onChange={importData}
                className="hidden"
              />
            </label>
          </div>
          
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 mt-6 shadow-md">
            <h3 className="font-bold text-amber-900 mb-3 flex items-center gap-2 text-lg">
              💡 Backup Tips
            </h3>
            <ul className="text-sm text-amber-800 space-y-2">
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Download backups regularly (weekly recommended)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Save backup files to Google Drive, Dropbox, or email them to yourself</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Keep multiple backups in case one gets corrupted</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-500 font-bold">•</span>
                <span>Restoring will replace all current data</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT LIST VIEW
  if (currentView === 'list') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-purple-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-2xl shadow-lg">
                  <Dumbbell />
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Donna Treanor @ Maxx
                  </h1>
                  <p className="text-gray-600 mt-1">Track your clients' progress</p>
                </div>
              </div>
              <button
                onClick={() => setCurrentView('menu')}
                className="p-3 bg-white rounded-xl hover:bg-purple-50 transition shadow-md border border-purple-100"
              >
                <Menu />
              </button>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentView('addClient')}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-5 rounded-2xl font-semibold text-lg mb-6 flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus /> Add New Client
          </button>
          
          <div className="space-y-4">
            {clients.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-purple-100">
                <div className="inline-block p-6 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full mb-4">
                  <User />
                </div>
                <p className="text-gray-600 text-lg">No clients yet</p>
                <p className="text-gray-500 mt-2">Add your first client to get started!</p>
              </div>
            ) : (
              clients.map(client => (
                <div
                  key={client.id}
                  className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 flex items-center justify-between hover:shadow-xl hover:scale-[1.01] transition-all cursor-pointer border border-purple-100"
                  onClick={() => {
                    setSelectedClient(client);
                    setCurrentView('client');
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-4 bg-gradient-to-br from-purple-400 to-blue-400 rounded-xl shadow-md">
                      <User />
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-gray-800">{client.name}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <TrendingUp />
                        <p className="text-sm text-gray-600">{client.sessions.length} sessions completed</p>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteClient(client.id);
                    }}
                    className="p-3 text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <Trash2 />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADD CLIENT VIEW
  if (currentView === 'addClient') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('list')}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <User />
              </div>
              <h2 className="text-3xl font-bold text-gray-800">Add New Client</h2>
            </div>
            
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-3 text-lg">Client Name</label>
              <input
                type="text"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                className="w-full p-5 border-2 border-purple-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none bg-white/50 backdrop-blur-sm transition"
                placeholder="Enter client name"
                autoFocus
              />
            </div>
            
            <button
              onClick={addClient}
              disabled={!newClientName.trim()}
              className="w-full bg-gradient-to-r from-purple-500 to-blue-500 text-white py-5 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Add Client
            </button>
          </div>
        </div>
      </div>
    );
  }

  // CLIENT DETAIL VIEW
  if (currentView === 'client') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('list')}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back to Clients
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 mb-6 border border-purple-100">
            <div className="flex items-center gap-4 mb-2">
              <div className="p-4 bg-gradient-to-br from-purple-500 to-blue-500 rounded-xl">
                <User />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-gray-800">{selectedClient.name}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <TrendingUp />
                  <p className="text-gray-600">{selectedClient.sessions.length} total sessions</p>
                </div>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => setCurrentView('addSession')}
            className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 rounded-2xl font-semibold text-lg mb-6 flex items-center justify-center gap-2 hover:shadow-xl hover:scale-[1.02] transition-all"
          >
            <Plus /> Log New Session
          </button>
          
          <div className="space-y-4">
            {selectedClient.sessions.length === 0 ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-12 text-center border border-purple-100">
                <div className="inline-block p-6 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mb-4">
                  <Calendar />
                </div>
                <p className="text-gray-600 text-lg">No sessions yet</p>
                <p className="text-gray-500 mt-2">Log the first session to start tracking!</p>
              </div>
            ) : (
              selectedClient.sessions.map(session => (
                <div key={session.id} className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg p-6 border border-purple-100 hover:shadow-xl transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl">
                        <Calendar />
                      </div>
                      <span className="font-bold text-lg text-gray-800">{session.date}</span>
                    </div>
                    <button
                      onClick={() => deleteSession(session.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 />
                    </button>
                  </div>
                  <div className="mb-3 pl-2">
                    <h4 className="font-bold text-purple-700 mb-2 text-sm uppercase tracking-wide">Exercises</h4>
                    <p className="text-gray-800 whitespace-pre-wrap leading-relaxed">{session.exercises}</p>
                  </div>
                  {session.notes && (
                    <div className="pl-2 pt-3 border-t border-purple-100">
                      <h4 className="font-bold text-purple-700 mb-2 text-sm uppercase tracking-wide">Notes</h4>
                      <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{session.notes}</p>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  }

  // ADD SESSION VIEW
  if (currentView === 'addSession') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-4">
        <div className="max-w-2xl mx-auto">
          <button
            onClick={() => setCurrentView('client')}
            className="mb-6 flex items-center gap-2 text-purple-600 font-semibold text-lg hover:text-purple-700 transition"
          >
            <ArrowLeft /> Back
          </button>
          
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-purple-100">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-xl">
                <Plus />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-800">Log Session</h2>
                <p className="text-gray-600">{selectedClient.name}</p>
              </div>
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 text-lg">Date</label>
              <input
                type="date"
                value={sessionData.date}
                onChange={(e) => setSessionData({...sessionData, date: e.target.value})}
                className="w-full p-5 border-2 border-purple-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none bg-white/50 backdrop-blur-sm transition"
              />
            </div>
            
            <div className="mb-6">
              <label className="block text-gray-700 font-semibold mb-3 text-lg">Exercises & Progress</label>
              <textarea
                value={sessionData.exercises}
                onChange={(e) => setSessionData({...sessionData, exercises: e.target.value})}
                className="w-full p-5 border-2 border-purple-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none bg-white/50 backdrop-blur-sm transition"
                rows="6"
                placeholder="e.g. Squats 3x10 @ 135lbs&#10;Bench Press 3x8 @ 185lbs&#10;Deadlifts 1x5 @ 225lbs"
                autoFocus
              />
            </div>
            
            <div className="mb-8">
              <label className="block text-gray-700 font-semibold mb-3 text-lg">Notes (optional)</label>
              <textarea
                value={sessionData.notes}
                onChange={(e) => setSessionData({...sessionData, notes: e.target.value})}
                className="w-full p-5 border-2 border-purple-200 rounded-xl text-lg focus:border-purple-500 focus:outline-none bg-white/50 backdrop-blur-sm transition"
                rows="3"
                placeholder="Any observations, form issues, energy levels, etc."
              />
            </div>
            
            <button
              onClick={addSession}
              disabled={!sessionData.exercises.trim()}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-500 text-white py-5 rounded-xl font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02] transition-all"
            >
              Save Session
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

ReactDOM.createRoot(document.getElementById('root')).render(<PTClientTracker />);
