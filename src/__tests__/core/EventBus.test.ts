import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventBus, eventBus } from '@core/EventBus';

describe('EventBus', () => {
    let testEventBus: EventBus;

    beforeEach(() => {
        // Create a fresh instance for each test
        testEventBus = new EventBus();
    });

    describe('Initialization', () => {
        it('should create a new EventBus instance', () => {
            expect(testEventBus).toBeInstanceOf(EventBus);
        });

        it('should provide a singleton instance', () => {
            const instance1 = EventBus.getInstance();
            const instance2 = EventBus.getInstance();
            expect(instance1).toBe(instance2);
        });

        it('should export a global eventBus instance', () => {
            expect(eventBus).toBeInstanceOf(EventBus);
        });
    });

    describe('Event Subscription', () => {
        it('should subscribe to events with on()', () => {
            const callback = vi.fn();
            testEventBus.on('test-event', callback);
            
            expect(testEventBus.hasSubscribers('test-event')).toBe(true);
            expect(testEventBus.getSubscriberCount('test-event')).toBe(1);
        });

        it('should subscribe to events with once()', () => {
            const callback = vi.fn();
            testEventBus.once('test-event', callback);
            
            expect(testEventBus.hasSubscribers('test-event')).toBe(true);
            expect(testEventBus.getSubscriberCount('test-event')).toBe(1);
        });

        it('should allow multiple subscribers to the same event', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();
            
            testEventBus.on('test-event', callback1);
            testEventBus.on('test-event', callback2);
            testEventBus.once('test-event', callback3);
            
            expect(testEventBus.getSubscriberCount('test-event')).toBe(3);
        });
    });

    describe('Event Emission', () => {
        it('should emit events to all subscribers', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            testEventBus.on('test-event', callback1);
            testEventBus.on('test-event', callback2);
            
            testEventBus.emit('test-event', { data: 'test' });
            
            expect(callback1).toHaveBeenCalledWith({ data: 'test' });
            expect(callback2).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should emit events without data', () => {
            const callback = vi.fn();
            testEventBus.on('test-event', callback);
            
            testEventBus.emit('test-event');
            
            expect(callback).toHaveBeenCalledWith(undefined);
        });

        it('should handle events with no subscribers gracefully', () => {
            expect(() => {
                testEventBus.emit('non-existent-event', { data: 'test' });
            }).not.toThrow();
        });

        it('should remove once() subscribers after emission', () => {
            const callback = vi.fn();
            testEventBus.once('test-event', callback);
            
            testEventBus.emit('test-event', { data: 'test' });
            expect(callback).toHaveBeenCalledTimes(1);
            expect(testEventBus.hasSubscribers('test-event')).toBe(false);
            
            // Second emission should not call the callback
            testEventBus.emit('test-event', { data: 'test2' });
            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should keep on() subscribers after emission', () => {
            const callback = vi.fn();
            testEventBus.on('test-event', callback);
            
            testEventBus.emit('test-event', { data: 'test1' });
            testEventBus.emit('test-event', { data: 'test2' });
            
            expect(callback).toHaveBeenCalledTimes(2);
            expect(callback).toHaveBeenNthCalledWith(1, { data: 'test1' });
            expect(callback).toHaveBeenNthCalledWith(2, { data: 'test2' });
        });
    });

    describe('Event Unsubscription', () => {
        it('should unsubscribe specific callbacks with off()', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            testEventBus.on('test-event', callback1);
            testEventBus.on('test-event', callback2);
            
            testEventBus.off('test-event', callback1);
            
            testEventBus.emit('test-event', { data: 'test' });
            
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalledWith({ data: 'test' });
        });

        it('should unsubscribe all callbacks when no callback specified', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            
            testEventBus.on('test-event', callback1);
            testEventBus.on('test-event', callback2);
            
            testEventBus.off('test-event');
            
            testEventBus.emit('test-event', { data: 'test' });
            
            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(testEventBus.hasSubscribers('test-event')).toBe(false);
        });

        it('should handle unsubscribing from non-existent events gracefully', () => {
            expect(() => {
                testEventBus.off('non-existent-event');
            }).not.toThrow();
        });
    });

    describe('Error Handling', () => {
        it('should handle errors in event callbacks gracefully', () => {
            const workingCallback = vi.fn();
            const errorCallback = vi.fn(() => {
                throw new Error('Test error');
            });
            
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            
            testEventBus.on('test-event', workingCallback);
            testEventBus.on('test-event', errorCallback);
            
            testEventBus.emit('test-event', { data: 'test' });
            
            expect(workingCallback).toHaveBeenCalled();
            expect(errorCallback).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining("Error in event listener for 'test-event':"),
                expect.any(Error)
            );
            
            consoleSpy.mockRestore();
        });
    });

    describe('Utility Methods', () => {
        it('should return all event names', () => {
            testEventBus.on('event1', vi.fn());
            testEventBus.on('event2', vi.fn());
            testEventBus.on('event3', vi.fn());
            
            const eventNames = testEventBus.getEventNames();
            expect(eventNames).toContain('event1');
            expect(eventNames).toContain('event2');
            expect(eventNames).toContain('event3');
            expect(eventNames.length).toBe(3);
        });

        it('should return correct subscriber count', () => {
            testEventBus.on('test-event', vi.fn());
            testEventBus.on('test-event', vi.fn());
            testEventBus.once('test-event', vi.fn());
            
            expect(testEventBus.getSubscriberCount('test-event')).toBe(3);
            expect(testEventBus.getSubscriberCount('non-existent')).toBe(0);
        });

        it('should clear all events', () => {
            testEventBus.on('event1', vi.fn());
            testEventBus.on('event2', vi.fn());
            
            testEventBus.clear();
            
            expect(testEventBus.getEventNames().length).toBe(0);
            expect(testEventBus.hasSubscribers('event1')).toBe(false);
            expect(testEventBus.hasSubscribers('event2')).toBe(false);
        });

        it('should clear specific events', () => {
            testEventBus.on('event1', vi.fn());
            testEventBus.on('event2', vi.fn());
            
            testEventBus.clearEvent('event1');
            
            expect(testEventBus.hasSubscribers('event1')).toBe(false);
            expect(testEventBus.hasSubscribers('event2')).toBe(true);
        });
    });

    describe('Namespaced Events', () => {
        it('should create namespaced event emitters', () => {
            const namespace = testEventBus.createNamespace('combat');
            const callback = vi.fn();
            
            namespace.on('enemyDefeated', callback);
            
            expect(testEventBus.hasSubscribers('combat:enemyDefeated')).toBe(true);
            expect(testEventBus.hasSubscribers('enemyDefeated')).toBe(false);
        });

        it('should emit namespaced events correctly', () => {
            const namespace = testEventBus.createNamespace('combat');
            const callback = vi.fn();
            
            namespace.on('enemyDefeated', callback);
            namespace.emit('enemyDefeated', { enemyId: 'goblin-1' });
            
            expect(callback).toHaveBeenCalledWith({ enemyId: 'goblin-1' });
        });

        it('should handle namespaced once() events', () => {
            const namespace = testEventBus.createNamespace('magic');
            const callback = vi.fn();
            
            namespace.once('spellCast', callback);
            namespace.emit('spellCast', { spell: 'fireball' });
            namespace.emit('spellCast', { spell: 'heal' });
            
            expect(callback).toHaveBeenCalledTimes(1);
            expect(callback).toHaveBeenCalledWith({ spell: 'fireball' });
        });

        it('should unsubscribe from namespaced events', () => {
            const namespace = testEventBus.createNamespace('interaction');
            const callback = vi.fn();
            
            namespace.on('chestOpened', callback);
            namespace.off('chestOpened', callback);
            namespace.emit('chestOpened', { items: [] });
            
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('Debug Functionality', () => {
        it('should provide debug information', () => {
            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            
            testEventBus.on('event1', vi.fn());
            testEventBus.on('event1', vi.fn());
            testEventBus.on('event2', vi.fn());
            
            testEventBus.debug();
            
            expect(consoleSpy).toHaveBeenCalledWith('🚌 EventBus Debug - Current subscriptions:');
            expect(consoleSpy).toHaveBeenCalledWith('  event1: 2 subscriber(s)');
            expect(consoleSpy).toHaveBeenCalledWith('  event2: 1 subscriber(s)');
            
            consoleSpy.mockRestore();
        });
    });
});