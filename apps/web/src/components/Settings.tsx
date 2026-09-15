
import { useEffect, useState } from "react";

import {
  getMySettings,
  updateMyTracking,
  updateMySmartMoneyRule,
  updateMyTelegramNotification,
} from "../lib/api";

const styles = {
  page: {
    minHeight: "100vh",
    background:
      "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #f8fafc 100%)",
    padding: "40px 24px 80px",
    color: "#0f172a",
    boxSizing: "border-box",
  },

  container: {
    maxWidth: "1050px",
    margin: "0 auto",
  },

  header: {
    marginBottom: "28px",
  },

  eyebrow: {
    color: "#6366f1",
    fontSize: "13px",
    fontWeight: 700,
    textTransform: "uppercase",
    letterSpacing: "0.12em",
    marginBottom: "8px",
  },

  title: {
    fontSize: "34px",
    lineHeight: 1.15,
    fontWeight: 800,
    margin: 0,
    letterSpacing: "-0.03em",
  },

  subtitle: {
    color: "#64748b",
    marginTop: "10px",
    fontSize: "15px",
  },

  card: {
    background: "rgba(255,255,255,0.92)",
    border: "1px solid rgba(226,232,240,0.9)",
    borderRadius: "20px",
    padding: "26px",
    marginBottom: "20px",
    boxShadow: "0 10px 35px rgba(15,23,42,0.06)",
    backdropFilter: "blur(12px)",
  },

  cardHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: "16px",
    marginBottom: "24px",
  },

  icon: {
    width: "46px",
    height: "46px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "22px",
    background: "#eef2ff",
    flexShrink: 0,
  },

  cardTitle: {
    margin: 0,
    fontSize: "19px",
    fontWeight: 750,
  },

  cardDescription: {
    margin: "6px 0 0",
    color: "#64748b",
    fontSize: "14px",
    lineHeight: 1.6,
  },

  formGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
    gap: "18px",
  },

  field: {
    display: "flex",
    flexDirection: "column",
    gap: "7px",
  },

  label: {
    fontSize: "13px",
    fontWeight: 650,
    color: "#334155",
  },

  input: {
    width: "100%",
    boxSizing: "border-box",
    height: "44px",
    border: "1px solid #dbe2ea",
    borderRadius: "11px",
    padding: "0 13px",
    fontSize: "14px",
    color: "#0f172a",
    background: "#fff",
    outline: "none",
  },

  fullWidth: {
    gridColumn: "1 / -1",
  },

  actionRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "12px",
    marginTop: "24px",
    paddingTop: "20px",
    borderTop: "1px solid #eef2f7",
  },

  button: {
    border: "none",
    borderRadius: "11px",
    padding: "11px 18px",
    fontSize: "14px",
    fontWeight: 700,
    cursor: "pointer",
    background: "#4f46e5",
    color: "#fff",
    boxShadow: "0 6px 16px rgba(79,70,229,0.22)",
  },

  secondaryButton: {
    border: "1px solid #e2e8f0",
    borderRadius: "10px",
    padding: "9px 13px",
    fontSize: "13px",
    fontWeight: 650,
    cursor: "pointer",
    background: "#fff",
    color: "#475569",
  },

  toggleRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "20px",
    padding: "16px",
    marginTop: "18px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #eef2f7",
  },

  toggleInfo: {
    display: "flex",
    flexDirection: "column",
    gap: "4px",
  },

  toggleTitle: {
    fontSize: "14px",
    fontWeight: 700,
  },

  toggleDescription: {
    color: "#64748b",
    fontSize: "12px",
  },

  toggle: {
    position: "relative",
    width: "48px",
    height: "27px",
    flexShrink: 0,
  },

  modalOverlay: {
    position: "fixed",
    inset: 0,
    background: "rgba(15,23,42,0.62)",
    backdropFilter: "blur(5px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
    zIndex: 1000,
  },

  modal: {
    width: "100%",
    maxWidth: "720px",
    maxHeight: "82vh",
    overflowY: "auto",
    background: "#fff",
    borderRadius: "22px",
    boxShadow: "0 30px 80px rgba(0,0,0,0.25)",
    padding: "30px",
    boxSizing: "border-box",
  },

  guideItem: {
    padding: "16px 18px",
    borderRadius: "14px",
    background: "#f8fafc",
    border: "1px solid #eef2f7",
    marginBottom: "12px",
  },
};

