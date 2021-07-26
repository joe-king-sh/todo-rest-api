/**
 * 実行環境に応じたテストケース名を返す
 * テスト用のヘルパー関数
 */
export const buildTestCaseName = (env: string, caseName: string) => {
  return `[実行環境:${env}] ${caseName}`;
};
