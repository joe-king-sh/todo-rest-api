export const exportApiSpec = (swagger: {}) => {
  const fs = require("fs");
  const yaml = require("js-yaml");

  const yamlText = yaml.dump(swagger);
  fs.writeFile("./docs/api/swagger.yaml", yamlText, "utf8", () => {});
};
