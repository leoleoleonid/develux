import { stringify } from 'node:querystring';
import axios from 'axios';

export class BitbucketApiService {
  static BASE_URL = 'https://api.bitbucket.org/2.0/';
  private readonly repoUrl?: string;
  constructor(
    private repo: string,
    private workspace: string,
    private accessToken: string,
  ) {
    this.repoUrl = `${BitbucketApiService.BASE_URL}repositories/${this.workspace}/${this.repo}`;
  }

  async createPR(branch, version) {

    console.log(BitbucketApiService.name, 'createPR')
    const url = `${this.repoUrl}/pullrequests`;
    const body = {
      title: `Update dependencies, Version: ${version}`,
      source: {
        branch: {
          name: branch,
        },
      },
    };
    const config = {
      url,
      method: 'post',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.accessToken}`,
      },
      data: JSON.stringify(body),
    };

    const { data } = await axios.request(config);

    return data;
  }

  async getPackageJSON(commitHash): Promise<any> /*TODO fix any*/ {
    console.log(BitbucketApiService.name, 'getPackageJSON')
    const url = `${this.repoUrl}/src/${commitHash}/package.json`;
    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    const { data } = await axios.request(config);

    return data;
  }

  async createCommit(newPackageJSON: string, branch, lastCommit) {
    console.log(BitbucketApiService.name, 'createCommit')
    let reqData = stringify({
      message: 'update deps!',
      'package.json': newPackageJSON,
      author: 'leoleoleonid <leonidkoss1@gmail.com>', //TODO must be in db
      parents: lastCommit,
      branch: branch,
    });

    const url = `${this.repoUrl}/src`;
    let config = {
      method: 'post',
      url,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Bearer ${this.accessToken}`,
      },
      data: reqData,
    };

    const { data } = await axios.request(config);
    return data;
  }

  async createBranch(commitHash) {
    console.log(BitbucketApiService.name, 'createBranch')
    const url = `${this.repoUrl}/refs/branches`;
    const body = {
      name: 'update-deps-for-' + commitHash, //TODO prefix to config
      target: {
        hash: commitHash,
      },
    };
    const config = {
      method: 'post',
      url,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
      data: body,
    };

    await axios.request(config);
    return body.name;
  }

  async getRepoLastCommit(): Promise<string> {
    console.log(BitbucketApiService.name, 'getRepoLastCommit')
    const url = `${this.repoUrl}/commits`;
    const config = {
      method: 'get',
      url,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    };

    const { data } = await axios.request(config);
    return data.values[0].hash;
  }
}
