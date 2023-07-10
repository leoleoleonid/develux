import { Question, QuestionSet } from 'nest-commander';

@QuestionSet({ name: 'update-repo-questions' })
export class UpdateRepoQuestions {
  @Question({
    message: 'What repo would you like to update?',
    name: 'repo',
  })
  parseRepo(val: string) {
    return val;
  }

  @Question({
    message: 'Which version to assign? (number)',
    name: 'version',
  })
  parseVersion(val: string) {
    return val;
  }
}
