import * as cdk from "@aws-cdk/core";

/**
 * 環境名の定義
 */
export const Environments = {
  PROD: "prod",
  STAGING: "stg",
  DEV: "dev",
} as const;
export type Environments = typeof Environments[keyof typeof Environments];

/**
 * 環境に依存せず共通の変数のインタフェース
 */
interface CommonVariable {
  projectName: string;
  region: string;
}
/**
 * 環境に依存せず共通の変数
 */
const CommonVariableConfig: CommonVariable = {
  projectName: "TodoApp",
  region: "ap-northeast-1",
};

/**
 * 各環境毎の環境変数のインタフェース
 * @export
 * @interface EnvironmentVariables
 */
export interface EnvironmentVariables extends CommonVariable {
  environment: Environments;
  cognitoUserPoolSetting: { [key: string]: any };
  dynamodbSetting: { [key: string]: any };
}

/**
 * 各環境毎で変わる設定値をここで管理
 */
const EnvironmentsVariableConfig: {
  [key in Environments]: EnvironmentVariables;
} = {
  [Environments.PROD]: {
    environment: Environments.PROD,
    cognitoUserPoolSetting: { removalPolicy: cdk.RemovalPolicy.RETAIN },
    dynamodbSetting: { removalPolicy: cdk.RemovalPolicy.RETAIN },

    ...CommonVariableConfig,
  },
  [Environments.STAGING]: {
    environment: Environments.STAGING,
    cognitoUserPoolSetting: { removalPolicy: cdk.RemovalPolicy.DESTROY },
    dynamodbSetting: { removalPolicy: cdk.RemovalPolicy.DESTROY },
    ...CommonVariableConfig,
  },
  [Environments.DEV]: {
    environment: Environments.DEV,
    cognitoUserPoolSetting: { removalPolicy: cdk.RemovalPolicy.DESTROY },
    dynamodbSetting: { removalPolicy: cdk.RemovalPolicy.DESTROY },
    ...CommonVariableConfig,
  },
};

/**
 * env毎の環境変数を返却する
 * @param env 取得したい環境変数の環境名
 * @return 指定した環境の環境変数
 */
export function getVariablesOf(env: Environments): EnvironmentVariables {
  return EnvironmentsVariableConfig[env];
}
