import { Injectable } from '@nestjs/common';
import { BitbucketRepository } from './bitbucket.repository';

//TODO add HTTPService
import axios from 'axios';
//TODO create BitbucketApiService like dynamic module (depends on  repo, workspace, accessToken)

@Injectable()
export class BitbucketService {
  private readonly trackedDependencies = { lodash: '4.17.21' };
  static BASE_URL = 'https://api.bitbucket.org/2.0/';
  constructor(private bitbucketRepository: BitbucketRepository) {}

  async updateRepo(repo: string, version: string): Promise<string> {
    const { workspace, accessToken } =
      this.bitbucketRepository.getConnectedRepoName(repo);
    const lastCommit = await this.getRepoLastCommit(
      repo,
      workspace,
      accessToken,
    );
    const newPackageJSON = await this.getRepoDependencies(
      repo,
      workspace,
      accessToken,
      lastCommit,
    );
    const newBranchName = await this.createBranch(
      repo,
      workspace,
      accessToken,
      lastCommit,
    );
    await this.createCommit(
      newPackageJSON,
      workspace,
      repo,
      accessToken,
      newBranchName,
    );
    await this.createPR(repo, workspace, accessToken, newBranchName);
    return 'Success!!';
  }

  private async createPR(repo, workspace, accessToken, branch) {
    const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/pullrequests`;
    const body = {
      title: 'Update deoendencies',
      source: {
        branch: {
          name: branch,
        },
      },
    };
    const config = {
      headers: {
        'Content-Type': 'Content-Type: application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      data: body,
    };

    const { data } = await axios.post(url, config);

    return data;
  }

  private async getRepoDependencies(
    repo,
    workspace,
    accessToken,
    commitHash,
  ): Promise<string> {
    const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/src/${commitHash}/package.json`;
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const { data } = await axios.request(config);
    const packageJSON = data;
    const { dependencies } = data;
    const dependenciesToUpdate = this.findDeprecatedDependencies(dependencies);

    if (!dependenciesToUpdate) throw new Error('All updated!!!');
    const newPackageJSON = { ...packageJSON };
    newPackageJSON.dependencies = {
      ...newPackageJSON.dependencies,
      ...dependenciesToUpdate,
    };
    return JSON.stringify(newPackageJSON);
  }

  private async createCommit(
    newPackageJSON: string,
    workspace,
    repo,
    accessToken,
    branch,
  ) {
    const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/src`;
    const queryParams = {
      branch: encodeURIComponent(branch),
      message: encodeURIComponent('update deps'),
      author: encodeURIComponent('dependa bot <leonidkoss1@gmail.com>'),
    };
    const config = {
      params: queryParams,
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${accessToken}`,
      },
    };
    const formData = new FormData();
    const dataBlob = new Blob([newPackageJSON], { type: 'text/plain' });
    //TODO fix
    //@ts-ignore
    formData.append('package.json', dataBlob, { filename: 'package.json' });

    const { data } = await axios.post(url, formData, config);
    return data;
  }

  private async createBranch(repo, workspace, accessToken, commitHash) {
    const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/refs/branches`;
    const body = {
      name: 'update-deps-for-' + commitHash,
      target: {
        hash: commitHash,
      },
    };
    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      data: body,
    };

    const { data } = await axios.request(config);
    return body.name;
  }

  private findDeprecatedDependencies(dependencies: {
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

  private async getRepoLastCommit(repo, workspace, accessToken): Promise<any> {
    const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/commits`;
    const config = {
      method: 'get',
      maxBodyLength: Infinity,
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    const { data } = await axios.request(config);
    return data.values[0].hash;
  }
}
