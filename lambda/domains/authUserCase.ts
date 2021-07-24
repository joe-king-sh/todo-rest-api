import { CognitoUserPool } from "../infrastructures/cognito";

export class AuthUseCase {
  public static async createIdToken(
    createIdTokenProps: createIdTokenProps
  ): Promise<createIdTokenOutput> {
    const idToken =
      CognitoUserPool.createIdTokenFromCognito(createIdTokenProps);

    return idToken;
  }
}

interface createIdTokenProps {
  userId: string;
  password: string;
}

interface createIdTokenOutput {
  idToken: string;
}
