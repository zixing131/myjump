#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

// TEST SHADER: Force output RED color to verify rendering pipeline
// This shader ignores all inputs and always outputs red
// If you see red on screen, the rendering pipeline is working
// If you still see black, the problem is with vertex rendering or viewport

void main() {
    // Force output RED to verify rendering pipeline
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0); // RED
}

