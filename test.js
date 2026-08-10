const assert = require("assert");
const { tinhMayBeHN, tinhGiaHCM } = require("./utils/formulas");
const { getPrice } = require("./utils/pricing-rules");
const { tinhGiaTam } = require("./utils/tam-carton");
const customData = (r) => r.data && r.data.size_yeu_cau ? r.data.size_yeu_cau : r.data;
const accepted = (d) => Object.values(d.theo_loai_giay).find((p) => p.dat_dieu_kien);
const formatPrice = (n) => n.toLocaleString("vi-VN").replace(/,/g, ".");
const DOI_KHAU = "\u0110\u1ed1i kh\u1ea9u";
const HOP_GIAY = "H\u1ed9p gi\u00e0y";
const NAP_CAI = "N\u1eafp c\u00e0i 2 \u0111\u1ea7u";

const bat = tinhMayBeHN(DOI_KHAU, 20, 8, 8, 1000);
assert.deepStrictEqual({ G: bat.batNgang, H: bat.batDoc, soBat: bat.soBat, kho: bat.khoGiay, chat: bat.chat }, { G: 1, H: 6, soBat: 6, kho: 98, chat: 60.3 });
assert.strictEqual(bat.dienTichM2, 0.0985);

const hnDoiKhau = customData(getPrice({ dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20, rong: 8, cao: 8, so_luong: 5000 }));
assert.strictEqual(hnDoiKhau.bat_doc, 6);
assert.strictEqual(hnDoiKhau.chat_cm, 60.3);
assert.strictEqual(accepted(hnDoiKhau).phi_khuon_be, "600.000");

const hnGiay = customData(getPrice({ dia_chi: "HN", loai_hop: HOP_GIAY, dai: 10.1, rong: 6.1, cao: 3.1, so_luong: 10000 }));
assert.ok(hnGiay.so_bat >= 2);
assert.strictEqual(accepted(hnGiay).phi_khuon_be, "1.000.000");

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
console.log("All pricing tests passed.");
