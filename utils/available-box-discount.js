const DISCOUNT_TIERS = Object.freeze([
  Object.freeze({ threshold: 2000000, percent: 4 }),
  Object.freeze({ threshold: 5000000, percent: 6 }),
  Object.freeze({ threshold: 9000000, percent: 7 }),
  Object.freeze({ threshold: 12000000, percent: 8 })
]);
const UPSELL_RATIO = 0.9;
const DISCOUNT_SCOPE_NOTE = "Chỉ chiết khấu tiền hộp carton; không áp dụng cho băng dính, xốp, túi và phụ kiện khác.";

function calculateAvailableBoxDiscount(boxSubtotal) {
  if (!Number.isFinite(boxSubtotal) || boxSubtotal < 0) return null;

  const subtotal = Math.round(boxSubtotal);
  let appliedTier = null;
  for (const tier of DISCOUNT_TIERS) {
    if (subtotal >= tier.threshold) appliedTier = tier;
  }

  const discountPercent = appliedTier ? appliedTier.percent : 0;
  const discountAmount = Math.round(subtotal * discountPercent / 100);
  const result = {
    tong_tien_hop_truoc_chiet_khau: subtotal,
    ty_le_chiet_khau: discountPercent,
    tien_chiet_khau: discountAmount,
    tong_tien_hop_sau_chiet_khau: subtotal - discountAmount,
    tu_dong_ap_dung: discountPercent > 0,
    ghi_chu_pham_vi: DISCOUNT_SCOPE_NOTE,
    applied_threshold: appliedTier ? appliedTier.threshold : null
  };

  const nextTier = DISCOUNT_TIERS.find((tier) => tier.threshold > subtotal);
  if (nextTier && subtotal >= nextTier.threshold * UPSELL_RATIO) {
    result.goi_y_upsell = {
      moc_tiep_theo: nextTier.threshold,
      ty_le_chiet_khau: nextTier.percent,
      can_mua_them_tien_hop: nextTier.threshold - subtotal,
      thong_bao: `Gợi ý lấy thêm ${nextTier.threshold - subtotal}đ tiền hộp để đạt mốc ${nextTier.threshold}đ và được chiết khấu ${nextTier.percent}%.`
    };
  }

  return result;
}

module.exports = {
  DISCOUNT_TIERS,
  UPSELL_RATIO,
  DISCOUNT_SCOPE_NOTE,
  calculateAvailableBoxDiscount
};
