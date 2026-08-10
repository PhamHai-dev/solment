// utils/formulas.js
// Công thức khổ giấy/chặt được port từ GAS/Sheet cũ và cần đối chiếu lại với Sheet gốc.

const KHO_MAY_BE = {
  HN: { canhNgan: 80, canhDai: 110 },
  HCM: { canhNgan: 82, canhDai: 120 }
};

function vuaKhoMayBe(khoGiay, chat, diaChi) {
  const may = KHO_MAY_BE[diaChi] || KHO_MAY_BE.HN;
  return (khoGiay <= may.canhNgan && chat <= may.canhDai) ||
    (khoGiay <= may.canhDai && chat <= may.canhNgan);
}

function tinhGiaVatLieuHN(dienTichM2) {
  if (dienTichM2 <= 0.075) return 11800;
  if (dienTichM2 <= 0.15) return 9800;
  if (dienTichM2 <= 0.355) return 9000;
  return 8500;
}

function chuanHoaLoaiHop(loaiHop) {
  const typeMap = {
    "Đối khẩu": "Đối khẩu", "Nắp chồm": "Nắp chồm",
    "Nắp cài 2 đầu": "Nắp cài 2 đầu", "Nắp gài đáy khóa": "Nắp cài 2 đầu",
    "Hộp nắp chùm": "Hộp nắp chùm", "Hộp giày": "Hộp giày",
    "Nắp gài pizza": "Hộp kiểu pizza", "Hộp pizza": "Hộp kiểu pizza",
    "Hộp kiểu pizza": "Hộp kiểu pizza"
  };
  return typeMap[loaiHop] || "Đối khẩu";
}

function tinhKhoGiayChatHN(normalizedType, D, R, C, H, G) {
  let khoGiay;
  let chat;
  switch (normalizedType) {
    case "Hộp kiểu pizza":
      khoGiay = (2 * R + 4 * C) * H + 2;
      chat = (D + 2 * C) * G + 2;
      break;
    case "Nắp chồm":
      khoGiay = (2 * R + C) * H + 2;
      chat = ((D + R) * 2 + 2.5 - 0.2) * G + 2;
      break;
    case "Nắp cài 2 đầu":
      khoGiay = H * (2 * (R + 2.5) + C) - (H - 1) * (R + 2.5) + 2;
      chat = (2 * (D + R) + 2.5 - 0.2) * G + 2;
      break;
    case "Hộp nắp chùm":
      khoGiay = H * (3 * C + 2 * R) + 2;
      chat = G * (4 * C + D) - (G - 1) * C + 2;
      break;
    case "Hộp giày":
      khoGiay = H * (2 * (R + C) + 0.7 * C + 0.5) + 2;
      chat = G * (D + 2 * C) + 2;
      break;
    default:
      khoGiay = (R + C) * H + 2;
      chat = ((D + R) * 2 + 2.5 - 0.2) * G + 2;
  }
  return { khoGiay, chat };
}

function timBatToiUuHN(normalizedType, D, R, C) {
  let best = null;
  for (let H = 1; H <= 20; H += 1) {
    for (let G = 1; G <= 20; G += 1) {
      const { khoGiay, chat } = tinhKhoGiayChatHN(normalizedType, D, R, C, H, G);
      if (!vuaKhoMayBe(khoGiay, chat, "HN")) continue;
      const soBat = H * G;
      const dienTichM2MoiHop = (khoGiay * chat) / 10000 / soBat;
      if (!best || dienTichM2MoiHop < best.dienTichM2MoiHop - 1e-12 ||
        (Math.abs(dienTichM2MoiHop - best.dienTichM2MoiHop) <= 1e-12 && soBat < best.soBat)) {
        best = { H, G, khoGiay, chat, soBat, dienTichM2MoiHop };
      }
    }
  }
  if (!best) {
    const { khoGiay, chat } = tinhKhoGiayChatHN(normalizedType, D, R, C, 1, 1);
    return { H: 1, G: 1, khoGiay, chat, soBat: 1, vuaKhoMay: false };
  }
  return { ...best, vuaKhoMay: true };
}

