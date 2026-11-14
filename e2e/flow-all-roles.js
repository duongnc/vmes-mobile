// Kiểm thử đầu-cuối: đi hết luồng của 3 vai trò trên bản web (khổ điện thoại, camera giả lập).
// Các bước nối tiếp nhau và dùng chung dữ liệu (NCR, yêu cầu cấp bù do bước trước tạo ra).
// Chạy: node e2e/serve.js dist &   rồi   node e2e/flow-all-roles.js     (BASE_URL để đổi địa chỉ)
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const BASE = process.env.BASE_URL || 'http://localhost:8099/';
const SHOTS = path.join(__dirname, 'shots');
fs.mkdirSync(SHOTS, { recursive: true });
let failCount = 0;
const check = (cond, label) => { console.log(cond ? 'OK  ' : 'FAIL', label); if (!cond) failCount++; };
(async () => {
  const browser = await chromium.launch({ args: ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'] });
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 }, permissions: ['camera'] });
  const page = await ctx.newPage();
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message().replace(/\n/g, ' | ')); await d.accept(); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  page.on('console', (m) => { if (m.type() === 'error') console.log('CONSOLE', m.text().slice(0, 300)); });
  let n = 0;
  const shot = async (name) => { await page.waitForTimeout(400); await page.screenshot({ path: path.join(SHOTS, `${String(++n).padStart(2, '0')}-${name}.png`) }); };
  const click = async (text, opts = {}) => { await page.getByText(text, { exact: opts.exact ?? false }).filter({ visible: true }).last().click(); await page.waitForTimeout(250); };
  const has = async (text) => (await page.getByText(text).filter({ visible: true }).count()) > 0;
  const expectText = async (text) => { await page.waitForTimeout(300); check(await has(text), text); };
  const login = async (name) => { await click(name); await click('ĐĂNG NHẬP'); await page.waitForTimeout(600); };
  const logout = async () => { await click('Tài khoản', { exact: true }); await click('ĐĂNG XUẤT'); await page.waitForTimeout(500); };
  const back = async () => { await page.goBack(); await page.waitForTimeout(500); };

  await page.goto(BASE);
  await page.waitForTimeout(1500);
  await shot('login');
  // wrong PIN
  await page.getByPlaceholder('VD: VTX1001').fill('VTX1001');
  await page.getByPlaceholder('••••').fill('0000');
  await click('ĐĂNG NHẬP'); await expectText('Mã PIN không đúng.');

  // ---- Technician
  await login('Nguyễn Văn A');
  await expectText('Lệnh được giao (2)');
  await shot('tech-home');
  await click('WO-2427', { exact: true });
  await expectText('Hàn sóng');
  await click('HOÀN THÀNH BƯỚC'); // chưa bắt đầu: phải bị từ chối kèm lý do
  check((dialogs.at(-1) || '').includes('Hãy bấm BẮT ĐẦU trước'), 'Hoàn thành khi chưa bắt đầu bị từ chối kèm lý do');
  await click('BẮT ĐẦU CÔNG ĐOẠN');
  await expectText('Đang chạy');
  await click('HOÀN THÀNH BƯỚC'); // BOM missing
  check((dialogs.at(-1) || '').includes('Chưa đối soát đủ linh kiện'), 'Hoàn thành khi chưa quét đủ BOM bị từ chối');
  await click('Xem hướng dẫn công đoạn');
  await shot('wo-detail-running');
  await click('QUÉT LINH KIỆN');
  await page.waitForTimeout(1000);
  await click('Dùng mã demo');
  await click('LM358 · ngoài BOM'); await expectText('Sai mã: LM358');
  await shot('scan-fail');
  await click('Quét tiếp');
  await click('ADUM4160 · sai COC'); await expectText('Không khớp chứng chỉ xuất xứ');
  await click('Quét tiếp');
  await click('ADUM4160 · lô L2345A'); await expectText('KHỚP BOM');
  await click('Quét tiếp');
  await click('STM32F407 · lô L2401B'); await expectText('ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN');
  await shot('scan-ok');
  await click('ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN');
  await page.waitForTimeout(500);
  await click('HOÀN THÀNH BƯỚC');
  console.log('dialog:', dialogs.at(-1));
  await expectText('Lắp cơ khí');
  // step 4: expired lot
  await click('BẮT ĐẦU CÔNG ĐOẠN');
  await click('QUÉT LINH KIỆN'); await page.waitForTimeout(800);
  await click('Dùng mã demo');
  await click('CONN-DB9 · lô L2212E'); await expectText('hết hạn sử dụng');
  await click('Quét tiếp');
  await back();
  // part request with hold
  await click('Yêu cầu cấp bù');
  await click('CONN-DB9', { exact: true });
  await page.getByPlaceholder('VD: linh kiện cong chân').fill('Đầu nối cong chân');
  await page.getByRole('switch', { name: 'Tạm giữ lệnh' }).click();
  await click('GỬI YÊU CẦU');
  console.log('dialog:', dialogs.at(-1));
  await expectText('Lệnh đang bị giữ');
  await shot('wo-hold-request');
  // photo to WO record
  await page.getByRole('button',{name:'Chụp ảnh hồ sơ'}).click(); await page.waitForTimeout(2000);
  await shot('camera');
  await page.getByLabel('Chụp ảnh', { exact: true }).click(); await page.waitForTimeout(1500);
  const img = page.getByLabel('Chạm vào ảnh để khoanh vùng lỗi');
  await img.click({ position: { x: 100, y: 80 } }); await img.click({ position: { x: 250, y: 180 } });
  await expectText('(2 vùng)');
  await page.getByPlaceholder('VD: mối hàn J3 thiếu thiếc').fill('Chân đầu nối cong');
  await shot('photo-annotate');
  await click('LƯU VÀO HỒ SƠ WO-2427'); await page.waitForTimeout(600);
  await expectText('Ảnh hồ sơ sản xuất (1)');
  // NCR critical with photo on WO-2430? use WO-2427 major
  await click('Báo lỗi (NCR)');
  await click('Major – nặng');
  await click('Mối hàn', { exact: true });
  await page.getByPlaceholder('Mô tả hiện tượng').fill('Cầu chì hàn giữa chân 3-4 của U5');
  await click('Chụp ảnh lỗi'); await page.waitForTimeout(1500);
  await page.getByLabel('Chụp ảnh', { exact: true }).click(); await page.waitForTimeout(1500);
  await page.getByLabel('Chạm vào ảnh để khoanh vùng lỗi').click({ position: { x: 150, y: 120 } });
  await click('ĐÍNH KÈM VÀO NCR'); await page.waitForTimeout(600);
  await expectText('Ảnh đính kèm (1)');
  await shot('ncr-new');
  await click('GỬI NCR'); await page.waitForTimeout(600);
  await expectText('NCR-0002');
  await shot('ncr-detail-tech');
  await back(); await back();
  // offline
  await click('Tài khoản', { exact: true });
  await page.getByRole('switch', { name: 'Chế độ ngoại tuyến' }).click();
  await expectText('Đang ngoại tuyến');
  await click('Lệnh SX', { exact: true });
  await click('WO-2428', { exact: true });
  await click('Báo lỗi (NCR)');
  await page.getByPlaceholder('Mô tả hiện tượng').fill('Khay linh kiện bị ẩm');
  await click('GỬI NCR'); await page.waitForTimeout(500);
  await back(); await back();
  await click('Tài khoản', { exact: true });
  await expectText('1 thay đổi được lưu trên máy');
  await shot('offline-queue');
  await page.reload(); await page.waitForTimeout(1500);   // persistence check
  await click('Tài khoản', { exact: true });
  await expectText('1 thay đổi được lưu trên máy');
  await page.getByRole('switch', { name: 'Chế độ ngoại tuyến' }).click();
  await page.waitForTimeout(1500);
  await expectText('Mọi thay đổi đã được đồng bộ.');
  await click('Thông báo', { exact: true }); await shot('tech-notifications');
  await logout();

  // ---- QC
  await login('Trần Thị B');
  await expectText('Lô chờ IQC');
  await shot('qc-home');
  await click('MAX31855', { exact: true });
  for (const b of await page.getByRole('button', { name: 'Đạt', exact: true }).all()) await b.click();
  await shot('iqc');
  await click('CHẤP NHẬN LÔ'); console.log('dialog:', dialogs.at(-1)); await page.waitForTimeout(500);
  await click('CAP100N', { exact: true });
  const fails = await page.getByRole('button', { name: 'Không đạt', exact: true }).all();
  await fails[0].click();
  await page.getByPlaceholder('Nhập nhận xét khi kiểm tra').fill('Bao bì rách, mất nhãn');
  await click('TỪ CHỐI LÔ & LẬP NCR'); await page.waitForTimeout(600);
  await expectText('IQC từ chối lô L2399X');
  await click('GỬI NCR'); await page.waitForTimeout(500);
  await expectText('NCR-0004');
  await back();
  await click('WO-2429', { exact: true }); await page.waitForTimeout(400);
  await expectText('Lệnh đang chờ duyệt FAI');
  for (const b of await page.getByRole('button', { name: 'Đạt', exact: true }).all()) await b.click();
  await click('LƯU KẾT QUẢ KIỂM TRA'); console.log('dialog:', dialogs.at(-1));
  await expectText('Lịch sử kiểm tra (1)');
  await shot('pqc');
  await back();
  await click('NCR', { exact: true });
  await shot('ncr-list');
  await click('NCR-0002', { exact: true });
  await click('Tiếp nhận xử lý');
  await click('Sửa lại (Rework)');
  await page.getByPlaceholder('VD: nhiệt độ bể thiếc thấp').fill('Stencil mòn');
  await click('ĐÓNG NCR'); await expectText('Đã đóng');
  await shot('ncr-closed');
  await back();
  await click('Kiểm tra', { exact: true });
  await click('TRUY XUẤT NGUỒN GỐC');
  await page.getByPlaceholder('VD: WO-2427, STM32F407').fill('L2401B');
  await expectText('STM32F407 · Lô L2401B → WO-2427');
  await shot('trace');
  await back();
  await logout();

  // ---- Manager
  await login('Phạm Văn D');
  await expectText('Cảnh báo bottleneck');
  await shot('mgr-dashboard-top');
  await page.screenshot({ path: path.join(SHOTS, 'full-dashboard.png'), fullPage: true });
  await page.getByText('OEE toàn xưởng').scrollIntoViewIfNeeded(); await shot('mgr-dashboard-oee');
  await page.getByText('Thống kê lỗi (NCR)').scrollIntoViewIfNeeded(); await shot('mgr-dashboard-defects');
  const approve = page.getByRole('button', { name: 'Duyệt cấp bù' });
  check((await approve.count()) === 2, 'Có 2 yêu cầu cấp bù chờ duyệt (1 mẫu + 1 do kỹ thuật viên tạo)');
  await approve.first().click(); await approve.first().click(); await page.waitForTimeout(400);
  check((await approve.count()) === 0, 'Duyệt hết thì danh sách chờ trống');
  await click('Điều phối', { exact: true });
  await page.getByRole('button', { name: 'Tăng ưu tiên WO-2430', exact: true }).click(); await page.waitForTimeout(300);
  await shot('mgr-priority');
  await click('WO-2428', { exact: true }); await page.waitForTimeout(400);
  check(!(await has('Lệnh đang bị giữ')), 'WO-2428 tự được gỡ giữ sau khi duyệt cấp bù');
  await click('Giữ lệnh');
  await page.getByPlaceholder('VD: máy hỏng').fill('Máy SMT bảo trì');
  await click('XÁC NHẬN GIỮ LỆNH'); await expectText('Máy SMT bảo trì');
  await click('GỠ GIỮ – CHO PHÉP TIẾP TỤC');
  check(!(await has('Lệnh đang bị giữ')), 'Quản lý gỡ giữ thủ công thành công');
  await back();
  await click('Thông báo', { exact: true }); await shot('mgr-notifications');
  await logout();
  console.log('\nCác hộp thoại đã hiện:\n' + dialogs.join('\n'));
  await browser.close();
  console.log(failCount === 0 ? '\nKẾT QUẢ: ĐẠT' : `\nKẾT QUẢ: TRƯỢT (${failCount} kiểm tra lỗi)`);
  process.exit(failCount === 0 ? 0 : 1);
})().catch((e) => { console.error('SCRIPT ERROR', e.message.split('\n').slice(0, 6).join('\n')); process.exit(1); });
