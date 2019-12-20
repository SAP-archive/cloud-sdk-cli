import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';

import { CatalogueModule } from './catalogue/catalogue.module';

@Module({
  imports: [CatalogueModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
