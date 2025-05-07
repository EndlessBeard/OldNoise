/**
 * WebGL 3.0 Noise Visualization
 * 
 * Main application entry point for the WebGL noise visualization project.
 * Uses WebGL2 context and GLSL ES 3.00 shaders.
 */
import vertexShaderSource from './shaders/vertex.glsl?raw';
import fragmentShaderSource from './shaders/OldNoise.glsl?raw';
import { NoiseControls } from './controls.js';

class WebGLApp {
  /**
   * Initialize the WebGL application
   */
  constructor() {
    // Get WebGL canvas
    this.canvas = document.getElementById('webgl-canvas');
    
    if (!this.canvas) {
      console.error('Canvas element not found in DOM');
      return;
    }
    
    // Initialize WebGL2 context
    this.gl = this.canvas.getContext('webgl2');
    
    if (!this.gl) {
      console.error('WebGL 2.0 not supported in this browser');
      alert('WebGL 2.0 is not supported in your browser. Please try a different browser.');
      return;
    }
    
    // Initialize WebGL
    this.initWebGL();
    
    // Initialize controls after WebGL is set up
    this.controls = new NoiseControls(this);
    
    // Set up resize handling
    window.addEventListener('resize', this.handleResize.bind(this));
    this.resizeCanvasToDisplaySize();
    
    // Start animation loop
    this.startTime = performance.now();
    this.animate();
    
    console.log('WebGL app initialized successfully');
  }
  
  /**
   * Initialize WebGL resources
   */
  initWebGL() {
    // Compile shaders
    const vertexShader = this.createShader(this.gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = this.createShader(this.gl.FRAGMENT_SHADER, fragmentShaderSource);
    
    if (!vertexShader || !fragmentShader) {
      console.error('Failed to compile shaders');
      return;
    }
    
    // Create program
    this.program = this.createProgram(vertexShader, fragmentShader);
    
    if (!this.program) {
      console.error('Failed to create shader program');
      return;
    }
    
    // Get attribute and uniform locations
    this.positionAttributeLocation = this.gl.getAttribLocation(this.program, 'a_position');
    this.texCoordAttributeLocation = this.gl.getAttribLocation(this.program, 'a_texCoord');
    
    // Store all uniform locations in a single object for easy access from controls
    this.uniformLocations = {
      time: this.gl.getUniformLocation(this.program, 'u_time'),
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      frequency: this.gl.getUniformLocation(this.program, 'u_frequency'),
      amplitude: this.gl.getUniformLocation(this.program, 'u_amplitude'),
      octaves: this.gl.getUniformLocation(this.program, 'u_octaves'),
      use3D: this.gl.getUniformLocation(this.program, 'u_use3D'),
      speed: this.gl.getUniformLocation(this.program, 'u_speed')
    };
    
    // Log uniform locations for debugging
    console.log('Shader uniform locations:', this.uniformLocations);
    
    // Create buffers
    this.createBuffers();
  }
  
  /**
   * Create a shader of the specified type from source
   * @param {number} type - GL shader type (VERTEX_SHADER or FRAGMENT_SHADER)
   * @param {string} source - GLSL source code
   * @returns {WebGLShader | null} - The compiled shader or null if compilation failed
   */
  createShader(type, source) {
    const shader = this.gl.createShader(type);
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    
    const success = this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS);
    if (success) {
      return shader;
    }
    
    console.error('Shader compilation error:', this.gl.getShaderInfoLog(shader));
    this.gl.deleteShader(shader);
    return null;
  }
  
  /**
   * Create a program from compiled shaders
   * @param {WebGLShader} vertexShader - Compiled vertex shader
   * @param {WebGLShader} fragmentShader - Compiled fragment shader
   * @returns {WebGLProgram | null} - The linked program or null if linking failed
   */
  createProgram(vertexShader, fragmentShader) {
    const program = this.gl.createProgram();
    this.gl.attachShader(program, vertexShader);
    this.gl.attachShader(program, fragmentShader);
    this.gl.linkProgram(program);
    
    const success = this.gl.getProgramParameter(program, this.gl.LINK_STATUS);
    if (success) {
      return program;
    }
    
    console.error('Program linking error:', this.gl.getProgramInfoLog(program));
    this.gl.deleteProgram(program);
    return null;
  }
  
  /**
   * Create buffers for geometry
   */
  createBuffers() {
    // Create position buffer for a full screen quad
    const positions = [
      -1, -1,  // bottom left
       1, -1,  // bottom right
      -1,  1,  // top left
      
      -1,  1,  // top left
       1, -1,  // bottom right
       1,  1,  // top right
    ];
    
    this.positionBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
    
    // Create texture coordinate buffer
    const texCoords = [
      0, 0,  // bottom left
      1, 0,  // bottom right
      0, 1,  // top left
      
      0, 1,  // top left
      1, 0,  // bottom right
      1, 1,  // top right
    ];
    
    this.texCoordBuffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(texCoords), this.gl.STATIC_DRAW);
  }
  
  /**
   * Handle window resize
   */
  handleResize() {
    this.resizeCanvasToDisplaySize();
    this.render(performance.now());
  }
  
  /**
   * Resize canvas to match display size
   * @returns {boolean} true if the canvas was resized
   */
  resizeCanvasToDisplaySize() {
    const displayWidth = this.canvas.clientWidth;
    const displayHeight = this.canvas.clientHeight;
    
    const needResize = this.canvas.width !== displayWidth || this.canvas.height !== displayHeight;
    
    if (needResize) {
      this.canvas.width = displayWidth;
      this.canvas.height = displayHeight;
      this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }
    
    return needResize;
  }
  
  /**
   * Animation loop
   */
  animate() {
    requestAnimationFrame(this.animate.bind(this));
    this.render(performance.now());
  }
  
  /**
   * Render frame
   * @param {number} time - Current timestamp
   */
  render(time) {
    // Resize canvas if needed
    this.resizeCanvasToDisplaySize();
    
    // Clear the canvas
    this.gl.clearColor(0, 0, 0, 1);
    this.gl.clear(this.gl.COLOR_BUFFER_BIT);
    
    // Use our program
    this.gl.useProgram(this.program);
    
    // Set time and resolution uniforms
    const elapsedTime = (time - this.startTime) / 1000.0; // Convert to seconds
    this.gl.uniform1f(this.uniformLocations.time, elapsedTime);
    this.gl.uniform2f(this.uniformLocations.resolution, this.canvas.width, this.canvas.height);
    
    // Set up position attribute
    this.gl.enableVertexAttribArray(this.positionAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
    this.gl.vertexAttribPointer(
      this.positionAttributeLocation,
      2, // 2 components per iteration
      this.gl.FLOAT, // the data is 32bit floats
      false, // don't normalize the data
      0, // 0 = move forward size * sizeof(type) each iteration
      0, // start at the beginning of the buffer
    );
    
    // Set up texture coordinate attribute
    this.gl.enableVertexAttribArray(this.texCoordAttributeLocation);
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.texCoordBuffer);
    this.gl.vertexAttribPointer(
      this.texCoordAttributeLocation,
      2, // 2 components per iteration
      this.gl.FLOAT, // the data is 32bit floats
      false, // don't normalize the data
      0, // 0 = move forward size * sizeof(type) each iteration
      0, // start at the beginning of the buffer
    );
    
    // Draw the geometry - 6 vertices for 2 triangles
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }
  
  /**
   * Force render update (used by controls when values change)
   */
  requestRedraw() {
    this.render(performance.now());
  }
}

// Initialize when the document is loaded
window.onload = () => {
  new WebGLApp();
};