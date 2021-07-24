
# redoc-cliでswagge.yamlからhtmlへ出力する
redoc-cli bundle ./docs/api/swagger.yaml
cp ./redoc-static.html ./docs/api/api-spec.html