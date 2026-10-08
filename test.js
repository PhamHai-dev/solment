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

// ---- Tất cả hộp HN: sỉ khi từ 300 hộp VÀ tổng giá lẻ trên 300.000đ ----
const giaHopGiayHN = (soLuong) => getPrice({
  dia_chi: "HN", loai_hop: HOP_GIAY, dai: 31, rong: 19, cao: 11, so_luong: soLuong
});
const hopGiay299 = giaHopGiayHN(299);
const hopGiay300 = giaHopGiayHN(300);
assert.strictEqual(hopGiay299.type, "pre_made");
assert.strictEqual(hopGiay299.data.gia_theo_so_luong.gia, "3.600");
assert.strictEqual(hopGiay300.data.gia_theo_so_luong.gia, "3.300");
assert.ok(hopGiay300.data.gia_theo_so_luong.muc_ap_dung.includes("và đơn trên 300.000"));

const giaHopPizzaHN = (soLuong) => getPrice({
  dia_chi: "HN", loai_hop: "Nắp gài pizza", dai: 12, rong: 8, cao: 4, so_luong: soLuong
});
assert.strictEqual(giaHopPizzaHN(300).data.gia_theo_so_luong.gia, "1.000");
assert.strictEqual(giaHopPizzaHN(301).data.gia_theo_so_luong.gia, "850");

// ---- Hộp có sẵn mặc định 3 lớp; 5 lớp phải đặt sản xuất; trả đúng loại sóng ----
const hnCoSanLop = getPrice({ dia_chi: "HN", loai_hop: HOP_GIAY, dai: 31, rong: 19, cao: 11 });
assert.strictEqual(hnCoSanLop.type, "pre_made");
assert.strictEqual(hnCoSanLop.data.so_lop, 3);
assert.strictEqual(hnCoSanLop.data.loai_song, "E");
assert.ok(hnCoSanLop.data.ghi_chu_so_lop.includes("5 lớp cần đặt sản xuất"));

const hcmCoSanLop = getPrice({ dia_chi: "HCM", loai_hop: DOI_KHAU, dai: 10, rong: 6, cao: 6 });
assert.strictEqual(hcmCoSanLop.type, "pre_made");
assert.strictEqual(hcmCoSanLop.data.so_lop, 3);
assert.strictEqual(hcmCoSanLop.data.loai_song, "E");
assert.ok(hcmCoSanLop.data.ghi_chu_so_lop.includes("5 lớp cần đặt sản xuất"));

const goiYCoSanLop = getPrice({ dia_chi: "HN", loai_hop: HOP_GIAY, dai: 30, rong: 19, cao: 11 });
assert.strictEqual(goiYCoSanLop.type, "custom_with_suggestions");
assert.strictEqual(goiYCoSanLop.data.size_gan_giong[0].so_lop, 3);
assert.strictEqual(goiYCoSanLop.data.size_gan_giong[0].loai_song, "E");
assert.ok(goiYCoSanLop.data.size_gan_giong[0].ghi_chu_so_lop.includes("5 lớp cần đặt sản xuất"));

// ---- 27 ảnh chuẩn được đồng bộ vào 40 SKU HN/HCM; toàn bộ 93 SKU có ảnh ----
const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./utils/data");
const tenAnhMoi = new Set([
  "10x3x18.jpg", "10x5x15.jpg", "12x8x4.jpg", "12x8x12.jpg", "12x12x12.jpg", "14x12x4.jpg",
  "15x10x5.jpg", "15x15x5.jpg", "15x15x10.jpg", "16x6x6.jpg", "16x12x6.jpg",
  "10x4x18.jpg", "18x12x4.jpg", "20x15x6.jpg", "25x15x5.jpg", "25x15x20.jpg",
  "25x17x3.jpg", "25x20x6.jpg", "30x15x10.jpg", "30x20x5.jpg", "30x20x7.jpg",
  "30x20x10.jpg", "30x20x15.jpg", "30x25x6.jpg", "31x19x11.jpg", "35x25x7.jpg",
  "35x25x15.jpg"
]);
const tatCaSku = [...SIZE_CO_SAN_HN, ...SIZE_CO_SAN_HCM];
const skuCoAnhMoi = tatCaSku.filter((hop) => tenAnhMoi.has(hop.hinh_anh.split("/").pop()));
assert.strictEqual(tenAnhMoi.size, 27);
assert.strictEqual(skuCoAnhMoi.length, 40);
assert.ok(tatCaSku.every((hop) => hop.hinh_anh.startsWith("https://amqkxxpqkoagqqephtgl.supabase.co/storage/v1/object/public/image_box/")));
assert.ok(skuCoAnhMoi.every((hop) => /\/[^\s()]+\.jpg$/.test(hop.hinh_anh)));
assert.ok(skuCoAnhMoi.every((hop) => !hop.hinh_anh.includes("-01")));

