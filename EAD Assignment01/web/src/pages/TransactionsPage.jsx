
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  "https://smart-solar-microgrid.onrender.com/api";

function getArray(data, keys = []) {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) return data[key];
  }

  return [];
}

function getId(item) {
  return String(item?.id ?? item?._id ?? "");
}

function getReservationId(transaction) {
  return String(
    transaction?.reservationId ??
      transaction?.ReservationId ??
      ""
  );
}

function getStatus(item) {
  return String(item?.status ?? item?.Status ?? "")
    .trim()
    .toLowerCase();
}

function getQrToken(item) {
  return (
    item?.qrCodeData ??
    item?.QrCodeData ??
    item?.qrToken ??
    item?.QrToken ??
    ""
  );
}

function getEnergy(item) {
  return (
    item?.energyAmountKwh ??
    item?.EnergyAmountKwh ??
    0
  );
}

function getNic(item) {
  return item?.prosumerNic ?? item?.ProsumerNic ?? "—";
}

function getNodeId(item) {
  return (
    item?.microgridNodeId ??
    item?.MicrogridNodeId ??
    "—"
  );
}

function getTransactionTime(item) {
  return item?.transactionTime ?? item?.TransactionTime ?? null;
}

function getTransactionStatus(item) {
  return item?.status ?? item?.Status ?? "Recorded";
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) return null;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function errorMessage(data, fallback) {
  if (typeof data === "string" && data.trim()) return data;

  return (
    data?.message ??
    data?.Message ??
    data?.title ??
    fallback
  );
}

