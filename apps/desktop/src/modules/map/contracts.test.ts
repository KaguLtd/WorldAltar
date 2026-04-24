import { afterEach, describe, expect, it, vi } from 'vitest';
import { loadOfflineMapPackage, OFFLINE_MAP_PACKAGE } from './contracts';

describe('loadOfflineMapPackage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('loads valid manifest payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'offline-raster-v1',
          mode: 'bundled_raster',
          styleUrl: '/offline-map/style.json',
          manifestUrl: '/offline-map/manifest.json',
          minZoom: 0,
          maxZoom: 1,
          coverage: 'world-low-zoom'
        })
      })
    );

    await expect(loadOfflineMapPackage()).resolves.toEqual(OFFLINE_MAP_PACKAGE);
  });

  it('rejects invalid manifest payload', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          id: 'offline-raster-v1',
          mode: 'bundled_raster'
        })
      })
    );

    await expect(loadOfflineMapPackage()).rejects.toThrow(
      'Offline map manifest invalid'
    );
  });
});