// ---- Loại sóng: đủ 93 SKU, đúng phân bố và khác biệt giữa hai khu vực ----
const demLoaiSong = (items) => items.reduce((result, hop) => {
  result[hop.loai_song] = (result[hop.loai_song] || 0) + 1;
  return result;
}, {});
assert.strictEqual(SIZE_CO_SAN_HN.length, 53);
assert.strictEqual(SIZE_CO_SAN_HCM.length, 40);
assert.ok(tatCaSku.every((hop) => ["E", "B", "C"].includes(hop.loai_song)));
assert.deepStrictEqual(demLoaiSong(SIZE_CO_SAN_HN), { E: 36, B: 12, C: 5 });
assert.deepStrictEqual(demLoaiSong(SIZE_CO_SAN_HCM), { E: 14, B: 24, C: 2 });
const timSku = (items, loaiHop, D, R, C) => items.find((hop) =>
  hop.loai_hop === loaiHop && hop.D === D && hop.R === R && hop.C === C
);
assert.strictEqual(timSku(SIZE_CO_SAN_HN, DOI_KHAU, 12, 12, 12).loai_song, "E");
assert.strictEqual(timSku(SIZE_CO_SAN_HCM, DOI_KHAU, 12, 12, 12).loai_song, "B");
assert.strictEqual(timSku(SIZE_CO_SAN_HN, DOI_KHAU, 15, 10, 10).loai_song, "E");
assert.strictEqual(timSku(SIZE_CO_SAN_HCM, DOI_KHAU, 15, 10, 10).loai_song, "B");
assert.strictEqual(timSku(SIZE_CO_SAN_HCM, DOI_KHAU, 40, 30, 20).loai_song, "C");
assert.strictEqual(timSku(SIZE_CO_SAN_HCM, "Nắp gài pizza", 12, 8, 4).loai_song, "E");

// ---- Đa thương hiệu: routing, dataset hộp và giá sản xuất dùng chung ----
const { HT_CARTON_ID } = require("./utils/brand-config");
const { OTHER_BRAND_DATA } = require("./utils/other-brand-data");
const OTHER_BRAND_ID = "987654321";

const legacyDefaultBrand = getPrice({ dia_chi: "HN", loai_hop: HOP_GIAY, dai: 31, rong: 19, cao: 11 });
assert.strictEqual(legacyDefaultBrand.thuong_hieu_id, HT_CARTON_ID);
assert.strictEqual(legacyDefaultBrand.cum_thuong_hieu, "HT_CARTON");
assert.strictEqual(legacyDefaultBrand.thuong_hieu_mac_dinh, true);
assert.strictEqual(getPrice({ thuong_hieu_id: "", dia_chi: "HN", dai: 10, rong: 10, cao: 10 }).success, false);

assert.strictEqual(OTHER_BRAND_DATA.HN.boxes.length, 53);
assert.strictEqual(OTHER_BRAND_DATA.HCM.boxes.length, 40);
assert.strictEqual(OTHER_BRAND_DATA.HN.accessories.tapes.length, 3);
assert.strictEqual(OTHER_BRAND_DATA.HCM.accessories.tapes.length, 3);
assert.strictEqual(OTHER_BRAND_DATA.HN.accessories.bubble_wrap.length, 8);
assert.strictEqual(OTHER_BRAND_DATA.HCM.accessories.bubble_wrap.length, 5);
assert.strictEqual(OTHER_BRAND_DATA.HN.accessories.pe_shipping_bags.length, 8);
assert.strictEqual(OTHER_BRAND_DATA.HCM.accessories.pe_shipping_bags.length, 8);

