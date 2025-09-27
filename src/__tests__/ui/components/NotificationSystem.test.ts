import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { NotificationSystem } from '@ui/components/NotificationSystem';

describe('NotificationSystem', () => {
  let notificationSystem: NotificationSystem;
  let mockContainer: HTMLElement;
  let mockNotification: HTMLElement;

  beforeEach(() => {
    // Create mock DOM elements
    mockContainer = {
      id: 'notifications',
      style: { cssText: '' },
      appendChild: vi.fn(),
      innerHTML: '',
    } as any as HTMLElement;

    mockNotification = {
      className: '',
      textContent: '',
      style: { cssText: '', opacity: '', transform: '' },
      parentNode: mockContainer,
    } as HTMLElement;

    // Mock document methods
    vi.spyOn(document, 'getElementById').mockImplementation((id: string) => {
      if (id === 'notifications') return mockContainer;
      return null;
    });

    vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
      if (tagName === 'div') return mockNotification;
      return mockContainer;
    });

    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockContainer);

    // Mock console.warn
    vi.spyOn(console, 'warn').mockImplementation(() => {});

    // Mock requestAnimationFrame and setTimeout
    vi.spyOn(global, 'requestAnimationFrame').mockImplementation((callback: FrameRequestCallback) => {
      callback(0);
      return 0;
    });

    vi.spyOn(global, 'setTimeout').mockImplementation((callback: () => void, delay?: number) => {
      if (delay === 300) {
        // For dismiss animation
        callback();
      } else if (delay === 3000) {
        // For auto-dismiss - don't call immediately in tests
      }
      return 0 as any;
    });

    notificationSystem = new NotificationSystem();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should create NotificationSystem instance', () => {
      expect(notificationSystem).toBeDefined();
      expect(notificationSystem).toBeInstanceOf(NotificationSystem);
    });

    it('should initialize with existing notifications container', () => {
      notificationSystem.initialize();
      
      expect(document.getElementById).toHaveBeenCalledWith('notifications');
    });

    it('should create notifications container if it does not exist', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      
      notificationSystem.initialize();
      
      expect(document.createElement).toHaveBeenCalledWith('div');
      expect(document.body.appendChild).toHaveBeenCalled();
    });

    it('should set proper styles on created container', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      
      // Create a proper mock container with style property
      const mockCreatedContainer = {
        id: '',
        style: { cssText: '' },
        appendChild: vi.fn(),
        innerHTML: '',
      } as any as HTMLElement;
      
      vi.spyOn(document, 'createElement').mockReturnValue(mockCreatedContainer);
      
      notificationSystem.initialize();
      
      expect(mockCreatedContainer.id).toBe('notifications');
      expect(mockCreatedContainer.style.cssText).toContain('position: fixed');
      expect(mockCreatedContainer.style.cssText).toContain('top: 20px');
      expect(mockCreatedContainer.style.cssText).toContain('right: 20px');
    });
  });

  describe('Notification Display', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should show info notification by default', () => {
      notificationSystem.showNotification('Test message');
      
      expect(mockNotification.className).toBe('notification notification-info');
      expect(mockNotification.textContent).toBe('Test message');
      expect(mockContainer.appendChild).toHaveBeenCalledWith(mockNotification);
    });

    it('should show success notification', () => {
      notificationSystem.showNotification('Success message', 'success');
      
      expect(mockNotification.className).toBe('notification notification-success');
      expect(mockNotification.textContent).toBe('Success message');
    });

    it('should show warning notification', () => {
      notificationSystem.showNotification('Warning message', 'warning');
      
      expect(mockNotification.className).toBe('notification notification-warning');
      expect(mockNotification.textContent).toBe('Warning message');
    });

    it('should show error notification', () => {
      notificationSystem.showNotification('Error message', 'error');
      
      expect(mockNotification.className).toBe('notification notification-error');
      expect(mockNotification.textContent).toBe('Error message');
    });

    it('should apply proper styles to notification', () => {
      notificationSystem.showNotification('Test message', 'info');
      
      expect(mockNotification.style.cssText).toContain('background-color: #2196F3');
      expect(mockNotification.style.cssText).toContain('color: white');
      expect(mockNotification.style.cssText).toContain('padding: 12px 16px');
      expect(mockNotification.style.cssText).toContain('opacity: 0');
      expect(mockNotification.style.cssText).toContain('transform: translateX(100%)');
    });

    it('should animate notification in', () => {
      notificationSystem.showNotification('Test message');
      
      expect(requestAnimationFrame).toHaveBeenCalled();
      expect(mockNotification.style.opacity).toBe('1');
      expect(mockNotification.style.transform).toBe('translateX(0)');
    });

    it('should set auto-dismiss timer', () => {
      notificationSystem.showNotification('Test message');
      
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 3000);
    });
  });

  describe('Notification Colors', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should use correct color for info notifications', () => {
      notificationSystem.showNotification('Info', 'info');
      expect(mockNotification.style.cssText).toContain('#2196F3');
    });

    it('should use correct color for success notifications', () => {
      notificationSystem.showNotification('Success', 'success');
      expect(mockNotification.style.cssText).toContain('#4CAF50');
    });

    it('should use correct color for warning notifications', () => {
      notificationSystem.showNotification('Warning', 'warning');
      expect(mockNotification.style.cssText).toContain('#FF9800');
    });

    it('should use correct color for error notifications', () => {
      notificationSystem.showNotification('Error', 'error');
      expect(mockNotification.style.cssText).toContain('#F44336');
    });
  });

  describe('Notification Dismissal', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should animate notification out on dismiss', () => {
      // Create a proper mock with removeChild function
      const removeChildSpy = vi.fn();
      const mockParent = {
        removeChild: removeChildSpy,
      };
      mockNotification.parentNode = mockParent as any;
      
      notificationSystem.showNotification('Test message');
      
      // Trigger auto-dismiss by calling setTimeout callback manually
      const dismissCallback = (setTimeout as any).mock.calls.find((call: any) => call[1] === 3000)?.[0];
      if (dismissCallback) dismissCallback();
      
      expect(mockNotification.style.opacity).toBe('0');
      expect(mockNotification.style.transform).toBe('translateX(100%)');
    });

    it('should remove notification from DOM after animation', () => {
      const removeChildSpy = vi.fn();
      mockContainer.removeChild = removeChildSpy;
      
      notificationSystem.showNotification('Test message');
      
      // Trigger auto-dismiss
      const dismissCallback = (setTimeout as any).mock.calls.find((call: any) => call[1] === 3000)?.[0];
      if (dismissCallback) dismissCallback();
      
      expect(removeChildSpy).toHaveBeenCalledWith(mockNotification);
    });

    it('should handle missing parent node gracefully', () => {
      mockNotification.parentNode = null;
      
      notificationSystem.showNotification('Test message');
      
      // Trigger auto-dismiss
      const dismissCallback = (setTimeout as any).mock.calls.find((call: any) => call[1] === 3000)?.[0];
      
      expect(() => {
        if (dismissCallback) dismissCallback();
      }).not.toThrow();
    });
  });

  describe('Clear All Notifications', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should clear all notifications', () => {
      notificationSystem.clearAll();
      
      expect(mockContainer.innerHTML).toBe('');
    });

    it('should handle clear all without initialization', () => {
      const uninitializedSystem = new NotificationSystem();
      
      expect(() => {
        uninitializedSystem.clearAll();
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should warn when showing notification without initialization', () => {
      // Don't call initialize
      notificationSystem.showNotification('Test message');
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Notification system not initialized');
    });

    it('should handle missing container gracefully', () => {
      // Initialize but then simulate missing container
      notificationSystem.initialize();
      
      // Simulate container being removed
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      const newNotificationSystem = new NotificationSystem();
      
      expect(() => {
        newNotificationSystem.showNotification('Test message');
      }).not.toThrow();
      
      expect(console.warn).toHaveBeenCalledWith('🎨 Notification system not initialized');
    });

    it('should handle DOM creation errors gracefully', () => {
      vi.spyOn(document, 'getElementById').mockReturnValue(null);
      vi.spyOn(document, 'createElement').mockImplementation(() => {
        throw new Error('DOM error');
      });
      
      expect(() => {
        notificationSystem.initialize();
      }).toThrow('DOM error');
    });
  });

  describe('Multiple Notifications', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should handle multiple simultaneous notifications', () => {
      notificationSystem.showNotification('Message 1', 'info');
      notificationSystem.showNotification('Message 2', 'success');
      notificationSystem.showNotification('Message 3', 'warning');
      
      expect(mockContainer.appendChild).toHaveBeenCalledTimes(3);
    });

    it('should handle rapid consecutive notifications', () => {
      for (let i = 0; i < 10; i++) {
        notificationSystem.showNotification(`Message ${i}`, 'info');
      }
      
      expect(mockContainer.appendChild).toHaveBeenCalledTimes(10);
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should handle empty message', () => {
      notificationSystem.showNotification('');
      
      expect(mockNotification.textContent).toBe('');
    });

    it('should handle very long message', () => {
      const longMessage = 'A'.repeat(1000);
      notificationSystem.showNotification(longMessage);
      
      expect(mockNotification.textContent).toBe(longMessage);
    });

    it('should handle special characters in message', () => {
      const specialMessage = '<script>alert("test")</script> & special chars';
      notificationSystem.showNotification(specialMessage);
      
      expect(mockNotification.textContent).toBe(specialMessage);
    });

    it('should handle invalid notification type gracefully', () => {
      notificationSystem.showNotification('Test', 'invalid' as any);
      
      expect(mockNotification.style.cssText).toContain('#2196F3'); // Should default to info color
    });
  });

  describe('Single Responsibility Principle', () => {
    it('should only handle notification display responsibilities', () => {
      // NotificationSystem should only have methods related to notifications
      const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(notificationSystem));
      const expectedMethods = ['constructor', 'initialize', 'showNotification', 'dismissNotification', 'getNotificationColor', 'clearAll'];
      
      expect(methods.sort()).toEqual(expectedMethods.sort());
    });
  });

  describe('Performance', () => {
    beforeEach(() => {
      notificationSystem.initialize();
    });

    it('should handle many notifications efficiently', () => {
      const startTime = performance.now();
      
      for (let i = 0; i < 100; i++) {
        notificationSystem.showNotification(`Message ${i}`);
      }
      
      const endTime = performance.now();
      
      // Should handle 100 notifications quickly
      expect(endTime - startTime).toBeLessThan(100);
    });
  });
});