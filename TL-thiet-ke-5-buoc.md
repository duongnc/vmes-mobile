**TÀI LIỆU ĐẶC TẢ YÊU CẦU PHẦN MỀM**

*Software Requirements Specification (SRS)*

*(Thực hiện theo quy trình 5 bước Design Thinking)*

**Tên dự án:** Hệ thống Điều hành sản xuất điện tử hàng không thông minh vMES

**Phiên bản:** 1.0

**Ngày phát hành:** 12/06/2026

**Người dùng cuối:** VTX

**Đơn vị thực hiện:** VTX

# Pha đồng cảm. Tạo bộ câu hỏi phỏng vấn

**Nhóm 1: Thu thập thông tin về Luồng công việc & Thói quen hiện tại**

1. Với vai trò là một kỹ thuật viên trên dây chuyền lắp ráp Anh/chị có thể kể lại chi tiết quá trình lắp ráp và đối soát một module điện tử trong ca làm việc hôm qua diễn ra như thế nào không?

**Bước 1 – Nhận BOM và linh kiện từ kho (8h00)**

1. Sau khi quẹt thẻ RFID vào trạm, tôi nhận được tập giấy hướng dẫn công việc trong đó có danh mục vật tư BOM (1 trang A4) và một khay linh kiện.
2. Phải tự đối chiếu tay: so mã MPN trên túi linh kiện với dòng trong BOM để biết cần hàn vào vị trí nào.
3. **Khó khăn:** Có con chip U4 (MPN: ADUM4160) ghi trên túi là ADUM4160‑1, tôi phải mất 5 phút để hỏi kỹ sư QA đi qua xác nhận đó là hàng tương đương.

**Bước 2 – Lắp ráp thực tế (8h30 – 10h00)**

1. Hàn tay các linh kiện SMD. Kiểm tra mối hàn bằng mắt.
2. **Sự cố:** Trong lúc gắn jumper J5, tôi làm rơi con vít M2. Tôi phải dừng dây chuyền, bò xuống sàn tìm – mất 10 phút. Sau đó tôi ghi tay vào phiếu “phát sinh thêm 1 vít” (vì không có quy trình chính thức để báo xin thêm).

**Bước 3 – Kiểm soát công đoạn tại chỗ (10h00 – 10h30)**

* Dừng lắp ráp để điền tay “Phiếu kiểm tra công đoạn”.
* Ghi tay: số serial từng linh kiện chính (STM32F407, MAX31855, …) vào một cuốn sổ.
* Lúc này, tổ trưởng đến giục vì phía sau đang chờ bo mạch. Tôi phải “làm nhanh” bằng cách chỉ ghi 3 linh kiện quan trọng, bỏ qua các điện trở, tụ, hoàn thiện biên bản sau, đây là hiện tượng cook biên bản. **Sau này nếu lỗi, sẽ không truy được hết nguyên nhân.**

**Bước 4 – Kiểm tra chức năng (10h30 – 11h45)**

* Đưa bo mạch lên test jig. Thiết bị báo lỗi kênh A (điện áp ra 3,3V thay vì 5V).
* Tôi phải dùng đồng hồ kiểm tra từng chân IC. Phát hiện chân 12 của U3 bị khô mối hàn.
* **Mất 30 phút để hàn lại và kiểm tra lại.**

**Bước 5 – Báo cáo cuối ca và bàn giao (13h00 – 14h00)**

* Ghi tay toàn bộ thời gian, lỗi, linh kiện thay thế vào “Nhật ký ca” (file Excel trên máy tính cũ).
* Upload ảnh lỗi (chụp bằng điện thoại riêng) vào mạng dùng chung.
* **Kết thúc ca:** chỉ hoàn thành được 1 module thay vì 3 module như kế hoạch – vì mất thời gian cho giấy tờ và xử lý lỗi không hệ thống.

**2.** Hiện tại, khi nhận một định mức vật tư (BOM) mới, anh/chị làm cách nào để đảm bảo mình nhặt đúng linh kiện và mã MPN? Công đoạn nào trong quá trình này khiến anh/chị cảm thấy cồng kềnh hoặc dễ sai sót nhất?

