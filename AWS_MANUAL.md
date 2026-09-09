# AWS_MANUAL.md

คู่มือสำหรับ Deploy และดูแล `crypto-smart-money` บน AWS

---

# 1. Production Architecture

Production MVP ใช้:

```text
                    Internet
                       │
                       ▼
                ┌──────────────┐
                │    EC2       │
                │   Docker     │
                │              │
                │ ┌──────────┐ │
                │ │ Web      │ │
                │ │ API      │ │
                │ │ Indexer  │ │
                │ │ Notifier │ │
                │ └────┬─────┘ │
                └──────┼───────┘
                       │
                       │ Private Network
                       ▼
                ┌──────────────┐
                │ RDS          │
                │ PostgreSQL   │
                └──────────────┘

                       ▲
                       │
                       │ RPC
                       │
                Ethereum Mainnet
```

---

# 2. AWS Components

ระบบ MVP ใช้ AWS หลัก ๆ:

```text
EC2
RDS PostgreSQL
VPC
Security Groups
CloudWatch
```

และ external service:

```text
Ethereum RPC Provider
Telegram Bot
GitHub
```

---

# 3. Recommended AWS Setup

สำหรับ MVP:

## EC2

แนะนำเริ่มจาก:

```text
Instance:
t3.small
```

หรือ instance ที่เหมาะสมตาม workload ปัจจุบัน

OS:

```text
Ubuntu 24.04 LTS
```

Disk:

```text
EBS gp3
```

เริ่มต้นประมาณ:

```text
20–30 GB
```

แล้ว monitor usage

---

## RDS

PostgreSQL:

```text
PostgreSQL
```

เริ่มจาก instance ขนาดเล็กสำหรับ MVP

Storage:

```text
gp3
```

เปิด:

```text
Automatic backups
```

และกำหนด retention ตามความเหมาะสม

---

# 4. AWS Region

เลือก Region เดียวกันสำหรับ EC2 และ RDS

ตัวอย่าง:

```text
ap-southeast-1
```

หรือ Region ที่เหมาะกับผู้ใช้และต้นทุน

สำคัญ:

```text
EC2
  ↓
RDS
```

ควรอยู่ใน VPC เดียวกันเพื่อให้ database ไม่ต้องเปิดออก Internet

---

# 5. Security Group

## EC2 Security Group

เปิดเฉพาะ port ที่จำเป็น

ตัวอย่าง:

```text
22    SSH
80    HTTP
443   HTTPS
```

SSH ควรจำกัด Source เป็น:

```text
Your IP
```

ไม่ควรเปิด:

```text
0.0.0.0/0
```

สำหรับ SSH ถ้าไม่จำเป็น

---

## RDS Security Group

ไม่ควรเปิด PostgreSQL ให้ Internet

Port:

```text
5432
```

Source:

```text
EC2 Security Group
```

เท่านั้น

Architecture:

```text
Internet
   X
   │
   └──> RDS

EC2
 │
 └────> RDS:5432
```

---

# 6. Create RDS Database

สร้าง PostgreSQL RDS

Database:

```text
crypto_smart_money
```

ตัวอย่าง:

```text
DB Name:
crypto_smart_money

Username:
crypto_app

Password:
<STRONG_PASSWORD>
```

ห้ามใช้:

```text
postgres
postgres
```

แบบ local development ใน Production

---

# 7. RDS Endpoint

หลังสร้าง RDS จะได้ endpoint เช่น:

```text
crypto-smart-money.xxxxxxxxx.ap-southeast-1.rds.amazonaws.com
```

Production `.env` จะใช้:

```env
DATABASE_URL=postgresql://crypto_app:PASSWORD@RDS_ENDPOINT:5432/crypto_smart_money
```

อย่าใส่:

```text
localhost
```

เพราะ Production database อยู่ที่ RDS

---

# 8. EC2 Setup

SSH เข้า EC2:

```bash
ssh -i <KEY.pem> ubuntu@<EC2_PUBLIC_IP>
```

Update:

```bash
sudo apt update
sudo apt upgrade -y
```

---

# 9. Install Git

