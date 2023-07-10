import {Command, CommandRunner, InquirerService} from 'nest-commander';


@Command({name: 'connect', description: 'A parameter parse'})
export class ConnectRepoCommand extends CommandRunner {
    constructor(private readonly inquirer: InquirerService) {
        super()
    }

    async run(): Promise<void> {
        const {
            repo,
            workspace,
            accessToken
        } = (await this.inquirer.ask<{ repo: string, workspace: string , accessToken: string }>('connect-repo-questions', undefined));
        console.log('!!!!!!!!!', repo, workspace, accessToken);
    }
}