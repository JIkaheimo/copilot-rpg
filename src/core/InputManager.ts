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
}

export class InputManager {
    private canvas: HTMLCanvasElement;
    private inputState: InputState;
    private previousMouseX: number = 0;
    private previousMouseY: number = 0;
    private pointerLocked: boolean = false;
    
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
            gamepad: null
        };
    }
    
    initialize(): void {
        // Keyboard events
        document.addEventListener('keydown', this.onKeyDown.bind(this));
        document.addEventListener('keyup', this.onKeyUp.bind(this));
        
        // Mouse events
        this.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.addEventListener('click', this.onCanvasClick.bind(this));
        
        // Pointer lock events
        document.addEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
        
        // Prevent context menu
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        
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
        if (!this.pointerLocked) {
            this.requestPointerLock();
        }
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
        if (navigator && typeof navigator.getGamepads === 'function') {
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
    
    cleanup(): void {
        // Remove keyboard events
        document.removeEventListener('keydown', this.onKeyDown.bind(this));
        document.removeEventListener('keyup', this.onKeyUp.bind(this));
        
        // Remove mouse events
        this.canvas.removeEventListener('mousemove', this.onMouseMove.bind(this));
        this.canvas.removeEventListener('mousedown', this.onMouseDown.bind(this));
        this.canvas.removeEventListener('mouseup', this.onMouseUp.bind(this));
        this.canvas.removeEventListener('click', this.onCanvasClick.bind(this));
        this.canvas.removeEventListener('contextmenu', (e) => e.preventDefault());
        
        // Remove pointer lock events
        document.removeEventListener('pointerlockchange', this.onPointerLockChange.bind(this));
    }
}