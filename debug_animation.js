// Import the modules (simulate ES6 imports with require)
// For now, let's just debug the actual test issue step by step

// Simulate the exact test scenario
const mockTarget = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 },
    distanceTo: function(other) {
        const dx = this.position.x - other.x;
        const dy = this.position.y - other.y;
        const dz = this.position.z - other.z;
        return Math.sqrt(dx*dx + dy*dy + dz*dz);
    }
};

console.log('Initial mockTarget.position.y:', mockTarget.position.y);

// Simulate the PropertyAnimation manually
class TestPropertyAnimation {
    constructor(id, target, property, startValue, endValue, duration) {
        this.id = id;
        this.target = target;
        this.property = property;
        this.startValue = startValue;
        this.endValue = endValue;
        this.duration = duration;
        this.startTime = 0;
        this.isActive = false;
    }
    
    update(deltaTime, currentTime) {
        if (!this.isActive) return true;
        
        const elapsed = currentTime - this.startTime;
        let progress = elapsed / this.duration;
        progress = Math.min(progress, 1);
        
        console.log(`Update: elapsed=${elapsed}, progress=${progress}, currentTime=${currentTime}, startTime=${this.startTime}`);
        
        const currentValue = this.startValue + (this.endValue - this.startValue) * progress;
        console.log(`Setting ${this.property} to ${currentValue}`);
        
        // Set the property value on the target object
        this.setNestedProperty(this.target, this.property, currentValue);
        
        const isComplete = progress >= 1;
        if (isComplete) {
            this.isActive = false;
        }
        
        return isComplete;
    }
    
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (current[keys[i]] === undefined) return;
            current = current[keys[i]];
        }
        
        const finalKey = keys[keys.length - 1];
        if (current[finalKey] !== undefined) {
            current[finalKey] = value;
        }
    }
}

const animation = new TestPropertyAnimation('test', mockTarget, 'position.y', 0, 10, 1.0);
animation.startTime = 0;
animation.isActive = true;

console.log('\n--- First update (should be at 50%) ---');
animation.update(0, 0.5);
console.log('mockTarget.position.y after first update:', mockTarget.position.y);

console.log('\n--- Second update (should be at 100%) ---');
animation.update(0, 1.0);
console.log('mockTarget.position.y after second update:', mockTarget.position.y);
