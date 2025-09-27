/**
 * Central EventBus for decoupled communication between game systems
 * Uses eventemitter3 NPM package for reliable event handling
 */

import EventEmitter from 'eventemitter3';

export interface EventData {
    [key: string]: any;
}

export type EventCallback = (data?: any) => void;

export class EventBus {
    private emitter: EventEmitter;
    private static instance: EventBus | null = null;

    private constructor() {
        this.emitter = new EventEmitter();
    }

    /**
     * Get singleton instance of EventBus
     */
    static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    /**
     * Subscribe to an event
     */
    on(event: string, callback: EventCallback): void {
        this.emitter.on(event, callback);
    }

    /**
     * Subscribe to an event only once
     */
    once(event: string, callback: EventCallback): void {
        this.emitter.once(event, callback);
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback?: EventCallback): void {
        if (callback) {
            this.emitter.off(event, callback);
        } else {
            this.emitter.removeAllListeners(event);
        }
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event: string, data?: any): void {
        try {
            this.emitter.emit(event, data);
        } catch (error) {
            console.error(`Error in event listener for '${event}':`, error);
        }
    }

    /**
     * Get all event names that have subscribers
     */
    getEventNames(): string[] {
        return this.emitter.eventNames() as string[];
    }

    /**
     * Get number of subscribers for an event
     */
    getSubscriberCount(event: string): number {
        return this.emitter.listenerCount(event);
    }

    /**
     * Clear all event subscriptions
     */
    clear(): void {
        this.emitter.removeAllListeners();
    }

    /**
     * Clear subscriptions for a specific event
     */
    clearEvent(event: string): void {
        this.emitter.removeAllListeners(event);
    }

    /**
     * Check if an event has any subscribers
     */
    hasSubscribers(event: string): boolean {
        return this.emitter.listenerCount(event) > 0;
    }

    /**
     * Create a namespaced event emitter for a specific system
     * This helps prevent event name collisions
     */
    createNamespace(namespace: string) {
        return {
            on: (event: string, callback: EventCallback) => {
                this.on(`${namespace}:${event}`, callback);
            },
            once: (event: string, callback: EventCallback) => {
                this.once(`${namespace}:${event}`, callback);
            },
            off: (event: string, callback?: EventCallback) => {
                this.off(`${namespace}:${event}`, callback);
            },
            emit: (event: string, data?: any) => {
                this.emit(`${namespace}:${event}`, data);
            }
        };
    }

    /**
     * Debug method to log all current subscriptions
     */
    debug(): void {
        console.log('🚌 EventBus Debug - Current subscriptions:');
        const eventNames = this.getEventNames();
        for (const event of eventNames) {
            console.log(`  ${event}: ${this.getSubscriberCount(event)} subscriber(s)`);
        }
    }
}

/**
 * Global EventBus instance for easy access
 */
export const eventBus = EventBus.getInstance();