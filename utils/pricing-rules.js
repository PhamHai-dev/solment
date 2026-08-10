const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./data");
const { tinhMayBeHN, tinhMayBoHN, tinhGiaHCM } = require("./formulas");
const { tinhGiaTam } = require("./tam-carton");

// Helper: Format price string e.g. 1500000 -> 1.500.000
const formatPrice = (num) => {
  if (num === null || num === undefined) return num;
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

// Danh sách loại hộp hợp lệ - đúng theo whitelist của GAS gốc (giữ 2 whitelist
// hơi khác nhau giữa HN/HCM vì bản gốc vốn đã khác nhau: HN thêm "Hộp pizza",
// HCM thêm "Nắp gài đáy khóa").
const LOAI_HOP_HOP_LE_HN = [
  "Đối khẩu", "Nắp chồm", "Nắp cài 2 đầu", "Hộp nắp chùm",
  "Hộp giày", "Nắp gài pizza", "Vách ngăn", "Hộp pizza"
];
const LOAI_HOP_HOP_LE_HCM = [
  "Đối khẩu", "Nắp chồm", "Nắp cài 2 đầu", "Nắp gài đáy khóa",
  "Hộp nắp chùm", "Hộp giày", "Nắp gài pizza", "Vách ngăn"
];

// Loại hộp chưa có công thức riêng thật sự trong sheet/formulas - đang tạm
// tính theo công thức của loại khác (CẦN XÁC NHẬN LẠI), đúng cảnh báo GAS-HCM.
const LOAI_HOP_CHUA_CO_CONG_THUC_RIENG = ["Nắp gài đáy khóa", "Hộp nắp chùm", "Vách ngăn"];

// Phí khuôn bế gốc: hardcode theo loại hộp, ĐÚNG theo GAS gốc - danh sách
// loại hộp áp mức 800k khác nhau giữa HN và HCM (giữ nguyên khác biệt gốc,
// không tự ý gộp chung).
function tinhPhiKhuonBeGoc(diaChi, loaiHop) {
  if (diaChi === "HCM") {
    const nhom800k = ["Đối khẩu", "Nắp gài pizza", "Hộp nắp chùm"];
    return nhom800k.indexOf(loaiHop) !== -1 ? 800000 : 600000;
  }
  // HN
  const nhom800k = ["Hộp giày", "Hộp nắp chùm", "Nắp gài pizza", "Hộp pizza"];
  return nhom800k.indexOf(loaiHop) !== -1 ? 800000 : 600000;
}

function calculateCustomSize(diaChi, loaiHopInput, D, R, C, SL, inAn, mauIn, banInPhucTap, ghiChuTam, giaHopCoSanKhongIn = null) {
  let finalLoaiHop = loaiHopInput || "Đối khẩu";
  let ghiChuChung = loaiHopInput ? "" : "Đã mặc định loại hộp là Đối khẩu do không nhận được yêu cầu loại cụ thể. ";

  if (LOAI_HOP_CHUA_CO_CONG_THUC_RIENG.indexOf(finalLoaiHop) !== -1) {
    ghiChuChung += `Loại hộp '${finalLoaiHop}' chưa có công thức riêng, đang tạm tính theo công thức loại gần nhất (CẦN XÁC NHẬN LẠI). `;
  }

  // ---- Xác định máy bổ (không cần khuôn bế) - ngưỡng kích thước khác nhau
  // giữa HN và HCM, đúng theo GAS gốc. Chỉ áp dụng cho "Đối khẩu". ----
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

  // ---- Phí bản in: giữ nguyên cách tính hiện tại của Node.js (không có
  // trong phạm vi quyết định lần này) ----
  let phiBanInGoc = 0;
  let donGiaIn = 0;
  if (inAn) {
    const soMau = mauIn || 1;
    phiBanInGoc = 500000 * soMau;
    donGiaIn = 150 * soMau;
    ghiChuChung += `Công in ${soMau} màu, đơn giá ${formatPrice(donGiaIn)}đ/hộp. Phí bản in: ${soMau} bản x 500.000đ/bản. `;
  }

  const slToCalc = SL || 500;

  let calcResult;
  if (diaChi === "HCM") {
    calcResult = tinhGiaHCM(finalLoaiHop, D, R, C, slToCalc);
  } else {
    if (canKhuonBe) calcResult = tinhMayBeHN(finalLoaiHop, D, R, C, slToCalc);
    else calcResult = tinhMayBoHN(D, R, C, slToCalc);
  }

  // ---- Phụ phí tỉ lệ cạnh bất thường (+15%), đúng theo GAS gốc: áp dụng
  // khi cạnh nhỏ nhất < cạnh lớn nhất / 6, cộng vào MỌI loại giấy. ----
  const minCanh = Math.min(D, R, C);
  const maxCanh = Math.max(D, R, C);
  const tiLeBatThuong = minCanh < maxCanh / 6;
  if (tiLeBatThuong) {
    ["gia_3lop1nau", "gia_3lop2nau", "gia_trangnau", "gia_5lop1nau", "gia_5lop2nau"].forEach((key) => {
      if (calcResult[key]) calcResult[key] = Math.round(calcResult[key] * 1.15);
    });
    ghiChuChung += "Hộp có tỉ lệ cạnh chênh lệch lớn, khuyên đổi sang hộp pizza. Nếu giữ nguyên, giá đã cộng phụ phí 15%. ";
  }

  // ---- Phí khuôn bế gốc: hardcode theo loại hộp (quyết định: theo GAS gốc) ----
  const phiKhuonBeGoc = canKhuonBe ? tinhPhiKhuonBeGoc(diaChi, finalLoaiHop) : 0;

  // ---- Ngưỡng đơn tối thiểu cơ bản + rule "vượt khổ -> nâng ngưỡng 6 triệu",
  // đúng theo GAS-HN (quyết định: thêm lại như GAS). Áp dụng chung cho HN.
  // HCM dùng bộ điều kiện riêng (bước 1 + bước 2 tách biệt) theo GAS-HCM. ----
  const khoGiay = calcResult.khoGiay || 0;
  const chat = calcResult.chat || 0;

  const lyDoNangNguong = [];
  if (inAn && mauIn > 6) {
    lyDoNangNguong.push(`số màu in > 6 (${mauIn} màu)`);
  }
  const khoGiayVuotNguong = khoGiay > 92;
  const chatVuotNguong = chat > 220;
  if (khoGiayVuotNguong) lyDoNangNguong.push(`khổ giấy > 920mm (${khoGiay.toFixed(1)}cm)`);
  if (chatVuotNguong) lyDoNangNguong.push(`chặt > 2.200mm (${chat.toFixed(1)}cm)`);
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

    const donGiaCuoi = donGiaGoc + donGiaIn;
    const thanhTienHop = donGiaCuoi * slToCalc;

    // ---- Điều kiện đạt: khác nhau giữa HN và HCM theo quyết định của user ----
    let dieuKienCoBanDat;
    let lyDoChuaDatCoBan = [];
    let slCanThietDeDat = null;

    if (diaChi === "HCM") {
      // GAS-HCM: thanh_tien > 3.000.000 VÀ SL >= 500 VÀ Cao (C) > 15cm
      const nguongTienCoBan = 3000000;
      dieuKienCoBanDat = SL ? (thanhTienHop > nguongTienCoBan && slToCalc >= 500 && C > 15) : false;

      if (SL && !dieuKienCoBanDat) {
        if (!(thanhTienHop > nguongTienCoBan)) {
          lyDoChuaDatCoBan.push(`chưa đạt trên 3 triệu (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ)`);
        }
        if (slToCalc < 500) {
          lyDoChuaDatCoBan.push(`chưa đạt số lượng tối thiểu 500 chiếc (hiện tại ${slToCalc})`);
        }
        if (!(C > 15)) {
          lyDoChuaDatCoBan.push(`chiều cao hộp chưa lớn hơn 15cm (hiện tại ${C}cm)`);
        }
        // Không gợi ý số lượng nếu lý do là chiều cao hộp - đây là thông số cố định
        if (C > 15) {
          const slCanDeDuTien = Math.floor(nguongTienCoBan / donGiaCuoi) + 1;
          slCanThietDeDat = Math.max(slCanDeDuTien, 500);
        }
      }
    } else {
      // GAS-HN: thanh_tien >= nguongTien (2tr/2.5tr, hoặc 6tr nếu vượt khổ) VÀ SL >= 200
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

    // ---- Bước 2 riêng của HCM: nếu vượt khổ, loại giấy này phải tự đạt >= 6tr ----
    let dieuKienBuoc2Dat = true;
    let lyDoChuaDatBuoc2 = "";
    if (diaChi === "HCM" && dieuKienCoBanDat && vuot && thanhTienHop < 6000000) {
      dieuKienBuoc2Dat = false;
      lyDoChuaDatBuoc2 = `thuộc diện quá khổ (${lyDoNangNguong.join(", ")}), cần đơn từ 6.000.000đ (hiện tại ~${formatPrice(Math.round(thanhTienHop))}đ)`;
    }

    const isDat = dieuKienCoBanDat && dieuKienBuoc2Dat;

    if (isDat) {
      let phiKhuonBeCuoi = phiKhuonBeGoc;
      let phiBanInCuoi = phiBanInGoc;
      let ghiChuUuDai = "";

      if (thanhTienHop >= 30000000) {
        phiKhuonBeCuoi = 0;
        phiBanInCuoi = 0;
        ghiChuUuDai = "Đơn trên 30 triệu: miễn phí khuôn bế và bản in.";
      } else if (thanhTienHop >= 15000000) {
        if (phiKhuonBeGoc >= phiBanInGoc) {
          phiKhuonBeCuoi = 0;
          ghiChuUuDai = "Đơn trên 15 triệu: miễn phí khuôn bế.";
        } else {
          phiBanInCuoi = 0;
          ghiChuUuDai = "Đơn trên 15 triệu: miễn phí bản in.";
        }
      } else if (diaChi === "HN" && thanhTienHop >= 7000000) {
        // Rule "hỗ trợ 50% phí khuôn bế trên 7 triệu" đã tồn tại trong code
        // đang chạy thật (không có trong 2 bản GAS gửi lúc trước) - GIỮ NGUYÊN
        // vì đây là hành vi hệ thống thật đang dùng, chưa có xác nhận để bỏ.
        phiKhuonBeCuoi = phiKhuonBeGoc * 0.5;
        ghiChuUuDai = "Đơn trên 7 triệu: hỗ trợ 50% phí khuôn bế.";
      }

      theo_loai_giay[paper.name] = {
        dat_dieu_kien: true,
        don_gia: formatPrice(donGiaCuoi),
        phi_khuon_be: formatPrice(Math.ceil(phiKhuonBeCuoi / 1000) * 1000),
        phi_ban_in: formatPrice(phiBanInCuoi),
        thanh_tien: formatPrice(Math.ceil((thanhTienHop + phiKhuonBeCuoi + phiBanInCuoi) / 1000) * 1000),
        ghi_chu_uu_dai: ghiChuUuDai
      };
    } else {
      const reason = SL
        ? (lyDoChuaDatBuoc2 || lyDoChuaDatCoBan.join(", "))
        : "Khách chưa cung cấp số lượng (ước tính theo barem 500 cái)";

      theo_loai_giay[paper.name] = {
        dat_dieu_kien: false,
        thanh_tien_tam_tinh: formatPrice(Math.ceil(thanhTienHop / 1000) * 1000),
        ly_do_khong_dat: reason,
        so_luong_can_dat_toi_thieu: slCanThietDeDat !== null ? formatPrice(slCanThietDeDat) : null
      };
    }
  });

  // ---- Cảnh báo CTV khi SL > 15.000, đúng theo GAS-HCM (dùng phí GỐC
  // trước ưu đãi, vì thông báo này nói về đơn hàng chung) ----
  let thongBaoCtv = null;
  if (SL && SL > 15000) {
    thongBaoCtv = {
      can_bao_ctv: true,
      thong_bao_ctv:
        ` NHẮN CTV: Khách đặt ${SL.toLocaleString("vi-VN")} hộp` +
        ` | ${finalLoaiHop} ${D}x${R}x${C}cm.` +
        ` Được hoàn khuôn bế (${phiKhuonBeGoc.toLocaleString("vi-VN")}đ)` +
        ` HOẶC bản in (${phiBanInGoc.toLocaleString("vi-VN")}đ).` +
        ` Vẫn thu tiền bình thường, CTV xử lý hoàn riêng.`
    };
  }

  return {
    loai_hop_ap_dung: finalLoaiHop,
    phuong_phap: calcResult.phuong_phap,
    kho_giay_cm: khoGiay,
    chat_cm: chat,
    ghi_chu_chung: ghiChuChung.trim(),
    hinh_anh_minh_hoa: ghiChuTam || "",
    theo_loai_giay,
    thong_bao_ctv: thongBaoCtv
  };
}

