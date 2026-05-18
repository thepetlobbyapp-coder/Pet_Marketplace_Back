import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './auth/supabase.service';
import { SupabaseAdminService } from './supabase/supabase-admin.service';

/**
 * Provedores transversais (Bloco 1). SupabaseService é global para o
 * AuthGuard. Filtro de erro e logging são registrados no AppModule.
 */
@Global()
@Module({
  providers: [SupabaseAdminService, SupabaseService],
  exports: [SupabaseAdminService, SupabaseService],
})
export class CommonModule {}