```bash
sudo apt install -y git
```

ตรวจสอบ:

```bash
git --version
```

---

# 10. Install Docker

ติดตั้ง Docker ตาม official installation method สำหรับ Ubuntu

ตรวจสอบ:

```bash
docker --version
```

และ:

```bash
docker compose version
```

---

# 11. Install Node.js

Project ใช้ Node.js 20 LTS

ตรวจสอบ:

```bash
node -v
```

ควรเป็น:

```text
v20.x.x
```

---

# 12. Install pnpm

เปิด Corepack:

```bash
corepack enable
```

ตรวจสอบ:

```bash
pnpm -v
```

ควรใช้ pnpm 10.x

---

# 13. Clone Project

บน EC2:

```bash
cd ~
```

Clone:

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

# 14. Production Environment

สร้าง `.env`:

```bash
touch .env
```

ตัวอย่าง:

```env
DATABASE_URL=postgresql://crypto_app:PASSWORD@RDS_ENDPOINT:5432/crypto_smart_money

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
```

ถ้าใช้ Telegram:

```env
TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN
TELEGRAM_CHAT_ID=YOUR_CHAT_ID
```

---

# 15. Production Secrets Rules

ห้าม commit:

```text
.env
AWS credentials
RPC API Key
Telegram Bot Token
Database Password
Private Key
JWT Secret
```

ตรวจสอบ:

```bash
git status
```

`.env` ต้องไม่อยู่ใน tracked files

---

# 16. Install Dependencies

จาก root:

```bash
pnpm install --frozen-lockfile
```

ใช้:

```text
--frozen-lockfile
```

บน Production เพื่อป้องกัน dependency version เปลี่ยนโดยไม่ตั้งใจ

---

# 17. Database Migration

ก่อน start application ต้อง migrate database

```bash
pnpm --filter db exec drizzle-kit migrate
```

ตรวจสอบว่าขึ้น:

```text
migrations applied successfully
```

---

# 18. Production Database Rule

ห้ามใช้:

```bash
drizzle-kit push
```

กับ Production โดยไม่เข้าใจกระบวนการอย่างชัดเจน

Production ควรใช้:

```text
Migration files
      ↓
drizzle-kit migrate
      ↓
RDS
```

Migration ทุกครั้งต้อง commit เข้า Git

---

# 19. Docker Production

Production ควรให้ Application ทำงานผ่าน Docker

Concept:

```text
EC2
 │
 ├── Web Container
 ├── API Container
 ├── Indexer Container
 └── Notifier Container
        │
        ▼
       RDS
```

PostgreSQL ไม่ควรรันเป็น Docker container บน EC2 Production

Production database ใช้:

```text
AWS RDS PostgreSQL
```

---

# 20. Local vs Production Database

## Local

```text
Docker PostgreSQL

localhost:5433
```

Connection:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/crypto_smart_money
```

---

## Production

```text
AWS RDS PostgreSQL

RDS:5432
```

Connection:

```env
DATABASE_URL=postgresql://crypto_app:PASSWORD@RDS_ENDPOINT:5432/crypto_smart_money
```

---

# 21. Production Services

ระบบมี 4 application:

```text
apps/web
apps/api
apps/indexer
apps/notifier
```

หน้าที่:

### Web

React dashboard

```text
Browser
   ↓
Web
   ↓
API
```

### API

อ่านข้อมูลจาก PostgreSQL

```text
React
  ↓
API
  ↓
RDS
```

### Indexer

อ่าน Ethereum

```text
Ethereum RPC
     ↓
Indexer
     ↓
RDS
```

### Notifier

แจ้งเตือน:

```text
RDS / Detection
       ↓
Notifier
       ↓
Telegram
```

---

# 22. Indexer Production

Indexer เป็น service ที่ต้องทำงานต่อเนื่อง

```text
Indexer
   │
   ├── Ethereum RPC
   │
   └── PostgreSQL