function getPrice(requestData) {
  const { dia_chi, loai_hop, dai, rong, cao, so_luong, in_an, so_mau_in, ban_in_phuc_tap, loai_san_pham } = requestData;
  const diaChi = dia_chi === "HCM" ? "HCM" : "HN";

  // ---- Tấm carton: tách nhánh riêng ngay từ đầu, đúng theo GAS gốc ----
  if (loai_san_pham === "Tấm carton") {
    return tinhGiaTam(diaChi, requestData, formatPrice);
  }

  const D = parseFloat(dai);
  const R = parseFloat(rong);
  const C = parseFloat(cao);

  // ---- Chặn hộp âm dương, đúng theo GAS gốc ----
  if (loai_hop && String(loai_hop).toLowerCase().indexOf("âm dương") !== -1) {
    return {
      success: false,
      message: "Xưởng không nhận làm hộp âm dương."
    };
  }

  // ---- Validate whitelist loại hộp, đúng theo GAS gốc (whitelist khác nhau
  // giữa HN/HCM) ----
  if (loai_hop) {
    const whitelist = diaChi === "HCM" ? LOAI_HOP_HOP_LE_HCM : LOAI_HOP_HOP_LE_HN;
    if (whitelist.indexOf(loai_hop) === -1) {
      return {
        success: false,
        message: `Loại hộp không hợp lệ, phải là một trong: ${whitelist.join(", ")}`
      };
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
          hinh_anh: ""
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
          hinh_anh: ""
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
    return {
      success: true,
      type: "custom",
      dia_chi: diaChi,
      message: "Báo giá sản xuất in ấn trên form hộp có sẵn.",
      data: customData
    };
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
      bang_gia: bangGia
    };
  };

  if (bestFit) size_gan_giong.push(formatCoSan(bestFit, "Gần nhất theo Dài, Rộng, Cao (đựng vừa đồ)"));
  if (bestEuclid && (!bestFit || (bestEuclid.D !== bestFit.D || bestEuclid.R !== bestFit.R || bestEuclid.C !== bestFit.C))) {
    size_gan_giong.push(formatCoSan(bestEuclid, "Gần nhất theo form dáng tổng thể (Euclidean)"));
  }

  return {
    success: true,
    type: "custom_with_suggestions",
    dia_chi: diaChi,
    message: "Không có size có sẵn khớp chính xác. Gợi ý size gần nhất và báo giá sản xuất size yêu cầu.",
    data: {
      size_gan_giong,
      size_yeu_cau: customData
    }
  };
}

module.exports = {
  getPrice
};