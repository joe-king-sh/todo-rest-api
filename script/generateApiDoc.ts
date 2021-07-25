import { UserPoolIdentityProvider } from "@aws-cdk/aws-cognito";
import { config } from "yargs";
import { readCdkOutputs } from "./readCdkOutputs";
const yaml = require("js-yaml");
const fs = require("fs");

// CDK Outputsを読み込み
const cdkOutputs = readCdkOutputs();

const swagerFilePath = "./docs/api/swagger.yaml";
fs.readFile(swagerFilePath, "utf8", (err: any, data: string) => {
  if (err) {
    return console.log(err);
  }

  console.log("data:", data);
  const result = data.replace(/API_ENDPOINT/g, cdkOutputs.apiEndpoint);
  console.log("data replaced:", data);
  fs.writeFile(swagerFilePath, result, "utf8", (err: any) => {
    if (err) return console.log(err);
  });
});

// Get document, or throw exception on error
// try {
//   const doc = yaml.load(fs.readFileSync("./docs/api/swagger.yaml", "utf8"));
//   console.log(doc);
// } catch (e) {
//   console.log(e);
// }
