const azdev = require('azure-devops-node-api');
const inquirer = require('inquirer');
const program = require('commander');
const config = require('dotenv-safe').config().parsed;
const open = require('open');

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
  message: 'Pull Request:',
  choices() {
    return pullRequests.map((pullRequest) => ({
      name: program.all ? `${pullRequest.repository.project.name}: ${pullRequest.title}` : pullRequest.title,
      value: pullRequest,
      short: pullRequest.title
    }));
  }
}];

const main = async() => {
  program.option('-a, --all', 'Grab PRs from all projects');
  program.parse(process.argv);

  let authHandler = azdev.getPersonalAccessTokenHandler(config.AZURE_DEVOPS_PERSONAL_ACCESS_TOKEN);
  let connection = new azdev.WebApi(config.ORG_URL, authHandler);

  let projectClient = await connection.getCoreApi();
  let gitClient = await connection.getGitApi();
  let projects = await projectClient.getProjects();

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