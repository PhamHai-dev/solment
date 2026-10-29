// utils/tam-carton.js
//
// Port từ tinhGiaTam (GAS-HN) và tinhGiaTamHCM (GAS-HCM). 2 khu vực có công
// thức khác nhau ở cả điều kiện cần khuôn bế lẫn công thức giá gốc - giữ
// nguyên khác biệt gốc, không gộp chung.
// Update: Hệ số giá gốc mới là 0,735 (cũ là 0,7). Ngưỡng tối thiểu tiền tấm:
// tấm trơn nhận từ 2.000.000đ, tấm có in nhận từ 2.500.000đ.

function taoKetQuaTam({
  datDieuKien,
  coKhoangGia,
  donGiaMin,
  donGiaMax,
  thanhTienMin,
  thanhTienMax,
  tienTamMin,
  tienTamMax,
  slCanThiet,
  lyDoKhongDat,
  formatPrice
}) {
  if (datDieuKien) {
    return coKhoangGia
      ? {
        dat_dieu_kien: true,
        don_gia_tu: formatPrice(Math.round(donGiaMin)),
        don_gia_den: formatPrice(Math.round(donGiaMax)),
        thanh_tien_tu: formatPrice(Math.round(thanhTienMin)),
        thanh_tien_den: formatPrice(Math.round(thanhTienMax))
      }
      : {
        dat_dieu_kien: true,
        don_gia_tam: formatPrice(Math.round(donGiaMin)),
        thanh_tien: formatPrice(Math.round(thanhTienMin))
      };
  }

  return coKhoangGia
    ? {
      dat_dieu_kien: false,
      thanh_tien_tam_tinh: formatPrice(Math.round(tienTamMin)),
      thanh_tien_tam_tinh_den: formatPrice(Math.round(tienTamMax)),
      ly_do_khong_dat: lyDoKhongDat,
      so_luong_can_dat_toi_thieu: formatPrice(slCanThiet)
    }
    : {
      dat_dieu_kien: false,
      thanh_tien_tam_tinh: formatPrice(Math.round(tienTamMin)),
      ly_do_khong_dat: lyDoKhongDat,
      so_luong_can_dat_toi_thieu: formatPrice(slCanThiet)
    };
}

