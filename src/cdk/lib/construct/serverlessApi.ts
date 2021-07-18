import * as cdk from "@aws-cdk/core";
import { generateResourceName } from "../utility";
import * as environment from "../environment";
import * as lambda from "@aws-cdk/aws-lambda";
import { ServicePrincipal } from "@aws-cdk/aws-iam";
import * as logs from "@aws-cdk/aws-logs";

import * as apigw from "@aws-cdk/aws-apigateway";

interface ServerlessApiProps {
  environmentVariables: environment.EnvironmentVariables;
  userPoolDomainName: string;
  userPoolArn: string;
  userPoolId: string;
}

export class ServerlessApi extends cdk.Construct {
  // serverlessApi:

  private region: string = cdk.Stack.of(this).region;
  swagger: {
    openapi: string;
    info: {};
    components: {};
    paths: {};
    servers: {};
  };

  constructor(scope: cdk.Construct, id: string, props: ServerlessApiProps) {
    super(scope, id);

    const projectName = props.environmentVariables.projectName;
    const env = props.environmentVariables.environment;

    // Lambdaの作成
    const helloLambda = new lambda.Function(this, "helloFunction", {
      code: new lambda.AssetCode("lambda/src"),
      handler: "hello.handler",
      runtime: lambda.Runtime.NODEJS_14_X,
      environment: {
        // TABLE_NAME: dynamoTable.tableName,
        // PRIMARY_KEY: 'itemId',
      },
      functionName: generateResourceName(projectName, "HelloLambda", env),
      description: "テスト用の関数だよ",
      // events: [new ApiEventSource("get", "/hello")], // swaggerもあるので冗長な気がするが、これを指定しないとAPI GatewayからLambdaInvokeするロールが作られない
    });

    // API Gatewayの作成
    // Open API 3.0でAPI仕様を定義する
    this.swagger = {
      openapi: "3.0.0",
      info: {
        description: "Todoリストを管理するREST API",
        title: `${props.environmentVariables.projectName} REST API`,
        version: "1.0.0",
        contact: {
          name: "API Support",
          url: "https://twitter.com/joe_king_sh",
        },
        license: {
          name: "MIT",
          url: "https://opensource.org/licenses/mit-license.php",
        },
      },
      // TODO このAPI＿IDだけ、デプロイ完了後Swagger.ymlだけ入れ替えてから、仕様書をS３へアップする。もしくはデプロイされた後の仕様書を抜いてきて、入れ替える
      servers: [
        {
          url: `https://$API_ID.execute-api.${props.environmentVariables.region}.amazonaws.com/${env}/`,
          description: "",
        },
      ],
      // リソースに関わらず共通の設定をここで定義する
      components: {
        // Cognitoユーザプールを使用した認証を設定する
        securitySchemes: {
          CognitoAuth: {
            type: "apiKey",
            name: "Authorization",
            in: "header",
            "x-amazon-apigateway-authtype": "cognito_user_pools",
            "x-amazon-apigateway-authorizer": {
              providerARNs: [
                "arn:aws:cognito-idp:${AWS::Region}:${AWS::AccountId}:userpool/" +
                  props.userPoolId,
              ],
              type: "cognito_user_pools",
            },
          },
        },
        // 共通で使用するレスポンスを定義する
        schemas: {
          Todo: {
            type: "object",
            properties: {
              todoId: {
                type: "string",
              },
              title: {
                type: "string",
              },
              content: {
                type: "string",
              },
              dueDate: {
                type: "string",
                format: "date",
              },
              isImportant: {
                type: "boolean",
              },
            },
          },
          Error: {
            type: "object",
            required: ["message"],
            properties: {
              message: {
                type: "string",
              },
            },
          },
        },
      },
      // 各APIのリソースを以下で定義していく
      paths: {
        "/todos": {
          get: {
            operationId: "listTodos",
            tags: ["Todo"],
            summary: "Todo情報 一括取得API",
            description: "ユーザーのTodoを指定した件数分返却する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            parameters: [
              {
                name: "limit",
                in: "query",
                description: "取得するTodoの件数を指定する(最大 100件)",
                required: false,
                schema: {
                  type: "integer",
                  format: "int32",
                },
              },
              {
                name: "nextToken",
                in: "query",
                description:
                  "次のページを取得する場合に指定する(指定した場合limitは無視される)",
                required: false,
                schema: {
                  type: "string",
                },
              },
            ],
            responses: {
              200: {
                description: "Todo情報のjsonリストを返却する",
                content: {
                  "application/json": {
                    schema: {
                      type: "object",
                      required: ["todos"],
                      properties: {
                        todos: {
                          type: "array",
                          items: {
                            $ref: "#/components/schemas/Todo",
                          },
                        },
                        nextToken: {
                          type: "string",
                        },
                      },
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                helloLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
          post: {
            operationId: "createTodos",
            tags: ["Todo"],
            summary: "Todo情報 登録API",
            description: "ユーザーのTodo情報を1件登録する",
            security: [
              {
                CognitoAuth: [],
              },
            ],
            requestBody: {
              description: "Todo情報をシステムに登録する",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    required: ["title", "content"],
                    properties: {
                      title: {
                        type: "string",
                      },
                      content: {
                        type: "string",
                      },
                      dueDate: {
                        type: "string",
                        format: "date",
                      },
                      isImportant: {
                        type: "boolean",
                      },
                    },
                  },
                  examples: {
                    Todo: {
                      summary: "Todo情報 登録例",
                      value: {
                        title: "今日やること",
                        content: "ゴミを捨てる",
                        dueDate: "2021-07-18",
                        isImportant: false,
                      },
                    },
                  },
                },
              },
            },
            responses: {
              200: {
                description: "Todo情報の登録が正常に完了",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Todo",
                    },
                  },
                },
              },
              default: {
                description: "予期せぬエラーが発生",
                content: {
                  "application/json": {
                    schema: {
                      $ref: "#/components/schemas/Error",
                    },
                  },
                },
              },
            },
            "x-amazon-apigateway-integration": {
              uri:
                "arn:aws:apigateway:${AWS::Region}:lambda:path/2015-03-31/functions/arn:${AWS::Partition}:lambda:${AWS::Region}:${AWS::AccountId}:function:" +
                helloLambda.functionName +
                "/invocations",
              responses: {
                default: {
                  statusCode: "200",
                },
              },
              passthroughBehavior: "when_no_match",
              httpMethod: "POST",
              contentHandling: "CONVERT_TO_TEXT",
              type: "aws_proxy",
            },
          },
        },
      },
    };
    const api = new apigw.SpecRestApi(
      this,
      generateResourceName(projectName, "SpecRestApi", env),
      {
        restApiName: generateResourceName(projectName, "Api", env),
        apiDefinition: apigw.ApiDefinition.fromInline(this.swagger),
        deployOptions: {
          stageName: env,
          accessLogDestination: new apigw.LogGroupLogDestination(
            new logs.LogGroup(
              this,
              generateResourceName(projectName, "ApiLog", env),
              {
                logGroupName: generateResourceName(projectName, "ApiLog", env),
                removalPolicy: cdk.RemovalPolicy.DESTROY,
              }
            )
          ),
          loggingLevel: apigw.MethodLoggingLevel.INFO,
        },
        cloudWatchRole: true,
      }
    );

