import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// 🔑 Set this to your backend server URL
const API_BASE_URL = "https://yourdomain.com/api";

export default function App() {
  const [reservations, setReservations] = useState([]);
  const [shifts, setShifts] = useState([]);

  // --- Handle Reservation ---
  const handleReservation = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const newReservation = {
      customer_name: form.get("customer_name"),
      party_size: parseInt(form.get("party_size"), 10),
      time: form.get("time"),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReservation),
      });

      if (!res.ok) throw new Error("Failed to create reservation");
      const saved = await res.json();

      setReservations((prev) => [...prev, saved]);
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("Error booking reservation.");
    }
  };

  // --- Handle Shift Update ---
  const handleShift = async (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    const newShift = {
      employee_id: parseInt(form.get("employee_id"), 10),
      new_start: form.get("new_start"),
      new_end: form.get("new_end"),
    };

    try {
      const res = await fetch(`${API_BASE_URL}/move_shift`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newShift),
      });

      if (!res.ok) throw new Error("Failed to update shift");
      const saved = await res.json();

      setShifts((prev) => [...prev, saved]);
      e.target.reset();
    } catch (err) {
      console.error(err);
      alert("Error updating shift.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-gray-900 text-white py-4 text-center text-2xl font-bold shadow-md">
        AI Agent Dashboard
      </header>

      <main className="max-w-4xl mx-auto py-10 px-4">
        <Tabs defaultValue="reservations">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="reservations">📖 Reservations</TabsTrigger>
            <TabsTrigger value="shifts">👷 Shift Management</TabsTrigger>
            <TabsTrigger value="admin">⚙️ Admin</TabsTrigger>
          </TabsList>

          {/* Reservations */}
          <TabsContent value="reservations">
            <Card>
              <CardContent className="space-y-6 py-6">
                <form onSubmit={handleReservation} className="space-y-4">
                  <Input name="customer_name" placeholder="Customer Name" required />
                  <Input type="number" name="party_size" placeholder="Party Size" required />
                  <Input type="datetime-local" name="time" required />
                  <Button type="submit" className="w-full">Book Reservation</Button>
                </form>

                <h3 className="font-semibold text-lg">Existing Reservations</h3>
                <ul className="list-disc pl-5">
                  {reservations.map((r, idx) => (
                    <li key={idx}>
                      {r.customer_name} — Party of {r.party_size} at {r.time}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Shifts */}
          <TabsContent value="shifts">
            <Card>
              <CardContent className="space-y-6 py-6">
                <form onSubmit={handleShift} className="space-y-4">
                  <Input type="number" name="employee_id" placeholder="Employee ID" required />
                  <Input type="datetime-local" name="new_start" required />
                  <Input type="datetime-local" name="new_end" required />
                  <Button type="submit" className="w-full">Update Shift</Button>
                </form>

                <h3 className="font-semibold text-lg">Shift Updates</h3>
                <ul className="list-disc pl-5">
                  {shifts.map((s, idx) => (
                    <li key={idx}>
                      Employee {s.employee_id}: {s.new_start} → {s.new_end}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Admin */}
          <TabsContent value="admin">
            <Card>
              <CardContent className="py-6">
                <h3 className="font-semibold text-lg">Admin Settings</h3>
                <p className="text-gray-600">Placeholder for configuration options.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}