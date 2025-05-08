/**
 * Controls module for WebGL Noise Visualization
 * Handles UI interaction and updates shader uniforms
 * Compatible with WebGL 2.0 and GLSL ES 3.00
 */
import tinygradient from 'tinygradient';

export class NoiseControls {
  /**
   * Initialize noise controls
   * @param {WebGLApp} app - The WebGL application instance
   */
  constructor(app) {
    this.app = app;
    this.gl = app.gl;
    this.program = app.program;
    
    // Track currently active feature sets
    this.activeFeatures = {
      colorGradient: false,
      warp: false,
      mask: false
    };
    
    // Store references to DOM elements
    this.elements = {
      // Basic controls (always visible)
      frequency: document.getElementById('frequency'),
      amplitude: document.getElementById('amplitude'),
      octaves: document.getElementById('octaves'),
      speedX: document.getElementById('speed-x'),
      speedY: document.getElementById('speed-y'),
      speedZ: document.getElementById('speed-z'),
      use3D: document.getElementById('use3D'),
      
      // Range sliders for basic controls
      frequencySlider: document.getElementById('frequency-slider'),
      amplitudeSlider: document.getElementById('amplitude-slider'),
      octavesSlider: document.getElementById('octaves-slider'),
      
      // Extended controls - Color gradient
      gradientStart: document.getElementById('gradient-start'),
      gradientEnd: document.getElementById('gradient-end'),
      gradientSteps: document.getElementById('gradient-steps'),
      gradientPreview: document.getElementById('gradient-preview'),
      
      // Extended controls - Warp
      warpStrength: document.getElementById('warp-strength'),
      warpStrengthSlider: document.getElementById('warp-strength-slider'),
      warpType: document.getElementById('warp-type'),
      
      // Extended controls - Mask Layer
      maskCutoff: document.getElementById('mask-cutoff'),
      maskCutoffSlider: document.getElementById('mask-cutoff-slider'),
      maskBlendStrength: document.getElementById('mask-blend-strength'),
      maskBlendStrengthSlider: document.getElementById('mask-blend-strength-slider'),
      maskSoftness: document.getElementById('mask-softness'),
      maskSoftnessSlider: document.getElementById('mask-softness-slider'),
      
      // Control sections (for visibility toggling)
      colorGradientSection: document.getElementById('color-gradient-section'),
      warpSection: document.getElementById('warp-section'),
      maskSection: document.getElementById('mask-section')
    };
    
    // Default values
    this.values = {
      // Basic controls
      frequency: 2.0,
      amplitude: 0.5,
      octaves: 4,
      speedX: 0.1,
      speedY: 0.1,
      speedZ: 0.2,
      use3D: true,
      
      // Extended controls - Color gradient
      gradientStart: '#0000ff', // Blue
      gradientEnd: '#ff9500',   // Orange
      gradientSteps: 10,
      
      // Extended controls - Warp
      warpStrength: 0.5,
      warpType: 'multiply', // 'multiply', 'additive', 'exponent', 'log'
      
      // Extended controls - Mask Layer
      maskCutoff: 0.5,
      maskBlendStrength: 0.75,
      maskSoftness: 0.25
    };
    
    // Generate initial color gradient
    this.colorGradient = this.generateColorGradient();
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Apply initial values from DOM elements
    this.readInitialValues();
    
    // Update shader uniforms with initial values
    this.updateUniforms();
    
    // Set initial visibility
    this.toggleFeatureVisibility('colorGradient', false);
    this.toggleFeatureVisibility('warp', false);
    this.toggleFeatureVisibility('mask', false);
  }
  
  /**
   * Generate a color gradient using tinygradient
   * @returns {Array} Array of color objects
   */
  generateColorGradient() {
    const gradient = tinygradient([
      { color: this.values.gradientStart, pos: 0 },
      { color: this.values.gradientEnd, pos: 1 }
    ]);
    
    // Generate colors
    const colors = gradient.rgb(this.values.gradientSteps);
    
    // Update the gradient preview if it exists
    if (this.elements.gradientPreview) {
      const gradientCSS = gradient.css('linear', 'to right');
      this.elements.gradientPreview.style.background = gradientCSS;
    }
    
    return colors;
  }
  
