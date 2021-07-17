import * as cdk from "@aws-cdk/core";
import { generateResourceName } from "../lib/utility";
import * as environment from "../lib/environment";
import { Authentication } from "./construct/authentication";

export class AppStack extends cdk.Stack {
  constructor(
    scope: cdk.Construct,
    id: string,
    environmentVariables: environment.EnvironmentVariables,
    props?: cdk.StackProps
  ) {
    super(scope, id, props);

    const projectName = environmentVariables.projectName;
    const env = environmentVariables.environment;

    /*
     * Cognito関連リソースを作成
     */
    const auth = new Authentication(
      this,
      generateResourceName(projectName, "Authentication", env),
      {environmentVariables: environmentVariables}
    );
    
  }
}
