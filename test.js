const assert = require("assert");
const { vuaKhoMayBe, tinhMayBeHN, tinhGiaHCM } = require("./utils/formulas");
const { getPrice } = require("./utils/pricing-rules");
const { tinhGiaTam } = require("./utils/tam-carton");
const customData = (r) => r.data && r.data.size_yeu_cau ? r.data.size_yeu_cau : r.data;
const accepted = (d) => Object.values(d.theo_loai_giay).find((p) => p.dat_dieu_kien);
const formatPrice = (n) => n.toLocaleString("vi-VN").replace(/,/g, ".");
const DOI_KHAU = "\u0110\u1ed1i kh\u1ea9u";
const HOP_GIAY = "H\u1ed9p gi\u00e0y";
const NAP_CAI = "N\u1eafp c\u00e0i 2 \u0111\u1ea7u";

const bat = tinhMayBeHN(DOI_KHAU, 20, 8, 8, 1000);
assert.deepStrictEqual(
  { G: bat.batNgang, H: bat.batDoc, soBat: bat.soBat, kho: bat.khoGiay, chat: bat.chat },
  { G: 1, H: 1, soBat: 1, kho: 18, chat: 60.3 }
);
assert.strictEqual(bat.dienTichM2, 0.1085);

const hnDoiKhau = customData(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20, rong: 8, cao: 8, so_luong: 5000 }));
assert.strictEqual(hnDoiKhau.bat_ngang, 1);
assert.strictEqual(hnDoiKhau.bat_doc, 1);
assert.strictEqual(hnDoiKhau.chat_cm, 60.3);
assert.strictEqual(accepted(hnDoiKhau).phi_khuon_be, "600.000");

const hnGiay = customData(getPrice({ dia_chi: "HN", loai_hop: HOP_GIAY, dai: 10.1, rong: 6.1, cao: 3.1, so_luong: 10000 }));
assert.strictEqual(hnGiay.so_bat, 1);
assert.strictEqual(accepted(hnGiay).phi_khuon_be, "800.000");

const hcmMayBo = customData(getPrice({ dia_chi: "HCM", loai_hop: DOI_KHAU, dai: 30.1, rong: 25.1, cao: 15.1, so_luong: 10000 }));
assert.strictEqual(accepted(hcmMayBo).phi_khuon_be, "0");
assert.strictEqual(Object.prototype.hasOwnProperty.call(hcmMayBo, "chat_cm"), false);

const hcmCanBe = customData(getPrice({ dia_chi: "HCM", loai_hop: DOI_KHAU, dai: 26.9, rong: 25.1, cao: 15.1, so_luong: 1000 }));
assert.strictEqual(accepted(hcmCanBe).phi_khuon_be, "800.000");

const hcmNapCai = customData(getPrice({ dia_chi: "HCM", loai_hop: NAP_CAI, dai: 20.1, rong: 15.1, cao: 15.1, so_luong: 1000 }));
assert.strictEqual(accepted(hcmNapCai).phi_khuon_be, "800.000");

const hcmLarge = customData(getPrice({ dia_chi: "HCM", loai_hop: NAP_CAI, dai: 20.1, rong: 15.1, cao: 15.1, so_luong: 15000, in_an: true, so_mau_in: 1 }));
assert.ok(hcmLarge.thong_bao_ctv.can_bao_ctv);
const simplePrintPaper = hcmLarge.theo_loai_giay["3lop2nau"];
assert.ok(simplePrintPaper.don_gia_tu);
assert.ok(simplePrintPaper.don_gia_den);
assert.strictEqual(Number(simplePrintPaper.don_gia_den.replace(/\./g, "")) - Number(simplePrintPaper.don_gia_tu.replace(/\./g, "")), 100);

const hcmComplexPrint = customData(getPrice({ dia_chi: "HCM", loai_hop: NAP_CAI, dai: 20.1, rong: 15.1, cao: 15.1, so_luong: 5000, in_an: true, so_mau_in: 2, ban_in_phuc_tap: true }));
const complexPrintPaper = hcmComplexPrint.theo_loai_giay["3lop2nau"];
assert.strictEqual(Number(complexPrintPaper.don_gia_den.replace(/\./g, "")) - Number(complexPrintPaper.don_gia_tu.replace(/\./g, "")), 1000);
assert.strictEqual(tinhGiaHCM(HOP_GIAY, 20, 15, 10, 1000).soBat, 1);

// HCM dùng VÀ: chỉ một cạnh dưới ngưỡng chưa cần khuôn; cả hai mới cần.
assert.strictEqual(tinhGiaTam("HCM", { dai: 70, rong: 24, so_luong: 1000 }, formatPrice).data.can_khuon_be, false);
assert.strictEqual(tinhGiaTam("HCM", { dai: 59, rong: 30, so_luong: 1000 }, formatPrice).data.can_khuon_be, false);
assert.strictEqual(tinhGiaTam("HCM", { dai: 59, rong: 24, so_luong: 1000 }, formatPrice).data.can_khuon_be, true);
// HN dùng HOẶC.
assert.strictEqual(tinhGiaTam("HN", { dai: 70, rong: 24, so_luong: 1000 }, formatPrice).data.can_khuon_be, true);
assert.strictEqual(tinhGiaTam("HN", { dai: 59, rong: 30, so_luong: 1000 }, formatPrice).data.can_khuon_be, true);