1. **Đối chiếu MPN/Viettel Code từ BOM giấy với nhãn dán trên túi linh kiện.**
2. **Kiểm tra hình dáng bên ngoài:** so với ảnh trong “hướng dẫn công việc” (in màu, để bàn).
3. **Đo nhanh bằng đồng hồ vạn năng** với các điện trở, tụ – để chắc chắn không nhầm giá trị.
4. **Nhờ QA kiểm tra chéo** nếu linh kiện quan trọng (như vi điều khiển, IC nguồn).

**Công đoạn cồng kềnh và dễ sai sót nhất:**
**Bước đối chiếu MPN/Viettel code giữa BOM (dạng PDF in giấy) và nhãn linh kiện (in trên túi nhựa).**

1. **Lý do:**
   1. MPN in trên BOM đôi khi viết tắt, thiếu ký tự (ví dụ: STM32F407VET6 → BOM ghi STM32F407).
   2. Nhãn linh kiện bị mờ, rách, hoặc dán đè lên vùng che khuất chữ.
   3. Phải bỏ linh kiện ra khỏi túi để xem mã trên thân chip – dễ làm rơi, hỏng tĩnh điện.
2. **Hậu quả tôi từng thấy:**
   Tháng trước, một anh đồng nghiệp nhặt nhầm tụ 10uF/16V thay vì 10uF/25V (vì cùng kích thước). Lỗi chỉ phát hiện sau khi chạy nhiệt độ cao – làm cháy 5 module, phải báo NCR, trừ lương cả tổ.

**=> Cần công cụ hỗ trợ quét mã và xác nhận linh kiện so với BOM**

**3.** Hãy kể lại một lần quy trình đối soát hoặc ghi nhận tiến độ hiện tại làm anh/chị bị chậm nhịp sản xuất. Lúc đó anh/chị đã phải dùng "mẹo" (workaround) nào để xử lý nhanh tình huống?

**Nhóm 2: Tương tác Vật lý & Môi trường Xưởng**

**4.** Trong điều kiện làm việc thực tế tại xưởng (phải mặc đồ bảo hộ, đeo găng tay chống tĩnh điện, ánh sáng gắt hoặc ồn ào), những yếu tố nào đang cản trở anh/chị thao tác với các thiết bị/giấy tờ hiện tại?

**5.** Nếu phải sử dụng một chiếc điện thoại di động cầm tay để liên tục quét mã QR cho từng linh kiện suốt 8 tiếng, anh/chị có những lo ngại cụ thể gì về thao tác vật lý (ví dụ: góc quét, vướng víu, mỏi tay, nguy cơ rơi vỡ)?

**Nhóm 3: Xử lý Ngoại lệ & Áp lực Tâm lý (Internal Psychology)**

**6.** Khi đang lắp ráp mà phát hiện linh kiện bị cong chân hoặc hỏng (cần scrap và cấp bù), anh/chị phải trải qua những bước giải trình nào? Cảm xúc của anh/chị khi phải làm các thủ tục đó là gì?

**7.** Trong những dự án bị ép tiến độ, áp lực phải vừa hoàn thành nhanh vừa phải ghi nhận chính xác hồ sơ truy vết (Traceability) ảnh hưởng đến trạng thái "dòng chảy" (flow) tập trung công việc của anh/chị như thế nào?

Lặp lại một số câu hỏi với vai trò QC/QA:

**1. Kể lại chi tiết quá trình kiểm soát chất lượng khâu lắp ráp một module điện tử trong ca làm việc hôm qua (góc nhìn QA)**

*“Hôm qua, ca sáng tôi phụ trách giám sát chất lượng cho dây chuyền lắp module nguồn****PSU‑2405****– lô 50 cái. Công việc của tôi không phải làm ra sản phẩm, mà là kiểm tra, xác nhận và xử lý các vấn đề phát sinh.”*

**08:00 – Kiểm tra đầu ca**

