import "reflect-metadata";
import { AppDataSource } from "./data-source";
import { Article, ArticleStatus } from "./entities/article.entity";
import { ArticleCategory } from "./entities/article-category.entity";
import { User } from "./entities/user.entity";

const slugify = (text: string): string => {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
};

// High-quality images from Unsplash
const IMAGES = {
  airConditioner: "https://images.unsplash.com/photo-1631545806609-45113a9aaf9c?w=1200",
  technician: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=1200",
  livingRoom: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=1200",
  maintenance: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=1200",
  summer: "https://images.unsplash.com/photo-1473496169904-658ba7c44d8a?w=1200",
  energy: "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?w=1200",
  home: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200",
  office: "https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200",
  bedroom: "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200",
  inverter: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?w=1200",
};

const ARTICLES_DATA = [
  {
    title: "Hướng dẫn chọn điều hòa phù hợp cho phòng ngủ năm 2024",
    excerpt: "Tìm hiểu cách lựa chọn điều hòa không khí phù hợp nhất cho phòng ngủ, từ công suất, tính năng đến thương hiệu uy tín nhất hiện nay.",
    featuredImage: IMAGES.bedroom,
    readingTime: 8,
    isFeatured: true,
    content: `# Hướng dẫn chọn điều hòa phù hợp cho phòng ngủ năm 2024

Việc chọn một chiếc điều hòa phù hợp cho phòng ngủ không chỉ đơn giản là chọn công suất BTU. Bài viết này sẽ hướng dẫn bạn chi tiết từ A-Z.

![Phòng ngủ hiện đại với điều hòa](${IMAGES.bedroom})

## 1. Tính toán công suất BTU cần thiết

### Công thức tính BTU cơ bản

Công suất BTU phù hợp được tính theo công thức:

\`\`\`
BTU = Diện tích (m²) × 600-700 BTU
\`\`\`

**Ví dụ cụ thể:**
- Phòng 10m²: 6,000 - 7,000 BTU (khoảng 1HP)
- Phòng 15m²: 9,000 - 10,500 BTU (khoảng 1.5HP)
- Phòng 20m²: 12,000 - 14,000 BTU (khoảng 1.5-2HP)
- Phòng 25m²: 15,000 - 17,500 BTU (khoảng 2HP)

### Các yếu tố điều chỉnh

| Yếu tố | Điều chỉnh |
|--------|------------|
| Tầng cao nhất/áp mái | +20% BTU |
| Nhiều cửa kính | +15% BTU |
| Hướng Tây | +10% BTU |
| Nhiều người ở | +600 BTU/người |

![Kỹ thuật viên đang lắp đặt điều hòa](${IMAGES.technician})

## 2. Chọn loại điều hòa

### Điều hòa Inverter vs Non-Inverter

**Điều hòa Inverter:**
- ✅ Tiết kiệm điện 30-50%
- ✅ Vận hành êm ái
- ✅ Làm lạnh nhanh và đều
- ✅ Bền bỉ hơn
- ❌ Giá thành cao hơn

**Điều hòa Non-Inverter:**
- ✅ Giá thành rẻ hơn
- ✅ Dễ sửa chữa
- ❌ Tốn điện hơn
- ❌ Ồn hơn

> 💡 **Khuyến nghị:** Với phòng ngủ, nên chọn điều hòa Inverter để có giấc ngủ thoải mái và tiết kiệm điện về lâu dài.

## 3. Các tính năng quan trọng cho phòng ngủ

### Chế độ ngủ (Sleep Mode)
Tự động điều chỉnh nhiệt độ tăng dần 1-2°C mỗi giờ, giúp bạn ngủ ngon mà không bị lạnh.

### Lọc không khí
- **Màng lọc bụi mịn PM2.5:** Loại bỏ bụi siêu nhỏ
- **Công nghệ Ion âm:** Khử khuẩn, khử mùi
- **Màng lọc HEPA:** Lọc 99.97% hạt bụi

### Độ ồn thấp
Chọn điều hòa có độ ồn dưới 25dB để không ảnh hưởng giấc ngủ.

![Điều hòa trong phòng khách hiện đại](${IMAGES.livingRoom})

## 4. Top 5 điều hòa phòng ngủ tốt nhất 2024

### 1. Daikin FTKZ25VVMV (1HP)
- Công nghệ Inverter
- Làm lạnh nhanh chỉ 0.5°C/phút
- Độ ồn chỉ 19dB
- **Giá:** 10-12 triệu đồng

### 2. Panasonic CU/CS-YZ9WKH-8 (1HP)
- Nanoe™ X lọc bụi mịn
- Econavi tiết kiệm điện
- Chế độ ngủ thông minh
- **Giá:** 9-11 triệu đồng

### 3. LG V10WIN1 (1HP)
- Dual Inverter tiết kiệm 70%
- ThinQ AI điều khiển bằng giọng nói
- Plasmaster Ionizer++
- **Giá:** 8-10 triệu đồng

### 4. Samsung AR10TYGCDWKNSV (1HP)
- WindFree™ làm mát không gió
- AI Auto Cooling
- Tự vệ sinh 3 bước
- **Giá:** 8-9 triệu đồng

### 5. Toshiba RAS-H10E2KCVG-V (1HP)
- Hi-Power làm lạnh nhanh
- Magic Coil tự vệ sinh
- Giá tốt nhất phân khúc
- **Giá:** 7-8 triệu đồng

## 5. Lời khuyên khi mua và lắp đặt

### Vị trí lắp đặt
- Cách giường ít nhất 2m
- Không đối diện trực tiếp với giường
- Cách trần ít nhất 10cm
- Tránh ánh nắng trực tiếp

### Lưu ý quan trọng
1. **Mua hàng chính hãng** với hóa đơn VAT
2. **Bảo hành ít nhất 2 năm** máy nén
3. **Yêu cầu lắp đặt chuẩn** từ thợ có chứng chỉ
4. **Vệ sinh định kỳ** 3-6 tháng/lần

---

*Nếu bạn cần tư vấn thêm, hãy liên hệ hotline của chúng tôi hoặc đến trực tiếp showroom để được hỗ trợ tốt nhất!*
`,
  },
  {
    title: "7 sai lầm phổ biến khi sử dụng điều hòa gây tốn điện và hại sức khỏe",
    excerpt: "Nhiều người vô tình mắc phải những sai lầm khi sử dụng điều hòa, vừa tốn điện vừa ảnh hưởng sức khỏe. Hãy tránh ngay 7 sai lầm này!",
    featuredImage: IMAGES.energy,
    readingTime: 6,
    isFeatured: true,
    content: `# 7 sai lầm phổ biến khi sử dụng điều hòa gây tốn điện và hại sức khỏe

Điều hòa không khí là thiết bị không thể thiếu trong mùa hè, nhưng sử dụng sai cách có thể khiến hóa đơn tiền điện tăng vọt và ảnh hưởng đến sức khỏe.

![Điều hòa và tiết kiệm năng lượng](${IMAGES.energy})

## Sai lầm 1: Bật điều hòa ở nhiệt độ quá thấp

### Vấn đề
Nhiều người thường đặt nhiệt độ 16-18°C với suy nghĩ sẽ mát nhanh hơn.

### Hậu quả
- Máy nén hoạt động liên tục, tốn điện gấp đôi
- Dễ bị sốc nhiệt khi ra ngoài
- Gây khô da, khô họng
- Tăng nguy cơ viêm họng, cảm cúm

### Giải pháp
> 🌡️ Đặt nhiệt độ **24-26°C** - chênh lệch với bên ngoài không quá 7°C

## Sai lầm 2: Bật/tắt điều hòa liên tục

### Vấn đề
Tắt điều hòa khi ra khỏi phòng 15-30 phút, bật lại khi vào.

### Hậu quả
- Máy nén phải khởi động lại, tiêu thụ điện năng lớn nhất lúc này
- Giảm tuổi thọ máy nén
- Điện năng tiêu thụ tăng 30-40%

### Giải pháp
- Ra khỏi phòng **dưới 1 giờ**: Để điều hòa chạy
- Ra khỏi phòng **trên 1 giờ**: Tắt điều hòa

![Bảo trì điều hòa định kỳ](${IMAGES.maintenance})

## Sai lầm 3: Không vệ sinh lưới lọc định kỳ

### Vấn đề
Bỏ qua việc vệ sinh lưới lọc trong thời gian dài.

### Hậu quả
- Giảm 20-30% hiệu suất làm lạnh
- Tăng tiêu thụ điện
- Không khí không được lọc sạch
- Máy nhanh hỏng

### Giải pháp
- Vệ sinh lưới lọc **2 tuần/lần** trong mùa hè
- Vệ sinh dàn lạnh **6 tháng/lần**
- Bảo dưỡng tổng thể **1 năm/lần**

## Sai lầm 4: Để điều hòa chạy suốt đêm không có chế độ ngủ

### Vấn đề
Không bật chế độ Sleep Mode khi ngủ.

### Hậu quả
- Cơ thể bị lạnh quá mức
- Dễ bị cảm lạnh, đau đầu
- Tiêu thụ điện không cần thiết

### Giải pháp
Sử dụng **Sleep Mode** hoặc đặt timer tăng nhiệt độ 1°C mỗi 2 giờ.

## Sai lầm 5: Phòng không kín gió

### Vấn đề
Cửa sổ, cửa ra vào không được đóng kín khi bật điều hòa.

### Hậu quả
- Hơi lạnh thoát ra ngoài
- Máy hoạt động liên tục không đạt nhiệt độ mong muốn
- Tốn điện gấp 2-3 lần

### Giải pháp
- Kiểm tra và sửa chữa các khe hở
- Sử dụng rèm cửa chống nắng
- Dán film cách nhiệt cho cửa kính

![Phòng kín gió với điều hòa](${IMAGES.home})

## Sai lầm 6: Chọn sai công suất điều hòa

### Vấn đề
Chọn điều hòa công suất nhỏ hơn yêu cầu để tiết kiệm chi phí ban đầu.

### Hậu quả
- Máy chạy hết công suất vẫn không mát
- Tiêu thụ điện tăng cao
- Tuổi thọ máy giảm
- Hiệu quả làm mát kém

### Giải pháp
Tính toán công suất theo công thức:
\`\`\`
BTU cần = Diện tích (m²) × 650 + Yếu tố điều chỉnh
\`\`\`

## Sai lầm 7: Không kết hợp với quạt

### Vấn đề
Chỉ dùng điều hòa mà không dùng quạt hỗ trợ.

### Hậu quả
- Hơi mát không lan đều trong phòng
- Phải hạ nhiệt độ thấp hơn mới cảm thấy mát
- Tốn điện hơn

### Giải pháp
- Bật quạt trần hoặc quạt đứng ở mức nhẹ
- Đặt nhiệt độ cao hơn 2-3°C
- Tiết kiệm đến 30% điện năng

---

## Tổng kết: 5 nguyên tắc vàng khi sử dụng điều hòa

1. **Nhiệt độ 24-26°C** - Cân bằng giữa thoải mái và tiết kiệm
2. **Vệ sinh định kỳ** - 2 tuần/lần cho lưới lọc
3. **Sử dụng Sleep Mode** - Khi ngủ ban đêm
4. **Đóng kín phòng** - Không để hơi lạnh thoát ra
5. **Kết hợp quạt** - Giúp lưu thông không khí

*Hãy áp dụng ngay để vừa tiết kiệm điện, vừa bảo vệ sức khỏe gia đình bạn!*
`,
  },
  {
    title: "So sánh chi tiết điều hòa Daikin vs Panasonic: Nên mua hãng nào?",
    excerpt: "Daikin và Panasonic đều là những thương hiệu điều hòa hàng đầu Nhật Bản. Bài viết so sánh chi tiết để giúp bạn đưa ra quyết định đúng đắn.",
    featuredImage: IMAGES.airConditioner,
    readingTime: 10,
    isFeatured: false,
    content: `# So sánh chi tiết điều hòa Daikin vs Panasonic: Nên mua hãng nào?

Daikin và Panasonic là hai ông lớn trong ngành điều hòa không khí từ Nhật Bản. Cả hai đều có những ưu điểm riêng, hãy cùng phân tích chi tiết.

![Điều hòa cao cấp](${IMAGES.airConditioner})

## 1. Giới thiệu về hai thương hiệu

### Daikin
- Thành lập: 1924 tại Osaka, Nhật Bản
- Chuyên môn: **100% tập trung vào HVAC**
- Slogan: "Perfecting the Air"
- Thị phần: Số 1 thế giới về điều hòa không khí

### Panasonic
- Thành lập: 1918 tại Osaka, Nhật Bản
- Chuyên môn: Đa ngành (điện tử, điện lạnh, pin...)
- Slogan: "A Better Life, A Better World"
- Thị phần: Top 5 thế giới về điều hòa

## 2. So sánh công nghệ

### Công nghệ Inverter

| Tiêu chí | Daikin | Panasonic |
|----------|--------|-----------|
| Tên công nghệ | Inverter | ECONAVI + Inverter |
| Tốc độ biến tần | 1-130Hz | 1-120Hz |
| Tiết kiệm điện | 50-60% | 45-55% |
| Làm lạnh nhanh | 0.5°C/phút | 0.5°C/phút |

### Công nghệ lọc không khí

**Daikin:**
- Streamer Technology - Phân hủy virus, vi khuẩn
- Flash Streamer - Khử mùi nhanh
- Titanium Apatite Filter - Lọc bụi mịn

**Panasonic:**
- Nanoe™ X - 4.8 nghìn tỷ ion OH
- Ag+ Filter - Kháng khuẩn ion bạc
- PM2.5 Filter - Lọc 99% bụi mịn

![Phòng làm việc với điều hòa](${IMAGES.office})

## 3. So sánh sản phẩm cùng phân khúc (1HP)

### Daikin FTKZ25VVMV (~11 triệu)
**Ưu điểm:**
- ✅ Làm lạnh cực nhanh
- ✅ Độ ồn thấp nhất (19dB)
- ✅ Chế độ Econo tiết kiệm điện
- ✅ Máy nén tự sản xuất

**Nhược điểm:**
- ❌ Giá cao nhất phân khúc
- ❌ Ít tính năng smart home

### Panasonic CU/CS-YZ9WKH-8 (~10 triệu)
**Ưu điểm:**
- ✅ Nanoe™ X lọc không khí tốt
- ✅ Econavi cảm biến thông minh
- ✅ Giá cạnh tranh hơn
- ✅ Wifi điều khiển từ xa

**Nhược điểm:**
- ❌ Độ ồn cao hơn (22dB)
- ❌ Làm lạnh chậm hơn một chút

## 4. So sánh chi phí sử dụng

### Tiêu thụ điện năng (1 năm, 8h/ngày)

| Model | CSPF | Điện/năm | Tiền điện (~3000đ/kWh) |
|-------|------|----------|------------------------|
| Daikin FTKZ25 | 5.96 | 402 kWh | 1.2 triệu |
| Panasonic YZ9 | 5.54 | 433 kWh | 1.3 triệu |

### Chi phí bảo trì (5 năm)

| Hạng mục | Daikin | Panasonic |
|----------|--------|-----------|
| Vệ sinh/năm | 300k | 300k |
| Thay gas (nếu có) | 500k | 400k |
| Sửa chữa TB | 1.5tr | 1.2tr |
| **Tổng 5 năm** | **4tr** | **3.5tr** |

## 5. Độ bền và bảo hành

### Daikin
- Bảo hành máy nén: **5 năm**
- Bảo hành tổng máy: **2 năm**
- Tuổi thọ trung bình: **12-15 năm**

### Panasonic
- Bảo hành máy nén: **5 năm**
- Bảo hành tổng máy: **1 năm** (có thể mở rộng)
- Tuổi thọ trung bình: **10-12 năm**

![Phòng khách sang trọng](${IMAGES.livingRoom})

## 6. Kết luận: Nên chọn hãng nào?

### Chọn Daikin nếu bạn:
- 💰 Có ngân sách thoải mái
- 🔇 Cần phòng cực yên tĩnh (phòng ngủ, phòng học)
- ⚡ Ưu tiên tiết kiệm điện tối đa
- 🛠️ Muốn độ bền cao nhất

### Chọn Panasonic nếu bạn:
- 💵 Ngân sách vừa phải
- 🌬️ Ưu tiên chất lượng không khí (có em bé, người già)
- 📱 Thích điều khiển bằng smartphone
- 🏠 Lắp cho phòng khách, văn phòng

---

## Tổng điểm đánh giá

| Tiêu chí | Daikin | Panasonic |
|----------|--------|-----------|
| Làm lạnh | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Tiết kiệm điện | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Lọc không khí | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| Độ ồn | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| Giá thành | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| Smart features | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Tổng** | **25/30** | **25/30** |

*Cả hai thương hiệu đều xuất sắc! Hãy chọn dựa trên nhu cầu cụ thể của bạn.*
`,
  },
  {
    title: "Hướng dẫn vệ sinh điều hòa tại nhà đúng cách, an toàn",
    excerpt: "Tự vệ sinh điều hòa tại nhà không khó nếu bạn biết cách. Hướng dẫn chi tiết từng bước giúp bạn tiết kiệm chi phí và bảo vệ sức khỏe gia đình.",
    featuredImage: IMAGES.maintenance,
    readingTime: 7,
    isFeatured: false,
    content: `# Hướng dẫn vệ sinh điều hòa tại nhà đúng cách, an toàn

Vệ sinh điều hòa định kỳ giúp máy hoạt động hiệu quả, tiết kiệm điện và đảm bảo không khí trong lành. Bài viết này hướng dẫn bạn tự làm tại nhà.

![Kỹ thuật viên vệ sinh điều hòa](${IMAGES.maintenance})

## Chuẩn bị dụng cụ

### Dụng cụ cần thiết
- ✅ Bình xịt nước/bình tưới
- ✅ Khăn mềm, khăn khô
- ✅ Bàn chải mềm (bàn chải đánh răng cũ)
- ✅ Máy hút bụi mini (nếu có)
- ✅ Dung dịch vệ sinh điều hòa hoặc nước rửa chén pha loãng
- ✅ Túi nilon hoặc tấm che
- ✅ Găng tay cao su
- ✅ Kính bảo hộ

### Lưu ý an toàn
⚠️ **Ngắt nguồn điện** hoàn toàn trước khi vệ sinh
⚠️ Đợi máy nguội **ít nhất 30 phút** sau khi tắt
⚠️ Không để nước vào bo mạch điều khiển

## Bước 1: Vệ sinh lưới lọc (15 phút)

### 1.1. Tháo lưới lọc
1. Mở nắp dàn lạnh (nhấn 2 bên cạnh)
2. Nhẹ nhàng kéo lưới lọc ra theo hướng mũi tên
3. Đặt lưới lọc lên mặt phẳng sạch

### 1.2. Vệ sinh lưới lọc
\`\`\`
Cách 1: Dùng máy hút bụi hút sạch bụi bám
Cách 2: Xả nước nhẹ từ mặt trong ra ngoài
Cách 3: Ngâm trong nước ấm + nước rửa chén 15 phút
\`\`\`

### 1.3. Phơi khô
- Phơi nơi thoáng mát, **tránh ánh nắng trực tiếp**
- Đợi khô hoàn toàn (khoảng 2-3 giờ)
- Không dùng máy sấy vì có thể làm biến dạng

![Phòng khách sáng đẹp](${IMAGES.livingRoom})

## Bước 2: Vệ sinh dàn lạnh (30 phút)

### 2.1. Chuẩn bị
1. Dùng túi nilon che phần bo mạch điện
2. Đặt khăn/túi nilon dưới dàn lạnh hứng nước

### 2.2. Xịt rửa dàn lạnh
1. **Xịt dung dịch** vệ sinh lên toàn bộ dàn lạnh
2. Để **ngấm 10-15 phút**
3. **Xịt nước sạch** rửa lại 2-3 lần
4. Dùng **khăn khô** thấm nước còn đọng

### 2.3. Vệ sinh cánh đảo gió
- Dùng khăn ẩm lau sạch từng cánh
- Với vết bẩn cứng đầu, dùng bàn chải mềm
- Không bẻ gập cánh đảo gió

## Bước 3: Vệ sinh vỏ máy (10 phút)

### 3.1. Lau vỏ ngoài
- Dùng khăn ẩm lau sạch bụi
- Với vết bẩn, dùng nước rửa chén pha loãng
- Lau lại bằng khăn khô

### 3.2. Vệ sinh remote
- Tháo pin ra
- Lau bằng khăn ẩm
- Dùng tăm bông làm sạch khe nút

## Bước 4: Lắp lại và test (10 phút)

### 4.1. Lắp ráp
1. Lắp lưới lọc đã khô hoàn toàn
2. Đóng nắp dàn lạnh
3. Tháo túi nilon che chắn

### 4.2. Test hoạt động
1. Bật nguồn điện
2. Chạy chế độ **Fan** (quạt) 30 phút
3. Kiểm tra không có tiếng ồn lạ
4. Chuyển sang chế độ làm lạnh

![Ngôi nhà mát mẻ](${IMAGES.home})

## Lịch vệ sinh khuyến nghị

| Hạng mục | Tần suất | Người thực hiện |
|----------|----------|-----------------|
| Lưới lọc | 2 tuần/lần | Tự làm |
| Dàn lạnh | 3 tháng/lần | Tự làm |
| Dàn nóng | 6 tháng/lần | Kỹ thuật viên |
| Bổ sung gas | 2-3 năm/lần | Kỹ thuật viên |
| Bảo dưỡng tổng | 1 năm/lần | Kỹ thuật viên |

## Dấu hiệu cần vệ sinh ngay

1. 🌬️ Điều hòa có **mùi hôi** khi bật
2. ❄️ **Lạnh yếu** hơn bình thường
3. 💧 Có **nước nhỏ giọt** từ dàn lạnh
4. 🔊 **Tiếng ồn** bất thường
5. 💡 Đèn báo lỗi **nhấp nháy**

---

## Khi nào cần gọi thợ?

Dù tự vệ sinh được, bạn vẫn nên gọi thợ chuyên nghiệp khi:

- ❌ Điều hòa không lạnh dù đã vệ sinh
- ❌ Có tiếng ồn lạ từ máy nén
- ❌ Nước chảy nhiều bất thường
- ❌ Đã quá 1 năm chưa bảo dưỡng tổng

*Liên hệ ngay hotline của chúng tôi để được tư vấn và hỗ trợ kỹ thuật!*
`,
  },
  {
    title: "Cách tiết kiệm điện khi sử dụng điều hòa mùa hè",
    excerpt: "Mùa hè đến, hóa đơn tiền điện tăng vọt vì điều hòa. Áp dụng ngay 10 mẹo sau để giảm 30-50% tiền điện mà vẫn mát mẻ.",
    featuredImage: IMAGES.summer,
    readingTime: 5,
    isFeatured: true,
    content: `# Cách tiết kiệm điện khi sử dụng điều hòa mùa hè

Mùa hè nóng bức, điều hòa hoạt động hết công suất khiến hóa đơn tiền điện tăng chóng mặt. Hãy áp dụng những mẹo sau để tiết kiệm đáng kể.

![Mùa hè nóng bức](${IMAGES.summer})

## 1. Đặt nhiệt độ hợp lý: 25-27°C

### Tại sao là 25-27°C?
- Cơ thể cảm thấy thoải mái
- Chênh lệch với bên ngoài không quá lớn
- Máy nén không phải hoạt động liên tục

### Tiết kiệm bao nhiêu?
> 🔋 Mỗi 1°C tăng lên = Tiết kiệm **3-5% điện năng**
>
> Từ 22°C lên 26°C = Tiết kiệm **12-20% điện**

## 2. Sử dụng quạt kết hợp điều hòa

### Cách thực hiện
1. Đặt điều hòa **26-27°C**
2. Bật quạt trần hoặc quạt đứng mức **nhẹ**
3. Quạt giúp lưu thông không khí mát khắp phòng

### Hiệu quả
- Cảm giác mát như 23-24°C
- Tiết kiệm **20-30%** điện năng
- Không khí không bị tù đọng

![Tiết kiệm năng lượng](${IMAGES.energy})

## 3. Đóng kín cửa và sử dụng rèm

### Các bước cần làm
- ✅ Đóng kín cửa sổ, cửa ra vào
- ✅ Kéo rèm chống nắng (đặc biệt hướng Tây)
- ✅ Dán film cách nhiệt cho cửa kính
- ✅ Kiểm tra và bịt kín khe hở

### Hiệu quả
Giảm **15-20%** điện tiêu thụ nhờ không khí lạnh không thoát ra ngoài.

## 4. Tận dụng chế độ hẹn giờ và Sleep Mode

### Chế độ Timer (Hẹn giờ)
\`\`\`
Ví dụ: Ngủ 11h đêm, dậy 6h sáng
- Đặt tắt lúc 3h sáng
- Phòng vẫn mát đến 5-6h sáng
- Tiết kiệm 3-4 tiếng điện
\`\`\`

### Chế độ Sleep Mode
- Tự động tăng 1°C sau mỗi 1-2 giờ
- Phù hợp với nhịp sinh học khi ngủ
- Tiết kiệm **20%** so với chế độ thường

## 5. Vệ sinh điều hòa định kỳ

### Tần suất vệ sinh
| Bộ phận | Tần suất |
|---------|----------|
| Lưới lọc | 2 tuần/lần |
| Dàn lạnh | 3 tháng/lần |
| Dàn nóng | 6 tháng/lần |

### Tại sao quan trọng?
- Điều hòa bẩn giảm **20-30%** hiệu suất
- Máy phải hoạt động mạnh hơn để đạt nhiệt độ
- Tiêu thụ điện tăng tương ứng

![Điều hòa Inverter](${IMAGES.inverter})

## 6. Chọn điều hòa Inverter

### So sánh với Non-Inverter
| Tiêu chí | Inverter | Non-Inverter |
|----------|----------|--------------|
| Tiết kiệm điện | 30-50% | Chuẩn |
| Làm lạnh | Đều, êm | Theo chu kỳ |
| Độ ồn | Thấp | Cao |
| Giá | Cao hơn 30% | Thấp hơn |

### Thời gian hoàn vốn
Với mức sử dụng 8h/ngày:
- Tiết kiệm khoảng **2-3 triệu/năm**
- Hoàn vốn sau **2-3 năm**

## 7. Không chặn luồng gió

### Các vật cản cần tránh
- ❌ Rèm che trước dàn lạnh
- ❌ Tủ, kệ đặt sát dàn lạnh
- ❌ Đồ vật trên nóc dàn nóng

### Khoảng cách tối thiểu
- Dàn lạnh: Cách trần **10cm**, cách tường **5cm**
- Dàn nóng: Cách tường **30cm**, không bị che chắn

## 8. Tắt thiết bị sinh nhiệt

### Nguồn nhiệt trong phòng
- 💡 Đèn sợi đốt → Đổi sang LED
- 💻 Máy tính không dùng → Tắt hoặc Sleep
- 📺 TV → Tắt khi không xem
- 🍳 Bếp nấu → Nấu xong thì bật điều hòa

Mỗi nguồn nhiệt khiến điều hòa phải làm việc nhiều hơn.

## 9. Bật trước khi cần 15-20 phút

### Tại sao?
- Tránh bật điều hòa ở nhiệt độ quá thấp
- Máy có thời gian làm mát từ từ
- Tiết kiệm điện hơn là làm lạnh gấp

## 10. Sử dụng điều hòa đúng giờ cao điểm

### Giờ cao điểm điện (giá cao)
- **9h30 - 11h30** sáng
- **17h00 - 20h00** tối

### Mẹo
- Hạn chế bật điều hòa vào khung giờ trên
- Tranh thủ giờ thấp điểm (22h - 4h sáng)

---

## Tổng kết: Tiết kiệm bao nhiêu?

| Mẹo | Tiết kiệm |
|-----|-----------|
| Nhiệt độ 26°C | 12-15% |
| Kết hợp quạt | 20-30% |
| Đóng kín cửa | 15-20% |
| Sleep Mode | 20% |
| Vệ sinh định kỳ | 20-30% |

**Áp dụng tất cả: Tiết kiệm lên đến 40-50%!**

*Hãy bắt đầu từ hôm nay để thấy sự khác biệt trong hóa đơn tiền điện tháng sau!*
`,
  },
];

