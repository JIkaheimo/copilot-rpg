import { InputManager, TouchState } from '@core/InputManager';

export interface VirtualJoystickState {
    active: boolean;
    centerX: number;
    centerY: number;
    currentX: number;
    currentY: number;
    normalizedX: number; // -1 to 1
    normalizedY: number; // -1 to 1
    touchId: number | null;
}

export interface VirtualButtonState {
    pressed: boolean;
    touchId: number | null;
}

export class MobileControls {
    private inputManager: InputManager;
    private container: HTMLElement;
    private joystickContainer: HTMLElement | null = null;
    private joystickKnob: HTMLElement | null = null;
    private actionButtons: { [key: string]: HTMLElement } = {};
    
    private joystickState: VirtualJoystickState = {
        active: false,
        centerX: 0,
        centerY: 0,
        currentX: 0,
        currentY: 0,
        normalizedX: 0,
        normalizedY: 0,
        touchId: null
    };
    
    private buttonStates: { [key: string]: VirtualButtonState } = {};
    
    constructor(inputManager: InputManager) {
        this.inputManager = inputManager;
        
        // Create mobile controls container
        this.container = document.createElement('div');
        this.container.id = 'mobileControls';
        this.container.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
            display: ${inputManager.isMobileDevice() ? 'block' : 'none'};
        `;
        
        this.createVirtualJoystick();
        this.createActionButtons();
        
        document.body.appendChild(this.container);
        
        console.log('📱 Mobile controls initialized');
    }
    
    private createVirtualJoystick(): void {
        // Joystick container
        this.joystickContainer = document.createElement('div');
        this.joystickContainer.style.cssText = `
            position: absolute;
            bottom: 80px;
            left: 80px;
            width: 120px;
            height: 120px;
            border: 3px solid rgba(255, 255, 255, 0.3);
            border-radius: 50%;
            background: rgba(0, 0, 0, 0.2);
            pointer-events: all;
            touch-action: none;
        `;
        
        // Joystick knob
        this.joystickKnob = document.createElement('div');
        this.joystickKnob.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            width: 50px;
            height: 50px;
            background: rgba(255, 255, 255, 0.8);
            border-radius: 50%;
            transform: translate(-50%, -50%);
            transition: all 0.1s ease;
        `;
        
        this.joystickContainer.appendChild(this.joystickKnob);
        this.container.appendChild(this.joystickContainer);
    }
    
    private createActionButtons(): void {
        const buttons = [
            { id: 'jumpBtn', label: 'Jump', bottom: '20px', right: '20px' },
            { id: 'attackBtn', label: 'Attack', bottom: '80px', right: '80px' },
            { id: 'interactBtn', label: 'Interact', bottom: '140px', right: '20px' },
            { id: 'runBtn', label: 'Run', bottom: '20px', right: '140px' }
        ];
        
        buttons.forEach(buttonConfig => {
            const button = document.createElement('div');
            button.id = buttonConfig.id;
            button.textContent = buttonConfig.label;
            button.style.cssText = `
                position: absolute;
                bottom: ${buttonConfig.bottom};
                right: ${buttonConfig.right};
                width: 60px;
                height: 60px;
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.4);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-size: 10px;
                font-weight: bold;
                pointer-events: all;
                touch-action: none;
                user-select: none;
            `;
            
            this.actionButtons[buttonConfig.id] = button;
            this.buttonStates[buttonConfig.id] = { pressed: false, touchId: null };
            this.container.appendChild(button);
        });
    }
    
    update(): void {
        if (!this.inputManager.isMobileDevice()) return;
        
        const touches = this.inputManager.getActiveTouches();
        
        // Update joystick
        this.updateJoystick(touches);
        
        // Update action buttons
        this.updateActionButtons(touches);
    }
    
