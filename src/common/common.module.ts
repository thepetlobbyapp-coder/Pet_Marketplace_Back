import { Global, Module } from '@nestjs/common';
import { SupabaseService } from './auth/supabase.service';

/**
 * Provedores transversais (Bloco 1). SupabaseService é global para o
 * AuthGuard. Filtro de erro e logging são registrados no AppModule.
 */
@Global()
@Module({
  providers: [SupabaseService],
  exports: [SupabaseService],
})
export class CommonModule {}
