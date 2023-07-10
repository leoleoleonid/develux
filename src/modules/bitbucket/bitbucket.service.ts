import { Injectable, Scope } from '@nestjs/common';
import { BitbucketRepository } from './bitbucket.repository';
import { BitbucketApiService } from './bitbucket.api.service';

@Injectable({ scope: Scope.TRANSIENT })
export class BitbucketService {
  static SUCCESS_MESSAGE = 'Success!!!';
  private readonly trackedDependencies = { lodash: '4.17.21' }; //TODO must be in separate service
  private bitbucketApiService?: BitbucketApiService;
  constructor(
    private bitbucketRepository: BitbucketRepository,
  ) {}

  setBitbucketApiService(bitbucketApiService: BitbucketApiService) {
    this.bitbucketApiService = bitbucketApiService;
  }

  async updateRepo(repo: string, version: string): Promise<string> {
    console.log(BitbucketService.name, 'Start updateRepo');
    if (!this.bitbucketApiService) {
      const { workspace, accessToken } =
        this.bitbucketRepository.getConnectedRepoName(repo);
      this.setBitbucketApiService(
        new BitbucketApiService(repo, workspace, accessToken),
      );
    }

    const lastCommit = await this.bitbucketApiService.getRepoLastCommit();
    const packageJSON = await this.bitbucketApiService.getPackageJSON(
      lastCommit,
    );
    const newPackageJSON = this.createNewPackageJSON(packageJSON);
    const newBranchName = await this.bitbucketApiService.createBranch(
      lastCommit,
    );
    await this.bitbucketApiService.createCommit(
      newPackageJSON,
      newBranchName,
      lastCommit,
    );
    await this.bitbucketApiService.createPR(newBranchName, version);
    console.log(BitbucketService.name, 'Finish updateRepo');
    return BitbucketService.SUCCESS_MESSAGE;
  }

  private createNewPackageJSON(packageJSON): string {
    const { dependencies } = packageJSON;
    const dependenciesToUpdate = this.findOldDependencies(dependencies);
    if (!dependenciesToUpdate) {
      console.log(BitbucketService.name, 'All updated!!!');
      throw new Error('All updated!!!');
    }

    const newPackageJSON = { ...packageJSON };
    newPackageJSON.dependencies = {
      ...newPackageJSON.dependencies,
      ...dependenciesToUpdate,
    };
    return JSON.stringify(newPackageJSON);
  }

  private findOldDependencies(dependencies: {
    [key: string]: string;
  }): { [key: string]: string } | null {
    const dependenciesToUpdate = {};
    Object.keys(this.trackedDependencies).forEach((dep) => {
      if (dependencies[dep]) {
        const lastVersion = this.trackedDependencies[dep];
        const currentVersion = dependencies[dep];
        if (lastVersion !== currentVersion)
          dependenciesToUpdate[dep] = lastVersion;
      }
    });

    if (Object.keys(dependenciesToUpdate).length > 0)
      return dependenciesToUpdate;
    return null;
  }
}
