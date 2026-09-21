# Solment — API báo giá carton và phụ kiện

API báo giá theo khu vực `HN`/`HCM` và theo thương hiệu.

## Routing thương hiệu

Request nhận field `thuong_hieu_id`:

- `1544827258956583`: HT Carton.
- ID hợp lệ khác: cụm các thương hiệu khác HT Carton.
- Thiếu field: mặc định HT Carton để tương thích với client cũ; response có
  `thuong_hieu_mac_dinh: true`.

Mọi response sau routing có:

```json
{
  "thuong_hieu_id": "987654321",
  "cum_thuong_hieu": "OTHER_BRANDS",
  "thuong_hieu_mac_dinh": false
}
```

## Hộp có sẵn

```json
{
  "thuong_hieu_id": "987654321",
  "dia_chi": "HN",
  "loai_hop": "Nắp gài pizza",
  "dai": 25,
  "rong": 20,
  "cao": 6,
  "so_luong": 1000,
  "tong_tien_hop_truoc_chiet_khau": 2500000
}
```

- HT Carton dùng bảng giá cũ.
- Thương hiệu khác tại HN có một giá áp dụng mọi số lượng.
- Thương hiệu khác tại HCM có giá lẻ, từ 300 và từ 1.000 hộp.
- Danh sách có sẵn vẫn là 53 SKU HN và 40 SKU HCM.
- SKU chuẩn HN là `25×20×6`, không phải `26×20×5`.

### Ưu đãi đơn hộp HN

Chỉ áp dụng cho hộp carton có sẵn của thương hiệu khác tại HN:

| Tiền hộp trước chiết khấu | Chiết khấu |
|---:|---:|
| Từ 2.000.000đ | 4% |
| Từ 5.000.000đ | 6% |
| Từ 9.000.000đ | 7% |
| Từ 12.000.000đ | 8% |

`tong_tien_hop_truoc_chiet_khau` chỉ gồm tiền hộp, không gồm băng dính, xốp,
túi hoặc phụ kiện. Nếu không truyền field này nhưng có `so_luong`, API dùng tiền
của dòng hộp đang tra. Với đơn nhiều SKU, client phải truyền tổng tiền hộp của
cả đơn.

API gợi ý mua thêm khi tổng tiền hộp đạt ít nhất 90% mốc tiếp theo.

#### Trường `ly_do_chiet_khau`

Phản hồi chiết khấu luôn kèm trường `ly_do_chiet_khau` mô tả lý do bằng câu tự nhiên:

- Có chiết khấu: `"Đơn hộp đạt mức ≥ 5.000.000đ nên được chiết khẩu 6%."`
- Chưa đạt: `"Đơn hộp chưa đạt mức chiết khẩu tối thiểu 2.000.000đ."`

## Phụ kiện thương hiệu khác

Ba giá trị `loai_san_pham` được hỗ trợ:

- `Băng dính`
- `Xốp chống sốc`
- `Túi niêm phong`

Thiếu tên hoặc kích thước sản phẩm sẽ trả `type: "accessory_catalog"` với toàn
bộ mẫu của khu vực. Phụ kiện không được hưởng chiết khấu đơn hộp 4/6/7/8%.

> **Lưu ý:** Project chưa có bảng giá phụ kiện HT Carton. Request phụ kiện với
> ID HT trả `type: "accessory_data_unavailable"`; API không dùng nhầm giá của
> thương hiệu khác.

### Băng dính

```json
{
  "thuong_hieu_id": "987654321",
  "dia_chi": "HN",
  "loai_san_pham": "Băng dính",
  "ten_san_pham": "Băng dính 0,5kg",
  "so_luong": 6
}
```

Số lượng tính theo cuộn; giá sỉ áp dụng từ 6 cuộn.

### Xốp chống sốc

```json
{
  "thuong_hieu_id": "987654321",
  "dia_chi": "HN",
  "loai_san_pham": "Xốp chống sốc",
  "kich_thuoc": "20cmx100m",
  "so_luong": 25,
  "don_vi_so_luong": "cay"
}
```

- `don_vi_so_luong`: `cuon` hoặc `cay` khi có số lượng.
- Giá lẻ tính theo cuộn.
- HN có giá/cây từ 25 và 40 cây.
- Dưới 25 cây chưa có giá/cây trong nguồn, API yêu cầu xác nhận.
- HCM không có giá sỉ xốp/cây trong nguồn; API giữ giá trị `null` và không nội
  suy từ giá cuộn.
- Response trả `so_cuon_moi_cay` theo từng kích thước.

### Túi niêm phong

```json
{
  "thuong_hieu_id": "987654321",
  "dia_chi": "HCM",
  "loai_san_pham": "Túi niêm phong",
  "kich_thuoc": "15x25cm",
  "mau": "xanh",
  "so_luong": 250
}
```

- `mau`: `den`, `mau`, hoặc `xanh`, `vàng`, `tím`, `hồng`, `bạc`, `cam`.
- Tên màu cụ thể dùng bảng giá túi màu.
- HN áp dụng giá sỉ từ 25 gói.
- HCM áp dụng giá sỉ từ 250 gói.
- Thiếu màu: trả cả bảng giá đen và màu, không tự chọn.

## Sản xuất theo yêu cầu

Công thức sản xuất hộp tùy chỉnh và tấm carton giữ nguyên và dùng chung cho mọi
thương hiệu. Khi in trên form hộp có sẵn, giá phôi sản xuất cũng dùng cấu hình
HT Carton chung, không bị thay đổi bởi bảng giá bán sẵn của thương hiệu khác.

## Chạy local và kiểm thử

```powershell
npm test
npm run dev
```

Endpoint local:

```text
POST http://localhost:3000/api/tinh-gia
GET  http://localhost:3000/api/tinh-gia
```