const correctedHnBox = getPrice({
  thuong_hieu_id: OTHER_BRAND_ID, dia_chi: "HN", loai_hop: "Nắp gài pizza",
  dai: 25, rong: 20, cao: 6, so_luong: 1
});
assert.strictEqual(correctedHnBox.type, "pre_made");
assert.strictEqual(correctedHnBox.data.kich_thuoc, "25x20x6 cm");
assert.strictEqual(correctedHnBox.data.gia_theo_so_luong.gia, "2.330");
assert.strictEqual(correctedHnBox.data.bang_gia.length, 1);
assert.ok(correctedHnBox.data.bang_gia[0].muc.includes("mọi số lượng"));
assert.ok(!OTHER_BRAND_DATA.HN.boxes.some((box) => box.D === 26 && box.R === 20 && box.C === 5));

const otherHcmBox = (quantity) => getPrice({
  thuong_hieu_id: OTHER_BRAND_ID, dia_chi: "HCM", loai_hop: "Nắp gài pizza",
  dai: 25, rong: 20, cao: 6, so_luong: quantity
});
assert.strictEqual(otherHcmBox(299).data.gia_theo_so_luong.gia, "2.700");
assert.strictEqual(otherHcmBox(300).data.gia_theo_so_luong.gia, "2.600");
assert.strictEqual(otherHcmBox(1000).data.gia_theo_so_luong.gia, "2.550");

const customInput = { dia_chi: "HN", loai_hop: DOI_KHAU, dai: 20.1, rong: 10.1, cao: 10.1, so_luong: 2000 };
const customHt = getPrice({ ...customInput, thuong_hieu_id: HT_CARTON_ID });
const customOther = getPrice({ ...customInput, thuong_hieu_id: OTHER_BRAND_ID });
assert.deepStrictEqual(customHt.data.size_yeu_cau, customOther.data.size_yeu_cau);
const tamInput = { dia_chi: "HN", loai_san_pham: "Tấm carton", dai: 70, rong: 30, so_luong: 1000 };
assert.deepStrictEqual(
  getPrice({ ...tamInput, thuong_hieu_id: HT_CARTON_ID }).data,
  getPrice({ ...tamInput, thuong_hieu_id: OTHER_BRAND_ID }).data
);

// ---- Sub-brand routing: mỗi brand trong OTHER_BRANDS có bộ ảnh riêng ----
const VN_BOX_ID = "100298786195956";
const BAO_BI_VIET_ID = "104878245974807";

const vnBoxBox = getPrice({
  thuong_hieu_id: VN_BOX_ID, dia_chi: "HN", loai_hop: "Đối khẩu",
  dai: 10, rong: 6, cao: 6, so_luong: 100
});
assert.strictEqual(vnBoxBox.success, true);
assert.strictEqual(vnBoxBox.cum_thuong_hieu, "OTHER_BRANDS");
assert.strictEqual(vnBoxBox.sub_brand_id, VN_BOX_ID);
assert.strictEqual(vnBoxBox.sub_brand_cluster, "VN_BOX");
assert.strictEqual(vnBoxBox.sub_brand_mac_dinh, true);
assert.ok(vnBoxBox.data.hinh_anh.includes("/VN_BOX/"));

const baoBiVietBox = getPrice({
  thuong_hieu_id: BAO_BI_VIET_ID, dia_chi: "HN", loai_hop: "Đối khẩu",
  dai: 10, rong: 6, cao: 6, so_luong: 100
});
assert.strictEqual(baoBiVietBox.success, true);
assert.strictEqual(baoBiVietBox.cum_thuong_hieu, "OTHER_BRANDS");
assert.strictEqual(baoBiVietBox.sub_brand_id, BAO_BI_VIET_ID);
assert.strictEqual(baoBiVietBox.sub_brand_cluster, "BAO_BI_VIET");
assert.strictEqual(baoBiVietBox.sub_brand_mac_dinh, false);
assert.ok(baoBiVietBox.data.hinh_anh.includes("/BBV/"));

// Giá và chính sách giống nhau, chỉ ảnh khác nhau
assert.strictEqual(
  baoBiVietBox.data.gia_theo_so_luong.gia,
  vnBoxBox.data.gia_theo_so_luong.gia
);
assert.notStrictEqual(baoBiVietBox.data.hinh_anh, vnBoxBox.data.hinh_anh);