* Tôi kiểm tra tình trạng hiệu chuẩn của các thiết bị đo trên trạm (máy hiện sóng, nguồn DC, cân điện tử). Phát hiện cân của trạm hàn tay hết hạn hiệu chuẩn từ hôm qua nhưng chưa ai báo. Tôi lập tức **dán thẻ đỏ, thu hồi cân**, yêu cầu thay cân dự phòng. Việc này mất 20 phút, làm chậm khởi động.

**09:30 – Kiểm tra linh kiện đầu vào (IQC) cho lô**

* Kho chuyển linh kiện lên. Tôi chọn ngẫu nhiên 5 túi linh kiện (mỗi loại) để kiểm tra đối chiếu MPN, lot number, COC (chứng chỉ xuất xứ).
* **Phát hiện lỗi:** Một túi tụ tantalum ghi sai date code (ghi 2023 nhưng thực tế 2021). Tôi từ chối nhập, yêu cầu kho đổi lô khác. Chậm 30 phút.

**10:30 – Giám sát kiểm tra quá trình (PQC)**

* Công nhân bắt đầu lắp. Tôi đi quan sát, chụp ảnh một số mối hàn nghi ngờ.
* **Sự cố:** Một module sau khi hàn sóng bị cầu solder giữa 2 chân IC. Công nhân tự phát hiện và định dùng que tre để gạt (làm sai quy trình). Tôi can thiệp, yêu cầu dùng máy hút thiếc chuyên dụng. Ghi nhận lỗi vào sổ.

**11:45 – Kiểm tra lần cuối (OQC) cho 10 module đầu**

* Chạy test chức năng. Kết quả 10 module đều PASS. Tôi ký xác nhận vào “Phiếu nghiệm thu lô”.

**13:00 – Xử lý một trường hợp đầu ra không phù hợp NCR (Non-compliance report) từ ca trước**

* Hôm trước có một module bị lỗi rỉ sét chân cắm. Tôi phải họp với sản xuất để xác định nguyên nhân (nguyên nhân được xác định do bảo quản ẩm). Đề xuất cải tiến quy trình lưu khó, đóng gói.

Lặp lại bước trên với vai trò quản lý xưởng

**1. Hiện tại, làm thế nào để biết chính xác một Work Order đang chạy đến công đoạn nào, bị tắc ở bước nào mà không cần đi bộ xuống tận nơi?**

*“Thú thực, tôi vẫn phải đi bộ. Hoặc nhắn tin qua điện thoại cho tổ trưởng.”*

Hiện tại, chúng tôi **không có hệ thống hiển thị trạng thái theo thời gian thực** (real-time dashboard). Cách tôi làm:

* **Bảng trắng** treo ở cuối xưởng: tổ trưởng mỗi giờ ghi tay số lượng đã qua từng trạm. Tôi phải đi ra cuối xưởng để xem – mỗi lần mất 5-10 phút, mỗi ngày 6-8 lần.
* **Tin nhắn Zalo / nhóm chat nội bộ:** Công nhân hoặc tổ trưởng nhắn “Trạm SMT xong lô A, đang gửi sang trạm AOI”. Nhưng tin nhắn rải rác, không có cấu trúc, dễ bị trôi. Khi có 10 lô cùng lúc, tôi không thể theo dõi hết.
* **Gọi điện trực tiếp:** Nếu cần gấp, tôi gọi cho tổ trưởng từng trạm. Nhưng họ đang bận làm hoặc đang xử lý vấn đề

**Hậu quả:**

* Có lần lô hàng bị kẹt ở trạm test do máy bị lỗi, tôi chỉ biết sau 2 giờ khi tổ trưởng báo cáo cuối ca. Chậm mất 2h để xử lý và 1 ngày tiến độ đầu ra.
* Không thể biết trước bottleneck sắp xảy ra, chỉ biết khi nó đã xảy ra.

**=> Tôi cần một màn hình lớn (TV dashboard) tại văn phòng** hiển thị trạng thái từng WO: công đoạn hiện tại, số lượng hoàn thành, thời gian dừng. Nếu có thể, màu xanh/vàng/đỏ để biết lô nào đang trôi chảy, lô nào đang bị ứ.

