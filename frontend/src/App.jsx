import { useEffect, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";

export default function App() {
  // ==============================
  // State
  // ==============================
  const [courts, setCourts] = useState([]);
  const [bookings, setBookings] = useState([]);

  const [form, setForm] = useState({
    customer_name: "",
    court_number: "",
    booking_date: "",
    start_time: "",
    end_time: "",
  });

  // ==============================
  // Load Courts
  // ==============================
  async function loadCourts() {
    try {
      const response = await fetch(`${API_BASE}/courts`);

      if (!response.ok) {
        throw new Error("Failed to load courts");
      }

      const data = await response.json();

      setCourts(data);
    } catch (error) {
      console.error("Load courts error:", error);
    }
  }

  // ==============================
  // Load Bookings
  // ==============================
  async function loadBookings() {
    try {
      const response = await fetch(`${API_BASE}/bookings`);

      if (!response.ok) {
        throw new Error("Failed to load bookings");
      }

      const data = await response.json();

      setBookings(data);
    } catch (error) {
      console.error("Load bookings error:", error);
    }
  }

  // ==============================
  // Load Data
  // ==============================
  useEffect(() => {
    loadCourts();
    loadBookings();
  }, []);

  // ==============================
  // Form Change
  // ==============================
  function handleChange(e) {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  }

  // ==============================
  // Select Court
  // ==============================
  function selectCourt(courtName) {
    setForm({
      ...form,
      court_number: courtName,
    });
  }

  // ==============================
  // Create Booking
  // ==============================
  async function handleSubmit(e) {
    e.preventDefault();

    if (!form.court_number) {
      alert("Please select a court.");
      return;
    }

    if (form.start_time >= form.end_time) {
      alert("End time must be later than start time.");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bookings`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      // Booking time overlaps
      if (response.status === 409) {
        alert("This court is already booked during the selected time.");
        return;
      }

      if (!response.ok) {
        throw new Error(data.error || "Failed to create booking");
      }

      alert("Booking created successfully!");

      // Reset form
      setForm({
        customer_name: "",
        court_number: "",
        booking_date: "",
        start_time: "",
        end_time: "",
      });

      await loadBookings();
    } catch (error) {
      console.error("Create booking error:", error);

      alert("Unable to create booking.");
    }
  }

  // ==============================
  // Delete Booking
  // ==============================
  async function handleDelete(id) {
    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/bookings/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete booking");
      }

      await loadBookings();
    } catch (error) {
      console.error("Delete booking error:", error);

      alert("Unable to cancel booking.");
    }
  }

  // ==============================
  // Format Date
  // ==============================
  function formatDate(date) {
    if (!date) {
      return "-";
    }

    const [year, month, day] = date.split("-");

    return `${day}/${month}/${year}`;
  }

  // ==============================
  // Calculate Duration
  // ==============================
  function calculateDuration(startTime, endTime) {
    if (!startTime || !endTime) {
      return 0;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);

    const [endHour, endMinute] = endTime.split(":").map(Number);

    const startMinutes = startHour * 60 + startMinute;

    const endMinutes = endHour * 60 + endMinute;

    return (endMinutes - startMinutes) / 60;
  }

  // ==============================
  // Calculate Price
  // ==============================
  function calculatePrice() {
    const selectedCourt = courts.find(
      (court) => court.court_name === form.court_number,
    );

    if (!selectedCourt || !form.start_time || !form.end_time) {
      return 0;
    }

    const duration = calculateDuration(form.start_time, form.end_time);

    if (duration <= 0) {
      return 0;
    }

    return duration * Number(selectedCourt.price_per_hour);
  }

  return (
    <div className="page">
      {/* =========================
          Header
      ========================== */}
      <header className="hero">
        <div className="hero-content">
          <div className="logo">🏸</div>

          <div>
            <h1>Badminton Court Booking</h1>

            <p>Choose your court and book your playing time.</p>
          </div>
        </div>
      </header>

      <main className="container">
        {/* =========================
            Courts
        ========================== */}
        <section className="section">
          <div className="section-title">
            <div>
              <span className="eyebrow">OUR COURTS</span>

              <h2>Choose Your Court</h2>
            </div>

            <p>Price per court / hour</p>
          </div>

          <div className="court-grid">
            {courts.map((court) => {
              const isSelected = form.court_number === court.court_name;

              return (
                <div
                  key={court.id}
                  className={`court-card ${isSelected ? "selected" : ""}`}
                  onClick={() => selectCourt(court.court_name)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      selectCourt(court.court_name);
                    }
                  }}
                >
                  <div className="court-icon">🏸</div>

                  <h3>{court.court_name}</h3>

                  <p className="court-type">{court.court_type}</p>

                  <div className="price">
                    ฿{Number(court.price_per_hour)}
                    <span>/ hour</span>
                  </div>

                  <div className="court-select-status">
                    <span>{isSelected ? "Selected" : "Select"}</span>

                    <span
                      className={`select-circle ${isSelected ? "active" : ""}`}
                    >
                      {isSelected ? "✓" : ""}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* =========================
            Booking Form
        ========================== */}
        <section className="booking-card">
          <div className="booking-heading">
            <div>
              <span className="eyebrow">RESERVATION</span>

              <h2>Book a Court</h2>

              <p>Enter your booking information below.</p>
            </div>

            <div className="selected-court">
              Selected Court
              <strong>{form.court_number || "Not selected"}</strong>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              {/* Customer Name */}
              <div className="field">
                <label>Customer Name</label>

                <input
                  type="text"
                  name="customer_name"
                  value={form.customer_name}
                  onChange={handleChange}
                  placeholder="Enter your name"
                  required
                />
              </div>

              {/* Court */}
              <div className="field">
                <label>Court</label>

                <select
                  name="court_number"
                  value={form.court_number}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a court</option>

                  {courts.map((court) => (
                    <option key={court.id} value={court.court_name}>
                      {court.court_name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date */}
              <div className="field">
                <label>Date</label>

                <input
                  type="date"
                  name="booking_date"
                  value={form.booking_date}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Start Time & End Time */}
              <div className="time-row">
                <div className="field">
                  <label>Start Time</label>

                  <input
                    type="time"
                    name="start_time"
                    value={form.start_time}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="field">
                  <label>End Time</label>

                  <input
                    type="time"
                    name="end_time"
                    value={form.end_time}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* =====================
                Booking Summary
            ====================== */}
            {form.court_number &&
              form.start_time &&
              form.end_time &&
              form.start_time < form.end_time && (
                <div
                  className="booking-summary"
                  style={{
                    marginTop: "20px",
                    padding: "16px",
                    background: "#f0f7f3",
                    borderRadius: "10px",
                  }}
                >
                  <strong>Booking Summary</strong>

                  <div
                    style={{
                      marginTop: "8px",
                    }}
                  >
                    {form.court_number}

                    {" • "}

                    {form.start_time}

                    {" - "}

                    {form.end_time}

                    {" • "}

                    {calculateDuration(form.start_time, form.end_time)}

                    {" hour(s)"}
                  </div>

                  <div
                    style={{
                      marginTop: "5px",
                      color: "#17683e",
                      fontWeight: "700",
                    }}
                  >
                    Total: ฿{calculatePrice()}
                  </div>
                </div>
              )}

            <button className="book-button" type="submit">
              Book Court
            </button>
          </form>
        </section>

        {/* =========================
            Booking List
        ========================== */}
        <section className="booking-list">
          <div className="section-title">
            <div>
              <span className="eyebrow">BOOKINGS</span>

              <h2>Booking List</h2>
            </div>

            <div className="booking-count">
              {bookings.length}

              {bookings.length === 1 ? " booking" : " bookings"}
            </div>
          </div>

          <div className="table-card">
            {bookings.length === 0 ? (
              <div className="empty">
                <div className="empty-icon">🏸</div>

                <h3>No bookings yet</h3>

                <p>Your bookings will appear here.</p>
              </div>
            ) : (
              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Customer</th>
                      <th>Court</th>
                      <th>Date</th>
                      <th>Start</th>
                      <th>End</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {bookings.map((booking) => (
                      <tr key={booking.id}>
                        <td>
                          <strong>{booking.customer_name}</strong>
                        </td>

                        <td>
                          <span className="court-badge">
                            {booking.court_number}
                          </span>
                        </td>

                        <td>{formatDate(booking.booking_date)}</td>

                        <td>{booking.start_time}</td>

                        <td>{booking.end_time}</td>

                        <td>
                          <button
                            className="delete-button"
                            onClick={() => handleDelete(booking.id)}
                          >
                            Cancel
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </main>

      <footer>Badminton Court Booking System</footer>
    </div>
  );
}
