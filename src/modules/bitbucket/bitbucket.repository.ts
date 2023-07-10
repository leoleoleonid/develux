import { Injectable } from '@nestjs/common';

@Injectable()
export class BitbucketRepository {
  getConnectedRepoName(repo: string) {
    return {
      workspace: 'leonidWork',
      accessToken:
        'ATCTT3xFfGN0lcWTnIU2enyz1hluJGQYgqFyiy2tleECVlhw8HEP9RX9CFIP9U8Frfyiew7YMx10rgPAdzT_z3aeuNq0EauEGTaC04sHvLe7hOIhQea_I4GBKyFCW1HBfLDE-ZTDmrF8kbP5S8uU_FEFk6dDefwJ4Oaa7DoCGYizkCkQhg88s_Q=47F8D5E9',
    };
  }
}
