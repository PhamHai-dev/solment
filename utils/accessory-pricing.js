const ACCESSORY_TYPES = Object.freeze({
  TAPE: "Băng dính",
  BUBBLE_WRAP: "Xốp chống sốc",
  PE_BAG: "Túi niêm phong"
});
const ACCESSORY_TYPE_VALUES = Object.freeze(Object.values(ACCESSORY_TYPES));
const COLOR_NAMES = Object.freeze(["xanh", "vàng", "tím", "hồng", "bạc", "cam"]);

const normalize = (value) => String(value || "").trim().toLocaleLowerCase("vi-VN");
const format = (value) => value === null || value === undefined
  ? value
  : String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g, ".");

function isAccessoryProduct(productType) {
  return ACCESSORY_TYPE_VALUES.includes(productType);
}

function selectExact(items, field, rawValue) {
  if (rawValue === undefined || rawValue === null || rawValue === "") return null;
  const wanted = normalize(rawValue);
  return items.find((item) => normalize(item[field]) === wanted) || undefined;
}

function tapeView(item, quantity) {
  const result = {
    ten_san_pham: item.name,
    quy_cach: item.spec,
    bang_gia: [
      { muc: "Giá lẻ", don_vi: "cuộn", gia: format(item.retail_vnd) },
      { muc: "Giá sỉ từ 6 cuộn", don_vi: "cuộn", gia: format(item.wholesale_from_6_vnd) }
    ]
  };
  if (quantity) {
    const wholesale = quantity >= 6;
    result.gia_theo_so_luong = {
      so_luong: format(quantity),
      don_vi: "cuộn",
      muc_ap_dung: wholesale ? "Giá sỉ từ 6 cuộn" : "Giá lẻ",
      gia: format(wholesale ? item.wholesale_from_6_vnd : item.retail_vnd)
    };
  }
  return result;
}

function bubbleView(item, region, quantity, unit) {
  const result = {
    kich_thuoc: item.size,
    quy_cach_ban_le: item.unit,
    so_cuon_moi_cay: item.rolls_per_tree,
    cong_dung: "Bảo vệ hàng dễ vỡ, chống va đập",
    bang_gia: [
      { muc: "Giá lẻ", don_vi: "cuộn", gia: format(item.retail_vnd) },
      { muc: "Giá sỉ từ 25 cây", don_vi: "cây", gia: format(item.wholesale_from_25_trees_vnd_per_tree) },
      { muc: "Giá sỉ từ 40 cây", don_vi: "cây", gia: format(item.wholesale_from_40_trees_vnd_per_tree) }
    ]
  };

  if (!quantity || !unit) return result;
  if (unit === "cuon") {
    result.gia_theo_so_luong = {
      so_luong: format(quantity), don_vi: "cuộn", muc_ap_dung: "Giá lẻ", gia: format(item.retail_vnd)
    };
    return result;
  }
  if (unit !== "cay") return result;

  if (region === "HCM") {
    result.can_xac_nhan_gia = true;
    result.ghi_chu_gia = "Bảng giá HCM chưa có giá sỉ xốp theo cây; cần xác nhận lại, không tự nội suy từ giá cuộn.";
    return result;
  }
  if (quantity < 25) {
    result.can_xac_nhan_gia = true;
    result.ghi_chu_gia = "Số lượng dưới 25 cây chưa có mức giá/cây trong bảng; cần xác nhận lại.";
    return result;
  }

  const is40 = quantity >= 40;
  result.gia_theo_so_luong = {
    so_luong: format(quantity),
    don_vi: "cây",
    muc_ap_dung: is40 ? "Giá sỉ từ 40 cây" : "Giá sỉ từ 25 cây",
    gia: format(is40 ? item.wholesale_from_40_trees_vnd_per_tree : item.wholesale_from_25_trees_vnd_per_tree)
  };
  return result;
}

function resolveBagColor(rawColor) {
  if (rawColor === undefined || rawColor === null || rawColor === "") return null;
  const color = normalize(rawColor);
  if (color === "den" || color === "đen") return { key: "black", label: "đen" };
  if (color === "mau" || color === "màu" || COLOR_NAMES.includes(color)) {
    return { key: "color", label: color === "mau" ? "màu" : color };
  }
  return undefined;
}