  /**
   * Toggle visibility of feature controls
   * @param {string} feature - Feature name: 'colorGradient', 'warp', or 'mask'
   * @param {boolean} active - Whether the feature should be active
   */
  toggleFeatureVisibility(feature, active) {
    let section = null;
    
    switch(feature) {
      case 'colorGradient':
        section = this.elements.colorGradientSection;
        break;
      case 'warp':
        section = this.elements.warpSection;
        break;
      case 'mask':
        section = this.elements.maskSection;
        break;
    }
    
    if (section) {
      section.style.display = active ? 'block' : 'none';
    }
    
    this.activeFeatures[feature] = active;
  }
  
  /**
   * Read initial values from DOM elements
   */
  readInitialValues() {
    // Process number inputs for basic controls
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
    
    // Process color gradient controls
    if (this.elements.gradientStart) {
      this.values.gradientStart = this.elements.gradientStart.value;
    }
    if (this.elements.gradientEnd) {
      this.values.gradientEnd = this.elements.gradientEnd.value;
    }
    if (this.elements.gradientSteps) {
      this.values.gradientSteps = parseInt(this.elements.gradientSteps.value, 10);
    }
    
    // Process warp controls
    if (this.elements.warpStrength) {
      this.values.warpStrength = parseFloat(this.elements.warpStrength.value);
    }
    if (this.elements.warpType) {
      this.values.warpType = this.elements.warpType.value;
    }
    
    // Process mask layer controls
    if (this.elements.maskCutoff) {
      this.values.maskCutoff = parseFloat(this.elements.maskCutoff.value);
    }
    if (this.elements.maskBlendStrength) {
      this.values.maskBlendStrength = parseFloat(this.elements.maskBlendStrength.value);
    }
    if (this.elements.maskSoftness) {
      this.values.maskSoftness = parseFloat(this.elements.maskSoftness.value);
    }
    
    // Ensure sliders match number inputs
    ['frequency', 'amplitude', 'octaves'].forEach(control => {
      const slider = this.elements[`${control}Slider`];
      if (slider) {
        slider.value = this.values[control];
      }
    });
    
    // Ensure extended control sliders match their values
    if (this.elements.warpStrengthSlider) {
      this.elements.warpStrengthSlider.value = this.values.warpStrength;
    }
    
    if (this.elements.maskCutoffSlider) {
      this.elements.maskCutoffSlider.value = this.values.maskCutoff;
    }
    
    if (this.elements.maskBlendStrengthSlider) {
      this.elements.maskBlendStrengthSlider.value = this.values.maskBlendStrength;
    }
    
    if (this.elements.maskSoftnessSlider) {
      this.elements.maskSoftnessSlider.value = this.values.maskSoftness;
    }
    
    console.log('Initial control values:', this.values);
  }
  
