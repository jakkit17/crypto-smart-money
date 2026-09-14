# Manual: Add Another User for Test

## Purpose

ใช้คู่มือนี้สำหรับเพิ่ม User คนที่ 2 เพื่อทดสอบระบบ:

* User Profile
* ETH Tracking Config
* Smart Money Rule
* Telegram Notification
* User-specific Whale Alert
* Multi-user Telegram Digest

---

## 1. Start PostgreSQL

ตรวจสอบก่อนว่า Docker ทำงานอยู่:

```bash
docker compose ps
```

ควรเห็น PostgreSQL ทำงานอยู่ที่ port:

```text
5433
```

ถ้ายังไม่ทำงาน:

```bash
docker compose up -d
```

---

## 2. Start API

เปิด Terminal:

```bash
cd /Users/jakkit/Desktop/_jakkit/GitHub/crypto-smart-money
```

จากนั้น:

```bash
pnpm --filter api dev
```

API ควรทำงานที่:

```text
http://localhost:3000
```

ทดสอบ:

```bash
curl http://localhost:3000/health
```

ควรได้ response ประมาณ:

```json
{
  "status": "ok"
}
```

---

# 3. Create Another User

ใช้ `POST /users`

ตัวอย่าง User คนที่ 2:

```bash
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test-user-2@example.com",
    "name": "Test User 2",
    "timezone": "Asia/Bangkok"
  }'
```

Response จะมี `id` ของ User ใหม่ เช่น:

```json
{
  "id": "NEW_USER_UUID",
  "email": "test-user-2@example.com",
  "name": "Test User 2",
  "timezone": "Asia/Bangkok"
}
```

> **สำคัญ:** เก็บ `id` ที่ได้ไว้ เพราะต้องใช้ในขั้นตอนถัดไป

ตัวอย่าง:

```text
USER_2_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

# 4. Add ETH Tracking Config

กำหนดให้ User 2 แจ้งเตือนเมื่อมี ETH transaction ตั้งแต่ 20 ETH ขึ้นไป

```bash
curl -X PUT http://localhost:3000/users/USER_2_ID/tracking \
  -H "Content-Type: application/json" \
  -d '{
    "chain": "ethereum",
    "assetType": "native",
    "assetSymbol": "ETH",
    "threshold": "20",
    "enabled": true
  }'
```

ตรวจสอบ:

```bash
curl http://localhost:3000/users/USER_2_ID/settings
```

ควรเห็น Tracking Config ของ User 2

---

# 5. Add Smart Money Rule

ตัวอย่าง Rule สำหรับ User 2:

```bash
curl -X PUT http://localhost:3000/users/USER_2_ID/smart-money-rule \
  -H "Content-Type: application/json" \
  -d '{
    "netFlowWeight": 50,
    "largeTransactionsWeight": 25,
    "activityWeight": 15,
    "positiveFlowWeight": 10,
    "netFlowThresholdUsd": 10000,
    "largeTransactionCount": 2,
    "activityCount": 3,
    "positiveFlowThresholdUsd": 1000,
    "enabled": true
  }'
```

ตรวจสอบ:

```bash
curl http://localhost:3000/users/USER_2_ID/settings
```

---

# 6. Add Telegram Notification

ใช้ Telegram Chat ID ของ User 2

```bash
curl -X PUT http://localhost:3000/users/USER_2_ID/notification/telegram \
  -H "Content-Type: application/json" \
  -d '{
    "chatId": "USER_2_TELEGRAM_CHAT_ID",
    "enabled": true
  }'
```

> **ห้าม commit หรือส่ง Telegram Chat ID จริงเข้า Git**

ตรวจสอบ:

```bash
curl http://localhost:3000/users/USER_2_ID/settings
```

---

# 7. Verify User 2

เรียก:

```bash
curl http://localhost:3000/users/USER_2_ID/settings
```

ตรวจสอบว่ามี:

```text
User
├── Profile
├── Tracking Config
│   └── ETH ≥ 20
├── Smart Money Rule
└── Telegram Notification
    └── enabled = true
```

---

# 8. Verify Database

เข้า PostgreSQL:

```bash
docker exec -it crypto-smart-money-postgres-1 psql \
  -U postgres \
  -d crypto_smart_money
```

ถ้าชื่อ container ไม่ตรง ให้ตรวจด้วย:

```bash
docker ps
```

---

## Check Users

```sql
SELECT id, email, name, timezone
FROM users
ORDER BY created_at;
```

ควรเห็น User เดิมและ User 2

---

## Check Tracking

```sql
SELECT
  user_id,
  chain,
  asset_type,
  asset_symbol,
  threshold,
  enabled
FROM user_tracking_configs
ORDER BY created_at;
```

ควรเห็นประมาณ:

```text
User 1 | ethereum | native | ETH | 10 | true
User 2 | ethereum | native | ETH | 20 | true
```

---

## Check Smart Money Rules

```sql
SELECT
  user_id,
  net_flow_weight,
  large_transactions_weight,
  activity_weight,
  positive_flow_weight,
  enabled
