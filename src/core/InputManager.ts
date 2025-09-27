export interface TouchState {
    id: number;
    x: number;
    y: number;
    startX: number;
    startY: number;
    deltaX: number;
    deltaY: number;
}

export interface InputState {
    keys: { [key: string]: boolean };
    mouse: {
        x: number;
        y: number;
        deltaX: number;
        deltaY: number;
        buttons: { [button: number]: boolean };
    };
    gamepad: Gamepad | null;
    touches: { [id: number]: TouchState };
    isMobileDevice: boolean;
}

export class InputManager {
    private canvas: HTMLCanvasElement;
    private inputState: InputState;
    private previousMouseX: number = 0;
    private previousMouseY: number = 0;
    private pointerLocked: boolean = false;
    
    // Store bound event handlers for proper cleanup
    private boundEventHandlers: {
        keyDown: (event: KeyboardEvent) => void;
        keyUp: (event: KeyboardEvent) => void;
        mouseMove: (event: MouseEvent) => void;
        mouseDown: (event: MouseEvent) => void;
        mouseUp: (event: MouseEvent) => void;
        canvasClick: () => void;
        touchStart: (event: TouchEvent) => void;
        touchMove: (event: TouchEvent) => void;
        touchEnd: (event: TouchEvent) => void;
        touchCancel: (event: TouchEvent) => void;
        pointerLockChange: () => void;
        contextMenu: (event: Event) => void;
    };
    
    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;
        this.inputState = {
            keys: {},
            mouse: {
                x: 0,
                y: 0,
                deltaX: 0,
                deltaY: 0,
                buttons: {}
            },
            gamepad: null,
            touches: {},
            isMobileDevice: this.detectMobileDevice()
        };
        