```

ห้ามรันแบบ:

```bash
node indexer.js
```

แล้วปิด SSH session โดยไม่มี process manager/container

Production ต้องมีระบบ restart:

```text
Docker
```

หรือ process manager ที่เหมาะสม

แนะนำ:

```text
Docker
```

---

# 23. Indexer Restart Policy

Container ควรมี:

```yaml
restart: unless-stopped
```

เพื่อให้ Indexer กลับมาทำงานเมื่อ:

```text
EC2 reboot
Docker restart
Process crash
```

---

# 24. Web/API

Web และ API ควรอยู่หลัง reverse proxy

Architecture:

```text
Internet
   ↓
HTTPS
   ↓
Reverse Proxy
   ├── Web
   └── API
```

ตัวอย่าง:

```text
https://your-domain.com
https://api.your-domain.com
```

---

# 25. HTTPS

Production ต้องใช้ HTTPS

แนะนำ:

```text
Domain
  ↓
HTTPS
  ↓
Reverse Proxy
```

Certificate สามารถใช้:

```text
Let's Encrypt
```

หรือ AWS-managed certificate architecture ตาม deployment ที่เลือก

---

# 26. Domain

ตัวอย่าง:

```text
smartmoney.example.com
api.smartmoney.example.com
```

DNS ชี้มายัง production endpoint ที่ใช้รับ traffic

ห้าม hard-code IP address ใน application

---

# 27. Deploy Workflow

เมื่อมี code ใหม่:

```text
Developer
    ↓
git push
    ↓
GitHub
    ↓
EC2
    ↓
git pull
    ↓
docker build
    ↓
docker compose up -d
```

ในอนาคตสามารถเปลี่ยนเป็น:

```text
GitHub Actions
      ↓
Docker Build
      ↓
Deploy
      ↓
EC2
```

---

# 28. Manual Deployment

กรณียังไม่มี CI/CD

SSH เข้า EC2:

```bash
ssh -i <KEY.pem> ubuntu@<EC2_PUBLIC_IP>
```

เข้า project:

```bash
cd ~/crypto-smart-money
```

Pull:

```bash
git pull
```

Install:

```bash
pnpm install --frozen-lockfile
```

Migration:

```bash
pnpm --filter db exec drizzle-kit migrate
```

Build Docker:

```bash
docker compose build
```

Start:

```bash
docker compose up -d
```

ตรวจสอบ:

```bash
docker compose ps
```

---

# 29. Check Logs

ดูทุก container:

```bash
docker compose logs
```

ดูแบบ realtime:

```bash
docker compose logs -f
```

ดูเฉพาะ Indexer:

```bash
docker compose logs -f indexer
```

API:

```bash
docker compose logs -f api
```

Web:

```bash
docker compose logs -f web
```

Notifier:

```bash
docker compose logs -f notifier
```

---

# 30. Restart Services

Restart ทั้งหมด:

```bash
docker compose restart
```

Restart Indexer:

```bash
docker compose restart indexer
```

Restart API:

```bash
docker compose restart api
```

---

# 31. Stop Services

```bash
docker compose down
```

คำสั่งนี้หยุด containers

แต่ไม่ได้ลบ RDS

และไม่ได้ลบ Git repository

---

# 32. Never Delete Production Database Accidentally

ห้ามใช้คำสั่งที่ทำลาย database โดยไม่ตรวจสอบ environment

ตัวอย่างคำสั่งอันตราย:

```bash
docker compose down -v
```

คำสั่งนี้อาจลบ Docker volumes

Production ใช้ RDS ดังนั้นต้องระวังคำสั่ง database operation เป็นพิเศษ

---

# 33. Health Checks

ตรวจสอบ EC2:

```bash
docker compose ps
```

ตรวจสอบ API:

```bash
curl http://localhost:<API_PORT>/health
```

ตรวจสอบ Web:

```bash
curl http://localhost
```

ตรวจสอบ database:

```text
EC2
 ↓
RDS:5432
```

---

# 34. Indexer Health

ตรวจสอบ:

```bash
docker compose logs --tail=100 indexer
```

ควรเห็น:

```text
Ethereum indexer started
Latest block: XXXXX
```

และ transaction processing

ถ้า Indexer crash:

```bash
docker compose ps
```

ตรวจสอบ:

```bash
docker compose logs --tail=200 indexer
```

---

# 35. RPC Monitoring

Indexer ขึ้นอยู่กับ Ethereum RPC

ต้อง monitor:

```text
RPC latency
RPC errors
Rate limits
Request volume
```

ถ้า RPC provider มี rate limit:

```text
Indexer
   ↓
