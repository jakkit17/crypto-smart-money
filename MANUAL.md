# Crypto Smart Money

คู่มือสำหรับติดตั้งและรัน Project `crypto-smart-money` บนเครื่องใหม่

---

## 1. Project Overview

Crypto Smart Money เป็นระบบติดตามธุรกรรมบน Blockchain เพื่อค้นหา Wallet / Smart Money / Whale Activity

### Architecture

```text
Ethereum Mainnet
       │
       │ RPC
       ▼
┌──────────────┐
│   Indexer    │
└──────┬───────┘
       │
       ▼
┌──────────────────┐
│   PostgreSQL     │
└────────┬─────────┘
         │
         ├──────────────► Node API
         │                    │
         │                    ▼
         │               React Web
         │
         └──────────────► Notifier
                              │
                              ▼
                           Telegram
```

### Current MVP

* Ethereum Mainnet
* PostgreSQL
* Drizzle ORM
* viem
* Node.js
* TypeScript
* React + Vite
* Telegram Notification
* Docker

---

# 2. Requirements

เครื่องใหม่ต้องมี:

* Node.js 20+
* pnpm 10+
* Docker
* Git

ตรวจสอบ:

```bash
node -v
pnpm -v
docker --version
git --version
```

ตัวอย่าง version ที่เคยใช้พัฒนา:

```text
Node.js 20.19.5
pnpm 10.15.0
TypeScript 7.0.2
```

ไม่จำเป็นต้องตรง version 100% แต่ควรใช้ Node.js 20 LTS

---

# 3. Clone Project

Clone repository:

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
```

เข้า project:

```bash
cd crypto-smart-money
```

ตรวจสอบ:

```bash
git status
```

---

# 4. Install Dependencies

ใช้ pnpm เท่านั้น

```bash
pnpm install
```

ห้ามใช้:

```bash
npm install
```

หรือ

```bash
yarn install
```

เพราะ project นี้ใช้ pnpm workspace

---

# 5. Project Structure

```text
crypto-smart-money/
│
├── apps/
│   ├── web/
│   ├── api/
│   ├── indexer/
│   └── notifier/
│
├── packages/
│   ├── db/
│   ├── shared/
│   └── config/
│
├── docker-compose.yml
├── package.json
├── pnpm-workspace.yaml
├── tsconfig.json
├── .gitignore
└── MANUAL.md
```

---

# 6. Environment Variables

ไฟล์ `.env` **ไม่ถูก commit เข้า Git**

ต้องสร้างใหม่บนเครื่องทุกเครื่อง

สร้าง:

```bash
touch .env
```

ตัวอย่าง:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/crypto_smart_money

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

เปลี่ยน:

```text
YOUR_API_KEY
```

เป็น API Key ใหม่ของ RPC Provider

> ห้าม commit API Key ลง GitHub

ตรวจสอบว่า `.env` ไม่ถูก track:

```bash
git status
```

และ:

```bash
git check-ignore .env
```

ควรแสดง:

```text
.env
```

---

# 7. PostgreSQL

Project ใช้ PostgreSQL ผ่าน Docker

Start database:

```bash
docker compose up -d
```

ตรวจสอบ:

```bash
docker ps
```

ควรเห็น container:

```text
crypto-smart-money-db
```

ตรวจสอบ database:

```bash
docker exec -it crypto-smart-money-db psql -U postgres -d crypto_smart_money
```

ออกจาก PostgreSQL:

```sql
\q
```

---

# 8. Database Port

PostgreSQL container ใช้:

```text
5432
```

แต่เครื่อง host ใช้:

```text
5433
```

ดังนั้น connection string คือ:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/crypto_smart_money
```

ถ้า port `5433` ถูกใช้โดยโปรแกรมอื่น ให้แก้ที่:

```text
docker-compose.yml
```

เช่น:

```yaml
ports:
  - "5434:5432"
```

