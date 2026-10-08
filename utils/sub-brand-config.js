const VN_BOX_ID = "100298786195956";
const BAO_BI_VIET_ID = "104878245974807";

const SUB_BRAND_CLUSTERS = Object.freeze({
  VN_BOX: "VN_BOX",
  BAO_BI_VIET: "BAO_BI_VIET"
});

const SUB_BRAND_IMAGE_PREFIX = Object.freeze({
  [SUB_BRAND_CLUSTERS.VN_BOX]: "https://amqkxxpqkoagqqephtgl.supabase.co/storage/v1/object/public/VN_BOX",
  [SUB_BRAND_CLUSTERS.BAO_BI_VIET]: "https://amqkxxpqkoagqqephtgl.supabase.co/storage/v1/object/public/BBV"
});

// Danh sách file ảnh BBV thực tế đã upload lên storage.
// SKU nào thiếu trong danh sách này sẽ dùng tạm ảnh của HT Carton (image_box).
const BAO_BI_VIET_IMAGES = Object.freeze(new Set([
  "10x10x10.jpg", "10x10x8.jpg", "10x6x6.jpg", "10x8x8.jpg",
  "12x10x5.jpg", "12x12x12.jpg", "12x7x8.jpg", "12x8x12.jpg", "12x8x4.jpg",
  "15x10x10.jpg", "15x10x5.jpg", "15x12x10.jpg", "15x15x10.jpg", "15x15x5.jpg",
  "16x12x6.jpg", "16x6x6.jpg", "18x10x8.jpg", "18x12x12.jpg",
  "20x10x10.jpg", "20x10x5.jpg", "20x12x8.jpg", "20x15x10.jpg", "20x15x15.jpg",
  "20x15x5.jpg", "20x15x6.jpg", "20x20x10.jpg", "20x20x15.jpg",
  "25x10x10.jpg", "25x15x10.jpg", "25x15x15.jpg", "25x15x20.jpg", "25x15x5.jpg",
  "25x17x3.jpg", "25x20x10.jpg", "25x20x6.jpg",
  "30x10x10.jpg", "30x15x10.jpg", "30x20x10.jpg", "30x20x15.jpg", "30x20x20.jpg",
  "30x20x5.jpg", "30x20x7.jpg", "30x25x6.jpg",
  "31x19x11.jpg", "32x22x12.jpg", "35x25x15.jpg", "35x25x7.jpg",
  "40x30x20.jpg", "60x40x40.jpg", "8.5x5x8.5.jpg",
  "10x3x18.jpg", "10x4x18.jpg", "10x5x15.jpg", "14x12x4.jpg", "18x12x4.jpg"
]));

// Tập tên file không kèm đuôi, để data.js dùng .png hay .jpg đều khớp với ảnh BBV.
const BAO_BI_VIET_IMAGE_STEMS = Object.freeze(
  new Set([...BAO_BI_VIET_IMAGES].map((file) => file.replace(/\.(jpg|jpeg|png)$/i, "")))
);

// VN_BOX có đủ ảnh mọi SKU; BBV chỉ có các file trong BAO_BI_VIET_IMAGES.
function subBrandHasImage(subBrandCluster, fileName) {
  if (!fileName) return false;
  if (subBrandCluster === SUB_BRAND_CLUSTERS.BAO_BI_VIET) {
    return BAO_BI_VIET_IMAGE_STEMS.has(String(fileName).replace(/\.(jpg|jpeg|png)$/i, ""));
  }
  return true;
}

function resolveSubBrand(rawBrandId) {
  const brandId = String(rawBrandId || "").trim();

  if (brandId === VN_BOX_ID) {
    return {
      success: true,
      sub_brand_id: VN_BOX_ID,
      sub_brand_cluster: SUB_BRAND_CLUSTERS.VN_BOX,
      sub_brand_mac_dinh: true
    };
  }

  if (brandId === BAO_BI_VIET_ID) {
    return {
      success: true,
      sub_brand_id: BAO_BI_VIET_ID,
      sub_brand_cluster: SUB_BRAND_CLUSTERS.BAO_BI_VIET,
      sub_brand_mac_dinh: false
    };
  }

  // Fallback: nếu không match ID nào, mặc định là VN_BOX
  // (đảm bảo tương thích với các brand ID lạ trong tương lai)
  return {
    success: true,
    sub_brand_id: brandId || VN_BOX_ID,
    sub_brand_cluster: SUB_BRAND_CLUSTERS.VN_BOX,
    sub_brand_mac_dinh: true
  };
}

function getImagePrefix(subBrandCluster) {
  return SUB_BRAND_IMAGE_PREFIX[subBrandCluster] || SUB_BRAND_IMAGE_PREFIX[SUB_BRAND_CLUSTERS.VN_BOX];
}

function replaceImagePrefix(url, subBrandCluster) {
  if (!url || typeof url !== "string") return url;
  const prefix = getImagePrefix(subBrandCluster);
  // Thay thế bất kỳ prefix VN_BOX hoặc BBV nào bằng prefix đúng
  return url.replace(
    /https:\/\/amqkxxpqkoagqqephtgl\.supabase\.co\/storage\/v1\/object\/public\/(VN_BOX|BBV)/,
    prefix
  );
}

function subBrandMetadata(context) {
  return {
    sub_brand_id: context.sub_brand_id,
    sub_brand_cluster: context.sub_brand_cluster,
    sub_brand_mac_dinh: context.sub_brand_mac_dinh
  };
}

module.exports = {
  VN_BOX_ID,
  BAO_BI_VIET_ID,
  SUB_BRAND_CLUSTERS,
  SUB_BRAND_IMAGE_PREFIX,
  BAO_BI_VIET_IMAGES,
  resolveSubBrand,
  subBrandHasImage,
  getImagePrefix,
  replaceImagePrefix,
  subBrandMetadata
};
