// Hồi quy lỗi "kỹ thuật viên bị kẹt ở màn hình lệnh sản xuất": nút phải luôn bấm được và nêu lý do,
// khung "Bước tiếp theo" phải đúng, nhãn QR chỉ có mã linh kiện phải chọn được lô để đi tiếp.
// Chạy: node e2e/serve.js dist &   rồi   node e2e/regress-stuck.js     (BASE_URL để đổi địa chỉ)
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:8099/';
let fails = 0;
const verify = (cond, label) => { console.log(cond ? 'OK  ' : 'FAIL', label); if (!cond) fails++; };
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 400, height: 860 } });
  const page = await ctx.newPage();
  const dialogs = [];
  page.on('dialog', async (d) => { dialogs.push(d.message().replace(/\n/g, ' | ')); await d.accept(); });
  page.on('pageerror', (e) => console.log('PAGEERROR', e.message));
  const click = async (t, exact = false) => { await page.getByText(t, { exact }).filter({ visible: true }).last().click(); await page.waitForTimeout(300); };
  const has = async (t) => (await page.getByText(t).filter({ visible: true }).count()) > 0;
  const ok = async (t) => verify(await has(t), t);
  await page.goto(BASE); await page.waitForTimeout(1500);
  await click('Nguyễn Văn A'); await click('ĐĂNG NHẬP'); await page.waitForTimeout(600);

  // 1) Lệnh đang bị giữ: bấm Bắt đầu phải có phản hồi rõ ràng
  await click('WO-2428', true);
  await ok('Bước tiếp theo'); await ok('Lệnh đang bị giữ (Chờ linh kiện cấp bù)');
  await click('BẮT ĐẦU CÔNG ĐOẠN'); verify((dialogs.at(-1) || '').includes('Lệnh đang bị giữ: Chờ linh kiện cấp bù.'), 'Bắt đầu khi lệnh bị giữ: có thông báo lý do');
  await page.goBack(); await page.waitForTimeout(400);

  // 2) WO-2427: hoàn thành khi chưa bắt đầu / chưa quét -> có giải thích
  await click('WO-2427', true);
  await ok('Bấm BẮT ĐẦU CÔNG ĐOẠN để tính giờ.');
  await click('HOÀN THÀNH BƯỚC'); verify((dialogs.at(-1) || '').includes('Hãy bấm BẮT ĐẦU trước'), 'Hoàn thành khi chưa bắt đầu: có thông báo lý do');
  await click('BẮT ĐẦU CÔNG ĐOẠN');
  await ok('đã 0/2');
  await click('QUÉT LINH KIỆN'); await page.waitForTimeout(800);

  // 3) Nhãn QR chỉ ghi MPN: phải chọn được lô
  await page.getByPlaceholder('VD: ADUM4160|L2345A').fill('adum4160');
  await click('Đối soát mã đã nhập');
  await ok('LỖI ĐỐI SOÁT'); await ok('Nhãn không ghi số lô, chọn lô đang cầm trên tay');
  await click('Lô L2345A'); await ok('KHỚP BOM');
  await click('Quét tiếp');
  await page.getByPlaceholder('VD: ADUM4160|L2345A').fill('STM32F407');
  await click('Đối soát mã đã nhập'); await click('Lô L2401B'); await ok('ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN');
  await click('ĐÃ ĐỦ – QUAY LẠI CÔNG ĐOẠN'); await page.waitForTimeout(500);
  await ok('Đã đủ điều kiện. Bấm HOÀN THÀNH BƯỚC.');
  await click('HOÀN THÀNH BƯỚC'); verify((dialogs.at(-1) || '').includes('Đã hoàn thành công đoạn'), 'Hoàn thành bước thành công');
  await ok('Lắp cơ khí');
  await browser.close();
  console.log(fails === 0 ? '\nKẾT QUẢ: ĐẠT' : `\nKẾT QUẢ: TRƯỢT (${fails} kiểm tra lỗi)`);
  process.exit(fails === 0 ? 0 : 1);
})().catch((e) => { console.error('SCRIPT ERROR', e.message.split('\n').slice(0, 5).join('\n')); process.exit(1); });
