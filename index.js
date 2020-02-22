const inquirer = require('inquirer');
const program = require('commander');
const dotenv = require('dotenv');
const open = require('open');
const fs = require('fs');
const path = require('path');
const { apiFactory } = require('./apiFactory');
const PromptFactory = require('./prompts');

const configFilePath = path.join( __dirname,'./.env');

const resetConfigHandler = () => {
  if (fs.existsSync(configFilePath)) {
    fs.unlinkSync(configFilePath);
    console.log('Deleted config...');
    return;
  }
  console.log('No existing config...');
};

const configBuilder = async() => {
  if(!fs.existsSync(configFilePath)) {
    const config = await inquirer.prompt(firstRunPrompt());
    fs.writeFileSync(configFilePath,
    `ORG_URL=${config.orgUrl}
     AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN=${config.token}`);
  }
  return dotenv.config({ path: configFilePath }).parsed;
};

const main = async() => {
  program
    .option('-a, --all', 'Grab PRs from all projects')
    .option('--reset', 'Clears existing configuration')
    .version(require('./package.json').version)
    .parse(process.argv);
  
  if (program.reset) {
    resetConfigHandler();
    return;
  }

  const config = await configBuilder();
  const {
    projectPrompt,
    prSelectorPrompt,
    firstRunPrompt
  } = PromptFactory(config);
  console.log(prSelectorPrompt);
  const { projectApi, gitApi } = await apiFactory(config);

  const projects = await projectApi.getProjects();

  let projectSelection;

  if (program.all) {
    projectSelection = {
      project: projects
    };
  } else {
    projectSelection = await inquirer.prompt(projectPrompt(projects));
  }

  const prByProjectRequests = projectSelection.project.map((project) => 
    gitApi.getPullRequestsByProject(project.id, { status: 'active'}));

  const pullRequests = await Promise.all(prByProjectRequests)
    .then((prsByProject) => {
      return [].concat(...prsByProject);
    });

  if (pullRequests.length == 0) {
    console.log(`Yay! No active PRs for ${program.all ? 'all projects' : projectSelection.project[0].name}`);
    return;
  }

  const prAnswer = await inquirer.prompt(prSelectorPrompt(pullRequests, { showAll: program.all }));

  const prUrl = `${config.ORG_URL}/${prAnswer.pullRequest.repository.project.id}/_git/${prAnswer.pullRequest.repository.id}/pullrequest/${prAnswer.pullRequest.pullRequestId}`;
  await open(prUrl);
}

module.exports = main;