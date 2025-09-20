import React, { useEffect, useState, useRef } from "react";
import "./App.css";

function App() {
  const [bookings, setBookings] = useState([]);
  const [logs, setLogs] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [tab, setTab] = useState("bookings");
  const [name, setName] = useState("");
  const [notes, setNotes] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [partySize, setPartySize] = useState(1);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);
  const [listening, setListening] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchLogs();
    fetchEmployees();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await fetch("/api/bookings");
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/logs");
      const data = await res.json();
      setLogs(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await fetch("/api/employees");
      const data = await res.json();
      setEmployees(data);
    } catch (e) {
      console.error(e);
    }
  };

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
      // call NLU endpoint to parse booking intent and slots
      (async ()=>{
        try{
          const res = await fetch('/api/nlu', {method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({text})});
          const parsed = await res.json();
          const ents = parsed.entities || {};
          if(ents.customer_name) setName(ents.customer_name);
          if(ents.party_size) setPartySize(ents.party_size);
          if(ents.start_time){
            // server NLU returns ISO if available; otherwise try to parse via Date
            const d = new Date(ents.start_time);
            if(!isNaN(d)) setStartTime(d.toISOString().slice(0,16));
          }
          if(ents.end_time){
            const d2 = new Date(ents.end_time);
            if(!isNaN(d2)) setEndTime(d2.toISOString().slice(0,16));
          }
          // if no parsed entities, at least fill the name with raw text
          if(Object.keys(ents).length===0){ setName(text); }
        }catch(e){
          setName(text);
        }
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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-3xl mx-auto bg-white rounded shadow p-6">
        <h1 className="text-2xl font-bold mb-4">Manager Assistant (MVP)</h1>
        <div className="mb-4">
          <button onClick={() => setTab("bookings")} className={`px-3 py-1 mr-2 ${tab === "bookings" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Bookings</button>
          <button onClick={() => setTab("logs")} className={`px-3 py-1 mr-2 ${tab === "logs" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Logs</button>
          <button onClick={() => setTab("staff")} className={`px-3 py-1 mr-2 ${tab === "staff" ? "bg-blue-600 text-white" : "bg-gray-200"}`}>Staffing</button>
          <button onClick={async () => { await fetch('/api/simulate/start', { method: 'POST' }); }} className="px-3 py-1 bg-green-500 text-white">Start Simulator</button>
          <button onClick={async () => { await fetch('/api/bookings/finalize', { method: 'POST' }); fetchBookings(); fetchLogs(); }} className="px-3 py-1 ml-2 bg-yellow-400">Finalize Provisionals</button>
        </div>

        {tab === 'bookings' && (
          <form onSubmit={submitBooking} className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">Customer name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 block w-full rounded border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Start time</label>
            <input value={startTime} onChange={(e) => setStartTime(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">End time</label>
            <input value={endTime} onChange={(e) => setEndTime(e.target.value)} type="datetime-local" className="mt-1 block w-full rounded border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Party size</label>
            <input value={partySize} onChange={(e) => setPartySize(parseInt(e.target.value || "1"))} type="number" min={1} className="mt-1 block w-24 rounded border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1 block w-full rounded border-gray-300" />
          </div>
          {error && <div className="text-red-600">{error}</div>}
          <div className="flex items-center gap-2">
            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded">Create booking</button>
            {!listening ? (
              <button type="button" onClick={startListening} className="px-3 py-2 bg-green-600 text-white rounded">Start voice</button>
            ) : (
              <button type="button" onClick={stopListening} className="px-3 py-2 bg-red-600 text-white rounded">Stop</button>
            )}
            <button type="button" onClick={fetchBookings} className="px-3 py-2 bg-gray-200 rounded">Refresh</button>
          </div>
          </form>
        )}

        {tab === 'logs' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Logs</h2>
            <button onClick={fetchLogs} className="px-2 py-1 bg-gray-200 rounded mb-3">Refresh</button>
            <ul className="space-y-2">
              {logs.map(l => (
                <li key={l.id} className="p-2 border rounded">
                  <div className="font-medium">[{l.type}] {l.source}</div>
                  <div className="text-sm text-gray-600">{l.text}</div>
                  <div className="text-xs text-gray-400">{new Date(l.timestamp).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {tab === 'staff' && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Staffing</h2>
            <button onClick={fetchEmployees} className="px-2 py-1 bg-gray-200 rounded mb-3">Refresh</button>
            <ul className="space-y-2">
              {employees.map(emp => (
                <li key={emp.id} className="p-2 border rounded flex justify-between items-center">
                  <div>
                    <div className="font-medium">{emp.name}</div>
                    <div className="text-sm text-gray-600">Standby: {emp.standby ? 'Yes' : 'No'}</div>
                  </div>
                  <div>
                    <button onClick={async () => { await fetch(`/api/employees/${emp.id}/standby`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ standby: !emp.standby }) }); fetchEmployees(); }} className="px-2 py-1 bg-indigo-500 text-white rounded">Toggle Standby</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <hr className="my-6" />

        <h2 className="text-xl font-semibold mb-3">Bookings</h2>
        <ul className="space-y-2">
          {bookings.map((b) => (
            <li key={b.id} className="p-3 border rounded flex justify-between items-center">
              <div>
                <div className="font-medium">{b.customer_name}</div>
                {b.notes && <div className="text-sm text-gray-600">{b.notes}</div>}
              </div>
              <div className="text-sm text-gray-500">#{b.id}</div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default App;