RPC
   ↓
429 / rate limit
```

ให้ลด request หรือ upgrade RPC plan

---

# 36. Database Monitoring

RDS ต้อง monitor:

```text
CPU
Memory
Storage
Connections
Read IOPS
Write IOPS
```

โดยเฉพาะ:

```text
Storage
Database Connections
CPU
```

---

# 37. Backup

เปิด RDS:

```text
Automated Backups
```

และกำหนด retention

Production database ต้องมี backup

อย่าพึ่งพา:

```text
EC2 disk
Docker volume
```

เป็น backup หลัก

---

# 38. Disaster Recovery

ถ้า EC2 พัง:

```text
EC2
 X
```

สามารถสร้าง EC2 ใหม่แล้ว:

```text
git clone
↓
.env
↓
Docker
↓
Connect RDS
```

ข้อมูลยังอยู่ที่:

```text
RDS
```

ดังนั้น:

```text
Application = disposable
Database = persistent
```

---

# 39. Deployment Principle

Production architecture:

```text
EC2
 ├── Web
 ├── API
 ├── Indexer
 └── Notifier

RDS
 └── PostgreSQL
```

อย่าเก็บ Production database เป็น local Docker volume บน EC2

---

# 40. Security Checklist

ก่อน Production:

```text
[ ] SSH restricted
[ ] RDS not public
[ ] RDS accessible only from EC2
[ ] HTTPS enabled
[ ] .env not committed
[ ] RPC API key secured
[ ] Telegram token secured
[ ] Database password strong
[ ] RDS backup enabled
[ ] CloudWatch monitoring enabled
[ ] EC2 security group reviewed
```

---

# 41. Cost Monitoring

ตรวจสอบ AWS Cost Explorer เป็นประจำ

Components ที่ต้อง monitor:

```text
EC2
RDS
EBS
Data Transfer
CloudWatch
```

ตั้ง:

```text
AWS Budget Alert
```

เพื่อป้องกันค่าใช้จ่ายเกินคาด

---

# 42. Production Environment Variables

ตัวอย่าง Production:

```env
DATABASE_URL=postgresql://crypto_app:PASSWORD@RDS_ENDPOINT:5432/crypto_smart_money

ETHEREUM_RPC_URL=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY

TELEGRAM_BOT_TOKEN=YOUR_TELEGRAM_BOT_TOKEN

TELEGRAM_CHAT_ID=YOUR_CHAT_ID

NODE_ENV=production
```

ห้าม commit ไฟล์นี้

---

# 43. Release Checklist

ก่อน deploy:

```bash
git status
```

ตรวจสอบ:

```bash
pnpm install
```

Typecheck:

```bash
pnpm --filter indexer typecheck
```

ตรวจ migration:

```bash
pnpm --filter db exec drizzle-kit check
```

ตรวจ `.env`:

```bash
git status
```

ต้องไม่มี:

```text
.env
```

---

# 44. Deploy Checklist

```text
[ ] git pull
[ ] pnpm install --frozen-lockfile
[ ] database migration
[ ] docker compose build
[ ] docker compose up -d
[ ] docker compose ps
[ ] check API
[ ] check Web
[ ] check Indexer
[ ] check Notifier
[ ] check logs
```

---

# 45. Rollback

ถ้า deployment ใหม่มีปัญหา:

```bash
git log --oneline
```

เลือก commit ก่อนหน้า:

```bash
git checkout <PREVIOUS_COMMIT>
```

จากนั้น:

```bash
pnpm install --frozen-lockfile
```

และ rebuild:

```bash
docker compose build
docker compose up -d
```

> Database migration ต้องวางแผน rollback แยกต่างหาก ห้าม assume ว่า code rollback แล้ว schema จะ rollback ตามอัตโนมัติ

---

# 46. Recommended Git Tags

Production release ควร tag:

```text
v0.1.0
v0.2.0
v0.3.0
```

ตัวอย่าง:

```bash
git tag v0.1.0
git push origin v0.1.0
```

ทำให้สามารถย้อนดู version ที่ deploy ได้ง่าย

---

# 47. Production Directory

แนะนำ:

```text
/home/ubuntu/crypto-smart-money
```

หรือ:

```text
/opt/crypto-smart-money
```

อย่าวาง application กระจัดกระจายหลายที่

---

# 48. Current Deployment Strategy

MVP:

```text
GitHub
   ↓
