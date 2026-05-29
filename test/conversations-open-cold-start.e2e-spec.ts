import { HttpStatus } from '@nestjs/common';
import type { PinoLogger } from 'nestjs-pino';
import { ErrorCode } from '../src/common/errors/error-codes';
import { SupabaseAdminService } from '../src/common/supabase/supabase-admin.service';
import {
  CONVERSATION_COLD_START_HOURLY_LIMIT,
  CONVERSATION_COLD_START_WINDOW_MS,
} from '../src/conversations/dto/conversation-fields';

describe('openConversation cold-start rate limit (e2e)', () => {
  const TUTOR_USER_ID = '56e4ff57-5355-47bb-904b-27ebde394bf7';
  const PROVIDER_USER_ID = '46e4ff57-5355-47bb-904b-27ebde394bf7';
  const TUTOR_PROFILE_ID = '1b6fe9f3-514f-475c-9286-38c19e576116';
  const PROVIDER_PROFILE_ID = '99999999-8888-4777-8666-000000000001';
  const PROVIDER_ID = '99999999-8888-4777-8666-555555555555';
  const CONVERSATION_ID = '66666666-7777-4888-8999-aaaaaaaaaaaa';
  const PROVIDER_AVATAR_PATH = `${PROVIDER_USER_ID}/avatar.jpg`;
  const PROVIDER_AVATAR_URL = 'https://cdn.example.com/provider-avatar.jpg';

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

  function buildClient(rpcData: Array<Record<string, unknown>>): {
    client: { from: jest.Mock; rpc: jest.Mock; storage: unknown };
    tables: string[];
  } {
    const tables: string[] = [];
    const client = {
      from: jest.fn((table: string) => {
        tables.push(table);
        if (table === 'providers') {
          const query = {
            eq: () => ({
              maybeSingle: async () => ({
                data: {
                  provider_profile_id: PROVIDER_PROFILE_ID,
                  deleted_at: null,
                },
                error: null,
              }),
            }),
            in: () => ({
              is: async () => ({
                data: [
                  {
                    id: PROVIDER_ID,
                    provider_profile_id: PROVIDER_PROFILE_ID,
                    service_label: 'Dog walking',
                    avatar_url: null,
                  },
                ],
                error: null,
              }),
            }),
          };
          return {
            select: () => query,
          };
        }
        if (table === 'provider_profiles') {
          const query = {
            eq: () => ({
              maybeSingle: async () => ({
                data: { user_id: PROVIDER_USER_ID, status: 'active' },
                error: null,
              }),
            }),
            in: () => ({
              eq: async () => ({
                data: [
                  {
                    id: PROVIDER_PROFILE_ID,
                    display_name: 'Provider Test',
                    user_id: PROVIDER_USER_ID,
                  },
                ],
                error: null,
              }),
            }),
          };
          return {
            select: () => query,
          };
        }
        if (table === 'user_blocks') {
          return {
            select: () => ({
              in: () => ({
                in: () => ({
                  limit: async () => ({ data: [], error: null }),
                }),
              }),
            }),
          };
        }
        if (table === 'user_roles') {
          return {
            select: () => ({
              eq: () => ({
                eq: () => ({
                  maybeSingle: async () => ({
                    data: { role: 'provider' },
                    error: null,
                  }),
                }),
              }),
            }),
          };
        }
        if (table === 'users') {
          const query = {
            eq: () => query,
            in: () => query,
            is: () => query,
            then: (
              resolve: (value: {
                data: Array<{ avatar_url: string | null; id: string }>;
                error: null;
              }) => unknown,
            ) =>
              resolve({
                data: [
                  { id: PROVIDER_USER_ID, avatar_url: PROVIDER_AVATAR_PATH },
                ],
                error: null,
              }),
            maybeSingle: async () => ({
              data: { id: PROVIDER_USER_ID },
              error: null,
            }),
          };
          return { select: () => query };
        }
        throw new Error(`Unexpected table access: ${table}`);
      }),
      rpc: jest.fn(async () => ({ data: rpcData, error: null })),
      storage: {
        from: () => ({
          createSignedUrl: async () => ({
            data: { signedUrl: PROVIDER_AVATAR_URL },
            error: null,
          }),
        }),
      },
    };
    return { client, tables };
  }

  it('delegates cold-start creation to the atomic database RPC', async () => {
    const { client, tables } = buildClient([
      {
        status: 'ok',
        id: CONVERSATION_ID,
        provider_id: PROVIDER_ID,
        last_message_text: null,
        last_message_at: null,
        last_message_from_provider: false,
      },
    ]);
    const service = buildService(client);

    const result = await service.openConversation(
      TUTOR_USER_ID,
      TUTOR_PROFILE_ID,
      PROVIDER_ID,
    );

    expect(result).toEqual({
      id: CONVERSATION_ID,
      provider_id: PROVIDER_ID,
      last_message_text: null,
      last_message_at: null,
      last_message_from_provider: false,
      counterpart_avatar_url: PROVIDER_AVATAR_URL,
      counterpart_name: 'Provider Test',
      counterpart_service_label: 'Dog walking',
      viewer_is_provider: false,
    });
    expect(client.rpc).toHaveBeenCalledWith(
      'conversations_open_cold_start',
      expect.objectContaining({
        p_tutor_profile_id: TUTOR_PROFILE_ID,
        p_provider_id: PROVIDER_ID,
        p_limit: CONVERSATION_COLD_START_HOURLY_LIMIT,
        p_window_start: expect.any(String),
      }),
    );
    const rpcArgs = client.rpc.mock.calls[0]?.[1] as
      | { p_window_start?: string }
      | undefined;
    expect(
      Date.now() - Date.parse(rpcArgs?.p_window_start ?? ''),
    ).toBeGreaterThanOrEqual(CONVERSATION_COLD_START_WINDOW_MS - 5000);
    expect(tables).not.toContain('conversations');
  });

  it('maps the atomic RPC rate-limit result to 429', async () => {
    const { client } = buildClient([
      {
        status: 'rate_limited',
        id: null,
        provider_id: null,
        last_message_text: null,
        last_message_at: null,
        last_message_from_provider: null,
      },
    ]);
    const service = buildService(client);

    await expect(
      service.openConversation(TUTOR_USER_ID, TUTOR_PROFILE_ID, PROVIDER_ID),
    ).rejects.toMatchObject({
      code: ErrorCode.RATE_LIMITED,
      details: {
        limit: CONVERSATION_COLD_START_HOURLY_LIMIT,
        windowMs: CONVERSATION_COLD_START_WINDOW_MS,
      },
    });

    await expect(
      service.openConversation(TUTOR_USER_ID, TUTOR_PROFILE_ID, PROVIDER_ID),
    ).rejects.toHaveProperty('status', HttpStatus.TOO_MANY_REQUESTS);
  });
});
