const azdev = require('azure-devops-node-api');

const ApiFactory = async(config) => {
  const authHandler = azdev.getPersonalAccessTokenHandler(config.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN);
  const connection = new azdev.WebApi(config.ORG_URL, authHandler);
  const projectApi = await connection.getCoreApi();
  const gitApi = await connection.getGitApi();

  return {
    projectApi,
    gitApi
  };
}

module.exports = ApiFactory;