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

    Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2DFromHandle: function(lib, ptr, target, level, intFormat, width, height, format, type, sourceHandle) {
      // sourceHandle is typically a canvas element
      let source = sourceHandle;
      
      // If sourceHandle is an address, try to get the actual object
      if (typeof sourceHandle === 'number' && sourceHandle !== 0) {
        if (typeof J2ME !== 'undefined' && J2ME.NativeMap && J2ME.NativeMap.has(sourceHandle)) {
          source = J2ME.NativeMap.get(sourceHandle);
        } else if (typeof NativeMap !== 'undefined' && NativeMap.has && NativeMap.has(sourceHandle)) {
          source = NativeMap.get(sourceHandle);
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
      
      console.log('[GLES2] texImage2DFromHandle - target:', target, 'size:', width, 'x', height, 'source:', source);
      
      if (!source) {
        console.error('[GLES2] texImage2DFromHandle - source is null');
        return;
      }
      
      try {
        ptr.gl.texImage2D(target, level, intFormat, format, type, source);
      } catch (e) {
        console.error('[GLES2] texImage2DFromHandle error:', e);
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
      console.log('[libgles2.js] Native object not ready, waiting...');
      setTimeout(registerGLES2Natives, 100);
      return;
    }

    console.log('[libgles2.js] Registering GLES2 native methods to Native object...');
    
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
      'texImage2D': { sig: '.(Ljava/lang/Object;IIIIIII[B)V', fn: 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_texImage2D' },
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
      console.log('[GLES2] Native _create called, addr:', addr);
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
    console.log('[libgles2.js] Registered: _create');

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
          
          console.log('[GLES2] allocAndStoreNative - allocated addr:', objAddr, 'type:', objectType, 'for:', jsObject);
          return objAddr;
        } catch (e) {
          console.warn('[GLES2] allocAndStoreNative failed:', e);
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
      console.log('[GLES2] createProgram - vertex shader length:', vertexSrc ? vertexSrc.length : 0);
      console.log('[GLES2] createProgram - fragment shader length:', fragmentSrc ? fragmentSrc.length : 0);
      const program = GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_createProgram(null, ptr, vertexSrc, fragmentSrc);
      // Store program for later retrieval
      const progId = storeGLObject(program, null);
      // Also store as "last program" for fallback
      window.GLES2LastProgram = program;
      window.GLES2CurrentProgram = program;
      // Store in GLES2Programs map for address-based lookup
      if (!window.GLES2Programs) window.GLES2Programs = new Map();
      console.log('[GLES2] createProgram - stored as ID:', progId, 'program:', program);
      // Allocate Java object and store native
      return allocAndStoreNative(program, 'program');
    };
    console.log('[libgles2.js] Registered: createProgram (with string conversion)');

    // getAttribLocation takes a String parameter
    Native[basePath + '.getAttribLocation.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)I'] = function(addr, handleAddr, programAddr, nameAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const name = toStr(nameAddr);
      // Try multiple ways to get the program
      let program = getGLObject(programAddr, 'program');
      console.log('[GLES2] getAttribLocation - programAddr:', programAddr, 'typeof:', typeof programAddr, 'program:', program, 'name:', name);
      
      // If program is null, try to get the current or last created program
      if (!program) {
        program = window.GLES2CurrentProgram || window.GLES2LastProgram;
        if (program) {
          console.log('[GLES2] getAttribLocation - using current/last program as fallback');
        }
      }
      
      if (!program) {
        console.error('[GLES2] getAttribLocation - no program available!');
        return -1;
      }
      
      return GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_getAttribLocation(null, ptr, program, name);
    };
    console.log('[libgles2.js] Registered: getAttribLocation (with string conversion)');

    // getUniformLocation takes a String parameter - returns stored ID
    Native[basePath + '.getUniformLocation.(Ljava/lang/Object;Ljava/lang/Object;Ljava/lang/String;)Ljava/lang/Object;'] = function(addr, handleAddr, programAddr, nameAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const name = toStr(nameAddr);
      // Try to get program, fallback to current/last program
      let program = getGLObject(programAddr);
      console.log('[GLES2] getUniformLocation - programAddr:', programAddr, 'program:', program, 'name:', name);
      if (!program) {
        program = window.GLES2CurrentProgram || window.GLES2LastProgram;
        if (program) {
          console.log('[GLES2] getUniformLocation - using current/last program as fallback');
        }
      }
      if (!program) {
        console.error('[GLES2] getUniformLocation - no program available!');
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
        console.log('[GLES2] getUniformLocation - stored:', name, loc);
      }
      // Allocate Java object and store native for proper reference tracking
      return allocAndStoreNative(loc, 'uniform');
    };
    console.log('[libgles2.js] Registered: getUniformLocation (with string conversion)');

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
      { name: 'texImage2D', sig: '.(Ljava/lang/Object;IIIIIII[B)V' },
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

    // Register bufferSubData variants - need to convert Java arrays
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[B)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'byte');
      console.log('[GLES2] bufferSubData byte - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[S)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'short');
      console.log('[GLES2] bufferSubData short - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[F)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'float');
      console.log('[GLES2] bufferSubData float - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    Native[basePath + '.bufferSubData.(Ljava/lang/Object;III[I)V'] = function(addr, handleAddr, type, offset, byteSize, arrayAddr) {
      const ptr = getObj(handleAddr) || window.GLES2Context;
      const array = toArray(arrayAddr, 'int');
      console.log('[GLES2] bufferSubData int - array:', array, 'byteSize:', byteSize);
      GLES2NativeMethods.Java_pl_zb3_freej2me_bridge_gles2_GLES2_bufferSubData(null, ptr, type, offset, byteSize, array);
    };
    console.log('[libgles2.js] Registered bufferSubData variants');

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
    for (const method of handleMethods) {
      const fnName = 'Java_pl_zb3_freej2me_bridge_gles2_GLES2_' + method.name;
      const implFn = GLES2NativeMethods[fnName];
      if (implFn) {
        const fullSig = basePath + '.' + method.name + method.sig;
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
                  console.log('[GLES2] useProgram - using last program as fallback');
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
                  console.log('[GLES2] ' + method.name + ' - location lookup failed for addr:', arg);
                  // Try to get from current program's uniforms
                  if (window.GLES2CurrentProgram && window.GLES2CurrentProgram._uniforms) {
                    // We can't look up by address without name, but we can try the last uniform
                    console.log('[GLES2] ' + method.name + ' - current program has uniforms map');
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
                      console.log('[GLES2] bindBuffer - bufferAddr:', arg, 'not found, using last buffer');
                      obj = window.GLES2LastBuffer;
                    } else if (window.GLES2BoundBuffers && window.GLES2BoundBuffers.has(bufferType)) {
                      // Use currently bound buffer if available
                      console.log('[GLES2] bindBuffer - bufferAddr:', arg, 'not found, keeping current buffer');
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
                console.log('[GLES2] bindTexture - textureAddr:', arg, 'texture:', obj);
                if (!obj && arg !== 0 && arg !== null && window.GLES2LastTexture) {
                  console.log('[GLES2] bindTexture - using last texture as fallback');
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
              console.log('[GLES2] createBuffer - created and stored:', result);
              // Return allocated Java object address
              return allocAndStoreNative(result, 'buffer');
            } else if (method.name === 'createTexture') {
              storeGLObject(result, null);
              window.GLES2LastTexture = result;
              console.log('[GLES2] createTexture - created and stored:', result);
              return allocAndStoreNative(result, 'texture');
            } else if (method.name === 'createVertexArray') {
              storeGLObject(result, null);
              window.GLES2LastVAO = result;
              console.log('[GLES2] createVertexArray - created and stored:', result);
              return allocAndStoreNative(result, 'vao');
            } else if (method.name === 'getCanvas') {
              storeGLObject(result, null);
              return allocAndStoreNative(result, 'canvas');
            }
          }
          
          return result;
        };
        console.log('[libgles2.js] Registered:', method.name);
      } else {
        console.warn('[libgles2.js] No implementation for:', fnName);
      }
    }

    console.log('[libgles2.js] GLES2 native methods registration complete');
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
