import {
  expect as expectCDK,
  haveResource,
  countResources,
  ResourcePart,
} from "@aws-cdk/assert";
import * as cdk from "@aws-cdk/core";
import * as environment from "../../lib/environment";
import { createCdkStack } from "../../bin/cdk";

jest.mock("../../lib/stack/appStack");

/**
 * Stackレベルでのテスト
 * テストの粒度：
 * 　生成したCfnテンプレートに意図した個数Resourceが存在することをテストする
 */
describe("CDKエントリポイントのテスト", (): void => {
  test("Case1: デプロイ実行環境に定義済みの環境以外が指定されたら落とす(target=unknown))", () => {
    expect.assertions(1);
    jest.resetAllMocks();

    // WHEN
    const tryGetContextpy = jest
      .spyOn(cdk.ConstructNode.prototype as any, "tryGetContext")
      .mockReturnValue("unknown");

    // エラーになること
    expect(() => createCdkStack()).toThrow(Error);
  });

  for (const [i, env] of Object.values(environment.Environments).entries()) {
    test(`Case2-${
      i + 1
    }: デプロイ実行環境に定義済みの環境が指定されている場合はエラーにしない(target=${env}))`, () => {
      expect.assertions(1);
      jest.resetAllMocks();

      // WHEN
      const tryGetContextpy = jest
        .spyOn(cdk.ConstructNode.prototype as any, "tryGetContext")
        .mockReturnValue(env);

      // エラーにならないこと
      expect(() => createCdkStack()).not.toThrow(Error);
    });
  }
});
