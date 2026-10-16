
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  FileCheck2,
  Fingerprint,
  History,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Zap,
} from "lucide-react";

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

function getReservationId(item) {
  return String(item?.reservationId ?? item?.ReservationId ?? "");
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
  return item?.energyAmountKwh ?? item?.EnergyAmountKwh ?? 0;
}

function getNic(item) {
  return (
    item?.prosumerNic ??
    item?.ProsumerNic ??
    "NIC unavailable"
  );
}

function getNodeId(item) {
  return (
    item?.microgridNodeId ??
    item?.MicrogridNodeId ??
    "Node unavailable"
  );
}

function getTransactionTime(item) {
  return item?.transactionTime ?? item?.TransactionTime ?? null;
}

function getTransactionStatus(item) {
  return item?.status ?? item?.Status ?? "Recorded";
}

function getBookingReference(id) {
  return id ? id.slice(-6).toUpperCase() : "UNKNOWN";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? String(value)
    : date.toLocaleString();
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

function getErrorMessage(data, fallback) {
  if (typeof data === "string" && data.trim()) return data;

  return (
    data?.message ??
    data?.Message ??
    data?.title ??
    fallback
  );
}

function StatusBadge({ status }) {
  const normalized = String(status ?? "")
    .trim()
    .toLowerCase();

  const recorded =
    normalized === "recorded" ||
    normalized === "completed" ||
    normalized === "success";

  return (
    <span
      style={{
        ...styles.statusBadge,
        ...(recorded ? styles.statusRecorded : styles.statusPending),
      }}
    >
      <span style={styles.statusDot} />
      {status || "Unknown"}
    </span>
  );
}

function SummaryCard({
  title,
  value,
  description,
  icon: Icon,
  color,
}) {
  return (
    <article style={styles.summaryCard}>
      <div style={styles.summaryTop}>
        <div style={styles.summaryIcon(color)}>
          <Icon size={21} />
        </div>
        <span style={styles.summaryLabel}>{title}</span>
      </div>

      <div style={styles.summaryValue}>{value}</div>

      <div style={styles.summaryDescription}>
        {description}
      </div>
    </article>
  );
}

export default function TransactionsPage() {
  const [reservations, setReservations] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [reservationId, setReservationId] = useState("");
  const [qrCodeData, setQrCodeData] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [transactionsAvailable, setTransactionsAvailable] =
    useState(true);

  const loadData = useCallback(async (isRefresh = false) => {
    setPageLoading(!isRefresh);
    setRefreshing(isRefresh);
    setError("");

    try {
      const reservationResponse = await fetch(
        `${API_BASE_URL}/reservations`
      );

      const reservationData =
        await readResponse(reservationResponse);

      if (!reservationResponse.ok) {
        throw new Error(
          getErrorMessage(
            reservationData,
            `Unable to load bookings (HTTP ${reservationResponse.status}).`
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

      const approvedBookings = reservationList.filter(
        (booking) => getStatus(booking) === "approved"
      );

      setReservations(approvedBookings);

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
            `Bookings loaded, but the transactions API returned HTTP ${transactionResponse.status}. Check the deployed backend endpoint.`
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
      setError(err.message || "Unable to load dashboard data.");
    } finally {
      setPageLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedBooking = useMemo(
    () =>
      reservations.find(
        (booking) => getId(booking) === reservationId
      ) ?? null,
    [reservations, reservationId]
  );

  const isAlreadyRecorded = useCallback(
    (booking) => {
      const id = getId(booking);

      return (
        Boolean(id) &&
        transactions.some(
          (transaction) => getReservationId(transaction) === id
        )
      );
    },
    [transactions]
  );

  const pendingBookings = useMemo(
    () =>
      reservations.filter(
        (booking) => !isAlreadyRecorded(booking)
      ),
    [reservations, isAlreadyRecorded]
  );

  const totalEnergy = useMemo(
    () =>
      transactions.reduce(
        (sum, transaction) =>
          sum + (Number(getEnergy(transaction)) || 0),
        0
      ),
    [transactions]
  );

  const filteredTransactions = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();

    if (!query) return transactions;

    return transactions.filter((transaction) => {
      const searchable = [
        getId(transaction),
        getReservationId(transaction),
        getNic(transaction),
        getEnergy(transaction),
        getTransactionStatus(transaction),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(query);
    });
  }, [transactions, searchTerm]);

  const selectBooking = (selectedId) => {
    setReservationId(selectedId);
    setError("");
    setMessage("");

    const booking = reservations.find(
      (item) => getId(item) === selectedId
    );

    // Retrieve the existing token from the selected booking.
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
        "No QR token was returned for this booking. The backend must provide the existing token securely."
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
          getErrorMessage(
            result,
            `Transaction creation failed (HTTP ${response.status}).`
          )
        );
      }

      setMessage("Transaction recorded successfully.");
      setReservationId("");
      setQrCodeData("");

      await loadData(true);
    } catch (err) {
      setError(
        err.message || "Failed to create transaction."
      );
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <main style={styles.page}>
        <div style={styles.loadingCard}>
          <LoaderCircle
            size={30}
            style={{ animation: "spin 1s linear infinite" }}
          />
          <h2>Loading transaction dashboard</h2>
          <p>Retrieving approved bookings and transaction records.</p>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .transaction-button {
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .transaction-button:not(:disabled):hover {
          transform: translateY(-1px);
          box-shadow: 0 5px 12px rgba(15, 23, 42, 0.12);
        }

        .transaction-input:focus {
          outline: 3px solid rgba(37, 99, 235, 0.13);
          border-color: #2563eb !important;
        }

        .transaction-row:hover {
          background: #f8fafc;
        }

        @media (max-width: 640px) {
          .transaction-page-inner {
            padding: 16px !important;
          }

          .transaction-header {
            align-items: flex-start !important;
            flex-direction: column !important;
          }

          .transaction-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      <div
        className="transaction-page-inner"
        style={styles.inner}
      >
        <header
          className="transaction-header"
          style={styles.header}
        >
          <div>
            <div style={styles.eyebrow}>
              <Activity size={15} />
              GRID OPERATOR / ENERGY MANAGEMENT
            </div>

            <h1 style={styles.title}>
              Power Trading Transactions
            </h1>

            <p style={styles.subtitle}>
              Verify approved energy bookings and maintain
              a reliable record of power trading activities.
            </p>
          </div>

          <button
            type="button"
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="transaction-button"
            style={styles.refreshButton}
          >
            <RefreshCw
              size={16}
              style={{
                animation: refreshing
                  ? "spin 1s linear infinite"
                  : "none",
              }}
            />
            {refreshing ? "Refreshing..." : "Refresh Data"}
          </button>
        </header>

        {error && (
          <div role="alert" style={styles.errorBanner}>
            <AlertCircle size={20} />
            <div>{error}</div>
          </div>
        )}

        {message && (
          <div role="status" style={styles.successBanner}>
            <CheckCircle2 size={20} />
            <div>{message}</div>
          </div>
        )}

        <section style={styles.summaryGrid}>
          <SummaryCard
            title="Approved Bookings"
            value={reservations.length}
            description="Bookings ready for verification"
            icon={FileCheck2}
            color="blue"
          />

          <SummaryCard
            title="Recorded Transactions"
            value={transactions.length}
            description="Saved transaction records"
            icon={CheckCircle2}
            color="green"
          />

          <SummaryCard
            title="Awaiting Recording"
            value={pendingBookings.length}
            description="Approved bookings not yet recorded"
            icon={Clock3}
            color="amber"
          />

          <SummaryCard
            title="Energy Traded"
            value={`${Number(totalEnergy.toFixed(2)).toLocaleString()} kWh`}
            description="Combined energy in recorded transactions"
            icon={Zap}
            color="purple"
          />
        </section>

        <section style={styles.card}>
          <div style={styles.sectionHeader}>
            <div style={styles.stepIcon}>
              <span>01</span>
            </div>

            <div>
              <h2 style={styles.sectionTitle}>
                Select an Approved Booking
              </h2>

              <p style={styles.sectionDescription}>
                Choose a booking by its Prosumer NIC and energy
                amount. The existing QR token is retrieved when
                available.
              </p>
            </div>
          </div>

          <div style={styles.formField}>
            <label
              htmlFor="reservation"
              style={styles.label}
            >
              Approved Booking
            </label>

            <select
              id="reservation"
              className="transaction-input"
              value={reservationId}
              onChange={(event) =>
                selectBooking(event.target.value)
              }
              required
              style={styles.input}
            >
              <option value="">
                -- Choose an approved booking --
              </option>

              {reservations.map((booking, index) => {
                const id = getId(booking);
                const recorded = isAlreadyRecorded(booking);

                return (
                  <option
                    key={id || index}
                    value={id}
                    disabled={!id || recorded}
                  >
                    {`Prosumer: ${getNic(booking)} | Energy: ${getEnergy(booking)} kWh | Ref: ${getBookingReference(id)}${recorded ? " | Already recorded" : ""}`}
                  </option>
                );
              })}
            </select>

            <p style={styles.helperText}>
              {reservations.length > 0
                ? `${reservations.length} approved booking(s) available. Already recorded bookings cannot be selected.`
                : "No approved bookings were returned. Check the booking approval status in the backend."}
            </p>
          </div>

          {selectedBooking && (
            <div style={styles.selectedBanner}>
              <div style={styles.selectedIcon}>
                <CheckCircle2 size={23} />
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={styles.selectedTitle}>
                  Booking selected successfully
                </strong>

                <p style={styles.selectedDescription}>
                  Reference:{" "}
                  {getBookingReference(getId(selectedBooking))}
                  {" · "}
                  {getEnergy(selectedBooking)} kWh
                </p>
              </div>

              <span style={styles.approvedBadge}>
                APPROVED
              </span>
            </div>
          )}
        </section>

        {selectedBooking && (
          <section style={styles.card}>
            <div style={styles.sectionHeader}>
              <div style={styles.stepIcon}>
                <span>02</span>
              </div>

              <div>
                <h2 style={styles.sectionTitle}>
                  Booking Details & QR Verification
                </h2>

                <p style={styles.sectionDescription}>
                  Review the selected booking before creating
                  the transaction record.
                </p>
              </div>
            </div>

            <div
              className="transaction-detail-grid"
              style={styles.detailGrid}
            >
              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Booking Reference
                </span>

                <strong style={styles.detailValue}>
                  {getBookingReference(getId(selectedBooking))}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Prosumer NIC
                </span>

                <strong style={styles.detailValue}>
                  {getNic(selectedBooking)}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Energy Amount
                </span>

                <strong style={styles.energyValue}>
                  <Zap size={17} />
                  {getEnergy(selectedBooking)} kWh
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Microgrid Node
                </span>

                <strong style={styles.detailValue}>
                  {getNodeId(selectedBooking)}
                </strong>
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Booking Status
                </span>

                <StatusBadge status="Approved" />
              </div>

              <div style={styles.detailItem}>
                <span style={styles.detailLabel}>
                  Transaction Status
                </span>

                <StatusBadge
                  status={
                    isAlreadyRecorded(selectedBooking)
                      ? "Recorded"
                      : "Pending"
                  }
                />
              </div>
            </div>

            <div style={styles.qrPanel}>
              <div style={styles.qrPanelHeader}>
                <div style={styles.qrShield}>
                  <ShieldCheck size={25} />
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={styles.qrTitle}>
                    QR Token Verification
                  </h3>

                  <p style={styles.qrDescription}>
                    The existing booking token is used to
                    verify the transaction with the backend.
                  </p>
                </div>

                <span
                  style={{
                    ...styles.tokenBadge,
                    ...(qrCodeData
                      ? styles.tokenAvailable
                      : styles.tokenMissing),
                  }}
                >
                  {qrCodeData
                    ? "TOKEN AVAILABLE"
                    : "TOKEN UNAVAILABLE"}
                </span>
              </div>

              <form onSubmit={createTransaction}>
                <label
                  htmlFor="qrToken"
                  style={styles.label}
                >
                  QR Verification Token
                </label>

                <div style={styles.tokenInputWrapper}>
                  <Fingerprint
                    size={19}
                    color="#64748b"
                  />

                  <input
                    id="qrToken"
                    className="transaction-input"
                    type="password"
                    value={qrCodeData}
                    onChange={(event) =>
                      setQrCodeData(event.target.value)
                    }
                    placeholder={
                      qrCodeData
                        ? "Existing token retrieved automatically"
                        : "Token not included in booking response"
                    }
                    autoComplete="off"
                    required
                    readOnly={Boolean(
                      getQrToken(selectedBooking)
                    )}
                    style={styles.tokenInput}
                  />
                </div>

                <p style={styles.helperText}>
                  {qrCodeData
                    ? "The token is hidden for security and will be submitted for backend validation."
                    : "The booking API must return the existing QR token before automatic verification can work."}
                </p>

                <div style={styles.actionRow}>
                  <button
                    type="button"
                    className="transaction-button"
                    onClick={() => selectBooking("")}
                    style={styles.cancelButton}
                  >
                    Clear Selection
                  </button>

                  <button
                    type="submit"
                    className="transaction-button"
                    disabled={
                      loading ||
                      !transactionsAvailable ||
                      !qrCodeData.trim() ||
                      isAlreadyRecorded(selectedBooking)
                    }
                    style={{
                      ...styles.primaryButton,
                      opacity:
                        loading ||
                        !transactionsAvailable ||
                        !qrCodeData.trim() ||
                        isAlreadyRecorded(selectedBooking)
                          ? 0.55
                          : 1,
                    }}
                  >
                    {loading ? (
                      <>
                        <LoaderCircle
                          size={17}
                          style={{
                            animation: "spin 1s linear infinite",
                          }}
                        />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={17} />
                        Verify & Record Transaction
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </section>
        )}

        <section style={styles.card}>
          <div style={styles.historyHeader}>
            <div style={styles.sectionHeader}>
              <div style={styles.stepIcon}>
                <History size={20} />
              </div>

              <div>
                <h2 style={styles.sectionTitle}>
                  Transaction History
                </h2>

                <p style={styles.sectionDescription}>
                  Review saved power trading transaction records.
                </p>
              </div>
            </div>

            <div style={styles.searchWrapper}>
              <Search size={17} color="#64748b" />

              <input
                className="transaction-input"
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(event.target.value)
                }
                placeholder="Search transactions..."
                aria-label="Search transactions"
                style={styles.searchInput}
              />
            </div>
          </div>

          {!transactionsAvailable ? (
            <div style={styles.emptyState}>
              <AlertCircle size={32} color="#b45309" />

              <h3>Transaction history unavailable</h3>

              <p>
                The bookings loaded, but the backend
                transactions endpoint did not respond
                successfully. Check the deployed API.
              </p>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div style={styles.emptyState}>
              <div style={styles.emptyIcon}>
                <History size={28} />
              </div>

              <h3>
                {searchTerm
                  ? "No matching transactions"
                  : "No transactions recorded yet"}
              </h3>

              <p>
                {searchTerm
                  ? "Try searching with a different reference, NIC, or status."
                  : "Once an approved booking has been verified, its transaction will appear here."}
              </p>
            </div>
          ) : (
            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>Transaction</th>
                    <th style={styles.th}>Booking Reference</th>
                    <th style={styles.th}>Prosumer NIC</th>
                    <th style={styles.th}>Energy</th>
                    <th style={styles.th}>Date & Time</th>
                    <th style={styles.th}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredTransactions.map(
                    (transaction, index) => (
                      <tr
                        key={getId(transaction) || index}
                        className="transaction-row"
                      >
                        <td style={styles.td}>
                          <div style={styles.transactionIdCell}>
                            <div style={styles.tableIcon}>
                              <Zap size={16} />
                            </div>

                            <div>
                              <strong style={styles.tablePrimary}>
                                TX-{getBookingReference(getId(transaction))}
                              </strong>

                              <span style={styles.tableSecondary}>
                                Energy transaction
                              </span>
                            </div>
                          </div>
                        </td>

                        <td style={styles.td}>
                          <span style={styles.referenceText}>
                            {getBookingReference(
                              getReservationId(transaction)
                            )}
                          </span>
                        </td>

                        <td style={styles.td}>
                          {getNic(transaction)}
                        </td>

                        <td style={styles.td}>
                          <strong>
                            {getEnergy(transaction)} kWh
                          </strong>
                        </td>

                        <td style={styles.td}>
                          {formatDate(
                            getTransactionTime(transaction)
                          )}
                        </td>

                        <td style={styles.td}>
                          <StatusBadge
                            status={getTransactionStatus(
                              transaction
                            )}
                          />
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}

          {transactionsAvailable &&
            filteredTransactions.length > 0 && (
              <div style={styles.tableFooter}>
                <span>
                  Showing {filteredTransactions.length} of{" "}
                  {transactions.length} transactions
                </span>

                <span style={styles.footerTotal}>
                  <Zap size={15} />
                  {Number(totalEnergy.toFixed(2)).toLocaleString()} kWh total
                </span>
              </div>
            )}
        </section>

        <footer style={styles.footer}>
          <div style={styles.footerIcon}>
            <ShieldCheck size={17} />
          </div>

          <span>
            Power Trading Management · Grid Operator Dashboard
          </span>

          <span style={styles.footerRight}>
            <span style={styles.onlineDot} />
            API connection status is reflected by the messages above
          </span>
        </footer>
      </div>
    </main>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#f4f7fb",
    color: "#172033",
    fontFamily:
      "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif",
  },

  inner: {
    maxWidth: "1450px",
    margin: "0 auto",
    padding: "32px",
  },

  loadingCard: {
    minHeight: "70vh",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    gap: "12px",
    color: "#475569",
    textAlign: "center",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "24px",
    marginBottom: "28px",
  },

  eyebrow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: "#2563eb",
    fontSize: "11px",
    fontWeight: "800",
    letterSpacing: "1.3px",
    marginBottom: "12px",
  },

  title: {
    margin: "0 0 10px",
    color: "#111c32",
    fontSize: "clamp(26px, 3vw, 34px)",
    fontWeight: "750",
    letterSpacing: "-0.8px",
    lineHeight: 1.2,
  },

  subtitle: {
    maxWidth: "760px",
    margin: 0,
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.7,
  },

  refreshButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    flexShrink: 0,
    padding: "12px 16px",
    border: "1px solid #dbe3ee",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#334155",
    fontWeight: "650",
    cursor: "pointer",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(210px, 1fr))",
    gap: "18px",
    marginBottom: "24px",
  },

  summaryCard: {
    padding: "22px",
    border: "1px solid #e5eaf2",
    borderRadius: "14px",
    background: "#ffffff",
    boxShadow: "0 2px 8px rgba(15, 23, 42, 0.025)",
  },

  summaryTop: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    marginBottom: "18px",
  },

  summaryIcon: (color) => {
    const colors = {
      blue: { color: "#2563eb", background: "#eff6ff" },
      green: { color: "#15803d", background: "#f0fdf4" },
      amber: { color: "#b45309", background: "#fffbeb" },
      purple: { color: "#7c3aed", background: "#f5f3ff" },
    };

    return {
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      width: "43px",
      height: "43px",
      borderRadius: "11px",
      ...(colors[color] || colors.blue),
    };
  },

  summaryLabel: {
    color: "#64748b",
    fontSize: "13px",
    fontWeight: "650",
  },

  summaryValue: {
    color: "#111c32",
    fontSize: "29px",
    fontWeight: "750",
    letterSpacing: "-0.7px",
    overflowWrap: "anywhere",
  },

  summaryDescription: {
    marginTop: "7px",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.5,
  },

  card: {
    padding: "26px",
    marginBottom: "24px",
    border: "1px solid #e3e9f2",
    borderRadius: "15px",
    background: "#ffffff",
    boxShadow: "0 3px 12px rgba(15, 23, 42, 0.025)",
    minWidth: 0,
  },

  sectionHeader: {
    display: "flex",
    alignItems: "flex-start",
    gap: "14px",
    marginBottom: "22px",
  },

  stepIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    width: "42px",
    height: "42px",
    border: "1px solid #dbeafe",
    borderRadius: "11px",
    background: "#eff6ff",
    color: "#2563eb",
    fontSize: "13px",
    fontWeight: "800",
  },

  sectionTitle: {
    margin: "0 0 7px",
    color: "#18243a",
    fontSize: "19px",
    fontWeight: "750",
  },

  sectionDescription: {
    margin: 0,
    color: "#64748b",
    fontSize: "13px",
    lineHeight: 1.7,
  },

  formField: {
    maxWidth: "100%",
  },

  label: {
    display: "block",
    marginBottom: "9px",
    color: "#334155",
    fontSize: "13px",
    fontWeight: "700",
  },

  input: {
    display: "block",
    boxSizing: "border-box",
    width: "100%",
    minHeight: "48px",
    padding: "12px 14px",
    border: "1px solid #d5deea",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#1e293b",
    fontSize: "14px",
    transition: "border-color 0.15s ease",
  },

  helperText: {
    margin: "9px 0 0",
    color: "#94a3b8",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  selectedBanner: {
    display: "flex",
    alignItems: "center",
    gap: "13px",
    marginTop: "22px",
    padding: "16px",
    border: "1px solid #bbf7d0",
    borderRadius: "11px",
    background: "#f0fdf4",
  },

  selectedIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "40px",
    height: "40px",
    flexShrink: 0,
    borderRadius: "10px",
    background: "#dcfce7",
    color: "#15803d",
  },

  selectedTitle: {
    display: "block",
    color: "#166534",
    fontSize: "13px",
  },

  selectedDescription: {
    margin: "5px 0 0",
    color: "#4b7b5b",
    fontSize: "12px",
  },

  approvedBadge: {
    marginLeft: "auto",
    padding: "6px 9px",
    borderRadius: "6px",
    background: "#dcfce7",
    color: "#166534",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },

  detailGrid: {
    display: "grid",
    gridTemplateColumns:
      "repeat(auto-fit, minmax(185px, 1fr))",
    gap: "13px",
    marginBottom: "24px",
  },

  detailItem: {
    display: "flex",
    flexDirection: "column",
    alignItems: "flex-start",
    justifyContent: "center",
    gap: "10px",
    minWidth: 0,
    padding: "17px",
    border: "1px solid #e8edf4",
    borderRadius: "10px",
    background: "#fbfcfe",
    overflowWrap: "anywhere",
  },

  detailLabel: {
    color: "#64748b",
    fontSize: "12px",
    fontWeight: "600",
  },

  detailValue: {
    color: "#1e293b",
    fontSize: "14px",
    fontWeight: "750",
    overflowWrap: "anywhere",
  },

  energyValue: {
    display: "flex",
    alignItems: "center",
    gap: "7px",
    color: "#2563eb",
    fontSize: "17px",
    fontWeight: "800",
  },

  statusBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    padding: "6px 10px",
    borderRadius: "7px",
    fontSize: "11px",
    fontWeight: "750",
    textTransform: "capitalize",
  },

  statusRecorded: {
    color: "#15803d",
    background: "#dcfce7",
  },

  statusPending: {
    color: "#b45309",
    background: "#fef3c7",
  },

  statusDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "currentColor",
  },

  qrPanel: {
    padding: "22px",
    border: "1px solid #dbe5f4",
    borderRadius: "12px",
    background: "#f8faff",
  },

  qrPanelHeader: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "14px",
    marginBottom: "23px",
  },

  qrShield: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "49px",
    height: "49px",
    flexShrink: 0,
    borderRadius: "12px",
    background: "#dbeafe",
    color: "#1d4ed8",
  },

  qrTitle: {
    margin: "0 0 6px",
    color: "#1e293b",
    fontSize: "16px",
    fontWeight: "750",
  },

  qrDescription: {
    margin: 0,
    color: "#64748b",
    fontSize: "12px",
    lineHeight: 1.6,
  },

  tokenBadge: {
    marginLeft: "auto",
    padding: "7px 10px",
    borderRadius: "7px",
    fontSize: "10px",
    fontWeight: "800",
    letterSpacing: "0.4px",
  },

  tokenAvailable: {
    color: "#166534",
    background: "#dcfce7",
  },

  tokenMissing: {
    color: "#92400e",
    background: "#fef3c7",
  },

  tokenInputWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "0 13px",
    border: "1px solid #d5deea",
    borderRadius: "9px",
    background: "#ffffff",
  },

  tokenInput: {
    flex: 1,
    minWidth: 0,
    padding: "13px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#334155",
    fontSize: "14px",
  },

  actionRow: {
    display: "flex",
    justifyContent: "flex-end",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "23px",
  },

  cancelButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 16px",
    border: "1px solid #dbe3ee",
    borderRadius: "9px",
    background: "#ffffff",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "700",
    cursor: "pointer",
  },

  primaryButton: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "9px",
    padding: "13px 18px",
    border: "none",
    borderRadius: "9px",
    background: "#1d4ed8",
    color: "#ffffff",
    fontSize: "13px",
    fontWeight: "750",
    cursor: "pointer",
  },

  historyHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "18px",
    marginBottom: "20px",
  },

  searchWrapper: {
    display: "flex",
    alignItems: "center",
    gap: "9px",
    minWidth: "230px",
    padding: "0 12px",
    border: "1px solid #dbe3ee",
    borderRadius: "9px",
    background: "#ffffff",
  },

  searchInput: {
    width: "100%",
    minWidth: 0,
    padding: "12px 0",
    border: "none",
    outline: "none",
    background: "transparent",
    color: "#334155",
    fontSize: "13px",
  },

  tableWrapper: {
    width: "100%",
    overflowX: "auto",
    border: "1px solid #e8edf4",
    borderRadius: "10px",
  },

  table: {
    width: "100%",
    minWidth: "850px",
    borderCollapse: "collapse",
    textAlign: "left",
    background: "#ffffff",
  },

  th: {
    padding: "15px 16px",
    borderBottom: "1px solid #e2e8f0",
    background: "#f8fafc",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },

  td: {
    padding: "15px 16px",
    borderBottom: "1px solid #edf1f6",
    color: "#475569",
    fontSize: "12px",
    whiteSpace: "nowrap",
  },

  transactionIdCell: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
  },

  tableIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "35px",
    height: "35px",
    flexShrink: 0,
    borderRadius: "9px",
    background: "#eff6ff",
    color: "#2563eb",
  },

  tablePrimary: {
    display: "block",
    color: "#1e293b",
    fontSize: "12px",
  },

  tableSecondary: {
    display: "block",
    marginTop: "4px",
    color: "#94a3b8",
    fontSize: "10px",
  },

  referenceText: {
    display: "inline-block",
    padding: "5px 7px",
    borderRadius: "5px",
    background: "#f1f5f9",
    color: "#475569",
    fontWeight: "750",
    fontSize: "11px",
  },

  emptyState: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    minHeight: "230px",
    padding: "30px 20px",
    border: "1px dashed #dbe3ee",
    borderRadius: "11px",
    background: "#fbfcfe",
    textAlign: "center",
  },

  emptyIcon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "58px",
    height: "58px",
    borderRadius: "15px",
    background: "#eff6ff",
    color: "#2563eb",
  },

  tableFooter: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "12px",
    marginTop: "16px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  footerTotal: {
    display: "inline-flex",
    alignItems: "center",
    gap: "6px",
    color: "#2563eb",
    fontWeight: "750",
  },

  errorBanner: {
    display: "flex",
    alignItems: "flex-start",
    gap: "12px",
    padding: "15px 17px",
    marginBottom: "20px",
    border: "1px solid #fecaca",
    borderRadius: "10px",
    background: "#fef2f2",
    color: "#991b1b",
    fontSize: "13px",
    lineHeight: 1.6,
    overflowWrap: "anywhere",
  },

  successBanner: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "15px 17px",
    marginBottom: "20px",
    border: "1px solid #bbf7d0",
    borderRadius: "10px",
    background: "#f0fdf4",
    color: "#166534",
    fontSize: "13px",
  },

  footer: {
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px",
    padding: "8px 2px 20px",
    color: "#94a3b8",
    fontSize: "11px",
  },

  footerIcon: {
    display: "flex",
    alignItems: "center",
    color: "#64748b",
  },

  footerRight: {
    display: "inline-flex",
    alignItems: "center",
    gap: "7px",
    marginLeft: "auto",
  },

  onlineDot: {
    width: "7px",
    height: "7px",
    borderRadius: "50%",
    background: "#94a3b8",
  },
};
