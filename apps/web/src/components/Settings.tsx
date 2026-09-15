import {
  useEffect,
  useState,
} from "react";

import {
  getMySettings,
  updateMyTracking,
  updateMySmartMoneyRule,
  updateMyTelegramNotification,
} from "../lib/api";

export default function Settings() {
  const [trackingThreshold, setTrackingThreshold] =
    useState("10");

  const [trackingEnabled, setTrackingEnabled] =
    useState(true);

    useEffect(() => {
        loadSettings();
    }, []);

    const [smartMoneyRule, setSmartMoneyRule] =
        useState({
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

    const [telegramChatId, setTelegramChatId] =
        useState("");

    const [telegramEnabled, setTelegramEnabled] =
        useState(false);

    const [showSmartMoneyGuide, setShowSmartMoneyGuide] =
        useState(false);
        
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
                    activityCount:
                    rule.activityCount,
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
        console.error(
            "Failed to load settings:",
            error,
        );
        }
    }

    async function saveTracking() {
        try {
        const result = await updateMyTracking({
            threshold: trackingThreshold,
            enabled: trackingEnabled,
        });

        console.log(
            "Tracking saved:",
            result,
        );

        await loadSettings();
        } catch (error) {
        console.error(
            "Failed to save tracking:",
            error,
        );
        }
    }

    async function saveSmartMoneyRule() {
        try {
            const result =
            await updateMySmartMoneyRule(
                smartMoneyRule,
            );

            console.log(
            "Smart Money Rule saved:",
            result,
            );

            await loadSettings();
        } catch (error) {
            console.error(
            "Failed to save Smart Money Rule:",
            error,
            );
    }
    }

    async function saveTelegramNotification() {
        try {
            const result =
            await updateMyTelegramNotification({
                chatId: telegramChatId,
                enabled: telegramEnabled,
            });

            console.log(
            "Telegram notification saved:",
            result,
            );

            await loadSettings();
        } catch (error) {
            console.error(
            "Failed to save Telegram notification:",
            error,
            );
        }
    }

    return (
        <section>
            <h1>Settings</h1>

            <div>
                <h2>Whale Tracking</h2>

                <label>
                Threshold (ETH)

                <input
                    type="number"
                    value={trackingThreshold}
                    onChange={(e) =>
                    setTrackingThreshold(
                        e.target.value,
                    )
                    }
                />
                </label>

                <label>
                <input
                    type="checkbox"
                    checked={trackingEnabled}
                    onChange={(e) =>
                    setTrackingEnabled(
                        e.target.checked,
                    )
                    }
                />

                Enabled
                </label>

                <button onClick={saveTracking}>
                Save Tracking
                </button>
            </div>

            <hr />
            <div>
                <div
                    style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    }}
                >
                    <div>
                    <h2>Smart Money Rule</h2>

                    <p>
                        กำหนดพฤติกรรมที่ระบบใช้ประเมิน
                        Smart Money
                    </p>
                    </div>

                    <button
                    type="button"
                    onClick={() =>
                        setShowSmartMoneyGuide(true)
                    }
                    >
                    📖 อ่านคู่มือ
                    </button>
                </div>


                <label>
                    Net Flow Weight
                    <input
                    type="number"
                    value={smartMoneyRule.netFlowWeight}
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        netFlowWeight: Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Large Transactions Weight
                    <input
                    type="number"
                    value={
                        smartMoneyRule.largeTransactionsWeight
                    }
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        largeTransactionsWeight:
                            Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Activity Weight
                    <input
                    type="number"
                    value={smartMoneyRule.activityWeight}
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        activityWeight: Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Positive Flow Weight
                    <input
                    type="number"
                    value={
                        smartMoneyRule.positiveFlowWeight
                    }
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        positiveFlowWeight:
                            Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Net Flow Threshold (USD)
                    <input
                    type="number"
                    value={
                        smartMoneyRule.netFlowThresholdUsd
                    }
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        netFlowThresholdUsd:
                            e.target.value,
                        })
                    }
                    />
                </label>

                <label>
                    Large Transaction Count
                    <input
                    type="number"
                    min="1"
                    value={
                        smartMoneyRule.largeTransactionCount
                    }
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        largeTransactionCount:
                            Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Activity Count
                    <input
                    type="number"
                    min="1"
                    value={smartMoneyRule.activityCount}
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        activityCount:
                            Number(e.target.value),
                        })
                    }
                    />
                </label>

                <label>
                    Positive Flow Threshold (USD)
                    <input
                    type="number"
                    value={
                        smartMoneyRule.positiveFlowThresholdUsd
                    }
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        positiveFlowThresholdUsd:
                            e.target.value,
                        })
                    }
                    />
                </label>

                <label>
                    <input
                    type="checkbox"
                    checked={smartMoneyRule.enabled}
                    onChange={(e) =>
                        setSmartMoneyRule({
                        ...smartMoneyRule,
                        enabled: e.target.checked,
                        })
                    }
                    />

                    Enabled
                </label>

                <button onClick={saveSmartMoneyRule}>
                    Save Smart Money Rule
                </button>
            </div>

            <hr />
            <div>
                <h2>Telegram Notification</h2>

                <label>
                    Telegram Chat ID

                    <input
                    type="text"
                    value={telegramChatId}
                    onChange={(e) =>
                        setTelegramChatId(e.target.value)
                    }
                    placeholder="Telegram Chat ID"
                    />
                </label>

                <label>
                    <input
                    type="checkbox"
                    checked={telegramEnabled}
                    onChange={(e) =>
                        setTelegramEnabled(e.target.checked)
                    }
                    />

                    Enabled
                </label>

                <button
                    onClick={saveTelegramNotification}
                >
                    Save Telegram Settings
                </button>
            </div>

            {showSmartMoneyGuide && (
                <div
                    style={{
                    position: "fixed",
                    inset: 0,
                    background: "rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "20px",
                    zIndex: 1000,
                    }}
                    onClick={() =>
                    setShowSmartMoneyGuide(false)
                    }
                >
                    <div
                    style={{
                        background: "#fff",
                        borderRadius: "16px",
                        width: "100%",
                        maxWidth: "680px",
                        maxHeight: "80vh",
                        overflowY: "auto",
                        padding: "28px",
                        position: "relative",
                    }}
                    onClick={(e) => e.stopPropagation()}
                    >
                    <button
                        type="button"
                        onClick={() =>
                        setShowSmartMoneyGuide(false)
                        }
                        style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        border: "none",
                        background: "transparent",
                        fontSize: "24px",
                        cursor: "pointer",
                        }}
                        aria-label="ปิดคู่มือ"
                    >
                        ×
                    </button>

                    <h2>📖 คู่มือ Smart Money</h2>

                    <p>
                        Smart Money Rule ใช้กำหนดว่า
                        Wallet แบบไหนควรถูกมองว่าเป็น
                        Smart Money
                    </p>

                    <h3>💰 เงินไหลเข้า/ออก</h3>

                    <p>
                        ดูว่า Wallet มีเงินไหลเข้าสุทธิหรือ
                        ออกสุทธิมากแค่ไหน
                    </p>

                    <h3>🐋 ธุรกรรมขนาดใหญ่</h3>

                    <p>
                        ดูจำนวนธุรกรรมที่มีมูลค่าสูง
                        ถ้ามีธุรกรรมขนาดใหญ่หลายครั้ง
                        คะแนนจะเพิ่มขึ้น
                    </p>

                    <h3>⚡ ความเคลื่อนไหว</h3>

                    <p>
                        ดูว่า Wallet มีการทำธุรกรรมบ่อยแค่ไหน
                    </p>

                    <h3>📈 เงินไหลเข้าสุทธิ</h3>

                    <p>
                        ถ้าเงินไหลเข้า Wallet มากกว่าเงินไหลออก
                        จะได้รับคะแนนเพิ่ม
                    </p>

                    <h3>🎯 Weight คืออะไร?</h3>

                    <p>
                        Weight คือความสำคัญของแต่ละปัจจัย
                        ยิ่ง Weight สูง ปัจจัยนั้นยิ่งมีผลต่อ
                        Smart Money Score มากขึ้น
                    </p>

                    <h3>⭐ คะแนนทำงานอย่างไร?</h3>

                    <p>
                        ระบบจะนำคะแนนจากแต่ละปัจจัยมารวมกัน
                        และได้คะแนนสูงสุด 100 คะแนน
                    </p>

                    <div
                        style={{
                        background: "#f5f5f5",
                        borderRadius: "12px",
                        padding: "16px",
                        marginTop: "20px",
                        }}
                    >
                        <strong>💡 คำแนะนำสำหรับผู้เริ่มต้น</strong>

                        <p>
                        หากยังไม่แน่ใจว่าจะตั้งค่าอย่างไร
                        แนะนำให้ใช้ค่าเริ่มต้นของระบบก่อน
                        แล้วดู Smart Money Score ที่เกิดขึ้นจริง
                        ก่อนค่อยปรับแต่ง
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                        setShowSmartMoneyGuide(false)
                        }
                        style={{
                        marginTop: "20px",
                        width: "100%",
                        }}
                    >
                        ปิดคู่มือ
                    </button>
                    </div>
                </div>
                )}
        </section>
        
    );
}