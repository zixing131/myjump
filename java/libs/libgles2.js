// WebGL2 bridge for J2ME 3D support
// Based on freej2me-web implementation
console.log('[libgles2.js] Loading...');

(function() {
  'use strict';
  console.log('[libgles2.js] Initializing GLES2 native methods...');

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function doThrow(lib, str) {
    if (window.GLES2ExceptionHandler) {
      window.GLES2ExceptionHandler(str);
    } else {
      console.error('GLES2 Error:', str);
    }
  }

  const tmatrix3x3 = new Float32Array(9), tmatrix4x4 = new Float32Array(16);
  function transposeMatrix(matrix, size) {
    if (size === 3) {
        tmatrix3x3.set(matrix, 0);
        [tmatrix3x3[1], tmatrix3x3[3]] = [tmatrix3x3[3], tmatrix3x3[1]];
        [tmatrix3x3[2], tmatrix3x3[6]] = [tmatrix3x3[6], tmatrix3x3[2]];
        [tmatrix3x3[5], tmatrix3x3[7]] = [tmatrix3x3[7], tmatrix3x3[5]];
        return tmatrix3x3;
    } else if (size === 4) {
        tmatrix4x4.set(matrix, 0);
        [tmatrix4x4[1], tmatrix4x4[4]] = [tmatrix4x4[4], tmatrix4x4[1]];
        [tmatrix4x4[2], tmatrix4x4[8]] = [tmatrix4x4[8], tmatrix4x4[2]];
        [tmatrix4x4[3], tmatrix4x4[12]] = [tmatrix4x4[12], tmatrix4x4[3]];
        [tmatrix4x4[6], tmatrix4x4[9]] = [tmatrix4x4[9], tmatrix4x4[6]];
        [tmatrix4x4[7], tmatrix4x4[13]] = [tmatrix4x4[13], tmatrix4x4[7]];
        [tmatrix4x4[11], tmatrix4x4[14]] = [tmatrix4x4[14], tmatrix4x4[11]];
        return tmatrix4x4;
    } else {
        throw new Error("Only 3x3 or 4x4 matrices are supported.");
    }
  }

  // Helper to convert Java array to TypedArray
  // Based on freej2me-web implementation
  function toUint8Array(array, byteSize) {
    if (!array) return null;
    // If it's already a Uint8Array, return it directly
    if (array instanceof Uint8Array) {
      if (byteSize !== undefined && byteSize < array.byteLength) {
        return array.subarray(0, byteSize);
      }
      return array;
    }
    // If it has buffer and byteOffset, it's a TypedArray
    if (array.buffer && array.byteOffset !== undefined) {
      const actualByteSize = byteSize !== undefined 
        ? Math.min(array.byteLength, byteSize) 
        : array.byteLength;
      return new Uint8Array(array.buffer, array.byteOffset, actualByteSize);
    }
    // Plain array or array-like - convert to Uint8Array
    if (Array.isArray(array) || (array.length !== undefined && typeof array.length === 'number')) {
      return new Uint8Array(array);
    }
    console.error('toUint8Array: Unknown array type', typeof array, array);
    return null;
  }

  function toFloat32Array(array) {
    if (!array) return null;
    // If it's already a Float32Array, return it directly
    if (array instanceof Float32Array) return array;
    // If it has buffer and byteOffset, it's a TypedArray
    if (array.buffer && array.byteOffset !== undefined) {
      return new Float32Array(array.buffer, array.byteOffset, array.length);
    }
    // Plain array or array-like - convert to Float32Array
    if (Array.isArray(array) || (array.length !== undefined && typeof array.length === 'number')) {
      return new Float32Array(array);
    }
    console.error('toFloat32Array: Unknown array type', typeof array, array);
    return null;
  }

  // GLES2 native methods
  window.GLES2NativeMethods = {
    Java_pl_zb3_freej2me_bridge_gles2_GLES2__1create: function(lib, antialias) {
      console.log('[GLES2] _create called! antialias:', antialias);
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl2', {
        antialias: !!antialias,
        depth: true,
        preserveDrawingBuffer: true // Important: preserve the drawing buffer for blitting to 2D canvas
      });

      if (!gl) {
        console.error('WebGL2 not supported!');
        return null;
      }
      console.log('[GLES2] WebGL2 context created successfully');

      let maxAnisotropy = 0;
      const ext = gl.getExtension('EXT_texture_filter_anisotropic');
      if (ext) {
        maxAnisotropy = gl.getParameter(ext.MAX_TEXTURE_MAX_ANISOTROPY_EXT);
      }

      var handle = {
        gl: gl,
        width: 0,
        height: 0,
        anisotropyExt: ext,
        maxAnisotropy: maxAnisotropy
      };

      // Store the current GLES2 handle globally for access by other native methods
      window.currentGLES2Handle = handle;
      window.GLES2Context = handle;
      console.log('GLES2 context created with preserveDrawingBuffer');
      
      return handle;
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_getCanvas: function(lib, ptr) {
      return ptr.gl.canvas;
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_destroy: function(lib, ptr) {},

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_setSurface: function(lib, ptr, width, height) {
      const gl = ptr.gl;
      if (width !== ptr.width || height !== ptr.height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
        ptr.width = width;
        ptr.height = height;
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_checkGLError: function(lib, ptr) {
      const gl = ptr.gl;
      const error = gl.getError();
      if (error !== gl.NO_ERROR) {
        let errStr = "";
        switch (error) {
          case gl.INVALID_ENUM: errStr = "Invalid enum"; break;
          case gl.INVALID_VALUE: errStr = "Invalid value"; break;
          case gl.INVALID_OPERATION: errStr = "Invalid operation"; break;
          case gl.OUT_OF_MEMORY: errStr = "Out of memory"; break;
          case gl.CONTEXT_LOST_WEBGL: errStr = "Context lost"; break;
        }
        doThrow(lib, errStr);
        return error;
      }
      // Return null (0) when no error, matching freej2me-web behavior
      return null;
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_createProgram: function(lib, ptr, vertexSource, fragmentSource) {
      const gl = ptr.gl;
      const vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

      if (!vertexShader || !fragmentShader) {
        if (vertexShader) gl.deleteShader(vertexShader);
        if (fragmentShader) gl.deleteShader(fragmentShader);
        console.error("Shader creation failed.");
        doThrow(lib, "failed to compile shaders");
        return 0;
      }

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program linking error:', gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        doThrow(lib, "failed to link shaders");
        return 0;
      }

      return program;
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_useProgram: function(lib, ptr, prog) {
      ptr.gl.useProgram(prog);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteProgram: function(lib, ptr, prog) {
      ptr.gl.deleteProgram(prog);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_getAttribLocation: function(lib, ptr, prog, name) {
      return ptr.gl.getAttribLocation(prog, name);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_getUniformLocation: function(lib, ptr, prog, name) {
      return ptr.gl.getUniformLocation(prog, name);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttribPointer: function(lib, ptr, loc, size, type, normalized, stride, offset) {
      // Ensure normalized is a boolean
      ptr.gl.vertexAttribPointer(loc, size, type, !!normalized, stride, offset);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib2f: function(lib, ptr, loc, f1, f2) {
      ptr.gl.vertexAttrib2f(loc, f1, f2);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib3f: function(lib, ptr, loc, f1, f2, f3) {
      ptr.gl.vertexAttrib3f(loc, f1, f2, f3);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib4f: function(lib, ptr, loc, f1, f2, f3, f4) {
      ptr.gl.vertexAttrib4f(loc, f1, f2, f3, f4);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1i: function(lib, ptr, loc, i1) {
      ptr.gl.uniform1i(loc, i1);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1f: function(lib, ptr, loc, f1) {
      ptr.gl.uniform1f(loc, f1);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform2f: function(lib, ptr, loc, f1, f2) {
      ptr.gl.uniform2f(loc, f1, f2);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3f: function(lib, ptr, loc, f1, f2, f3) {
      ptr.gl.uniform3f(loc, f1, f2, f3);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4f: function(lib, ptr, loc, f1, f2, f3, f4) {
      ptr.gl.uniform4f(loc, f1, f2, f3, f4);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3fv: function(lib, ptr, loc, fa) {
      // Based on freej2me-web: fa is expected to be Float32Array
      const gl = ptr.gl;
      if (fa instanceof Float32Array) {
        gl.uniform3fv(loc, fa);
      } else {
        const floatArray = toFloat32Array(fa);
        if (floatArray) {
          gl.uniform3fv(loc, floatArray);
        } else {
          console.error('uniform3fv: Invalid array', fa);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4fv: function(lib, ptr, loc, fa) {
      // Based on freej2me-web: fa is expected to be Float32Array
      const gl = ptr.gl;
      if (fa instanceof Float32Array) {
        gl.uniform4fv(loc, fa);
      } else {
        const floatArray = toFloat32Array(fa);
        if (floatArray) {
          gl.uniform4fv(loc, floatArray);
        } else {
          console.error('uniform4fv: Invalid array', fa);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix3fv: function(lib, ptr, loc, transpose, fa) {
      // Based on freej2me-web: fa is expected to be Float32Array
      const gl = ptr.gl;
      let floatArray;
      if (fa instanceof Float32Array) {
        floatArray = fa;
      } else {
        floatArray = toFloat32Array(fa);
        if (!floatArray) {
          console.error('uniformMatrix3fv: Invalid array', fa);
          return;
        }
      }
      // Ensure we have exactly 9 elements for 3x3 matrix
      if (floatArray.length !== 9) {
        if (floatArray.length > 9) {
          floatArray = floatArray.subarray(0, 9);
        } else {
          console.error('uniformMatrix3fv: Array length must be 9, got', floatArray.length);
          return;
        }
      }
      // Transpose if needed (note: WebGL expects column-major, so we transpose in place)
      if (transpose) {
        floatArray = transposeMatrix(floatArray, 3);
      }
      gl.uniformMatrix3fv(loc, false, floatArray);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix4fv: function(lib, ptr, loc, transpose, fa) {
      // Based on freej2me-web: fa is expected to be Float32Array
      const gl = ptr.gl;
      let floatArray;
      if (fa instanceof Float32Array) {
        floatArray = fa;
      } else {
        floatArray = toFloat32Array(fa);
        if (!floatArray) {
          console.error('uniformMatrix4fv: Invalid array', fa);
          return;
        }
      }
      // Transpose if needed (note: WebGL expects column-major, so we transpose in place)
      if (transpose) {
        floatArray = transposeMatrix(floatArray, 4);
      }
      gl.uniformMatrix4fv(loc, false, floatArray);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_createBuffer: function(lib, ptr) {
      return ptr.gl.createBuffer();
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteBuffers: function(lib, ptr, handles) {
      const gl = ptr.gl;
      if (handles) {
        for (let i = 0; i < handles.length; i++) {
          gl.deleteBuffer(handles[i]);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindBuffer: function(lib, ptr, type, handle) {
      ptr.gl.bindBuffer(type, handle);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferData: function(lib, ptr, type, size, usage) {
      ptr.gl.bufferData(type, size, usage);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData: function(lib, ptr, type, offset, byteSize, array) {
      const gl = ptr.gl;
      
      if (!array) {
        console.error('bufferSubData: array is null or undefined');
        return;
      }
      
      // Based on freej2me-web: TypedArrays have buffer and byteOffset properties
      if (array.buffer && array.byteOffset !== undefined) {
        // TypedArray (Int8Array, Int16Array, Int32Array, Float32Array)
        // Create a Uint8Array view of the underlying buffer
        const actualByteSize = Math.min(array.byteLength, byteSize);
        const uint8View = new Uint8Array(array.buffer, array.byteOffset, actualByteSize);
        gl.bufferSubData(type, offset, uint8View);
      } else {
        console.error('bufferSubData: array is not a TypedArray', array);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_createTexture: function(lib, ptr) {
      return ptr.gl.createTexture();
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteTexture: function(lib, ptr, handle) {
      ptr.gl.deleteTexture(handle);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_activeTexture: function(lib, ptr, unit) {
      ptr.gl.activeTexture(unit);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindTexture: function(lib, ptr, target, handle) {
      ptr.gl.bindTexture(target, handle);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameterf: function(lib, ptr, target, pname, param) {
      ptr.gl.texParameterf(target, pname, param);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameteri: function(lib, ptr, target, pname, param) {
      ptr.gl.texParameteri(target, pname, param);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2D: function(lib, ptr, target, level, intFormat, width, height, border, format, type, byteArray) {
      const gl = ptr.gl;
      // Based on freej2me-web: directly use buffer and byteOffset if available
      if (byteArray && byteArray.buffer && byteArray.byteOffset !== undefined) {
        // TypedArray - use buffer directly
        gl.texImage2D(target, level, intFormat, width, height, border, format, type, 
          new Uint8Array(byteArray.buffer, byteArray.byteOffset, byteArray.byteLength));
      } else if (byteArray === null || byteArray === undefined) {
        // Null array is valid (for creating empty texture)
        gl.texImage2D(target, level, intFormat, width, height, border, format, type, null);
      } else {
        // Fallback to helper function
        const pixels = toUint8Array(byteArray);
        if (pixels) {
          gl.texImage2D(target, level, intFormat, width, height, border, format, type, pixels);
        } else {
          console.error('texImage2D: Invalid byteArray', byteArray);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2DFromHandle: function(lib, ptr, target, level, intFormat, width, height, format, type, handle) {
      ptr.gl.texImage2D(target, level, intFormat, width, height, 0, format, type, handle);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_generateMipmap: function(lib, ptr, target) {
      ptr.gl.generateMipmap(target);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_toggleAnisotropy: function(lib, ptr, enable) {
      const gl = ptr.gl;
      if (ptr.anisotropyExt && ptr.maxAnisotropy) {
        gl.texParameterf(gl.TEXTURE_2D, ptr.anisotropyExt.TEXTURE_MAX_ANISOTROPY_EXT, enable ? ptr.maxAnisotropy : 0);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_isTexture: function(lib, ptr, handle) {
      return handle && ptr.gl.isTexture(handle);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_clear: function(lib, ptr, mask) {
      console.log('[GLES2] clear called:', mask);
      ptr.gl.clear(mask);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearColor: function(lib, ptr, r, g, b, a) {
      ptr.gl.clearColor(r, g, b, a);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearDepthf: function(lib, ptr, depth) {
      ptr.gl.clearDepth(depth);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_colorMask: function(lib, ptr, r, g, b, a) {
      ptr.gl.colorMask(r, g, b, a);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_cullFace: function(lib, ptr, mode) {
      ptr.gl.cullFace(mode);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthFunc: function(lib, ptr, mode) {
      ptr.gl.depthFunc(mode);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthRange: function(lib, ptr, near, far) {
      ptr.gl.depthRange(near, far);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthMask: function(lib, ptr, flag) {
      ptr.gl.depthMask(flag);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_disable: function(lib, ptr, flag) {
      ptr.gl.disable(flag);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_disableVertexAttribArray: function(lib, ptr, loc) {
      ptr.gl.disableVertexAttribArray(loc);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawArrays: function(lib, ptr, mode, first, count) {
      console.log('[GLES2] drawArrays called:', mode, first, count);
      ptr.gl.drawArrays(mode, first, count);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawElements: function(lib, ptr, mode, count, type, offset) {
      console.log('[GLES2] drawElements called:', mode, count, type, offset);
      ptr.gl.drawElements(mode, count, type, offset);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_enable: function(lib, ptr, flag) {
      ptr.gl.enable(flag);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_enableVertexAttribArray: function(lib, ptr, loc) {
      ptr.gl.enableVertexAttribArray(loc);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_finish: function(lib, ptr) {
      ptr.gl.finish();
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_frontFace: function(lib, ptr, mode) {
      ptr.gl.frontFace(mode);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_pixelStorei: function(lib, ptr, pname, param) {
      ptr.gl.pixelStorei(pname, param);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_polygonOffset: function(lib, ptr, factor, units) {
      ptr.gl.polygonOffset(factor, units);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_readPixels: function(lib, ptr, x, y, width, height, int8pixels) {
      const gl = ptr.gl;
      const pixels = new Uint8Array(int8pixels.buffer, int8pixels.byteOffset, int8pixels.byteLength);
      gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_scissor: function(lib, ptr, x, y, width, height) {
      ptr.gl.scissor(x, y, width, height);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_viewport: function(lib, ptr, x, y, width, height) {
      ptr.gl.viewport(x, y, width, height);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendColor: function(lib, ptr, r, g, b, a) {
      ptr.gl.blendColor(r, g, b, a);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendEquation: function(lib, ptr, mode) {
      ptr.gl.blendEquation(mode);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFunc: function(lib, ptr, sfactor, dfactor) {
      ptr.gl.blendFunc(sfactor, dfactor);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFuncSeparate: function(lib, ptr, srcRGB, dstRGB, srcAlpha, dstAlpha) {
      ptr.gl.blendFuncSeparate(srcRGB, dstRGB, srcAlpha, dstAlpha);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_createVertexArray: function(lib, ptr) {
      return ptr.gl.createVertexArray();
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindVertexArray: function(lib, ptr, vao) {
      ptr.gl.bindVertexArray(vao);
    },

    // Method to copy GL Canvas content to a 2D context (for blitGL functionality)
    Java_pl_zb3_freej2me_bridge_gles2_GLES2_blitToContext: function(lib, ptr, targetCtx, sx, sy, dx, dy, width, height, flipY, withAlpha) {
      const glCanvas = ptr.gl.canvas;
      
      if (!withAlpha) {
        // Fill with black background first
        targetCtx.save();
        targetCtx.fillStyle = 'black';
        targetCtx.fillRect(dx, dy, width, height);
        targetCtx.restore();
      }
      
      if (!flipY) {
        targetCtx.drawImage(glCanvas, sx, sy, width, height, dx, dy, width, height);
      } else {
        targetCtx.save();
        targetCtx.translate(dx, dy + height);
        targetCtx.scale(1, -1);
        targetCtx.drawImage(glCanvas, sx, sy, width, height, 0, 0, width, height);
        targetCtx.restore();
      }
    },

    // Utility method to get the current GL canvas for direct access
    Java_pl_zb3_freej2me_bridge_gles2_GLES2_getGLCanvas: function(lib, ptr) {
      return ptr.gl.canvas;
    },

    // Method to finish rendering and ensure all GL commands are executed
    Java_pl_zb3_freej2me_bridge_gles2_GLES2_finish: function(lib, ptr) {
      ptr.gl.finish();
    }
  };

  // Store the GL context globally for access by other parts of the system
  window.GLES2Context = null;

  console.log('libgles2.js loaded - GLES2 native methods available');
})();
