/**
 * Controls module for WebGL Noise Visualization
 * Handles UI interaction and updates shader uniforms
 * Compatible with WebGL 2.0 and GLSL ES 3.00
 */
export class NoiseControls {
  /**
   * Initialize noise controls
   * @param {WebGLApp} app - The WebGL application instance
   */
  constructor(app) {
    this.app = app;
    this.gl = app.gl;
    this.program = app.program;
    
    // Store references to DOM elements
    this.elements = {
      // Number inputs
      frequency: document.getElementById('frequency'),
      amplitude: document.getElementById('amplitude'),
      octaves: document.getElementById('octaves'),
      speedX: document.getElementById('speed-x'),
      speedY: document.getElementById('speed-y'),
      speedZ: document.getElementById('speed-z'),
      use3D: document.getElementById('use3D'),
      
      // Range sliders
      frequencySlider: document.getElementById('frequency-slider'),
      amplitudeSlider: document.getElementById('amplitude-slider'),
      octavesSlider: document.getElementById('octaves-slider')
    };
    
    // Default values
    this.values = {
      frequency: 2.0,
      amplitude: 0.5,
      octaves: 4,
      speedX: 0.1,
      speedY: 0.1,
      speedZ: 0.2,
      use3D: true
    };
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply initial values from DOM elements
    this.readInitialValues();
    
    // Update shader uniforms with initial values
    this.updateUniforms();
  }
  
  /**
   * Read initial values from DOM elements
   */
  readInitialValues() {
    // Process number inputs
    ['frequency', 'amplitude', 'octaves', 'speedX', 'speedY', 'speedZ'].forEach(control => {
      const element = this.elements[control];
      if (!element) return;
      
      // Set value based on control type
      if (control === 'octaves') {
        this.values[control] = parseInt(element.value, 10);
      } else {
        this.values[control] = parseFloat(element.value);
      }
    });
    
    // Process checkbox
    const use3DElement = this.elements.use3D;
    if (use3DElement) {
      this.values.use3D = use3DElement.checked;
    }
    
    // Ensure sliders match number inputs
    ['frequency', 'amplitude', 'octaves'].forEach(control => {
      const slider = this.elements[`${control}Slider`];
      if (slider) {
        slider.value = this.values[control];
      }
    });
    
    console.log('Initial control values:', this.values);
  }
  
  /**
   * Set up all event listeners for controls
   */
  setupEventListeners() {
    // Set up number input listeners
    ['frequency', 'amplitude', 'octaves', 'speedX', 'speedY', 'speedZ'].forEach(control => {
      const element = this.elements[control];
      if (!element) return;
      
      element.addEventListener('input', (event) => {
        // Update internal value
        if (control === 'octaves') {
          this.values[control] = parseInt(event.target.value, 10);
        } else {
          this.values[control] = parseFloat(event.target.value);
        }
        
        // Update corresponding slider if it exists
        const slider = this.elements[`${control}Slider`];
        if (slider) {
          slider.value = event.target.value;
        }
        
        // Update shader uniforms
        this.updateUniforms();
      });
    });
    
    // Set up slider listeners
    ['frequency', 'amplitude', 'octaves'].forEach(control => {
      const slider = this.elements[`${control}Slider`];
      if (!slider) return;
      
      slider.addEventListener('input', (event) => {
        // Get input value
        const value = event.target.value;
        
        // Update corresponding number input
        const numInput = this.elements[control];
        if (numInput) {
          numInput.value = value;
        }
        
        // Update internal value
        if (control === 'octaves') {
          this.values[control] = parseInt(value, 10);
        } else {
          this.values[control] = parseFloat(value);
        }
        
        // Update shader uniforms
        this.updateUniforms();
      });
    });
    
    // Set up checkbox listener
    const use3DElement = this.elements.use3D;
    if (use3DElement) {
      use3DElement.addEventListener('change', (event) => {
        this.values.use3D = event.target.checked;
        this.updateUniforms();
      });
    }
  }
  
  /**
   * Update shader uniforms with current control values
   */
  updateUniforms() {
    // Make sure we're using the right program
    this.gl.useProgram(this.program);
    
    // Get uniform locations from app
    const locations = this.app.uniformLocations;
    if (!locations) {
      console.error('Uniform locations not available in app');
      return;
    }
    
    // Update frequency uniform
    if (locations.frequency) {
      this.gl.uniform1f(locations.frequency, this.values.frequency);
    }
    
    // Update amplitude uniform
    if (locations.amplitude) {
      this.gl.uniform1f(locations.amplitude, this.values.amplitude);
    }
    
    // Update octaves uniform
    if (locations.octaves) {
      this.gl.uniform1i(locations.octaves, this.values.octaves);
    }
    
    // Update 3D toggle uniform
    if (locations.use3D) {
      this.gl.uniform1i(locations.use3D, this.values.use3D ? 1 : 0);
    }
    
    // Update speed uniform (vec3)
    if (locations.speed) {
      this.gl.uniform3f(
        locations.speed, 
        this.values.speedX,
        this.values.speedY,
        this.values.speedZ
      );
    }
    
    // Log updates for debugging
    console.log('Updated uniforms:', {
      frequency: this.values.frequency,
      amplitude: this.values.amplitude,
      octaves: this.values.octaves,
      speed: [this.values.speedX, this.values.speedY, this.values.speedZ],
      use3D: this.values.use3D
    });
    
    // Request a redraw
    if (this.app && typeof this.app.render === 'function') {
      this.app.render(performance.now());
    }
  }
  
  /**
   * Get the current values of all controls
   * @returns {Object} The current control values
   */
  getValues() {
    return { ...this.values };
  }
  
  /**
   * Force set a control value and update the UI
   * @param {string} control - Name of the control to update
   * @param {number|boolean} value - New value
   */
  setValue(control, value) {
    if (!(control in this.values)) {
      console.error(`Control "${control}" does not exist`);
      return;
    }
    
    this.values[control] = value;
    
    // Update DOM element
    const element = this.elements[control];
    if (element) {
      if (control === 'use3D') {
        element.checked = value;
      } else {
        element.value = value;
        
        // Update slider if it exists
        const slider = this.elements[`${control}Slider`];
        if (slider) {
          slider.value = value;
        }
      }
    }
    
    this.updateUniforms();
  }
}