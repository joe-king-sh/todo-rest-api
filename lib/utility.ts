import { Environments } from "./environment";

/**
 * CDKでデプロイするリソース名をつける共通関数
 * プロジェクト間、環境間でのリソース名の競合を避ける目的
 * @param projectName プロジェクト名
 * @param resourceName リソース名
 * @param env デプロイする環境
 * @returns `${projectName}-${resourceName}-${env}`
 */
export const buildResourceName = (
  projectName: string,
  resourceName: string,
  env: Environments
) => {
  return `${projectName}-${resourceName}-${env}`;
};
