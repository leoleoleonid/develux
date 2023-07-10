import { Module } from '@nestjs/common';
import { UpdateRepoCommand } from './modules/command/update.repo.comand';
import { UpdateRepoQuestions } from './modules/command/update.repo.questions';
import { ConnectRepoCommand } from './modules/command/connect.repo.comand';
import { ConnectRepoQuestions } from './modules/command/connect.repo.questions';
import { BitbucketModule } from './modules/bitbucket/bitbucket.module';

@Module({
  imports: [BitbucketModule],
  providers: [
    UpdateRepoCommand,
    UpdateRepoQuestions,
    ConnectRepoCommand,
    ConnectRepoQuestions,
  ],
})
export class AppModule {}