const VACH_NGAN = "V\u00e1ch ng\u0103n";
const hcmVachNgan = customData(getPrice({ dia_chi: "HCM", loai_hop: VACH_NGAN, dai: 30.1, rong: 20.1, cao: 10.1, so_luong: 2000 }));
assert.strictEqual(accepted(hcmVachNgan).phi_khuon_be, "600.000");
assert.ok(hcmVachNgan.ghi_chu_chung.includes("\u00b15%"));
// Vách ngăn chưa có công thức riêng: phải cảnh báo CTV ở cả hai vùng.
assert.ok(hcmVachNgan.ghi_chu_chung.includes("ch\u01b0a c\u00f3 c\u00f4ng th\u1ee9c ri\u00eang"));

// ---- Ph\u00f4i \u0111\u00fang bi\u00ean kh\u1ed5 m\u00e1y b\u1ebf \u0111\u01b0\u1ee3c coi l\u00e0 v\u1eeba ----
assert.strictEqual(vuaKhoMayBe(80, 110, "HN"), true);
assert.strictEqual(vuaKhoMayBe(82, 120, "HCM"), true);
assert.strictEqual(vuaKhoMayBe(81, 110, "HN"), false);
assert.strictEqual(vuaKhoMayBe(82, 121, "HCM"), false);

// ---- Hai payload người dùng cung cấp: HN 42×30×15 dùng mặc định bát 1–1 ----
const NAP_CHUM = "H\u1ed9p n\u1eafp ch\u00f9m";
const hnNapCaiVuot = customData(getPrice({ dia_chi: "HN", loai_hop: NAP_CAI, dai: 42, rong: 30, cao: 15, so_luong: 500 }));
assert.strictEqual(hnNapCaiVuot.bat_ngang, 1);
assert.strictEqual(hnNapCaiVuot.bat_doc, 1);
assert.strictEqual(hnNapCaiVuot.kho_giay_cm, 82);
assert.strictEqual(hnNapCaiVuot.chat_cm, 148.3);

const hnNapChumVuot = customData(getPrice({ dia_chi: "HN", loai_hop: NAP_CHUM, dai: 42, rong: 30, cao: 15, so_luong: 500 }));
assert.strictEqual(hnNapChumVuot.bat_ngang, 1);
assert.strictEqual(hnNapChumVuot.bat_doc, 1);
// Hộp nắp chùm HN có công thức riêng: không cảnh báo thiếu công thức.
assert.ok(!hnNapChumVuot.ghi_chu_chung.includes("ch\u01b0a c\u00f3 c\u00f4ng th\u1ee9c ri\u00eang"));

// ---- Đối khẩu HN đạt máy bổ: không cần khuôn bế ----
const hnMayBo = customData(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 42, rong: 30, cao: 15, so_luong: 500 }));
assert.ok(hnMayBo.phuong_phap.includes("M\u00e1y b\u1ed5"));
assert.strictEqual(hnMayBo.so_bat, 0);
assert.strictEqual(accepted(hnMayBo).phi_khuon_be, "0");

// ---- Input invalid: \u0111\u1ecba ch\u1ec9, NaN, \u00e2m, zero, m\u00e0u in ----
assert.strictEqual(getPrice({ dia_chi: "DN", loai_hop: DOI_KHAU, dai: 20, rong: 10, cao: 10 }).success, false);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: "abc", rong: 10, cao: 10 }).success, false);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: -5, rong: 10, cao: 10 }).success, false);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20, rong: 10, cao: 10, so_luong: 0 }).success, true);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: Number.NaN, rong: 10, cao: 10 }).success, false);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20, rong: 10, cao: 10, in_an: true, so_mau_in: 0 }).success, false);
assert.strictEqual(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20, rong: 10, cao: 10, in_an: true, so_mau_in: 2.5 }).success, false);

// ---- T\u1ea5m HCM c\u00f3 in tr\u1ea3 kho\u1ea3ng gi\u00e1 300\u2013400\u0111/m\u00e0u/t\u1ea5m ----
const tamHcmIn = tinhGiaTam("HCM", { dai: 70, rong: 24, so_luong: 1000, in_an: true, so_mau_in: 1 }, formatPrice).data;
assert.strictEqual(tamHcmIn.can_khuon_be, false);
assert.ok(tamHcmIn.tam_3_lop.don_gia_tu);
assert.ok(tamHcmIn.tam_3_lop.don_gia_den);
assert.strictEqual(Number(tamHcmIn.tam_3_lop.don_gia_den.replace(/\./g, "")) - Number(tamHcmIn.tam_3_lop.don_gia_tu.replace(/\./g, "")), 100);

// ---- HCM c\u00f3 in nh\u01b0ng ch\u01b0a \u0111\u1ea1t 2,5 tri\u1ec7u: tr\u1ea3 kho\u1ea3ng t\u1ea1m t\u00ednh ----
const hcmChuaDatIn = customData(getPrice({ dia_chi: "HCM", loai_hop: NAP_CAI, dai: 20.1, rong: 15.1, cao: 15.1, so_luong: 200, in_an: true, so_mau_in: 1 }));
const giayChuaDat = hcmChuaDatIn.theo_loai_giay["3lop2nau"];
assert.strictEqual(giayChuaDat.dat_dieu_kien, false);
assert.ok(giayChuaDat.ly_do_khong_dat.includes("2.500.000"));
assert.ok(giayChuaDat.thanh_tien_tam_tinh_den);

// ---- \u01afu \u0111\u00e3i kh\u00f4ng ghi \u0111\u00e8 nhau: gi\u1ea3m 5% + mi\u1ec5n khu\u00f4n/b\u1ea3n in ----
const giayUuDai = hcmLarge.theo_loai_giay["3lop1nau"];
assert.ok(giayUuDai.ghi_chu_uu_dai.includes("0,95"));
assert.ok(giayUuDai.ghi_chu_uu_dai.includes("30 tri\u1ec7u"));

console.log("All pricing tests passed.");