  /**
   * Set up all event listeners for controls
   */
  setupEventListeners() {
    // Set up number input listeners (basic controls)
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
    
    // Set up slider listeners (basic controls)
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
    
    // Set up color gradient controls
    ['gradientStart', 'gradientEnd'].forEach(control => {
      const element = this.elements[control];
      if (!element) return;
      
      element.addEventListener('input', (event) => {
        this.values[control] = event.target.value;
        this.colorGradient = this.generateColorGradient();
        this.updateUniforms();
      });
    });
    
    if (this.elements.gradientSteps) {
      this.elements.gradientSteps.addEventListener('input', (event) => {
        this.values.gradientSteps = parseInt(event.target.value, 10);
        this.colorGradient = this.generateColorGradient();
        this.updateUniforms();
      });
    }
    
    // Set up warp controls
    if (this.elements.warpStrength) {
      this.elements.warpStrength.addEventListener('input', (event) => {
        this.values.warpStrength = parseFloat(event.target.value);
        
        // Update slider
        if (this.elements.warpStrengthSlider) {
          this.elements.warpStrengthSlider.value = this.values.warpStrength;
        }
        
        this.updateUniforms();
      });
    }
    
    if (this.elements.warpStrengthSlider) {
      this.elements.warpStrengthSlider.addEventListener('input', (event) => {
        this.values.warpStrength = parseFloat(event.target.value);
        
        // Update number input
        if (this.elements.warpStrength) {
          this.elements.warpStrength.value = this.values.warpStrength;
        }
        
        this.updateUniforms();
      });
    }
    
    if (this.elements.warpType) {
      this.elements.warpType.addEventListener('change', (event) => {
        this.values.warpType = event.target.value;
        this.updateUniforms();
      });
    }
    
    // Set up mask layer controls - Cutoff
    if (this.elements.maskCutoff) {
      this.elements.maskCutoff.addEventListener('input', (event) => {
        this.values.maskCutoff = parseFloat(event.target.value);
        
        // Update slider
        if (this.elements.maskCutoffSlider) {
          this.elements.maskCutoffSlider.value = this.values.maskCutoff;
        }
        
        this.updateUniforms();
      });
    }
    
    if (this.elements.maskCutoffSlider) {
      this.elements.maskCutoffSlider.addEventListener('input', (event) => {
        this.values.maskCutoff = parseFloat(event.target.value);
        
        // Update number input
        if (this.elements.maskCutoff) {
          this.elements.maskCutoff.value = this.values.maskCutoff;
        }
        
        this.updateUniforms();
      });
    }
    
    // Set up mask layer controls - Blend Strength
    if (this.elements.maskBlendStrength) {
      this.elements.maskBlendStrength.addEventListener('input', (event) => {
        this.values.maskBlendStrength = parseFloat(event.target.value);
        
        // Update slider
        if (this.elements.maskBlendStrengthSlider) {
          this.elements.maskBlendStrengthSlider.value = this.values.maskBlendStrength;
        }
        
        this.updateUniforms();
      });
    }
    
    if (this.elements.maskBlendStrengthSlider) {
      this.elements.maskBlendStrengthSlider.addEventListener('input', (event) => {
        this.values.maskBlendStrength = parseFloat(event.target.value);
        
        // Update number input
        if (this.elements.maskBlendStrength) {
          this.elements.maskBlendStrength.value = this.values.maskBlendStrength;
        }
        
        this.updateUniforms();
      });
    }
    
    // Set up mask layer controls - Softness
    if (this.elements.maskSoftness) {
      this.elements.maskSoftness.addEventListener('input', (event) => {
        this.values.maskSoftness = parseFloat(event.target.value);
        
        // Update slider
        if (this.elements.maskSoftnessSlider) {
          this.elements.maskSoftnessSlider.value = this.values.maskSoftness;
        }
        
        this.updateUniforms();
      });
    }
    
    if (this.elements.maskSoftnessSlider) {
      this.elements.maskSoftnessSlider.addEventListener('input', (event) => {
        this.values.maskSoftness = parseFloat(event.target.value);
        
        // Update number input
        if (this.elements.maskSoftness) {
          this.elements.maskSoftness.value = this.values.maskSoftness;
        }
        
        this.updateUniforms();
      });
    }
    
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
    
    // Update basic uniforms
    if (locations.frequency) {
      this.gl.uniform1f(locations.frequency, this.values.frequency);
    }
    
    if (locations.amplitude) {
      this.gl.uniform1f(locations.amplitude, this.values.amplitude);
    }
    
    if (locations.octaves) {
      this.gl.uniform1i(locations.octaves, this.values.octaves);
    }
    
    if (locations.use3D) {
      this.gl.uniform1i(locations.use3D, this.values.use3D ? 1 : 0);
    }
    
    if (locations.speed) {
      this.gl.uniform3f(
        locations.speed, 
        this.values.speedX,
        this.values.speedY,
        this.values.speedZ
      );
    }
    
    // Update extended uniforms - only if the features are active
    
    // Color gradient - send gradient colors to shader if active
    if (this.activeFeatures.colorGradient && locations.gradientColors && this.colorGradient) {
      // Convert gradient to flat array of RGB values
      const colorData = new Float32Array(this.colorGradient.length * 3);
      this.colorGradient.forEach((color, i) => {
        colorData[i * 3] = color._r / 255;     // R
        colorData[i * 3 + 1] = color._g / 255; // G
        colorData[i * 3 + 2] = color._b / 255; // B
      });
      
      // Send color data to shader
      this.gl.uniform3fv(locations.gradientColors, colorData);
      this.gl.uniform1i(locations.gradientSteps, this.colorGradient.length);
    }
    
    // Warp controls - update if active
    if (this.activeFeatures.warp) {
      if (locations.warpStrength) {
        this.gl.uniform1f(locations.warpStrength, this.values.warpStrength);
      }
      
      if (locations.warpType) {
        // Convert warp type string to integer for the shader
        let warpTypeValue = 0; // Default: multiply
        switch (this.values.warpType) {
          case 'multiply': warpTypeValue = 0; break;
          case 'additive': warpTypeValue = 1; break;
          case 'exponent': warpTypeValue = 2; break;
          case 'log': warpTypeValue = 3; break;
        }
        this.gl.uniform1i(locations.warpType, warpTypeValue);
      }
    }
    
    // Mask layer controls - update if active
    if (this.activeFeatures.mask) {
      if (locations.maskCutoff) {
        this.gl.uniform1f(locations.maskCutoff, this.values.maskCutoff);
      }
      
      if (locations.maskBlendStrength) {
        this.gl.uniform1f(locations.maskBlendStrength, this.values.maskBlendStrength);
      }
      
      if (locations.maskSoftness) {
        this.gl.uniform1f(locations.maskSoftness, this.values.maskSoftness);
      }
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
    if (this.app && typeof this.app.requestRedraw === 'function') {
      this.app.requestRedraw();
    }
  }
  
  /**
   * Enable a set of features for the current noise function
   * @param {Object} features - Object with boolean flags for each feature
   */
  setActiveFeatures(features) {
    // Update feature visibility
    if (features.colorGradient !== undefined) {
      this.toggleFeatureVisibility('colorGradient', features.colorGradient);
    }
    
    if (features.warp !== undefined) {
      this.toggleFeatureVisibility('warp', features.warp);
    }
    
    if (features.mask !== undefined) {
      this.toggleFeatureVisibility('mask', features.mask);
    }
    
    // Update uniforms to match new feature set
    this.updateUniforms();
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
   * @param {number|boolean|string} value - New value
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
        const sliderElement = this.elements[`${control}Slider`];
        if (sliderElement) {
          sliderElement.value = value;
        }
      }
    }
    
