import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  capturePlannerFunnelEvent,
  clearPlannerFunnelSource,
  readPlannerFunnelSource,
  rememberPlannerFunnelSource,
} from '@/lib/analytics/funnel-client';
import { plannerFunnelEvents, PLANNER_FUNNEL_STORAGE_KEY } from '@/lib/analytics/funnel';

const { mockCapture } = vi.hoisted(() => ({
  mockCapture: vi.fn(),
}));

vi.mock('posthog-js', () => ({
  default: {
    capture: mockCapture,
  },
}));

type SessionStore = {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

function installMockWindow(initial: Record<string, string> = {}) {
  const store = new Map<string, string>(Object.entries(initial));
  const sessionStorage: SessionStore = {
    getItem(key) {
      return store.has(key) ? store.get(key)! : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
    removeItem(key) {
      store.delete(key);
    },
  };

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: { sessionStorage },
  });
}

function uninstallMockWindow() {
  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    writable: true,
    value: undefined,
  });
}

describe('funnel-client', () => {
  beforeEach(() => {
    mockCapture.mockReset();
    uninstallMockWindow();
  });

  afterEach(() => {
    uninstallMockWindow();
  });

  it('stores and reads funnel source when window/sessionStorage are available', () => {
    installMockWindow();

    expect(readPlannerFunnelSource()).toBeNull();
    rememberPlannerFunnelSource('landing_planner');
    expect(readPlannerFunnelSource()).toBe('landing_planner');

    clearPlannerFunnelSource();
    expect(readPlannerFunnelSource()).toBeNull();
  });

  it('normalizes invalid source values from sessionStorage', () => {
    installMockWindow({
      [PLANNER_FUNNEL_STORAGE_KEY]: 'invalid_source',
    });

    expect(readPlannerFunnelSource()).toBeNull();
  });

  it('does nothing when window is unavailable', () => {
    expect(() => rememberPlannerFunnelSource('landing_planner')).not.toThrow();
    expect(() => clearPlannerFunnelSource()).not.toThrow();
    expect(readPlannerFunnelSource()).toBeNull();
  });

  it('never throws when analytics capture fails', () => {
    mockCapture.mockImplementationOnce(() => {
      throw new Error('capture failed');
    });

    expect(() =>
      capturePlannerFunnelEvent(plannerFunnelEvents.authViewed, {
        source: 'landing_planner',
      })
    ).not.toThrow();
  });
});
