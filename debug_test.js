const testObj = {
    position: { x: 0, y: 0, z: 0 },
    rotation: { x: 0, y: 0, z: 0 },
    scale: { x: 1, y: 1, z: 1 }
};

console.log('Initial:', testObj.position.y);

// Simulate the setNestedProperty function
function setNestedProperty(obj, path, value) {
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

setNestedProperty(testObj, 'position.y', 5);
console.log('After setting to 5:', testObj.position.y);

setNestedProperty(testObj, 'position.y', 10);
console.log('After setting to 10:', testObj.position.y);
