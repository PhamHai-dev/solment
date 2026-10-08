const assert = require("assert");
const handler = require("./api/tinh-gia");
const { HT_CARTON_ID } = require("./utils/brand-config");

function invoke({ method = "POST", body = {}, query = {} }) {
  return new Promise((resolve, reject) => {
    const response = {
      statusCode: 200,
      setHeader() {},
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(payload) {
        resolve({ statusCode: this.statusCode, payload });
        return this;
      },
      end() {
        resolve({ statusCode: this.statusCode, payload: null });
      }
    };
    Promise.resolve(handler({ method, body, query }, response)).catch(reject);
  });
}

(async () => {
  const otherTape = await invoke({ body: {
    thuong_hieu_id: "987654321",
    dia_chi: "HN",
    loai_san_pham: "Băng dính",
    ten_san_pham: "Băng dính 1kg",
    so_luong: "6"
  } });
  assert.strictEqual(otherTape.statusCode, 200);
  assert.strictEqual(otherTape.payload.type, "accessory_price");
  assert.strictEqual(otherTape.payload.data.gia_theo_so_luong.gia, "46.000");
  assert.strictEqual(otherTape.payload.cum_thuong_hieu, "OTHER_BRANDS");

  const getBag = await invoke({ method: "GET", query: {
    thuong_hieu_id: "other",
    dia_chi: "HCM",
    loai_san_pham: "Túi niêm phong",
    kich_thuoc: "15x25cm",
    mau: "xanh",
    so_luong: "250"
  } });
  assert.strictEqual(getBag.statusCode, 200);
  assert.strictEqual(getBag.payload.data.gia_theo_so_luong.gia, "43.000");

  const accessoryCatalog = await invoke({ body: {
    thuong_hieu_id: "other", dia_chi: "HN", loai_san_pham: "Xốp chống sốc"
  } });
  assert.strictEqual(accessoryCatalog.statusCode, 200);
  assert.strictEqual(accessoryCatalog.payload.type, "accessory_catalog");
  assert.strictEqual(accessoryCatalog.payload.data.length, 8);

  const invalidAccessoryQuantity = await invoke({ body: {
    thuong_hieu_id: "other", dia_chi: "HN", loai_san_pham: "Băng dính", so_luong: "1.5"
  } });
  assert.strictEqual(invalidAccessoryQuantity.statusCode, 400);
  assert.ok(invalidAccessoryQuantity.payload.message.includes("số nguyên dương"));

  const invalidSubtotal = await invoke({ body: {
    thuong_hieu_id: "other", dia_chi: "HN", dai: 31, rong: 19, cao: 11,
    tong_tien_hop_truoc_chiet_khau: "-1"
  } });
  assert.strictEqual(invalidSubtotal.statusCode, 400);
  assert.ok(invalidSubtotal.payload.message.includes("số không âm"));

  const discountedBox = await invoke({ body: {
    thuong_hieu_id: "other", dia_chi: "HN", loai_hop: "Hộp giày",
    dai: "31", rong: "19", cao: "11", so_luong: "1",
    tong_tien_hop_truoc_chiet_khau: "2000000"
  } });
  assert.strictEqual(discountedBox.statusCode, 200);
  assert.strictEqual(discountedBox.payload.data.uu_dai_don_hop.ty_le_chiet_khau, 4);
  assert.strictEqual(discountedBox.payload.data.uu_dai_don_hop.tien_chiet_khau, "80.000");

  const defaultBrand = await invoke({ body: {
    dia_chi: "HN", loai_hop: "Hộp giày", dai: 31, rong: 19, cao: 11
  } });
  assert.strictEqual(defaultBrand.statusCode, 200);
  assert.strictEqual(defaultBrand.payload.thuong_hieu_id, HT_CARTON_ID);
  assert.strictEqual(defaultBrand.payload.thuong_hieu_mac_dinh, true);

  const emptyBrand = await invoke({ body: {
    thuong_hieu_id: "", dia_chi: "HN", dai: 31, rong: 19, cao: 11
  } });
  assert.strictEqual(emptyBrand.statusCode, 400);
  assert.strictEqual(emptyBrand.payload.success, false);

  const missingBoxDimensions = await invoke({ body: {
    thuong_hieu_id: "other", dia_chi: "HN", dai: 31
  } });
  assert.strictEqual(missingBoxDimensions.statusCode, 400);
  assert.strictEqual(missingBoxDimensions.payload.missing_info, true);

  const printOnStockForm = {
    dia_chi: "HN", loai_hop: "Hộp giày", dai: 31, rong: 19, cao: 11,
    so_luong: 1000, in_an: true, so_mau_in: 1
  };
  const htPrint = await invoke({ body: { ...printOnStockForm, thuong_hieu_id: HT_CARTON_ID } });
  const otherPrint = await invoke({ body: { ...printOnStockForm, thuong_hieu_id: "other" } });
  assert.strictEqual(htPrint.statusCode, 200);
  assert.strictEqual(otherPrint.statusCode, 200);
  assert.deepStrictEqual(htPrint.payload.data, otherPrint.payload.data);

  const methodNotAllowed = await invoke({ method: "DELETE" });
  assert.strictEqual(methodNotAllowed.statusCode, 405);

  console.log("All API tests passed.");
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
