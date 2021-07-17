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
    projectName: string,
};  
/**
 * 環境に依存せず共通の変数
 */
 const CommonVariableConfig = {
    projectName: "TodoApp",
};  
  
/**
 * 各環境毎の環境変数のインタフェース
 * @export
 * @interface EnvironmentVariables
 */
export interface EnvironmentVariables extends CommonVariable{
  environment: Environments
  dynamodbSetting: { [key: string]: any }; //Dynamodbに渡す環境変数
} 

/**
 * 各環境毎の環境変数
 */
const EnvironmentsVariableConfig: {
  [key in Environments]: EnvironmentVariables;
} = {
  [Environments.PROD]: {
    environment: Environments.PROD,
    dynamodbSetting: { params1: "aaa" },
    ...CommonVariableConfig,
  },
  [Environments.STAGING]: {
    environment: Environments.STAGING,
    dynamodbSetting: { params1: "aaa" },
    ...CommonVariableConfig,
  },
  [Environments.DEV]: {
    environment: Environments.DEV,
    dynamodbSetting: { params1: "aaa" },
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
