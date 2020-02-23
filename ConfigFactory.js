const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

const configFilePath = path.join( __dirname,'./.env');

const resetConfig = () => {
  if (fs.existsSync(configFilePath)) {
    fs.unlinkSync(configFilePath);
    console.log('Deleted config...');
    return;
  }
  console.log('No existing config...');
};

const configBuilder = async() => {
  if(!fs.existsSync(configFilePath)) {
    const config = await inquirer.prompt(PromptFactory.firstRunPrompt());
    fs.writeFileSync(configFilePath,
    `ORG_URL=${config.orgUrl}
     AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN=${config.token}`);
  }
  return dotenv.config({ path: configFilePath }).parsed;
};

module.exports = async(options) => {
  if (options.reset) {
    resetConfig();
  }
  return await configBuilder();
};