แล้วแก้ `.env`:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5434/crypto_smart_money
```

---

# 9. Database Migration

หลังจาก clone project ลงเครื่องใหม่

ตรวจสอบ schema:

```bash
pnpm --filter db exec drizzle-kit check
```

ถ้าต้องการ apply migration:

```bash
pnpm --filter db exec drizzle-kit migrate
```

หรือใช้คำสั่งที่กำหนดไว้ใน `packages/db/package.json` หากมี script สำหรับ migration

---

# 10. Database Package

Database code อยู่ที่:

```text
packages/db/
```

โครงสร้างหลัก:

```text
packages/db/
├── src/
│   ├── client.ts
│   ├── index.ts
│   ├── schema/
│   │   ├── wallets.ts
│   │   ├── transactions.ts
│   │   └── token-transfers.ts
│   └── ...
├── drizzle/
├── drizzle.config.ts
└── package.json
```

Database package ใช้:

* Drizzle ORM
* postgres.js
* PostgreSQL

---

# 11. Current Database Tables

## wallets

ใช้เก็บ Wallet

Fields:

```text
id
address
chain
label
created_at
```

มี unique constraint:

```text
address + chain
```

---

## transactions

ใช้เก็บ Blockchain Transactions

Fields หลัก:

```text
id
chain
hash
block_number
block_hash
from_address
to_address
value_wei
gas
gas_price_wei
transaction_index
timestamp
created_at
```

Transaction hash ต้อง unique

---

## token_transfers

ใช้เก็บ ERC-20 Transfer Events

Fields หลัก:

```text
id
chain
transaction_hash
log_index
block_number
token_address
from_address
to_address
amount_raw
timestamp
created_at
```

มี unique constraint:

```text
transaction_hash + log_index
```

---

# 12. Generate Migration

เมื่อแก้ schema:

```bash
pnpm --filter db exec drizzle-kit generate
```

จากนั้นตรวจสอบไฟล์ migration ที่เกิดขึ้นใน:

```text
packages/db/drizzle/
```

แล้ว apply:

```bash
pnpm --filter db exec drizzle-kit migrate
```

Migration ต้อง commit เข้า Git

---

# 13. Indexer

Indexer อยู่ที่:

```text
apps/indexer/
```

หน้าที่:

1. Connect Ethereum RPC
2. อ่าน Latest Block
3. อ่าน Transactions
4. บันทึก Transactions ลง PostgreSQL
5. อ่าน Transaction Receipt
6. Decode ERC-20 Transfer Events
7. บันทึก Token Transfers

Flow:

```text
Ethereum RPC
     ↓
Latest Block
     ↓
Transactions
     ↓
PostgreSQL
     ↓
Transaction Receipt
     ↓
ERC-20 Transfer Logs
     ↓
token_transfers
```

---

# 14. Run Indexer

จาก root project:

```bash
pnpm --filter indexer exec tsx src/index.ts
```

ถ้าทำงานถูกต้อง จะเห็นประมาณ:

```text
🚀 Ethereum indexer started

📦 Latest block: XXXXXXXX

🧱 Block hash: ...
⏱️ Timestamp: ...
⛽ Gas limit: ...
🔢 Transactions: ...

📋 Saving first 5 transactions...
```

ถ้ามี ERC-20 transfer:

```text
🪙 Token transfer saved:
   Token: ...
   From: ...
   To: ...
   Amount: ...
```

หยุดด้วย:

```text
Ctrl + C
```

---

# 15. Verify Database

ตรวจสอบ Transactions:

```bash
pnpm --filter db exec tsx src/test-transactions.ts
```

ตรวจสอบ Token Transfers:

```bash
pnpm --filter db exec tsx src/test-token-transfers.ts
```

ถ้าเห็นข้อมูล transaction และ token transfer แสดงว่า:

```text
Ethereum
   ↓
RPC
   ↓
Indexer
   ↓
PostgreSQL
```

ทำงานครบแล้ว

---

# 16. Important: RPC API Key

ห้ามใส่ API Key ลงใน source code

ผิด:

```ts
const rpcUrl =
  "https://eth-mainnet.g.alchemy.com/v2/SECRET_API_KEY";
