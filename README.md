# Project Access Control — Internship Test

ชุดงานตัวอย่างครบส่วนที่ 1–4 สำหรับโจทย์ระบบจัดการสิทธิ์การเข้าถึงข้อมูลโครงการ

## Tech stack (ส่วนที่ 3)
- **React 18**: แยก UI เป็น component และจัดการ state ของผู้ใช้/Task ได้
- **Vite**: เริ่มต้นและ build โปรเจกต์ได้รวดเร็วด้วยคำสั่งมาตรฐาน
- **React Router**: จัดการ URL `/login`, `/admin`, `/employee` และ redirect ตาม role
- **JavaScript**: เพียงพอกับขอบเขต mock app และไม่เพิ่มความซับซ้อนของ TypeScript

ส่วนที่ 3 ใช้ Mock Data ในหน่วยความจำตามโจทย์เท่านั้น ไม่ใช่ backend จริง และข้อมูลจะกลับเป็นค่าเริ่มต้นเมื่อ reload หน้าเว็บ

## วิธีรัน
ต้องติดตั้ง Node.js รุ่น LTS ก่อน จากนั้นเปิด terminal ใน `section-3/` แล้วรัน:

```bash
npm install
npm run dev
```

เปิด URL ที่ Vite แสดง (โดยปกติคือ http://localhost:5173)

## บัญชีทดสอบ
| Username | Role | สิทธิ์ |
|---|---|---|
| admin | admin | ดู Task ทั้งหมดและสร้าง Task |
| employee1 | employee | ดู/เปลี่ยนสถานะเฉพาะ Task ของตน |
| employee2 | employee | ดู/เปลี่ยนสถานะเฉพาะ Task ของตน |

ไม่ต้องใช้รหัสผ่าน เนื่องจากโจทย์อนุญาตให้เลือก username จาก dropdown

## โครงสร้าง
- `section-1/`: Flowchart และ Decision Log
- `section-2/`: SQL schema สำหรับระบบจริง
- `section-3/`: React + Vite Web App ที่ใช้ Mock API
- `section-4/`: โค้ด backend/frontend ที่แก้ไข และรายการบั๊ก

## ข้อจำกัดและแนวทาง
- Schema ในส่วนที่ 2 ออกแบบสำหรับ PostgreSQL
- ส่วนที่ 3 เป็น mock เท่านั้น จึงไม่เชื่อมต่อ schema หรือ API จริง
- ส่วนที่ 4 สมมติว่า `db` เป็น PostgreSQL Pool ที่มี `connect()` และ API client ฝั่ง React คืน task object หลัง PATCH ตามเงื่อนไขโจทย์
- ก่อนส่งงานจริง ให้รัน `npm install` และ `npm run dev` ด้วยตนเอง ตรวจสอบทุก role และแก้เวลาใน `START.md` ให้ตรงเวลาเริ่มจริง

## Git checklist
1. สร้าง Public Repository
2. commit โครงสร้างและ `START.md` ภายใน 15 นาทีแรก
3. commit ความคืบหน้าทุก 30 นาที พร้อมข้อความอธิบายงาน
4. ห้าม commit `node_modules`, `.env` หรือ secret
