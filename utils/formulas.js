// utils/formulas.js

// ==== HÀ NỘI ====
function tinhGiaVatLieuHN(dienTichM2) {
  if (dienTichM2 <= 0.075) return 11800;
  if (dienTichM2 <= 0.15) return 9800;
  if (dienTichM2 <= 0.355) return 9000;
  return 8500;
}

function tinhMayBeHN(loaiHop, D, R, C, SL) {
  let khoGiay = 0;
  let chat = 0;

  const H = 1; // Bát dọc
  const G = 1; // Bát ngang

  const typeMap = {
    "Đối khẩu": "Đối khẩu",
    "Nắp chồm": "Nắp chồm",
    "Nắp cài 2 đầu": "Nắp cài 2 đầu",
    "Nắp gài đáy khóa": "Nắp cài 2 đầu",
    "Hộp nắp chùm": "Hộp nắp chùm",
    "Hộp giày": "Hộp giày",
    "Nắp gài pizza": "Hộp kiểu pizza",
    "Hộp kiểu pizza": "Hộp kiểu pizza"
  };
  const normalizedType = typeMap[loaiHop] || "Đối khẩu";

  switch (normalizedType) {
    case "Hộp kiểu pizza":
      khoGiay = (2 * R + 4 * C) * H + 2;
      chat = (D + 2 * C) * G + 2;
      break;
    case "Đối khẩu":
      khoGiay = ((R + C) * H) + 2;
      chat = (((D + R) * 2 + 2.5 - 0.2) * G + 2);
      break;
    case "Nắp chồm":
      khoGiay = ((2 * R + C) * H + 2);
      chat = (((D + R) * 2 + 2.5 - 0.2) * G + 2);
      break;
    case "Nắp cài 2 đầu":
      khoGiay = ((H * (2 * (R + 2.5) + C) - (H - 1) * (R + 2.5)) + 2);
      chat = (((2 * (D + R) + 2.5 - 0.2) * G) + 2);
      break;
    case "Hộp nắp chùm":
      khoGiay = ((H * (3 * C + 2 * R)) + 2);
      chat = (G * (4 * C + D) - (G - 1) * C + 2);
      break;
    case "Hộp giày":
      khoGiay = ((H * (2 * (R + C) + 0.7 * C + 0.5) + 2));
      chat = (G * (D + 2 * C) + 2);
      break;
    default:
      khoGiay = ((R + C) * H) + 2;
      chat = (((D + R) * 2 + 2.5 - 0.2) * G + 2);
  }

  const dienTichM2 = (khoGiay * chat) / 10000;
  const giaM2 = tinhGiaVatLieuHN(dienTichM2);

  const gia3lop1nau = Math.ceil(((dienTichM2 * giaM2) + 150 + 80000 / SL) / 10) * 10;
  
  return {
    phuong_phap: "Máy bế (cần khuôn bế riêng)",
    khoGiay: parseFloat(khoGiay.toFixed(2)),
    chat: parseFloat(chat.toFixed(2)),
    dienTichM2: parseFloat(dienTichM2.toFixed(4)),
    gia_3lop1nau: gia3lop1nau,
    gia_3lop2nau: Math.ceil(gia3lop1nau * 1.15),
    gia_trangnau: Math.ceil(gia3lop1nau * 1.35),
    gia_5lop1nau: Math.ceil(gia3lop1nau * 1.5),
    gia_5lop2nau: Math.ceil(gia3lop1nau * 1.5 * 1.1)
  };
}

function tinhMayBoHN(D, R, C, SL) {
  const khoGiay = R + C + 0.2;
  const chat = (D + R) * 2 + 3;
  const dienTichM2 = (khoGiay * chat) / 10000;
  
  const gia3lop1nau = Math.ceil(((dienTichM2 * 8500) + 150 + 100000 / SL) / 10) * 10;
  
  return {
    phuong_phap: "Máy bổ (không cần khuôn bế)",
    khoGiay: parseFloat(khoGiay.toFixed(2)),
    chat: parseFloat(chat.toFixed(2)),
    dienTichM2: parseFloat(dienTichM2.toFixed(4)),
    gia_3lop1nau: gia3lop1nau,
    gia_3lop2nau: Math.ceil(gia3lop1nau * 1.15),
    gia_trangnau: Math.ceil(gia3lop1nau * 1.35),
    gia_5lop1nau: Math.ceil(gia3lop1nau * 1.5),
    gia_5lop2nau: Math.ceil(gia3lop1nau * 1.5 * 1.1)
  };
}

// ==== TP.HCM ====
function tinhGiaVatLieuHCM(dienTichM2) {
  if (dienTichM2 <= 0.075) return 11800;
  if (dienTichM2 <= 0.35) return 9800;
  if (dienTichM2 <= 0.5) return 9200;
  return 8600;
}

function tinhGiaHCM(loaiHop, D, R, C, SL) {
  let dienTichM2 = 0;
  
  const typeMap = {
    "Đối khẩu": "Đối khẩu",
    "Nắp chồm": "Nắp chồm",
    "Nắp cài 2 đầu": "Nắp cài 2 đầu",
    "Nắp gài đáy khóa": "Nắp cài 2 đầu",
    "Hộp nắp chùm": "Nắp chồm",
    "Hộp giày": "Hộp giày",
    "Nắp gài pizza": "Hộp kiểu pizza",
    "Hộp kiểu pizza": "Hộp kiểu pizza"
  };
  const normalizedType = typeMap[loaiHop] || "Đối khẩu";

  // Công thức của Excel tính m2 thẳng luôn (bỏ qua bước xuất Khổ/Chặt lẻ ra ngoài)
  switch (normalizedType) {
    case "Đối khẩu":
      dienTichM2 = ((D + R) * 2 + 5) * (R + C + 2) / 10000;
      break;
    case "Nắp chồm":
      dienTichM2 = ((D + R) * 2 + 5) * (R * 2 + C + 2) / 10000;
      break;
    case "Nắp cài 2 đầu":
      dienTichM2 = ((D + R) * 2 + 5) * (R * 2 + C + 2 + 6) / 10000;
      break;
    case "Hộp kiểu pizza":
      dienTichM2 = (D + C * 4 + 3) * (R * 2 + C * 3 + 2) / 10000;
      break;
    case "Hộp giày":
      dienTichM2 = (D + 2 * C + 2) * (2 * R + 2.3 * C + 2) / 10000;
      break;
    default:
      dienTichM2 = ((D + R) * 2 + 5) * (R + C + 2) / 10000;
  }

  const giaM2 = tinhGiaVatLieuHCM(dienTichM2);
  const cong = 200;
  const phiSetup = 100000;
  
  const gia3lop = Math.ceil((dienTichM2 * giaM2) + cong + (phiSetup / SL));

  return {
    phuong_phap: "Sản xuất tại TP.HCM",
    dienTichM2: parseFloat(dienTichM2.toFixed(4)),
    gia_3lop1nau: gia3lop, // Map thành 3lop1nau để chuẩn hóa API
    gia_3lop2nau: gia3lop, // Dùng chung giá
    gia_trangnau: Math.ceil(gia3lop * 1.35),
    gia_5lop1nau: Math.ceil(gia3lop * 1.5),
    gia_5lop2nau: Math.ceil(gia3lop * 1.5)
  };
}

module.exports = {
  tinhMayBeHN,
  tinhMayBoHN,
  tinhGiaHCM
};
