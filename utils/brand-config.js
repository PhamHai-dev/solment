const HT_CARTON_ID = "1544827258956583";
const BRAND_CLUSTERS = Object.freeze({
  HT_CARTON: "HT_CARTON",
  OTHER_BRANDS: "OTHER_BRANDS"
});

function resolveBrand(rawBrandId) {
  const isMissing = rawBrandId === undefined || rawBrandId === null;
  if (isMissing) {
    return {
      success: true,
      thuong_hieu_id: HT_CARTON_ID,
      cum_thuong_hieu: BRAND_CLUSTERS.HT_CARTON,
      thuong_hieu_mac_dinh: true
    };
  }

  if ((typeof rawBrandId !== "string" && typeof rawBrandId !== "number") ||
      (typeof rawBrandId === "number" && !Number.isFinite(rawBrandId))) {
    return { success: false, message: "thuong_hieu_id phải là chuỗi hoặc số hợp lệ." };
  }

  const brandId = String(rawBrandId).trim();
  if (!brandId) {
    return { success: false, message: "thuong_hieu_id không được để trống." };
  }

  return {
    success: true,
    thuong_hieu_id: brandId,
    cum_thuong_hieu: brandId === HT_CARTON_ID
      ? BRAND_CLUSTERS.HT_CARTON
      : BRAND_CLUSTERS.OTHER_BRANDS,
    thuong_hieu_mac_dinh: false
  };
}

function brandMetadata(context) {
  return {
    thuong_hieu_id: context.thuong_hieu_id,
    cum_thuong_hieu: context.cum_thuong_hieu,
    thuong_hieu_mac_dinh: context.thuong_hieu_mac_dinh
  };
}

module.exports = { HT_CARTON_ID, BRAND_CLUSTERS, resolveBrand, brandMetadata };