async function seedArticles() {
  console.log("🌱 Starting article seeding...\n");

  await AppDataSource.initialize();
  console.log("✅ Database connected\n");

  // Get repositories
  const articleRepo = AppDataSource.getRepository(Article);
  const categoryRepo = AppDataSource.getRepository(ArticleCategory);
  const userRepo = AppDataSource.getRepository(User);

  // Create article categories
  console.log("📁 Creating article categories...");
  const categoriesData = [
    { name: "Hướng dẫn mua hàng", slug: "huong-dan-mua-hang", displayOrder: 1 },
    { name: "Kiến thức điều hòa", slug: "kien-thuc-dieu-hoa", displayOrder: 2 },
    { name: "Mẹo sử dụng", slug: "meo-su-dung", displayOrder: 3 },
    { name: "So sánh sản phẩm", slug: "so-sanh-san-pham", displayOrder: 4 },
    { name: "Tin tức", slug: "tin-tuc", displayOrder: 5 },
  ];

  // Clear existing article data
  await AppDataSource.query("TRUNCATE TABLE article_tags CASCADE");
  await AppDataSource.query("TRUNCATE TABLE articles CASCADE");
  await AppDataSource.query("TRUNCATE TABLE article_categories CASCADE");

  const categories = await categoryRepo.save(
    categoriesData.map((c) => ({ ...c, isActive: true }))
  );
  console.log(`✅ Created ${categories.length} article categories\n`);

  // Get admin user for author
  const adminUser = await userRepo.findOne({ where: { email: "admin@example.com" } });

  // Create articles
  console.log("📝 Creating articles...");
  const articles: Article[] = [];

  for (let i = 0; i < ARTICLES_DATA.length; i++) {
    const data = ARTICLES_DATA[i];
    const categoryIndex = i % categories.length;

    const article = articleRepo.create({
      title: data.title,
      slug: slugify(data.title) + "-" + Date.now() + i,
      excerpt: data.excerpt,
      content: data.content,
      featuredImage: data.featuredImage,
      featuredImageAlt: data.title,
      categoryId: categories[categoryIndex].id,
      authorId: adminUser?.id,
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(),
      readingTime: data.readingTime,
      isFeatured: data.isFeatured,
      viewCount: Math.floor(Math.random() * 5000) + 500,
      robotsIndex: true,
      robotsFollow: true,
      metaTitle: data.title.substring(0, 60),
      metaDescription: data.excerpt.substring(0, 160),
      metaKeywords: ["điều hòa", "máy lạnh", "tiết kiệm điện"],
    });

    const saved = await articleRepo.save(article);
    articles.push(saved);
    console.log(`  ✅ Created: ${data.title.substring(0, 50)}...`);
  }

  console.log(`\n✅ Created ${articles.length} articles\n`);

  // Summary
  console.log("═══════════════════════════════════════");
  console.log("     ARTICLE SEED DATA SUMMARY         ");
  console.log("═══════════════════════════════════════");
  console.log(`📁 Article Categories: ${categories.length}`);
  console.log(`📝 Articles: ${articles.length}`);
  console.log(`⭐ Featured Articles: ${articles.filter((a) => a.isFeatured).length}`);
  console.log("═══════════════════════════════════════");
  console.log("\n🎉 Article seeding completed!\n");

  await AppDataSource.destroy();
}

seedArticles().catch((error) => {
  console.error("❌ Seeding failed:", error);
  process.exit(1);
});