function tinhGiaTam(diaChi, data, formatPrice) {
  const D = Number(data.dai);
  const R = Number(data.rong);
  const SL = Number(data.so_luong);

  if (!D || !R || !SL) {
    return {
      success: false,
      message: "Thiếu thông tin: cần đủ dai, rong, so_luong cho tấm carton"
    };
  }

  const coIn = data.in_an === true;
  const soMauIn = coIn ? Number(data.so_mau_in || 0) : 0;
  const banInPhucTap = data.ban_in_phuc_tap === true;

  let canKhuonBe;
  let giaTamGoc;

  if (diaChi === "HCM") {
    // HCM: tấm chỉ cần khuôn khi đồng thời R<25cm VÀ D<60cm.
    // Hệ số mới 0,735; giữ công thức giá gốc riêng theo ngưỡng 3.000đ.
    canKhuonBe = R < 25 && D < 60;
    const giaThuTruoc = D * R * 0.735;
    giaTamGoc = giaThuTruoc > 3000 ? giaThuTruoc : D * R * 0.8 + 200;
  } else {
    // HN: chỉ cần một trong hai điều kiện R<25cm HOẶC D<60cm.
    canKhuonBe = R < 25 || D < 60;
    giaTamGoc = D * R * 0.735;
  }

  const phiThemMoiTam = canKhuonBe ? 200 : 0;
  const phiKhuonBe = canKhuonBe ? 600000 : 0;

  let donGiaTam3Lop = giaTamGoc + phiThemMoiTam;

  let phiBanIn = 0;
  let ghiChuIn = "";
  let donGiaMauMin = 0;
  let donGiaMauMax = 0;
  let congInMoiTamMin = 0;
  let congInMoiTamMax = 0;
  if (coIn && soMauIn > 0) {
    if (diaChi === "HCM") {
      // HCM trả KHOẢNG giá in (chưa có mức mặc định chính xác):
      // in đơn giản 300–400đ/màu/tấm, in phức tạp 500–1.000đ/màu/tấm.
      donGiaMauMin = banInPhucTap ? 500 : 300;
      donGiaMauMax = banInPhucTap ? 1000 : 400;
      congInMoiTamMin = donGiaMauMin * soMauIn;
      congInMoiTamMax = donGiaMauMax * soMauIn;
      phiBanIn = (banInPhucTap ? 800000 : 600000) * soMauIn;
      ghiChuIn = ` Công in ${soMauIn} màu, đơn giá khoảng ${formatPrice(donGiaMauMin)}–${formatPrice(donGiaMauMax)}đ/màu/tấm (đã cộng vào đơn giá tấm). Phí bản in: ${soMauIn} bản x ${banInPhucTap ? "800.000đ" : "600.000đ"}/bản.`;
    } else {
      if (donGiaTam3Lop < 5000) donGiaMauMin = 200;
      else if (donGiaTam3Lop < 10000) donGiaMauMin = 300;
      else donGiaMauMin = 500;
      donGiaMauMax = donGiaMauMin;
      congInMoiTamMin = donGiaMauMin * soMauIn;
      congInMoiTamMax = congInMoiTamMin;
      phiBanIn = (banInPhucTap ? 800000 : 500000) * soMauIn;
      ghiChuIn = ` Công in ${soMauIn} màu, đơn giá ${formatPrice(donGiaMauMin)}đ/màu/tấm. Phí bản in: ${soMauIn} bản x ${banInPhucTap ? "800.000đ" : "500.000đ"}/bản.`;
    }
  }

  const donGiaTam3LopMin = donGiaTam3Lop + congInMoiTamMin;
  const donGiaTam3LopMax = donGiaTam3Lop + congInMoiTamMax;
  const donGiaTam5LopMin = donGiaTam3LopMin * 1.5;
  const donGiaTam5LopMax = donGiaTam3LopMax * 1.5;

  // Tiền tấm thuần túy (chưa gồm khuôn bế và bản in) để xét ngưỡng tối thiểu
  const tienTam3LopMin = donGiaTam3LopMin * SL;
  const tienTam3LopMax = donGiaTam3LopMax * SL;
  const tienTam5LopMin = donGiaTam5LopMin * SL;
  const tienTam5LopMax = donGiaTam5LopMax * SL;

  // Thành tiền gồm khuôn bế và bản in khi đơn hàng đạt điều kiện
  const thanhTien3LopMin = tienTam3LopMin + phiKhuonBe + phiBanIn;
  const thanhTien3LopMax = tienTam3LopMax + phiKhuonBe + phiBanIn;
  const thanhTien5LopMin = tienTam5LopMin + phiKhuonBe + phiBanIn;
  const thanhTien5LopMax = tienTam5LopMax + phiKhuonBe + phiBanIn;

  // Ngưỡng tối thiểu: tấm trơn nhận từ 2tr, tấm có in nhận từ 2tr5
  const nguongTien = coIn ? 2500000 : 2000000;
  const datDieuKien3Lop = tienTam3LopMin >= nguongTien;
  const datDieuKien5Lop = tienTam5LopMin >= nguongTien;

  const slCanThiet3Lop = Math.ceil(nguongTien / donGiaTam3LopMin);
  const slCanThiet5Lop = Math.ceil(nguongTien / donGiaTam5LopMin);

  const taoLyDoKhongDat = (tienTam) => {
    return coIn
      ? `đơn có in cần tối thiểu 2.500.000đ (hiện tại ~${formatPrice(Math.round(tienTam))}đ)`
      : `đơn tấm trơn cần tối thiểu 2.000.000đ (hiện tại ~${formatPrice(Math.round(tienTam))}đ)`;
  };

  const dieuKienKhuonBe = diaChi === "HCM"
    ? "Rộng<25cm và Dài<60cm"
    : "Rộng<25cm hoặc Dài<60cm";
  const ghiChuKhuonBe = canKhuonBe
    ? `Tấm có ${dieuKienKhuonBe} nên cần khuôn bế, đã cộng 200đ/tấm và phí khuôn bế ${formatPrice(phiKhuonBe)}đ (1 lần).`
    : "Tấm không cần khuôn bế.";

  const coKhoangGia = diaChi === "HCM" && coIn && soMauIn > 0;

  const tam3LopData = taoKetQuaTam({
    datDieuKien: datDieuKien3Lop,
    coKhoangGia,
    donGiaMin: donGiaTam3LopMin,
    donGiaMax: donGiaTam3LopMax,
    thanhTienMin: thanhTien3LopMin,
    thanhTienMax: thanhTien3LopMax,
    tienTamMin: tienTam3LopMin,
    tienTamMax: tienTam3LopMax,
    slCanThiet: slCanThiet3Lop,
    lyDoKhongDat: taoLyDoKhongDat(tienTam3LopMin),
    formatPrice
  });

  const tam5LopData = taoKetQuaTam({
    datDieuKien: datDieuKien5Lop,
    coKhoangGia,
    donGiaMin: donGiaTam5LopMin,
    donGiaMax: donGiaTam5LopMax,
    thanhTienMin: thanhTien5LopMin,
    thanhTienMax: thanhTien5LopMax,
    tienTamMin: tienTam5LopMin,
    tienTamMax: tienTam5LopMax,
    slCanThiet: slCanThiet5Lop,
    lyDoKhongDat: taoLyDoKhongDat(tienTam5LopMin),
    formatPrice
  });

  return {
    success: true,
    type: "tam_carton",
    dia_chi: diaChi,
    data: {
      loai_san_pham: "Tấm carton",
      can_khuon_be: canKhuonBe,
      tam_3_lop: tam3LopData,
      tam_5_lop: tam5LopData,
      phi_khuon_be: formatPrice(phiKhuonBe),
      phi_ban_in: formatPrice(phiBanIn),
      ghi_chu: ghiChuKhuonBe + ghiChuIn
    }
  };
}

module.exports = {
  tinhGiaTam
};
