/**
 * Swagger.yamlのエンドポイントの値を設定する処理
 * API Gatewayのエンドポイントはデプロイ後に決まるので、デプロイ後にこれを動かしてSSMに保存したAPIのurlを設定する。
 */

import * as aws from "aws-sdk";
const fs = require("fs");

aws.config.update({
  region: "ap-northeast-1",
});

const ssm = new aws.SSM({
  region: "ap-northeast-1",
});

// APIIDの取得
let apiUrl: string | undefined;
ssm
  .getParameter({
    Name: `/TodoApp/dev/ApiUrl`,
  })
  .promise()
  .then((res) => {
    console.log(res);
    apiUrl = res.Parameter?.Value;

    if (!apiUrl) {
      console.error("apiUrlが空");
    } else {
      const swagerFilePath = "./docs/api/swagger.yaml";
      fs.readFile(swagerFilePath, "utf8", (err: any, data: string) => {
        if (err) {
          return console.log(err);
        }

        console.log("data:", data);
        const result = data.replace(/API_ENDPOINT/g, apiUrl as string);
        console.log("data replaced:", data);
        fs.writeFile(swagerFilePath, result, "utf8", (err: any) => {
          if (err) return console.log(err);
        });
      });
    }
  })
  .catch((e) => {
    console.error("ssmからAPIのurl取得に失敗");
    console.error(e);
  });
