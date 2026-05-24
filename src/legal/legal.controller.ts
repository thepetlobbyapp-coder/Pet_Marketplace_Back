import { Controller, Get, Header } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/auth/public.decorator';
import { renderPrivacyPolicyPage, renderTermsPage } from './legal.pages';

@ApiTags('legal')
@Controller()
export class LegalController {
  @Public()
  @Get('privacy')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Public privacy policy page.' })
  privacy(): string {
    return renderPrivacyPolicyPage();
  }

  @Public()
  @Get('terms')
  @Header('Content-Type', 'text/html; charset=utf-8')
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ description: 'Public terms page.' })
  terms(): string {
    return renderTermsPage();
  }
}
