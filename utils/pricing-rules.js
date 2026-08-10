const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./data");
const { tinhMayBeHN, tinhMayBoHN, tinhGiaHCM } = require("./formulas");

// Helper: Format price string e.g. 1500000 -> 1.500.000
const formatPrice = (num) => {
    if (num === null || num === undefined) return num;
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
};

function calculateCustomSize(diaChi, loaiHop, D, R, C, SL, inAn, mauIn, ghiChuTam, giaHopCoSanKhongIn = null) {
  let finalLoaiHop = loaiHop || "Đối khẩu";
  let ghiChuChung = loaiHop ? "" : "Đã mặc định loại hộp là Đối khẩu do không nhận được yêu cầu loại cụ thể. ";

  let canKhuonBe = true;
  if (diaChi === "HN" && finalLoaiHop === "Đối khẩu") {
    canKhuonBe = false;
  }

  let phiBanInGoc = 0;
  let donGiaIn = 0;
  if (inAn) {
    const soMau = mauIn || 1;
    phiBanInGoc = 500000 * soMau;
    donGiaIn = 150 * soMau;
    ghiChuChung += `Công in ${soMau} màu, đơn giá ${formatPrice(donGiaIn)}đ/hộp. Phí bản in: ${soMau} bản x 500.000đ/bản. `;
  }

  const papers = [
    { key: "gia_3lop1nau", name: "3lop1nau", nguongTien: diaChi === "HN" ? (canKhuonBe ? 3000000 : 2000000) : 3000000 },
    { key: "gia_3lop2nau", name: "3lop2nau", nguongTien: 3000000 },
    { key: "gia_trangnau", name: "TrangNau", nguongTien: 4000000 },
    { key: "gia_5lop1nau", name: "5lop1nau", nguongTien: 3000000 },
    { key: "gia_5lop2nau", name: "5lop2nau", nguongTien: 3000000 }
  ];

  const slToCalc = SL || 500;

  let calcResult;
  if (diaChi === "HCM") {
    calcResult = tinhGiaHCM(finalLoaiHop, D, R, C, slToCalc);
  } else {
    if (canKhuonBe) calcResult = tinhMayBeHN(finalLoaiHop, D, R, C, slToCalc);
    else calcResult = tinhMayBoHN(D, R, C, slToCalc);
  }

  let phiKhuonBeGoc = 0;
  if (diaChi === "HN" && canKhuonBe) {
    phiKhuonBeGoc = calcResult.khoGiay * 4000;
  } else if (diaChi === "HCM") {
    phiKhuonBeGoc = 250000;
  }

  const theo_loai_giay = {};

  papers.forEach(paper => {
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

    const isDat = SL ? (thanhTienHop >= paper.nguongTien && slToCalc >= 200) : false;

    if (isDat) {
       let phiKhuonBeCuoi = phiKhuonBeGoc;
       let ghiChuUuDai = "";
       if (thanhTienHop >= 15000000) {
           phiKhuonBeCuoi = 0;
           ghiChuUuDai = "Đơn trên 15 triệu: miễn phí khuôn bế.";
       } else if (thanhTienHop >= 7000000) {
           phiKhuonBeCuoi = phiKhuonBeGoc * 0.5;
           ghiChuUuDai = "Đơn trên 7 triệu: hỗ trợ 50% phí khuôn bế.";
       }

       theo_loai_giay[paper.name] = {
           dat_dieu_kien: true,
           don_gia: formatPrice(donGiaCuoi),
           phi_khuon_be: formatPrice(Math.ceil(phiKhuonBeCuoi / 1000) * 1000),
           phi_ban_in: formatPrice(phiBanInGoc),
           thanh_tien: formatPrice(Math.ceil((thanhTienHop + phiKhuonBeCuoi + phiBanInGoc) / 1000) * 1000),
           ghi_chu_uu_dai: ghiChuUuDai
       };
    } else {
       let slTest = Math.max(200, SL || 200);
       let testTien = 0;
       
       while (testTien < paper.nguongTien && slTest <= 10000) {
           slTest += 10;
           let r;
           if (diaChi === "HCM") r = tinhGiaHCM(finalLoaiHop, D, R, C, slTest);
           else if (canKhuonBe) r = tinhMayBeHN(finalLoaiHop, D, R, C, slTest);
           else r = tinhMayBoHN(D, R, C, slTest);

           let dGia = r[paper.key];
           if (giaHopCoSanKhongIn && paper.name === "3lop1nau") dGia = giaHopCoSanKhongIn;
           
           testTien = (dGia + donGiaIn) * slTest;
       }

       let reason = SL ? `chưa đạt điều kiện đơn hàng tối thiểu trên ${formatPrice(paper.nguongTien)}đ (hiện tại ~${formatPrice(thanhTienHop)}đ)` : "Khách chưa cung cấp số lượng (ước tính theo barem 500 cái)";

       theo_loai_giay[paper.name] = {
           dat_dieu_kien: false,
           thanh_tien_tam_tinh: formatPrice(Math.ceil(thanhTienHop / 1000) * 1000),
           ly_do_khong_dat: reason,
           so_luong_can_dat_toi_thieu: formatPrice(slTest)
       };
    }
  });

  return {
    loai_hop_ap_dung: finalLoaiHop,
    phuong_phap: calcResult.phuong_phap,
    kho_giay_cm: calcResult.khoGiay || 0,
    chat_cm: calcResult.chat || 0,
    ghi_chu_chung: ghiChuChung.trim(),
    hinh_anh_minh_hoa: ghiChuTam || "",
    theo_loai_giay
  };
}

function getPrice(requestData) {
  const { dia_chi, loai_hop, dai, rong, cao, so_luong, in_an, so_mau_in } = requestData;
  const D = parseFloat(dai);
  const R = parseFloat(rong);
  const C = parseFloat(cao);
  const diaChi = dia_chi === "HCM" ? "HCM" : "HN";

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
          let dataArr = matches.map(matched => {
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
              }
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

  const customData = calculateCustomSize(diaChi, loai_hop, D, R, C, so_luong, in_an, so_mau_in, "", giaPhoiCoSan);

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
