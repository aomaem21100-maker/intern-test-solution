# BUGS — ผลการตรวจสอบและแก้ไข

เลขบรรทัดอ้างอิงจากโค้ดต้นฉบับในโจทย์

| # | ไฟล์:บรรทัด | ประเภท | ความรุนแรง | ปัญหา (เกิดอะไร เมื่อไหร่) | วิธีแก้ | วิธีพิสูจน์ |
|---:|---|---|---|---|---|---|
| 1 | `routes/tasks.js:235-240` | security | critical | DELETE ไม่มี `authenticate` และตรวจ `req.user` แบบมีเงื่อนไข ทำให้ request ที่ไม่มี token อาจลบ Task ได้ | เพิ่ม `authenticate` และตรวจ role admin แบบชัดเจนก่อนลบ | ทำ: ส่ง `DELETE /api/tasks/1` โดยไม่แนบ token → โค้ดเดิมอาจลบได้ → โค้ดที่แก้ต้องตอบ 401 |
| 2 | `routes/tasks.js:178-179` | security / logic | high | ต่อ `assigned_to = ${req.user.id}` ลง SQL โดยตรง เสี่ยง SQL injection หากค่าผู้ใช้ไม่ถูกควบคุม | ใช้ parameterized query `$n` และเพิ่มเงื่อนไขด้วย params | ทำ: Login เป็น Employee แล้วเรียก GET → SQL ต้อง bind user id เป็น parameter ไม่ต่อค่าลง query string |
| 3 | `routes/tasks.js:170-179` | logic | high | เมื่อมี `projectId` จะมี WHERE แต่กรณีต่อเงื่อนไข Employee ด้วย `AND` ต้องพึ่ง WHERE ที่มีอยู่ หากไม่มี projectId จะกลายเป็น `SELECT ... FROM tasks AND ...` ซึ่ง SQL ผิด | สร้าง conditions array แล้วประกอบ WHERE เมื่อมีเงื่อนไข | ทำ: Employee เรียก `GET /api/tasks` โดยไม่ส่ง projectId → โค้ดเดิมเกิด SQL error 500 → โค้ดที่แก้คืนเฉพาะ Task ของตน |
| 4 | `routes/tasks.js:210-212` | logic / security | high | ใช้ `!isAdmin || !isOwner` ทำให้ Admin ที่ไม่ใช่เจ้าของ Task ถูกปฏิเสธ ทั้งที่ Admin แก้ Task ใดก็ได้ | ปฏิเสธเฉพาะกรณี `!isAdmin && !isOwner` | ทำ: Admin แก้ Task ที่ assigned_to เป็น Employee คนอื่น → โค้ดเดิมตอบ 403 → โค้ดที่แก้ตอบ 200 |
| 5 | `routes/tasks.js:223-226` | async / data integrity | high | ไม่ await การ INSERT audit_log และไม่ได้รวมกับ UPDATE ใน transaction จึงอาจตอบสำเร็จก่อน log เสร็จ หรือ log ล้มเหลวแต่สถานะเปลี่ยนแล้ว | ใช้ transaction และ await INSERT ก่อน COMMIT | ทำ: จำลองให้ INSERT audit_log ล้มเหลว → โค้ดเดิมอาจเปลี่ยนสถานะสำเร็จโดยไม่มี log → โค้ดที่แก้ต้อง rollback ทั้งรายการ |
| 6 | `routes/tasks.js:214-216` | logic / validation | high | Employee เปลี่ยน Done กลับ To Do ถูกห้าม แต่ยังอนุญาตให้ส่ง Done ซ้ำเมื่อ Task เป็น Done และไม่บังคับ transition To Do → Done เท่านั้น | ตรวจทั้งสถานะเดิมและสถานะใหม่ โดย Employee ต้องเป็น To Do และส่ง Done เท่านั้น | ทำ: Employee ส่ง PATCH ให้ Task ที่ Done แล้วด้วย status Done ซ้ำ → โค้ดเดิมตอบ 200 → โค้ดที่แก้ตอบ 409 |
| 7 | `routes/tasks.js:192-196` | validation | medium | ไม่ตรวจว่า `:id` เป็นเลขจำนวนเต็มบวกก่อน query | ตรวจ `Number.isSafeInteger` และค่ามากกว่า 0 | ทำ: ส่ง `PATCH /api/tasks/abc/status` → โค้ดเดิมส่งค่าที่ไม่ถูกต้องไป query → โค้ดที่แก้ตอบ 400 |
| 8 | `pages/EmployeeTasks.jsx:261-267` | async / UI | high | ไม่มี catch หากโหลดครั้งแรกผิดพลาด ทำให้เกิด unhandled rejection และ loading ค้าง | ใช้ try/catch/finally และแสดง error | ทำ: ให้ GET ครั้งแรก reject → โค้ดเดิมไม่มีข้อความ error และ loading ไม่ถูกปิด → โค้ดที่แก้แสดง error และปิด loading |
| 9 | `pages/EmployeeTasks.jsx:269-273` | async / logic | high | ตั้ง interval แต่ไม่ clear เมื่อออกจากหน้า ทำให้ยังยิง API ต่อ และ effect อาจสร้าง interval ซ้ำเมื่อ token เปลี่ยน | return cleanup ที่ clearInterval และป้องกัน setState หลัง unmount | ทำ: เปิดหน้าแล้วออกจากหน้า จากนั้นรอเกิน 10 วินาที → โค้ดเดิมยังเรียก API → โค้ดที่แก้หยุดเรียก |
| 10 | `pages/EmployeeTasks.jsx:263-265` | security / UI | medium | โหลด task ทั้งหมดมาแสดงใน state แม้จะกรองตอน render; ข้อมูลของคนอื่นยังอยู่ใน client | กรอง task ด้วย user.id ก่อนเก็บ state และ backend ต้องกรองด้วย | ทำ: ให้ API ส่ง Task ของ Employee หลายคน → state ของหน้า Employee ที่แก้ต้องเก็บเฉพาะ assigned_to ของผู้ใช้ |
| 11 | `pages/EmployeeTasks.jsx:280-282` | logic / UI | high | แก้ object ใน state โดยตรงแล้วส่ง reference เดิมเข้า setTasks ทำให้ React อาจไม่ render ทันที | ใช้ setTasks แบบ immutable และสร้าง object ใหม่ | ทำ: กดปุ่ม Done → โค้ดเดิมหน้าจออาจยังแสดง To Do จนกว่าจะโหลดใหม่ → โค้ดที่แก้เปลี่ยนทันที |
| 12 | `pages/EmployeeTasks.jsx:285-288` | async / logic | high | เมื่อ API ล้มเหลว UI ยังคงแสดง Done เพราะไม่มี rollback | เก็บสถานะเดิมและคืนค่าเดิมเมื่อ catch; ใช้ผลตอบกลับจาก server เมื่อสำเร็จ | ทำ: กด Done แล้วจำลอง PATCH reject → โค้ดเดิมยังแสดง Done → โค้ดที่แก้กลับเป็น To Do |
| 13 | `pages/EmployeeTasks.jsx:304` | UI | low | ใช้ index เป็น key ทำให้ React จับคู่รายการผิดได้เมื่อรายการเปลี่ยนลำดับหรือถูกแทรก | ใช้ `task.id` เป็น key | ทำ: เพิ่ม/เปลี่ยนลำดับ Task → React ต้องอ้างอิงแต่ละแถวด้วย id ที่คงที่ ไม่ใช่ตำแหน่งใน array |

## จุดที่สงสัย
- `GET /api/tasks` ที่กำหนดให้ทุกคนที่ Login เรียกได้ไม่ใช่บั๊กในตัวมันเอง เพราะต้องกรองข้อมูลตาม role ภายใน endpoint อยู่แล้ว
- เงื่อนไข `if (!isAdmin && task.status === 'Done' && status === 'To Do')` ในโค้ดเดิมห้าม Employee ย้อนสถานะได้ถูกทิศทาง แต่ยังไม่ครบกฎ เพราะไม่ได้บังคับให้ Employee เปลี่ยนได้เฉพาะ To Do → Done เท่านั้น
- `api.getTasks` และ `api.updateStatus` ถือว่าถูกต้องตามโจทย์ จึงไม่แก้ implementation ของ API client
- โค้ดที่แก้ใน `tasks.js` สมมติว่า `db` เป็น PostgreSQL Pool ที่รองรับ `connect()` เพื่อใช้ transaction
