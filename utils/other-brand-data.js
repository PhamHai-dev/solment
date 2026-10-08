const {
  SIZE_CO_SAN_HN_OTHER_BRANDS,
  SIZE_CO_SAN_HCM_OTHER_BRANDS,
  ACCESSORIES_HN_OTHER_BRANDS,
  ACCESSORIES_HCM_OTHER_BRANDS
} = require("./data-other-brands");
const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./data");
const { getImagePrefix, subBrandHasImage, SUB_BRAND_CLUSTERS } = require("./sub-brand-config");

// Map SKU -> URL ảnh của HT Carton (image_box) để fallback khi BBV thiếu ảnh.
const HT_IMAGE_MAP = Object.freeze({
  HN: Object.freeze(new Map(SIZE_CO_SAN_HN.map((b) => [`${b.D}x${b.R}x${b.C}`, b.hinh_anh]))),
  HCM: Object.freeze(new Map(SIZE_CO_SAN_HCM.map((b) => [`${b.D}x${b.R}x${b.C}`, b.hinh_anh])))
});

function extractFileName(url) {
  if (!url) return null;
  const match = url.match(/\/([^/]+\.(?:jpg|jpeg|png))$/i);
  return match ? match[1] : null;
}

function resolveImageUrl(box, region, subBrandCluster) {
  const fileName = extractFileName(box.hinh_anh);
  if (subBrandHasImage(subBrandCluster, fileName)) {
    // BBV lưu ảnh dạng .jpg: build URL mới từ prefix + fileName
    const prefix = getImagePrefix(subBrandCluster);
    const fileNameJpg = fileName.replace(/\.(png|jpeg)$/i, ".jpg");
    return `${prefix}/${fileNameJpg}`;
  }
  // Fallback: dùng ảnh của HT Carton
  const key = `${box.D}x${box.R}x${box.C}`;
  const htUrl = HT_IMAGE_MAP[region].get(key);
  return htUrl || box.hinh_anh;
}


const EXPECTED_COUNTS = Object.freeze({
  HN: { boxes: 53, tapes: 3, bubble_wrap: 8, pe_shipping_bags: 8 },
  HCM: { boxes: 40, tapes: 3, bubble_wrap: 5, pe_shipping_bags: 8 }
});

const skuKey = (box) => `${box.loai_hop}|${box.D}|${box.R}|${box.C}`;

