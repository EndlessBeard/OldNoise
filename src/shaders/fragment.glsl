#version 300 es

precision highp float;

in vec2 v_texCoord;
out vec4 outColor;

uniform float u_time;
uniform vec2 u_resolution;

// Simple noise function
float noise(vec2 st) {
    return fract(sin(dot(st.xy, vec2(12.9898, 78.233))) * 43758.5453123);
}

void main() {
    vec2 st = v_texCoord;
    
    // Create some simple animated noise
    float n = noise(st + u_time * 0.1);
    
    // Create a color gradient based on position and noise
    vec3 color = mix(
        vec3(0.2, 0.4, 0.8), // Blue color
        vec3(0.9, 0.4, 0.1), // Orange color
        n * sin(u_time * 0.2 + st.x * 3.0) * 0.5 + 0.5
    );
    
    outColor = vec4(color, 1.0);
}