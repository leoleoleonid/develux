import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'connect-repo-questions' })
export class ConnectRepoQuestions {
  @Question({
    message: 'What repo would you like to connect?',
    name: 'repo',
  })
  parseRepo(val: string) {
    return val;
  }

  @Question({
    message: 'Enter workspace name:',
    name: 'workspace',
  })
  parseWorkspace(val: string) {
    return val;
  }

  @Question({
    message: 'Enter repository accessToken:',
    name: 'accessToken',
  })
  parseAccessToken(val: string) {
    return val;
  }
}
