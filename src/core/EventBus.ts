/**
 * Central EventBus for decoupled communication between game systems
 * Replaces individual event listener implementations in each system
 */

export interface EventData {
    [key: string]: any;
}

export type EventCallback = (data?: EventData) => void;

interface EventSubscription {
    callback: EventCallback;
    once: boolean;
}

export class EventBus {
    private events: Map<string, EventSubscription[]> = new Map();
    private static instance: EventBus | null = null;

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
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event)!.push({
            callback,
            once: false
        });
    }

    /**
     * Subscribe to an event only once
     */
    once(event: string, callback: EventCallback): void {
        if (!this.events.has(event)) {
            this.events.set(event, []);
        }
        
        this.events.get(event)!.push({
            callback,
            once: true
        });
    }

    /**
     * Unsubscribe from an event
     */
    off(event: string, callback?: EventCallback): void {
        if (!this.events.has(event)) return;
        
        const subscriptions = this.events.get(event)!;
        
        if (!callback) {
            // Remove all listeners for this event
            this.events.delete(event);
            return;
        }
        
        // Remove specific callback
        const index = subscriptions.findIndex(sub => sub.callback === callback);
        if (index > -1) {
            subscriptions.splice(index, 1);
            
            // Clean up empty event arrays
            if (subscriptions.length === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Emit an event to all subscribers
     */
    emit(event: string, data?: EventData): void {
        if (!this.events.has(event)) return;
        
        const subscriptions = this.events.get(event)!.slice(); // Copy to avoid modification during iteration
        const toRemove: EventSubscription[] = [];
        
        subscriptions.forEach(subscription => {
            try {
                subscription.callback(data);
                
                // Mark one-time subscriptions for removal
                if (subscription.once) {
                    toRemove.push(subscription);
                }
            } catch (error) {
                console.error(`Error in event listener for '${event}':`, error);
            }
        });
        
        // Remove one-time subscriptions
        if (toRemove.length > 0) {
            const remainingSubscriptions = this.events.get(event)!;
            toRemove.forEach(subToRemove => {
                const index = remainingSubscriptions.indexOf(subToRemove);
                if (index > -1) {
                    remainingSubscriptions.splice(index, 1);
                }
            });
            
            // Clean up empty event arrays
            if (remainingSubscriptions.length === 0) {
                this.events.delete(event);
            }
        }
    }

    /**
     * Get all event names that have subscribers
     */
    getEventNames(): string[] {
        return Array.from(this.events.keys());
    }

    /**
     * Get number of subscribers for an event
     */
    getSubscriberCount(event: string): number {
        return this.events.get(event)?.length || 0;
    }

    /**
     * Clear all event subscriptions
     */
    clear(): void {
        this.events.clear();
    }

    /**
     * Clear subscriptions for a specific event
     */
    clearEvent(event: string): void {
        this.events.delete(event);
    }

    /**
     * Check if an event has any subscribers
     */
    hasSubscribers(event: string): boolean {
        return this.events.has(event) && this.events.get(event)!.length > 0;
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
            emit: (event: string, data?: EventData) => {
                this.emit(`${namespace}:${event}`, data);
            }
        };
    }

    /**
     * Debug method to log all current subscriptions
     */
    debug(): void {
        console.log('🚌 EventBus Debug - Current subscriptions:');
        for (const [event, subscriptions] of this.events.entries()) {
            console.log(`  ${event}: ${subscriptions.length} subscriber(s)`);
        }
    }
}

/**
 * Global EventBus instance for easy access
 */
export const eventBus = EventBus.getInstance();