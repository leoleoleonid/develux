import {Command, CommandRunner, InquirerService} from 'nest-commander';
import {BitbucketService} from "../bitbucket/bitbucket.service";


@Command({ name: 'update', description: 'A parameter parse' })
export class UpdateRepoCommand extends CommandRunner {
    constructor(
        private readonly inquirer: InquirerService,
        private bitbucketService: BitbucketService
        ) {
        super()
    }

    async run(): Promise<void> {
        // const {repo, version} = (await this.inquirer.ask<{ repo: string , version: string}>('update-repo-questions', undefined));
        const res = await this.bitbucketService.updateRepo('updatablerepo', '1.0.0');
        console.log('!!!!!!!!!', res)
    }
}