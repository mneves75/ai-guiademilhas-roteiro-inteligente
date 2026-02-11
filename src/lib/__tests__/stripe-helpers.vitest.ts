import { describe, expect, it } from 'vitest';
import { parseWorkspaceIdFromStripeMetadata, StripeMetadataError } from '@/lib/stripe-helpers';

describe('parseWorkspaceIdFromStripeMetadata', () => {
  it('parses a positive integer workspaceId', () => {
    expect(parseWorkspaceIdFromStripeMetadata({ workspaceId: '123' })).toBe(123);
  });

  it('throws when workspaceId is missing', () => {
    expect(() => parseWorkspaceIdFromStripeMetadata({})).toThrow(StripeMetadataError);
  });

  it('throws when workspaceId is not a positive integer', () => {
    expect(() => parseWorkspaceIdFromStripeMetadata({ workspaceId: '0' })).toThrow(
      StripeMetadataError
    );
    expect(() => parseWorkspaceIdFromStripeMetadata({ workspaceId: '-1' })).toThrow(
      StripeMetadataError
    );
    expect(() => parseWorkspaceIdFromStripeMetadata({ workspaceId: 'abc' })).toThrow(
      StripeMetadataError
    );
  });
});
