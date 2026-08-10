const { getPrice } = require("./utils/pricing-rules");

console.log("=== TEST 1: HỘP CÓ SẴN (Chính xác) ===");
const res1 = getPrice({ dia_chi: "HN", dai: 10, rong: 6, cao: 6 });
console.log(JSON.stringify(res1, null, 2));

console.log("\n=== TEST 2: HỘP CÓ SẴN NHƯNG CÓ IN ===");
const res2 = getPrice({ dia_chi: "HN", dai: 10, rong: 6, cao: 6, so_luong: 500, in_an: true, so_mau_in: 2 });
console.log(JSON.stringify(res2, null, 2));

console.log("\n=== TEST 3: KHÔNG CÓ SẴN (Gợi ý hộp và tính Size yêu cầu) ===");
const res3 = getPrice({ dia_chi: "HN", dai: 11, rong: 7, cao: 7, so_luong: 300 });
console.log(JSON.stringify(res3, null, 2));

console.log("\n=== TEST 4: TÌM TRÙNG 2 LOẠI HỘP ===");
// (Giả sử kho có cả Đối khẩu và Nắp cài 2 đầu cùng kích thước, nhưng trong data thật hiện tại ko bị trùng, ta gọi test hàm)
const res4 = getPrice({ dia_chi: "HN", dai: 30, rong: 20, cao: 10 }); 
console.log(JSON.stringify(res4, null, 2));

console.log("\n=== TEST 5: HỘP CUSTOM HCM ===");
const res5 = getPrice({ dia_chi: "HCM", dai: 20, rong: 15, cao: 15, so_luong: 250 });
console.log(JSON.stringify(res5, null, 2));