function tinhMayBeHN(loaiHop, D, R, C, SL) {
  const bat = timBatToiUuHN(chuanHoaLoaiHop(loaiHop), D, R, C);
  const dienTichM2 = (bat.khoGiay * bat.chat) / 10000 / bat.soBat;
  const gia3lop1nau = Math.ceil(((dienTichM2 * tinhGiaVatLieuHN(dienTichM2)) + 150 + 80000 / SL) / 10) * 10;
  return {
    phuong_phap: "Máy bế (cần khuôn bế riêng)",
    khoGiay: parseFloat(bat.khoGiay.toFixed(2)), chat: parseFloat(bat.chat.toFixed(2)),
    dienTichM2: parseFloat(dienTichM2.toFixed(4)), batNgang: bat.G, batDoc: bat.H,
    soBat: bat.soBat, vuaKhoMayBe: bat.vuaKhoMay,
    gia_3lop1nau: gia3lop1nau, gia_3lop2nau: Math.ceil(gia3lop1nau * 1.15),
    gia_trangnau: Math.ceil(gia3lop1nau * 1.35), gia_5lop1nau: Math.ceil(gia3lop1nau * 1.5),
    gia_5lop2nau: Math.ceil(gia3lop1nau * 1.5 * 1.1)
  };
}

function tinhMayBoHN(D, R, C, SL) {
  const khoGiay = R + C + 0.2;
  const chat = (D + R) * 2 + 3;
  const dienTichM2 = (khoGiay * chat) / 10000;
  const gia3lop1nau = Math.ceil(((dienTichM2 * 8500) + 150 + 100000 / SL) / 10) * 10;
  return {
    phuong_phap: "Máy bổ (không cần khuôn bế)", khoGiay: parseFloat(khoGiay.toFixed(2)),
    chat: parseFloat(chat.toFixed(2)), dienTichM2: parseFloat(dienTichM2.toFixed(4)),
    batNgang: 0, batDoc: 0, soBat: 0, vuaKhoMayBe: null,
    gia_3lop1nau: gia3lop1nau, gia_3lop2nau: Math.ceil(gia3lop1nau * 1.15),
    gia_trangnau: Math.ceil(gia3lop1nau * 1.35), gia_5lop1nau: Math.ceil(gia3lop1nau * 1.5),
    gia_5lop2nau: Math.ceil(gia3lop1nau * 1.5 * 1.1)
  };
}

function tinhGiaVatLieuHCM(dienTichM2) {
  if (dienTichM2 <= 0.075) return 11800;
  if (dienTichM2 <= 0.35) return 9800;
  if (dienTichM2 <= 0.5) return 9200;
  return 8600;
}

function tinhGiaHCM(loaiHop, D, R, C, SL) {
  const type = chuanHoaLoaiHop(loaiHop);
  let khoGiay;
  let chat;
  switch (type) {
    case "Nắp chồm": case "Hộp nắp chùm": khoGiay = (D + R) * 2 + 5; chat = R * 2 + C + 2; break;
    case "Nắp cài 2 đầu": khoGiay = (D + R) * 2 + 5; chat = R * 2 + C + 8; break;
    case "Hộp kiểu pizza": khoGiay = D + C * 4 + 3; chat = R * 2 + C * 3 + 2; break;
    case "Hộp giày": khoGiay = D + 2 * C + 2; chat = 2 * R + 2.3 * C + 2; break;
    default: khoGiay = (D + R) * 2 + 5; chat = R + C + 2;
  }
  const dienTichM2 = (khoGiay * chat) / 10000;
  const gia3lop = Math.ceil(dienTichM2 * tinhGiaVatLieuHCM(dienTichM2) + 200 + 100000 / SL);
  return {
    phuong_phap: "Sản xuất tại TP.HCM", dienTichM2: parseFloat(dienTichM2.toFixed(4)),
    khoGiay: parseFloat(khoGiay.toFixed(2)), chat: parseFloat(chat.toFixed(2)),
    batNgang: 1, batDoc: 1, soBat: 1, vuaKhoMayBe: vuaKhoMayBe(khoGiay, chat, "HCM"),
    gia_3lop1nau: gia3lop, gia_3lop2nau: gia3lop, gia_trangnau: Math.ceil(gia3lop * 1.35),
    gia_5lop1nau: Math.ceil(gia3lop * 1.5), gia_5lop2nau: Math.ceil(gia3lop * 1.5)
  };
}

module.exports = { KHO_MAY_BE, tinhKhoGiayChatHN, timBatToiUuHN, tinhMayBeHN, tinhMayBoHN, tinhGiaHCM };
