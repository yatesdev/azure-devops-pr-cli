const inquirer = require('inquirer');
const program = require('commander');
const open = require('open');

const ApiFactory = require('./ApiFactory');
const ConfigFactory = require('./ConfigFactory');
const PromptFactory = require('./PromptFactory');


const main = async() => {
  program
    .option('-a, --all', 'Grab PRs from all projects')
    .option('--reset', 'Clears existing configuration')
    .version(require('./package.json').version)
    .parse(process.argv);
  
  const config = await ConfigFactory(program);
  const promptFactory = new PromptFactory(config);
  const { projectApi, gitApi } = await ApiFactory(config);

  const projects = await projectApi.getProjects();

  let projectSelection;

  if (program.all) {
    projectSelection = {
      project: projects
    };
  } else {
    projectSelection = await inquirer.prompt(promptFactory.projectSelection(projects));
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

  const prAnswer = await inquirer.prompt(promptFactory.pullRequestSelection(pullRequests, { showAll: program.all }));

  const prUrl = `${config.ORG_URL}/${prAnswer.pullRequest.repository.project.id}/_git/${prAnswer.pullRequest.repository.id}/pullrequest/${prAnswer.pullRequest.pullRequestId}`;
  await open(prUrl);
}

module.exports = main;