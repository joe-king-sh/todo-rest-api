const fs = require("fs");

export const readCdkOutputs = () => {
  const cdkOutputs = JSON.parse(fs.readFileSync("./cdk-outputs.json", "utf8"));
  // console.dir(cdkOutputs);

  const outputsResult = {
    userPoolId: "",
    userPoolClientId: "",
    apiEndpoint: "",
    apiId: "",
  };

  for (let [stackName, outputs] of Object.entries(cdkOutputs)) {
    console.log("StackName: ", stackName);
    console.log("環境: ", stackName.split("-"));
    const projectName = stackName.split("-")[0];
    const stackId = stackName.split("-")[1];
    const env = stackName.split("-")[2];

    for (let [key, value] of Object.entries(outputs as any)) {
      if (key.startsWith(projectName + "Authentication" + env + "userpoolid")) {
        outputsResult.userPoolId = value as string;
      }
      if (
        key.startsWith(
          projectName + "Authentication" + env + "userpoolclientid"
        )
      ) {
        outputsResult.userPoolClientId = value as string;
      }
      if (key.startsWith(projectName + "ServerlessApi" + env + "apiid")) {
        outputsResult.apiId = value as string;
      }
      if (
        key.startsWith(
          projectName + "ServerlessApi" + env + projectName + "SpecRestApi"
        )
      ) {
        outputsResult.apiEndpoint = value as string;
      }
    }
  }
  console.log("CDK Outputs読み込み結果: ");
  console.dir(outputsResult);
  return outputsResult;
};