    // Special handling for color gradient
    if (control === 'gradientStart' || control === 'gradientEnd' || control === 'gradientSteps') {
      this.colorGradient = this.generateColorGradient();
    }
    
    // Update the uniforms
    this.updateUniforms();
  }

  /**
   * Set up predefined feature sets for different noise types
   * @param {string} noiseType - Type of noise to configure ('base', 'warp', 'mask', 'custom')
   * @param {Object} customFeatures - Optional custom feature configuration
   */
  setupNoiseType(noiseType, customFeatures = null) {
    console.log(`Setting up noise type: ${noiseType}`);
    
    switch (noiseType.toLowerCase()) {
      case 'base':
        // Base noise only needs color gradient features
        this.setActiveFeatures({
          colorGradient: true,
          warp: false,
          mask: false
        });
        
        // Set default values appropriate for base noise
        this.setValue('frequency', 2.0);
        this.setValue('amplitude', 0.5);
        this.setValue('octaves', 4);
        
        // Set default gradient for base noise
        this.setValue('gradientStart', '#0000ff'); // Blue
        this.setValue('gradientEnd', '#ff9500');   // Orange
        this.setValue('gradientSteps', 10);
        break;
        
      case 'warp':
        // Domain warping needs warp features
        this.setActiveFeatures({
          colorGradient: false,
          warp: true,
          mask: false
        });
        
        // Set default values appropriate for domain warping
        this.setValue('frequency', 1.5);
        this.setValue('amplitude', 0.6);
        this.setValue('octaves', 3);
        
        // Default warp settings
        this.setValue('warpStrength', 0.5);
        this.setValue('warpType', 'multiply');
        break;
        
      case 'mask':
        // Mask layering needs mask features
        this.setActiveFeatures({
          colorGradient: true,
          warp: false,
          mask: true
        });
        
        // Set default values appropriate for mask layering
        this.setValue('frequency', 2.2);
        this.setValue('amplitude', 0.4);
        this.setValue('octaves', 2);
        
        // Default mask settings
        this.setValue('maskCutoff', 0.5);
        this.setValue('maskBlendStrength', 0.75);
        this.setValue('maskSoftness', 0.25);
        break;
        
      case 'full':
        // Full featured setup with all controls enabled
        this.setActiveFeatures({
          colorGradient: true,
          warp: true,
          mask: true
        });
        break;
        
      case 'custom':
        // Apply custom feature set if provided
        if (customFeatures) {
          this.setActiveFeatures(customFeatures);
        }
        break;
        
      default:
        // Default to basic controls only
        this.setActiveFeatures({
          colorGradient: false,
          warp: false,
          mask: false
        });
        break;
    }
    
    // Update uniforms after changing feature set
    this.updateUniforms();
  }
}