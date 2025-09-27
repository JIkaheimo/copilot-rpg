/**
 * Base class for systems that need to emit and listen to events
 * Uses the centralized EventBus instead of individual event listeners
 */

import { EventBus, EventCallback, EventData } from '@core/EventBus';

export class EventEmitter {
    protected eventBus: EventBus;
    protected namespace: string;
    protected namespacedEmitter: any;

    constructor(namespace: string, eventBus?: EventBus) {
        this.namespace = namespace;
        this.eventBus = eventBus || EventBus.getInstance();
        this.namespacedEmitter = this.eventBus.createNamespace(namespace);
    }

    /**
     * Subscribe to a global event (not namespaced)
     */
    protected onGlobal(event: string, callback: EventCallback): void {
        this.eventBus.on(event, callback);
    }

    /**
     * Subscribe to a namespaced event
     */
    protected on(event: string, callback: EventCallback): void {
        this.namespacedEmitter.on(event, callback);
    }

    /**
     * Subscribe to a namespaced event only once
     */
    protected once(event: string, callback: EventCallback): void {
        this.namespacedEmitter.once(event, callback);
    }

    /**
     * Unsubscribe from a global event
     */
    protected offGlobal(event: string, callback?: EventCallback): void {
        this.eventBus.off(event, callback);
    }

    /**
     * Unsubscribe from a namespaced event
     */
    protected off(event: string, callback?: EventCallback): void {
        this.namespacedEmitter.off(event, callback);
    }

    /**
     * Emit a global event (not namespaced)
     */
    protected emitGlobal(event: string, data?: EventData): void {
        this.eventBus.emit(event, data);
    }

    /**
     * Emit a namespaced event
     */
    protected emit(event: string, data?: EventData): void {
        this.namespacedEmitter.emit(event, data);
    }

    /**
     * Clear all subscriptions for this system's namespace
     */
    protected clearNamespaceSubscriptions(): void {
        // Get all events that start with our namespace
        const allEvents = this.eventBus.getEventNames();
        const namespacePrefix = `${this.namespace}:`;
        
        allEvents
            .filter(event => event.startsWith(namespacePrefix))
            .forEach(event => this.eventBus.clearEvent(event));
    }

    /**
     * Cleanup method that should be called when the system is being destroyed
     */
    protected cleanup(): void {
        this.clearNamespaceSubscriptions();
    }
}