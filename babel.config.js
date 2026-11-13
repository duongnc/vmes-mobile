module.exports = function (api) {
  api.cache(true);
  return {
    // zustand (bản ESM dùng trên web) có import.meta – cần chuyển đổi để chạy được với Metro web
    presets: [['babel-preset-expo', { unstable_transformImportMeta: true }]],
  };
};
