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
    // HCM: tấm chỉ cần khuôn khi đồng thời R<25cm VÀ D<60cm.
    // Giữ công thức giá gốc riêng theo ngưỡng 3.000đ.
    canKhuonBe = R < 25 && D < 60;
    const giaThuTruoc = D * R * 0.7;
    giaTamGoc = giaThuTruoc > 3000 ? giaThuTruoc : D * R * 0.8 + 200;
  } else {
    // HN: chỉ cần một trong hai điều kiện R<25cm HOẶC D<60cm.
    canKhuonBe = R < 25 || D < 60;
    giaTamGoc = D * R * 0.7;
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
  const thanhTien3LopMin = donGiaTam3LopMin * SL + phiKhuonBe + phiBanIn;
  const thanhTien3LopMax = donGiaTam3LopMax * SL + phiKhuonBe + phiBanIn;
  const donGiaTam5LopMin = donGiaTam3LopMin * 1.5;
  const donGiaTam5LopMax = donGiaTam3LopMax * 1.5;
  const thanhTien5LopMin = donGiaTam5LopMin * SL + phiKhuonBe + phiBanIn;
  const thanhTien5LopMax = donGiaTam5LopMax * SL + phiKhuonBe + phiBanIn;

  const dieuKienKhuonBe = diaChi === "HCM"
    ? "Rộng<25cm và Dài<60cm"
    : "Rộng<25cm hoặc Dài<60cm";
  const ghiChuKhuonBe = canKhuonBe
    ? `Tấm có ${dieuKienKhuonBe} nên cần khuôn bế, đã cộng 200đ/tấm và phí khuôn bế ${formatPrice(phiKhuonBe)}đ (1 lần).`
    : "Tấm không cần khuôn bế.";

  const coKhoangGia = diaChi === "HCM" && coIn && soMauIn > 0;

  return {
    success: true,
    type: "tam_carton",
    dia_chi: diaChi,
    data: {
      loai_san_pham: "Tấm carton",
      can_khuon_be: canKhuonBe,
      tam_3_lop: coKhoangGia
        ? {
            don_gia_tu: formatPrice(Math.round(donGiaTam3LopMin)),
            don_gia_den: formatPrice(Math.round(donGiaTam3LopMax)),
            thanh_tien_tu: formatPrice(Math.round(thanhTien3LopMin)),
            thanh_tien_den: formatPrice(Math.round(thanhTien3LopMax))
          }
        : {
            don_gia_tam: formatPrice(Math.round(donGiaTam3LopMin)),
            thanh_tien: formatPrice(Math.round(thanhTien3LopMin))
          },
      tam_5_lop: coKhoangGia
        ? {
            don_gia_tu: formatPrice(Math.round(donGiaTam5LopMin)),
            don_gia_den: formatPrice(Math.round(donGiaTam5LopMax)),
            thanh_tien_tu: formatPrice(Math.round(thanhTien5LopMin)),
            thanh_tien_den: formatPrice(Math.round(thanhTien5LopMax))
          }
        : {
            don_gia_tam: formatPrice(Math.round(donGiaTam5LopMin)),
            thanh_tien: formatPrice(Math.round(thanhTien5LopMin))
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