import { useState } from "react";

type Props = {
  onAccept: () => void;
  loading?: boolean;
};

export default function TermsAndConditions({
  onAccept,
  loading = false,
}: Props) {
  const [accepted, setAccepted] =
    useState(false);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f5f7fb",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 720,
          background: "#fff",
          borderRadius: 16,
          padding: 32,
          boxShadow:
            "0 10px 40px rgba(0,0,0,0.08)",
        }}
      >
        <h1 style={{ marginTop: 0 }}>
          Terms & Conditions
        </h1>

        <p style={{ color: "#666" }}>
          กรุณาอ่านและยอมรับข้อกำหนดก่อนเริ่มใช้งาน
          Crypto Smart Money
        </p>

        <div
          style={{
            maxHeight: 420,
            overflowY: "auto",
            border: "1px solid #e5e7eb",
            borderRadius: 12,
            padding: 20,
            lineHeight: 1.7,
          }}
        >
          <h3>1. การให้บริการ</h3>
          <p>
            Crypto Smart Money
            เป็นเครื่องมือสำหรับติดตามและวิเคราะห์ข้อมูล
            ธุรกรรมบน Blockchain
            เพื่อช่วยให้ผู้ใช้งานมองเห็นกิจกรรมของกระเป๋าเงิน
            และข้อมูลที่เกี่ยวข้อง
          </p>

          <h3>2. ไม่ใช่คำแนะนำด้านการลงทุน</h3>
          <p>
            ข้อมูล คะแนน Smart Money
            และการแจ้งเตือนต่าง ๆ
            ไม่ถือเป็นคำแนะนำทางการเงินหรือคำแนะนำให้ซื้อ
            ขาย หรือถือสินทรัพย์ดิจิทัล
          </p>

          <h3>3. ความเสี่ยง</h3>
          <p>
            สินทรัพย์ดิจิทัลมีความผันผวนและมีความเสี่ยงสูง
            ผู้ใช้งานต้องรับผิดชอบต่อการตัดสินใจของตนเอง
          </p>

          <h3>4. ข้อมูล Blockchain</h3>
          <p>
            ข้อมูลที่แสดงอาจมีความล่าช้า ไม่ครบถ้วน
            หรือมีความคลาดเคลื่อน
          </p>

          <h3>5. Telegram</h3>
          <p>
            หากเปิดใช้งาน Telegram
            ระบบจะส่งข้อมูลการแจ้งเตือนตามการตั้งค่าของผู้ใช้งาน
          </p>

          <h3>6. การยอมรับข้อกำหนด</h3>
          <p>
            การกดยอมรับถือว่าผู้ใช้งานได้อ่าน
            ทำความเข้าใจ และยอมรับข้อกำหนดเหล่านี้
          </p>

          <h3>7. การเปลี่ยนแปลงข้อกำหนด</h3>
          <p>
            เราอาจปรับปรุงข้อกำหนดในอนาคต
            และอาจขอให้ผู้ใช้งานยอมรับข้อกำหนดฉบับใหม่
          </p>
        </div>

        <label
          style={{
            display: "flex",
            gap: 10,
            alignItems: "flex-start",
            marginTop: 20,
            cursor: "pointer",
          }}
        >
          <input
            type="checkbox"
            checked={accepted}
            onChange={(event) =>
              setAccepted(event.target.checked)
            }
          />

          <span>
            ฉันได้อ่านและยอมรับ Terms & Conditions
          </span>
        </label>

        <button
          type="button"
          onClick={onAccept}
          disabled={!accepted || loading}
          style={{
            width: "100%",
            marginTop: 20,
            padding: "14px 20px",
            border: 0,
            borderRadius: 10,
            background: "#111827",
            color: "#fff",
            fontSize: 16,
            fontWeight: 600,
            cursor:
              !accepted || loading
                ? "not-allowed"
                : "pointer",
            opacity:
              !accepted || loading ? 0.5 : 1,
          }}
        >
          {loading
            ? "กำลังสร้าง Account..."
            : "Accept & Create Account"}
        </button>
      </div>
    </div>
  );
}