function bagView(item, quantity, colorInfo) {
  const threshold = item.wholesale_threshold_packages;
  const result = {
    kich_thuoc: item.size,
    quy_cach: item.package,
    so_cai_moi_goi: item.pieces_per_package,
    mau_co_san: COLOR_NAMES,
    cong_dung: "Chống ẩm, chống nước, bảo vệ bên ngoài hộp",
    bang_gia: {
      den: [
        { muc: "Giá lẻ", gia: format(item.retail_black_vnd) },
        { muc: `Giá sỉ từ ${threshold} gói`, gia: format(item.wholesale_black_vnd) }
      ],
      mau: [
        { muc: "Giá lẻ", gia: format(item.retail_color_vnd) },
        { muc: `Giá sỉ từ ${threshold} gói`, gia: format(item.wholesale_color_vnd) }
      ]
    }
  };

  if (!quantity || !colorInfo) return result;
  const wholesale = quantity >= threshold;
  const isBlack = colorInfo.key === "black";
  result.gia_theo_so_luong = {
    so_luong: format(quantity),
    don_vi: "gói",
    mau: colorInfo.label,
    muc_ap_dung: wholesale ? `Giá sỉ từ ${threshold} gói` : "Giá lẻ",
    gia: format(wholesale
      ? (isBlack ? item.wholesale_black_vnd : item.wholesale_color_vnd)
      : (isBlack ? item.retail_black_vnd : item.retail_color_vnd))
  };
  return result;
}

function priceAccessory(requestData, accessories) {
  const { dia_chi: region, loai_san_pham: productType } = requestData;
  const quantity = Number.isInteger(requestData.so_luong) && requestData.so_luong > 0
    ? requestData.so_luong
    : null;

  if (productType === ACCESSORY_TYPES.TAPE) {
    const selected = selectExact(accessories.tapes, "name", requestData.ten_san_pham);
    if (selected === undefined) {
      return { success: false, type: "accessory_not_found", message: "Không tìm thấy mẫu băng dính.", data: { mau_hop_le: accessories.tapes.map((item) => item.name) } };
    }
    if (!selected) {
      return { success: true, type: "accessory_catalog", message: "Danh sách băng dính có sẵn.", data: accessories.tapes.map((item) => tapeView(item, null)) };
    }
    return { success: true, type: "accessory_price", message: "Tìm thấy băng dính phù hợp.", data: tapeView(selected, quantity) };
  }

  if (productType === ACCESSORY_TYPES.BUBBLE_WRAP) {
    const selected = selectExact(accessories.bubble_wrap, "size", requestData.kich_thuoc);
    const unit = normalize(requestData.don_vi_so_luong);
    if (quantity && unit !== "cuon" && unit !== "cay") {
      return { success: false, message: "don_vi_so_luong của xốp phải là cuon hoặc cay khi có so_luong." };
    }
    if (selected === undefined) {
      return { success: false, type: "accessory_not_found", message: "Không tìm thấy kích thước xốp.", data: { kich_thuoc_hop_le: accessories.bubble_wrap.map((item) => item.size) } };
    }
    if (!selected) {
      return { success: true, type: "accessory_catalog", message: "Danh sách xốp chống sốc có sẵn.", data: accessories.bubble_wrap.map((item) => bubbleView(item, region, null, null)) };
    }
    return { success: true, type: "accessory_price", message: "Tìm thấy xốp chống sốc phù hợp.", data: bubbleView(selected, region, quantity, unit) };
  }

  const selected = selectExact(accessories.pe_shipping_bags, "size", requestData.kich_thuoc);
  const colorInfo = resolveBagColor(requestData.mau);
  if (colorInfo === undefined) {
    return { success: false, message: `mau không hợp lệ; dùng den, mau hoặc một trong: ${COLOR_NAMES.join(", ")}.` };
  }
  if (selected === undefined) {
    return { success: false, type: "accessory_not_found", message: "Không tìm thấy kích thước túi.", data: { kich_thuoc_hop_le: accessories.pe_shipping_bags.map((item) => item.size) } };
  }
  if (!selected) {
    return { success: true, type: "accessory_catalog", message: "Danh sách túi niêm phong có sẵn.", data: accessories.pe_shipping_bags.map((item) => bagView(item, null, null)) };
  }
  return { success: true, type: "accessory_price", message: "Tìm thấy túi niêm phong phù hợp.", data: bagView(selected, quantity, colorInfo) };
}

module.exports = { ACCESSORY_TYPES, ACCESSORY_TYPE_VALUES, COLOR_NAMES, isAccessoryProduct, priceAccessory };
