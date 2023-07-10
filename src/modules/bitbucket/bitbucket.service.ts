import { Injectable } from '@nestjs/common';
import {BitbucketRepository} from "./bitbucket.repository";
import axios from 'axios';

//TODO add HTTPService

const delay = async () => {
    return new Promise((resolve, reject) => {
        setTimeout(resolve,10000)
    })
}
@Injectable()
export class BitbucketService {
    private readonly trackedDependencies = { 'lodash': '4.17.21' };
    static BASE_URL = 'https://api.bitbucket.org/2.0/'
    constructor(private bitbucketRepository : BitbucketRepository) {}

    async updateRepo(repo: string, version: string): Promise<string> {
        const {workspace, accessToken} = this.bitbucketRepository.getConnectedRepoName(repo);
        console.log('workspace, accessToken', workspace, accessToken);
        // const uuid = await this.getRepoUUID(workspace, repo, accessToken);
        const lastCommit = await this.getRepoLastCommit(repo, workspace, accessToken);
        // await this.getAllBrunches(workspace, repo, accessToken);
        const newPackageJSON = await this.getRepoDependencies(repo, workspace, accessToken, lastCommit);
        const newBranchName = await this.createBranch(repo, workspace, accessToken, lastCommit);
        // const newBranchName =  'test123-'+lastCommit;
        console.log('newBranchName', newBranchName);
        // await delay();
        const res = await this.createCommit(newPackageJSON,workspace, repo, accessToken, newBranchName, lastCommit)
        const asd = await this.createPR(repo, workspace, accessToken, newBranchName)
        console.log(res)
        console.log('@@@@@@@@@@@@@@@@@')
        return 'Hello World!';
    }

    private async createPR(repo, workspace, accessToken, branch) {
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/pullrequests`;
        const body = {
            "title": "Update deoendencies",
            "source": {
                "branch": {
                    "name": branch
                }
            }
        };
        const config = {
            headers: {
                'Content-Type': 'Content-Type: application/json',
                'Authorization': `Bearer ${accessToken}`
            },
            data: body
        };

        const {data} = await axios.post(url, config);

        return data;
    }

    private async getRepoDependencies(repo, workspace, accessToken, commitHash): Promise<string> {
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/src/${commitHash}/package.json`
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const {data} = await axios.request(config);
        console.log(data);
        const packageJSON = data;
        const {dependencies} = data;
        const dependenciesToUpdate = this.findDeprecatedDependencies(dependencies);
        console.log('dependenciesToUpdate', dependenciesToUpdate)
        if (!dependenciesToUpdate) throw new Error('All updated!!!');
        const newPackageJSON = {...packageJSON};
        newPackageJSON.dependencies = {...newPackageJSON.dependencies, ...dependenciesToUpdate};
        console.log('newPackageJSON');
        console.log(newPackageJSON);
        return JSON.stringify(newPackageJSON);
    }

    private async createCommit(newPackageJSON: string, workspace, repo, accessToken, branch, commit) {
        console.log('branch', encodeURIComponent(branch))
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/src?branch=${(branch)}&message=update&author=leoleoleonid`;
        // const queryParams = {
        //     parents: encodeURIComponent(commit),
        //     branch: encodeURIComponent(branch),
        //     message: encodeURIComponent('update deps'),
        //     author: encodeURIComponent('dependa bot <leonidkoss1@gmail.com>'),
        // };
        const config = {
            // params: queryParams,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${accessToken}`
            }
        };
        console.log('configXXXXXX', config)
        const formData = new FormData();
        console.log('DDDDDDDDDDDDDDDDDDDDDDD', newPackageJSON)
        const dataBlob = new Blob([newPackageJSON], { type: 'text/plain' });

        //@ts-ignore
        formData.append('package.json', dataBlob, { filename: 'package.json' });

        const {data} = await axios.post(url, formData, config)
        return data;
    }

    private async createBranch(repo, workspace, accessToken, commitHash) {
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/refs/branches`
        const body = {
            "name" : "test12-"+commitHash,
            "target" : {
                "hash" : commitHash,
            }
        };
        const config = {
            method: 'post',
            maxBodyLength: Infinity,
            url,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            data: body
        };

        const {data} = await axios.request(config);
        console.log("data@#@#@#", data)
        return body.name;
    }

    private findDeprecatedDependencies(dependencies: { [key: string]: string }): { [key: string]: string } | null {
        console.log('dependencies', dependencies)

        const dependenciesToUpdate = {};
        Object.keys(this.trackedDependencies).forEach(dep => {
            if (dependencies[dep]){
                const lastVersion = this.trackedDependencies[dep];
                const currentVersion = dependencies[dep];
                if (lastVersion !== currentVersion) dependenciesToUpdate[dep] = lastVersion;
            }
        });
        console.log('dependenciesToUpdate', dependenciesToUpdate)

        if (Object.keys(dependenciesToUpdate).length > 0) return dependenciesToUpdate;
        return null;
    }

    private async getRepoLastCommit(repo, workspace, accessToken): Promise<any> {
        // console.log(accessToken)
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}/commits`
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };

        const {data} = await axios.request(config);
        console.log(data.values[0].repository);
        console.log(data.values[0].hash);
        return data.values[0].hash;
    }
    private async getRepoUUID(workspace, repo, accessToken): Promise<string> {
        // console.log(accessToken)
        const url = `${BitbucketService.BASE_URL}repositories/${workspace}/${repo}`
        const config = {
            method: 'get',
            maxBodyLength: Infinity,
            url,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        };
        // console.log('config!!!!!!')
        // console.log(config)

        const {data} = await axios.request(config);
        console.log(data);
        return data?.uuid;
    }
}
