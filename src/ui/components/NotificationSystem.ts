/**
 * Notification system component following Single Responsibility Principle
 * Only responsible for displaying notifications
 */
export class NotificationSystem {
    private container: HTMLElement | null = null;

    initialize(): void {
        this.container = document.getElementById('notifications');
        
        if (!this.container) {
            // Create notifications container if it doesn't exist
            this.container = document.createElement('div');
            this.container.id = 'notifications';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 1000;
                max-width: 300px;
            `;
            document.body.appendChild(this.container);
        }
    }

    /**
     * Show a notification with auto-dismiss
     */
    showNotification(message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info'): void {
        if (!this.container) {
            console.warn('🎨 Notification system not initialized');
            return;
        }

        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            background-color: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;

        this.container.appendChild(notification);

        // Animate in
        requestAnimationFrame(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        });

        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            this.dismissNotification(notification);
        }, 3000);
    }

    private dismissNotification(notification: HTMLElement): void {
        notification.style.opacity = '0';
        notification.style.transform = 'translateX(100%)';
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }

    private getNotificationColor(type: string): string {
        switch (type) {
            case 'success': return '#4CAF50';
            case 'warning': return '#FF9800';
            case 'error': return '#F44336';
            case 'info':
            default: return '#2196F3';
        }
    }

    /**
     * Clear all notifications
     */
    clearAll(): void {
        if (!this.container) return;
        
        this.container.innerHTML = '';
    }
}