**2. Khi có sự cố bất ngờ (thiếu linh kiện, máy SMT lỗi), thông tin cảnh báo mất bao lâu đến tôi? Quy trình ra quyết định thế nào?**

**Luồng thông tin hiện tại**

|  |  |  |  |
| --- | --- | --- | --- |
| **Sự cố** | **Người phát hiện đầu tiên** | **Thông báo cho ai?** | **Thời gian đến tôi** |
| Máy SMT báo lỗi | Công nhân vận hành | Tổ trưởng trạm → gọi điện cho tôi | 5-10 phút |
| Thiếu linh kiện | Công nhân nhặt linh kiện | Thủ kho → tổ trưởng → tôi | 15-20 phút (vì phải xác nhận kho có hàng không) |
| Test bị fail hàng loạt | QA trên trạm | Tôi (QA báo trực tiếp) | 2-3 phút (nhanh nhất) |

Quy trình ra quyết định hiện tại:

1. **Tôi nhận được tin** (qua điện thoại hoặc tin nhắn).
2. **Tôi xuống tận nơi** để xem tình hình thực tế – mất 5-10 phút di chuyển.
3. **Họp tại chỗ** với tổ trưởng, QA, kỹ thuật xí nghiệp.
4. **Quyết định điều phối:**
   * Nếu thiếu linh kiện: gọi thủ kho, kiểm tra tồn kho khác, nếu không có thì báo kế hoạch dời lô.
   * Nếu máy hỏng: gọi kỹ thuật bảo trì. Thời gian sửa từ 30 phút đến 2 giờ.
   * Nếu test fail nhiều: dừng lô, chuyển sang phân tích lỗi (NCR).

3. **Theo đánh giá của anh, "nút thắt cổ chai" thường xuyên nhất nằm ở công đoạn nào? Dùng chỉ số/dấu hiệu gì để phát hiện?**

Phân loại:

|  |  |  |  |
| --- | --- | --- | --- |
| Hạng | Công đoạn | Lý do | Dấu hiệu nhận biết hiện tại |
| **1** | Test chức năng (Functional Test) | Mỗi module test mất 5-10 phút. Máy test chỉ có 1 trạm. Hàng ứ đọng trước test. | Số lượng tồn trước trạm test cao dần; công nhân test phải tăng ca. |
| **2** | Lắp ráp thủ công (Manual Assembly) | Các bước hàn, gắn dây cáp không thể tự động hóa, phụ thuộc tay nghề. | Công nhân báo “tay bị mỏi”, năng suất giảm vào cuối ca. |
| **3** | AOI (Kiểm tra quang học tự động) | Máy AOI báo lỗi giả (false positive) nhiều, phải QA xác nhận từng cái. | Hàng chờ trước AOI xếp hàng dài, QA chạy qua lại. |
| **4** | SMT (Gắn linh kiện tự động) | Ít khi bottleneck vì máy rất nhanh, nhưng khi thay đổi linh kiện (set-up) thì rất lâu. | Khi có lô nhỏ, thời gian set-up gần bằng thời gian chạy. |

**Chỉ số tôi dùng để phát hiện (dù thủ công)**

1. **Số lượng “work‑in‑process” (WIP) trước mỗi trạm** – tôi ước lượng bằng mắt khi đi qua, hoặc nhờ tổ trưởng ghi số.
2. **Thời gian chờ (queue time)** – công nhân báo “em đợi test từ 20 phút rồi”.
3. **Tỷ lệ sử dụng máy (utilization)** – với SMT, tôi biết máy chạy liên tục hay bị dừng chờ linh kiện.
4. **Khiếu nại của công nhân** – “Trạm test chậm quá, bọn em không có việc làm” – dấu hiệu rõ nhất.

**=> Tôi cần một hệ thống tự động ghi nhận số lượng WIP tại mỗi trạm, và tính thời gian chờ trung bình. Nếu thời gian chờ vượt ngưỡng (ví dụ >15 phút), hệ thống tự động cảnh báo bottleneck. Như thế tôi không phải đi bộ hoặc hỏi tổ trưởng mỗi giờ.**

# Pha xác định vấn đề

