// WebGL2 bridge for J2ME 3D support
// Based on freej2me-web implementation
// VERSION: 20251212g
console.log('[libgles2.js] Loaded v20251212g');
window.GLES2_LIB_VERSION = '20251212g';

(function() {
  'use strict';
  
  // Log throttling to prevent spam during loops
  const logThrottle = {
    counts: {},
    maxPerSecond: 5,
    lastReset: Date.now(),
    shouldLog: function(key) {
      const now = Date.now();
      if (now - this.lastReset > 1000) {
        this.counts = {};
        this.lastReset = now;
      }
      this.counts[key] = (this.counts[key] || 0) + 1;
      return this.counts[key] <= this.maxPerSecond;
    }
  };
  
  // Quiet logging - only log errors and important events
  const DEBUG = false;
  const log = DEBUG ? console.log.bind(console) : function() {};
  const warn = DEBUG ? console.warn.bind(console) : function() {};
  const logOnce = (key, ...args) => { if (DEBUG && logThrottle.shouldLog(key)) console.log(...args); };
  const warnOnce = (key, ...args) => { if (logThrottle.shouldLog(key)) console.warn(...args); };
  const errorOnce = (key, ...args) => { if (logThrottle.shouldLog(key)) console.error(...args); };

  function createShader(gl, type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.log('Shader compilation error:', gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
  }

  function doThrow(lib, str) {
    if (window.GLES2ExceptionHandler) {
      window.GLES2ExceptionHandler(str);
    } else {
      console.log('GLES2 Error:', str);
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
    console.log('toUint8Array: Unknown array type', typeof array, array);
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
    console.log('toFloat32Array: Unknown array type', typeof array, array);
    return null;
  }

  // GLES2 native methods
  window.GLES2NativeMethods = {
    Java_pl_zb3_freej2me_bridge_gles2_GLES2__1create: function(lib, antialias) {
      log('[GLES2] _create called! antialias:', antialias);
      var canvas = document.createElement('canvas');
      var gl = canvas.getContext('webgl2', {
        antialias: !!antialias,
        depth: true,
        preserveDrawingBuffer: true // Important: preserve the drawing buffer for blitting to 2D canvas
      });

      if (!gl) {
        console.log('WebGL2 not supported!');
        return null;
      }
      log('[GLES2] WebGL2 context created successfully');

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
      log('[GLES2] setSurface called:', width, 'x', height);
      const gl = ptr.gl;
      if (width !== ptr.width || height !== ptr.height) {
        gl.canvas.width = width;
        gl.canvas.height = height;
        gl.viewport(0, 0, width, height);
        ptr.width = width;
        ptr.height = height;
        log('[GLES2] setSurface - canvas resized to:', gl.canvas.width, 'x', gl.canvas.height);
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
        console.log("Shader creation failed.");
        doThrow(lib, "failed to compile shaders");
        return 0;
      }

      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);

      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.log('Program linking error:', gl.getProgramInfoLog(program));
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
      const gl = ptr.gl;
      // Ensure normalized is a boolean
      gl.vertexAttribPointer(loc, size, type, !!normalized, stride, offset);
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
          errorOnce('uniform3fv', 'uniform3fv: Invalid array');
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
          errorOnce('uniform4fv', 'uniform4fv: Invalid array');
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
          errorOnce('uniformMatrix3fv-null', 'uniformMatrix3fv: Invalid array');
          return;
        }
      }
      // Ensure we have exactly 9 elements for 3x3 matrix
      if (floatArray.length !== 9) {
        if (floatArray.length > 9) {
          floatArray = floatArray.subarray(0, 9);
        } else {
          errorOnce('uniformMatrix3fv-len', 'uniformMatrix3fv: Array length must be 9');
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
          errorOnce('uniformMatrix4fv-null', 'uniformMatrix4fv: Invalid array');
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
      // Always execute the bind, even for null (unbind)
      ptr.gl.bindBuffer(type, handle);
      // Track the bound buffer
      if (window.GLES2BoundBuffers) {
        if (handle) {
          window.GLES2BoundBuffers.set(type, handle);
        } else {
          window.GLES2BoundBuffers.delete(type);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferData: function(lib, ptr, type, size, usage) {
      const gl = ptr.gl;
      gl.bufferData(type, size, usage);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData: function(lib, ptr, type, offset, byteSize, array) {
      const gl = ptr.gl;
      
      if (!array) {
        errorOnce('bufferSubData-null', 'bufferSubData: array is null or undefined');
        return;
      }
      
      // DEBUG: Log array info to diagnose vertex data issues
      if (DEBUG || Math.random() < 0.01) {
        console.log('[GLES2] bufferSubData - type:', type, 'offset:', offset, 'byteSize:', byteSize, 
          'array type:', array.constructor ? array.constructor.name : typeof array,
          'array length:', array.length, 'byteLength:', array.byteLength);
        if (array.length > 0) {
          console.log('[GLES2] bufferSubData - first 10 values:', Array.from(array.slice(0, 10)));
        }
      }
      
      // Based on freej2me-web: TypedArrays have buffer and byteOffset properties
      if (array.buffer && array.byteOffset !== undefined) {
        // TypedArray (Int8Array, Int16Array, Int32Array, Float32Array)
        // CRITICAL: Pass the TypedArray directly to WebGL, not a Uint8Array view
        // WebGL's bufferSubData accepts any ArrayBufferView
        gl.bufferSubData(type, offset, array);
      } else if (Array.isArray(array)) {
        // Plain JavaScript array - convert to appropriate TypedArray
        warnOnce('bufferSubData-plainarray', 'bufferSubData: received plain array, converting to Int16Array');
        const typedArray = new Int16Array(array);
        gl.bufferSubData(type, offset, typedArray);
      } else {
        errorOnce('bufferSubData-invalid', 'bufferSubData: array is not a TypedArray or Array');
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
      // Check if this looks like an integer enum value being passed as float
      // GL_TEXTURE_WRAP_S/T should use texParameteri, not texParameterf
      if ((pname === 0x2802 || pname === 0x2803) && (param > 1000000 || param < -1000000)) {
        warnOnce('texParameterf-enum', '[GLES2] texParameterf called with integer enum value');
        ptr.gl.texParameteri(target, pname, Math.round(param));
      } else {
        ptr.gl.texParameterf(target, pname, param);
      }
      const error = ptr.gl.getError();
      if (error !== ptr.gl.NO_ERROR) {
        warnOnce('texParameterf-error', '[GLES2] texParameterf error:', error);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameteri: function(lib, ptr, target, pname, param) {
      ptr.gl.texParameteri(target, pname, param);
      const error = ptr.gl.getError();
      if (error !== ptr.gl.NO_ERROR) {
        warnOnce('texParameteri-error', '[GLES2] texParameteri error:', error);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2D: function(lib, ptr, target, level, intFormat, width, height, border, format, type, byteArray) {
      const gl = ptr.gl;
      try {
        // Calculate expected data size based on format
        let bytesPerPixel = 4; // Default to RGBA
        if (format === gl.RGB) bytesPerPixel = 3;
        else if (format === gl.LUMINANCE_ALPHA) bytesPerPixel = 2;
        else if (format === gl.LUMINANCE || format === gl.ALPHA) bytesPerPixel = 1;
        
        const expectedSize = width * height * bytesPerPixel;
        
        // Based on freej2me-web: directly use buffer and byteOffset if available
        if (byteArray && byteArray.buffer && byteArray.byteOffset !== undefined) {
          // Validate buffer size
          if (byteArray.byteLength < expectedSize) {
            warnOnce('texImage2D-bufsize', '[GLES2] texImage2D - buffer size mismatch');
            // Try to use what we have, but this may cause issues
          }
          // TypedArray - use buffer directly
          const pixels = new Uint8Array(byteArray.buffer, byteArray.byteOffset, Math.min(byteArray.byteLength, expectedSize));
          gl.texImage2D(target, level, intFormat, width, height, border, format, type, pixels);
        } else if (byteArray === null || byteArray === undefined) {
          // Null array is valid (for creating empty texture)
          gl.texImage2D(target, level, intFormat, width, height, border, format, type, null);
        } else {
          // Fallback to helper function
          const pixels = toUint8Array(byteArray);
          if (pixels) {
            if (pixels.length < expectedSize) {
              warnOnce('texImage2D-pixbufsize', '[GLES2] texImage2D - buffer size mismatch');
            }
            gl.texImage2D(target, level, intFormat, width, height, border, format, type, pixels);
          } else {
            errorOnce('texImage2D-invalidbuf', '[GLES2] texImage2D: Invalid byteArray');
          }
        }
        
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
          warnOnce('texImage2D-error', '[GLES2] texImage2D error:', error);
        }
      } catch (e) {
        errorOnce('texImage2D-exception', '[GLES2] texImage2D exception:', e);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2DFromHandle: function(lib, ptr, target, level, intFormat, width, height, format, type, sourceHandle) {
      // sourceHandle is typically a canvas element
      let source = sourceHandle;
      
      log('[GLES2] texImage2DFromHandle - target:', target, 'size:', width, 'x', height, 'source:', source);
      
      // If sourceHandle is an address, try to get the actual object
      if (typeof sourceHandle === 'number' && sourceHandle !== 0) {
        // Try getNative first
        if (typeof getNative === 'function') {
          const native = getNative(sourceHandle);
          if (native) {
            source = native;
            log('[GLES2] texImage2DFromHandle - got from getNative:', source);
          }
        }
        // Fallback to NativeMap
        if (!source || source === sourceHandle) {
          if (typeof J2ME !== 'undefined' && J2ME.NativeMap && J2ME.NativeMap.has(sourceHandle)) {
            source = J2ME.NativeMap.get(sourceHandle);
          } else if (typeof NativeMap !== 'undefined' && NativeMap.has && NativeMap.has(sourceHandle)) {
            source = NativeMap.get(sourceHandle);
          }
        }
      }
      
      // Handle canvas context vs canvas element
      if (source && source._canvas) {
        source = source._canvas;
      } else if (source && source.canvas) {
        source = source.canvas;
      }
      
      // Handle WebGL context handle
      if (source && source.gl && source.gl.canvas) {
        source = source.gl.canvas;
      }
      
      // If source is still 0 or invalid, try screenCanvas as fallback for background blitting
      if (!source || source === 0) {
        if (window.screenCanvas) {
          source = window.screenCanvas;
          log('[GLES2] texImage2DFromHandle - using screenCanvas as fallback');
        } else {
          errorOnce('texImage2DFromHandle-null', '[GLES2] texImage2DFromHandle - source is null, no fallback available');
          return;
        }
      }
      
      try {
        ptr.gl.texImage2D(target, level, intFormat, format, type, source);
        log('[GLES2] texImage2DFromHandle - success');
      } catch (e) {
        errorOnce('texImage2DFromHandle-error', '[GLES2] texImage2DFromHandle error:', e);
      }
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
      if (!ptr || !ptr.gl) {
        warnOnce('clear-null', '[GLES2] clear - ptr or gl is null');
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'clear - ptr or gl is null');
        }
        return;
      }
      if (mask === 0) {
        return; // Nothing to clear
      }
      try {
        // Reduce log spam - only log occasionally
        if (DEBUG) {
          console.log('[GLES2] clear called:', mask, 'canvas size:', ptr.gl.canvas.width, 'x', ptr.gl.canvas.height);
        }
        if (window.debugLog) {
          window.debugLog.debug('WEBGL', 'clear called', {
            mask: mask,
            canvasSize: `${ptr.gl.canvas.width}x${ptr.gl.canvas.height}`
          });
        }
        ptr.gl.clear(mask);
        const error = ptr.gl.getError();
        if (error !== ptr.gl.NO_ERROR) {
          warnOnce('clear-error', '[GLES2] GL error after clear:', error);
          if (window.debugLog) {
            window.debugLog.error('WEBGL', 'GL error after clear', { error: error });
          }
        }
      } catch (e) {
        errorOnce('clear-exception', '[GLES2] clear exception:', e);
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'clear exception', e);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearColor: function(lib, ptr, r, g, b, a) {
      // Reduce log spam - only log if DEBUG is enabled
      if (DEBUG) {
        console.log('[GLES2] clearColor set:', r, g, b, a);
      }
      if (window.debugLog) {
        // 检查是否为黑色背景
        if (r === 0 && g === 0 && b === 0 && a === 0) {
          window.debugLog.warn('BLACKSCREEN', 'clearColor set to transparent black (0,0,0,0)', { r, g, b, a });
        } else if (r === 0 && g === 0 && b === 0 && a > 0) {
          window.debugLog.debug('BLACKSCREEN', 'clearColor set to black', { r, g, b, a });
        }
      }
      ptr.gl.clearColor(r, g, b, a);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearDepthf: function(lib, ptr, depth) {
      ptr.gl.clearDepth(depth);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_colorMask: function(lib, ptr, r, g, b, a) {
      // 检查是否所有颜色通道都被禁用（会导致黑屏）
      if (!r && !g && !b) {
        // 只在首次检测时打印（使用标志确保只输出一次）
        if (!window._colorChannelsDisabledMessagePrinted) {
          console.log('[GLES2] WARNING: All color channels disabled! This will cause black screen.');
          window._colorChannelsDisabledMessagePrinted = true;
        }
        if (window.debugLog) {
          window.debugLog.warn('BLACKSCREEN', 'All color channels disabled', { r, g, b, a });
        }
      }
      ptr.gl.colorMask(r, g, b, a);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_cullFace: function(lib, ptr, mode) {
      // 自动修复：如果检测到连续黑屏，自动禁用面剔除
      if (window._drawElementsBlackCount && window._drawElementsBlackCount >= 3) {
        const autoDisableCullFace = window.autoDisableCullFace !== false; // 默认启用
        if (autoDisableCullFace) {
          // 只在首次自动禁用时打印（使用标志确保只输出一次）
          if (!window._autoDisableCullFaceMessagePrinted) {
            console.log('[GLES2] Auto-disabling CULL_FACE due to black screen detection');
            window._autoDisableCullFaceMessagePrinted = true;
          }
          ptr.gl.disable(ptr.gl.CULL_FACE);
          if (window.debugLog) {
            window.debugLog.warn('BLACKSCREEN', 'Auto-disabled CULL_FACE due to black screen', {
              blackCount: window._drawElementsBlackCount,
              requestedMode: mode
            });
          }
          return; // 不执行cullFace，直接禁用
        }
      }
      ptr.gl.cullFace(mode);
      
      // 记录面剔除状态用于诊断
      if (window.debugLog && (!window._cullFaceLogThrottle || Date.now() - window._cullFaceLogThrottle > 2000)) {
        const cullFaceEnabled = ptr.gl.isEnabled(ptr.gl.CULL_FACE);
        window.debugLog.debug('WEBGL', 'cullFace called', {
          mode: mode,
          enabled: cullFaceEnabled,
          note: cullFaceEnabled ? 'May cause black screen if vertex order is wrong' : 'OK'
        });
        window._cullFaceLogThrottle = Date.now();
      }
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
      logOnce('drawArrays', '[GLES2] drawArrays:', mode, first, count);
      // Check GL state before draw
      const currentProgram = ptr.gl.getParameter(ptr.gl.CURRENT_PROGRAM);
      const viewport = ptr.gl.getParameter(ptr.gl.VIEWPORT);
      if (currentProgram === null) {
        warnOnce('drawArrays-noprogram', '[GLES2] drawArrays - no program bound!');
      }
      if (viewport[2] === 0 || viewport[3] === 0) {
        warnOnce('drawArrays-viewport', '[GLES2] drawArrays - invalid viewport:', viewport);
      }
      ptr.gl.drawArrays(mode, first, count);
      const error = ptr.gl.getError();
      if (error !== ptr.gl.NO_ERROR) {
        warnOnce('drawArrays-error', '[GLES2] GL error after drawArrays:', error, 'mode:', mode, 'count:', count);
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawElements: function(lib, ptr, mode, count, type, offset) {
      // 移除调用过程日志
      // Check GL state before draw
      const currentProgram = ptr.gl.getParameter(ptr.gl.CURRENT_PROGRAM);
      const viewport = ptr.gl.getParameter(ptr.gl.VIEWPORT);
      if (currentProgram === null) {
        warnOnce('drawElements-noprogram', '[GLES2] drawElements - no program bound!');
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'drawElements - no program bound!');
        }
      }
      if (viewport[2] === 0 || viewport[3] === 0) {
        warnOnce('drawElements-viewport', '[GLES2] drawElements - invalid viewport:', viewport);
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'drawElements - invalid viewport', { viewport });
        }
      }
      
      // DEBUG: Check ELEMENT_ARRAY_BUFFER binding
      const elementBuffer = ptr.gl.getParameter(ptr.gl.ELEMENT_ARRAY_BUFFER_BINDING);
      if (!elementBuffer) {
        warnOnce('drawElements-nobuf', '[GLES2] drawElements - no element array buffer bound!');
        if (window.debugLog) {
          window.debugLog.warn('WEBGL', 'drawElements - no element array buffer bound!');
        }
      }
      
      // DEBUG: Check ARRAY_BUFFER binding
      const arrayBuffer = ptr.gl.getParameter(ptr.gl.ARRAY_BUFFER_BINDING);
      
      if (window.debugLog && (!window._drawElementsLogThrottle || Date.now() - window._drawElementsLogThrottle > 1000)) {
        window.debugLog.debug('WEBGL', 'drawElements', {
          mode, count, type, offset,
          hasProgram: !!currentProgram,
          viewport: viewport,
          hasElementBuffer: !!elementBuffer,
          hasArrayBuffer: !!arrayBuffer
        });
        window._drawElementsLogThrottle = Date.now();
      }
      
      ptr.gl.drawElements(mode, count, type, offset);
      const error = ptr.gl.getError();
      if (error !== ptr.gl.NO_ERROR) {
        warnOnce('drawElements-error', '[GLES2] GL error after drawElements:', error, 'mode:', mode, 'count:', count);
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'GL error after drawElements', { error, mode, count });
        }
      }
      
      // DEBUG: Read center pixel after draw to check if anything was rendered
      // 只在检测到黑屏后持续检测，避免频繁检测
      if (!window._drawElementsCheckCount) window._drawElementsCheckCount = 0;
      if (!window._drawElementsBlackCount) window._drawElementsBlackCount = 0;
      window._drawElementsCheckCount++;
      // 只在检测到黑屏后持续检测，移除每10次检测的逻辑
      const shouldCheckPixel = window._drawElementsCheckCount <= 10 || 
                                window._drawElementsBlackCount > 0;
      if (shouldCheckPixel) {
        try {
          const pixel = new Uint8Array(4);
          const centerX = Math.floor(viewport[2] / 2);
          const centerY = Math.floor(viewport[3] / 2);
          ptr.gl.readPixels(centerX, centerY, 1, 1, ptr.gl.RGBA, ptr.gl.UNSIGNED_BYTE, pixel);
          
          const pixelData = { r: pixel[0], g: pixel[1], b: pixel[2], a: pixel[3] };
          
          if (window.debugLog) {
            window.debugLog.info('WEBGL', `drawElements #${window._drawElementsCheckCount} - center pixel after draw`, {
              pixel: pixelData,
              count,
              position: { x: centerX, y: centerY }
            });
          }
          
          // 检查是否为黑色 - 如果是黑色，输出详细诊断信息（无论是否有 debugLog）
          if (pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 255) {
            window._drawElementsBlackCount++;
            // 收集详细的 WebGL 状态信息
            const gl = ptr.gl;
            const diagnostics = {
              pixel: pixelData,
              count,
              hasProgram: !!currentProgram,
              hasElementBuffer: !!elementBuffer,
              hasArrayBuffer: !!arrayBuffer,
              viewport: viewport
            };
            
            // 检查 shader 程序状态
            if (currentProgram) {
              const programValid = gl.getProgramParameter(currentProgram, gl.LINK_STATUS);
              const programInfoLog = gl.getProgramInfoLog(currentProgram);
              diagnostics.programValid = programValid;
              if (programInfoLog) diagnostics.programInfoLog = programInfoLog;
            }
            
            // 检查纹理绑定状态（检查前 4 个纹理单元）
            const textures = [];
            for (let i = 0; i < 4; i++) {
              gl.activeTexture(gl.TEXTURE0 + i);
              const texture = gl.getParameter(gl.TEXTURE_BINDING_2D);
              textures.push({
                unit: i,
                bound: !!texture
              });
            }
            diagnostics.textures = textures;
            
            // 检查深度测试状态
            const depthTestEnabled = gl.isEnabled(gl.DEPTH_TEST);
            const depthFunc = gl.getParameter(gl.DEPTH_FUNC);
            const depthMask = gl.getParameter(gl.DEPTH_WRITEMASK);
            diagnostics.depthTest = {
              enabled: depthTestEnabled,
              func: depthFunc,
              writeMask: depthMask
            };
            
            // 检查颜色掩码
            const colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
            diagnostics.colorMask = colorMask;
            
            // 检查混合状态
            const blendEnabled = gl.isEnabled(gl.BLEND);
            const blendFunc = gl.getParameter(gl.BLEND_SRC_ALPHA) !== undefined 
              ? [gl.getParameter(gl.BLEND_SRC_RGB), gl.getParameter(gl.BLEND_DST_RGB), 
                 gl.getParameter(gl.BLEND_SRC_ALPHA), gl.getParameter(gl.BLEND_DST_ALPHA)]
              : [gl.getParameter(gl.BLEND_SRC), gl.getParameter(gl.BLEND_DST)];
            diagnostics.blend = {
              enabled: blendEnabled,
              func: blendFunc
            };
            
            // 检查裁剪测试
            const scissorTestEnabled = gl.isEnabled(gl.SCISSOR_TEST);
            const scissorBox = gl.getParameter(gl.SCISSOR_BOX);
            diagnostics.scissorTest = {
              enabled: scissorTestEnabled,
              box: scissorBox
            };
            
              // 检查面剔除
              const cullFaceEnabled = gl.isEnabled(gl.CULL_FACE);
              const cullFace = gl.getParameter(gl.CULL_FACE_MODE);
              const frontFace = gl.getParameter(gl.FRONT_FACE);
              diagnostics.cullFace = {
                enabled: cullFaceEnabled,
                mode: cullFace,
                frontFace: frontFace,
                note: cullFaceEnabled ? 'If all faces are culled, nothing will render!' : 'OK'
              };
              
              // 自动修复：如果连续3次黑屏且面剔除启用，尝试禁用面剔除（只在关键节点打印）
              if (cullFaceEnabled && window._drawElementsBlackCount >= 3 && window.autoDisableCullFace !== false) {
                const modeStr = cullFace === gl.BACK ? 'GL_BACK' : cullFace === gl.FRONT ? 'GL_FRONT' : 'GL_FRONT_AND_BACK';
                const frontFaceStr = frontFace === gl.CW ? 'GL_CW' : 'GL_CCW';
                
                // 只在首次自动修复时打印
                if (!window._drawElementsMessagesPrinted || !window._drawElementsMessagesPrinted.cullFaceFixed) {
                  console.log('[BLACKSCREEN] Attempting auto-fix: Disabling CULL_FACE (mode=' + modeStr + ', frontFace=' + frontFaceStr + ')');
                  if (!window._drawElementsMessagesPrinted) {
                    window._drawElementsMessagesPrinted = {};
                  }
                  window._drawElementsMessagesPrinted.cullFaceFixed = true;
                }
                
                gl.disable(gl.CULL_FACE);
                diagnostics.cullFace.autoFixed = true;
                diagnostics.cullFace.note = 'Auto-disabled due to black screen';
                
                if (window.debugLog) {
                  window.debugLog.warn('BLACKSCREEN', 'Auto-disabled CULL_FACE', {
                    blackCount: window._drawElementsBlackCount,
                    previousMode: modeStr,
                    previousFrontFace: frontFaceStr
                  });
                }
              }
            
            // 检查顶点属性状态
            const vertexAttribs = [];
            if (currentProgram) {
              const maxAttribs = gl.getParameter(gl.MAX_VERTEX_ATTRIBS);
              for (let i = 0; i < Math.min(maxAttribs, 8); i++) {
                const enabled = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_ENABLED);
                const size = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_SIZE);
                const type = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_TYPE);
                const normalized = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_NORMALIZED);
                const stride = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_STRIDE);
                const buffer = gl.getVertexAttrib(i, gl.VERTEX_ATTRIB_ARRAY_BUFFER_BINDING);
                if (enabled || buffer) {
                  vertexAttribs.push({
                    index: i,
                    enabled: !!enabled,
                    size: size,
                    type: type,
                    normalized: !!normalized,
                    stride: stride,
                    hasBuffer: !!buffer
                  });
                }
              }
            }
            diagnostics.vertexAttribs = vertexAttribs;
            
            // 检查GL错误
            const glError = gl.getError();
            diagnostics.glError = glError;
            if (glError !== gl.NO_ERROR) {
              const errorNames = {
                [gl.INVALID_ENUM]: 'GL_INVALID_ENUM',
                [gl.INVALID_VALUE]: 'GL_INVALID_VALUE',
                [gl.INVALID_OPERATION]: 'GL_INVALID_OPERATION',
                [gl.INVALID_FRAMEBUFFER_OPERATION]: 'GL_INVALID_FRAMEBUFFER_OPERATION',
                [gl.OUT_OF_MEMORY]: 'GL_OUT_OF_MEMORY',
                [gl.CONTEXT_LOST_WEBGL]: 'GL_CONTEXT_LOST_WEBGL'
              };
              diagnostics.glErrorName = errorNames[glError] || 'UNKNOWN';
            }
            
            // 检查缓冲区大小
            if (elementBuffer) {
              const elementBufferSize = gl.getBufferParameter(gl.ELEMENT_ARRAY_BUFFER, gl.BUFFER_SIZE);
              diagnostics.elementBufferSize = elementBufferSize;
            }
            if (arrayBuffer) {
              const arrayBufferSize = gl.getBufferParameter(gl.ARRAY_BUFFER, gl.BUFFER_SIZE);
              diagnostics.arrayBufferSize = arrayBufferSize;
            }
            
            // 分析可能的原因
            const possibleCauses = [];
            if (!currentProgram) {
              possibleCauses.push('❌ 没有绑定着色器程序');
            } else if (!diagnostics.programValid) {
              possibleCauses.push('❌ 着色器程序链接失败: ' + (diagnostics.programInfoLog || '未知错误'));
            }
            if (cullFaceEnabled && !diagnostics.cullFace.autoFixed) {
              possibleCauses.push('⚠️ 面剔除已启用，可能导致所有面被剔除');
            }
            if (depthTestEnabled && depthMask) {
              possibleCauses.push('⚠️ 深度测试已启用，如果深度值不正确，像素可能被丢弃');
            }
            if (scissorTestEnabled) {
              possibleCauses.push('⚠️ 裁剪测试已启用，如果绘制区域在裁剪框外，不会渲染');
            }
            if (!colorMask[0] || !colorMask[1] || !colorMask[2]) {
              possibleCauses.push('⚠️ 颜色写入被禁用: R=' + colorMask[0] + ', G=' + colorMask[1] + ', B=' + colorMask[2]);
            }
            if (vertexAttribs.length === 0) {
              possibleCauses.push('❌ 没有启用的顶点属性');
            }
            if (glError !== gl.NO_ERROR) {
              possibleCauses.push('❌ WebGL错误: ' + (diagnostics.glErrorName || glError));
            }
            if (count === 0) {
              possibleCauses.push('❌ 绘制元素数量为0');
            }
            if (!elementBuffer && !arrayBuffer) {
              possibleCauses.push('❌ 没有绑定缓冲区');
            }
            if (diagnostics.textures && diagnostics.textures.every(t => !t.bound)) {
              possibleCauses.push('⚠️ 没有绑定纹理（如果着色器需要纹理，这可能导致问题）');
            }
            if (possibleCauses.length === 0) {
              possibleCauses.push('⚠️ 可能的原因：顶点数据在视口外、矩阵变换错误、着色器输出黑色等');
            }
            diagnostics.possibleCauses = possibleCauses;
            
            // 自动修复尝试（仅在连续黑屏达到阈值时）
            const autoFixAttempted = window._autoFixAttempted || {};
            const shouldAutoFix = window._drawElementsBlackCount >= 3 && window.autoDisableCullFace !== false;
            
            if (shouldAutoFix) {
              const fixes = [];
              
              // 尝试禁用深度测试（如果启用且深度写入开启）
              if (depthTestEnabled && depthMask && !autoFixAttempted.depthTest) {
                gl.disable(gl.DEPTH_TEST);
                fixes.push('禁用了深度测试');
                autoFixAttempted.depthTest = true;
                diagnostics.autoFix = diagnostics.autoFix || {};
                diagnostics.autoFix.disabledDepthTest = true;
              }
              
              // 尝试禁用裁剪测试（如果启用）
              if (scissorTestEnabled && !autoFixAttempted.scissorTest) {
                gl.disable(gl.SCISSOR_TEST);
                fixes.push('禁用了裁剪测试');
                autoFixAttempted.scissorTest = true;
                diagnostics.autoFix = diagnostics.autoFix || {};
                diagnostics.autoFix.disabledScissorTest = true;
              }
              
              // 确保颜色写入开启
              if ((!colorMask[0] || !colorMask[1] || !colorMask[2]) && !autoFixAttempted.colorMask) {
                gl.colorMask(true, true, true, colorMask[3] !== undefined ? colorMask[3] : true);
                fixes.push('启用了颜色写入');
                autoFixAttempted.colorMask = true;
                diagnostics.autoFix = diagnostics.autoFix || {};
                diagnostics.autoFix.enabledColorMask = true;
              }
              
              if (fixes.length > 0) {
                // 只在首次自动修复时打印（全局只打印一次，避免与 drawImage2 重复）
                if (!window._blackScreenGlobalMessagesPrinted || !window._blackScreenGlobalMessagesPrinted.autoFixAttempted) {
                  console.log('[BLACKSCREEN] 自动修复: ' + fixes.join(', '));
                  if (!window._blackScreenGlobalMessagesPrinted) {
                    window._blackScreenGlobalMessagesPrinted = {};
                  }
                  window._blackScreenGlobalMessagesPrinted.autoFixAttempted = true;
                }
                if (window.debugLog) {
                  window.debugLog.warn('BLACKSCREEN', 'Auto-fix attempts', { fixes });
                }
              }
              
              window._autoFixAttempted = autoFixAttempted;
            }
            
            // 输出详细诊断 - 只在关键节点打印，避免刷屏
            // 使用全局标志避免 drawElements 和 drawImage2 重复输出
            if (!window._blackScreenGlobalMessagesPrinted) {
              window._blackScreenGlobalMessagesPrinted = {
                first: false,
                threshold: false,
                detailed: false,
                autoFix: false
              };
            }
            
            // 只在关键节点打印详细消息：首次、达到阈值（3次）
            const hasAutoFix = diagnostics.autoFix && Object.keys(diagnostics.autoFix).length > 0;
            const shouldPrintDetails = window._drawElementsBlackCount === 1 || 
                                      window._drawElementsBlackCount === 3;
            
            if (shouldPrintDetails) {
              // 只在首次和阈值时打印分隔线和标题（全局只打印一次）
              if ((window._drawElementsBlackCount === 1 && !window._blackScreenGlobalMessagesPrinted.first) ||
                  (window._drawElementsBlackCount === 3 && !window._blackScreenGlobalMessagesPrinted.threshold)) {
                console.log('========================================');
                console.log('[BLACKSCREEN] drawElements - Center pixel is BLACK!');
              }
              
              // 只在首次检测时打印完整诊断信息（全局只打印一次）
              if (window._drawElementsBlackCount === 1 && !window._blackScreenGlobalMessagesPrinted.first) {
                console.log('[BLACKSCREEN] 连续黑屏次数:', window._drawElementsBlackCount);
                console.log('[BLACKSCREEN] 可能的原因:');
                possibleCauses.forEach(cause => console.log('  ' + cause));
                // 简化诊断信息，只输出关键字段（单行格式，更简洁）
                const simplifiedDiagnostics = {
                  pixel: diagnostics.pixel,
                  hasProgram: diagnostics.hasProgram,
                  hasBuffers: diagnostics.hasElementBuffer && diagnostics.hasArrayBuffer,
                  viewport: `[${diagnostics.viewport[0]},${diagnostics.viewport[1]},${diagnostics.viewport[2]},${diagnostics.viewport[3]}]`,
                  depthTest: diagnostics.depthTest.enabled,
                  scissorTest: diagnostics.scissorTest.enabled,
                  cullFace: diagnostics.cullFace.enabled
                };
                console.log('[BLACKSCREEN] 诊断:', JSON.stringify(simplifiedDiagnostics));
                window._blackScreenGlobalMessagesPrinted.first = true;
                window._blackScreenGlobalMessagesPrinted.detailed = true;
              }
              
              // 只在达到阈值时打印（全局只打印一次，不重复"可能的原因"）
              if (window._drawElementsBlackCount === 3 && !window._blackScreenGlobalMessagesPrinted.threshold) {
                console.log('[BLACKSCREEN] 连续黑屏次数:', window._drawElementsBlackCount);
                window._blackScreenGlobalMessagesPrinted.threshold = true;
              }
              
              // 只在自动修复时打印（全局只打印一次，简化输出）
              if (hasAutoFix && !window._blackScreenGlobalMessagesPrinted.autoFix) {
                const fixes = [];
                if (diagnostics.autoFix.disabledDepthTest) fixes.push('深度测试');
                if (diagnostics.autoFix.disabledScissorTest) fixes.push('裁剪测试');
                if (diagnostics.autoFix.enabledColorMask) fixes.push('颜色写入');
                console.log('[BLACKSCREEN] 已尝试自动修复: 禁用 ' + fixes.join(', '));
                window._blackScreenGlobalMessagesPrinted.autoFix = true;
              }
              
              // 只在首次和阈值时打印结束分隔线
              if ((window._drawElementsBlackCount === 1 && window._blackScreenGlobalMessagesPrinted.first) ||
                  (window._drawElementsBlackCount === 3 && window._blackScreenGlobalMessagesPrinted.threshold)) {
                console.log('========================================');
              }
            }
            // 非关键节点完全不打印，避免刷屏
            
            if (window.debugLog) {
              window.debugLog.warn('BLACKSCREEN', 'drawElements center pixel is BLACK!', diagnostics);
            }
          }
        } catch (e) {
          warn('[GLES2] drawElements - failed to read pixel:', e);
          if (window.debugLog) {
            window.debugLog.error('WEBGL', 'drawElements - failed to read pixel', e);
          }
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_enable: function(lib, ptr, flag) {
      // 如果启用CULL_FACE且之前检测到黑屏，记录警告
      if (flag === ptr.gl.CULL_FACE && window._drawElementsBlackCount && window._drawElementsBlackCount >= 3) {
        // 只在首次检测时打印（使用标志确保只输出一次）
        if (!window._enableCullFaceAfterBlackScreenMessagePrinted) {
          console.log('[GLES2] WARNING: Enabling CULL_FACE after black screen detected. This may cause issues.');
          window._enableCullFaceAfterBlackScreenMessagePrinted = true;
        }
        if (window.debugLog) {
          window.debugLog.warn('BLACKSCREEN', 'CULL_FACE being enabled after black screen', {
            blackCount: window._drawElementsBlackCount
          });
        }
      }
      ptr.gl.enable(flag);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_enableVertexAttribArray: function(lib, ptr, loc) {
      ptr.gl.enableVertexAttribArray(loc);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_finish: function(lib, ptr) {
      if (!ptr || !ptr.gl) {
        warnOnce('finish-null', '[GLES2] finish - ptr or gl is null');
        return;
      }
      try {
        ptr.gl.finish();
        // Check for GL errors after finish
        const error = ptr.gl.getError();
        if (error !== ptr.gl.NO_ERROR) {
          warnOnce('finish-error', '[GLES2] GL error after finish:', error);
        }
      } catch (e) {
        errorOnce('finish-exception', '[GLES2] finish exception:', e);
      }
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
      if (!ptr || !ptr.gl) {
        warnOnce('readPixels-null', '[GLES2] readPixels - ptr or gl is null');
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'readPixels - ptr or gl is null');
        }
        return;
      }
      const gl = ptr.gl;
      try {
        // Validate dimensions
        if (width <= 0 || height <= 0 || x < 0 || y < 0) {
          warnOnce('readPixels-dim', '[GLES2] readPixels - invalid dimensions. x:', x, 'y:', y, 'w:', width, 'h:', height);
          if (window.debugLog) {
            window.debugLog.error('WEBGL', 'readPixels - invalid dimensions', { x, y, width, height });
          }
          return;
        }
        
        const expectedSize = width * height * 4; // RGBA = 4 bytes per pixel
        const actualSize = int8pixels ? int8pixels.byteLength : 0;
        
        if (!int8pixels || actualSize < expectedSize) {
          warnOnce('readPixels-buf', '[GLES2] readPixels - buffer size mismatch. Expected:', expectedSize, 'Got:', actualSize);
          if (window.debugLog) {
            window.debugLog.error('WEBGL', 'readPixels - buffer size mismatch', { expectedSize, actualSize });
          }
          return;
        }
        
        // Ensure we're reading from valid coordinates within canvas bounds
        const canvasWidth = gl.canvas.width || 0;
        const canvasHeight = gl.canvas.height || 0;
        if (x + width > canvasWidth || y + height > canvasHeight) {
          warnOnce('readPixels-bounds', '[GLES2] readPixels - coordinates out of bounds');
          if (window.debugLog) {
            window.debugLog.warn('WEBGL', 'readPixels - coordinates out of bounds', {
              x, y, width, height,
              canvasSize: `${canvasWidth}x${canvasHeight}`
            });
          }
          // Clamp to valid range
          width = Math.min(width, canvasWidth - x);
          height = Math.min(height, canvasHeight - y);
          if (width <= 0 || height <= 0) {
            return;
          }
        }
        
        if (window.debugLog && (!window._readPixelsLogThrottle || Date.now() - window._readPixelsLogThrottle > 1000)) {
          window.debugLog.debug('SWAPBUFFERS', 'readPixels called', {
            x, y, width, height,
            canvasSize: `${canvasWidth}x${canvasHeight}`,
            bufferSize: actualSize
          });
          window._readPixelsLogThrottle = Date.now();
        }
        
        const pixels = new Uint8Array(int8pixels.buffer, int8pixels.byteOffset, int8pixels.byteLength);
        gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
        
        // 检查中心像素是否为黑色
        if (window.debugLog && width > 0 && height > 0) {
          const centerX = Math.floor(width / 2);
          const centerY = Math.floor(height / 2);
          const centerIdx = (centerY * width + centerX) * 4;
          if (centerIdx + 3 < pixels.length) {
            const r = pixels[centerIdx];
            const g = pixels[centerIdx + 1];
            const b = pixels[centerIdx + 2];
            const a = pixels[centerIdx + 3];
            
            if (r === 0 && g === 0 && b === 0 && a === 255) {
              window.debugLog.warn('BLACKSCREEN', 'readPixels center pixel is BLACK!', {
                position: { x: x + centerX, y: y + centerY },
                pixel: { r, g, b, a },
                size: `${width}x${height}`
              });
            } else if (r > 0 || g > 0 || b > 0) {
              // 只在非黑色时记录（节流）
              if (!window._readPixelsNonBlackLogThrottle || Date.now() - window._readPixelsNonBlackLogThrottle > 5000) {
                window.debugLog.info('SWAPBUFFERS', 'readPixels center pixel is NOT black', {
                  position: { x: x + centerX, y: y + centerY },
                  pixel: { r, g, b, a }
                });
                window._readPixelsNonBlackLogThrottle = Date.now();
              }
            }
          }
        }
        
        const error = gl.getError();
        if (error !== gl.NO_ERROR) {
          warnOnce('readPixels-error', '[GLES2] readPixels error:', error);
          if (window.debugLog) {
            window.debugLog.error('WEBGL', 'readPixels error', { error });
          }
        }
      } catch (e) {
        errorOnce('readPixels-exception', '[GLES2] readPixels exception:', e);
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'readPixels exception', e);
        }
      }
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_scissor: function(lib, ptr, x, y, width, height) {
      ptr.gl.scissor(x, y, width, height);
    },

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_viewport: function(lib, ptr, x, y, width, height) {
      if (!ptr || !ptr.gl) {
        warnOnce('viewport-null', '[GLES2] viewport - ptr or gl is null');
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'viewport - ptr or gl is null');
        }
        return;
      }
      if (width <= 0 || height <= 0) {
        warnOnce('viewport-dim', '[GLES2] viewport - invalid dimensions:', width, 'x', height);
        if (window.debugLog) {
          window.debugLog.error('WEBGL', 'viewport - invalid dimensions', { x, y, width, height });
        }
        return;
      }
      try {
        // Reduce log spam - only log if DEBUG is enabled
        if (DEBUG) {
          console.log('[GLES2] viewport set:', x, y, width, height, 'canvas size:', ptr.gl.canvas.width, 'x', ptr.gl.canvas.height);
        }
        ptr.gl.viewport(x, y, width, height);
        const error = ptr.gl.getError();
        if (error !== ptr.gl.NO_ERROR) {
          warnOnce('viewport-error', '[GLES2] GL error after viewport:', error);
        }
      } catch (e) {
        errorOnce('viewport-exception', '[GLES2] viewport exception:', e);
      }
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

    // Note: finish is already defined above, this is a duplicate - removed
  };

  // Store the GL context globally for access by other parts of the system
  window.GLES2Context = null;
  
  // 全局诊断工具函数
  window.diagnose3DBlackScreen = function() {
    const gl = window.GLES2Context?.gl;
    if (!gl) {
      // 只在首次检测时打印（使用标志确保只输出一次）
      if (!window._webglContextNotFoundMessagePrinted) {
        console.log('❌ WebGL context not found!');
        window._webglContextNotFoundMessagePrinted = true;
      }
      return null;
    }
    
    const diagnostics = {
      webglContext: '✅ Found',
      viewport: gl.getParameter(gl.VIEWPORT),
      currentProgram: gl.getParameter(gl.CURRENT_PROGRAM),
      cullFace: {
        enabled: gl.isEnabled(gl.CULL_FACE),
        mode: gl.getParameter(gl.CULL_FACE_MODE),
        frontFace: gl.getParameter(gl.FRONT_FACE)
      },
      depthTest: {
        enabled: gl.isEnabled(gl.DEPTH_TEST),
        func: gl.getParameter(gl.DEPTH_FUNC),
        mask: gl.getParameter(gl.DEPTH_WRITEMASK)
      },
      colorMask: gl.getParameter(gl.COLOR_WRITEMASK),
      blend: {
        enabled: gl.isEnabled(gl.BLEND),
        src: gl.getParameter(gl.BLEND_SRC),
        dst: gl.getParameter(gl.BLEND_DST)
      },
      scissorTest: {
        enabled: gl.isEnabled(gl.SCISSOR_TEST),
        box: gl.getParameter(gl.SCISSOR_BOX)
      },
      elementBuffer: !!gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
      arrayBuffer: !!gl.getParameter(gl.ARRAY_BUFFER_BINDING),
      textures: []
    };
    
    // 检查纹理绑定
    for (let i = 0; i < 4; i++) {
      gl.activeTexture(gl.TEXTURE0 + i);
      const texture = gl.getParameter(gl.TEXTURE_BINDING_2D);
      diagnostics.textures.push({
        unit: i,
        bound: !!texture
      });
    }
    
    // 读取中心像素
    const viewport = diagnostics.viewport;
    if (viewport[2] > 0 && viewport[3] > 0) {
      const pixel = new Uint8Array(4);
      const centerX = Math.floor(viewport[2] / 2);
      const centerY = Math.floor(viewport[3] / 2);
      gl.readPixels(centerX, centerY, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixel);
      diagnostics.centerPixel = {
        r: pixel[0],
        g: pixel[1],
        b: pixel[2],
        a: pixel[3],
        isBlack: pixel[0] === 0 && pixel[1] === 0 && pixel[2] === 0 && pixel[3] === 255
      };
    }
    
    // 检查程序状态
    if (diagnostics.currentProgram) {
      diagnostics.program = {
        linkStatus: gl.getProgramParameter(diagnostics.currentProgram, gl.LINK_STATUS),
        infoLog: gl.getProgramInfoLog(diagnostics.currentProgram) || null
      };
    }
    
    // 只在首次诊断时输出（使用全局标志）
    if (!window._blackScreenGlobalMessagesPrinted || !window._blackScreenGlobalMessagesPrinted.diagnoseOutput) {
      // 简化诊断输出，只显示关键信息
      const simplifiedDiagnostics = {
        viewport: diagnostics.viewport,
        hasProgram: !!diagnostics.currentProgram,
        programValid: diagnostics.program ? diagnostics.program.linkStatus : false,
        cullFace: diagnostics.cullFace,
        depthTest: diagnostics.depthTest,
        scissorTest: diagnostics.scissorTest,
        colorMask: diagnostics.colorMask,
        hasBuffers: diagnostics.elementBuffer || diagnostics.arrayBuffer,
        centerPixel: diagnostics.centerPixel
      };
      
      console.log('========================================');
      console.log('3D Black Screen Diagnostics');
      console.log('========================================');
      console.log(JSON.stringify(simplifiedDiagnostics, null, 2));
      console.log('========================================');
      
      // 检查常见问题
      const issues = [];
      if (!diagnostics.currentProgram) {
        issues.push('❌ No shader program bound!');
      } else if (!diagnostics.program.linkStatus) {
        issues.push('❌ Shader program link failed!');
      }
      if (diagnostics.cullFace.enabled) {
        issues.push('⚠️ CULL_FACE is enabled - may cause black screen if vertex order is wrong');
      }
      if (diagnostics.viewport[2] === 0 || diagnostics.viewport[3] === 0) {
        issues.push('❌ Invalid viewport size!');
      }
      if (!diagnostics.elementBuffer && !diagnostics.arrayBuffer) {
        issues.push('⚠️ No buffers bound!');
      }
      if (diagnostics.centerPixel && diagnostics.centerPixel.isBlack) {
        issues.push('❌ Center pixel is BLACK (0,0,0,255)!');
      }
      
      if (issues.length > 0) {
        console.log('Detected Issues:');
        issues.forEach(issue => console.log(issue));
      } else {
        console.log('✅ No obvious issues detected');
      }
      
      if (!window._blackScreenGlobalMessagesPrinted) {
        window._blackScreenGlobalMessagesPrinted = {};
      }
      window._blackScreenGlobalMessagesPrinted.diagnoseOutput = true;
    }
    
    return diagnostics;
  };
  
  // 自动修复函数
  window.autoFix3DBlackScreen = function() {
    const gl = window.GLES2Context?.gl;
    if (!gl) {
      // 只在首次检测时打印（使用标志确保只输出一次）
      if (!window._autoFixWebglContextNotFoundMessagePrinted) {
        console.log('❌ WebGL context not found!');
        window._autoFixWebglContextNotFoundMessagePrinted = true;
      }
      return false;
    }
    
    // 只在首次自动修复时打印（使用全局标志）
    if (!window._blackScreenGlobalMessagesPrinted || !window._blackScreenGlobalMessagesPrinted.autoFixRun) {
      console.log('Attempting auto-fix for 3D black screen...');
      if (!window._blackScreenGlobalMessagesPrinted) {
        window._blackScreenGlobalMessagesPrinted = {};
      }
      window._blackScreenGlobalMessagesPrinted.autoFixRun = true;
    }
    
    let fixed = false;
    const fixes = [];
    
    // 修复1: 禁用面剔除
    if (gl.isEnabled(gl.CULL_FACE)) {
      gl.disable(gl.CULL_FACE);
      fixes.push('禁用 CULL_FACE');
      fixed = true;
    }
    
    // 修复2: 检查视口
    const viewport = gl.getParameter(gl.VIEWPORT);
    if (viewport[2] === 0 || viewport[3] === 0) {
      // 视口无效，无法修复（已在其他地方打印）
    }
    
    // 修复3: 检查颜色掩码
    const colorMask = gl.getParameter(gl.COLOR_WRITEMASK);
    if (!colorMask[0] || !colorMask[1] || !colorMask[2]) {
      gl.colorMask(true, true, true, true);
      fixes.push('启用所有颜色通道');
      fixed = true;
    }
    
    // 只在首次自动修复时打印结果（使用全局标志）
    if (!window._blackScreenGlobalMessagesPrinted || !window._blackScreenGlobalMessagesPrinted.autoFixResult) {
      if (fixed) {
        console.log('✅ Auto-fix applied:', fixes.join(', '));
      } else {
        console.log('ℹ️ No auto-fixes needed or available.');
      }
      if (!window._blackScreenGlobalMessagesPrinted) {
        window._blackScreenGlobalMessagesPrinted = {};
      }
      window._blackScreenGlobalMessagesPrinted.autoFixResult = true;
    }
    
    return fixed;
  };

  // Global object storage for WebGL objects (programs, textures, buffers, etc.)
  // Maps from object ID or address to actual WebGL object
  window.GLES2Objects = new Map();
  var nextObjectId = 1;

  function storeGLObject(obj, addr) {
    if (!obj) return null;
    const id = nextObjectId++;
    window.GLES2Objects.set(id, obj);
    // Also store reverse mapping if obj is an object
    if (typeof obj === 'object') {
      obj._gles2Id = id;
    }
    // If an address is provided, also store in J2ME.NativeMap
    if (addr && typeof J2ME !== 'undefined' && J2ME.NativeMap) {
      J2ME.NativeMap.set(addr, obj);
    }
    return id;
  }

  function getGLObject(idOrObj, expectedType) {
    if (idOrObj === null || idOrObj === undefined || idOrObj === 0) return null;
    // If it's already a WebGL object (has WebGL internal type), return it
    if (typeof idOrObj === 'object' && idOrObj !== null) {
      // Check if it's a WebGL object type
      if (idOrObj instanceof WebGLProgram || idOrObj instanceof WebGLBuffer ||
          idOrObj instanceof WebGLTexture || idOrObj instanceof WebGLUniformLocation ||
          idOrObj instanceof WebGLVertexArrayObject || idOrObj._gles2Id) {
        return idOrObj;
      }
    }
    // Try J2ME.NativeMap first (this is the standard way J2ME stores native objects)
    if (typeof J2ME !== 'undefined' && J2ME.NativeMap && J2ME.NativeMap.has(idOrObj)) {
      const obj = J2ME.NativeMap.get(idOrObj);
      if (obj) return obj;
    }
    // Try NativeMap global (alias)
    if (typeof NativeMap !== 'undefined' && NativeMap.has && NativeMap.has(idOrObj)) {
      const obj = NativeMap.get(idOrObj);
      if (obj) return obj;
    }
    // Try type-specific maps based on expected type
    if (expectedType === 'uniform' && window.GLES2UniformByAddr && window.GLES2UniformByAddr.has(idOrObj)) {
      return window.GLES2UniformByAddr.get(idOrObj);
    }
    if (expectedType === 'buffer' && window.GLES2BufferByAddr && window.GLES2BufferByAddr.has(idOrObj)) {
      return window.GLES2BufferByAddr.get(idOrObj);
    }
    if (expectedType === 'texture' && window.GLES2TextureByAddr && window.GLES2TextureByAddr.has(idOrObj)) {
      return window.GLES2TextureByAddr.get(idOrObj);
    }
    if (expectedType === 'program' && window.GLES2ProgramByAddr && window.GLES2ProgramByAddr.has(idOrObj)) {
      return window.GLES2ProgramByAddr.get(idOrObj);
    }
    // Try all type-specific maps as fallback
    if (window.GLES2UniformByAddr && window.GLES2UniformByAddr.has(idOrObj)) {
      return window.GLES2UniformByAddr.get(idOrObj);
    }
    if (window.GLES2BufferByAddr && window.GLES2BufferByAddr.has(idOrObj)) {
      return window.GLES2BufferByAddr.get(idOrObj);
    }
    if (window.GLES2TextureByAddr && window.GLES2TextureByAddr.has(idOrObj)) {
      return window.GLES2TextureByAddr.get(idOrObj);
    }
    if (window.GLES2ProgramByAddr && window.GLES2ProgramByAddr.has(idOrObj)) {
      return window.GLES2ProgramByAddr.get(idOrObj);
    }
    // Try to get from our map
    if (window.GLES2Objects.has(idOrObj)) {
      return window.GLES2Objects.get(idOrObj);
    }
    // Try getNative if available (for objects stored via setNative)
    if (typeof getNative === 'function') {
      const native = getNative(idOrObj);
      if (native) return native;
    }
    return null; // Return null instead of the raw id
  }

  // Register native methods to the global Native object when it becomes available
  function registerGLES2Natives() {
    if (typeof Native === 'undefined') {
      log('[libgles2.js] Native object not ready, waiting...');
      setTimeout(registerGLES2Natives, 100);
      return;
    }

    log('[libgles2.js] Registering GLES2 native methods to Native object...');
    
    // Map from internal names to JNI-style signatures
    const methodMappings = {
      '_create': { sig: '.(Z)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2__1create' },
      'getCanvas': { sig: '.(Ljava/lang/Object;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_getCanvas' },
      'destroy': { sig: '.(Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_destroy' },
      'setSurface': { sig: '.(Ljava/lang/Object;II)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_setSurface' },
      'checkGLError': { sig: '.(Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_checkGLError' },
      'createProgram': { sig: '.(Ljava/lang/Object;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_createProgram' },
      'useProgram': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_useProgram' },
      'deleteProgram': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteProgram' },
      'getAttribLocation': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)I', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_getAttribLocation' },
      'getUniformLocation': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_getUniformLocation' },
      'vertexAttribPointer': { sig: '.(Ljava/lang/Object;IIIZII)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttribPointer' },
      'vertexAttrib2f': { sig: '.(Ljava/lang/Object;IFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib2f' },
      'vertexAttrib3f': { sig: '.(Ljava/lang/Object;IFFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib3f' },
      'vertexAttrib4f': { sig: '.(Ljava/lang/Object;IFFFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_vertexAttrib4f' },
      'uniform1i': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1i' },
      'uniform1f': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform1f' },
      'uniform2f': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;FF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform2f' },
      'uniform3f': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;FFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3f' },
      'uniform4f': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;FFFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4f' },
      'uniform3fv': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;[F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform3fv' },
      'uniform4fv': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;[F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniform4fv' },
      'uniformMatrix3fv': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;Z[F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix3fv' },
      'uniformMatrix4fv': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;Z[F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_uniformMatrix4fv' },
      'createBuffer': { sig: '.(Ljava/lang/Object;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_createBuffer' },
      'deleteBuffers': { sig: '.(Ljava/lang/Object;[Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteBuffers' },
      'bindBuffer': { sig: '.(Ljava/lang/Object;ILjava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindBuffer' },
      'bufferData': { sig: '.(Ljava/lang/Object;III)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferData' },
      'bufferSubData_byte': { sig: '.(Ljava/lang/Object;III[B)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData' },
      'bufferSubData_short': { sig: '.(Ljava/lang/Object;III[S)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData' },
      'bufferSubData_float': { sig: '.(Ljava/lang/Object;III[F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData' },
      'bufferSubData_int': { sig: '.(Ljava/lang/Object;III[I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData' },
      'createTexture': { sig: '.(Ljava/lang/Object;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_createTexture' },
      'deleteTexture': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_deleteTexture' },
      'activeTexture': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_activeTexture' },
      'bindTexture': { sig: '.(Ljava/lang/Object;ILjava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindTexture' },
      'texParameterf': { sig: '.(Ljava/lang/Object;IIF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameterf' },
      'texParameteri': { sig: '.(Ljava/lang/Object;III)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_texParameteri' },
      // texImage2D is registered separately with byte array conversion
      'texImage2DFromHandle': { sig: '.(Ljava/lang/Object;IIIIIIILjava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2DFromHandle' },
      'generateMipmap': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_generateMipmap' },
      'clear': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_clear' },
      'clearColor': { sig: '.(Ljava/lang/Object;FFFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearColor' },
      'clearDepthf': { sig: '.(Ljava/lang/Object;F)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_clearDepthf' },
      'colorMask': { sig: '.(Ljava/lang/Object;ZZZZ)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_colorMask' },
      'cullFace': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_cullFace' },
      'depthFunc': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthFunc' },
      'depthMask': { sig: '.(Ljava/lang/Object;Z)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthMask' },
      'depthRange': { sig: '.(Ljava/lang/Object;FF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_depthRange' },
      'disable': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_disable' },
      'disableVertexAttribArray': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_disableVertexAttribArray' },
      'drawArrays': { sig: '.(Ljava/lang/Object;III)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawArrays' },
      'drawElements': { sig: '.(Ljava/lang/Object;IIII)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_drawElements' },
      'enable': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_enable' },
      'enableVertexAttribArray': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_enableVertexAttribArray' },
      'finish': { sig: '.(Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_finish' },
      'frontFace': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_frontFace' },
      'pixelStorei': { sig: '.(Ljava/lang/Object;II)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_pixelStorei' },
      'polygonOffset': { sig: '.(Ljava/lang/Object;FF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_polygonOffset' },
      'readPixels': { sig: '.(Ljava/lang/Object;IIII[B)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_readPixels' },
      'scissor': { sig: '.(Ljava/lang/Object;IIII)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_scissor' },
      'viewport': { sig: '.(Ljava/lang/Object;IIII)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_viewport' },
      'blendColor': { sig: '.(Ljava/lang/Object;FFFF)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendColor' },
      'blendEquation': { sig: '.(Ljava/lang/Object;I)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendEquation' },
      'blendFunc': { sig: '.(Ljava/lang/Object;II)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFunc' },
      'blendFuncSeparate': { sig: '.(Ljava/lang/Object;IIII)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_blendFuncSeparate' },
      'isTexture': { sig: '.(Ljava/lang/Object;I)Z', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_isTexture' },
      'toggleAnisotropy': { sig: '.(Ljava/lang/Object;Z)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_toggleAnisotropy' },
      'createVertexArray': { sig: '.(Ljava/lang/Object;)Ljava/lang/Object;', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_createVertexArray' },
      'bindVertexArray': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_bindVertexArray' },
      'blitToContext': { sig: '.(Ljava/lang/Object;Ljava/lang/Object;IIIIIIZZ)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_blitToContext' },
    };

    const basePath = 'pl/zb3/freej2me/bridge/gles2/GLES2';
    
    // Helper to get native object from address
    function getObj(addr) {
      if (addr === 0 || addr === null || addr === undefined) return null;
      if (typeof getNative === 'function') {
        return getNative(addr);
      }
      // Fallback: use global GLES2 context
      return window.GLES2Context;
    }
    
    // Helper to set native object for address  
    function setObj(addr, obj) {
      if (typeof setNative === 'function') {
        setNative(addr, obj);
      }
    }

    // Helper to convert Java String address to JavaScript string
    function toStr(strAddr) {
      if (strAddr === 0 || strAddr === null || strAddr === undefined) return null;
      if (typeof strAddr === 'string') return strAddr;
      if (typeof J2ME !== 'undefined' && J2ME.fromStringAddr) {
        return J2ME.fromStringAddr(strAddr);
      }
      return String(strAddr);
    }

    // Helper to convert Java array address to JavaScript typed array
    function toArray(arrAddr, type) {
      if (arrAddr === 0 || arrAddr === null || arrAddr === undefined) return null;
      // If it's already a TypedArray, return it directly
      if (ArrayBuffer.isView(arrAddr)) return arrAddr;
      // If it's a plain array, convert it
      if (Array.isArray(arrAddr)) {
        if (type === 'float' || type === 'F') return new Float32Array(arrAddr);
        if (type === 'int' || type === 'I') return new Int32Array(arrAddr);
        if (type === 'short' || type === 'S') return new Int16Array(arrAddr);
        if (type === 'byte' || type === 'B') return new Int8Array(arrAddr);
        return arrAddr;
      }
      // Try J2ME.getArrayFromAddr - this should return a TypedArray directly
      if (typeof J2ME !== 'undefined' && J2ME.getArrayFromAddr) {
        const arr = J2ME.getArrayFromAddr(arrAddr);
        if (arr) {
          // J2ME.getArrayFromAddr already returns proper TypedArray
          // (Int8Array for byte[], Int16Array for short[], etc.)
          return arr;
        }
      }
      return arrAddr;
    }

    // Register _create specially - it returns an object
    Native[basePath + '._create.(Z)Ljava/lang/Object;'] = function(addr, antialias) {
      log('[GLES2] Native _create called, addr:', addr);
      const handle = GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2__1create(null, antialias);
      // Store globally as fallback
      window.GLES2Context = handle;
      window.currentGLES2Handle = handle;
      // Store in NativeMap if address is provided and J2ME is available
      if (addr && typeof J2ME !== 'undefined' && J2ME.NativeMap) {
        J2ME.NativeMap.set(addr, handle);
      }
      // Return allocated Java object address
      return allocAndStoreNative(handle, 'context');
    };
    log('[libgles2.js] Registered: _create');

    // Helper to allocate J2ME object and store native
    function allocAndStoreNative(jsObject, objectType) {
      if (!jsObject) return J2ME.Constants ? J2ME.Constants.NULL : 0;
      
      // Try to allocate a Java object address and store the native object
      if (typeof J2ME !== 'undefined' && J2ME.allocObject && typeof CLASSES !== 'undefined' && CLASSES.java_lang_Object) {
        try {
          const objAddr = J2ME.allocObject(CLASSES.java_lang_Object);
          if (typeof setNative === 'function') {
            setNative(objAddr, jsObject);
          } else if (J2ME.setNative) {
            J2ME.setNative(objAddr, jsObject);
          }
          
          // Also store in type-specific maps for fallback lookup
          if (objectType === 'uniform') {
            window.GLES2UniformByAddr.set(objAddr, jsObject);
          } else if (objectType === 'buffer') {
            window.GLES2BufferByAddr.set(objAddr, jsObject);
          } else if (objectType === 'texture') {
            window.GLES2TextureByAddr.set(objAddr, jsObject);
          } else if (objectType === 'program') {
            window.GLES2ProgramByAddr.set(objAddr, jsObject);
          }
          
          log('[GLES2] allocAndStoreNative - allocated addr:', objAddr, 'type:', objectType, 'for:', jsObject);
          return objAddr;
        } catch (e) {
          warnOnce('allocAndStoreNative', '[GLES2] allocAndStoreNative failed:', e);
        }
      }
      // Fallback: return the object directly and hope J2ME handles it
      return jsObject;
    }

    // Register methods with String parameters specially
    // createProgram takes two String parameters - returns stored ID
    Native[basePath + '.createProgram.(Ljava/lang/Object;Ljava/lang/String;Ljava/lang/String;)Ljava/lang/Object;'] = function(addr, handleAddr, vertexSrcAddr, fragmentSrcAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const vertexSrc = toStr(vertexSrcAddr);
      const fragmentSrc = toStr(fragmentSrcAddr);
      log('[GLES2] createProgram - vertex shader length:', vertexSrc ? vertexSrc.length : 0);
      log('[GLES2] createProgram - fragment shader length:', fragmentSrc ? fragmentSrc.length : 0);
      const program = GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_createProgram(null, ptr, vertexSrc, fragmentSrc);
      // Store program for later retrieval
      const progId = storeGLObject(program, null);
      // Also store as "last program" for fallback
      window.GLES2LastProgram = program;
      window.GLES2CurrentProgram = program;
      // Store in GLES2Programs map for address-based lookup
      if (!window.GLES2Programs) window.GLES2Programs = new Map();
      log('[GLES2] createProgram - stored as ID:', progId, 'program:', program);
      // Allocate Java object and store native
      return allocAndStoreNative(program, 'program');
    };
    log('[libgles2.js] Registered: createProgram (with string conversion)');

    // getAttribLocation takes a String parameter
    Native[basePath + '.getAttribLocation.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)I'] = function(addr, handleAddr, programAddr, nameAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const name = toStr(nameAddr);
      // Try multiple ways to get the program
      let program = getGLObject(programAddr, 'program');
      log('[GLES2] getAttribLocation - programAddr:', programAddr, 'typeof:', typeof programAddr, 'program:', program, 'name:', name);
      
      // If program is null, try to get the current or last created program
      if (!program) {
        program = window.GLES2CurrentProgram || window.GLES2LastProgram;
        if (program) {
          log('[GLES2] getAttribLocation - using current/last program as fallback');
        }
      }
      
      if (!program) {
        errorOnce('getAttribLocation-noprogram', '[GLES2] getAttribLocation - no program available!');
        return -1;
      }
      
      return GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_getAttribLocation(null, ptr, program, name);
    };
    log('[libgles2.js] Registered: getAttribLocation (with string conversion)');

    // getUniformLocation takes a String parameter - returns stored ID
    Native[basePath + '.getUniformLocation.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/Object;'] = function(addr, handleAddr, programAddr, nameAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const name = toStr(nameAddr);
      // Try to get program, fallback to current/last program
      let program = getGLObject(programAddr);
      log('[GLES2] getUniformLocation - programAddr:', programAddr, 'program:', program, 'name:', name);
      if (!program) {
        program = window.GLES2CurrentProgram || window.GLES2LastProgram;
        if (program) {
          log('[GLES2] getUniformLocation - using current/last program as fallback');
        }
      }
      if (!program) {
        errorOnce('getUniformLocation-noprogram', '[GLES2] getUniformLocation - no program available!');
        return J2ME.Constants ? J2ME.Constants.NULL : 0;
      }
      const loc = GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_getUniformLocation(null, ptr, program, name);
      // Store location for later retrieval
      if (loc) {
        storeGLObject(loc, null);
        // Store uniform location by name for fallback (keyed by program+name)
        if (!window.GLES2Uniforms) window.GLES2Uniforms = new Map();
        window.GLES2Uniforms.set(name, loc);
        // Also store per-program uniforms
        if (!program._uniforms) program._uniforms = new Map();
        program._uniforms.set(name, loc);
        log('[GLES2] getUniformLocation - stored:', name, loc);
      }
      // Allocate Java object and store native for proper reference tracking
      return allocAndStoreNative(loc, 'uniform');
    };
    log('[libgles2.js] Registered: getUniformLocation (with string conversion)');

    // Register methods that take handle as first arg and use the global context
    const handleMethods = [
      { name: 'getCanvas', sig: '.(Ljava/lang/Object;)Ljava/lang/Object;' },
      { name: 'destroy', sig: '.(Ljava/lang/Object;)V' },
      { name: 'setSurface', sig: '.(Ljava/lang/Object;II)V' },
      { name: 'checkGLError', sig: '.(Ljava/lang/Object;)V' },
      // createProgram, getAttribLocation, getUniformLocation are registered above with string conversion
      { name: 'useProgram', sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V' },
      { name: 'deleteProgram', sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V' },
      { name: 'vertexAttribPointer', sig: '.(Ljava/lang/Object;IIIZII)V' },
      { name: 'vertexAttrib2f', sig: '.(Ljava/lang/Object;IFF)V' },
      { name: 'vertexAttrib3f', sig: '.(Ljava/lang/Object;IFFF)V' },
      { name: 'vertexAttrib4f', sig: '.(Ljava/lang/Object;IFFFF)V' },
      { name: 'uniform1i', sig: '.(Ljava/lang/Object;Ljava/lang/Object;I)V' },
      { name: 'uniform1f', sig: '.(Ljava/lang/Object;Ljava/lang/Object;F)V' },
      { name: 'uniform2f', sig: '.(Ljava/lang/Object;Ljava/lang/Object;FF)V' },
      { name: 'uniform3f', sig: '.(Ljava/lang/Object;Ljava/lang/Object;FFF)V' },
      { name: 'uniform4f', sig: '.(Ljava/lang/Object;Ljava/lang/Object;FFFF)V' },
      { name: 'uniform3fv', sig: '.(Ljava/lang/Object;Ljava/lang/Object;[F)V' },
      { name: 'uniform4fv', sig: '.(Ljava/lang/Object;Ljava/lang/Object;[F)V' },
      { name: 'uniformMatrix3fv', sig: '.(Ljava/lang/Object;Ljava/lang/Object;Z[F)V' },
      { name: 'uniformMatrix4fv', sig: '.(Ljava/lang/Object;Ljava/lang/Object;Z[F)V' },
      { name: 'createBuffer', sig: '.(Ljava/lang/Object;)Ljava/lang/Object;' },
      { name: 'deleteBuffers', sig: '.(Ljava/lang/Object;[Ljava/lang/Object;)V' },
      { name: 'bindBuffer', sig: '.(Ljava/lang/Object;ILjava/lang/Object;)V' },
      { name: 'bufferData', sig: '.(Ljava/lang/Object;III)V' },
      { name: 'createTexture', sig: '.(Ljava/lang/Object;)Ljava/lang/Object;' },
      { name: 'deleteTexture', sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V' },
      { name: 'activeTexture', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'bindTexture', sig: '.(Ljava/lang/Object;ILjava/lang/Object;)V' },
      { name: 'texParameterf', sig: '.(Ljava/lang/Object;IIF)V' },
      { name: 'texParameteri', sig: '.(Ljava/lang/Object;III)V' },
      // texImage2D is registered separately above with byte array conversion
      { name: 'texImage2DFromHandle', sig: '.(Ljava/lang/Object;IIIIIIILjava/lang/Object;)V' },
      { name: 'generateMipmap', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'clear', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'clearColor', sig: '.(Ljava/lang/Object;FFFF)V' },
      { name: 'clearDepthf', sig: '.(Ljava/lang/Object;F)V' },
      { name: 'colorMask', sig: '.(Ljava/lang/Object;ZZZZ)V' },
      { name: 'cullFace', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'depthFunc', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'depthMask', sig: '.(Ljava/lang/Object;Z)V' },
      { name: 'depthRange', sig: '.(Ljava/lang/Object;FF)V' },
      { name: 'disable', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'disableVertexAttribArray', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'drawArrays', sig: '.(Ljava/lang/Object;III)V' },
      { name: 'drawElements', sig: '.(Ljava/lang/Object;IIII)V' },
      { name: 'enable', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'enableVertexAttribArray', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'finish', sig: '.(Ljava/lang/Object;)V' },
      { name: 'frontFace', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'pixelStorei', sig: '.(Ljava/lang/Object;II)V' },
      { name: 'polygonOffset', sig: '.(Ljava/lang/Object;FF)V' },
      { name: 'readPixels', sig: '.(Ljava/lang/Object;IIII[B)V' },
      { name: 'scissor', sig: '.(Ljava/lang/Object;IIII)V' },
      { name: 'viewport', sig: '.(Ljava/lang/Object;IIII)V' },
      { name: 'blendColor', sig: '.(Ljava/lang/Object;FFFF)V' },
      { name: 'blendEquation', sig: '.(Ljava/lang/Object;I)V' },
      { name: 'blendFunc', sig: '.(Ljava/lang/Object;II)V' },
      { name: 'blendFuncSeparate', sig: '.(Ljava/lang/Object;IIII)V' },
      { name: 'isTexture', sig: '.(Ljava/lang/Object;I)Z' },
      { name: 'toggleAnisotropy', sig: '.(Ljava/lang/Object;Z)V' },
      { name: 'createVertexArray', sig: '.(Ljava/lang/Object;)Ljava/lang/Object;' },
      { name: 'bindVertexArray', sig: '.(Ljava/lang/Object;Ljava/lang/Object;)V' },
      { name: 'blitToContext', sig: '.(Ljava/lang/Object;Ljava/lang/Object;IIIIIIZZ)V' },
    ];

    // Register texImage2D - needs special handling for byte array parameter
    const texImage2DSig = basePath + '.texImage2D.(Ljava/lang/Object;IIIIIIII[B)V';
    console.log('[libgles2.js] Registering texImage2D:', texImage2DSig);
    Native[texImage2DSig] = function(addr, handleAddr, target, level, intFormat, width, height, border, format, type, byteArrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const byteArray = toArray(byteArrayAddr, 'byte');
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2D(null, ptr, target, level, intFormat, width, height, border, format, type, byteArray);
    };
    console.log('[libgles2.js] texImage2D registered OK');

    // Register bufferSubData variants - need to convert Java arrays
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[B)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'byte');
      log('[GLES2] bufferSubData byte - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[S)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'short');
      log('[GLES2] bufferSubData short - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[F)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'float');
      log('[GLES2] bufferSubData float - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[I)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'int');
      log('[GLES2] bufferSubData int - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    log('[libgles2.js] Registered bufferSubData variants');

    // Methods that need special handling for Object parameters (programs, uniforms, etc.)
    const objectArgMethods = new Set([
      'useProgram', 'deleteProgram', // program objects
      'uniform1i', 'uniform1f', 'uniform2f', 'uniform3f', 'uniform4f', // uniform locations
      'uniform3fv', 'uniform4fv', 'uniformMatrix3fv', 'uniformMatrix4fv',
      'bindBuffer', 'deleteBuffers', // buffer objects  
      'bindTexture', 'deleteTexture', // texture objects
      'texImage2DFromHandle', // texture source handle
      'bindVertexArray', // VAO objects
      'blitToContext', // context handle
      'createBuffer', 'createTexture', 'createVertexArray', // creation methods that return objects
    ]);
    
    // Track current bound objects for proper binding
    window.GLES2BoundBuffers = new Map(); // type -> buffer
    window.GLES2BoundTextures = new Map(); // unit+target -> texture
    
    // Track uniform locations by address for proper lookup
    window.GLES2UniformByAddr = new Map(); // addr -> WebGLUniformLocation
    // Track buffers by address
    window.GLES2BufferByAddr = new Map(); // addr -> WebGLBuffer
    // Track textures by address
    window.GLES2TextureByAddr = new Map(); // addr -> WebGLTexture
    // Track programs by address
    window.GLES2ProgramByAddr = new Map(); // addr -> WebGLProgram

    // Register all handle methods using global GLES2Context
    log('[libgles2.js] Registering handle methods, count:', handleMethods.length);
    for (const method of handleMethods) {
      const fnName = 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_' + method.name;
      const implFn = GLES2NativeMethods[fnName];
      if (implFn) {
        const fullSig = basePath + '.' + method.name + method.sig;
        if (method.name === 'texImage2D') {
          log('[libgles2.js] Registering texImage2D - sig:', method.sig, 'fullSig:', fullSig);
        }
        const needsObjectConversion = objectArgMethods.has(method.name);
        
        Native[fullSig] = function(addr, handleAddr, ...args) {
          // Use global context since handle passing doesn't work correctly
          const ptr = getObj(handleAddr) || window.GLES2Context;
          
          // Convert object arguments if needed
          let convertedArgs = args;
          if (needsObjectConversion && args.length > 0) {
            convertedArgs = args.map((arg, i) => {
              // For useProgram/deleteProgram, first arg is program
              if ((method.name === 'useProgram' || method.name === 'deleteProgram') && i === 0) {
                let obj = getGLObject(arg, 'program');
                if (!obj && window.GLES2LastProgram) {
                  log('[GLES2] useProgram - using last program as fallback');
                  obj = window.GLES2LastProgram;
                }
                // Track current program for uniform lookups
                if (method.name === 'useProgram' && obj) {
                  window.GLES2CurrentProgram = obj;
                }
                return obj;
              }
              // For uniform methods, first arg is the location object
              if (method.name.startsWith('uniform') && i === 0) {
                let obj = getGLObject(arg, 'uniform');
                // Fallback: try to find by checking stored uniforms
                if (!obj && arg !== null && arg !== undefined && arg !== 0) {
                  log('[GLES2] ' + method.name + ' - location lookup failed for addr:', arg);
                  // Try to get from current program's uniforms
                  if (window.GLES2CurrentProgram && window.GLES2CurrentProgram._uniforms) {
                    // We can't look up by address without name, but we can try the last uniform
                    log('[GLES2] ' + method.name + ' - current program has uniforms map');
                  }
                }
                return obj;
              }
              // For bindBuffer, first arg (i=0) is buffer type, second (i=1) is buffer object
              if (method.name === 'bindBuffer') {
                if (i === 1) {
                  let obj = getGLObject(arg, 'buffer');
                  const bufferType = convertedArgs[0] || args[0];
                  
                  if (!obj && arg !== 0 && arg !== null) {
                    // Try last buffer as fallback
                    if (window.GLES2LastBuffer) {
                      log('[GLES2] bindBuffer - bufferAddr:', arg, 'not found, using last buffer');
                      obj = window.GLES2LastBuffer;
                    } else if (window.GLES2BoundBuffers && window.GLES2BoundBuffers.has(bufferType)) {
                      // Use currently bound buffer if available
                      log('[GLES2] bindBuffer - bufferAddr:', arg, 'not found, keeping current buffer');
                      obj = window.GLES2BoundBuffers.get(bufferType);
                    }
                  }
                  
                  // Track bound buffer
                  if (obj) {
                    window.GLES2BoundBuffers.set(bufferType, obj);
                  }
                  return obj;
                }
              }
              // For bindTexture, first arg is target, second is texture
              if (method.name === 'bindTexture' && i === 1) {
                let obj = getGLObject(arg, 'texture');
                log('[GLES2] bindTexture - textureAddr:', arg, 'texture:', obj);
                if (!obj && arg !== 0 && arg !== null && window.GLES2LastTexture) {
                  log('[GLES2] bindTexture - using last texture as fallback');
                  obj = window.GLES2LastTexture;
                }
                return obj;
              }
              // For bindVertexArray
              if (method.name === 'bindVertexArray' && i === 0) {
                let obj = getGLObject(arg, 'vao');
                if (!obj && arg !== 0 && arg !== null && window.GLES2LastVAO) {
                  obj = window.GLES2LastVAO;
                }
                return obj;
              }
              // Check if this argument is likely an Object
              if (arg !== null && arg !== undefined && typeof arg === 'object') {
                return getGLObject(arg);
              }
              return arg;
            });
          }
          
          // Special handling for uniform arrays
          if (method.name.startsWith('uniform') && method.name.endsWith('fv')) {
            // Last arg is a float array
            const lastIdx = convertedArgs.length - 1;
            if (lastIdx >= 0) {
              convertedArgs[lastIdx] = toArray(convertedArgs[lastIdx], 'float');
            }
          }
          if (method.name.startsWith('uniformMatrix')) {
            // Second-to-last arg is transpose, last arg is array
            const lastIdx = convertedArgs.length - 1;
            if (lastIdx >= 0) {
              convertedArgs[lastIdx] = toArray(convertedArgs[lastIdx], 'float');
            }
          }
          // texImage2D has a byte array as last arg
          if (method.name === 'texImage2D') {
            const lastIdx = convertedArgs.length - 1;
            if (lastIdx >= 0) {
              convertedArgs[lastIdx] = toArray(convertedArgs[lastIdx], 'byte');
            }
          }
          // readPixels has a byte array as last arg
          if (method.name === 'readPixels') {
            const lastIdx = convertedArgs.length - 1;
            if (lastIdx >= 0) {
              convertedArgs[lastIdx] = toArray(convertedArgs[lastIdx], 'byte');
            }
          }
          
          const result = implFn(null, ptr, ...convertedArgs);
          
          // Store result if it's a GL object (buffer, texture, VAO, etc.)
          if (result && typeof result === 'object') {
            if (method.name === 'createBuffer') {
              storeGLObject(result, null);
              window.GLES2LastBuffer = result;
              log('[GLES2] createBuffer - created and stored:', result);
              // Return allocated Java object address
              return allocAndStoreNative(result, 'buffer');
            } else if (method.name === 'createTexture') {
              storeGLObject(result, null);
              window.GLES2LastTexture = result;
              log('[GLES2] createTexture - created and stored:', result);
              return allocAndStoreNative(result, 'texture');
            } else if (method.name === 'createVertexArray') {
              storeGLObject(result, null);
              window.GLES2LastVAO = result;
              log('[GLES2] createVertexArray - created and stored:', result);
              return allocAndStoreNative(result, 'vao');
            } else if (method.name === 'getCanvas') {
              storeGLObject(result, null);
              return allocAndStoreNative(result, 'canvas');
            }
          }
          
          return result;
        };
        log('[libgles2.js] Registered:', method.name);
      }
    }

    log('[libgles2.js] GLES2 native methods registration complete');
  }

  // Export the registration function
  window.registerGLES2Natives = registerGLES2Natives;

  // Auto-register when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerGLES2Natives);
  } else {
    // DOM already loaded, start registration
    registerGLES2Natives();
  }

  console.log('libgles2.js loaded - GLES2 native methods available');
})();
