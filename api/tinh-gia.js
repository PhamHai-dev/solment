const { getPrice } = require("../utils/pricing-rules");

module.exports = async (req, res) => {
  // CORS setup if n8n calls from a browser or different domain
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST" && req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method Not Allowed" });
  }

  try {
    // Cho phép gọi bằng cả GET (query params) và POST (JSON body)
    const data = req.method === "POST" ? req.body : req.query;

    // Tấm carton dùng dai/rong/so_luong, không cần cao - bỏ qua check "cao"
    // bắt buộc khi loai_san_pham là Tấm carton.
    const isTamCarton = data.loai_san_pham === "Tấm carton";

    const missingParams = [];
    if (!data.dia_chi) missingParams.push("dia_chi (HN/HCM)");
    if (!data.dai) missingParams.push("dai");
    if (!data.rong) missingParams.push("rong");
    if (!isTamCarton && !data.cao) missingParams.push("cao");
    if (isTamCarton && !data.so_luong) missingParams.push("so_luong");

    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu các tham số bắt buộc: ${missingParams.join(", ")}.`,
        missing_info: true
      });
    }

    // Convert string booleans to real booleans
    const requestData = {
      ...data,
      in_an: data.in_an === true || data.in_an === "true" || data.in_an === "1",
      ban_in_phuc_tap: data.ban_in_phuc_tap === true || data.ban_in_phuc_tap === "true" || data.ban_in_phuc_tap === "1",
      so_luong: data.so_luong ? parseInt(data.so_luong, 10) : null,
      so_mau_in: data.so_mau_in ? parseInt(data.so_mau_in, 10) : 1
    };

    const result = getPrice(requestData);

    return res.status(200).json(result);
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: "Đã xảy ra lỗi hệ thống khi xử lý yêu cầu.",
      error: error.message
    });
  }
};