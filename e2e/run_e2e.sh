#!/bin/bash
#  渡されたテスト実行ステージを環境変数にセットして、E2Eテストを実行する
#
#  Usage:
#      run_e2s.sh target=stg

echo 'E2Eテスト 実行開始'

# 環境変数の設定

ARGS=$1
TARGET_ARR=(${ARGS//=/ })
ENV=${TARGET_ARR[1]}

if [ "${ENV}" != "dev" ] && [ "${ENV}" != "stg" ] && [ "${ENV}" != "prod" ]; then
    echo "引数を[target=env]の形で指定してください。"
    echo "許可されるenvは[dev or stg or prod]です"
    exit 1
fi

export TEST_ENV=${TARGET_ARR[1]}
echo "E2Eテスト実行環境変数を設定: ${TEST_ENV}"

# テストの実行
jest e2e

# 環境変数のリセット
export TEST_ENV=''
echo "E2Eテスト実行環境変数をリセット: ${TEST_ENV}"

echo 'E2Eテスト 実行終了'