Từ các câu hỏi và câu trả lời khảo sát được, chỉnh sửa và finalize thành bảng POV.

Bảng Point of View statement (POV)

|  |  |  |  |
| --- | --- | --- | --- |
|  | POV 1: Nhóm kỹ thuật viên | POV 2: Nhóm quản lý chất lượng | POV 3: Nhóm quản lý xưởng và quản lý công ty |
| User | Kỹ thuật viên thao tác trực tiếp trên line, luôn bị áp lực về năng suất lắp ráp | Kỹ sư quản lý chất lượng gặp áp lực về trách nhiệm khi sản phẩm gặp vấn đề về chất lượng; không được để line dừng quá lâu mà không có lý do hay đưa ra được cảnh báo, giải pháp phù hợp. | Quản đốc phân xưởng luôn bị áp lực về kế hoạch sản xuất và OEE |
| Need | 1. Cần công cụ quét mã tự động trên line để đối soát vật tư  2, Cần công cụ chụp ảnh bán thành phẩm (mạch in, cáp,…) sau khi lắp ráp. Ảnh lưu tự động vào hồ sơ sản xuất của bán thành phẩm.  3. Thiết bị chụp ảnh và quét mã được gắn cố định, phần mềm kết nối tự động với hệ thống để thông báo chuyển công đoạn và chuyển sang pha QC check  4. Cần công cụ đo tự động xuất biên bản đo để không phải điền tay | 1. Máy test tự động xuất ra file kết qua pass/failed hoặc kết nối trực tiếp với hệ thống MES, không qua giấy.  2. App trên tablet cho phép tôi quét QR module, chạm để chấp nhận pass, hoặc chụp ảnh lỗi và tạo NCR ngay tại chỗ.  3. Cảnh báo realtime nếu có linh kiện hết hạn, thiết bị hết hiệu chuẩn, hoặc BOM không khớp. | **1. một màn hình lớn (TV dashboard) tại văn phòng** hiển thị trạng thái từng WO: công đoạn hiện tại, số lượng hoàn thành, thời gian dừng. Nếu có thể, màu xanh/vàng/đỏ để biết lô nào đang trôi chảy, lô nào đang bị ứ.  2.Hệ thống cảnh báo tự động có vấn đề:  - máy hàn SMT lỗi → tự động gửi thông báo đến điện thoại tôi và kỹ thuật trực, kèm mã lỗi.  Khi tồn kho linh kiện cho một WO (work-order) xuống dưới ngưỡng → căn cứ vào kế hoạch sản xuất đã được giao trong tuần, cảnh báo trước 1 tuần đến quản lý xưởng và bộ phận mua sắm.  Phân quyền: tổ trưởng được phép tạm dừng lô, chuyển lô khác lên trước trong một số tình huống định sẵn.  3. Một hệ thống tự động ghi nhận số lượng công đoạn chờ (Work-in-process) tại mỗi trạm, và tính thời gian chờ trung bình. Nếu thời gian chờ vượt ngưỡng (ví dụ >15 phút), hệ thống tự động cảnh báo bottleneck. Như thế tôi không phải đi bộ hoặc hỏi tổ trưởng mỗi giờ |
| Insight | 1. Để tăng tốc lắp ráp đo kiểm bán thành phẩm  Thiết bị di động (điện thoại, table) được gắn trên line  2. Để kỹ thuật viên không bị mỏi tay khi thao tác liên tục. | Để truy xuất được lịch sử lỗi, thống kê và phân loại các lỗi | Người quản lý cần Một hệ thống thể hiện thời gian thực một cách tinh gọn và trọng tâm, trọng điểm các thông số phục vụ quản trị cũng như cảnh báo kịp thời các vấn đề |
| Yêu cầu sản phẩm | Phần mềm Hiển thị danh sách công việc, công đoạn cần hoàn thành tại vị trí làm việc; BOM vật tư gắn với công đoạn  Phần mềm trên thiết bị di động, thiết bị được gắn tại vị trí lắp ráp cho phép: Quét mã linh kiện, chụp ảnh bán thành phẩm hoàn thành, tick chuyển công đoạn kiểm tra chất lượng | Tự động lưu file kết quả test từ máy đo  Quét mã linh kiện  Chụp ảnh linh kiện và sản phẩm nghi ngờ lỗi | Dashboard hiển thị trên màn hình lớn tại văn phòng làm việc các thông tin: Kế hoạch sản xuất (tháng, tuần, ngày); Tiến độ sản xuất thực tế; Vấn đề trên các line; Thống kê các chỉ số quản trị |