function Toggle({ checked, onChange }) {
  return (
    <label style={styles.toggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        style={{
          opacity: 0,
          width: 0,
          height: 0,
        }}
      />

      <span
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "999px",
          cursor: "pointer",
          background: checked ? "#4f46e5" : "#cbd5e1",
          transition: "0.2s",
        }}
      />

      <span
        style={{
          position: "absolute",
          width: "21px",
          height: "21px",
          top: "3px",
          left: checked ? "24px" : "3px",
          borderRadius: "50%",
          background: "#fff",
          transition: "0.2s",
          boxShadow: "0 2px 5px rgba(0,0,0,0.18)",
        }}
      />
    </label>
  );
}

function Field({ label, children, fullWidth = false }) {
  return (
    <label
      style={{
        ...styles.field,
        ...(fullWidth ? styles.fullWidth : {}),
      }}
    >
      <span style={styles.label}>{label}</span>
      {children}
    </label>
  );
}

export default function Settings() {
  const [trackingThreshold, setTrackingThreshold] = useState("10");
  const [trackingEnabled, setTrackingEnabled] = useState(true);

  const [smartMoneyRule, setSmartMoneyRule] = useState({
    netFlowWeight: 50,
    largeTransactionsWeight: 25,
    activityWeight: 15,
    positiveFlowWeight: 10,
    netFlowThresholdUsd: "10000",
    largeTransactionCount: 2,
    activityCount: 3,
    positiveFlowThresholdUsd: "1000",
    enabled: true,
  });

  const [telegramChatId, setTelegramChatId] = useState("");
  const [telegramEnabled, setTelegramEnabled] = useState(false);
  const [showSmartMoneyGuide, setShowSmartMoneyGuide] =
    useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const result = await getMySettings();

      const tracking = result.settings.tracking;
      const rule = result.settings.smartMoneyRule;
      const telegram = result.settings.notification;

      if (telegram) {
        setTelegramChatId(telegram.chatId);
        setTelegramEnabled(telegram.enabled);
      }

      if (rule) {
        setSmartMoneyRule({
          netFlowWeight: rule.netFlowWeight,
          largeTransactionsWeight:
            rule.largeTransactionsWeight,
          activityWeight: rule.activityWeight,
          positiveFlowWeight:
            rule.positiveFlowWeight,
          netFlowThresholdUsd:
            rule.netFlowThresholdUsd,
          largeTransactionCount:
            rule.largeTransactionCount,
          activityCount: rule.activityCount,
          positiveFlowThresholdUsd:
            rule.positiveFlowThresholdUsd,
          enabled: rule.enabled,
        });
      }

      if (tracking) {
        setTrackingThreshold(tracking.threshold);
        setTrackingEnabled(tracking.enabled);
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }

  async function saveTracking() {
    try {
      await updateMyTracking({
        threshold: trackingThreshold,
        enabled: trackingEnabled,
      });

      await loadSettings();
    } catch (error) {
      console.error("Failed to save tracking:", error);
    }
  }

  async function saveSmartMoneyRule() {
    try {
      await updateMySmartMoneyRule(smartMoneyRule);
      await loadSettings();
    } catch (error) {
      console.error(
        "Failed to save Smart Money Rule:",
        error
      );
    }
  }

  async function saveTelegramNotification() {
    try {
      await updateMyTelegramNotification({
        chatId: telegramChatId,
        enabled: telegramEnabled,
      });

      await loadSettings();
    } catch (error) {
      console.error(
        "Failed to save Telegram notification:",
        error
      );
    }
  }

  function updateRule(key, value) {
    setSmartMoneyRule((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  return (
    <section style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div style={styles.eyebrow}>Control Center</div>

          <h1 style={styles.title}>Settings</h1>

          <p style={styles.subtitle}>
            จัดการการติดตาม Whale, Smart Money และการแจ้งเตือน
            Telegram ของคุณ
          </p>
        </header>

        {/* Whale Tracking */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", gap: "14px" }}>
              <div style={styles.icon}>🐋</div>

              <div>
                <h2 style={styles.cardTitle}>
                  Whale Tracking
                </h2>

                <p style={styles.cardDescription}>
                  กำหนดมูลค่าขั้นต่ำของธุรกรรมที่ระบบจะใช้
                  ตรวจจับ Whale
                </p>
              </div>
            </div>
          </div>

          <div style={styles.formGrid}>
            <Field label="Threshold (ETH)">
              <input
                style={styles.input}
                type="number"
                value={trackingThreshold}
                onChange={(e) =>
                  setTrackingThreshold(e.target.value)
                }
              />
            </Field>
          </div>

          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleTitle}>
                Enable Whale Tracking
              </span>

              <span style={styles.toggleDescription}>
                เปิดใช้งานการติดตาม Whale แบบอัตโนมัติ
              </span>
            </div>

            <Toggle
              checked={trackingEnabled}
              onChange={(e) =>
                setTrackingEnabled(e.target.checked)
              }
            />
          </div>

          <div style={styles.actionRow}>
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              ระบบจะใช้ค่าที่บันทึกไว้ในการวิเคราะห์
            </span>

            <button
              style={styles.button}
              onClick={saveTracking}
            >
              Save Tracking
            </button>
          </div>
        </div>

        {/* Smart Money */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", gap: "14px" }}>
              <div
                style={{
                  ...styles.icon,
                  background: "#ecfdf5",
                }}
              >
                🧠
              </div>

              <div>
                <h2 style={styles.cardTitle}>
                  Smart Money Rule
                </h2>

                <p style={styles.cardDescription}>
                  กำหนดน้ำหนักและเงื่อนไขที่ใช้ประเมิน
                  Smart Money Score
                </p>
              </div>
            </div>

            <button
              type="button"
              style={styles.secondaryButton}
              onClick={() =>
                setShowSmartMoneyGuide(true)
              }
            >
              📖 คู่มือ
            </button>
          </div>

          <div style={styles.formGrid}>
            <Field label="Net Flow Weight">
              <input
                style={styles.input}
                type="number"
                value={smartMoneyRule.netFlowWeight}
                onChange={(e) =>
                  updateRule(
                    "netFlowWeight",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Large Transactions Weight">
              <input
                style={styles.input}
                type="number"
                value={
                  smartMoneyRule.largeTransactionsWeight
                }
                onChange={(e) =>
                  updateRule(
                    "largeTransactionsWeight",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Activity Weight">
              <input
                style={styles.input}
                type="number"
                value={smartMoneyRule.activityWeight}
                onChange={(e) =>
                  updateRule(
                    "activityWeight",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Positive Flow Weight">
              <input
                style={styles.input}
                type="number"
                value={
                  smartMoneyRule.positiveFlowWeight
                }
                onChange={(e) =>
                  updateRule(
                    "positiveFlowWeight",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Net Flow Threshold (USD)">
              <input
                style={styles.input}
                type="number"
                value={
                  smartMoneyRule.netFlowThresholdUsd
                }
                onChange={(e) =>
                  updateRule(
                    "netFlowThresholdUsd",
                    e.target.value
                  )
                }
              />
            </Field>

            <Field label="Large Transaction Count">
              <input
                style={styles.input}
                type="number"
                min="1"
                value={
                  smartMoneyRule.largeTransactionCount
                }
                onChange={(e) =>
                  updateRule(
                    "largeTransactionCount",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Activity Count">
              <input
                style={styles.input}
                type="number"
                min="1"
                value={smartMoneyRule.activityCount}
                onChange={(e) =>
                  updateRule(
                    "activityCount",
                    Number(e.target.value)
                  )
                }
              />
            </Field>

            <Field label="Positive Flow Threshold (USD)">
              <input
                style={styles.input}
                type="number"
                value={
                  smartMoneyRule.positiveFlowThresholdUsd
                }
                onChange={(e) =>
                  updateRule(
                    "positiveFlowThresholdUsd",
                    e.target.value
                  )
                }
              />
            </Field>
          </div>

          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleTitle}>
                Enable Smart Money Detection
              </span>

              <span style={styles.toggleDescription}>
                ให้ระบบคำนวณ Smart Money Score
                จากเงื่อนไขด้านบน
              </span>
            </div>

            <Toggle
              checked={smartMoneyRule.enabled}
              onChange={(e) =>
                updateRule(
                  "enabled",
                  e.target.checked
                )
              }
            />
          </div>

          <div style={styles.actionRow}>
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              Weight รวมควรเท่ากับ 100%
            </span>

            <button
              style={styles.button}
              onClick={saveSmartMoneyRule}
            >
              Save Smart Money Rule
            </button>
          </div>
        </div>

        {/* Telegram */}
        <div style={styles.card}>
          <div style={styles.cardHeader}>
            <div style={{ display: "flex", gap: "14px" }}>
              <div
                style={{
                  ...styles.icon,
                  background: "#eff6ff",
                }}
              >
                ✈️
              </div>

              <div>
                <h2 style={styles.cardTitle}>
                  Telegram Notification
                </h2>

                <p style={styles.cardDescription}>
                  รับการแจ้งเตือน Whale และ Smart Money
                  ผ่าน Telegram
                </p>
              </div>
            </div>
          </div>

          <Field label="Telegram Chat ID">
            <input
              style={styles.input}
              type="text"
              value={telegramChatId}
              onChange={(e) =>
                setTelegramChatId(e.target.value)
              }
              placeholder="เช่น 123456789"
            />
          </Field>

          <div style={styles.toggleRow}>
            <div style={styles.toggleInfo}>
              <span style={styles.toggleTitle}>
                Enable Telegram Notifications
              </span>

              <span style={styles.toggleDescription}>
                ส่งการแจ้งเตือนเข้าสู่ Telegram
              </span>
            </div>

            <Toggle
              checked={telegramEnabled}
              onChange={(e) =>
                setTelegramEnabled(e.target.checked)
              }
            />
          </div>

          <div style={styles.actionRow}>
            <span
              style={{
                fontSize: "12px",
                color: "#94a3b8",
              }}
            >
              ตรวจสอบ Chat ID ก่อนเปิดใช้งาน
            </span>

            <button
              style={styles.button}
              onClick={saveTelegramNotification}
            >
              Save Telegram
            </button>
          </div>
        </div>
      </div>

      {/* Smart Money Guide Modal */}
      {showSmartMoneyGuide && (
        <div
          style={styles.modalOverlay}
          onClick={() =>
            setShowSmartMoneyGuide(false)
          }
        >
          <div
            style={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "20px",
                marginBottom: "24px",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#6366f1",
                    marginBottom: "6px",
                  }}
                >
                  SMART MONEY GUIDE
                </div>

                <h2
                  style={{
                    margin: 0,
                    fontSize: "25px",
                  }}
                >
                  🧠 คู่มือ Smart Money
                </h2>

                <p
                  style={{
                    color: "#64748b",
                    lineHeight: 1.6,
                    marginBottom: 0,
                  }}
                >
                  เรียนรู้ว่าแต่ละค่ามีผลต่อ
                  Smart Money Score อย่างไร
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  setShowSmartMoneyGuide(false)
                }
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  background: "#fff",
                  fontSize: "20px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <div style={styles.guideItem}>
              <strong>💰 Net Flow</strong>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                ดูว่า Wallet มีเงินไหลเข้าสุทธิหรือ
                ไหลออกสุทธิมากแค่ไหน
              </p>
            </div>

            <div style={styles.guideItem}>
              <strong>🐋 Large Transactions</strong>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                จำนวนธุรกรรมขนาดใหญ่ที่ Wallet
                ทำ ยิ่งมีหลายรายการ คะแนนยิ่งเพิ่ม
              </p>
            </div>

            <div style={styles.guideItem}>
              <strong>⚡ Activity</strong>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                วัดความถี่ในการทำธุรกรรมของ Wallet
              </p>
            </div>

            <div style={styles.guideItem}>
              <strong>📈 Positive Flow</strong>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                หากเงินไหลเข้า Wallet มากกว่าเงินไหลออก
                จะได้รับคะแนนเพิ่ม
              </p>
            </div>

            <div style={styles.guideItem}>
              <strong>🎯 Weight</strong>
              <p
                style={{
                  color: "#64748b",
                  lineHeight: 1.6,
                  marginBottom: 0,
                }}
              >
                Weight คือความสำคัญของแต่ละปัจจัย
                ค่ายิ่งสูง ปัจจัยนั้นยิ่งมีผลต่อ Score
              </p>
            </div>

            <div
              style={{
                background:
                  "linear-gradient(135deg, #eef2ff, #f5f3ff)",
                borderRadius: "14px",
                padding: "18px",
                marginTop: "18px",
              }}
            >
              <strong>💡 สำหรับผู้เริ่มต้น</strong>

              <p
                style={{
                  marginBottom: 0,
                  color: "#475569",
                  lineHeight: 1.7,
                }}
              >
                แนะนำให้เริ่มจากค่า Default
                ก่อน แล้วดู Smart Money Score
                ที่เกิดขึ้นจริง จากนั้นค่อยปรับ Weight
                และ Threshold ให้เหมาะกับกลยุทธ์ของคุณ
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                setShowSmartMoneyGuide(false)
              }
              style={{
                ...styles.button,
                width: "100%",
                marginTop: "22px",
              }}
            >
              เข้าใจแล้ว
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
