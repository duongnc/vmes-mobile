// Lớp giao tiếp máy chủ.
// Hiện dự án CHƯA có backend nên pushChanges chỉ mô phỏng độ trễ mạng.
// Khi có API thật, chỉ cần thay phần thân hàm này (VD: fetch POST /sync) –
// hàng đợi đồng bộ offline trong store không phải sửa.
import type { SyncItem } from '../store/types';

export async function pushChanges(items: SyncItem[]): Promise<{ syncedIds: string[] }> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  return { syncedIds: items.map((i) => i.id) };
}
