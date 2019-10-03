#!/usr/bin/env node

const azdev = require('azure-devops-node-api');
const inquirer = require('inquirer');
const program = require('commander');
const dotenv = require('dotenv');
const open = require('open');
const fs = require('fs');
const path = require('path');

const configFilePath = path.join( __dirname,'./.env');

const projectSelectorQuestionFactory = (projects) => [{
  type: 'list',
  name: 'project',
  message: 'Which project?',
  choices() {
    return projects.sort((a, b) => (a.name > b.name) ? 1 : -1) // sort alphabetically
      .map((project) => ({
        name: project.name,
        value: [project],
        short: project.name
      })
    );
  }
}];
const prSelectorQuestionFactory = (pullRequests) => [{
  type: 'list',
  name: 'pullRequest',
  message: 'Which PR to view?',
  choices() {
    return pullRequests.map((pullRequest) => ({
      name: program.all ? `${pullRequest.repository.project.name}: ${pullRequest.title}` : pullRequest.title,
      value: pullRequest,
      short: pullRequest.title
    }));
  }
}];

const envFirstRunQuestionFactory = () => [
  {
    type: 'input',
    name: 'orgUrl',
    message: 'Azure DevOps instance URL:',
  },{
    type: 'input',
    name: 'token',
    message: 'Personal Access Token:'
  }
];

const firstRunConfig = async() => {
  if(fs.existsSync(configFilePath)) { return; }
  const config = await inquirer.prompt(envFirstRunQuestionFactory());
  fs.writeFileSync(configFilePath, '');
  fs.appendFileSync(configFilePath, `ORG_URL=${config.orgUrl}\n`);
  fs.appendFileSync(configFilePath, `AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN=${config.token}\n`);
};

const main = async() => {
  program
    .option('-a, --all', 'Grab PRs from all projects')
    .option('--reset', 'Clears existing configuration')
    .parse(process.argv);
  
  if (program.reset) {
    if (fs.existsSync(configFilePath)) {
      fs.unlinkSync(configFilePath);
      console.log('Deleted config...');
      return;
    }
    console.log('No existing config...');
    return;
  }

  await firstRunConfig();
  const config = dotenv.config({ path: configFilePath }).parsed;

  const authHandler = azdev.getPersonalAccessTokenHandler(config.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN);
  const connection = new azdev.WebApi(config.ORG_URL, authHandler);

  const projectClient = await connection.getCoreApi();
  const gitClient = await connection.getGitApi();
  const projects = await projectClient.getProjects();

  let projectSelection;

  if (program.all) {
    projectSelection = {
      project: projects.reduce((array, project) => [project, ...array], [])
    };
  } else {
    projectSelection = await inquirer.prompt(projectSelectorQuestionFactory(projects));
  }

  const pullRequests = await Promise.all(projectSelection.project.map((project) => gitClient.getPullRequestsByProject(project.id, { status: 'active'}))).then((prsByProject) => {
    return [].concat(...prsByProject);
  });


  if (pullRequests.length == 0) {
    console.log(`Yay! No active PRs for ${program.all ? 'all projects' : projectSelection.project[0].name}`);
    return;
  }

  const prAnswer = await inquirer.prompt(prSelectorQuestionFactory(pullRequests));

  const prUrl = `${config.ORG_URL}/${prAnswer.pullRequest.repository.project.id}/_git/${prAnswer.pullRequest.repository.id}/pullrequest/${prAnswer.pullRequest.pullRequestId}`;
  await open(prUrl);
}

module.exports = main();