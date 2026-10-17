
import React, { useCallback, useEffect, useState } from "react";
import {
  Sun,
  RefreshCw,
  Zap,
  CheckCircle2,
  Clock3,
  Trash2,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Swal from "sweetalert2";
import HeaderMenu from "../components/HeaderMenu";
import "../App.css";

const API_BASE_URL = "https://smart-solar-microgrid.onrender.com/api";

const getReservationId = (reservation) =>
  String(reservation?.id ?? reservation?._id ?? reservation?.reservationId ?? "");

const getTransactionId = (transaction) =>
  String(transaction?.id ?? transaction?._id ?? transaction?.transactionId ?? "");

const getStatus = (reservation) =>
  String(reservation?.status ?? reservation?.Status ?? "").toLowerCase();

const getBookingLabel = (reservation) => {
  const energy =
    reservation?.energyAmountKwh ??
    reservation?.energyKwh ??
    reservation?.EnergyAmountKwh;

  const dateValue =
    reservation?.reservationDate ??
    reservation?.bookingDate ??
    reservation?.createdAt;

  let date = "";

  if (dateValue) {
    const parsed = new Date(dateValue);
    date = Number.isNaN(parsed.getTime())
      ? String(dateValue)
      : parsed.toLocaleDateString();
  }

  return [
    date ? `Booking on ${date}` : "Approved energy booking",
    energy != null ? `${energy} kWh` : "Energy not specified",
  ].join(" · ");
};

export default function TransactionsPage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reservationId, setReservationId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [deletingId, setDeletingId] = useState("");
  const [error, setError] = useState("");
  const [transactionError, setTransactionError] = useState("");
  const [message, setMessage] = useState("");

  const selectedReservation = reservations.find(
    (reservation) => getReservationId(reservation) === reservationId
  );

  const isAlreadyRecorded = (id) =>
    transactions.some(
      (transaction) =>
        String(
          transaction.reservationId ?? transaction.ReservationId ?? ""
        ) === String(id)
    );

  const loadData = useCallback(async () => {
    setPageLoading(true);
    setError("");
    setTransactionError("");

    // Load bookings independently from transaction history.
    try {
      const response = await fetch(`${API_BASE_URL}/reservations`);

      if (!response.ok) {
        throw new Error(`Unable to load bookings (HTTP ${response.status}).`);
      }

      const result = await response.json();

      const list = Array.isArray(result)
        ? result
        : result?.reservations ??
          result?.data ??
          result?.Reservations ??
          [];

      const approved = list.filter(
        (reservation) => getStatus(reservation) === "approved"
      );

      setReservations(approved);

      setReservationId((currentId) =>
        approved.some(
          (reservation) => getReservationId(reservation) === currentId
        )
          ? currentId
          : ""
      );
    } catch (err) {
      setReservations([]);
      setError(err.message || "Unable to load bookings.");
    }

    // Load transactions independently.
    try {
      const response = await fetch(`${API_BASE_URL}/transactions`);

      if (!response.ok) {
        throw new Error(
          `Transaction history unavailable (HTTP ${response.status}).`
        );
      }

      const result = await response.json();

      setTransactions(
        Array.isArray(result)
          ? result
          : result?.transactions ??
              result?.data ??
              result?.Transactions ??
              []
      );
    } catch (err) {
      setTransactions([]);
      setTransactionError(
        `${err.message || "Unable to load transaction history."} Check that the backend TransactionsController is deployed.`
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Automatically populate the QR token from the selected approved booking.
  // The GET /api/reservations response must include qrCodeData / QrCodeData.
  const handleBookingChange = (event) => {
    const selectedId = event.target.value;
    setReservationId(selectedId);

    const booking = reservations.find(
      (reservation) => getReservationId(reservation) === selectedId
    );

    const token =
      booking?.qrCodeData ??
      booking?.QrCodeData ??
      booking?.qr_code_data ??
      booking?.qrToken ??
      booking?.QrToken ??
      "";

    setQrCodeData(typeof token === "string" ? token : String(token ?? ""));
    setMessage("");
    setError("");
  };

  const createTransaction = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!reservationId) {
      await Swal.fire({
        icon: "warning",
        title: "Select a booking",
        text: "Please select an approved booking before continuing.",
        confirmButtonText: "OK",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    if (!qrCodeData.trim()) {
      await Swal.fire({
        icon: "warning",
        title: "QR token required",
        text: "Please enter the booking's QR verification token.",
        confirmButtonText: "OK",
        confirmButtonColor: "#16a34a",
      });
      return;
    }

    if (isAlreadyRecorded(reservationId)) {
      await Swal.fire({
        icon: "info",
        title: "Already recorded",
        text: "A transaction has already been recorded for this booking.",
        confirmButtonText: "OK",
        confirmButtonColor: "#16a34a",
      });
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
        throw new Error(
          result?.message ??
            result?.Message ??
            result?.title ??
            `Transaction creation failed (HTTP ${response.status}).`
        );
      }

      setReservationId("");
      setQrCodeData("");
      await loadData();

      await Swal.fire({
        icon: "success",
        title: "Transaction recorded!",
        text: "The energy transaction has been saved successfully.",
        confirmButtonText: "Great",
        confirmButtonColor: "#16a34a",
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Could not record transaction",
        text: err.message || "Failed to create the transaction.",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setLoading(false);
    }
  };

  // Delete a transaction from the backend after SweetAlert confirmation.
  const deleteTransaction = async (transaction) => {
    const id = getTransactionId(transaction);

    if (!id) {
      await Swal.fire({
        icon: "error",
        title: "Missing transaction ID",
        text: "This transaction cannot be deleted because its ID is missing.",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
      return;
    }

    const confirmation = await Swal.fire({
      title: "Delete transaction?",
      text: "This transaction record will be permanently deleted. This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it",
      cancelButtonText: "Cancel",
      confirmButtonColor: "#dc2626",
      cancelButtonColor: "#64748b",
      reverseButtons: true,
      focusCancel: true,
    });

    if (!confirmation.isConfirmed) return;

    setDeletingId(id);
    setError("");
    setTransactionError("");
    setMessage("");

    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions/${encodeURIComponent(id)}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const responseText = await response.text();
        let errorMessage = responseText;

        try {
          const result = JSON.parse(responseText);
          errorMessage =
            result?.message ??
            result?.Message ??
            result?.title ??
            responseText;
        } catch {
          // The response may be plain text.
        }

        throw new Error(
          errorMessage || `Delete failed (HTTP ${response.status}).`
        );
      }

      // Update the table only after the backend confirms deletion.
      setTransactions((current) =>
        current.filter((item) => getTransactionId(item) !== id)
      );

      await Swal.fire({
        icon: "success",
        title: "Deleted!",
        text: "The transaction has been deleted successfully.",
        confirmButtonText: "Done",
        confirmButtonColor: "#16a34a",
        timer: 2200,
        timerProgressBar: true,
      });
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Delete failed",
        text: err.message || "Unable to delete the transaction.",
        confirmButtonText: "OK",
        confirmButtonColor: "#dc2626",
      });
    } finally {
      setDeletingId("");
    }
  };

  const totalEnergy = transactions.reduce(
    (total, transaction) =>
      total +
      Number(
        transaction.energyAmountKwh ??
          transaction.EnergyAmountKwh ??
          transaction.energyKwh ??
          0
      ),
    0
  );

  return (
    <div className="transaction-page">
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
            className="transaction-nav-link"
            onClick={() => navigate("/operator#battery-slots")}
          >
            Battery Slots
          </button>

          <button
            type="button"
            className="transaction-nav-link"
            onClick={() => navigate("/operator#bookings")}
          >
            Bookings
          </button>

          <button
            type="button"
            className={
              location.pathname === "/grid-operator/transactions"
                ? "transaction-nav-link active"
                : "transaction-nav-link"
            }
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
        <section className="transaction-hero">
          <div>
            <div className="transaction-eyebrow">
              GRID OPERATOR WORKSPACE
            </div>

            <h1>Power Trading Transactions</h1>

            <p>
              Verify approved energy bookings and maintain a record of
              power trading transactions.
            </p>
          </div>

          <button
            type="button"
            className="transaction-refresh-button"
            onClick={loadData}
            disabled={pageLoading || Boolean(deletingId)}
          >
            <RefreshCw
              size={16}
              className={pageLoading ? "transaction-spinning" : ""}
            />
            Refresh data
          </button>
        </section>

        {error && (
          <div
            className="transaction-alert transaction-alert-error"
            role="alert"
          >
            <strong>Attention</strong>
            <span>{error}</span>
          </div>
        )}

        {transactionError && (
          <div
            className="transaction-alert transaction-alert-error"
            role="status"
          >
            <strong>Transaction history</strong>
            <span>{transactionError}</span>
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

        <section className="transaction-stats">
          <article className="transaction-stat-card">
            <div className="transaction-stat-icon orange">
              <Zap size={22} />
            </div>
            <div>
              <span className="transaction-stat-label">Approved bookings</span>
              <strong>{pageLoading ? "—" : reservations.length}</strong>
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
              <strong>{pageLoading ? "—" : transactions.length}</strong>
              <small>Saved transaction records</small>
            </div>
          </article>

          <article className="transaction-stat-card">
            <div className="transaction-stat-icon blue">
              <Zap size={22} />
            </div>
            <div>
              <span className="transaction-stat-label">Recorded energy</span>
              <strong>
                {pageLoading ? "—" : totalEnergy.toLocaleString()}{" "}
                <span className="transaction-unit">kWh</span>
              </strong>
              <small>Total energy in transaction records</small>
            </div>
          </article>
        </section>

        <section className="transaction-panel">
          <div className="transaction-panel-heading">
            <div className="transaction-step-number">1</div>
            <div>
              <h2>Select an Approved Booking</h2>
              <p>
                Select a booking and provide its QR verification token.
              </p>
            </div>
          </div>

          {pageLoading ? (
            <div className="transaction-empty-state">
              Loading approved bookings...
            </div>
          ) : (
            <form onSubmit={createTransaction}>
              <label className="transaction-label" htmlFor="approvedBooking">
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
                        Confirm the booking details before recording.
                      </span>
                    </div>
                  </div>

                  <div className="transaction-detail-grid">
                    <div className="transaction-detail-item">
                      <span>Booking reference</span>
                      <strong>
                        {getReservationId(selectedReservation)
                          .slice(-8)
                          .toUpperCase()}
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
                      The token is populated automatically from the selected booking.
                    </p>
                  </div>
                </div>

                <label className="transaction-label" htmlFor="qrToken">
                  QR verification token
                </label>

                <input
                  id="qrToken"
                  className="transaction-input"
                  type="text"
                  value={qrCodeData}
                  readOnly
                  placeholder="Select an approved booking to load its token"
                  autoComplete="off"
                  required
                />

                <small className="transaction-help-text">
                  This value is loaded from the selected booking. The backend
                  must still validate it against that booking before recording.
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
                  disabled={
                    loading || !reservationId || !qrCodeData.trim()
                  }
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
                Once a booking is approved, it will appear here.
              </span>
            </div>
          )}
        </section>

        <section className="transaction-panel">
          <div className="transaction-history-heading">
            <div className="transaction-panel-heading">
              <div className="transaction-step-number history-step">
                <Clock3 size={18} />
              </div>
              <div>
                <h2>Transaction History</h2>
                <p>
                  Review and manage recorded energy transactions.
                </p>
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
                Transactions will appear here after they are recorded.
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
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((transaction, index) => {
                    const id = getTransactionId(transaction);
                    const transactionTime =
                      transaction.transactionTime ??
                      transaction.TransactionTime ??
                      transaction.createdAt ??
                      transaction.CreatedAt;

                    return (
                      <tr key={id || index}>
                        <td>
                          <span className="transaction-reference">
                            {id ? id.slice(-8).toUpperCase() : "—"}
                          </span>
                        </td>

                        <td>
                          {String(
                            transaction.reservationId ??
                              transaction.ReservationId ??
                              "—"
                          )
                            .slice(-8)
                            .toUpperCase()}
                        </td>

                        <td>
                          {transaction.prosumerNic ??
                            transaction.ProsumerNic ??
                            "—"}
                        </td>

                        <td className="transaction-energy">
                          {transaction.energyAmountKwh ??
                            transaction.EnergyAmountKwh ??
                            "—"}{" "}
                          kWh
                        </td>

                        <td>
                          {transactionTime
                            ? new Date(transactionTime).toLocaleString()
                            : "—"}
                        </td>

                        <td>
                          <span className="transaction-status-badge">
                            <span className="transaction-status-dot" />
                            {transaction.status ??
                              transaction.Status ??
                              "Recorded"}
                          </span>
                        </td>

                        <td>
                          <button
                            type="button"
                            className="transaction-delete-button"
                            onClick={() => deleteTransaction(transaction)}
                            disabled={!id || Boolean(deletingId)}
                            aria-label={`Delete transaction ${id}`}
                            title="Delete transaction"
                          >
                            {deletingId === id ? (
                              <>
                                <RefreshCw
                                  size={15}
                                  className="transaction-spinning"
                                />
                                Deleting...
                              </>
                            ) : (
                              <>
                                <Trash2 size={15} />
                                Delete
                              </>
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
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
