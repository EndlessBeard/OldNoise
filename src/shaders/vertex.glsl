#version 300 es
precision highp float;

in vec4 a_position;
in vec2 a_texCoord;

out vec2 v_texCoord;

void main() {
    // Pass the texture coordinates to the fragment shader
    v_texCoord = a_texCoord;
    
    // Output position
    gl_Position = a_position;
}