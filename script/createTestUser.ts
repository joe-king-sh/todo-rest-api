import * as aws from "aws-sdk";
import axios from "axios";
import * as environment from "../lib/environment";

aws.config.update({
  region: "ap-northeast-1",
});
const cognito = new aws.CognitoIdentityServiceProvider({
  apiVersion: "2016-04-18",
});

const ssm = new aws.SSM({
  region: "ap-northeast-1",
});

const createUser = async (userName: string, password: string) => {
  try {
    // パラメータストアからテスト対象の環境情報を取得
    const userPoolIdParam = await ssm
      .getParameter({
        Name: `/${projectName}/${TEST_ENV}/UserPoolId`,
      })
      .promise();
    const userPoolId = userPoolIdParam.Parameter?.Value;

    if (!userPoolId) {
      throw Error("パラメータストアから必要情報が取得できず、E2Eテストは失敗");
    }

    // ユーザ作成
    console.log("ユーザ登録 開始");
    const user = await cognito
      .adminCreateUser({
        UserPoolId: userPoolId,
        Username: userName,
      })
      .promise();
    console.log("ユーザ登録 完了", JSON.stringify(user, null, 4));

    // パスワード変更、ユーザ有効化
    console.log("パスワード変更 開始");
    await cognito
      .adminSetUserPassword({
        UserPoolId: userPoolId,
        Username: userName,
        Password: password,
        Permanent: true,
      })
      .promise();
    console.log("パスワード変更 完了");
  } catch (e) {
    console.log("E2Eテスト前処理で例外発生:", e);
  }
};

const TEST_ENV = "dev";
const projectName = "TodoApp";

// テストに使用するユーザのセットアップ
const userName = "api-test-user-3";
const password = "Passw0rd!";

createUser(userName, password);
