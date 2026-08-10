const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./data");
const { tinhMayBeHN, tinhMayBoHN, tinhGiaHCM } = require("./formulas");
const { tinhGiaTam } = require("./tam-carton");

const formatPrice = (num) => {
  if (num === null || num === undefined) return num;
  if (typeof num === "number" && !Number.isFinite(num)) return null;
  const rounded = typeof num === "number" ? Math.round(num) : num;
  return String(rounded).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

const NO_IMAGE_MESSAGE = "Size này chưa có ảnh minh hoạ.";
const getHinhAnh = (box) => (box && box.hinh_anh ? box.hinh_anh : NO_IMAGE_MESSAGE);

const LOAI_HOP_HOP_LE_HN = [
  "Đối khẩu", "Nắp chồm", "Nắp cài 2 đầu", "Hộp nắp chùm",
  "Hộp giày", "Nắp gài pizza", "Vách ngăn", "Hộp pizza"
];
const LOAI_HOP_HOP_LE_HCM = [
  "Đối khẩu", "Nắp chồm", "Nắp cài 2 đầu", "Nắp gài đáy khóa",
  "Hộp nắp chùm", "Hộp giày", "Nắp gài pizza", "Vách ngăn"
];

const LOAI_HOP_CHUA_CO_CONG_THUC_RIENG = {
  HN: ["Nắp gài đáy khóa", "Vách ngăn"],
  HCM: ["Nắp gài đáy khóa", "Hộp nắp chùm", "Vách ngăn"]
};

function tinhPhiKhuonBeGoc(diaChi, loaiHop, soBat = 1) {
  const nhieuBat = soBat >= 2;

  if (diaChi === "HCM") {
    if (loaiHop === "Vách ngăn") return 600000;
    return nhieuBat ? 1200000 : 800000;
  }

  const nhomGiaCao = ["Hộp giày", "Hộp nắp chùm", "Nắp gài pizza", "Hộp pizza"];
  if (nhomGiaCao.indexOf(loaiHop) !== -1) {
    return nhieuBat ? 1000000 : 800000;
  }
  return 600000;
}

function calculateCustomSize(diaChi, loaiHopInput, D, R, C, SL, inAn, mauIn, banInPhucTap, ghiChuTam, giaHopCoSanKhongIn = null) {
  let finalLoaiHop = loaiHopInput || "Đối khẩu";
  let ghiChuChung = loaiHopInput ? "" : "Đã mặc định loại hộp là Đối khẩu do không nhận được yêu cầu loại cụ thể. ";

  if (LOAI_HOP_CHUA_CO_CONG_THUC_RIENG[diaChi].indexOf(finalLoaiHop) !== -1) {
    ghiChuChung += `Loại hộp '${finalLoaiHop}' chưa có công thức riêng tại ${diaChi}, đang tạm tính theo công thức loại gần nhất (CẦN XÁC NHẬN LẠI). `;
  }

  let canKhuonBe = true;
  if (finalLoaiHop === "Đối khẩu") {
    if (diaChi === "HN") {
      const datMayBo = (D >= 17.5 && R >= 6.5 && C >= 7 && C <= 42 && (C + R) >= 24);
      canKhuonBe = !datMayBo;
    } else if (diaChi === "HCM") {
      const datMayBo = (D >= 27 && R >= 25 && C >= 10 && (C + R) >= 37.5);
      canKhuonBe = !datMayBo;
    }
  }

  let phiBanInGoc = 0;
  let donGiaInMin = 0;
  let donGiaInMax = 0;
  if (inAn) {
    const soMau = mauIn || 1;
    phiBanInGoc = 500000 * soMau;
    if (diaChi === "HCM") {
      const giaMinMoiMau = banInPhucTap ? 500 : 300;
      const giaMaxMoiMau = banInPhucTap ? 1000 : 400;
      donGiaInMin = giaMinMoiMau * soMau;
      donGiaInMax = giaMaxMoiMau * soMau;
      ghiChuChung += `Công in ${soMau} màu: khoảng ${formatPrice(donGiaInMin)}–${formatPrice(donGiaInMax)}đ/hộp (${banInPhucTap ? "in phức tạp/nhiều mặt" : "in đơn giản"}). Giá chính xác cần CTV chốt theo size, số lượng và nội dung in. Phí bản in: ${soMau} bản x 500.000đ/bản. `;
    } else {
      donGiaInMin = 150 * soMau;
      donGiaInMax = donGiaInMin;
      ghiChuChung += `Công in ${soMau} màu, đơn giá ${formatPrice(donGiaInMin)}đ/hộp. Phí bản in: ${soMau} bản x 500.000đ/bản. `;
    }
  }

  const slToCalc = SL || 500;

  let calcResult;
  if (diaChi === "HCM") {
    calcResult = tinhGiaHCM(finalLoaiHop, D, R, C, slToCalc);
    if (!canKhuonBe) {
      calcResult.phuong_phap = "Máy bổ tại TP.HCM (không cần khuôn bế)";
      calcResult.loaiMay = "may_bo";
      calcResult.batNgang = 0;
      calcResult.batDoc = 0;
      calcResult.soBat = 0;
    }
  } else {
    if (canKhuonBe) calcResult = tinhMayBeHN(finalLoaiHop, D, R, C, slToCalc);
    else calcResult = tinhMayBoHN(D, R, C, slToCalc);
  }

  const minCanh = Math.min(D, R, C);
  const maxCanh = Math.max(D, R, C);
  const tiLeBatThuong = minCanh < maxCanh / 6;
  if (tiLeBatThuong) {
    ["gia_3lop1nau", "gia_3lop2nau", "gia_trangnau", "gia_5lop1nau", "gia_5lop2nau"].forEach((key) => {
      if (calcResult[key]) calcResult[key] = Math.round(calcResult[key] * 1.15);
    });
    ghiChuChung += "Hộp có tỉ lệ cạnh chênh lệch lớn, khuyên đổi sang hộp pizza. Nếu giữ nguyên, giá đã cộng phụ phí 15%. ";
  }

  const phiKhuonBeGoc = canKhuonBe
    ? tinhPhiKhuonBeGoc(diaChi, finalLoaiHop, calcResult.soBat)
    : 0;

  const khoGiay = calcResult.khoGiay || 0;
  const chat = calcResult.chat || 0;

  const lyDoNangNguong = [];
  if (inAn && mauIn > 6) {
    lyDoNangNguong.push(`số màu in > 6 (${mauIn} màu)`);
  }
  const vuot = lyDoNangNguong.length > 0;

  if (diaChi === "HN" && vuot) {
    ghiChuChung += `Áp dụng ngưỡng đơn tối thiểu 6.000.000đ do: ${lyDoNangNguong.join(", ")}. `;
  }
  if (diaChi === "HCM" && vuot) {
    ghiChuChung += `Đơn thuộc diện yêu cầu tối thiểu 6.000.000đ do: ${lyDoNangNguong.join(", ")} (áp dụng riêng cho từng loại giấy). `;
  }

  const papers = [
    { key: "gia_3lop1nau", name: "3lop1nau" },
    { key: "gia_3lop2nau", name: "3lop2nau" },
    { key: "gia_trangnau", name: "TrangNau" },
    { key: "gia_5lop1nau", name: "5lop1nau" },
    { key: "gia_5lop2nau", name: "5lop2nau" }
  ];

  const theo_loai_giay = {};

  papers.forEach((paper) => {
    let donGiaGoc = calcResult[paper.key];
    if (!donGiaGoc) return;

    if (giaHopCoSanKhongIn && paper.name === "3lop1nau") {
      donGiaGoc = giaHopCoSanKhongIn;
      if (!ghiChuChung.includes("Áp dụng giá phôi")) {
        ghiChuChung += "Áp dụng giá phôi của hộp có sẵn cho giấy 3 lớp 1 nâu. ";
      }
    }

    let donGiaCuoi = donGiaGoc + donGiaInMin;
    let donGiaCuoiMax = donGiaGoc + donGiaInMax;
    let thanhTienHop = donGiaCuoi * slToCalc;
    let thanhTienHopMax = donGiaCuoiMax * slToCalc;

    let dieuKienCoBanDat;
    let lyDoChuaDatCoBan = [];
    let slCanThietDeDat = null;

    if (diaChi === "HCM") {
      const datNhanDonTheoTienVaSl =
        (!inAn || thanhTienHop > 2500000) &&
        ((thanhTienHop > 1500000 && slToCalc > 1000) ||
          (thanhTienHop > 3000000 && slToCalc >= 200));
      const datToiThieuMayBe = !canKhuonBe || slToCalc >= 1000;
      dieuKienCoBanDat = SL ? datNhanDonTheoTienVaSl && datToiThieuMayBe : false;

      if (SL && !dieuKienCoBanDat) {
        if (inAn && thanhTienHop <= 2500000) {
          lyDoChuaDatCoBan.push(
            `đơn có in cần tối thiểu 2.500.000đ (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ)`
          );
        } else if (!datNhanDonTheoTienVaSl) {
          lyDoChuaDatCoBan.push(
            `chưa đạt một trong hai điều kiện: trên 1,5 triệu với trên 1.000 chiếc hoặc trên 3 triệu với từ 200 chiếc (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ/${formatPrice(slToCalc)} chiếc)`
          );
        }
        if (!datToiThieuMayBe) {
          lyDoChuaDatCoBan.push(`hộp/vách ngăn chạy máy bế nhận từ 1.000 tấm (hiện tại ${formatPrice(slToCalc)})`);
        }

        const slNhanh1500 = Math.max(Math.floor(1500000 / donGiaCuoi) + 1, 1001);
        const slNhanh3000 = Math.max(Math.floor(3000000 / donGiaCuoi) + 1, 200);
        slCanThietDeDat = Math.min(slNhanh1500, slNhanh3000);
        if (inAn) {
          slCanThietDeDat = Math.max(slCanThietDeDat, Math.floor(2500000 / donGiaCuoi) + 1);
        }
        if (canKhuonBe) slCanThietDeDat = Math.max(slCanThietDeDat, 1000);
      }
    } else {
      const nguongTienCoBan = vuot ? 6000000 : (inAn ? 2500000 : 2000000);
      dieuKienCoBanDat = SL ? (thanhTienHop >= nguongTienCoBan && slToCalc >= 200) : false;

      if (SL && !dieuKienCoBanDat) {
        if (thanhTienHop < nguongTienCoBan) {
          lyDoChuaDatCoBan.push(`chưa đạt ${formatPrice(nguongTienCoBan)}đ (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ)`);
        }
        if (slToCalc < 200) {
          lyDoChuaDatCoBan.push(`chưa đạt số lượng tối thiểu 200 chiếc (hiện tại ${slToCalc})`);
        }
        const slCanDeDuTien = Math.ceil(nguongTienCoBan / donGiaCuoi);
        slCanThietDeDat = Math.max(slCanDeDuTien, 200);
      }
    }

    let dieuKienBuoc2Dat = true;
    let lyDoChuaDatBuoc2 = "";
    if (diaChi === "HCM" && dieuKienCoBanDat && vuot && thanhTienHop < 6000000) {
      dieuKienBuoc2Dat = false;
      lyDoChuaDatBuoc2 = `thuộc diện quá khổ (${lyDoNangNguong.join(", ")}), cần đơn từ 6.000.000đ (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ)`;
    }

    const datDieuKienDonHang = dieuKienCoBanDat && dieuKienBuoc2Dat;
    const isDat = datDieuKienDonHang;

    if (isDat) {
      let phiKhuonBeCuoi = phiKhuonBeGoc;
      let phiBanInCuoi = phiBanInGoc;
      const ghiChuUuDai = [];

      if (diaChi === "HCM" && paper.name === "3lop1nau" && thanhTienHop > 6000000) {
        donGiaCuoi = Math.ceil(donGiaCuoi * 0.95);
        donGiaCuoiMax = Math.ceil(donGiaCuoiMax * 0.95);
        thanhTienHop = donGiaCuoi * slToCalc;
        thanhTienHopMax = donGiaCuoiMax * slToCalc;
        ghiChuUuDai.push("Đơn trên 6 triệu: giá 1 nâu bằng giá 2 nâu x 0,95.");
      }

      if (thanhTienHop >= 30000000) {
        phiKhuonBeCuoi = 0;
        phiBanInCuoi = 0;
        ghiChuUuDai.push("Đơn trên 30 triệu: miễn phí khuôn bế và bản in.");
      } else if (thanhTienHop >= 15000000) {
        if (phiKhuonBeGoc >= phiBanInGoc) {
          phiKhuonBeCuoi = 0;
          ghiChuUuDai.push("Đơn trên 15 triệu: miễn phí khuôn bế.");
        } else {
          phiBanInCuoi = 0;
          ghiChuUuDai.push("Đơn trên 15 triệu: miễn phí bản in.");
        }
      } else if (diaChi === "HN" && thanhTienHop >= 7000000) {
        phiKhuonBeCuoi = phiKhuonBeGoc * 0.5;
        ghiChuUuDai.push("Đơn trên 7 triệu: hỗ trợ 50% phí khuôn bế.");
      }

      const tongMin = Math.ceil((thanhTienHop + phiKhuonBeCuoi + phiBanInCuoi) / 1000) * 1000;
      const tongMax = Math.ceil((thanhTienHopMax + phiKhuonBeCuoi + phiBanInCuoi) / 1000) * 1000;
      theo_loai_giay[paper.name] = {
        dat_dieu_kien: true,
        ...(diaChi === "HCM" && inAn
          ? {
            don_gia_tu: formatPrice(donGiaCuoi),
            don_gia_den: formatPrice(donGiaCuoiMax),
            thanh_tien_tu: formatPrice(tongMin),
            thanh_tien_den: formatPrice(tongMax)
          }
          : {
            don_gia: formatPrice(donGiaCuoi),
            thanh_tien: formatPrice(tongMin)
          }),
        phi_khuon_be: formatPrice(Math.ceil(phiKhuonBeCuoi / 1000) * 1000),
        phi_ban_in: formatPrice(phiBanInCuoi),
        ghi_chu_uu_dai: ghiChuUuDai.join(" ")
      };
    } else {
      const reason = SL
        ? (lyDoChuaDatBuoc2 || lyDoChuaDatCoBan.join(", "))
        : "Khách chưa cung cấp số lượng (ước tính theo barem 500 cái)";

      const tamTinhMin = Math.ceil(thanhTienHop / 1000) * 1000;
      const tamTinhMax = Math.ceil(thanhTienHopMax / 1000) * 1000;
      theo_loai_giay[paper.name] = {
        dat_dieu_kien: false,
        dat_dieu_kien_don_hang: datDieuKienDonHang,
        thanh_tien_tam_tinh: formatPrice(tamTinhMin),
        ...(diaChi === "HCM" && inAn
          ? { thanh_tien_tam_tinh_den: formatPrice(tamTinhMax) }
          : {}),
        ly_do_khong_dat: reason,
        so_luong_can_dat_toi_thieu: slCanThietDeDat !== null ? formatPrice(slCanThietDeDat) : null
      };
    }
  });

  let thongBaoCtv = null;
  if (diaChi === "HCM" && SL && SL >= 15000) {
    thongBaoCtv = {
      can_bao_ctv: true,
      thong_bao_ctv:
        ` NHẮN CTV: Khách đặt ${SL.toLocaleString("vi-VN")} hộp` +
        ` | ${finalLoaiHop} ${D}x${R}x${C}cm.` +
        " Cần xác định size lớn/nhỏ trước khi xét hoàn khuôn bế và bản in;" +
        " hệ thống chưa tự động miễn/hoàn theo số lượng."
    };
  }

  return {
    loai_hop_ap_dung: finalLoaiHop,
    phuong_phap: calcResult.phuong_phap,
    kho_giay_cm: khoGiay,
    ...(diaChi === "HN" ? { chat_cm: chat } : {}),
    bat_ngang: calcResult.batNgang,
    bat_doc: calcResult.batDoc,
    so_bat: calcResult.soBat,
    ghi_chu_chung: (
      ghiChuChung +
      (diaChi === "HCM" ? " Số lượng sản xuất thực tế có thể chênh lệch ±5% so với số lượng đặt." : "")
    ).trim(),
    hinh_anh_minh_hoa: ghiChuTam || "",
    theo_loai_giay,
    thong_bao_ctv: thongBaoCtv
  };
}

function getPrice(requestData) {
  const { dia_chi, loai_hop, dai, rong, cao, so_luong, in_an, so_mau_in, ban_in_phuc_tap, loai_san_pham } = requestData;

  if (dia_chi !== "HN" && dia_chi !== "HCM") {
    return { success: false, message: "dia_chi không hợp lệ, phải là HN hoặc HCM." };
  }
  const diaChi = dia_chi;

  if (loai_san_pham === "Tấm carton") {
    return tinhGiaTam(diaChi, requestData, formatPrice);
  }

  const D = parseFloat(dai);
  const R = parseFloat(rong);
  const C = parseFloat(cao);

  if ([D, R, C].some((n) => !Number.isFinite(n) || n <= 0)) {
    return { success: false, message: "dai/rong/cao phải là số dương hợp lệ." };
  }
  if (so_luong !== undefined && so_luong !== null && (!Number.isFinite(Number(so_luong)) || Number(so_luong) <= 0)) {
    return { success: false, message: "so_luong phải là số dương hợp lệ." };
  }
  if (in_an === true || in_an === "true" || in_an === "1") {
    const mau = (so_mau_in === undefined || so_mau_in === null || so_mau_in === "") ? 1 : Number(so_mau_in);
    if (!Number.isInteger(mau) || mau < 1) {
      return { success: false, message: "so_mau_in phải là số nguyên dương." };
    }
  }

  if (loai_hop && String(loai_hop).toLowerCase().indexOf("âm dương") !== -1) {
    return { success: false, message: "Xưởng không nhận làm hộp âm dương." };
  }

  if (loai_hop) {
    const whitelist = diaChi === "HCM" ? LOAI_HOP_HOP_LE_HCM : LOAI_HOP_HOP_LE_HN;
    if (whitelist.indexOf(loai_hop) === -1) {
      return { success: false, message: `Loại hộp không hợp lệ, phải là một trong: ${whitelist.join(", ")}` };
    }
  }

  const arrCoSan = diaChi === "HCM" ? SIZE_CO_SAN_HCM : SIZE_CO_SAN_HN;
  let matches = [];
  const reqSorted = [D, R, C].sort((a, b) => b - a);

  for (let s of arrCoSan) {
    if (s.D === D && s.R === R && s.C === C) {
      if (loai_hop) {
        if (s.loai_hop.toLowerCase() === loai_hop.toLowerCase()) matches.push(s);
      } else {
        matches.push(s);
      }
    }
  }

  if (matches.length > 0 && !in_an) {
    if (matches.length === 1) {
      const matched = matches[0];
      let bangGia = [];
      if (diaChi === "HN") {
        bangGia.push({ muc: "Giá lẻ", gia: formatPrice(matched.gia_le) });
        bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(matched.gia_si) });
      } else {
        bangGia.push({ muc: "Giá lẻ", gia: formatPrice(matched.gia_le) });
        bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(matched.gia_si_300) });
        bangGia.push({ muc: "Giá sỉ (từ 1000 cái)", gia: formatPrice(matched.gia_si_1000) });
      }
      return {
        success: true,
        type: "pre_made",
        dia_chi: diaChi,
        message: "Tìm thấy hộp có sẵn phù hợp.",
        data: {
          loai_hop: matched.loai_hop,
          kich_thuoc: `${D}x${R}x${C} cm`,
          so_luong_yeu_cau: so_luong ? formatPrice(so_luong) : null,
          bang_gia: bangGia,
          ghi_chu: "Hộp có sẵn, mua ít cũng bán.",
          Hinh_anh: getHinhAnh(matched),
          hinh_anh: getHinhAnh(matched)
        }
      };
    } else {
      let dataArr = matches.map((matched) => {
        let bangGia = [];
        if (diaChi === "HN") {
          bangGia.push({ muc: "Giá lẻ", gia: formatPrice(matched.gia_le) });
          bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(matched.gia_si) });
        } else {
          bangGia.push({ muc: "Giá lẻ", gia: formatPrice(matched.gia_le) });
          bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(matched.gia_si_300) });
          bangGia.push({ muc: "Giá sỉ (từ 1000 cái)", gia: formatPrice(matched.gia_si_1000) });
        }
        return {
          loai_hop: matched.loai_hop,
          kich_thuoc: `${D}x${R}x${C} cm`,
          bang_gia: bangGia,
          ghi_chu: "",
          Hinh_anh: getHinhAnh(matched),
          hinh_anh: getHinhAnh(matched)
        };
      });
      return {
        success: true,
        type: "multiple_pre_made",
        dia_chi: diaChi,
        message: "Tìm thấy nhiều loại hộp có cùng kích thước. Vui lòng hỏi khách hàng chọn loại hộp nào.",
        data: dataArr
      };
    }
  }

  let giaPhoiCoSan = null;
  if (matches.length > 0 && in_an) {
    giaPhoiCoSan = matches[0].gia_si || matches[0].gia_si_300;
  }

  const customData = calculateCustomSize(diaChi, loai_hop, D, R, C, so_luong, in_an, so_mau_in, ban_in_phuc_tap, "", giaPhoiCoSan);

  if (matches.length > 0 && in_an) {
    return { success: true, type: "custom", dia_chi: diaChi, message: "Báo giá sản xuất in ấn trên form hộp có sẵn.", data: customData };
  }

  let bestEuclid = null;
  let minEuclidDist = Infinity;
  let bestFit = null;
  let minVolumeDiff = Infinity;
  const volReq = D * R * C;

  for (let s of arrCoSan) {
    const sSorted = [s.D, s.R, s.C].sort((a, b) => b - a);

    let dist = Math.sqrt(Math.pow(sSorted[0] - reqSorted[0], 2) + Math.pow(sSorted[1] - reqSorted[1], 2) + Math.pow(sSorted[2] - reqSorted[2], 2));
    if (dist < minEuclidDist) {
      minEuclidDist = dist;
      bestEuclid = s;
    }

    if (sSorted[0] >= reqSorted[0] && sSorted[1] >= reqSorted[1] && sSorted[2] >= reqSorted[2]) {
      let v = s.D * s.R * s.C;
      let diff = v - volReq;
      if (diff < minVolumeDiff) {
        minVolumeDiff = diff;
        bestFit = s;
      }
    }
  }

  let size_gan_giong = [];

  const formatCoSan = (box, tieuChi) => {
    let bangGia = [];
    if (diaChi === "HN") {
      bangGia.push({ muc: "Giá lẻ", gia: formatPrice(box.gia_le) });
      bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(box.gia_si) });
    } else {
      bangGia.push({ muc: "Giá lẻ", gia: formatPrice(box.gia_le) });
      bangGia.push({ muc: "Giá sỉ (từ 300 cái)", gia: formatPrice(box.gia_si_300) });
      bangGia.push({ muc: "Giá sỉ (từ 1000 cái)", gia: formatPrice(box.gia_si_1000) });
    }
    return {
      loai_hop: box.loai_hop,
      kich_thuoc: `${box.D}x${box.R}x${box.C} cm`,
      tieu_chi_tim_kiem: tieuChi,
      bang_gia: bangGia,
      Hinh_anh: getHinhAnh(box),
      hinh_anh: getHinhAnh(box)
    };
  };

  if (bestFit) size_gan_giong.push(formatCoSan(bestFit, "Gần nhất theo 3 cạnh đã sắp xếp (đựng vừa đồ)"));
  if (bestEuclid && (!bestFit || (bestEuclid.D !== bestFit.D || bestEuclid.R !== bestFit.R || bestEuclid.C !== bestFit.C))) {
    size_gan_giong.push(formatCoSan(bestEuclid, "Gần nhất theo form dáng tổng thể (Euclidean)"));
  }

  return {
    success: true,
    type: "custom_with_suggestions",
    dia_chi: diaChi,
    message: "Không có size có sẵn khớp chính xác. Gợi ý size gần nhất và báo giá sản xuất size yêu cầu.",
    data: { size_gan_giong, size_yeu_cau: customData }
  };
}

module.exports = { getPrice };