const projectSelectorQuestionFactory = (options, projects) => [{
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

const prSelectorQuestionFactory = (options, pullRequests) => [{
  type: 'list',
  name: 'pullRequest',
  message: 'Which PR to view?',
  choices() {
    return pullRequests.map((pullRequest) => ({
      name: options.showAll ? `${pullRequest.repository.project.name}: ${pullRequest.title}` : pullRequest.title,
      value: pullRequest,
      short: pullRequest.title
    }));
  }
}];

const envFirstRunQuestionFactory = (options) => [
  {
    type: 'input',
    name: 'orgUrl',
    message: 'Azure DevOps instance URL:',
    validate: function(value) {
      var pass = value.match(
        /^(http(s)?:\/\/)[\w.-]+(?:\.[\w]+)+$/i
      );
      if (pass) {
        return true;
      }

      return 'Please enter a valid url (no trailing slash)';
    }
  },{
    type: 'input',
    name: 'token',
    message: 'Personal Access Token:'
  }
];

const PromptFactory = (config) => ({
  projectPrompt: projectSelectorQuestionFactory.bind(null, config),
  prSelectorPrompt: prSelectorQuestionFactory.bind(null, config),
  firstRunPrompt: envFirstRunQuestionFactory.bind(null, config)
});

module.exports = PromptFactory;