# Pha lên ý tưởng sản phẩm

Dựa trên các câu chuyện và nhu cầu đã thu thập từ **Kỹ thuật viên, QA, Quản lý**, tôi đề xuất một giải pháp phần mềm di động (có thể chạy trên điện thoại hoặc tablet) với **một ứng dụng duy nhất, nhưng trải nghiệm và chức năng khác nhau tùy theo vai trò đăng nhập**.

**Nguyên tắc thiết kế cốt lõi**

|  |  |
| --- | --- |
| Nguyên tắc | Giải thích |
| **Tối giản thao tác vật lý** | Hỗ trợ thao tác bằng giọng nói, nút bấm to, quét mã tự động, giảm thao tác gõ tay. |
| **Không dùng giấy** | Mọi biên bản, BOM, phiếu kiểm tra, NCR đều số hóa, đồng bộ realtime. |
| **Hoạt động offline** | Xưởng có thể mất mạng, dữ liệu được lưu local và đồng bộ sau. |
| **Cảnh báo thông minh** | Chủ động đẩy thông báo, không để người dùng phải đi hỏi. |
| **Phân quyền theo vai trò** | Mỗi người chỉ thấy và làm được việc của mình. |

## Các vai trò và màn hình chính

### Kỹ thuật viên (Công nhân lắp ráp / test)

**Nhu cầu chính (đã thu thập):**

* Xem nhanh lệnh sản xuất được giao, công đoạn hiện tại.
* Xác nhận hoàn thành bước lắp ráp.
* Nhập kết quả đo kiểm (có so sánh pass/fail) hoặc lựa chọn máy đo để thực hiện đo kiểm
* Báo lỗi / yêu cầu thêm linh kiện (Request Extra Part).
* Không bị gián đoạn bởi giấy tờ.

Giao diện đề xuất (text = deepseek) & tạo ảnh giao diện bằng Gemini

![](data:image/png;base64...)

![](data:image/png;base64...)

Tính năng dành cho kỹ thuật viên:

1. Quét mã QR bằng camera điện thoại (có đế cố định) – không cần cầm máy, chỉ đưa linh kiện đến vùng quét.
2. Tạo yêu cầu "Request Extra Part" bằng một nút to, kèm lý do (chọn từ danh sách: rơi vít, hỏng linh kiện, sai mã).
3. Hướng dẫn công đoạn dạng video/ảnh – xem ngay trên màn hình.
4. Đếm giờ tự động cho từng bước – nếu quá định mức, tự động gợi ý báo quản lý.

# Nhân viên QC (Quality Control)

##### **Nhu cầu chính:**

* Kiểm tra linh kiện đầu vào (IQC) bằng cách quét mã, đối chiếu BOM và COC.
* Kiểm tra quá trình (PQC) – chụp ảnh lỗi, ghi nhận không phù hợp.
* Tạo NCR (Non-Conformance Report) nhanh, gán người xử lý.
* Xem lại lịch sử lỗi của sản phẩm / lô.

Giao diện đề xuất

![](data:image/png;base64...)

##### Tính năng phần mềm dành cho QC:

* **So sánh tự động** MPN, date code, hạn sử dụng với BOM và COC đã được số hóa.
* **Tạo NCR nhanh** – chỉ cần nhập lý do, chọn mức độ (Minor/Major/Critical), hệ thống tự động gán số NCR và thông báo đến quản lý.
* **Lưu ảnh lỗi kèm theo NCR** – có thể vẽ khoanh vùng lỗi trên ảnh (dùng thư viện vẽ tay).
* **Xem lịch sử truy xuất** của một sản phẩm (các lần test, lỗi trước đó) – để đánh giá có nên cho sửa hay loại bỏ.