export default function TransactionsPage() {
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reservationId, setReservationId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transactionsAvailable, setTransactionsAvailable] =
    useState(true);

  const loadData = useCallback(async () => {
    setPageLoading(true);
    setError("");

    try {
      const reservationResponse = await fetch(
        `${API_BASE_URL}/reservations`
      );

      const reservationData =
        await readResponse(reservationResponse);

      if (!reservationResponse.ok) {
        throw new Error(
          errorMessage(
            reservationData,
            `Failed to load bookings (HTTP ${reservationResponse.status}).`
          )
        );
      }

      const reservationList = getArray(reservationData, [
        "reservations",
        "Reservations",
        "data",
        "Data",
        "items",
        "Items",
      ]);

      setReservations(
        reservationList.filter(
          (reservation) => getStatus(reservation) === "approved"
        )
      );

      try {
        const transactionResponse = await fetch(
          `${API_BASE_URL}/transactions`
        );

        const transactionData =
          await readResponse(transactionResponse);

        if (!transactionResponse.ok) {
          setTransactions([]);
          setTransactionsAvailable(false);

          setError(
            `Bookings loaded, but the transactions API returned HTTP ${transactionResponse.status}. Deploy or fix the backend endpoint.`
          );
        } else {
          setTransactions(
            getArray(transactionData, [
              "transactions",
              "Transactions",
              "data",
              "Data",
              "items",
              "Items",
            ])
          );

          setTransactionsAvailable(true);
        }
      } catch {
        setTransactions([]);
        setTransactionsAvailable(false);

        setError(
          "Bookings loaded, but the transactions API could not be reached."
        );
      }
    } catch (err) {
      setReservations([]);
      setTransactions([]);
      setTransactionsAvailable(false);
      setError(err.message || "Unable to load bookings.");
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBooking =
    reservations.find(
      (booking) => getId(booking) === reservationId
    ) ?? null;

  const isAlreadyRecorded = (booking) => {
    const id = getId(booking);

    return (
      Boolean(id) &&
      transactions.some(
        (transaction) => getReservationId(transaction) === id
      )
    );
  };

  const pendingBookings = reservations.filter(
    (booking) => !isAlreadyRecorded(booking)
  );

  const selectBooking = (selectedId) => {
    setReservationId(selectedId);
    setError("");
    setMessage("");

    const booking = reservations.find(
      (item) => getId(item) === selectedId
    );

    // Automatically retrieve the token stored with this booking.
    setQrCodeData(booking ? getQrToken(booking) : "");
  };

  const createTransaction = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!transactionsAvailable) {
      setError(
        "The transactions API is unavailable. Fix and deploy the backend endpoint first."
      );
      return;
    }

    if (!selectedBooking) {
      setError("Please select an approved booking.");
      return;
    }

    if (isAlreadyRecorded(selectedBooking)) {
      setError(
        "A transaction has already been recorded for this booking."
      );
      return;
    }

    if (!qrCodeData.trim()) {
      setError(
        "The QR token was not returned by the booking API. The backend must provide the existing token securely."
      );
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/transactions`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reservationId,
            qrCodeData: qrCodeData.trim(),
          }),
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          errorMessage(
            result,
            `Could not create transaction (HTTP ${response.status}).`
          )
        );
      }

      setMessage("Transaction recorded successfully!");
      setReservationId("");
      setQrCodeData("");

      await loadData();
    } catch (err) {
      setError(
        err.message || "Failed to create transaction."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) return "—";

    const date = new Date(value);

    return Number.isNaN(date.getTime())
      ? String(value)
      : date.toLocaleString();
  };

  if (pageLoading) {
    return (
      <main style={styles.container}>
        <p>Loading approved bookings and transactions...</p>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <header style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            Power Trading Transactions
          </h1>

          <p style={styles.subtitle}>
            Verify approved bookings and record completed
            power trading transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={pageLoading}
          style={styles.secondaryButton}
        >
          Refresh
        </button>
      </header>

      {error && (
        <div role="alert" style={styles.error}>
          {error}
        </div>
      )}

      {message && (
        <div role="status" style={styles.success}>
          {message}
        </div>
      )}

      <section style={styles.summaryGrid}>
        <div style={styles.summaryCard}>
          <span>Approved Bookings</span>
          <strong>{reservations.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Recorded Transactions</span>
          <strong>{transactions.length}</strong>
        </div>

        <div style={styles.summaryCard}>
          <span>Not Yet Recorded</span>
          <strong>{pendingBookings.length}</strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          1. Select an Approved Booking
        </h2>

        <p style={styles.description}>
          Choose a booking to view its details and retrieve
          its existing QR verification token automatically.
        </p>

        <label style={styles.label} htmlFor="reservation">
          Approved Booking
        </label>

        <select
          id="reservation"
          value={reservationId}
          onChange={(event) =>
            selectBooking(event.target.value)
          }
          required
          style={styles.input}
        >
          <option value="">-- Select a booking --</option>

          {reservations.map((booking, index) => {
            const id = getId(booking);
            const recorded = isAlreadyRecorded(booking);

            return (
              <option
                key={id || index}
                value={id}
                disabled={!id || recorded}
              >
                Booking {id || "Unknown"} —{" "}
                {getEnergy(booking)} kWh
                {recorded ? " — Already recorded" : ""}
              </option>
            );
          })}
        </select>

        {reservations.length === 0 && (
          <p style={styles.note}>
            No approved bookings were returned by the API.
            Confirm that your reservations endpoint returns
            bookings with an Approved status.
          </p>
        )}
      </section>

      {selectedBooking && (
        <section style={styles.card}>
          <h2 style={styles.sectionTitle}>
            2. Booking Details and QR Verification
          </h2>

          <div style={styles.detailGrid}>
            <div style={styles.detailItem}>
              <span>Booking ID</span>
              <strong>{getId(selectedBooking) || "—"}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Prosumer NIC</span>
              <strong>{getNic(selectedBooking)}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Microgrid Node</span>
              <strong>{getNodeId(selectedBooking)}</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Energy Amount</span>
              <strong>{getEnergy(selectedBooking)} kWh</strong>
            </div>

            <div style={styles.detailItem}>
              <span>Booking Status</span>
              <strong style={styles.approvedStatus}>
                Approved
              </strong>
            </div>

            <div style={styles.detailItem}>
              <span>Transaction Status</span>
              <strong>
                {isAlreadyRecorded(selectedBooking)
                  ? "Already Recorded"
                  : "Not Yet Recorded"}
              </strong>
            </div>
          </div>

          <div style={styles.qrPanel}>
            <div style={styles.qrIcon}>
              <span style={styles.qrSymbol}>▦</span>
            </div>

            <div style={styles.qrText}>
              <h3 style={styles.qrTitle}>
                QR Token Verification
              </h3>

              {qrCodeData ? (
                <>
                  <p style={styles.successText}>
                    Existing QR token retrieved from the
                    selected booking.
                  </p>

                  <p style={styles.description}>
                    The token is filled in automatically and
                    will be validated by the backend when
                    you record the transaction.
                  </p>
                </>
              ) : (
                <p style={styles.warningText}>
                  The booking API did not return its QR token.
                  The existing QR code may still be displayed
                  on another page, but this page cannot verify
                  it until the backend provides the token.
                </p>
              )}
            </div>
          </div>

          <form onSubmit={createTransaction}>
            <label style={styles.label} htmlFor="qrToken">
              QR Verification Token
            </label>

            <input
              id="qrToken"
              type="password"
              value={qrCodeData}
              onChange={(event) =>
                setQrCodeData(event.target.value)
              }
              placeholder="Token retrieved from the booking"
              autoComplete="off"
              required
              style={styles.input}
              readOnly={Boolean(getQrToken(selectedBooking))}
            />

            <p style={styles.helpText}>
              For security, the token is hidden. You do not
              need to type it when it is returned by the API.
            </p>

            <button
              type="submit"
              disabled={
                loading ||
                !transactionsAvailable ||
                !qrCodeData.trim() ||
                isAlreadyRecorded(selectedBooking)
              }
              style={styles.primaryButton}
            >
              {loading
                ? "Verifying and Recording..."
                : "Verify QR Token & Record Transaction"}
            </button>
          </form>
        </section>
      )}

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          3. Transaction History
        </h2>

        <p style={styles.description}>
          Review recorded power trading transactions.
        </p>

        {!transactionsAvailable ? (
          <p style={styles.note}>
            Transaction history is unavailable. The backend
            transactions endpoint must be deployed and return
            a successful response.
          </p>
        ) : transactions.length === 0 ? (
          <p style={styles.note}>
            No transaction records found yet.
          </p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Transaction ID</th>
                  <th style={styles.th}>Booking ID</th>
                  <th style={styles.th}>Prosumer NIC</th>
                  <th style={styles.th}>Energy (kWh)</th>
                  <th style={styles.th}>Transaction Time</th>
                  <th style={styles.th}>Status</th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction, index) => (
                  <tr key={getId(transaction) || index}>
                    <td style={styles.td}>
                      {getId(transaction) || "—"}
                    </td>

                    <td style={styles.td}>
                      {getReservationId(transaction) || "—"}
                    </td>

                    <td style={styles.td}>
                      {getNic(transaction)}
                    </td>

                    <td style={styles.td}>
                      {getEnergy(transaction)}
                    </td>

                    <td style={styles.td}>
                      {formatDate(
                        getTransactionTime(transaction)
                      )}
                    </td>

                    <td style={styles.td}>
                      {getTransactionStatus(transaction)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: "1200px",
    margin: "0 auto",
    padding: "24px",
    fontFamily: "Arial, sans-serif",
    color: "#1f2937",
  },

  pageHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },

  pageTitle: {
    margin: "0 0 8px",
    fontSize: "28px",
  },

  subtitle: {
    color: "#64748b",
    margin: 0,
    lineHeight: 1.6,
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    marginBottom: "24px",
  },

  summaryCard: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
    padding: "20px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
  },

  card: {
    padding: "24px",
    marginBottom: "24px",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    background: "#ffffff",
  },

  sectionTitle: {
    margin: "0 0 10px",
    fontSize: "20px",
    color: "#111827",
  },

  description: {
    margin: "0 0 20px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  label: {
    display: "block",
    margin: "16px 0 8px",
    fontWeight: "600",
  },

  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    fontSize: "15px",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    margin: "20px 0",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    padding: "16px",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    overflowWrap: "anywhere",
  },

  approvedStatus: {
    color: "#15803d",
  },

  qrPanel: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
    padding: "20px",
    margin: "20px 0",
    border: "1px solid #bfdbfe",
    borderRadius: "10px",
    background: "#eff6ff",
  },

  qrIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "64px",
    height: "64px",
    borderRadius: "8px",
    background: "#ffffff",
    border: "1px solid #dbeafe",
  },

  qrSymbol: {
    fontSize: "42px",
    color: "#1d4ed8",
  },

  qrText: {
    minWidth: 0,
  },

  qrTitle: {
    margin: "0 0 8px",
    fontSize: "17px",
  },

  successText: {
    margin: "0 0 8px",
    color: "#166534",
    fontWeight: "600",
  },

  warningText: {
    margin: 0,
    color: "#92400e",
    lineHeight: 1.6,
  },

  helpText: {
    marginTop: "8px",
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.5,
  },

  primaryButton: {
    marginTop: "16px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "6px",
    background: "#166534",
    color: "#ffffff",
    fontWeight: "600",
    cursor: "pointer",
  },

  secondaryButton: {
    padding: "10px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
  },

  error: {
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "6px",
    background: "#fee2e2",
    color: "#991b1b",
    lineHeight: 1.5,
    overflowWrap: "anywhere",
  },

  success: {
    padding: "12px",
    marginBottom: "16px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
  },

  note: {
    marginTop: "16px",
    color: "#64748b",
    lineHeight: 1.6,
  },

  tableWrapper: {
    overflowX: "auto",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "12px",
    borderBottom: "2px solid #e2e8f0",
    background: "#f8fafc",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
};