    // API GatewayからLambdaをInovokeできるようにリソースベースポリシーを追加
    helloLambda.addPermission(`LambdaPermission`, {
      principal: new ServicePrincipal("apigateway.amazonaws.com"),
      sourceArn: api.arnForExecuteApi(),
    });

    // const authorizer = new apigw.CfnAuthorizer(
    //   this,
    //   'APIGatewayAuthorizer',
    //   {
    //     name: 'authorizer',
    //     identitySource: 'method.request.header.Authorization',
    //     providerArns: [props.userPoolArn],
    //     restApiId: api.restApiId,
    //     type: apigw.AuthorizationType.COGNITO,
    //   }
    // );

    // TODO  API ドキュメント公開用 S3Bucketの作成

    const fs = require("fs");
    const yaml = require("js-yaml");

    const yamlText = yaml.dump(this.swagger);
    fs.writeFile("./cdk.out/swagger.yaml", yamlText, "utf8", (err: any) => {
      if (err) {
        console.error(err.message);
        process.exit(1);
      }
      console.log("SwaggerファイルをYamlで出力しました");
    });
    // TODO ドキュメントを各環境毎のS3へアップロードするやつ。Synthで動いてしまうから、S３Put自体は、テスト通った後の方がいいかも　ここではcdk.outに吐くまで

    // APIキーとかも作られるまでは、わからないので、それを事前にSwaggerに入れることはできない。
    // Deploy完了後のoutputから取得してスクリプトで埋め込むことにする。
    // // swaggerにサーバー情報を追加
    // this.swagger.servers = [
    //   {
    //     url: api.arnForExecuteApi,
    //     description: `${env} 環境`,
    //   },
    // ];
  }
}
