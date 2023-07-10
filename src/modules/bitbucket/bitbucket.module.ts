import { BitbucketService } from './bitbucket.service';
import { BitbucketRepository } from './bitbucket.repository';
import { Module } from '@nestjs/common';

@Module({
  providers: [BitbucketService, BitbucketRepository],
  exports: [BitbucketService, BitbucketRepository],
})
export class BitbucketModule {}
