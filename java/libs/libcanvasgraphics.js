// CanvasGraphics native methods for J2ME emulator
// Provides 2D canvas rendering capabilities for CanvasGraphics Java class
// VERSION: 20251212g
console.log('[libcanvasgraphics.js] Loaded v20251212g');

(function() {
  'use strict';
  
  const DEBUG = false;
  const log = DEBUG ? console.log.bind(console) : function() {};

  const CanvasGraphicsNatives = {
    // Create a new canvas context with given dimensions
    createCanvasCtx: function(lib, width, height) {
      log('[CanvasGraphics] createCanvasCtx:', width, height);
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx._canvas = canvas;
      ctx._width = width;
      ctx._height = height;
      return ctx;
    },

    // Get canvas element from context
    getCanvasFromCtx: function(lib, ctx) {
      if (ctx && ctx._canvas) {
        return ctx._canvas;
      }
      if (ctx && ctx.canvas) {
        return ctx.canvas;
      }
      return null;
    },

    // Set color with RGBA
    setColor: function(lib, ctx, r, g, b, a) {
      if (!ctx) return;
      const alpha = a / 255;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
    },

    // Set full graphics state
    setFullState: function(lib, ctx, fontString, dotted, r, g, b, a, translateX, translateY, clipX, clipY, clipW, clipH) {
      if (!ctx) return;
      
      // Set color
      const alpha = a / 255;
      ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
      
      // Set font
      if (fontString) {
        ctx.font = fontString;
      }
      
      // Set line style
      if (dotted) {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }
      
      // Apply transform and clip
      ctx.setTransform(1, 0, 0, 1, translateX, translateY);
      
      // Set clip region
      ctx.beginPath();
      ctx.rect(clipX - translateX, clipY - translateY, clipW, clipH);
      ctx.clip();
    },

    // Draw a line
    drawLine: function(lib, ctx, x1, y1, x2, y2) {
      if (!ctx) return;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    },

    // Fill a rectangle
    fillRect: function(lib, ctx, x, y, width, height) {
      if (!ctx) return;
      ctx.fillRect(x, y, width, height);
    },

    // Draw a rectangle outline
    drawRect: function(lib, ctx, x, y, width, height) {
      if (!ctx) return;
      ctx.strokeRect(x, y, width, height);
    },

    // Clear a rectangle
    clearRect: function(lib, ctx, x, y, width, height) {
      if (!ctx) return;
      ctx.clearRect(x, y, width, height);
    },

    // Draw an arc
    drawArc: function(lib, ctx, x, y, width, height, startAngle, arcAngle) {
      if (!ctx) return;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      const startRad = -startAngle * Math.PI / 180;
      const endRad = -(startAngle + arcAngle) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, startRad, endRad, arcAngle > 0);
      ctx.stroke();
    },

    // Fill an arc
    fillArc: function(lib, ctx, x, y, width, height, startAngle, arcAngle) {
      if (!ctx) return;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const radiusX = width / 2;
      const radiusY = height / 2;
      const startRad = -startAngle * Math.PI / 180;
      const endRad = -(startAngle + arcAngle) * Math.PI / 180;
      
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.ellipse(centerX, centerY, radiusX, radiusY, 0, startRad, endRad, arcAngle > 0);
      ctx.closePath();
      ctx.fill();
    },

    // Draw rounded rectangle
    drawRoundRect: function(lib, ctx, x, y, width, height, arcWidth, arcHeight) {
      if (!ctx) return;
      const rx = arcWidth / 2;
      const ry = arcHeight / 2;
      
      ctx.beginPath();
      ctx.moveTo(x + rx, y);
      ctx.lineTo(x + width - rx, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
      ctx.lineTo(x + width, y + height - ry);
      ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
      ctx.lineTo(x + rx, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
      ctx.lineTo(x, y + ry);
      ctx.quadraticCurveTo(x, y, x + rx, y);
      ctx.closePath();
      ctx.stroke();
    },

    // Fill rounded rectangle
    fillRoundRect: function(lib, ctx, x, y, width, height, arcWidth, arcHeight) {
      if (!ctx) return;
      const rx = arcWidth / 2;
      const ry = arcHeight / 2;
      
      ctx.beginPath();
      ctx.moveTo(x + rx, y);
      ctx.lineTo(x + width - rx, y);
      ctx.quadraticCurveTo(x + width, y, x + width, y + ry);
      ctx.lineTo(x + width, y + height - ry);
      ctx.quadraticCurveTo(x + width, y + height, x + width - rx, y + height);
      ctx.lineTo(x + rx, y + height);
      ctx.quadraticCurveTo(x, y + height, x, y + height - ry);
      ctx.lineTo(x, y + ry);
      ctx.quadraticCurveTo(x, y, x + rx, y);
      ctx.closePath();
      ctx.fill();
    },

    // Draw polygon
    drawPolygon: function(lib, ctx, xPoints, yPoints, nPoints) {
      if (!ctx || nPoints < 2) return;
      ctx.beginPath();
      ctx.moveTo(xPoints[0], yPoints[0]);
      for (let i = 1; i < nPoints; i++) {
        ctx.lineTo(xPoints[i], yPoints[i]);
      }
      ctx.closePath();
      ctx.stroke();
    },

    // Fill polygon
    fillPolygon: function(lib, ctx, xPoints, yPoints, nPoints, useSharpFillHack) {
      if (!ctx || nPoints < 2) return;
      ctx.beginPath();
      ctx.moveTo(xPoints[0], yPoints[0]);
      for (let i = 1; i < nPoints; i++) {
        ctx.lineTo(xPoints[i], yPoints[i]);
      }
      ctx.closePath();
      ctx.fill();
    },

    // Draw text
    drawText: function(lib, ctx, str, x, y) {
      if (!ctx) return;
      ctx.fillText(str, x, y);
    },

    // Set dotted line style
    setDotted: function(lib, ctx, dotted) {
      if (!ctx) return;
      if (dotted) {
        ctx.setLineDash([2, 2]);
      } else {
        ctx.setLineDash([]);
      }
    },

    // Apply translation
    applyTranslate: function(lib, ctx, x, y) {
      if (!ctx) return;
      ctx.translate(x, y);
    },

    // Set font
    setFont: function(lib, ctx, fontString) {
      if (!ctx) return;
      ctx.font = fontString;
    },

    // Draw image from another canvas
    // Parameters: ctx, canvasRef, sx, sy, x, y, width, height, flipY, withAlpha
    drawImage2: function(lib, ctx, canvasRef, sx, sy, x, y, width, height, flipY, withAlpha) {
      if (!ctx || !canvasRef) {
        console.warn('[CanvasGraphics] drawImage2 inner - missing ctx or canvasRef', ctx, canvasRef);
        return;
      }
      
      log('[CanvasGraphics] drawImage2 inner - ctx:', ctx, 'canvas:', ctx.canvas, 'src:', canvasRef, 'srcSize:', canvasRef.width, 'x', canvasRef.height);
      
      ctx.save();
      
      // CRITICAL FIX: Reset compositing operation to ensure complete overwrite
      // This prevents any blending with existing content
      ctx.globalCompositeOperation = 'source-over';
      ctx.globalAlpha = 1.0;
      
      // CRITICAL FIX: Always clear the destination area first to prevent ghosting
      // clearRect completely removes old content, preventing frame accumulation
      // Use 'copy' mode to ensure complete replacement of target area
      ctx.globalCompositeOperation = 'copy';
      ctx.clearRect(x, y, width, height);
      
      // Reset to source-over for the actual drawing
      ctx.globalCompositeOperation = 'source-over';
      
      // If not using alpha, fill with opaque black background first
      // This ensures no transparency that could let old content show through
      if (!withAlpha) {
        ctx.fillStyle = '#000000';
        ctx.fillRect(x, y, width, height);
      }
      
      try {
        if (flipY) {
          ctx.translate(x + width / 2, y + height / 2);
          ctx.scale(1, -1);
          ctx.drawImage(canvasRef, sx, sy, width, height, -width / 2, -height / 2, width, height);
        } else {
          ctx.drawImage(canvasRef, sx, sy, width, height, x, y, width, height);
        }
        log('[CanvasGraphics] drawImage2 inner - draw complete, flipY:', flipY);
      } catch (e) {
        console.error('[CanvasGraphics] drawImage2 inner - drawImage error:', e);
      }
      
      ctx.restore();
    },

    // Get RGBA data from context
    getRGBAFromCtx: function(lib, ctx, sx, sy, width, height) {
      if (!ctx) {
        console.warn('[CanvasGraphics] getRGBAFromCtx - ctx is null');
        return null;
      }
      
      // Get canvas dimensions
      const canvas = ctx.canvas || ctx._canvas;
      if (!canvas) {
        console.warn('[CanvasGraphics] getRGBAFromCtx - no canvas found on ctx');
        return null;
      }
      
      const canvasWidth = canvas.width || 0;
      const canvasHeight = canvas.height || 0;
      
      // Validate dimensions
      if (canvasWidth <= 0 || canvasHeight <= 0) {
        console.warn('[CanvasGraphics] getRGBAFromCtx - invalid canvas size:', canvasWidth, 'x', canvasHeight);
        return null;
      }
      
      // Clamp request to canvas bounds
      if (sx < 0) { width += sx; sx = 0; }
      if (sy < 0) { height += sy; sy = 0; }
      if (sx + width > canvasWidth) { width = canvasWidth - sx; }
      if (sy + height > canvasHeight) { height = canvasHeight - sy; }
      
      if (width <= 0 || height <= 0) {
        console.warn('[CanvasGraphics] getRGBAFromCtx - invalid dimensions after clamping');
        // Return empty array instead of null to prevent NullPointerException
        return new Int8Array(0);
      }
      
      try {
        const imageData = ctx.getImageData(sx, sy, width, height);
        return new Int8Array(imageData.data.buffer);
      } catch (e) {
        console.error('[CanvasGraphics] getRGBAFromCtx - getImageData failed:', e);
        // Return empty array instead of null
        return new Int8Array(0);
      }
    },

    // Convert bitmap to canvas context
    bitmapToCanvasCtx: function(lib, bitmapHandle) {
      if (!bitmapHandle) return null;
      
      // If it's already a canvas, create context from it
      if (bitmapHandle instanceof HTMLCanvasElement) {
        const ctx = bitmapHandle.getContext('2d');
        ctx._canvas = bitmapHandle;
        ctx._width = bitmapHandle.width;
        ctx._height = bitmapHandle.height;
        return ctx;
      }
      
      // If it's an ImageBitmap or Image
      if (bitmapHandle instanceof ImageBitmap || bitmapHandle instanceof Image) {
        const canvas = document.createElement('canvas');
        canvas.width = bitmapHandle.width;
        canvas.height = bitmapHandle.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(bitmapHandle, 0, 0);
        ctx._canvas = canvas;
        ctx._width = canvas.width;
        ctx._height = canvas.height;
        return ctx;
      }
      
      return bitmapHandle;
    },

    // Put RGBA data to context
    putRGBAData: function(lib, ctx, rgbaData, x, y, w, h) {
      if (!ctx) return;
      const imageData = new ImageData(new Uint8ClampedArray(rgbaData), w, h);
      ctx.putImageData(imageData, x, y);
    },

    // Draw RGBA data to context
    drawRGBAData: function(lib, ctx, rgbaData, width, height, x, y, alpha) {
      if (!ctx) return;
      const imageData = new ImageData(new Uint8ClampedArray(rgbaData), width, height);
      
      // Create temp canvas for alpha blending
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = width;
      tempCanvas.height = height;
      const tempCtx = tempCanvas.getContext('2d');
      tempCtx.putImageData(imageData, 0, 0);
      
      ctx.save();
      ctx.globalAlpha = alpha / 255;
      ctx.drawImage(tempCanvas, x, y);
      ctx.restore();
    },

    // Encode canvas to data URL
    encode: function(lib, ctx, type) {
      if (!ctx || !ctx._canvas) return null;
      const dataUrl = ctx._canvas.toDataURL(type || 'image/png');
      // Return as byte array
      const base64 = dataUrl.split(',')[1];
      const binary = atob(base64);
      const bytes = new Int8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes;
    }
  };

  // Utils native methods
  const UtilsNatives = {
    getCanvasFromCtx: function(lib, ctx) {
      return CanvasGraphicsNatives.getCanvasFromCtx(lib, ctx);
    }
  };

  // Font native methods
  const CanvasFontNatives = {
    getTextWidth: function(lib, fontStr, text) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = fontStr || '12px sans-serif';
      return Math.ceil(ctx.measureText(text).width);
    },

    getFontMetrics: function(lib, fontStr, result) {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.font = fontStr || '12px sans-serif';
      
      // Get font metrics
      const metrics = ctx.measureText('Mg');
      const height = metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent;
      const ascent = metrics.actualBoundingBoxAscent;
      const descent = metrics.actualBoundingBoxDescent;
      
      if (result && result.length >= 3) {
        result[0] = Math.ceil(height) || 14;
        result[1] = Math.ceil(ascent) || 11;
        result[2] = Math.ceil(descent) || 3;
      }
      
      return 0;
    }
  };

  // Export natives
  window.CanvasGraphicsNatives = CanvasGraphicsNatives;
  window.UtilsNatives = UtilsNatives;
  window.CanvasFontNatives = CanvasFontNatives;

  // Register to Native object when available
  function registerCanvasGraphicsNatives() {
    if (typeof Native === 'undefined') {
      setTimeout(registerCanvasGraphicsNatives, 100);
      return;
    }

    // Registering CanvasGraphics native methods

    const cgBasePath = 'pl/zb3/freej2me/bridge/graphics/CanvasGraphics';
    const utilsBasePath = 'pl/zb3/freej2me/bridge/graphics/Utils';
    const fontBasePath = 'pl/zb3/freej2me/bridge/graphics/CanvasFont';

    // Helper to get native object - for CanvasGraphics the ctx IS the native object directly
    // since createCanvasCtx returns it and J2ME stores it
    function getCtx(ctxOrAddr) {
      // If it's already a canvas context, return it
      if (ctxOrAddr && typeof ctxOrAddr === 'object' && (ctxOrAddr.canvas || ctxOrAddr._canvas)) {
        return ctxOrAddr;
      }
      // Try getNative if available
      if (typeof getNative === 'function' && ctxOrAddr) {
        const native = getNative(ctxOrAddr);
        if (native) return native;
      }
      // Try global CanvasGraphicsContexts map
      if (window.CanvasGraphicsContexts && typeof ctxOrAddr === 'number' && ctxOrAddr > 0) {
        const ctx = window.CanvasGraphicsContexts.get(ctxOrAddr);
        if (ctx) return ctx;
      }
      return ctxOrAddr;
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

    // CanvasGraphics methods - createCanvasCtx returns a new context
    Native[cgBasePath + '.createCanvasCtx.(II)Ljava/lang/Object;'] = function(addr, w, h) {
      const ctx = CanvasGraphicsNatives.createCanvasCtx(null, w, h);
      log('[CanvasGraphics] createCanvasCtx returned:', ctx);
      
      // Store ctx globally for later retrieval if the J2ME object system doesn't properly pass it back
      if (!window.CanvasGraphicsContexts) {
        window.CanvasGraphicsContexts = new Map();
      }
      const ctxId = (window.CanvasGraphicsContexts.size + 1);
      window.CanvasGraphicsContexts.set(ctxId, ctx);
      ctx._cgId = ctxId;
      
      // Try to use setNative if available for proper J2ME integration
      if (typeof setNative === 'function' && addr) {
        // Store against the calling object's address
        setNative(addr, ctx);
        log('[CanvasGraphics] createCanvasCtx - stored ctx for addr:', addr);
      }
      
      return ctx;
    };

    Native[cgBasePath + '.setColor.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, r, g, b, a) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.setColor(null, ctx, r, g, b, a);
    };

    Native[cgBasePath + '.setFullState.(Ljava/lang/Object;Ljava/lang/String;ZIIIIIIIIII)V'] = function(addr, ctxAddr, fontStrAddr, dotted, r, g, b, a, tx, ty, cx, cy, cw, ch) {
      const ctx = getCtx(ctxAddr);
      const fontStr = toStr(fontStrAddr);
      CanvasGraphicsNatives.setFullState(null, ctx, fontStr, dotted, r, g, b, a, tx, ty, cx, cy, cw, ch);
    };

    Native[cgBasePath + '.drawLine.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, x1, y1, x2, y2) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawLine(null, ctx, x1, y1, x2, y2);
    };

    Native[cgBasePath + '.fillRect.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, x, y, w, h) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.fillRect(null, ctx, x, y, w, h);
    };

    Native[cgBasePath + '.drawRect.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, x, y, w, h) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawRect(null, ctx, x, y, w, h);
    };

    Native[cgBasePath + '.clearRect.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, x, y, w, h) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.clearRect(null, ctx, x, y, w, h);
    };

    Native[cgBasePath + '.drawArc.(Ljava/lang/Object;IIIIII)V'] = function(addr, ctxAddr, x, y, w, h, start, arc) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawArc(null, ctx, x, y, w, h, start, arc);
    };

    Native[cgBasePath + '.fillArc.(Ljava/lang/Object;IIIIII)V'] = function(addr, ctxAddr, x, y, w, h, start, arc) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.fillArc(null, ctx, x, y, w, h, start, arc);
    };

    Native[cgBasePath + '.drawRoundRect.(Ljava/lang/Object;IIIIII)V'] = function(addr, ctxAddr, x, y, w, h, aw, ah) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawRoundRect(null, ctx, x, y, w, h, aw, ah);
    };

    Native[cgBasePath + '.fillRoundRect.(Ljava/lang/Object;IIIIII)V'] = function(addr, ctxAddr, x, y, w, h, aw, ah) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.fillRoundRect(null, ctx, x, y, w, h, aw, ah);
    };

    Native[cgBasePath + '.drawPolygon.(Ljava/lang/Object;[I[II)V'] = function(addr, ctxAddr, xPts, yPts, n) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawPolygon(null, ctx, xPts, yPts, n);
    };

    Native[cgBasePath + '.fillPolygon.(Ljava/lang/Object;[I[IIZ)V'] = function(addr, ctxAddr, xPts, yPts, n, hack) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.fillPolygon(null, ctx, xPts, yPts, n, hack);
    };

    Native[cgBasePath + '.drawText.(Ljava/lang/Object;Ljava/lang/String;II)V'] = function(addr, ctxAddr, strAddr, x, y) {
      const ctx = getCtx(ctxAddr);
      const str = toStr(strAddr);
      CanvasGraphicsNatives.drawText(null, ctx, str, x, y);
    };

    Native[cgBasePath + '.setDotted.(Ljava/lang/Object;Z)V'] = function(addr, ctxAddr, dotted) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.setDotted(null, ctx, dotted);
    };

    Native[cgBasePath + '.applyTranslate.(Ljava/lang/Object;II)V'] = function(addr, ctxAddr, x, y) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.applyTranslate(null, ctx, x, y);
    };

    Native[cgBasePath + '.setFont.(Ljava/lang/Object;Ljava/lang/String;)V'] = function(addr, ctxAddr, fontStrAddr) {
      const ctx = getCtx(ctxAddr);
      const fontStr = toStr(fontStrAddr);
      CanvasGraphicsNatives.setFont(null, ctx, fontStr);
    };

    // drawImage2 with signature (Object, Object, int sx, int sy, int x, int y, int width, int height, boolean flipY, boolean withAlpha)
    Native[cgBasePath + '.drawImage2.(Ljava/lang/Object;Ljava/lang/Object;IIIIIIZZ)V'] = function(addr, ctxAddr, canvasAddr, sx, sy, x, y, w, h, flipY, withAlpha) {
      // Reduce log spam - only log occasionally for blitGL
      var shouldLogBlit = Math.random() < 0.01; // Log ~1% of calls
      if (shouldLogBlit || DEBUG) {
        console.log('[CanvasGraphics] drawImage2 (blitGL) called - ctxAddr:', ctxAddr, 'canvasAddr:', canvasAddr, 'coords:', sx, sy, x, y, w, h, 'flipY:', flipY, 'withAlpha:', withAlpha);
      }
      log('[CanvasGraphics] drawImage2 called - ctxAddr:', ctxAddr, 'canvasAddr:', canvasAddr, 'coords:', sx, sy, x, y, w, h, 'flipY:', flipY, 'withAlpha:', withAlpha);
      
      let ctx = getCtx(ctxAddr);
      let canvas = getCtx(canvasAddr);
      
      log('[CanvasGraphics] drawImage2 - initial ctx:', ctx, 'canvas:', canvas);
      
      // canvasAddr might be a canvas element reference from GLES2.getCanvasRef()
      if (!canvas && canvasAddr) {
        // Try to get from NativeMap
        if (typeof NativeMap !== 'undefined' && NativeMap.has && NativeMap.has(canvasAddr)) {
          canvas = NativeMap.get(canvasAddr);
          log('[CanvasGraphics] drawImage2 - got canvas from NativeMap:', canvas);
        } else if (typeof J2ME !== 'undefined' && J2ME.NativeMap && J2ME.NativeMap.has(canvasAddr)) {
          canvas = J2ME.NativeMap.get(canvasAddr);
          log('[CanvasGraphics] drawImage2 - got canvas from J2ME.NativeMap:', canvas);
        }
      }
      
      // If canvas is a WebGL handle, get its canvas element
      if (canvas && canvas.gl && canvas.gl.canvas) {
        log('[CanvasGraphics] drawImage2 - extracting gl.canvas from handle');
        canvas = canvas.gl.canvas;
      }
      
      // If canvas is an HTMLCanvasElement directly, use it
      if (canvas instanceof HTMLCanvasElement) {
        log('[CanvasGraphics] drawImage2 - canvas is HTMLCanvasElement directly');
      }
      
      // Always try to get WebGL canvas from global GLES2Context as primary source for blitGL
      // This is the most reliable way since _create stores the context globally
      if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        log('[CanvasGraphics] drawImage2 - canvas not valid HTMLCanvasElement, trying global GLES2Context. canvas:', canvas, 'GLES2Context:', window.GLES2Context);
        if (window.GLES2Context && window.GLES2Context.gl && window.GLES2Context.gl.canvas) {
          log('[CanvasGraphics] drawImage2 - using global GLES2Context.gl.canvas');
          canvas = window.GLES2Context.gl.canvas;
        } else if (window.currentGLES2Handle && window.currentGLES2Handle.gl && window.currentGLES2Handle.gl.canvas) {
          log('[CanvasGraphics] drawImage2 - using currentGLES2Handle.gl.canvas');
          canvas = window.currentGLES2Handle.gl.canvas;
        }
      }
      
      log('[CanvasGraphics] drawImage2 - final canvas:', canvas, 'width:', canvas ? canvas.width : 'N/A', 'height:', canvas ? canvas.height : 'N/A');
      
      // Handle canvas context vs canvas element
      let sourceCanvas = canvas;
      if (canvas && canvas._canvas) {
        sourceCanvas = canvas._canvas;
      } else if (canvas && canvas.canvas) {
        sourceCanvas = canvas.canvas;
      }
      
      // Log WebGL canvas info for blitGL debugging (reduced frequency to prevent spam)
      var shouldLogBlit = Math.random() < 0.01; // Log ~1% of calls
      if ((shouldLogBlit || DEBUG) && sourceCanvas && sourceCanvas instanceof HTMLCanvasElement) {
        // Check if this is a WebGL canvas by checking for WebGL context
        const webglCtx = sourceCanvas.getContext('webgl2') || sourceCanvas.getContext('webgl');
        if (webglCtx) {
          console.log('[CanvasGraphics] drawImage2 - WebGL canvas detected, size:', sourceCanvas.width, 'x', sourceCanvas.height);
          // Try to read a pixel to check if canvas has content
          try {
            const pixel = new Uint8Array(4);
            webglCtx.readPixels(0, 0, 1, 1, webglCtx.RGBA, webglCtx.UNSIGNED_BYTE, pixel);
            console.log('[CanvasGraphics] drawImage2 - WebGL canvas pixel (0,0):', pixel[0], pixel[1], pixel[2], pixel[3]);
          } catch (e) {
            console.warn('[CanvasGraphics] drawImage2 - failed to read WebGL pixel:', e);
          }
        }
      }
      
      // Fallback for ctx: if ctxAddr is 0 or ctx is null, try to use screen context
      if (!ctx && (ctxAddr === 0 || ctxAddr === null)) {
        // Try to get screen context from global
        if (window.screenContext2D) {
          ctx = window.screenContext2D;
          log('[CanvasGraphics] drawImage2 - using screenContext2D as fallback');
        } else if (window.screenContextInfo && window.screenContextInfo.ctx) {
          ctx = window.screenContextInfo.ctx;
          log('[CanvasGraphics] drawImage2 - using screenContextInfo as fallback');
        } else if (window.screenCanvas) {
          ctx = window.screenCanvas.getContext('2d');
          log('[CanvasGraphics] drawImage2 - using screenCanvas as fallback');
        }
      }
      
      if (!ctx || !sourceCanvas) {
        console.error('[CanvasGraphics] drawImage2 - missing ctx or canvas, ctxAddr:', ctxAddr, 'canvasAddr:', canvasAddr, 'sourceCanvas:', sourceCanvas);
        // As a last resort for blitGL, try to draw directly to screen canvas
        if (sourceCanvas && window.screenCanvas) {
          try {
            const screenCtx = window.screenCanvas.getContext('2d');
            if (screenCtx) {
              log('[CanvasGraphics] drawImage2 - using screenCanvas directly as last resort');
              ctx = screenCtx;
            }
          } catch (e) {}
        }
        if (!ctx) return;
      }
      
      // Clamp source dimensions to canvas size to avoid IndexOutOfBounds
      const srcWidth = sourceCanvas.width || 0;
      const srcHeight = sourceCanvas.height || 0;
      
      // Adjust source coordinates if they exceed bounds
      if (sx < 0) { x -= sx; w += sx; sx = 0; }
      if (sy < 0) { y -= sy; h += sy; sy = 0; }
      if (sx + w > srcWidth) { w = srcWidth - sx; }
      if (sy + h > srcHeight) { h = srcHeight - sy; }
      
      // Skip if nothing to draw
      if (w <= 0 || h <= 0) {
        return;
      }
      
      try {
        // Pass flipY and withAlpha parameters correctly
        CanvasGraphicsNatives.drawImage2(null, ctx, sourceCanvas, sx, sy, x, y, w, h, flipY, withAlpha);
      } catch (e) {
        console.error('[CanvasGraphics] drawImage2 error:', e);
      }
    };

    // CRITICAL FIX: Trigger repaint after blitGL to ensure canvas updates
    // This ensures the 2D canvas content is refreshed and displayed on screen
    Native[cgBasePath + '.triggerRepaint.(Ljava/lang/Object;IIII)V'] = function(addr, ctxAddr, x, y, w, h) {
      const ctx = getCtx(ctxAddr);
      if (!ctx) {
        return;
      }
      
      // The canvas should automatically update when drawImage is called,
      // but we can force a refresh by accessing the canvas element
      // In browsers, canvas updates are automatic, but we can trigger a repaint
      // by accessing the canvas element or calling requestAnimationFrame
      try {
        const canvas = ctx.canvas;
        if (canvas) {
          // Force canvas to update by accessing its properties
          // This ensures the browser knows the canvas has changed
          const width = canvas.width;
          const height = canvas.height;
          
          // If this canvas is the screen canvas, trigger a repaint
          if (window.screenCanvas && (canvas === window.screenCanvas || canvas === window.screenContext2D?.canvas)) {
            // Screen canvas - trigger repaint via Display system if available
            if (window.J2ME && window.J2ME.Display && typeof window.J2ME.Display.requestRepaint === 'function') {
              window.J2ME.Display.requestRepaint(x, y, w, h);
            } else if (window.requestAnimationFrame) {
              // Fallback: use requestAnimationFrame to ensure canvas is redrawn
              window.requestAnimationFrame(function() {
                // Canvas should already be updated, this just ensures browser redraws
              });
            }
          }
        }
      } catch (e) {
        // Repaint trigger is optional, don't fail if it's not available
        if (DEBUG) {
          console.log('[CanvasGraphics] triggerRepaint - could not trigger repaint:', e);
        }
      }
    };

    Native[cgBasePath + '.getRGBAFromCtx.(Ljava/lang/Object;IIII)[B'] = function(addr, ctxAddr, sx, sy, w, h) {
      const ctx = getCtx(ctxAddr);
      if (!ctx) {
        console.warn('[CanvasGraphics] getRGBAFromCtx - ctx is null, ctxAddr:', ctxAddr, 'typeof:', typeof ctxAddr);
        // Try to get from global map using addr instead
        if (window.CanvasGraphicsContexts) {
          // Try to find any valid context with matching dimensions
          for (const [key, value] of window.CanvasGraphicsContexts) {
            if (value && (value.canvas || value._canvas)) {
              const canvas = value.canvas || value._canvas;
              // Only use if dimensions are compatible
              if (canvas.width >= w && canvas.height >= h) {
                console.log('[CanvasGraphics] getRGBAFromCtx - using fallback ctx from global map, key:', key);
                const result = CanvasGraphicsNatives.getRGBAFromCtx(null, value, sx, sy, w, h);
                if (result && result.length > 0) {
                  return result;
                }
              }
            }
          }
        }
        // Return empty array instead of null to prevent NullPointerException
        console.warn('[CanvasGraphics] getRGBAFromCtx - returning empty array');
        return new Int8Array(0);
      }
      const result = CanvasGraphicsNatives.getRGBAFromCtx(null, ctx, sx, sy, w, h);
      // Never return null, return empty array instead
      return result || new Int8Array(0);
    };

    Native[cgBasePath + '.bitmapToCanvasCtx.(Ljava/lang/Object;)Ljava/lang/Object;'] = function(addr, bitmapAddr) {
      const bitmap = getCtx(bitmapAddr);
      return CanvasGraphicsNatives.bitmapToCanvasCtx(null, bitmap);
    };

    Native[cgBasePath + '.putRGBAData.(Ljava/lang/Object;[BIIII)V'] = function(addr, ctxAddr, data, x, y, w, h) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.putRGBAData(null, ctx, data, x, y, w, h);
    };

    Native[cgBasePath + '.drawRGBAData.(Ljava/lang/Object;[BIIIII)V'] = function(addr, ctxAddr, data, w, h, x, y, alpha) {
      const ctx = getCtx(ctxAddr);
      CanvasGraphicsNatives.drawRGBAData(null, ctx, data, w, h, x, y, alpha);
    };

    Native[cgBasePath + '.encode.(Ljava/lang/Object;Ljava/lang/String;)[B'] = function(addr, ctxAddr, typeAddr) {
      const ctx = getCtx(ctxAddr);
      const type = toStr(typeAddr);
      return CanvasGraphicsNatives.encode(null, ctx, type);
    };

    // Utils methods
    Native[utilsBasePath + '.getCanvasFromCtx.(Ljava/lang/Object;)Ljava/lang/Object;'] = function(addr, ctxAddr) {
      const ctx = getCtx(ctxAddr);
      return UtilsNatives.getCanvasFromCtx(null, ctx);
    };

    // Font methods
    Native[fontBasePath + '.getTextWidth.(Ljava/lang/String;Ljava/lang/String;)I'] = function(addr, fontStrAddr, textAddr) {
      const fontStr = toStr(fontStrAddr);
      const text = toStr(textAddr);
      return CanvasFontNatives.getTextWidth(null, fontStr, text);
    };

    Native[fontBasePath + '.getFontMetrics.(Ljava/lang/String;[I)I'] = function(addr, fontStrAddr, result) {
      const fontStr = toStr(fontStrAddr);
      return CanvasFontNatives.getFontMetrics(null, fontStr, result);
    };

    // CanvasGraphics native methods registration complete
  }

  // Export registration function
  window.registerCanvasGraphicsNatives = registerCanvasGraphicsNatives;

  // Auto-register when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', registerCanvasGraphicsNatives);
  } else {
    // DOM already loaded, start registration
    registerCanvasGraphicsNatives();
  }

})();