    private updateJoystick(touches: TouchState[]): void {
        if (!this.joystickContainer || !this.joystickKnob) return;
        
        const containerRect = this.joystickContainer.getBoundingClientRect();
        const centerX = containerRect.left + containerRect.width / 2;
        const centerY = containerRect.top + containerRect.height / 2;
        const maxRadius = containerRect.width / 2 - 25; // Account for knob size
        
        let activeTouch: TouchState | null = null;
        
        // Check if existing joystick touch is still active
        if (this.joystickState.touchId !== null) {
            activeTouch = this.inputManager.getTouchById(this.joystickState.touchId);
        }
        
        // If no active touch, look for new touch in joystick area
        if (!activeTouch) {
            for (const touch of touches) {
                if (this.isTouchInElement(touch, this.joystickContainer)) {
                    activeTouch = touch;
                    this.joystickState.touchId = touch.id;
                    break;
                }
            }
        }
        
        if (activeTouch) {
            this.joystickState.active = true;
            this.joystickState.centerX = centerX;
            this.joystickState.centerY = centerY;
            
            // Calculate distance from center
            const deltaX = activeTouch.x - centerX;
            const deltaY = activeTouch.y - centerY;
            const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
            
            // Constrain to circle
            if (distance <= maxRadius) {
                this.joystickState.currentX = activeTouch.x;
                this.joystickState.currentY = activeTouch.y;
            } else {
                const angle = Math.atan2(deltaY, deltaX);
                this.joystickState.currentX = centerX + Math.cos(angle) * maxRadius;
                this.joystickState.currentY = centerY + Math.sin(angle) * maxRadius;
            }
            
            // Calculate normalized values (-1 to 1)
            this.joystickState.normalizedX = (this.joystickState.currentX - centerX) / maxRadius;
            this.joystickState.normalizedY = (this.joystickState.currentY - centerY) / maxRadius;
            
            // Update knob position
            this.joystickKnob.style.transform = `translate(${
                this.joystickState.currentX - centerX
            }px, ${
                this.joystickState.currentY - centerY
            }px)`;
            
        } else {
            // Reset joystick
            this.joystickState.active = false;
            this.joystickState.normalizedX = 0;
            this.joystickState.normalizedY = 0;
            this.joystickState.touchId = null;
            
            // Reset knob position
            this.joystickKnob.style.transform = 'translate(-50%, -50%)';
        }
    }
    
    private updateActionButtons(touches: TouchState[]): void {
        // Reset all buttons first
        Object.keys(this.buttonStates).forEach(buttonId => {
            const buttonState = this.buttonStates[buttonId];
            if (buttonState.touchId !== null) {
                // Check if touch is still active
                const touch = this.inputManager.getTouchById(buttonState.touchId);
                if (!touch) {
                    buttonState.pressed = false;
                    buttonState.touchId = null;
                    this.updateButtonVisual(buttonId, false);
                }
            }
        });
        
        // Check for new touches on buttons
        for (const touch of touches) {
            Object.keys(this.actionButtons).forEach(buttonId => {
                const button = this.actionButtons[buttonId];
                const buttonState = this.buttonStates[buttonId];
                
                if (buttonState.touchId === null && this.isTouchInElement(touch, button)) {
                    buttonState.pressed = true;
                    buttonState.touchId = touch.id;
                    this.updateButtonVisual(buttonId, true);
                }
            });
        }
    }
    
    private updateButtonVisual(buttonId: string, pressed: boolean): void {
        const button = this.actionButtons[buttonId];
        if (button) {
            button.style.background = pressed 
                ? 'rgba(255, 255, 255, 0.5)' 
                : 'rgba(255, 255, 255, 0.2)';
            button.style.transform = pressed ? 'scale(0.95)' : 'scale(1)';
        }
    }
    
    private isTouchInElement(touch: TouchState, element: HTMLElement): boolean {
        const rect = element.getBoundingClientRect();
        return touch.x >= rect.left && 
               touch.x <= rect.right && 
               touch.y >= rect.top && 
               touch.y <= rect.bottom;
    }
    
    // Public getters for game systems
    getJoystickState(): VirtualJoystickState {
        return { ...this.joystickState };
    }
    
    isButtonPressed(buttonId: string): boolean {
        return this.buttonStates[buttonId]?.pressed || false;
    }
    
    // Button aliases for common game actions
    isJumpPressed(): boolean {
        return this.isButtonPressed('jumpBtn');
    }
    
    isAttackPressed(): boolean {
        return this.isButtonPressed('attackBtn');
    }
    
    isInteractPressed(): boolean {
        return this.isButtonPressed('interactBtn');
    }
    
    isRunPressed(): boolean {
        return this.isButtonPressed('runBtn');
    }
    
    cleanup(): void {
        if (this.container && this.container.parentNode) {
            this.container.parentNode.removeChild(this.container);
        }
    }
}