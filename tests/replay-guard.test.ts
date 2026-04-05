import { describe, it, expect, afterEach } from 'vitest';
import { InMemoryReplayGuard } from '../src/replay-guard.js';

describe('InMemoryReplayGuard', () => {
  let guard: InMemoryReplayGuard;

  afterEach(() => {
    guard?.destroy();
  });

  it('should mark code as used on first use', () => {
    guard = InMemoryReplayGuard.withDefaultRetention();
    expect(guard.markUsed('user1:123456:100')).toBe(true);
  });

  it('should reject code on second use', () => {
    guard = InMemoryReplayGuard.withDefaultRetention();
    guard.markUsed('user1:123456:100');
    expect(guard.markUsed('user1:123456:100')).toBe(false);
  });

  it('should track used status', () => {
    guard = InMemoryReplayGuard.withDefaultRetention();
    expect(guard.wasUsed('user1:123456:100')).toBe(false);
    guard.markUsed('user1:123456:100');
    expect(guard.wasUsed('user1:123456:100')).toBe(true);
  });

  it('should track size', () => {
    guard = InMemoryReplayGuard.withDefaultRetention();
    expect(guard.size()).toBe(0);
    guard.markUsed('key1');
    guard.markUsed('key2');
    expect(guard.size()).toBe(2);
  });

  it('should clear all entries', () => {
    guard = InMemoryReplayGuard.withDefaultRetention();
    guard.markUsed('key1');
    guard.markUsed('key2');
    guard.clear();
    expect(guard.size()).toBe(0);
    expect(guard.wasUsed('key1')).toBe(false);
  });

  it('should create from config', () => {
    guard = InMemoryReplayGuard.forConfig({ period: 30, allowedDrift: 1 });
    expect(guard).toBeDefined();
  });
});
