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

    // ---- Chỉ chấp nhận đúng 2 khu vực; không âm thầm coi địa chỉ lạ là HN ----
    if (data.dia_chi !== "HN" && data.dia_chi !== "HCM") {
      return res.status(400).json({
        success: false,
        message: "dia_chi không hợp lệ, phải là HN hoặc HCM."
      });
    }

    const missingParams = [];
    if (data.dai === undefined || data.dai === null || data.dai === "") missingParams.push("dai");
    if (data.rong === undefined || data.rong === null || data.rong === "") missingParams.push("rong");
    if (!isTamCarton && (data.cao === undefined || data.cao === null || data.cao === "")) missingParams.push("cao");
    if (isTamCarton && (data.so_luong === undefined || data.so_luong === null || data.so_luong === "")) {
      missingParams.push("so_luong");
    }

    if (missingParams.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Thiếu các tham số bắt buộc: ${missingParams.join(", ")}.`,
        missing_info: true
      });
    }

    // ---- Validate số học: phải là số hữu hạn và lớn hơn 0; chặn chuỗi lạ,
    // NaN, Infinity và giá trị 0/âm trước khi vào công thức. ----
    const errors = [];
    const parsed = {};
    const numericParams = [
      { raw: data.dai, label: "dai", required: true },
      { raw: data.rong, label: "rong", required: true },
      { raw: isTamCarton ? undefined : data.cao, label: "cao", required: !isTamCarton },
      { raw: data.so_luong, label: "so_luong", required: isTamCarton }
    ];
    for (const p of numericParams) {
      if (p.raw === undefined || p.raw === null || p.raw === "") {
        if (p.required) errors.push(`${p.label} phải là số dương hợp lệ`);
        continue;
      }
      const num = Number(p.raw);
      if (!Number.isFinite(num) || num <= 0) {
        errors.push(`${p.label} phải là số dương hợp lệ`);
      } else {
        parsed[p.label] = p.label === "so_luong" ? Math.floor(num) : num;
      }
    }

    const coIn = data.in_an === true || data.in_an === "true" || data.in_an === "1";
    if (coIn) {
      let soMau = 1;
      if (data.so_mau_in !== undefined && data.so_mau_in !== null && data.so_mau_in !== "") {
        soMau = Number(data.so_mau_in);
        if (!Number.isInteger(soMau) || soMau < 1) {
          errors.push("so_mau_in phải là số nguyên dương");
        }
      }
      parsed.so_mau_in = soMau;
    }

    if (errors.length > 0) {
      return res.status(400).json({ success: false, message: errors.join(". ") });
    }

    // Convert string booleans to real booleans
    const requestData = {
      ...data,
      dai: parsed.dai,
      rong: parsed.rong,
      ...(isTamCarton ? {} : { cao: parsed.cao }),
      so_luong: parsed.so_luong !== undefined ? parsed.so_luong : null,
      in_an: coIn,
      ban_in_phuc_tap: data.ban_in_phuc_tap === true || data.ban_in_phuc_tap === "true" || data.ban_in_phuc_tap === "1",
      so_mau_in: parsed.so_mau_in || 1
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