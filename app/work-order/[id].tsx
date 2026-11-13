import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { MarkedPhoto } from '@/components/marked-photo';
import { NcrRow, RequestCard } from '@/components/rows';
import {
  Badge,
  Banner,
  Button,
  Card,
  Chips,
  Empty,
  Field,
  Icon,
  InfoLine,
  notifyUser,
  Row,
  Screen,
  SectionTitle,
  styles as ui,
  useNow,
} from '@/components/ui';
import { C, HEALTH_TONE } from '@/constants/theme';
import { formatDate, formatDateTime, formatDuration } from '@/lib/format';
import { OVER_RATIO, WARN_RATIO, currentStep, stepElapsedSec, stepRatio, woHealth } from '@/lib/metrics';
import { findUser, useCurrentUser } from '@/store/useAuthStore';
import { useMesStore } from '@/store/useMesStore';

export default function WorkOrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const user = useCurrentUser();
  const now = useNow(1000);

  const wo = useMesStore((s) => s.workOrders.find((w) => w.id === id));
  const allNcrs = useMesStore((s) => s.ncrs);
  const allRequests = useMesStore((s) => s.partRequests);
  const startStep = useMesStore((s) => s.startStep);
  const pauseStep = useMesStore((s) => s.pauseStep);
  const completeStep = useMesStore((s) => s.completeStep);
  const requestPart = useMesStore((s) => s.requestPart);
  const setHold = useMesStore((s) => s.setHold);
  const releaseHold = useMesStore((s) => s.releaseHold);

  const [showGuide, setShowGuide] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [reqMpn, setReqMpn] = useState<string>();
  const [reqQty, setReqQty] = useState('1');
  const [reqReason, setReqReason] = useState('');
  const [reqHold, setReqHold] = useState(false);
  const [showHold, setShowHold] = useState(false);
  const [holdReason, setHoldReason] = useState('');

  if (!wo || !user) {
    return (
      <Screen>
        <Empty icon="search-off" text={`Không tìm thấy lệnh sản xuất ${id}.`} />
      </Screen>
    );
  }

  const isTech = user.role === 'technician';
  const isManager = user.role === 'manager';
  const step = currentStep(wo);
  const ncrs = allNcrs.filter((n) => n.woId === wo.id);
  const requests = allRequests.filter((r) => r.woId === wo.id);
  const health = woHealth(wo, allNcrs, allRequests, now);
  const tone = HEALTH_TONE[health.color];

  const elapsed = step ? stepElapsedSec(step, now) : 0;
  const ratio = step ? stepRatio(step, now) : 0;
  const timerColor = ratio >= OVER_RATIO ? C.red : ratio >= WARN_RATIO ? C.yellow : C.green;
  const stepBom = step ? wo.bom.filter((b) => b.stepNo === step.no) : [];
  const stepBomDone = stepBom.every((b) => b.scans.length >= b.qtyRequired);

  const act = (fn: (woId: string) => { ok: boolean; message: string }, silentOk = true) => {
    const res = fn(wo.id);
    if (!res.ok) notifyUser('Không thể thực hiện', res.message);
    else if (!silentOk) notifyUser('Thành công', res.message);
  };

  const submitRequest = () => {
    const qty = parseInt(reqQty, 10);
    if (!reqMpn) return notifyUser('Thiếu thông tin', 'Hãy chọn linh kiện cần cấp bù.');
    if (!qty || qty <= 0) return notifyUser('Thiếu thông tin', 'Số lượng phải lớn hơn 0.');
    if (!reqReason.trim()) return notifyUser('Thiếu thông tin', 'Hãy nhập lý do yêu cầu.');
    requestPart(wo.id, reqMpn, qty, reqReason.trim(), reqHold);
    setShowRequest(false);
    setReqMpn(undefined);
    setReqQty('1');
    setReqReason('');
    setReqHold(false);
    notifyUser('Đã gửi yêu cầu', 'Quản lý sản xuất đã được thông báo.');
  };

  return (
    <Screen>
      {/* Thông tin chung */}
      <Card tone={tone}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Text style={[ui.title, { fontSize: 20 }]}>{wo.id}</Text>
          <Badge label={health.label} tone={tone} />
        </Row>
        <Text style={[ui.text, { marginVertical: 4 }]}>{wo.product}</Text>
        <InfoLine label="Mã sản phẩm" value={wo.productCode} />
        <InfoLine label="Số lượng" value={wo.qty} />
        <InfoLine label="Hạn giao" value={formatDate(wo.dueDate)} />
        <InfoLine label="Ưu tiên" value={`#${wo.priority}`} />
        <InfoLine label="Phụ trách" value={findUser(wo.assigneeId)?.name ?? '—'} />
      </Card>

      {wo.hold ? (
        <>
          <Banner tone="red" icon="pan-tool" title="Lệnh đang bị giữ" text={`${wo.hold.reason} · từ ${formatDateTime(wo.hold.at)}`} />
          {isManager ? <Button label="GỠ GIỮ – CHO PHÉP TIẾP TỤC" icon="play-circle-outline" tone="green" onPress={() => releaseHold(wo.id)} /> : null}
          {user.role === 'qc' && wo.hold.type === 'fai' ? (
            <Button label="KIỂM TRA FAI" icon="fact-check" onPress={() => router.push(`/pqc/${wo.id}`)} />
          ) : null}
        </>
      ) : null}

      {/* Công đoạn hiện tại */}
      {step ? (
        <>
          <SectionTitle>Công đoạn hiện tại</SectionTitle>
          <Card>
            <Text style={ui.sub}>
              Bước {step.no}/{wo.steps.length} · Trạm {step.station}
            </Text>
            <Text style={[ui.title, { fontSize: 20, marginTop: 2 }]}>{step.name}</Text>

            <View style={{ alignItems: 'center', marginVertical: 14 }}>
              <Text accessibilityLabel="Thời gian công đoạn" style={{ fontSize: 46, fontWeight: '800', color: timerColor, fontVariant: ['tabular-nums'] }}>
                {formatDuration(elapsed)}
              </Text>
              <Text style={ui.sub}>
                Định mức {step.standardMin} phút ·{' '}
                {step.status === 'running' ? 'Đang chạy' : step.status === 'paused' ? 'Tạm dừng' : 'Chưa bắt đầu'}
              </Text>
            </View>
            {ratio >= OVER_RATIO ? (
              <Banner tone="red" icon="alarm" title="Vượt thời gian định mức" text={`Đã quá ${formatDuration(elapsed - step.standardMin * 60)} so với định mức.`} />
            ) : ratio >= WARN_RATIO ? (
              <Banner tone="yellow" icon="alarm" title="Sắp vượt định mức" text={`Còn ${formatDuration(step.standardMin * 60 - elapsed)}.`} />
            ) : null}

            {isTech ? (
              <View style={{ gap: 10, marginTop: 12 }}>
                {step.status === 'running' ? (
                  <Button label="TẠM DỪNG" icon="pause" tone="yellow" onPress={() => act(pauseStep)} />
                ) : (
                  <Button
                    label={step.status === 'paused' ? 'TIẾP TỤC' : 'BẮT ĐẦU CÔNG ĐOẠN'}
                    icon="play-arrow"
                    disabled={!!wo.hold}
                    onPress={() => act(startStep)}
                  />
                )}
                {stepBom.length > 0 ? (
                  <Button
                    label={stepBomDone ? 'ĐÃ ĐỐI SOÁT ĐỦ LINH KIỆN' : 'QUÉT LINH KIỆN'}
                    icon="qr-code-scanner"
                    variant="outline"
                    tone={stepBomDone ? 'green' : 'primary'}
                    onPress={() => router.push({ pathname: '/scanner', params: { woId: wo.id } })}
                  />
                ) : null}
                <Button
                  label="HOÀN THÀNH BƯỚC"
                  icon="check-circle"
                  tone="green"
                  disabled={!!wo.hold || step.status === 'pending'}
                  onPress={() => act(completeStep, false)}
                />
              </View>
            ) : null}

            <Button
              small
              style={{ marginTop: 12 }}
              variant="outline"
              icon={showGuide ? 'expand-less' : 'menu-book'}
              label={showGuide ? 'Ẩn hướng dẫn' : 'Xem hướng dẫn công đoạn'}
              onPress={() => setShowGuide((v) => !v)}
            />
            {showGuide ? (
              <View style={{ marginTop: 10, gap: 8 }}>
                {step.instructions.map((line, i) => (
                  <Row key={i} style={{ alignItems: 'flex-start' }}>
                    <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: C.primary, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: C.white, fontWeight: '700' }}>{i + 1}</Text>
                    </View>
                    <Text style={[ui.text, { flex: 1 }]}>{line}</Text>
                  </Row>
                ))}
                {step.cautions?.map((c) => (
                  <Banner key={c} tone="yellow" icon="warning" title="Lưu ý an toàn" text={c} />
                ))}
              </View>
            ) : null}
          </Card>
        </>
      ) : (
        <Banner
          tone="green"
          icon="verified"
          title="Lệnh sản xuất đã hoàn thành"
          text={wo.completedAt ? `Hoàn thành lúc ${formatDateTime(wo.completedAt)}` : undefined}
        />
      )}

      {/* BOM */}
      {wo.bom.length > 0 ? (
        <>
          <SectionTitle>Danh mục vật tư (BOM)</SectionTitle>
          <Card>
            {wo.bom.map((b) => {
              const full = b.scans.length >= b.qtyRequired;
              return (
                <View key={b.id} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.graySoft }}>
                  <Row>
                    <Icon name={full ? 'check-circle' : 'radio-button-unchecked'} size={22} color={full ? C.green : C.gray} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 15, fontWeight: '700', color: C.text }}>{b.mpn}</Text>
                      <Text style={ui.sub}>
                        {b.name} · Bước {b.stepNo}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: full ? C.green : C.text }}>
                      {b.scans.length}/{b.qtyRequired}
                    </Text>
                  </Row>
                  {b.scans.map((s, i) => (
                    <Text key={i} style={{ fontSize: 12, color: C.sub, marginLeft: 30, marginTop: 2 }}>
                      Lô {s.lot} · DC {s.dateCode} · {s.coc} · {s.by} · {formatDateTime(s.at)}
                    </Text>
                  ))}
                </View>
              );
            })}
          </Card>
        </>
      ) : null}

      {/* Thao tác */}
      <SectionTitle>Thao tác</SectionTitle>
      <Row>
        <Button
          small
          style={{ flex: 1 }}
          icon="photo-camera"
          variant="outline"
          label="Chụp ảnh hồ sơ"
          onPress={() => router.push({ pathname: '/camera', params: { target: wo.id } })}
        />
        <Button
          small
          style={{ flex: 1 }}
          icon="report-problem"
          tone="red"
          variant="outline"
          label="Báo lỗi (NCR)"
          onPress={() => router.push({ pathname: '/ncr/new', params: { woId: wo.id } })}
        />
      </Row>
      <Row>
        {isTech && step ? (
          <Button
            small
            style={{ flex: 1 }}
            icon="add-shopping-cart"
            tone="yellow"
            variant="outline"
            label="Yêu cầu cấp bù"
            onPress={() => setShowRequest((v) => !v)}
          />
        ) : null}
        {user.role === 'qc' && step ? (
          <Button small style={{ flex: 1 }} icon="fact-check" variant="outline" label="Kiểm tra PQC" onPress={() => router.push(`/pqc/${wo.id}`)} />
        ) : null}
        {isManager && step && !wo.hold ? (
          <Button small style={{ flex: 1 }} icon="pan-tool" tone="red" variant="outline" label="Giữ lệnh" onPress={() => setShowHold((v) => !v)} />
        ) : null}
        <Button
          small
          style={{ flex: 1 }}
          icon="manage-search"
          tone="gray"
          variant="outline"
          label="Truy xuất"
          onPress={() => router.push({ pathname: '/trace', params: { q: wo.id } })}
        />
      </Row>

      {showRequest ? (
        <Card>
          <Text style={[ui.title, { marginBottom: 10 }]}>Yêu cầu cấp bù linh kiện</Text>
          <Text style={ui.fieldLabel}>Linh kiện</Text>
          <Chips value={reqMpn} onChange={setReqMpn} options={[...new Set(wo.bom.map((b) => b.mpn))].map((m) => ({ value: m, label: m }))} />
          <View style={{ height: 12 }} />
          <Field label="Số lượng" keyboardType="number-pad" value={reqQty} onChangeText={setReqQty} />
          <Field label="Lý do" placeholder="VD: linh kiện cong chân, thiếu so với BOM…" value={reqReason} onChangeText={setReqReason} multiline />
          <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
            <Text style={[ui.text, { flex: 1 }]}>Không thể làm tiếp nếu thiếu (tạm giữ lệnh)</Text>
            <Switch accessibilityLabel="Tạm giữ lệnh" value={reqHold} onValueChange={setReqHold} />
          </Row>
          <Button label="GỬI YÊU CẦU" icon="send" tone="yellow" onPress={submitRequest} />
        </Card>
      ) : null}

      {showHold ? (
        <Card>
          <Field label="Lý do giữ lệnh" placeholder="VD: máy hỏng, chờ xác nhận khách hàng…" value={holdReason} onChangeText={setHoldReason} />
          <Button
            label="XÁC NHẬN GIỮ LỆNH"
            icon="pan-tool"
            tone="red"
            onPress={() => {
              if (!holdReason.trim()) return notifyUser('Thiếu thông tin', 'Hãy nhập lý do giữ lệnh.');
              setHold(wo.id, holdReason.trim());
              setHoldReason('');
              setShowHold(false);
            }}
          />
        </Card>
      ) : null}

      {requests.length > 0 ? <SectionTitle>Yêu cầu cấp bù</SectionTitle> : null}
      {requests.map((r) => (
        <RequestCard key={r.id} req={r} canDecide={isManager} />
      ))}

      {ncrs.length > 0 ? <SectionTitle>NCR liên quan</SectionTitle> : null}
      {ncrs.map((n) => (
        <NcrRow key={n.id} ncr={n} />
      ))}

      {/* Tiến độ công đoạn */}
      <SectionTitle>Tiến độ các công đoạn</SectionTitle>
      <Card>
        {wo.steps.map((s) => {
          const sec = stepElapsedSec(s, now);
          const over = sec > s.standardMin * 60;
          const isCurrent = s.no === step?.no;
          return (
            <Row key={s.no} style={{ paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: C.graySoft }}>
              <Icon
                name={s.status === 'done' ? 'check-circle' : isCurrent ? 'play-circle-filled' : 'radio-button-unchecked'}
                size={22}
                color={s.status === 'done' ? C.green : isCurrent ? C.primary : C.gray}
              />
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 15, fontWeight: isCurrent ? '800' : '600', color: C.text }}>
                  {s.no}. {s.name}
                </Text>
                <Text style={ui.sub}>
                  {s.station}
                  {s.operatorId ? ` · ${findUser(s.operatorId)?.name}` : ''}
                </Text>
              </View>
              <Text style={{ fontSize: 13, fontWeight: '700', color: over ? C.red : C.sub, fontVariant: ['tabular-nums'] }}>
                {s.status === 'pending' ? `${s.standardMin}′` : `${formatDuration(sec)} / ${s.standardMin}′`}
              </Text>
            </Row>
          );
        })}
      </Card>

      {/* Ảnh hồ sơ */}
      <SectionTitle>Ảnh hồ sơ sản xuất ({wo.photos.length})</SectionTitle>
      {wo.photos.length === 0 ? (
        <Text style={ui.sub}>Chưa có ảnh nào. Dùng nút “Chụp ảnh hồ sơ” để lưu ảnh bán thành phẩm.</Text>
      ) : (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
          {wo.photos.map((p) => (
            <View key={p.id} style={{ width: '47%' }}>
              <MarkedPhoto uri={p.uri} marks={p.marks} />
              <Text style={{ fontSize: 12, color: C.sub, marginTop: 4 }} numberOfLines={2}>
                {p.note ? `${p.note} · ` : ''}
                {p.by} · {formatDateTime(p.takenAt)}
              </Text>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}
