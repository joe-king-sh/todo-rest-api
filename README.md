# TODO リスト用 REST API
TODOリストを管理するアプリケーションのバックエンド用REST API

## 環境
- Python 3.8.6
- pipenv, version 2021.5.29
- AWS CDK 1.114.0 
- AWS SAM CLI, version 1.26.0
- Docker version 20.10.5
- OS: Mac Big Sur 11.1

## 前提条件
1. npmがインストール済み
    ```zsh
    $ npm --version
    7.20.0
    ```
2. Dockerがインストール済み
    ```zsh
    $ docker --version
    Docker version 20.10.5, build 55c4c88
    ```
3. AWS CLIがインストール済み
    ```
    $ aws --version
    aws-cli/2.0.17 Python/3.7.3 Linux/5.10.25-linuxkit botocore/2.0.0dev21
    ```
4. AWSのクレデンシャルを設定済み
    ```
    $ aws configure
    AWS Access Key ID [****************ABCD]: 
    AWS Secret Access Key [****************EFGH]: 
    Default region name [ap-northeast-1]: 
    Default output format [json]: 
    ```
## 環境構築
1. Pythonが入っていない場合[ここから入手](https://www.python.org/downloads/)し、Pthon3.8の実行環境を整える
    ```zsh
    $ python --version
    Python 3.8.11
    ```
1. 仮想環境と依存ライブラリ管理のため、Pipenvをインストールする
    ```zsh
    $ pip install pipenv
    $ pipenv --version
    pipenv, version 2021.5.29
    ```
1. AWS CDKをインストールする
    ```zsh
    $ npm install -g aws-cdk
    $ cdk --version
    1.114.0 (build 7e41b6b)

    # 使用するAWSアカウントのリージョンで初めてCDKを使用する場合のみ以下を実行
    $ cdk bootstrap aws://{ACCOUNT-NUMBER}/{REGION}
    ```
1. AWS SAMをインストールする(以下はMac想定)、それ以外の場合は[ここを参照する](https://docs.aws.amazon.com/ja_jp/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
    ```zsh
    $ brew tap aws/tap
    $ brew install aws-sam-cli
    $ sam --version
    SAM CLI, version 1.26.0
    ```

1. Pythonの仮想環境構築と、依存ライブラリをインストールする
    ```zsh
    $ pipenv install -d
    ```
  
    以降は、リポジトリのルートで以下コマンドを実行し、仮想環境に入ってから操作を行ってください。  
    ```zsh
    $ pipenv shell
    ```
1. npm依存パッケージをインストール
    ```zsh
    $ cd ./src/cdk
    $ npm install
    ```

# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

 * `npm run build`   compile typescript to js
 * `npm run watch`   watch for changes and compile
 * `npm run test`    perform the jest unit tests
 * `cdk deploy`      deploy this stack to your default AWS account/region
 * `cdk diff`        compare deployed stack with current state
 * `cdk synth`       emits the synthesized CloudFormation template

# Test
```
npm test

npm test -- --coverage
```

# Deploy
- node_modules elasticsearch配下のnode_modulesが邪魔をするので消す