```

ถูก:

```ts
const rpcUrl = process.env.ETHEREUM_RPC_URL;
```

และเก็บค่าใน:

```text
.env
```

`.env` ต้องอยู่ใน `.gitignore`

---

# 17. Git

ตรวจสอบสถานะ:

```bash
git status
```

ตรวจสอบ tracked files:

```bash
git ls-files
```

ไม่ควรมี:

```text
node_modules/
.env
```

---

# 18. .gitignore

ควรมีอย่างน้อย:

```gitignore
# Dependencies
node_modules/

# Environment
.env
.env.*
!.env.example

# Build output
dist/
build/
.vite/

# Logs
*.log

# OS
.DS_Store

# IDE
.vscode/
.idea/
```

ไม่จำเป็นต้องเขียน:

```gitignore
apps/api/node_modules/
apps/web/node_modules/
apps/indexer/node_modules/
packages/db/node_modules/
```

เพราะ:

```gitignore
node_modules/
```

ครอบคลุมทุก folder อยู่แล้ว

---

# 19. Workspace Commands

ดู workspace:

```bash
pnpm list --depth -1
```

Install dependencies ทั้ง project:

```bash
pnpm install
```

Run command เฉพาะ package:

```bash
pnpm --filter indexer <command>
```

ตัวอย่าง:

```bash
pnpm --filter indexer typecheck
```

หรือ:

```bash
pnpm --filter indexer exec tsx src/index.ts
```

Database:

```bash
pnpm --filter db <command>
```

Web:

```bash
pnpm --filter web <command>
```

API:

```bash
pnpm --filter api <command>
```

Notifier:

```bash
pnpm --filter notifier <command>
```

---

# 20. Development Startup

เมื่อเปิดเครื่องใหม่และต้องการเริ่ม Project:

### Step 1

เข้า project:

```bash
cd crypto-smart-money
```

### Step 2

Install:

```bash
pnpm install
```

### Step 3

สร้าง `.env`

```bash
touch .env
```

ใส่:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/crypto_smart_money
ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

### Step 4

Start PostgreSQL:

```bash
docker compose up -d
```

### Step 5

Apply migration:

```bash
pnpm --filter db exec drizzle-kit migrate
```

### Step 6

Run Indexer:

```bash
pnpm --filter indexer exec tsx src/index.ts
```

---

# 21. Troubleshooting

## DATABASE_URL is not set

Error:

```text
DATABASE_URL is not set
```

ตรวจสอบ:

```bash
cat .env
```

หรือ:

```bash
grep -E '^(DATABASE_URL|ETHEREUM_RPC_URL)=' .env | sed 's/=.*/=<set>/'
```

ควรได้:

```text
DATABASE_URL=<set>
ETHEREUM_RPC_URL=<set>
```

---

## ETHEREUM_RPC_URL is not set

ตรวจสอบ:

```bash
grep ETHEREUM_RPC_URL .env
```

ต้องมี:

```env
ETHEREUM_RPC_URL=...
```

---

## PostgreSQL connection failed

ตรวจสอบ Docker:

```bash
docker ps
```

ถ้า container ไม่ทำงาน:

```bash
docker compose up -d
```

ดู log:

```bash
docker logs crypto-smart-money-db
```

---

## Port 5433 already in use

ตรวจสอบ:

```bash
lsof -i :5433
```

หรือเปลี่ยน host port ใน:

```text
docker-compose.yml
```

---

## node_modules โผล่ใน git status

ตรวจสอบ:

```bash
git status
```

ถ้า `node_modules` ถูก track อยู่แล้ว:

```bash
git rm -r --cached --ignore-unmatch node_modules apps/*/node_modules packages/*/node_modules
```

จากนั้น:

```bash
git status
```

---

## .env โผล่ใน git status

ถ้า `.env` ไม่ควรถูก track:

```bash
git rm --cached .env
```

จากนั้นตรวจสอบ:

```bash
git status
```

> ถ้า API Key เคยถูก commit หรือ push ขึ้น GitHub แล้ว ต้องถือว่า key นั้น compromised และควร revoke / rotate ทันที

---

# 22. Important Development Rules

## ใช้ pnpm

```text
pnpm
```

เป็น package manager หลัก

ไม่ควรสลับไปใช้ npm/yarn

---

## ห้าม Commit Secret

ห้าม commit:

```text
.env
API Keys
Private Keys
RPC Secrets
Telegram Bot Token
Database Password สำหรับ Production
AWS Credentials
```

---

## Migration ต้อง Commit

ไฟล์ใน:

```text
packages/db/drizzle/
```

ต้อง commit เข้า Git

เพราะเครื่องใหม่ต้องใช้ migration เหล่านี้เพื่อสร้าง database schema

---

# 23. Git Workflow

ก่อนเริ่มงาน:

```bash
git pull
pnpm install
```

หลังแก้ code:

```bash
git status
```

ตรวจสอบ type:

```bash
pnpm --filter indexer typecheck
```

แล้ว commit:

```bash
git add .
git commit -m "your commit message"
```

push:

```bash
git push
```

---

# 24. Current Development Checkpoint

สถานะปัจจุบันของ Project:

```text
[✓] Monorepo
[✓] pnpm workspace
[✓] React Web app
[✓] Node API app
[✓] Indexer app
[✓] Notifier app
[✓] PostgreSQL
[✓] Docker PostgreSQL
[✓] Drizzle ORM
[✓] Wallet schema
[✓] Transaction schema
[✓] Token Transfer schema
[✓] Ethereum RPC
[✓] Ethereum block reading
[✓] Transaction persistence
[✓] ERC-20 Transfer decoding
[✓] ERC-20 Transfer persistence