        // Bind event handlers once for proper cleanup
        this.boundEventHandlers = {
            keyDown: this.onKeyDown.bind(this),
            keyUp: this.onKeyUp.bind(this),
            mouseMove: this.onMouseMove.bind(this),
            mouseDown: this.onMouseDown.bind(this),
            mouseUp: this.onMouseUp.bind(this),
            canvasClick: this.onCanvasClick.bind(this),
            touchStart: this.onTouchStart.bind(this),
            touchMove: this.onTouchMove.bind(this),
            touchEnd: this.onTouchEnd.bind(this),
            touchCancel: this.onTouchCancel.bind(this),
            pointerLockChange: this.onPointerLockChange.bind(this),
            contextMenu: (e: Event) => e.preventDefault()
        };
    }
    
    initialize(): void {
        // Keyboard events
        document.addEventListener('keydown', this.boundEventHandlers.keyDown);
        document.addEventListener('keyup', this.boundEventHandlers.keyUp);
        
        // Mouse events
        this.canvas.addEventListener('mousemove', this.boundEventHandlers.mouseMove);
        this.canvas.addEventListener('mousedown', this.boundEventHandlers.mouseDown);
        this.canvas.addEventListener('mouseup', this.boundEventHandlers.mouseUp);
        this.canvas.addEventListener('click', this.boundEventHandlers.canvasClick);
        
        // Touch events for mobile support - listen on document for mobile controls
        if (this.inputState.isMobileDevice) {
            document.addEventListener('touchstart', this.boundEventHandlers.touchStart, { passive: false });
            document.addEventListener('touchmove', this.boundEventHandlers.touchMove, { passive: false });
            document.addEventListener('touchend', this.boundEventHandlers.touchEnd, { passive: false });
            document.addEventListener('touchcancel', this.boundEventHandlers.touchCancel, { passive: false });
        } else {
            // For desktop, only listen on canvas
            this.canvas.addEventListener('touchstart', this.boundEventHandlers.touchStart, { passive: false });
            this.canvas.addEventListener('touchmove', this.boundEventHandlers.touchMove, { passive: false });
            this.canvas.addEventListener('touchend', this.boundEventHandlers.touchEnd, { passive: false });
            this.canvas.addEventListener('touchcancel', this.boundEventHandlers.touchCancel, { passive: false });
        }
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.boundEventHandlers.pointerLockChange);
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', this.boundEventHandlers.contextMenu);
        
        console.log('🎮 Input manager initialized');
    }
    
    private onKeyDown(event: KeyboardEvent): void {
        this.inputState.keys[event.code] = true;
        
        // Prevent default for game keys
        if (this.isGameKey(event.code)) {
            event.preventDefault();
        }
    }
    
    private onKeyUp(event: KeyboardEvent): void {
        this.inputState.keys[event.code] = false;
    }
    
    private onMouseMove(event: MouseEvent): void {
        if (this.pointerLocked) {
            this.inputState.mouse.deltaX = event.movementX;
            this.inputState.mouse.deltaY = event.movementY;
        } else {
            this.inputState.mouse.x = event.clientX;
            this.inputState.mouse.y = event.clientY;
            this.inputState.mouse.deltaX = event.clientX - this.previousMouseX;
            this.inputState.mouse.deltaY = event.clientY - this.previousMouseY;
        }
        
        this.previousMouseX = event.clientX;
        this.previousMouseY = event.clientY;
    }
    
    private onMouseDown(event: MouseEvent): void {
        this.inputState.mouse.buttons[event.button] = true;
    }
    
    private onMouseUp(event: MouseEvent): void {
        this.inputState.mouse.buttons[event.button] = false;
    }
    
    private onCanvasClick(): void {
        if (!this.pointerLocked && !this.inputState.isMobileDevice) {
            this.requestPointerLock();
        }
    }
    
    private onTouchStart(event: TouchEvent): void {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation(); // Prevent other handlers from interfering
        }
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            // Use absolute viewport coordinates for mobile controls compatibility
            const x = touch.clientX;
            const y = touch.clientY;
            
            this.inputState.touches[touch.identifier] = {
                id: touch.identifier,
                x: x,
                y: y,
                startX: x,
                startY: y,
                deltaX: 0,
                deltaY: 0
            };
        }
    }
    
    private onTouchMove(event: TouchEvent): void {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation(); // Prevent other handlers from interfering
        }
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            const touchState = this.inputState.touches[touch.identifier];
            
            if (touchState) {
                // Use absolute viewport coordinates
                const newX = touch.clientX;
                const newY = touch.clientY;
                
                touchState.deltaX = newX - touchState.x;
                touchState.deltaY = newY - touchState.y;
                touchState.x = newX;
                touchState.y = newY;
            }
        }
    }
    
    private onTouchEnd(event: TouchEvent): void {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation(); // Prevent other handlers from interfering
        }
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            delete this.inputState.touches[touch.identifier];
        }
    }
    
    private onTouchCancel(event: TouchEvent): void {
        event.preventDefault();
        if (event.stopPropagation) {
            event.stopPropagation(); // Prevent other handlers from interfering
        }
        
        for (let i = 0; i < event.changedTouches.length; i++) {
            const touch = event.changedTouches[i];
            delete this.inputState.touches[touch.identifier];
        }
    }
    
    private detectMobileDevice(): boolean {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               ('ontouchstart' in window) ||
               (navigator.maxTouchPoints > 0);
    }
    
    private onPointerLockChange(): void {
        this.pointerLocked = document.pointerLockElement === this.canvas;
    }
    
    private requestPointerLock(): void {
        this.canvas.requestPointerLock();
    }
    
    exitPointerLock(): void {
        if (document.exitPointerLock) {
            document.exitPointerLock();
        }
    }
    
    private isGameKey(keyCode: string): boolean {
        const gameKeys = [
            'KeyW', 'KeyA', 'KeyS', 'KeyD', // Movement
            'Space', 'ShiftLeft', 'ShiftRight', // Jump, run
            'KeyE', 'KeyF', 'KeyR', // Interact, use, reload
            'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', // Hotbar
            'Tab', 'Escape', 'KeyM', 'KeyI' // Menu, map, inventory
        ];
        return gameKeys.includes(keyCode);
    }
    
    update(): void {
        // Reset mouse delta
        if (!this.pointerLocked) {
            this.inputState.mouse.deltaX = 0;
            this.inputState.mouse.deltaY = 0;
        }
        
        // Update gamepad
        if (typeof navigator !== 'undefined' && navigator && typeof navigator.getGamepads === 'function') {
            const gamepads = navigator.getGamepads();
            this.inputState.gamepad = gamepads[0] || null;
        } else {
            this.inputState.gamepad = null;
        }
    }
    
    // Input query methods
    isKeyPressed(keyCode: string): boolean {
        return !!this.inputState.keys[keyCode];
    }
    
    isMouseButtonPressed(button: number): boolean {
        return !!this.inputState.mouse.buttons[button];
    }
    
    getMouseDelta(): { x: number; y: number } {
        return {
            x: this.inputState.mouse.deltaX,
            y: this.inputState.mouse.deltaY
        };
    }
    
    getMousePosition(): { x: number; y: number } {
        return {
            x: this.inputState.mouse.x,
            y: this.inputState.mouse.y
        };
    }
    
    getMouseState(): { x: number; y: number } {
        return this.getMousePosition();
    }
    
    getGamepad(): Gamepad | null {
        return this.inputState.gamepad;
    }
    
    getInputState(): InputState {
        return this.inputState;
    }
    
    isPointerLocked(): boolean {
        return this.pointerLocked;
    }
    
    // Touch input methods
    getTouches(): { [id: number]: TouchState } {
        return this.inputState.touches;
    }
    
    getTouchById(id: number): TouchState | null {
        return this.inputState.touches[id] || null;
    }
    
    getActiveTouches(): TouchState[] {
        return Object.values(this.inputState.touches);
    }
    
    isMobileDevice(): boolean {
        return this.inputState.isMobileDevice;
    }
    
    cleanup(): void {
        // Remove keyboard events
        document.removeEventListener('keydown', this.boundEventHandlers.keyDown);
        document.removeEventListener('keyup', this.boundEventHandlers.keyUp);
        
        // Remove mouse events
        this.canvas.removeEventListener('mousemove', this.boundEventHandlers.mouseMove);
        this.canvas.removeEventListener('mousedown', this.boundEventHandlers.mouseDown);
        this.canvas.removeEventListener('mouseup', this.boundEventHandlers.mouseUp);
        this.canvas.removeEventListener('click', this.boundEventHandlers.canvasClick);
        this.canvas.removeEventListener('contextmenu', this.boundEventHandlers.contextMenu);
        
        // Remove touch events - clean up both document and canvas listeners
        if (this.inputState.isMobileDevice) {
            document.removeEventListener('touchstart', this.boundEventHandlers.touchStart);
            document.removeEventListener('touchmove', this.boundEventHandlers.touchMove);
            document.removeEventListener('touchend', this.boundEventHandlers.touchEnd);
            document.removeEventListener('touchcancel', this.boundEventHandlers.touchCancel);
        } else {
            this.canvas.removeEventListener('touchstart', this.boundEventHandlers.touchStart);
            this.canvas.removeEventListener('touchmove', this.boundEventHandlers.touchMove);
            this.canvas.removeEventListener('touchend', this.boundEventHandlers.touchEnd);
            this.canvas.removeEventListener('touchcancel', this.boundEventHandlers.touchCancel);
        }
        
        // Remove pointer lock events
        document.removeEventListener('pointerlockchange', this.boundEventHandlers.pointerLockChange);
    }
}