# azure-devops-pr-cli

CLI to view active pull requests on Azure DevOps.

![npm](https://img.shields.io/npm/v/azure-devops-pr-cli)

## Install

```bash
npm i -g azure-devops-pr-cli
```

## Usage

On first run, you will be prompted for your Azure Devops URL, as well as a Personal Access Token.
```bash
# Prompts for which project to view active pull requests from
azure-devops-pr-cli

# Shows all active pull requests across all projects
azure-devops-pr-cli -a

# Clears first run configuration
azure-devops-pr-cli --reset
```

## Future Development Goals
- Get working with `npx` rather than global install
- Code cleanup
- Perhaps expand usage to more than just opening browser to link
- Learn more best practices about writing Node packages
  - This was my first published package.

## License

[ISC](./LICENSE.md)