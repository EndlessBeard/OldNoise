#version 300 es

precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

// Uniforms for animation and display
uniform float u_time;
uniform vec2 u_resolution;

// Uniforms for noise control from UI
uniform float u_frequency;
uniform float u_amplitude;
uniform int u_octaves;
uniform bool u_use3D; // Toggle between 2D and 3D noise
uniform vec3 u_speed; // Controls x, y, z movement speed

// Constants for permutation table
const int B = 1024; // Increased cell size from 256 to 1024

// Hash function for larger cell sizes (replacing the permutation table)
// This avoids the need for a lookup table or texture
float hash(int x) {
    x = (x << 13) ^ x;
    return float((x * (x * x * 15731 + 789221) + 1376312589) & 0x7fffffff) / float(0x7fffffff);
}

// Hash for 2D coordinates
float hash2D(int x, int y) {
    return hash(x + B * y);
}

// Hash for 3D coordinates
float hash3D(int x, int y, int z) {
    return hash(x + B * (y + B * z));
}

// Improved fade function - same as original Perlin
float fade(float t) {
    return t * t * t * (t * (t * 6.0 - 15.0) + 10.0);
}

// Linear interpolation
float lerp(float t, float a, float b) {
    return a + t * (b - a);
}

// 2D gradient function
vec2 grad2(float h) {
    // Convert hash to angle
    float angle = h * 6.283185307179586;
    // Return unit vector
    return vec2(cos(angle), sin(angle));
}

// Dot product of gradient and distance vector
float gradDot2D(float h, vec2 p) {
    vec2 g = grad2(h);
    return dot(g, p);
}

// 1D Perlin noise (adapted from C# implementation)
float noise1D(float x) {
    // Integer and fractional parts
    int ix0 = int(floor(x));
    float fx0 = x - float(ix0);
    float fx1 = fx0 - 1.0;
    
    // Wrap to 0..1023 for larger cell size
    ix0 = ix0 & (B - 1);
    int ix1 = (ix0 + 1) & (B - 1);
    
    // Fade curve
    float s = fade(fx0);
    
    // Get gradients and compute dot products
    float n0 = fx0 * (2.0 * hash(ix0) - 1.0);
    float n1 = fx1 * (2.0 * hash(ix1) - 1.0);
    
    // Interpolate and scale to roughly -0.5..0.5 range
    return 0.188 * lerp(s, n0, n1);
}

// 2D Perlin noise (optimized GLSL version)
float noise2D(vec2 p) {
    // Integer (cell) coordinates
    ivec2 i = ivec2(floor(p));
    // Fractional position within cell
    vec2 f = fract(p);
    
    // Wrap to 0..1023 for larger cell size
    i.x = i.x & (B - 1);
    i.y = i.y & (B - 1);
    
    // Cell corners
    ivec2 i00 = i;
    ivec2 i10 = ivec2((i.x + 1) & (B - 1), i.y);
    ivec2 i01 = ivec2(i.x, (i.y + 1) & (B - 1));
    ivec2 i11 = ivec2((i.x + 1) & (B - 1), (i.y + 1) & (B - 1));
    
    // Distances from cell corners
    vec2 f00 = f;
    vec2 f10 = f - vec2(1.0, 0.0);
    vec2 f01 = f - vec2(0.0, 1.0);
    vec2 f11 = f - vec2(1.0, 1.0);
    
    // Hashes for corners
    float h00 = hash2D(i00.x, i00.y);
    float h10 = hash2D(i10.x, i10.y);
    float h01 = hash2D(i01.x, i01.y);
    float h11 = hash2D(i11.x, i11.y);
    
    // Dot products for each corner
    float n00 = gradDot2D(h00, f00);
    float n10 = gradDot2D(h10, f10);
    float n01 = gradDot2D(h01, f01);
    float n11 = gradDot2D(h11, f11);
    
    // Compute fade curves
    vec2 u = vec2(fade(f.x), fade(f.y));
    
    // Bilinear interpolation
    float nx0 = lerp(u.x, n00, n10);
    float nx1 = lerp(u.x, n01, n11);
    float n = lerp(u.y, nx0, nx1);
    
    // Scale output to match original implementation's range (-0.75 to 0.75)
    return 0.507 * n;
}

