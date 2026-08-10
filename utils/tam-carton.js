// utils/tam-carton.js
//
// Port từ tinhGiaTam (GAS-HN) và tinhGiaTamHCM (GAS-HCM). 2 khu vực có công
// thức khác nhau ở cả điều kiện cần khuôn bế lẫn công thức giá gốc - giữ
// nguyên khác biệt gốc, không gộp chung.

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
    // GAS-HCM: điều kiện dùng && (khác HN dùng ||), và có 2 công thức giá gốc
    // tùy ngưỡng 3000.
    canKhuonBe = R < 25 && D < 60;
    const giaThuTruoc = D * R * 0.7;
    giaTamGoc = giaThuTruoc > 3000 ? giaThuTruoc : D * R * 0.8 + 200;
  } else {
    // GAS-HN: điều kiện dùng ||, công thức giá gốc duy nhất.
    canKhuonBe = R < 25 || D < 60;
    giaTamGoc = D * R * 0.7;
  }

  const phiThemMoiTam = canKhuonBe ? 200 : 0;
  const phiKhuonBe = canKhuonBe ? 600000 : 0;

  let donGiaTam3Lop = giaTamGoc + phiThemMoiTam;

  let phiBanIn = 0;
  let ghiChuIn = "";
  if (coIn && soMauIn > 0) {
    let donGiaMau;
    let congInMoiTam;
    if (diaChi === "HCM") {
      donGiaMau = banInPhucTap ? 750 : 350;
      congInMoiTam = donGiaMau * soMauIn;
      phiBanIn = (banInPhucTap ? 800000 : 600000) * soMauIn;
      ghiChuIn = ` Công in ${soMauIn} màu, đơn giá ${donGiaMau}đ/màu/tấm (đã cộng vào đơn giá tấm). Phí bản in: ${soMauIn} bản x ${banInPhucTap ? "800.000đ" : "600.000đ"}/bản.`;
    } else {
      if (donGiaTam3Lop < 5000) donGiaMau = 200;
      else if (donGiaTam3Lop < 10000) donGiaMau = 300;
      else donGiaMau = 500;
      congInMoiTam = donGiaMau * soMauIn;
      phiBanIn = (banInPhucTap ? 800000 : 500000) * soMauIn;
      ghiChuIn = ` Công in ${soMauIn} màu, đơn giá ${donGiaMau}đ/màu/tấm. Phí bản in: ${soMauIn} bản x ${banInPhucTap ? "800.000đ" : "500.000đ"}/bản.`;
    }
    donGiaTam3Lop += congInMoiTam;
  }

  const thanhTien3Lop = donGiaTam3Lop * SL + phiKhuonBe + phiBanIn;
  const donGiaTam5Lop = donGiaTam3Lop * 1.5;
  const thanhTien5Lop = donGiaTam5Lop * SL + phiKhuonBe + phiBanIn;

  const ghiChuKhuonBe =
    diaChi === "HCM"
      ? canKhuonBe
        ? "Tấm có Rộng<25cm VÀ Dài<60cm nên cần khuôn bế, đã cộng 200đ/tấm (áp dụng cho đơn giá 3 lớp trước khi nhân hệ số 5 lớp) và phí khuôn bế 600.000đ (1 lần)."
        : "Tấm không cần khuôn bế."
      : canKhuonBe
      ? "Tấm có Rộng<25cm hoặc Dài<60cm nên cần khuôn bế, đã cộng 200đ/tấm và phí khuôn bế 600.000đ (1 lần)."
      : "Tấm không cần khuôn bế.";

  return {
    success: true,
    type: "tam_carton",
    dia_chi: diaChi,
    data: {
      loai_san_pham: "Tấm carton",
      can_khuon_be: canKhuonBe,
      tam_3_lop: {
        don_gia_tam: formatPrice(Math.round(donGiaTam3Lop)),
        thanh_tien: formatPrice(Math.round(thanhTien3Lop))
      },
      tam_5_lop: {
        don_gia_tam: formatPrice(Math.round(donGiaTam5Lop)),
        thanh_tien: formatPrice(Math.round(thanhTien5Lop))
      },
      phi_khuon_be: formatPrice(phiKhuonBe),
      phi_ban_in: formatPrice(phiBanIn),
      ghi_chu: ghiChuKhuonBe + ghiChuIn
    }
  };
}

module.exports = {
  tinhGiaTam
};