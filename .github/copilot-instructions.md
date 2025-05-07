<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# Project Instructions

This is a WebGL 3.0 visualization project using Vite.

## Documentation References

When providing assistance with GLSL shaders in this project:
- Refer to the GLSL ES 3.00 specification located in the `Documentation/GLSL_ES_Specification_3.00.pdf` file
- Use proper WebGL 3.0 (WebGL2) and GLSL ES 3.00 syntax and features
- Follow the shader structure established in `src/shaders/vertex.glsl` and `src/shaders/fragment.glsl`

## Project Structure

- `src/main.js`: Main WebGL setup and rendering loop
- `src/shaders/`: Directory containing all GLSL shader files
  - `vertex.glsl`: Vertex shader using GLSL ES 3.00
  - `fragment.glsl`: Fragment shader using GLSL ES 3.00
- `Documentation/`: Contains reference materials including the GLSL ES specification

When suggesting shader code modifications or additions, ensure compatibility with GLSL ES 3.00 and follow proper WebGL 2.0 practices.