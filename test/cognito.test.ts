import { CognitoUserPool } from "../lambda/infrastructures/cognito";

describe("Cognito 関連サービスのテスト", (): void => {
  /**
   * Cognito関連処理をテスト
   */
  test("Case1: トークンからユーザ名を取得可能", () => {
    const token =
      "eyJraWQiOiJpV3RidzNaXC9WbFVyUWhCaGpLcEROb1wvZUp6VDRQbSt4SGZZS1JyYTdBQVk9IiwiYWxnIjoiUlMyNTYifQ.eyJzdWIiOiJkYjYyNWI4NC04OTZmLTQ1ZDktOTE2ZS1lYjIzMGQ1ZDg4ZGQiLCJlbWFpbF92ZXJpZmllZCI6dHJ1ZSwiaXNzIjoiaHR0cHM6XC9cL2NvZ25pdG8taWRwLmFwLW5vcnRoZWFzdC0xLmFtYXpvbmF3cy5jb21cL2FwLW5vcnRoZWFzdC0xX29GY2pMN29tMiIsImNvZ25pdG86dXNlcm5hbWUiOiJteS11bml0LXRlc3QtdXNlciIsIm9yaWdpbl9qdGkiOiI2ZDk4MzJhMS0zYWFhLTQ4MjYtOGUwNi1kYmNhYzBiZGRkOTEiLCJhdWQiOiI0OXI5YzgxMnFzNmJzNXJiMGc1bTZsdm52biIsImV2ZW50X2lkIjoiOWRmYjdkMGUtOTE2OC00YjRjLTgyM2QtNGY3NzA1ODY3YWMxIiwidG9rZW5fdXNlIjoiaWQiLCJhdXRoX3RpbWUiOjE2MjY2OTQ5NTUsImV4cCI6MTYyNjY5ODU1NSwiaWF0IjoxNjI2Njk0OTU1LCJqdGkiOiJkMTE0NjIyMy1hMWIwLTQ4OWYtYTcxZS1iYmM5M2ZmNmE3ODUiLCJlbWFpbCI6InVuaXQtdGVzdC1leGFtcGxlQGV4YW1wbGUuY29tIn0.13ptpMlwzZWQhw5zjM8R-R8olhiehtcPHY0AmHSqnWkMPhFcMPMhE7thDaZDTh4634ToLjTjGoKZpDUfzYa_ne6om6DUk9zHg48XVZRYzOCAL3j2RSOyzKC_QgSgs-5YcfJffndHNlj6GiPuLxY9XtrKrzergs8ZEoGBa4qmgVRbbLchKPaOvYyZqcUq_62v5GzhAGghuAaeawB8SbJFMc3whTSGdrTjzdK3f3dl0nE9un1gjXOuQGB1N-Gt0eXWaxa02wKyzrnEDe39o4YmP0XaF1Da759KXiUVVG-GgkrYF5lo_th0UYAz1J2c_PAQRIDwxwTTuI0f-fth8fO_Aw";

    // WHEN
    const expected = "my-unit-test-user";

    // THEN
    const userName = CognitoUserPool.getUserNameFromIdToken(token);
    expect(userName).toBe(expected);
  });
});
