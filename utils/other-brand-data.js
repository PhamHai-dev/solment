const {
  SIZE_CO_SAN_HN_OTHER_BRANDS,
  SIZE_CO_SAN_HCM_OTHER_BRANDS,
  ACCESSORIES_HN_OTHER_BRANDS,
  ACCESSORIES_HCM_OTHER_BRANDS
} = require("./data-other-brands");
const { SIZE_CO_SAN_HN, SIZE_CO_SAN_HCM } = require("./data");


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

  return Object.freeze({
    boxes: Object.freeze(boxes.map((box) => Object.freeze(box))),
    accessories: Object.freeze({
      tapes: Object.freeze(accessories.tapes.map((item) => Object.freeze(item))),
      bubble_wrap: Object.freeze(accessories.bubble_wrap.map((item) => Object.freeze(item))),
      pe_shipping_bags: Object.freeze(accessories.pe_shipping_bags.map((item) => Object.freeze(item))),
      common_notes: Object.freeze(accessories.common_notes)
    })
  });
}

const OTHER_BRAND_DATA = Object.freeze({
  HN: validateRegion("HN", SIZE_CO_SAN_HN_OTHER_BRANDS, ACCESSORIES_HN_OTHER_BRANDS, SIZE_CO_SAN_HN),
  HCM: validateRegion("HCM", SIZE_CO_SAN_HCM_OTHER_BRANDS, ACCESSORIES_HCM_OTHER_BRANDS, SIZE_CO_SAN_HCM)
});

function getOtherBrandBoxes(region) {
  return OTHER_BRAND_DATA[region].boxes;
}

function getOtherBrandAccessories(region) {
  return OTHER_BRAND_DATA[region].accessories;
}

module.exports = {
  EXPECTED_COUNTS,
  OTHER_BRAND_DATA,
  getOtherBrandBoxes,
  getOtherBrandAccessories
};