// 3D Perlin noise implementation
float noise3D(vec3 p) {
    // Integer (cell) coordinates
    ivec3 i = ivec3(floor(p));
    // Fractional position within cell
    vec3 f = fract(p);
    
    // Wrap to 0..1023 for larger cell size
    i.x = i.x & (B - 1);
    i.y = i.y & (B - 1);
    i.z = i.z & (B - 1);
    
    // Compute fade curves
    vec3 u = vec3(fade(f.x), fade(f.y), fade(f.z));
    
    // Hash values for all corners of the cell - store as floats instead of ints
    float h000 = float(hash3D(i.x, i.y, i.z));
    float h100 = float(hash3D((i.x+1) & (B-1), i.y, i.z));
    float h010 = float(hash3D(i.x, (i.y+1) & (B-1), i.z));
    float h110 = float(hash3D((i.x+1) & (B-1), (i.y+1) & (B-1), i.z));
    float h001 = float(hash3D(i.x, i.y, (i.z+1) & (B-1)));
    float h101 = float(hash3D((i.x+1) & (B-1), i.y, (i.z+1) & (B-1)));
    float h011 = float(hash3D(i.x, (i.y+1) & (B-1), (i.z+1) & (B-1)));
    float h111 = float(hash3D((i.x+1) & (B-1), (i.y+1) & (B-1), (i.z+1) & (B-1)));
    
    // Generate gradients directly from hash floats (instead of bit operations on ints)
    // This avoids the type conversion errors
    vec3 g000 = normalize(vec3(
        sin(h000 * 12.9898),
        sin(h000 * 78.233),
        sin(h000 * 43.2391)
    ));
    vec3 g100 = normalize(vec3(
        sin(h100 * 12.9898),
        sin(h100 * 78.233),
        sin(h100 * 43.2391)
    ));
    vec3 g010 = normalize(vec3(
        sin(h010 * 12.9898),
        sin(h010 * 78.233),
        sin(h010 * 43.2391)
    ));
    vec3 g110 = normalize(vec3(
        sin(h110 * 12.9898),
        sin(h110 * 78.233),
        sin(h110 * 43.2391)
    ));
    vec3 g001 = normalize(vec3(
        sin(h001 * 12.9898),
        sin(h001 * 78.233),
        sin(h001 * 43.2391)
    ));
    vec3 g101 = normalize(vec3(
        sin(h101 * 12.9898),
        sin(h101 * 78.233),
        sin(h101 * 43.2391)
    ));
    vec3 g011 = normalize(vec3(
        sin(h011 * 12.9898),
        sin(h011 * 78.233),
        sin(h011 * 43.2391)
    ));
    vec3 g111 = normalize(vec3(
        sin(h111 * 12.9898),
        sin(h111 * 78.233),
        sin(h111 * 43.2391)
    ));
    
    // Calculate dot products
    float n000 = dot(g000, f);
    float n100 = dot(g100, f - vec3(1.0, 0.0, 0.0));
    float n010 = dot(g010, f - vec3(0.0, 1.0, 0.0));
    float n110 = dot(g110, f - vec3(1.0, 1.0, 0.0));
    float n001 = dot(g001, f - vec3(0.0, 0.0, 1.0));
    float n101 = dot(g101, f - vec3(1.0, 0.0, 1.0));
    float n011 = dot(g011, f - vec3(0.0, 1.0, 1.0));
    float n111 = dot(g111, f - vec3(1.0, 1.0, 1.0));
    
    // Interpolate along x
    float nx00 = lerp(u.x, n000, n100);
    float nx10 = lerp(u.x, n010, n110);
    float nx01 = lerp(u.x, n001, n101);
    float nx11 = lerp(u.x, n011, n111);
    
    // Interpolate along y
    float nxy0 = lerp(u.y, nx00, nx10);
    float nxy1 = lerp(u.y, nx01, nx11);
    
    // Interpolate along z and scale
    return 0.66 * lerp(u.z, nxy0, nxy1);
}

// Fractal (FBM) noise
float fractalNoise2D(vec2 p, int octaves, float frequency, float amplitude) {
    float sum = 0.0;
    float gain = 1.0;
    vec2 pos = p;
    
    // Use max 16 to avoid excessive loop iterations
    int maxOctaves = min(octaves, 16); 
    
    for (int i = 0; i < 16; i++) {
        // Break if we've reached the requested number of octaves
        if (i >= maxOctaves) break;
        
        sum += noise2D(pos * gain / frequency) * amplitude / gain;
        gain *= 2.0;
        
        // Break early for performance if contribution becomes negligible
        if (amplitude / gain < 0.001) break;
    }
    
    return sum;
}

// 3D fractal noise
float fractalNoise3D(vec3 p, int octaves, float frequency, float amplitude) {
    float sum = 0.0;
    float gain = 1.0;
    vec3 pos = p;
    
    // Use max 16 to avoid excessive loop iterations
    int maxOctaves = min(octaves, 16);
    
    for (int i = 0; i < 16; i++) {
        // Break if we've reached the requested number of octaves
        if (i >= maxOctaves) break;
        
        sum += noise3D(pos * gain / frequency) * amplitude / gain;
        gain *= 2.0;
        
        // Break early for performance if contribution becomes negligible
        if (amplitude / gain < 0.001) break;
    }
    
    return sum;
}

void main() {
    // Use normalized texture coordinates (0.0 to 1.0)
    vec2 st = v_texCoord;
    
    // Scale coordinates to create interesting patterns
    vec2 pos = st * u_resolution / min(u_resolution.x, u_resolution.y);
    
    // Apply movement based on speed parameters
    pos += vec2(u_time * u_speed.x, u_time * u_speed.y);
    
    float n;
    
    if (u_use3D) {
        // For 3D, use texture coordinates and time for the 3rd dimension
        // Apply z-speed to the third dimension
        vec3 pos3D = vec3(pos, u_time * u_speed.z);
        n = fractalNoise3D(
            pos3D,          // Position
            u_octaves,      // Octaves from UI
            u_frequency,    // Frequency from UI
            u_amplitude     // Amplitude from UI
        );
    } else {
        // 2D noise as before
        n = fractalNoise2D(
            pos,            // Position
            u_octaves,      // Octaves from UI
            u_frequency,    // Frequency from UI
            u_amplitude     // Amplitude from UI
        );
    }
    
    // Normalize noise to 0.0 - 1.0 range
    n = n * 0.5 + 0.5;
    
    // Create a color gradient based on noise
    vec3 color = mix(
        vec3(0.2, 0.4, 0.8), // Blue color
        vec3(0.9, 0.4, 0.1), // Orange color
        n
    );
    
    // Remove time-based variation - keep color at full intensity
    // color *= 0.8 + 0.2 * sin(u_time * 0.2);  // This line is removed

    outColor = vec4(color, 1.0);
}