## Quản lý sản xuất

### Nhu cầu chính:

1. Dashboard tổng quan tiến độ các Work Order.
2. Nhận cảnh báo sự cố (thiếu linh kiện, máy hỏng, bottleneck).
3. Xem số liệu OEE, năng suất từng trạm.
4. Điều phối lô hàng ưu tiên, thay đổi kế hoạch.

#### Giao diện đề xuất

![](data:image/png;base64...)

### Tính năng dành riêng

# Bản đồ màu cho các trạm: màu xanh (trôi chảy), vàng (sắp tắc), đỏ (tắc).

# Chức năng "điều phối nhanh" : kéo thả thứ tự ưu tiên của các lô hàng trên màn hình, hệ thống tự động cập nhật cho tổ trưởng và công nhân.

# Báo cáo tự động (có thể xuất PDF) về năng suất, lỗi, thời gian dừng máy – gửi qua email đúng lịch.

# Nhận cảnh báo đẩy (push notification) khi có sự cố nghiêm trọng (ví dụ: NCR critical, máy SMT dừng >30 phút).

## Các tính năng chung

|  |  |  |
| --- | --- | --- |
| **Tính năng** | **Mô tả** | **Lợi ích** |
| **Quét mã QR / DataMatrix** | Tích hợp camera, có đế cố định hoặc chế độ "quét liên tục" (không cần bấm nút). | Giảm thao tác tay, tránh rơi máy. |
| **Hoạt động offline** | Dùng SQLite local, đồng bộ khi có mạng. | Xưởng mất mạng wifi hoặc lỗi mạng lan vẫn hoạt động. |
| **Giao diện nút bấm to** | Nút "Hoàn thành", "Pass/Fail" chiếm 1/3 màn hình, dễ bấm khi đeo găng tay. | Tăng tốc độ, giảm bấm nhầm. |
| **Hỗ trợ giọng nói** | Có thể nói "Xác nhận hoàn thành" thay vì bấm nút (khi tay bận). | Tiện lợi cho lắp ráp phức tạp. |
| **Thông báo đẩy (push)** | Gửi cảnh báo đến đúng người (công nhân được giao việc, QA có NCR chờ, quản lý khi có bottleneck). | Giảm thời gian chờ đợi, phản ứng nhanh. |

# Pha Tạo mẫu thử

## Kiến trúc tổng quan

![](data:image/png;base64...)

## Kịch bản sử dụng: cả 3 vai trò phối hợp

* **Kỹ thuật viên** quét QR linh kiện, xác nhận hoàn thành lắp ráp → hệ thống tự động ghi nhận, cập nhật tiến độ.
* Tại bước test, kỹ thuật viên nhập giá trị đo → **hệ thống so sánh ngưỡng, phát hiện FAIL**.
* Hệ thống **tự động mở form tạo NCR** cho QA. Kỹ thuật viên chỉ cần chọn lý do (từ danh sách) và chụp ảnh lỗi.
* **QA** nhận thông báo trên mobile, xem NCR mới, phê duyệt và gán cho người xử lý (rework hoặc scrap).
* **Quản lý** thấy trên dashboard có NCR critical, ra lệnh ưu tiên xử lý, điều phối nhân sự.
* Sau khi rework xong, kỹ thuật viên quét lại sản phẩm, chạy test → PASS. Hệ thống tự động đóng NCR và cập nhật tiến độ.

## Lộ trình phát triển (ưu tiên demo cho tính năng mobile app)

1. **Tuần 1-2:** Xây dựng mobile app cho kỹ thuật viên (xem danh sách WO, hoàn thành bước, quét QR, tạo NCR).
2. **Tuần 2-3:** Xây dựng backend API (Node.js + PostgreSQL) cho quản lý Work Order, Routing, User, Auth.
3. **Tuần 3-4:** Thêm vai trò QA (duyệt NCR, kiểm tra linh kiện) và Quản lý (dashboard cơ bản).
4. **Tuần 4:** Tích hợp offline (WatermelonDB), push notification, và tối ưu UI cho găng tay.