function assertPositiveInteger(value, label) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Dữ liệu ${label} phải là số nguyên dương.`);
  }
}

function validateAccessoryPrices(region, accessories) {
  accessories.tapes.forEach((item, index) => {
    assertPositiveInteger(item.retail_vnd, `${region}.tapes[${index}].retail_vnd`);
    assertPositiveInteger(item.wholesale_from_6_vnd, `${region}.tapes[${index}].wholesale_from_6_vnd`);
  });

  accessories.bubble_wrap.forEach((item, index) => {
    assertPositiveInteger(item.retail_vnd, `${region}.bubble_wrap[${index}].retail_vnd`);
    assertPositiveInteger(item.rolls_per_tree, `${region}.bubble_wrap[${index}].rolls_per_tree`);
    for (const field of ["wholesale_from_25_trees_vnd_per_tree", "wholesale_from_40_trees_vnd_per_tree"]) {
      const value = item[field];
      if (region === "HCM" && value === null) continue;
      assertPositiveInteger(value, `${region}.bubble_wrap[${index}].${field}`);
    }
  });

  accessories.pe_shipping_bags.forEach((item, index) => {
    for (const field of [
      "retail_black_vnd", "retail_color_vnd", "wholesale_threshold_packages",
      "wholesale_black_vnd", "wholesale_color_vnd"
    ]) {
      assertPositiveInteger(item[field], `${region}.pe_shipping_bags[${index}].${field}`);
    }
  });
}

function validateRegion(region, boxes, accessories, htBoxes) {
  const expected = EXPECTED_COUNTS[region];
  const seen = new Set();

  if (!Array.isArray(boxes) || boxes.length !== expected.boxes) {
    throw new Error(`Sai số lượng hộp ${region}; cần ${expected.boxes}.`);
  }

  boxes.forEach((box, index) => {
    const key = skuKey(box);
    if (seen.has(key)) throw new Error(`Trùng SKU ${region}: ${key}`);
    seen.add(key);

    if (!["E", "B", "C"].includes(box.loai_song)) {
      throw new Error(`Loại sóng không hợp lệ tại ${region}.boxes[${index}]`);
    }
    if (!box.hinh_anh) throw new Error(`Thiếu hình ảnh tại ${region}.boxes[${index}]`);

    if (region === "HN") {
      assertPositiveInteger(box.gia_le, `${region}.boxes[${index}].gia_le`);
      assertPositiveInteger(box.gia_si, `${region}.boxes[${index}].gia_si`);
      if (box.gia_le !== box.gia_si) {
        throw new Error(`Giá HN phải giống nhau cho mọi số lượng tại ${region}.boxes[${index}]`);
      }
    } else {
      assertPositiveInteger(box.gia_le, `${region}.boxes[${index}].gia_le`);
      assertPositiveInteger(box.gia_si_300, `${region}.boxes[${index}].gia_si_300`);
      assertPositiveInteger(box.gia_si_1000, `${region}.boxes[${index}].gia_si_1000`);
    }
  });

  const htKeys = new Set(htBoxes.map(skuKey));
  if (seen.size !== htKeys.size || [...htKeys].some((key) => !seen.has(key))) {
    throw new Error(`Danh sách SKU ${region} của cụm thương hiệu khác không khớp HT Carton.`);
  }

  for (const group of ["tapes", "bubble_wrap", "pe_shipping_bags"]) {
    if (!Array.isArray(accessories[group]) || accessories[group].length !== expected[group]) {
      throw new Error(`Sai số lượng ${region}.${group}; cần ${expected[group]}.`);
    }
  }
  validateAccessoryPrices(region, accessories);

  return { boxes, accessories };
}

// Validate raw data khi load module
const RAW_DATA = Object.freeze({
  HN: validateRegion("HN", SIZE_CO_SAN_HN_OTHER_BRANDS, ACCESSORIES_HN_OTHER_BRANDS, SIZE_CO_SAN_HN),
  HCM: validateRegion("HCM", SIZE_CO_SAN_HCM_OTHER_BRANDS, ACCESSORIES_HCM_OTHER_BRANDS, SIZE_CO_SAN_HCM)
});

/**
 * Tạo bản sao data với URL ảnh thay đổi theo sub-brand.
 * Không mutate data gốc.
 */
function buildSubBrandData(region, subBrandCluster) {
  const raw = RAW_DATA[region];
  const boxes = raw.boxes.map((box) => ({
    ...box,
    hinh_anh: resolveImageUrl(box, region, subBrandCluster)
  }));

  return Object.freeze({
    boxes: Object.freeze(boxes.map((box) => Object.freeze(box))),
    accessories: raw.accessories
  });
}

const SUB_BRAND_CACHE = new Map();

function getSubBrandData(region, subBrandCluster) {
  const key = `${region}|${subBrandCluster || SUB_BRAND_CLUSTERS.VN_BOX}`;
  if (!SUB_BRAND_CACHE.has(key)) {
    SUB_BRAND_CACHE.set(key, buildSubBrandData(region, subBrandCluster));
  }
  return SUB_BRAND_CACHE.get(key);
}

function getOtherBrandBoxes(region, subBrandCluster) {
  return getSubBrandData(region, subBrandCluster).boxes;
}

function getOtherBrandAccessories(region, subBrandCluster) {
  return getSubBrandData(region, subBrandCluster).accessories;
}

// View mặc định (VN_BOX) giữ tương thích với client cũ đọc trực tiếp.
const OTHER_BRAND_DATA = Object.freeze({
  HN: getSubBrandData("HN", SUB_BRAND_CLUSTERS.VN_BOX),
  HCM: getSubBrandData("HCM", SUB_BRAND_CLUSTERS.VN_BOX)
});

module.exports = {
  EXPECTED_COUNTS,
  OTHER_BRAND_DATA,
  getOtherBrandBoxes,
  getOtherBrandAccessories
};
