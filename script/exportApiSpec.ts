const fs = require("fs");
const yaml = require("js-yaml");
export const exportApiSpec = (swagger: {}) => {
  const yamlText = yaml.dump(swagger);
  fs.writeFile("./docs/api/swagger.yaml", yamlText, "utf8", () => {});
};
