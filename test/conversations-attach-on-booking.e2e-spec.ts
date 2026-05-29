import type { PinoLogger } from 'nestjs-pino';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';

/**
 * Verifica que `createBooking` conecta a reserva à conversa do par
 * (tutor × provider), seguindo a decisão de produto:
 *
 *   - conversa cold-start existente (`booking_id IS NULL`) → ANEXA o booking;
 *   - conversa já vinculada a outro booking → MANTÉM (não sobrescreve);
 *   - nenhuma conversa pré-existente → CRIA nova já vinculada ao booking.
 *
 * O recorte usa o método privado `attachConversationToBooking` direto para
 * isolar a regra (e2e do controller mantém o `SupabaseAdminService` mockado
 * por convenção do projeto).
 */
describe('createBooking attaches conversation (e2e)', () => {
  const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
  const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
  const BOOKING_ID = '33333333-4444-4555-8666-777777777777';
  const PRIOR_BOOKING_ID = '12121212-3434-4555-8666-787878787878';
  const EXISTING_CONVERSATION_ID = '66666666-7777-4888-8999-aaaaaaaaaaaa';

  function buildService(client: unknown): SupabaseAdminService {
    const config = { get: () => undefined };
    const logger = {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      trace: jest.fn(),
      fatal: jest.fn(),
    } as unknown as PinoLogger;
    const service = new SupabaseAdminService(
      config as unknown as ConstructorParameters<
        typeof SupabaseAdminService
      >[0],
      logger,
    );
    (service as unknown as { client: unknown }).client = client;
    return service;
  }

  type ConversationFixture =
    | { kind: 'absent' }
    | { kind: 'cold-start' }
    | { kind: 'linked'; bookingId: string };

  interface ChainResult {
    selectedFor?: 'lookup';
    updatedPayload?: Record<string, unknown>;
    insertedPayload?: Record<string, unknown>;
  }

  function buildClient(fixture: ConversationFixture): {
    client: { from: jest.Mock };
    spy: ChainResult;
  } {
    const spy: ChainResult = {};

    function lookupChain(): unknown {
      // Imita .select(...).eq(...).eq(...).maybeSingle()
      const eqAfterEq = {
        maybeSingle: async () => {
          spy.selectedFor = 'lookup';
          if (fixture.kind === 'absent') return { data: null, error: null };
          if (fixture.kind === 'cold-start') {
            return {
              data: { id: EXISTING_CONVERSATION_ID, booking_id: null },
              error: null,
            };
          }
          return {
            data: {
              id: EXISTING_CONVERSATION_ID,
              booking_id: fixture.bookingId,
            },
            error: null,
          };
        },
      };
      return {
        select: () => ({
          eq: () => ({ eq: () => eqAfterEq }),
        }),
      };
    }

    function updateChain(): unknown {
      return {
        update: (payload: Record<string, unknown>) => {
          spy.updatedPayload = payload;
          return {
            eq: async () => ({ data: null, error: null }),
          };
        },
      };
    }

    function insertChain(): unknown {
      return {
        insert: (payload: Record<string, unknown>) => {
          spy.insertedPayload = payload;
          return {
            select: async () => ({ data: [{ id: 'new' }], error: null }),
          };
        },
      };
    }

    let callsToConversations = 0;
    const client = {
      from: jest.fn((table: string) => {
        if (table !== 'conversations') {
          throw new Error(`Unexpected table access: ${table}`);
        }
        callsToConversations += 1;
        // 1ª chamada → lookup; 2ª → update OU insert (depende do fixture).
        if (callsToConversations === 1) return lookupChain();
        return fixture.kind === 'absent' ? insertChain() : updateChain();
      }),
    };

    return { client, spy };
  }

  it('attaches booking_id to an existing cold-start conversation', async () => {
    const { client, spy } = buildClient({ kind: 'cold-start' });
    const service = buildService(client);

    await (
      service as unknown as {
        attachConversationToBooking: (
          tutorProfileId: string,
          providerId: string,
          bookingId: string,
        ) => Promise<void>;
      }
    ).attachConversationToBooking(TUTOR_PROFILE_ID, PROVIDER_ID, BOOKING_ID);

    expect(spy.selectedFor).toBe('lookup');
    expect(spy.updatedPayload).toEqual(
      expect.objectContaining({ booking_id: BOOKING_ID }),
    );
    expect(spy.insertedPayload).toBeUndefined();
  });

  it('keeps the existing booking link untouched when the conversation is already attached', async () => {
    const { client, spy } = buildClient({
      kind: 'linked',
      bookingId: PRIOR_BOOKING_ID,
    });
    const service = buildService(client);

    await (
      service as unknown as {
        attachConversationToBooking: (
          tutorProfileId: string,
          providerId: string,
          bookingId: string,
        ) => Promise<void>;
      }
    ).attachConversationToBooking(TUTOR_PROFILE_ID, PROVIDER_ID, BOOKING_ID);

    expect(spy.selectedFor).toBe('lookup');
    expect(spy.updatedPayload).toBeUndefined();
    expect(spy.insertedPayload).toBeUndefined();
  });

  it('creates a new conversation linked to the booking when none exists', async () => {
    const { client, spy } = buildClient({ kind: 'absent' });
    const service = buildService(client);

    await (
      service as unknown as {
        attachConversationToBooking: (
          tutorProfileId: string,
          providerId: string,
          bookingId: string,
        ) => Promise<void>;
      }
    ).attachConversationToBooking(TUTOR_PROFILE_ID, PROVIDER_ID, BOOKING_ID);

    expect(spy.selectedFor).toBe('lookup');
    expect(spy.updatedPayload).toBeUndefined();
    expect(spy.insertedPayload).toEqual({
      tutor_profile_id: TUTOR_PROFILE_ID,
      provider_id: PROVIDER_ID,
      booking_id: BOOKING_ID,
    });
  });
});
