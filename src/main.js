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
   * @param {string} noiseType - Initial noise type to set up ('base' or 'warp')
   */
  constructor(noiseType = 'base') {
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
    
    // Set up noise types that can be used
    this.noiseTypes = {
      base: {
        name: "Base Noise",
        features: {
          colorGradient: true,
          warp: false,
          mask: false
        }
      },
      domainWarp: {
        name: "Domain Warp",
        features: {
          colorGradient: false,
          warp: true,
          mask: false
        }
      }
    };
    
    // Initialize controls after WebGL is set up with specific noise type
    this.initNoiseControls(noiseType);
    
    // Set up resize handling
    window.addEventListener('resize', this.handleResize.bind(this));
    this.resizeCanvasToDisplaySize();
    
    // Start animation loop
    this.startTime = performance.now();
    this.animate();
    
    console.log('WebGL app initialized successfully with noise type:', noiseType);
  }
  
  /**
   * Initialize noise controls with a specific type
   * @param {string} noiseType - The type of noise to initialize ('base' or 'domainWarp')
   */
  initNoiseControls(noiseType) {
    // Initialize the controls
    this.controls = new NoiseControls(this);
    
    // Set up the specific noise type features
    if (this.noiseTypes[noiseType]) {
      // First apply basic setup for the noise type
      this.controls.setupNoiseType(noiseType);
      
      console.log(`Initialized ${this.noiseTypes[noiseType].name} controls`);
    } else {
      // Default to base noise if requested type not found
      console.warn(`Unknown noise type: ${noiseType}, defaulting to base`);
      this.controls.setupNoiseType('base');
    }
  }
  
  /**
   * Switch to a different noise type
   * @param {string} noiseType - The noise type to switch to
   */
  switchNoiseType(noiseType) {
    if (this.noiseTypes[noiseType]) {
      this.controls.setupNoiseType(noiseType);
      console.log(`Switched to ${this.noiseTypes[noiseType].name} controls`);
    } else {
      console.warn(`Unknown noise type: ${noiseType}, no changes made`);
    }
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
      // Basic uniforms
      time: this.gl.getUniformLocation(this.program, 'u_time'),
      resolution: this.gl.getUniformLocation(this.program, 'u_resolution'),
      frequency: this.gl.getUniformLocation(this.program, 'u_frequency'),
      amplitude: this.gl.getUniformLocation(this.program, 'u_amplitude'),
      octaves: this.gl.getUniformLocation(this.program, 'u_octaves'),
      use3D: this.gl.getUniformLocation(this.program, 'u_use3D'),
      speed: this.gl.getUniformLocation(this.program, 'u_speed'),
      
      // Extended uniforms for color gradient
      gradientColors: this.gl.getUniformLocation(this.program, 'u_gradientColors'),
      gradientSteps: this.gl.getUniformLocation(this.program, 'u_gradientSteps'),
      
      // Extended uniforms for warp
      warpStrength: this.gl.getUniformLocation(this.program, 'u_warpStrength'),
      warpType: this.gl.getUniformLocation(this.program, 'u_warpType'),
      
      // Extended uniforms for mask layer
      maskCutoff: this.gl.getUniformLocation(this.program, 'u_maskCutoff'),
      maskBlendStrength: this.gl.getUniformLocation(this.program, 'u_maskBlendStrength'),
      maskSoftness: this.gl.getUniformLocation(this.program, 'u_maskSoftness')
    };
    
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
   * @param {number} time - Current timestamp
   */
  animate(time) {
    requestAnimationFrame(this.animate.bind(this));
    this.render(time);
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

// Initialize when the document is loaded with the specified noise type
window.onload = () => {
  // Query parameter could be used to specify noise type
  const urlParams = new URLSearchParams(window.location.search);
  const noiseType = urlParams.get('noiseType') || 'base'; // Default to base
  
  // Initialize app with noise type
  const app = new WebGLApp(noiseType);
  
  // Add to window for developer access
  window.app = app;
};