
import { useCallback, useEffect, useState } from "react";

const API_BASE_URL =
  "https://smart-solar-microgrid.onrender.com/api";

// Supports API responses returned as arrays or wrapped objects.
function getArray(data, keys = []) {
  if (Array.isArray(data)) {
    return data;
  }

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
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

function getStatus(reservation) {
  return String(
    reservation?.status ?? reservation?.Status ?? ""
  )
    .trim()
    .toLowerCase();
}

function getEnergy(item) {
  return (
    item?.energyAmountKwh ??
    item?.EnergyAmountKwh ??
    0
  );
}

function getProsumerNic(item) {
  return item?.prosumerNic ?? item?.ProsumerNic ?? "—";
}

function getTransactionTime(transaction) {
  return (
    transaction?.transactionTime ??
    transaction?.TransactionTime ??
    null
  );
}

function getTransactionStatus(transaction) {
  return (
    transaction?.status ??
    transaction?.Status ??
    "Recorded"
  );
}

async function readResponse(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function getErrorMessage(result, fallback) {
  if (typeof result === "string" && result.trim()) {
    return result;
  }

  return (
    result?.message ??
    result?.Message ??
    result?.title ??
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
      // Load bookings independently from transactions.
      const reservationResponse = await fetch(
        `${API_BASE_URL}/reservations`
      );

      const reservationData =
        await readResponse(reservationResponse);

      if (!reservationResponse.ok) {
        throw new Error(
          getErrorMessage(
            reservationData,
            `Failed to load bookings (HTTP ${reservationResponse.status}).`
          )
        );
      }

      const reservationList = getArray(
        reservationData,
        [
          "reservations",
          "Reservations",
          "data",
          "Data",
          "items",
          "Items",
        ]
      );

      const approvedBookings = reservationList.filter(
        (reservation) => getStatus(reservation) === "approved"
      );

      setReservations(approvedBookings);

      // A transaction API error must not hide approved bookings.
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
            `Approved bookings loaded, but the transactions API returned HTTP ${transactionResponse.status}. The backend endpoint must be deployed or fixed.`
          );
        } else {
          const transactionList = getArray(
            transactionData,
            [
              "transactions",
              "Transactions",
              "data",
              "Data",
              "items",
              "Items",
            ]
          );

          setTransactions(transactionList);
          setTransactionsAvailable(true);
        }
      } catch {
        setTransactions([]);
        setTransactionsAvailable(false);

        setError(
          "Approved bookings loaded, but the transactions API could not be reached."
        );
      }
    } catch (err) {
      setReservations([]);
      setTransactions([]);
      setTransactionsAvailable(false);

      setError(
        err.message || "Unable to load bookings."
      );
    } finally {
      setPageLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const isAlreadyRecorded = (reservation) => {
    const id = getId(reservation);

    if (!id) {
      return false;
    }

    return transactions.some(
      (transaction) => getReservationId(transaction) === id
    );
  };

  const createTransaction = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!transactionsAvailable) {
      setError(
        "The transactions API is unavailable. Fix and deploy the backend endpoint before creating a transaction."
      );
      return;
    }

    if (!reservationId || !qrCodeData.trim()) {
      setError(
        "Select an approved booking and enter its QR token."
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
            reservationId: reservationId,
            qrCodeData: qrCodeData.trim(),
          }),
        }
      );

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(
            result,
            `Transaction creation failed (HTTP ${response.status}).`
          )
        );
      }

      setMessage(
        "Transaction record created successfully!"
      );

      setReservationId("");
      setQrCodeData("");

      await loadData();
    } catch (err) {
      setError(
        err.message || "Failed to create the transaction."
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (value) => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return String(value);
    }

    return date.toLocaleString();
  };

  const pendingBookings = reservations.filter(
    (reservation) => !isAlreadyRecorded(reservation)
  );

  if (pageLoading) {
    return (
      <main style={styles.container}>
        <p>Loading bookings and transactions...</p>
      </main>
    );
  }

  return (
    <main style={styles.container}>
      <div style={styles.pageHeader}>
        <div>
          <h1 style={styles.pageTitle}>
            Power Trading Transactions
          </h1>

          <p style={styles.subtitle}>
            Grid Operator dashboard for recording verified
            energy transactions.
          </p>
        </div>

        <button
          type="button"
          onClick={loadData}
          disabled={pageLoading}
          style={styles.refresh}
        >
          Refresh
        </button>
      </div>

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

      <section style={styles.summaryRow}>
        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            Approved Bookings
          </span>

          <strong style={styles.summaryNumber}>
            {reservations.length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            Recorded Transactions
          </span>

          <strong style={styles.summaryNumber}>
            {transactions.length}
          </strong>
        </div>

        <div style={styles.summaryCard}>
          <span style={styles.summaryLabel}>
            Not Yet Recorded
          </span>

          <strong style={styles.summaryNumber}>
            {pendingBookings.length}
          </strong>
        </div>
      </section>

      <section style={styles.card}>
        <h2 style={styles.sectionTitle}>
          Create Transaction Record
        </h2>

        <p style={styles.description}>
          Select an approved booking and provide its QR token.
          The backend will validate the token before recording
          the transaction.
        </p>

        <form onSubmit={createTransaction}>
          <label
            style={styles.label}
            htmlFor="reservation"
          >
            Approved Booking
          </label>

          <select
            id="reservation"
            value={reservationId}
            onChange={(event) =>
              setReservationId(event.target.value)
            }
            required
            style={styles.input}
            disabled={
              !transactionsAvailable ||
              pendingBookings.length === 0
            }
          >
            <option value="">
              -- Select an approved booking --
            </option>

            {reservations.map((reservation, index) => {
              const id = getId(reservation);
              const recorded =
                isAlreadyRecorded(reservation);

              return (
                <option
                  key={id || index}
                  value={id}
                  disabled={!id || recorded}
                >
                  {id || "Unknown ID"} —{" "}
                  {getEnergy(reservation)} kWh
                  {recorded ? " (Already recorded)" : ""}
                </option>
              );
            })}
          </select>

          <label
            style={styles.label}
            htmlFor="qrToken"
          >
            QR Token
          </label>

          <input
            id="qrToken"
            type="password"
            value={qrCodeData}
            onChange={(event) =>
              setQrCodeData(event.target.value)
            }
            placeholder="Enter the actual QR token"
            autoComplete="off"
            required
            style={styles.input}
          />

          <button
            type="submit"
            disabled={
              loading ||
              !transactionsAvailable ||
              !reservationId ||
              !qrCodeData.trim()
            }
            style={{
              ...styles.button,
              opacity:
                loading || !transactionsAvailable
                  ? 0.6
                  : 1,
              cursor:
                loading || !transactionsAvailable
                  ? "not-allowed"
                  : "pointer",
            }}
          >
            {loading
              ? "Verifying..."
              : "Verify & Create Transaction"}
          </button>
        </form>

        {!transactionsAvailable && (
          <p style={styles.note}>
            Transaction creation is disabled until the
            backend transactions endpoint is available.
          </p>
        )}

        {reservations.length === 0 && (
          <p style={styles.note}>
            No approved bookings were returned by the API.
            Check the booking statuses and API response.
          </p>
        )}
      </section>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>
              Transaction Records
            </h2>

            <p style={styles.description}>
              View previously recorded power trading
              transactions.
            </p>
          </div>

          <button
            type="button"
            onClick={loadData}
            style={styles.refresh}
          >
            Refresh
          </button>
        </div>

        {!transactionsAvailable ? (
          <p style={styles.note}>
            Transaction records are unavailable because the
            backend transactions endpoint did not respond
            successfully.
          </p>
        ) : transactions.length === 0 ? (
          <p style={styles.note}>
            No transaction records found.
          </p>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>
                    Transaction ID
                  </th>

                  <th style={styles.th}>
                    Reservation ID
                  </th>

                  <th style={styles.th}>
                    Prosumer NIC
                  </th>

                  <th style={styles.th}>
                    Energy (kWh)
                  </th>

                  <th style={styles.th}>
                    Transaction Time
                  </th>

                  <th style={styles.th}>
                    Status
                  </th>
                </tr>
              </thead>

              <tbody>
                {transactions.map((transaction, index) => (
                  <tr
                    key={getId(transaction) || index}
                  >
                    <td style={styles.td}>
                      {getId(transaction) || "—"}
                    </td>

                    <td style={styles.td}>
                      {getReservationId(transaction) || "—"}
                    </td>

                    <td style={styles.td}>
                      {getProsumerNic(transaction)}
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
    gap: "16px",
    flexWrap: "wrap",
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

  summaryRow: {
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
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "20px",
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "14px",
  },

  summaryNumber: {
    color: "#111827",
    fontSize: "28px",
  },

  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "24px",
  },

  sectionTitle: {
    margin: "0 0 8px",
    fontSize: "20px",
    color: "#111827",
  },

  description: {
    color: "#64748b",
    lineHeight: 1.6,
    margin: "0 0 20px",
  },

  label: {
    display: "block",
    marginTop: "16px",
    marginBottom: "8px",
    fontWeight: "600",
  },

  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    padding: "12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    fontSize: "15px",
    background: "#ffffff",
  },

  button: {
    marginTop: "20px",
    padding: "12px 18px",
    border: "none",
    borderRadius: "6px",
    background: "#166534",
    color: "#ffffff",
    fontWeight: "600",
  },

  refresh: {
    padding: "8px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "6px",
    background: "#ffffff",
    cursor: "pointer",
    whiteSpace: "nowrap",
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

  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    flexWrap: "wrap",
  },

  tableWrapper: {
    overflowX: "auto",
    marginTop: "16px",
  },

  table: {
    width: "100%",
    borderCollapse: "collapse",
    textAlign: "left",
  },

  th: {
    padding: "12px",
    borderBottom: "2px solid #e2e8f0",
    whiteSpace: "nowrap",
    background: "#f8fafc",
  },

  td: {
    padding: "12px",
    borderBottom: "1px solid #e2e8f0",
    fontSize: "14px",
    whiteSpace: "nowrap",
  },
};