EC2
   ↓
Docker
   ├── Web
   ├── API
   ├── Indexer
   └── Notifier
   ↓
RDS PostgreSQL
```

อนาคตสามารถ upgrade เป็น:

```text
GitHub Actions
      ↓
Docker Registry
      ↓
ECS / ECR
      ↓
Load Balancer
      ↓
RDS
```

แต่ **ไม่จำเป็นสำหรับ MVP**

---

# 49. Production Development Philosophy

อย่า optimize infrastructure เร็วเกินไป

เริ่มจาก:

```text
EC2 + Docker + RDS
```

เมื่อ workload เพิ่มขึ้นค่อยแยก:

```text
Indexer
API
Notifier
Web
```

เป็น service แยก infrastructure

---

# 50. Current Project Status

```text
Application
├── Web          [Development]
├── API          [Development]
├── Indexer      [Working]
└── Notifier     [Development]

Database
├── PostgreSQL   [Working]
├── wallets      [Working]
├── transactions [Working]
├── token_transfers [Working]
└── tokens       [Working]

Blockchain
└── Ethereum Mainnet [Working]

Production
├── EC2          [Planned]
├── RDS          [Planned]
├── Docker       [Planned]
├── HTTPS        [Planned]
└── CI/CD        [Planned]
```

---

# 51. First AWS Deployment

เมื่อ Project พร้อม deploy ครั้งแรก:

```text
1. Create VPC
2. Create RDS PostgreSQL
3. Create EC2
4. Configure Security Groups
5. Install Docker
6. Install Node.js
7. Install pnpm
8. Clone GitHub repository
9. Create production .env
10. Run database migration
11. Build Docker images
12. Start containers
13. Configure HTTPS
14. Configure domain
15. Enable monitoring
16. Enable backups
17. Test Indexer
18. Test API
19. Test Web
20. Test Telegram
```

---

# 52. Final Production Architecture

เป้าหมาย MVP:

```text
                         ┌──────────────┐
                         │   Browser    │
                         └──────┬───────┘
                                │
                              HTTPS
                                │
                                ▼
                       ┌─────────────────┐
                       │      EC2        │
                       │                 │
                       │  Reverse Proxy  │
                       │        │        │
                       │   ┌────┴────┐   │
                       │   │         │   │
                       │  Web       API  │
                       │             │   │
                       │   Indexer   │   │
                       │      │      │   │
                       │   Notifier  │   │
                       └──────┼──────┼───┘
                              │      │
                              │      │
                              ▼      ▼
                       ┌─────────────────┐
                       │   RDS Postgres  │
                       └─────────────────┘

                              ▲
                              │
                              │ RPC
                              │
                       ┌──────┴───────┐
                       │   Ethereum   │
                       └──────────────┘

                              │
                              ▼
                          Telegram
```

---

# 53. AWS Golden Rules

จำ 7 ข้อนี้ไว้:

```text
1. RDS = Production Database
2. EC2 = Application Runtime
3. Docker = Application Isolation
4. .env = Secret / Never Commit
5. Migration = Database Version Control
6. Backup = RDS Responsibility
7. Monitoring = Production Safety
```

---

# 54. Last Updated

```text
Last Updated:
2026-09-09

Current Phase:
ERC-20 Token Metadata

Next Application Phase:
Token Metadata Cache
→ Human-readable Amount
→ USD Value
→ Whale Detection

AWS Status:
Not deployed yet

Target MVP Infrastructure:
EC2 + Docker + RDS PostgreSQL
```
