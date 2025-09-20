import React, { useEffect, useState, useRef, useCallback } from "react";
import "./App.css";

function formatTime(iso) {
  if(!iso) return "-";
  try{ return new Date(iso).toLocaleString(); }catch(e){return iso}
}

function App() {
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState("dashboard");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  // health state
  const [health, setHealth] = useState({});

  const fetchBookings = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await fetch("/api/bookings");
      const ms = Math.round(performance.now() - start);
      const data = await res.json();
      setBookings(data);
      setHealth(prev => ({...prev, bookings: { ok: res.ok, status: res.status, time: ms }}));
    } catch (e) {
      setHealth(prev => ({...prev, bookings: { ok: false, error: ''+e }}));
    }
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await fetch("/api/logs");
      const ms = Math.round(performance.now() - start);
      const data = await res.json();
      setLogs(data);
      setHealth(prev => ({...prev, logs: { ok: res.ok, status: res.status, time: ms }}));
    } catch (e) {
      setHealth(prev => ({...prev, logs: { ok: false, error: ''+e }}));
    }
  }, []);

  const fetchEmployees = useCallback(async () => {
    try {
      const start = performance.now();
      const res = await fetch("/api/employees");
      const ms = Math.round(performance.now() - start);
      const data = await res.json();
      setEmployees(data);
      setHealth(prev => ({...prev, employees: { ok: res.ok, status: res.status, time: ms }}));
    } catch (e) {
      setHealth(prev => ({...prev, employees: { ok: false, error: ''+e }}));
    }
  }, []);

  const submitBooking = async (e) => {
    e?.preventDefault();
    if (!name) return;
    try {
      const payload = { customer_name: name, notes, party_size: partySize };
      if (startTime && endTime) {
        payload.start_time = new Date(startTime).toISOString();
        payload.end_time = new Date(endTime).toISOString();
      }
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        setError(txt || "Booking failed");
        return;
      }
      setName("");
      setNotes("");
      setStartTime("");
      setEndTime("");
      setPartySize(1);
      setError(null);
      fetchBookings();
    } catch (err) {
      console.error(err);
    }
  };

  // Web Speech API (basic)
  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech Recognition not supported in this browser.");
      return;
    }
    const rec = new SpeechRecognition();
    rec.lang = "en-US";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      (async ()=>{
        try{
          const res = await fetch('/api/nlu', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
          const parsed = await res.json();
          const ents = parsed.entities || {};
          if(ents.customer_name) setName(ents.customer_name);
          if(ents.party_size) setPartySize(ents.party_size);
          if(ents.start_time){
            const d = new Date(ents.start_time);
            if(!isNaN(d)) setStartTime(d.toISOString().slice(0,16));
          }
          if(ents.end_time){
            const d2 = new Date(ents.end_time);
            if(!isNaN(d2)) setEndTime(d2.toISOString().slice(0,16));
          }
          if(Object.keys(ents).length===0){ setName(text); }
        }catch(e){ setName(text); }
      })();
    };
    rec.onend = () => setListening(false);
    recognitionRef.current = rec;
    rec.start();
    setListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) recognitionRef.current.stop();
    setListening(false);
  };

  const pollHealth = useCallback(async () => {
    try{
      const start = performance.now();
      const res = await fetch('/health');
      const ms = Math.round(performance.now()-start);
      const body = await res.json();
      setHealth(prev => ({...prev, root: { ok: res.ok, status: res.status, time: ms, body }}));
    }catch(e){
      setHealth(prev => ({...prev, root: { ok: false, error: ''+e }}));
    }
  }, []);

  const refreshAll = useCallback(async () => {
    await Promise.all([fetchBookings(), fetchLogs(), fetchEmployees()]);
  }, [fetchBookings, fetchLogs, fetchEmployees]);

  useEffect(() => {
    refreshAll();
    pollHealth();
    const hInt = setInterval(pollHealth, 10000);
    return () => clearInterval(hInt);
  }, [refreshAll, pollHealth]);

  // quick convenience actions
  const startSimulator = async ()=>{ await fetch('/api/simulate/start',{method:'POST'}); }
  const finalizeProvisionals = async ()=>{ await fetch('/api/bookings/finalize',{method:'POST'}); refreshAll(); }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white p-6">
      <div className="max-w-7xl mx-auto">
        <nav className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800">Receptionist • Manager</h1>
            <p className="text-sm text-gray-500">Voice & text assistant — bookings, staffing, logs and health</p>
          </div>
          <div className="flex items-center gap-3">
            {['dashboard','metrics','bookings','staff','logs'].map(t => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-md text-sm font-medium transition ${tab===t ? 'bg-indigo-600 text-white shadow' : 'bg-white border'} `}>
                {t[0].toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </nav>

        {/* content */}
        {tab === 'dashboard' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <section className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold">System Health</h2>
                  <p className="text-sm text-gray-500">Quick status of core endpoints and response times</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={pollHealth} className="px-3 py-1 bg-gray-100 rounded">Refresh</button>
                  <button onClick={refreshAll} className="px-3 py-1 bg-gray-100 rounded">Refresh Data</button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border bg-slate-50">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs text-gray-500">Backend</div>
                      <div className={`mt-1 text-lg font-semibold ${health.root?.ok ? 'text-green-600' : 'text-rose-600'}`}>{health.root?.ok ? 'OK' : 'DOWN'}</div>
                    </div>
                    <div className="text-xs text-gray-400">{health.root?.time ? health.root.time + 'ms' : ''}</div>
                  </div>
                  <pre className="mt-3 text-xs text-slate-600 max-h-40 overflow-auto rounded bg-white p-2">{JSON.stringify(health.root?.body || {}, null, 2)}</pre>
                </div>

                <div className="grid grid-cols-1 gap-3">
                  {[['Bookings', health.bookings], ['Logs', health.logs], ['Employees', health.employees]].map(([label, st]) => (
                    <div key={label} className="p-3 rounded-lg border bg-white flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">{label} API</div>
                        <div className={`text-sm font-medium ${st?.ok ? 'text-green-600' : 'text-rose-600'}`}>{st?.ok ? 'OK' : 'DOWN'}</div>
                      </div>
                      <div className="text-xs text-gray-400">{st?.time ? st.time + 'ms' : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            <aside className="bg-white rounded-xl shadow p-6">
              <h3 className="text-md font-semibold mb-3">Quick Actions</h3>
              <div className="flex flex-col gap-2">
                <button onClick={startSimulator} className="px-3 py-2 bg-green-500 text-white rounded">Start Simulator</button>
                <button onClick={finalizeProvisionals} className="px-3 py-2 bg-yellow-400 rounded">Finalize Provisionals</button>
                <button onClick={refreshAll} className="px-3 py-2 bg-slate-100 rounded">Refresh Data</button>
              </div>

              <div className="mt-6">
                <h4 className="font-semibold">Recent bookings</h4>
                <ul className="mt-3 space-y-2 max-h-52 overflow-auto">
                  {bookings.slice(0,6).map(b => (
                    <li key={b.id} className="text-sm border rounded p-3 bg-white">
                      <div className="font-medium">{b.customer_name} <span className="text-xs text-gray-400">#{b.id}</span></div>
                      <div className="text-xs text-gray-500">{formatTime(b.start_time)} → {formatTime(b.end_time)}</div>
                    </li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        )}

        {tab === 'metrics' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white rounded-xl shadow p-6">
              <h2 className="text-xl font-semibold mb-3">Metrics</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 border rounded-lg bg-slate-50">
                  <div className="text-xs text-gray-500">Total bookings</div>
                  <div className="text-2xl font-bold">{bookings.length}</div>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <div className="text-xs text-gray-500">Active staff</div>
                  <div className="text-2xl font-bold">{employees.length}</div>
                </div>
                <div className="p-4 border rounded-lg bg-slate-50">
                  <div className="text-xs text-gray-500">Log entries</div>
                  <div className="text-2xl font-bold">{logs.length}</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold mb-2">Recent Response Times</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {['root','bookings','logs','employees'].map(k => (
                    <div key={k} className="p-3 border rounded bg-white">
                      <div className="text-xs text-gray-500">{k}</div>
                      <div className="text-lg font-medium">{health[k]?.time ? health[k].time + 'ms' : '-'}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="bg-white rounded-xl shadow p-6">
              <h4 className="font-semibold mb-2">Health Snapshot</h4>
              <pre className="text-xs text-slate-600 bg-slate-50 p-3 rounded max-h-72 overflow-auto">{JSON.stringify(health, null, 2)}</pre>
            </aside>
          </div>
        )}

        {tab === 'bookings' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-3">Create Booking</h3>
              <form onSubmit={submitBooking} className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Customer name</label>
                  <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border-gray-300 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start time</label>
                  <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border-gray-300 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">End time</label>
                  <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border-gray-300 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Party size</label>
                  <input value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value || "1"))} type="number" min={1} className="mt-1 block w-24 rounded border-gray-300 p-2" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border-gray-300 p-2" />
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <div className="flex items-center gap-2 mt-2">
                  <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded">Create booking</button>
                  {!listening ? (
                    <button type="button" onClick={startListening} className="px-3 py-2 bg-green-600 text-white rounded">Start voice</button>
                  ) : (
                    <button type="button" onClick={stopListening} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
                  )}
                  <button type="button" onClick={fetchBookings} className="px-3 py-2 bg-slate-100 rounded">Refresh</button>
                </div>
              </form>
            </div>

            <div className="md:col-span-2 bg-white rounded-xl shadow p-6">
              <h3 className="font-semibold mb-3">All Bookings</h3>
              <div className="grid gap-3">
                {bookings.map(b => (
                  <div key={b.id} className="p-3 border rounded flex justify-between items-start bg-white">
                    <div>
                      <div className="font-medium text-lg">{b.customer_name} <span className="text-sm text-gray-400">#{b.id}</span></div>
                      <div className="text-sm text-gray-600">{formatTime(b.start_time)} → {formatTime(b.end_time)}</div>
                      {b.notes && <div className="text-sm mt-1">{b.notes}</div>}
                    </div>
                    <div className="text-xs text-gray-500">{b.status}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'logs' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Logs</h3>
              <button onClick={fetchLogs} className="px-3 py-1 bg-slate-100 rounded">Refresh</button>
            </div>
            <ul className="space-y-2">
              {logs.map(l => (
                <li key={l.id} className="p-3 border rounded bg-white">
                  <div className="font-medium">[{l.type}] {l.source}</div>
                  <div className="text-sm text-gray-600">{l.text}</div>
                  <div className="text-xs text-gray-400">{formatTime(l.timestamp)}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'staff' && (
          <div className="bg-white rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold">Staffing</h3>
              <button onClick={fetchEmployees} className="px-3 py-1 bg-slate-100 rounded">Refresh</button>
            </div>
            <ul className="space-y-2">
              {employees.map(emp => (
                <li key={emp.id} className="p-3 border rounded flex justify-between items-center bg-white">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-gray-500">Standby: {emp.standby ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <button onClick={async () => { await fetch(`/api/employees/${emp.id}/standby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ standby: !emp.standby }) }); fetchEmployees(); }} className="px-3 py-1 bg-indigo-500 text-white rounded">Toggle</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
}

export default App;
