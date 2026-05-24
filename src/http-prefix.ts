import { RequestMethod } from '@nestjs/common';
import type { RouteInfo } from '@nestjs/common/interfaces';

export const API_PREFIX = 'api/v1';

export const GLOBAL_PREFIX_EXCLUDES: RouteInfo[] = [
  { path: 'account-deletion', method: RequestMethod.GET },
  { path: 'privacy', method: RequestMethod.GET },
  { path: 'terms', method: RequestMethod.GET },
];