// Brand lạ (không phải VN_BOX/BBV) fallback về VN_BOX
const unknownBrandBox = getPrice({
  thuong_hieu_id: "999999999", dia_chi: "HN", loai_hop: "Đối khẩu",
  dai: 10, rong: 6, cao: 6
});
assert.strictEqual(unknownBrandBox.success, true);
assert.strictEqual(unknownBrandBox.sub_brand_cluster, "VN_BOX");
assert.ok(unknownBrandBox.data.hinh_anh.includes("/VN_BOX/"));

// HT Carton không có sub-brand metadata
const htBox = getPrice({
  thuong_hieu_id: HT_CARTON_ID, dia_chi: "HN", loai_hop: "Đối khẩu",
  dai: 10, rong: 6, cao: 6
});
assert.strictEqual(htBox.success, true);
assert.strictEqual(htBox.cum_thuong_hieu, "HT_CARTON");
assert.strictEqual(htBox.sub_brand_id, undefined);
assert.strictEqual(htBox.sub_brand_cluster, undefined);

// ---- Fallback ảnh HT khi BBV thiếu ảnh SKU ----
const bbvMissingHn = ["14x12x4", "18x12x4", "10x4x18"];
bbvMissingHn.forEach((k) => {
  const [d, r, c] = k.split("x").map(Number);
  const res = getPrice({
    thuong_hieu_id: BAO_BI_VIET_ID, dia_chi: "HN", dai: d, rong: r, cao: c
  });
  assert.strictEqual(res.success, true, `BBV HN ${k} phải tra được`);
  assert.ok(
    res.data.hinh_anh.includes("/image_box/"),
    `BBV HN ${k} phải fallback ảnh HT, nhận: ${res.data.hinh_anh}`
  );
});

const bbvMissingHcm = ["18x12x4", "10x3x18"];
bbvMissingHcm.forEach((k) => {
  const [d, r, c] = k.split("x").map(Number);
  const res = getPrice({
    thuong_hieu_id: BAO_BI_VIET_ID, dia_chi: "HCM", dai: d, rong: r, cao: c
  });
  assert.strictEqual(res.success, true, `BBV HCM ${k} phải tra được`);
  assert.ok(
    res.data.hinh_anh.includes("/image_box/"),
    `BBV HCM ${k} phải fallback ảnh HT, nhận: ${res.data.hinh_anh}`
  );
});

// SKU BBV có ảnh riêng thì không fallback
const bbvHasImage = getPrice({
  thuong_hieu_id: BAO_BI_VIET_ID, dia_chi: "HN", dai: 10, rong: 6, cao: 6
});
assert.ok(bbvHasImage.data.hinh_anh.includes("/BBV/"));

// ---- Ưu đãi HN chỉ tính tiền hộp: mốc 2/5/9/12 triệu và upsell từ 90% ----
const discountedHnBox = (subtotal) => getPrice({
  thuong_hieu_id: OTHER_BRAND_ID, dia_chi: "HN", loai_hop: HOP_GIAY,
  dai: 31, rong: 19, cao: 11, so_luong: 1,
  tong_tien_hop_truoc_chiet_khau: subtotal
}).data.uu_dai_don_hop;
assert.strictEqual(discountedHnBox(1999999).ty_le_chiet_khau, 0);
assert.strictEqual(discountedHnBox(2000000).ty_le_chiet_khau, 4);
assert.strictEqual(discountedHnBox(2000000).tien_chiet_khau, "80.000");
assert.strictEqual(discountedHnBox(5000000).ty_le_chiet_khau, 6);
assert.strictEqual(discountedHnBox(9000000).ty_le_chiet_khau, 7);
assert.strictEqual(discountedHnBox(12000000).ty_le_chiet_khau, 8);
assert.strictEqual(discountedHnBox(1800000).goi_y_upsell.can_mua_them_tien_hop, "200.000");
assert.strictEqual(discountedHnBox(4900000).goi_y_upsell.can_mua_them_tien_hop, "100.000");
assert.ok(discountedHnBox(2500000).ghi_chu_pham_vi.includes("không áp dụng cho băng dính"));
assert.strictEqual(discountedHnBox(2500000).ly_do_chiet_khau, "Đơn hộp đạt mức ≥ 2.000.000đ nên được chiết khấu 4%.");
assert.strictEqual(discountedHnBox(5000000).ly_do_chiet_khau, "Đơn hộp đạt mức ≥ 5.000.000đ nên được chiết khấu 6%.");
assert.strictEqual(discountedHnBox(12000000).ly_do_chiet_khau, "Đơn hộp đạt mức ≥ 12.000.000đ nên được chiết khấu 8%.");
assert.strictEqual(discountedHnBox(1999999).ly_do_chiet_khau, "Đơn hộp chưa đạt mức chiết khấu tối thiểu 2.000.000đ.");
assert.strictEqual(Object.prototype.hasOwnProperty.call(otherHcmBox(1000).data, "uu_dai_don_hop"), false);
assert.strictEqual(Object.prototype.hasOwnProperty.call(hopGiay300.data, "uu_dai_don_hop"), false);

