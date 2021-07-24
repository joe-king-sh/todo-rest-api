# TODO リスト用 REST API
TODOリストを管理するアプリケーションのバックエンド用REST API

## 環境
- AWS CDK 1.114.0 
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

3. npm依存パッケージをインストール
    ```zsh
    $ npm install
    ```

4. AWS CDKのブートストラップ
    ```zsh
    $ npm install -g aws-cdk
    $ cdk --version
    1.114.0 (build 7e41b6b)

    # 使用するAWSアカウントのリージョンで初めてCDKを使用する場合のみ以下を実行
    $ cdk bootstrap aws://{ACCOUNT-NUMBER}/{REGION}
    ```

# Test
```
npm test

npm test -- --coverage
```

# デプロイ方法
```
# 開発環境
$ npm run cdk:deploy target=dev
```

- GithubのSecretsに、AWS_ACCESS_KEY,AWS_SECRET_ACCESS_KEYの設定をする
- 