FROM user_smart_money_rules;
```

---

## Check Telegram Config

```sql
SELECT
  user_id,
  channel,
  enabled
FROM notification_configs
WHERE channel = 'telegram';
```

> อย่า SELECT หรือ print `chat_id` ถ้าไม่จำเป็น

---

# 9. Test Multi-User Whale Detection

สมมติว่าเกิด transaction:

```text
25 ETH
```

User 1:

```text
Threshold = 10 ETH
```

User 2:

```text
Threshold = 20 ETH
```

ทั้งสองคนควร match:

```text
25 ETH
  │
  ├── User 1 ≥ 10 ETH ✅
  │
  └── User 2 ≥ 20 ETH ✅
```

ระบบควรสร้าง:

```text
whale_alerts
        │
        └── 1 transaction
              │
              ├── user_whale_alerts → User 1
              │
              └── user_whale_alerts → User 2
```

---

# 10. Test Different Thresholds

เพื่อทดสอบว่า User-specific threshold ทำงานจริง:

### User 1

```text
ETH ≥ 10
```

### User 2

```text
ETH ≥ 20
```

ถ้ามี:

```text
15 ETH
```

ผลที่ควรได้:

```text
User 1 → Alert ✅
User 2 → No Alert ❌
```

ถ้ามี:

```text
25 ETH
```

ผลที่ควรได้:

```text
User 1 → Alert ✅
User 2 → Alert ✅
```

นี่เป็น test สำคัญที่สุดสำหรับ Multi-User Tracking

---

# 11. Run Indexer

เมื่อ configuration พร้อมแล้ว:

```bash
pnpm --filter indexer live
```

Indexer จะตรวจ Ethereum transactions และหา User ที่ตรงกับ threshold

ตัวอย่าง log:

```text
🐋 WHALE DETECTED!

👤 Matching users: 2

👤 User 1: ≥ 10 ETH
👤 User 2: ≥ 20 ETH
```

---

# 12. Run Notifier

เปิดอีก Terminal:

```bash
cd /Users/jakkit/Desktop/_jakkit/GitHub/crypto-smart-money
```

จากนั้น:

```bash
pnpm --filter notifier dev
```

Notifier จะ process:

```text
user_whale_alerts
        ↓
group by Telegram chat
        ↓
send Telegram
        ↓
mark sent
```

---

# 13. Expected Architecture

หลังเพิ่ม User 2 ระบบควรเป็น:

```text
                    Ethereum
                       │
                       ↓
                    Indexer
                       │
              ┌────────┴────────┐
              ↓                 ↓
          User 1             User 2
        ETH ≥ 10            ETH ≥ 20
              │                 │
              └────────┬────────┘
                       ↓
                 whale_alerts
                       │
                       ↓
              user_whale_alerts
                 │           │
                 ↓           ↓
              User 1       User 2
                 │           │
                 ↓           ↓
            Telegram 1   Telegram 2
```

---

# 14. Cleanup Test User

ถ้าต้องการลบ User 2 หลังทดสอบ:

```sql
DELETE FROM users
WHERE email = 'test-user-2@example.com';
```

เนื่องจาก foreign keys ใช้:

```text
ON DELETE CASCADE
```

ข้อมูลที่เกี่ยวข้องของ User 2 เช่น:

```text
tracking config
smart money rule
notification config
user whale alerts
```

จะถูกลบตาม User

---

# 15. Test Checklist

ใช้ checklist นี้ก่อนถือว่า Multi-User ผ่าน:

* [ ] Create User 2
* [ ] User 2 มี UUID
* [ ] User 2 มี ETH tracking config
* [ ] User 2 มี threshold ของตัวเอง
* [ ] User 2 มี Smart Money Rule
* [ ] User 2 มี Telegram config
* [ ] User 1 และ User 2 มี threshold ต่างกัน
* [ ] Transaction ต่ำกว่า User 2 threshold → User 2 ไม่ได้รับ alert
* [ ] Transaction สูงกว่า User 2 threshold → User 2 ได้รับ alert
* [ ] `user_whale_alerts` แยกตาม user
* [ ] Telegram ของ User 1 และ User 2 แยกกัน
* [ ] `sent_at` ถูก update หลังส่งสำเร็จ

---

## Current MVP Limitation

ปัจจุบันระบบรองรับ:

```text
Ethereum
└── Native ETH
```

ERC-20 และ Bitcoin ยังไม่ควรนำมา test ใน flow นี้จนกว่า asset tracking/indexing จะถูกขยายให้สมบูรณ์

สำหรับการทดสอบ Multi-User ตอนนี้ **ใช้ ETH อย่างเดียวดีที่สุด**