// ---- Phụ kiện thương hiệu khác: catalog và các bậc giá ----
const accessory = (data) => getPrice({ thuong_hieu_id: OTHER_BRAND_ID, ...data });
const tapeHn = (quantity) => accessory({
  dia_chi: "HN", loai_san_pham: "Băng dính", ten_san_pham: "Băng dính 0,5kg", so_luong: quantity
});
assert.strictEqual(tapeHn(5).data.gia_theo_so_luong.gia, "25.000");
assert.strictEqual(tapeHn(6).data.gia_theo_so_luong.gia, "23.000");
assert.strictEqual(accessory({ dia_chi: "HCM", loai_san_pham: "Băng dính" }).data.length, 3);

const bubbleHn = (quantity) => accessory({
  dia_chi: "HN", loai_san_pham: "Xốp chống sốc", kich_thuoc: "20cmx100m",
  so_luong: quantity, don_vi_so_luong: "cay"
});
assert.strictEqual(bubbleHn(24).data.can_xac_nhan_gia, true);
assert.strictEqual(bubbleHn(25).data.gia_theo_so_luong.gia, "256.000");
assert.strictEqual(bubbleHn(39).data.gia_theo_so_luong.gia, "256.000");
assert.strictEqual(bubbleHn(40).data.gia_theo_so_luong.gia, "236.000");
const bubbleHcm = accessory({
  dia_chi: "HCM", loai_san_pham: "Xốp chống sốc", kich_thuoc: "20cmx100m",
  so_luong: 25, don_vi_so_luong: "cay"
});
assert.strictEqual(bubbleHcm.data.can_xac_nhan_gia, true);
assert.strictEqual(bubbleHcm.data.bang_gia[1].gia, null);
assert.strictEqual(accessory({
  dia_chi: "HN", loai_san_pham: "Xốp chống sốc", kich_thuoc: "20cmx100m", so_luong: 2
}).success, false);

const bagPrice = (region, quantity, color) => accessory({
  dia_chi: region, loai_san_pham: "Túi niêm phong", kich_thuoc: "15x25cm", mau: color, so_luong: quantity
}).data.gia_theo_so_luong.gia;
assert.strictEqual(bagPrice("HN", 24, "den"), "38.000");
assert.strictEqual(bagPrice("HN", 25, "den"), "35.000");
assert.strictEqual(bagPrice("HN", 25, "hồng"), "40.000");
assert.strictEqual(bagPrice("HCM", 249, "den"), "42.000");
assert.strictEqual(bagPrice("HCM", 250, "den"), "40.000");
assert.strictEqual(bagPrice("HCM", 250, "xanh"), "43.000");
assert.strictEqual(accessory({ dia_chi: "HN", loai_san_pham: "Túi niêm phong" }).data.length, 8);
assert.strictEqual(Object.prototype.hasOwnProperty.call(tapeHn(6).data, "uu_dai_don_hop"), false);

const htAccessory = getPrice({
  thuong_hieu_id: HT_CARTON_ID, dia_chi: "HN", loai_san_pham: "Băng dính"
});
assert.strictEqual(htAccessory.success, false);
assert.strictEqual(htAccessory.missing_info, true);
assert.strictEqual(htAccessory.type, "accessory_data_unavailable");

console.log("All pricing tests passed.");