[ ] Token Metadata
[ ] Token Decimals
[ ] Human-readable Token Amount
[ ] Token Price / USD Value
[ ] Whale Detection
[ ] Smart Money Detection
[ ] Telegram Notification
[ ] Node API
[ ] React Dashboard
[ ] Production Deployment
```

---

# 25. Next Development Step

หลังจาก Token Transfer สามารถบันทึกลง Database ได้แล้ว

ขั้นต่อไปคือ:

```text
Raw Token Transfer
        ↓
Token Metadata
        ↓
Name
Symbol
Decimals
        ↓
Human-readable Amount
        ↓
USD Value
        ↓
Whale Detection
```

เป้าหมายคือเปลี่ยนข้อมูลแบบ:

```text
amountRaw:
103670
```

ให้ระบบเข้าใจว่า:

```text
103.67 USDC
```

และสุดท้ายสามารถประเมินได้ว่า:

```text
$103.67
```

เพื่อเตรียมเข้าสู่ Whale Detection

---

# 26. Definition of Done

ระบบ MVP ระยะแรกถือว่า infrastructure พร้อมเมื่อสามารถทำได้:

```text
Ethereum
   ↓
RPC
   ↓
Indexer
   ↓
Read Block
   ↓
Read Transaction
   ↓
Read Logs
   ↓
Decode ERC-20 Transfer
   ↓
PostgreSQL
```

และสามารถตรวจสอบข้อมูลจาก Database ได้โดยตรง

---

# 27. Quick Start

สำหรับคนที่เคย setup project แล้ว และต้องการเริ่มงานเร็ว:

```bash
cd crypto-smart-money

pnpm install

docker compose up -d

pnpm --filter db exec drizzle-kit migrate

pnpm --filter indexer typecheck

pnpm --filter indexer exec tsx src/index.ts
```

ถ้า Indexer ทำงานและมีข้อมูลถูกบันทึกลง PostgreSQL:

```text
PROJECT READY
```

---

# 28. Notes

Project นี้เน้น:

* Product-first development
* Data correctness
* Blockchain indexing
* Observable whale activity
* ต่อขยายหลาย chain ในอนาคต
* API-first architecture
* Production deployment ด้วย Docker

อย่ารีบเพิ่ม feature จำนวนมาก

ลำดับความสำคัญ:

```text
Data
 ↓
Detection
 ↓
Notification
 ↓
API
 ↓
UI
 ↓
Product
```

---

# 29. Last Updated

Update this section ทุกครั้งที่ architecture หรือ setup สำคัญเปลี่ยน

```text
Last Updated:
2026-09-09

Current Phase:
ERC-20 Transfer Indexing

Next Phase:
Token Metadata + Decimal Normalization
```
