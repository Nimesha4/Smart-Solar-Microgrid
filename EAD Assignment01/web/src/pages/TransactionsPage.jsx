
import React, { useCallback, useEffect, useState } from "react";
import { Sun, RefreshCw, Zap, CheckCircle2, Clock3 } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import HeaderMenu from "../components/HeaderMenu";
import "../App.css";

const API_BASE_URL = "https://smart-solar-microgrid.onrender.com/api";

export default function TransactionsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reservationId, setReservationId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const loadData = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      // Load bookings independently so a missing transactions endpoint
      // does not prevent approved bookings from being displayed.
      const reservationResponse = await fetch(
        `${API_BASE_URL}/reservations`
      );

      if (!reservationResponse.ok) {
        throw new Error(
          `Unable to load bookings (HTTP ${reservationResponse.status}).`
        );
      }

      const reservationResult = await reservationResponse.json();

      const reservationList = Array.isArray(reservationResult)
        ? reservationResult
        : reservationResult?.reservations ??
          reservationResult?.data ??
          [];

      const approvedReservations = reservationList.filter(
        (reservation) =>
          String(reservation.status ?? "").toLowerCase() === "approved"
      );

      setReservations(approvedReservations);

      // Load transactions separately.
      const transactionResponse = await fetch(
        `${API_BASE_URL}/transactions`
      );

      if (transactionResponse.ok) {
        const transactionResult = await transactionResponse.json();

        setTransactions(
          Array.isArray(transactionResult) ? transactionResult : []
        );
      } else {
        setTransactions([]);
        setError(
          `Approved bookings loaded, but transaction records could not be loaded (HTTP ${transactionResponse.status}). Check that the backend TransactionsController is deployed.`
        );
      }
    } catch (err) {
      setError(err.message || "Unable to connect to the backend.");
      setReservations([]);
      setTransactions([]);
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedReservation = reservations.find(
    (reservation) => reservation.id === reservationId
  );

  const getReservationId = (reservation) =>
    reservation.id ?? reservation._id ?? "";

  const isAlreadyRecorded = (id) =>
    transactions.some(
      (transaction) =>
        String(transaction.reservationId) === String(id)
    );

  const getBookingLabel = (reservation) => {
    const energy = reservation.energyAmountKwh ?? reservation.energyKwh;
    const dateValue =
      reservation.reservationDate ??
      reservation.bookingDate ??
      reservation.createdAt;

    const date = dateValue
      ? new Date(dateValue).toLocaleDateString()
      : "";

    const energyText =
      energy !== undefined && energy !== null
        ? `${energy} kWh`
        : "Energy not specified";

    return [
      date ? `Booking on ${date}` : "Approved energy booking",
      energyText,
    ].join(" · ");
  };

  const handleBookingChange = (event) => {
    setReservationId(event.target.value);
    setQrCodeData("");
    setMessage("");
    setError("");
  };

  const createTransaction = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!reservationId || !qrCodeData.trim()) {
      setError("Select an approved booking and provide its QR verification token.");
      return;
    }

    if (isAlreadyRecorded(reservationId)) {
      setError("A transaction has already been recorded for this booking.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_BASE_URL}/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          reservationId,
          qrCodeData: qrCodeData.trim(),
        }),
      });

      const result = await response.json().catch(() => null);

      if (!response.ok) {
        const errorMessage =
          typeof result === "string"
            ? result
            : result?.message ??
              result?.title ??
              `Transaction creation failed (HTTP ${response.status}).`;

        throw new Error(errorMessage);
      }

      setMessage("Transaction recorded successfully.");
      setReservationId("");
      setQrCodeData("");

      await loadData();
    } catch (err) {
      setError(err.message || "Failed to create the transaction.");
    } finally {
      setLoading(false);
    }
  };

  const totalEnergy = transactions.reduce(
    (total, transaction) =>
      total + Number(transaction.energyAmountKwh ?? 0),
    0
  );

  const recordedCount = transactions.length;

  return (
    <div className="transaction-page">
      {/* Shared-style header with your existing hamburger menu */}
      <header className="transaction-header">
        <button
          type="button"
          className="transaction-brand"
          onClick={() => navigate("/")}
          aria-label="Go to home page"
        >
          <span className="transaction-logo">
            <Sun size={23} />
          </span>

          <span className="transaction-brand-text">
            <strong>Solar Microgrid</strong>
            <span>Peer-to-peer energy trading</span>
          </span>
        </button>

        <nav className="transaction-nav" aria-label="Grid Operator navigation">
          <button
            type="button"
            className={
              location.pathname.includes("battery-slots")
                ? "transaction-nav-link active"
                : "transaction-nav-link"
            }
            onClick={() => navigate("/grid-operator/battery-slots")}
          >
            Battery Slots
          </button>

          <button
            type="button"
            className={
              location.pathname.includes("bookings")
                ? "transaction-nav-link active"
                : "transaction-nav-link"
            }
            onClick={() => navigate("/grid-operator/bookings")}
          >
            Bookings
          </button>

          <button
            type="button"
            className="transaction-nav-link active"
            onClick={() => navigate("/grid-operator/transactions")}
            aria-current="page"
          >
            Power Trading Transactions
          </button>
        </nav>

        <div className="transaction-header-menu">
          <HeaderMenu />
        </div>
      </header>

      <main className="transaction-content">
        {/* Page introduction */}
        <section className="transaction-hero">
          <div>
            <div className="transaction-eyebrow">
              GRID OPERATOR WORKSPACE
            </div>

            <h1>Power Trading Transactions</h1>

            <p>
              Verify approved energy bookings and maintain a reliable record
              of completed power trading transactions.
            </p>
          </div>

          <button
            type="button"
            className="transaction-refresh-button"
            onClick={loadData}
            disabled={pageLoading}
          >
            <RefreshCw
              size={16}
              className={pageLoading ? "transaction-spinning" : ""}
            />
            Refresh data
          </button>
        </section>

        {/* Status messages */}
        {error && (
          <div className="transaction-alert transaction-alert-error" role="alert">
            <strong>Attention</strong>
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            className="transaction-alert transaction-alert-success"
            role="status"
          >
            <CheckCircle2 size={20} />
            <span>{message}</span>
          </div>
        )}

        {/* Summary cards */}
        <section className="transaction-stats">
          <article className="transaction-stat-card">
            <div className="transaction-stat-icon orange">
              <Zap size={22} />
            </div>
            <div>
              <span className="transaction-stat-label">
                Approved bookings
              </span>
              <strong>
                {pageLoading ? "—" : reservations.length}
              </strong>
              <small>Available for verification</small>
            </div>
          </article>

          <article className="transaction-stat-card">
            <div className="transaction-stat-icon green">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <span className="transaction-stat-label">
                Recorded transactions
              </span>
              <strong>{pageLoading ? "—" : recordedCount}</strong>
              <small>Saved transaction records</small>
            </div>
          </article>

          <article className="transaction-stat-card">
            <div className="transaction-stat-icon blue">
              <Zap size={22} />
            </div>
            <div>
              <span className="transaction-stat-label">
                Recorded energy
              </span>
              <strong>
                {pageLoading ? "—" : totalEnergy.toLocaleString()}{" "}
                <span className="transaction-unit">kWh</span>
              </strong>
              <small>Total energy in transaction records</small>
            </div>
          </article>
        </section>

        {/* Booking verification */}
        <section className="transaction-panel">
          <div className="transaction-panel-heading">
            <div className="transaction-step-number">1</div>
            <div>
              <h2>Select an Approved Booking</h2>
              <p>
                Choose a booking to view its details and enter its existing
                QR verification token.
              </p>
            </div>
          </div>

          {pageLoading ? (
            <div className="transaction-empty-state">
              Loading approved bookings...
            </div>
          ) : (
            <form onSubmit={createTransaction}>
              <label
                className="transaction-label"
                htmlFor="approvedBooking"
              >
                Approved booking
              </label>

              <select
                id="approvedBooking"
                className="transaction-input"
                value={reservationId}
                onChange={handleBookingChange}
                required
              >
                <option value="">-- Select an approved booking --</option>

                {reservations.map((reservation) => {
                  const id = getReservationId(reservation);

                  if (!id) return null;

                  const recorded = isAlreadyRecorded(id);

                  return (
                    <option key={id} value={id} disabled={recorded}>
                      {getBookingLabel(reservation)}
                      {recorded ? " · Already recorded" : ""}
                    </option>
                  );
                })}
              </select>

              {selectedReservation && (
                <div className="transaction-booking-details">
                  <div className="transaction-detail-heading">
                    <CheckCircle2 size={20} />
                    <div>
                      <strong>Selected booking details</strong>
                      <span>
                        Booking selected successfully. Confirm the details
                        before recording the transaction.
                      </span>
                    </div>
                  </div>

                  <div className="transaction-detail-grid">
                    <div className="transaction-detail-item">
                      <span>Booking reference</span>
                      <strong>
                        {String(getReservationId(selectedReservation)).slice(-8).toUpperCase()}
                      </strong>
                    </div>

                    <div className="transaction-detail-item">
                      <span>Energy amount</span>
                      <strong>
                        {selectedReservation.energyAmountKwh ??
                          selectedReservation.energyKwh ??
                          "—"}{" "}
                        kWh
                      </strong>
                    </div>

                    <div className="transaction-detail-item">
                      <span>Booking status</span>
                      <strong className="transaction-status-approved">
                        Approved
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              <div className="transaction-token-section">
                <div className="transaction-panel-heading token-heading">
                  <div className="transaction-step-number">2</div>
                  <div>
                    <h2>Verify QR Token</h2>
                    <p>
                      Enter the token encoded in the booking's QR code.
                      The backend validates it before creating a transaction.
                    </p>
                  </div>
                </div>

                <label className="transaction-label" htmlFor="qrToken">
                  QR verification token
                </label>

                <input
                  id="qrToken"
                  className="transaction-input"
                  type="password"
                  value={qrCodeData}
                  onChange={(event) => setQrCodeData(event.target.value)}
                  placeholder="Enter or scan the QR verification token"
                  autoComplete="off"
                  required
                />

                <small className="transaction-help-text">
                  For security, the token is not displayed in the booking
                  dropdown. Selecting a booking alone cannot retrieve a token
                  unless your backend provides a dedicated authorized endpoint.
                </small>
              </div>

              <div className="transaction-form-actions">
                <button
                  type="button"
                  className="transaction-secondary-button"
                  onClick={() => {
                    setReservationId("");
                    setQrCodeData("");
                    setError("");
                    setMessage("");
                  }}
                >
                  Clear selection
                </button>

                <button
                  type="submit"
                  className="transaction-primary-button"
                  disabled={loading || !reservationId || !qrCodeData.trim()}
                >
                  {loading ? (
                    "Verifying booking..."
                  ) : (
                    <>
                      <CheckCircle2 size={17} />
                      Verify &amp; Create Transaction
                    </>
                  )}
                </button>
              </div>
            </form>
          )}

          {!pageLoading && reservations.length === 0 && (
            <div className="transaction-empty-state">
              <Clock3 size={24} />
              <strong>No approved bookings available</strong>
              <span>
                Once a booking has been approved, it will appear here.
              </span>
            </div>
          )}
        </section>

        {/* Transaction history */}
        <section className="transaction-panel">
          <div className="transaction-history-heading">
            <div className="transaction-panel-heading">
              <div className="transaction-step-number history-step">
                <Clock3 size={18} />
              </div>
              <div>
                <h2>Transaction History</h2>
                <p>Review the energy transactions recorded in the system.</p>
              </div>
            </div>

            <span className="transaction-count">
              {transactions.length} records
            </span>
          </div>

          {pageLoading ? (
            <div className="transaction-empty-state">
              Loading transaction records...
            </div>
          ) : transactions.length === 0 ? (
            <div className="transaction-empty-state">
              <div className="transaction-empty-icon">
                <Clock3 size={26} />
              </div>
              <strong>No transaction records yet</strong>
              <span>
                Verified transactions will appear here after they are saved.
              </span>
            </div>
          ) : (
            <div className="transaction-table-wrapper">
              <table className="transaction-table">
                <thead>
                  <tr>
                    <th>Transaction reference</th>
                    <th>Booking reference</th>
                    <th>Prosumer NIC</th>
                    <th>Energy</th>
                    <th>Transaction time</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction) => (
                    <tr key={transaction.id ?? transaction._id}>
                      <td>
                        <span className="transaction-reference">
                          {String(
                            transaction.id ?? transaction._id ?? "—"
                          ).slice(-8).toUpperCase()}
                        </span>
                      </td>

                      <td>
                        {String(transaction.reservationId ?? "—")
                          .slice(-8)
                          .toUpperCase()}
                      </td>

                      <td>{transaction.prosumerNic ?? "—"}</td>

                      <td className="transaction-energy">
                        {transaction.energyAmountKwh ?? "—"} kWh
                      </td>

                      <td>
                        {transaction.transactionTime
                          ? new Date(
                              transaction.transactionTime
                            ).toLocaleString()
                          : "—"}
                      </td>

                      <td>
                        <span className="transaction-status-badge">
                          <span className="transaction-status-dot" />
                          {transaction.status ?? "Recorded"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <footer className="transaction-footer">
          Solar Microgrid · Power Trading Management
        </footer>
      </main>
    </div>
  );
}
