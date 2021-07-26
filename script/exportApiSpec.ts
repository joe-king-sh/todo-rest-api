const fs = require("fs");
const yaml = require("js-yaml");

/**
 * swaggerの定義ファイルを渡すとドキュメントディレクトリに書き出す処理
 * @param swagger
 */
export const exportApiSpec = (swagger: {}) => {
  const yamlText = yaml.dump(swagger);
  fs.writeFile("./docs/api/swagger.yaml", yamlText, "utf8", () => {});
};
