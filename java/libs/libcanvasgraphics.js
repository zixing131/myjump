// CanvasGraphics native methods for J2ME emulator
// Provides 2D canvas rendering capabilities for CanvasGraphics Java class
// VERSION: 20251212g
console.log('[libcanvasgraphics.js] Loaded v20251212g');

(function() {
  'use strict';
  
  const DEBUG = false;
  const log = DEBUG ? console.log.bind(console) : function() {};
  const warn = DEBUG ? console.warn.bind(console) : function() {};
  
  // Throttled error logging to prevent console spam (已改为log)
  const throttledError = (function() {
    const lastLog = {};
    return function(key, ...args) {
      const now = Date.now();
      if (!lastLog[key] || now - lastLog[key] > 5000) {
        console.log(...args);
        lastLog[key] = now;
      }
    };
  })();

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
      // 移除调用过程日志
      
      if (!ctx || !canvasRef) {
        if (window.debugLog) {
          window.debugLog.error('DRAWIMAGE2', 'Missing ctx or canvasRef!', { ctx: !!ctx, canvasRef: !!canvasRef });
        }
        // 移除调用过程日志
        return;
      }
      
      // CRITICAL FIX: The ctx.canvas is the offscreenCanvas which is NOT in the DOM
      // We need to also write to the actual device canvas (MIDP.deviceContext.canvas) for immediate display
      let deviceCtx = null;
      if (window.MIDP && window.MIDP.deviceContext) {
        deviceCtx = window.MIDP.deviceContext;
      }
      
      // IMPORTANT: We need to get the existing WebGL context, not create a new one
      // If we call getContext('webgl') on a canvas that already has a different context type,
      // it will return null. We need to check window.GLES2Context which stores the WebGL context.
      let webglCtx = null;
      
      // Try to get WebGL context from global storage first
      if (window.GLES2Context && window.GLES2Context.gl) {
        // Check if this is the same canvas
        if (window.GLES2Context.gl.canvas === canvasRef) {
          webglCtx = window.GLES2Context.gl;
        }
      }
      
      // Fallback: try to get context directly (may fail if canvas has 2D context)
      if (!webglCtx) {
        try {
          webglCtx = canvasRef.getContext('webgl2') || canvasRef.getContext('webgl');
        } catch (e) {
          // 移除调用过程日志
        }
      }
      
      if (webglCtx) {
        // WORKAROUND: drawImage from WebGL canvas to 2D canvas doesn't work reliably
        // Use readPixels + putImageData instead
        try {
          const srcWidth = canvasRef.width;
          const srcHeight = canvasRef.height;
          
          // Read all pixels from WebGL canvas
          const pixels = new Uint8Array(srcWidth * srcHeight * 4);
          webglCtx.readPixels(0, 0, srcWidth, srcHeight, webglCtx.RGBA, webglCtx.UNSIGNED_BYTE, pixels);
          
          // CRITICAL: Check multiple pixel positions to diagnose readPixels issues
          // WebGL readPixels uses bottom-left origin, so (0,0) is bottom-left corner
          // For center pixel in WebGL coordinates: centerY = srcHeight/2 (from bottom)
          const centerX = Math.floor(srcWidth / 2);
          const centerY = Math.floor(srcHeight / 2);
          
          // Check first pixel (bottom-left in WebGL = (0,0))
          const firstPixel = { r: pixels[0], g: pixels[1], b: pixels[2], a: pixels[3] };
          
          // Check center pixel in WebGL coordinates (from bottom-left origin)
          // In readPixels buffer: row 0 = bottom row, row (height-1) = top row
          const webglCenterRow = centerY; // This is the row index in the buffer (from bottom)
          const webglCenterIdx = (webglCenterRow * srcWidth + centerX) * 4;
          const centerPixel = { r: pixels[webglCenterIdx], g: pixels[webglCenterIdx+1], b: pixels[webglCenterIdx+2], a: pixels[webglCenterIdx+3] };
          
          // Also check top-left and bottom-right corners for debugging
          const topLeftIdx = ((srcHeight - 1) * srcWidth + 0) * 4; // Top-left in WebGL = bottom row, left col
          const bottomRightIdx = (0 * srcWidth + (srcWidth - 1)) * 4; // Bottom-right in WebGL = top row, right col
          const topLeftPixel = { r: pixels[topLeftIdx], g: pixels[topLeftIdx+1], b: pixels[topLeftIdx+2], a: pixels[topLeftIdx+3] };
          const bottomRightPixel = { r: pixels[bottomRightIdx], g: pixels[bottomRightIdx+1], b: pixels[bottomRightIdx+2], a: pixels[bottomRightIdx+3] };
          
          // CRITICAL DIAGNOSIS: Log pixel data from readPixels to verify WebGL content
          if (!window._readPixelsDiagnosisPrinted) {
            console.log('[DRAWIMAGE2] readPixels诊断 - WebGL原始像素数据:');
            console.log('  中心像素 (WebGL坐标 ' + centerX + ',' + centerY + '):', centerPixel);
            console.log('  左上角 (WebGL坐标 0,' + (srcHeight-1) + '):', topLeftPixel);
            console.log('  右下角 (WebGL坐标 ' + (srcWidth-1) + ',0):', bottomRightPixel);
            console.log('  左下角 (WebGL坐标 0,0):', firstPixel);
            window._readPixelsDiagnosisPrinted = true;
          }
          
          if (window.debugLog) {
            window.debugLog.info('DRAWIMAGE2', 'readPixels completed', {
              size: `${srcWidth}x${srcHeight}`,
              firstPixel: firstPixel,
              centerPixel: centerPixel
            });
            
            // 检查WebGL读取的像素是否为黑色
            if (centerPixel.r === 0 && centerPixel.g === 0 && centerPixel.b === 0 && centerPixel.a === 255) {
              // 跟踪连续黑屏次数
              if (!window._drawImage2BlackCount) window._drawImage2BlackCount = 0;
              window._drawImage2BlackCount++;
              
              // 初始化消息打印标志（用于debugLog分支）
              if (!window._blackScreenMessagesPrintedDebugLog) {
                window._blackScreenMessagesPrintedDebugLog = {
                  initial: false,
                  threshold: false,
                  fixed: false
                };
              }
              
              // 收集WebGL状态用于诊断
              const gl = webglCtx;
              const diagnostics = {
                pixel: centerPixel,
                size: `${srcWidth}x${srcHeight}`,
                firstPixel: firstPixel,
                consecutiveBlackFrames: window._drawImage2BlackCount,
                viewport: gl.getParameter(gl.VIEWPORT),
                currentProgram: !!gl.getParameter(gl.CURRENT_PROGRAM),
                cullFace: {
                  enabled: gl.isEnabled(gl.CULL_FACE),
                  mode: gl.getParameter(gl.CULL_FACE_MODE)
                },
                depthTest: {
                  enabled: gl.isEnabled(gl.DEPTH_TEST),
                  func: gl.getParameter(gl.DEPTH_FUNC)
                },
                colorMask: gl.getParameter(gl.COLOR_WRITEMASK),
                elementBuffer: !!gl.getParameter(gl.ELEMENT_ARRAY_BUFFER_BINDING),
                arrayBuffer: !!gl.getParameter(gl.ARRAY_BUFFER_BINDING)
              };
              
              // 只在关键节点打印（首次和阈值）
              const threshold = window.autoFixBlackScreenThreshold || 3;
              const shouldPrintDetails = window._drawImage2BlackCount === 1 || window._drawImage2BlackCount === threshold;
              
              if (shouldPrintDetails) {
                window.debugLog.warn('BLACKSCREEN', 'WebGL readPixels center pixel is BLACK!', diagnostics);
                // Also log to console for immediate visibility
                console.log('[BLACKSCREEN] ========================================');
                console.log('[BLACKSCREEN] WebGL canvas center pixel is BLACK (0,0,0,255)!');
                console.log('[BLACKSCREEN] 连续黑屏次数:', window._drawImage2BlackCount);
                
                // 只在首次检测时打印详细诊断信息
                if (window._drawImage2BlackCount === 1) {
                  console.log('[BLACKSCREEN] Detailed diagnostics:', JSON.stringify(diagnostics, null, 2));
                  console.log('[BLACKSCREEN] Possible causes:');
                  console.log('[BLACKSCREEN]   1) Shader outputs black');
                  console.log('[BLACKSCREEN]   2) Textures not sampling');
                  console.log('[BLACKSCREEN]   3) Vertices outside view frustum');
                  console.log('[BLACKSCREEN]   4) Depth test failed');
                  console.log('[BLACKSCREEN]   5) No draw calls executed');
                  console.log('[BLACKSCREEN]   6) CULL_FACE enabled (check diagnostics above)');
                  window._blackScreenMessagesPrintedDebugLog.initial = true;
                }
                
                // 自动触发修复（如果连续3次黑屏且自动修复可用）
                if (window._drawImage2BlackCount >= threshold) {
                  if (window.autoFix3DBlackScreen && !window.autoFixBlackScreenAttempted) {
                    console.log('[BLACKSCREEN] 🔧 自动尝试修复（连续' + window._drawImage2BlackCount + '次黑屏）...');
                    try {
                      window.autoFix3DBlackScreen();
                      window.autoFixBlackScreenAttempted = true;
                      window._blackScreenMessagesPrintedDebugLog.fixed = true;
                    } catch (e) {
                      console.log('[BLACKSCREEN] ❌ 自动修复函数执行失败:', e);
                    }
                  } else if (window.autoFixBlackScreenAttempted && !window._blackScreenMessagesPrintedDebugLog.fixed) {
                    console.log('[BLACKSCREEN] ⚠️ 自动修复已尝试过，但问题仍然存在。可能需要手动检查。');
                    window._blackScreenMessagesPrintedDebugLog.fixed = true;
                  }
                }
                
                console.log('[BLACKSCREEN] ========================================');
              }
            } else {
              // 重置黑屏计数（如果像素不是黑色）
              window._drawImage2BlackCount = 0;
              // 重置debugLog分支的标志
              if (window._blackScreenMessagesPrintedDebugLog) {
                window._blackScreenMessagesPrintedDebugLog.initial = false;
                window._blackScreenMessagesPrintedDebugLog.threshold = false;
                window._blackScreenMessagesPrintedDebugLog.fixed = false;
              }
            }
          } else {
            // Even without debugLog, check for black pixels and warn
            if (centerPixel.r === 0 && centerPixel.g === 0 && centerPixel.b === 0 && centerPixel.a === 255) {
              // 跟踪连续黑屏次数
              if (!window._drawImage2BlackCount) window._drawImage2BlackCount = 0;
              window._drawImage2BlackCount++;
              
              // 初始化消息打印标志
              if (!window._blackScreenMessagesPrinted) {
                window._blackScreenMessagesPrinted = {
                  initial: false,
                  functionCheck: false,
                  threshold: false,
                  fixed: false
                };
              }
              
              // 只在关键节点打印详细消息，避免刷屏
              // 使用全局标志避免与 drawElements 重复输出
              if (!window._blackScreenGlobalMessagesPrinted) {
                window._blackScreenGlobalMessagesPrinted = {
                  first: false,
                  threshold: false,
                  detailed: false,
                  autoFix: false,
                  functionCheck: false,
                  diagnoseRun: false
                };
              }
              
              const threshold = window.autoFixBlackScreenThreshold || 3;
              // 只在首次检测到黑屏或达到阈值时打印
              const shouldPrintDetails = window._drawImage2BlackCount === 1 || 
                                        window._drawImage2BlackCount === threshold;
              
              if (shouldPrintDetails) {
                // 只在首次检测时打印（全局只打印一次，避免与 drawElements 重复）
                if (window._drawImage2BlackCount === 1 && !window._blackScreenGlobalMessagesPrinted.first) {
                  console.log('[BLACKSCREEN] ========================================');
                  console.log('[BLACKSCREEN] WebGL canvas center pixel is BLACK (0,0,0,255)!');
                  console.log('[BLACKSCREEN] 连续黑屏次数:', window._drawImage2BlackCount);
                  
                  // 检查诊断和修复函数是否可用（只打印一次）
                  if (!window._blackScreenGlobalMessagesPrinted.functionCheck) {
                    const hasDiagnose = typeof window.diagnose3DBlackScreen === 'function';
                    const hasAutoFix = typeof window.autoFix3DBlackScreen === 'function';
                    
                    if (hasDiagnose) {
                      console.log('[BLACKSCREEN] 诊断函数可用');
                    } else {
                      console.log('[BLACKSCREEN] ⚠️ 诊断函数不可用');
                    }
                    
                    if (hasAutoFix) {
                      console.log('[BLACKSCREEN] 自动修复函数可用');
                    } else {
                      console.log('[BLACKSCREEN] ⚠️ 自动修复函数不可用');
                    }
                    
                    window._blackScreenGlobalMessagesPrinted.functionCheck = true;
                  }
                  
                  // 自动触发诊断（如果可用且是第一次检测，全局只运行一次）
                  const hasDiagnose = typeof window.diagnose3DBlackScreen === 'function';
                  if (hasDiagnose && !window._blackScreenGlobalMessagesPrinted.diagnoseRun) {
                    console.log('[BLACKSCREEN] 🔍 自动运行诊断（首次检测）...');
                    try {
                      window.diagnose3DBlackScreen();
                      window._blackScreenGlobalMessagesPrinted.diagnoseRun = true;
                    } catch (e) {
                      console.log('[BLACKSCREEN] ❌ 诊断函数执行失败:', e);
                    }
                  }
                  
                  console.log('[BLACKSCREEN] ========================================');
                  window._blackScreenGlobalMessagesPrinted.first = true;
                }
                
                // 自动触发修复（如果连续3次黑屏且自动修复可用，全局只运行一次）
                if (window._drawImage2BlackCount >= threshold && !window._blackScreenGlobalMessagesPrinted.threshold) {
                  const hasAutoFix = typeof window.autoFix3DBlackScreen === 'function';
                  if (hasAutoFix && !window.autoFixBlackScreenAttempted) {
                    console.log('[BLACKSCREEN] 🔧 自动尝试修复（连续' + window._drawImage2BlackCount + '次黑屏）...');
                    try {
                      window.autoFix3DBlackScreen();
                      window.autoFixBlackScreenAttempted = true;
                      window._blackScreenGlobalMessagesPrinted.autoFix = true;
                    } catch (e) {
                      console.log('[BLACKSCREEN] ❌ 自动修复函数执行失败:', e);
                    }
                  } else if (window.autoFixBlackScreenAttempted && !window._blackScreenGlobalMessagesPrinted.autoFix) {
                    console.log('[BLACKSCREEN] ⚠️ 自动修复已尝试过，但问题仍然存在。');
                    window._blackScreenGlobalMessagesPrinted.autoFix = true;
                  }
                  window._blackScreenGlobalMessagesPrinted.threshold = true;
                }
              }
              // 非关键节点完全不打印，避免刷屏
            } else {
              // 重置黑屏计数（如果像素不是黑色）
              if (window._drawImage2BlackCount > 0) {
                if (!window._blackScreenMessagesPrinted || !window._blackScreenMessagesPrinted.recovered) {
                  console.log('[BLACKSCREEN] ✅ 像素恢复正常，重置黑屏计数');
                  if (window._blackScreenMessagesPrinted) {
                    window._blackScreenMessagesPrinted.recovered = true;
                  }
                }
                // 重置所有标志，以便下次黑屏时重新打印
                window._drawImage2BlackCount = 0;
                if (window._blackScreenMessagesPrinted) {
                  window._blackScreenMessagesPrinted.initial = false;
                  window._blackScreenMessagesPrinted.threshold = false;
                  window._blackScreenMessagesPrinted.fixed = false;
                  window._blackScreenMessagesPrinted.recovered = false;
                }
              }
            }
          }
          
          // Create ImageData for the destination
          const imageData = ctx.createImageData(srcWidth, srcHeight);
          
          // Copy pixels with Y-flip (WebGL has Y=0 at bottom, Canvas has Y=0 at top)
          // WebGL readPixels reads bottom-to-top, Canvas putImageData writes top-to-bottom
          // So we ALWAYS need to flip Y to get correct orientation
          // The flipY parameter from the caller indicates additional flip request
          // flipY=1 means the caller wants normal orientation (so we flip WebGL's inverted data)
          // flipY=0 means the caller wants inverted (so we don't flip, keeping WebGL's inversion)
          
          // CRITICAL: WebGL readPixels stores pixels with Y=0 at bottom (row 0 = bottom row)
          // Canvas ImageData stores pixels with Y=0 at top (row 0 = top row)
          // So we need to flip: Canvas row 0 (top) = WebGL row (height-1) (top)
          // When flipY=true: we want normal orientation, so flip the Y axis
          // When flipY=false: we want inverted, so don't flip (but this seems wrong?)
          
          for (let row = 0; row < srcHeight; row++) {
            for (let col = 0; col < srcWidth; col++) {
              // Canvas row 'row' (0 = top) should come from WebGL row (height-1-row) (which is top in WebGL)
              // But wait: readPixels row 0 is bottom, row (height-1) is top
              // So: Canvas top row (row=0) = WebGL top row (srcRow = height-1)
              //     Canvas bottom row (row=height-1) = WebGL bottom row (srcRow = 0)
              const srcRow = flipY ? (srcHeight - 1 - row) : row;
              const srcIdx = (srcRow * srcWidth + col) * 4;
              const dstIdx = (row * srcWidth + col) * 4;
              imageData.data[dstIdx] = pixels[srcIdx];         // R
              imageData.data[dstIdx + 1] = pixels[srcIdx + 1]; // G
              imageData.data[dstIdx + 2] = pixels[srcIdx + 2]; // B
              imageData.data[dstIdx + 3] = pixels[srcIdx + 3]; // A
            }
          }
          
          // CRITICAL DIAGNOSIS: Verify flipped pixel data
          if (!window._flippedPixelsDiagnosisPrinted) {
            const flippedCenterIdx = (centerY * srcWidth + centerX) * 4;
            const flippedCenterPixel = { 
              r: imageData.data[flippedCenterIdx], 
              g: imageData.data[flippedCenterIdx+1], 
              b: imageData.data[flippedCenterIdx+2], 
              a: imageData.data[flippedCenterIdx+3] 
            };
            console.log('[DRAWIMAGE2] Y轴翻转后 - ImageData中心像素:', flippedCenterPixel);
            console.log('[DRAWIMAGE2] flipY参数:', flipY, '(true=正常方向, false=倒置)');
            console.log('[DRAWIMAGE2] 原始WebGL中心像素:', centerPixel);
            if (flippedCenterPixel.r !== centerPixel.r || flippedCenterPixel.g !== centerPixel.g || 
                flippedCenterPixel.b !== centerPixel.b || flippedCenterPixel.a !== centerPixel.a) {
              console.warn('[DRAWIMAGE2] ⚠️ 翻转后像素与原始像素不匹配！可能Y轴翻转逻辑有问题');
            }
            window._flippedPixelsDiagnosisPrinted = true;
          }
          
          // CRITICAL FIX: Write DIRECTLY to device canvas to avoid being overwritten by 2D content
          // The offscreen canvas gets overwritten by 2D UI rendering before refresh0 copies it
          // So we must write 3D content directly to the visible device canvas
          if (deviceCtx) {
            // CRITICAL: Set flag BEFORE writing to ensure refresh0 can detect it
            // This prevents race condition where refresh0 checks flag before it's set
            window.gles2JustRendered = true;
            
            deviceCtx.putImageData(imageData, 0, 0);
            
            // CRITICAL: Also set a timestamp to help debug timing issues
            window.gles2JustRenderedTime = Date.now();
            
            // CRITICAL DIAGNOSIS: Verify what was actually written to device canvas
            try {
              // Check center pixel after putImageData
              const verifyData = deviceCtx.getImageData(srcWidth/2, srcHeight/2, 1, 1).data;
              const verifyPixel = { r: verifyData[0], g: verifyData[1], b: verifyData[2], a: verifyData[3] };
              
              // Also check what should have been written (from ImageData)
              const expectedCenterIdx = (centerY * srcWidth + centerX) * 4;
              const expectedPixel = {
                r: imageData.data[expectedCenterIdx],
                g: imageData.data[expectedCenterIdx + 1],
                b: imageData.data[expectedCenterIdx + 2],
                a: imageData.data[expectedCenterIdx + 3]
              };
              
              if (!window._putImageDataDiagnosisPrinted) {
                console.log('[DRAWIMAGE2] putImageData诊断:');
                console.log('  写入位置: (0, 0), 尺寸:', srcWidth + 'x' + srcHeight);
                console.log('  ImageData中心像素 (应该写入的):', expectedPixel);
                console.log('  Device canvas中心像素 (实际读取的):', verifyPixel);
                if (verifyPixel.r !== expectedPixel.r || verifyPixel.g !== expectedPixel.g || 
                    verifyPixel.b !== expectedPixel.b || verifyPixel.a !== expectedPixel.a) {
                  console.error('[DRAWIMAGE2] ❌ 写入的像素与读取的像素不匹配！putImageData可能失败或位置错误');
                } else {
                  console.log('[DRAWIMAGE2] ✅ 写入的像素与读取的像素匹配');
                }
                window._putImageDataDiagnosisPrinted = true;
              }
              
              if (window.debugLog) {
                window.debugLog.info('DRAWIMAGE2', 'Device canvas verify pixel', verifyPixel);
                
                // 检查是否为黑色（只打印一次，避免刷屏）
                if (verifyPixel.r === 0 && verifyPixel.g === 0 && verifyPixel.b === 0) {
                  if (!window._deviceCanvasBlackMessagePrinted) {
                    window.debugLog.warn('BLACKSCREEN', 'Device canvas center pixel is BLACK!', {
                      pixel: verifyPixel,
                      sourceCenterPixel: centerPixel,
                      note: '3D content was written but appears black. Check WebGL rendering state.'
                    });
                    console.log('[BLACKSCREEN] Device canvas center pixel is BLACK after write!');
                    console.log('[BLACKSCREEN] This suggests the WebGL content itself is black.');
                    console.log('[BLACKSCREEN] Run window.diagnose3DBlackScreen() for detailed diagnostics');
                    window._deviceCanvasBlackMessagePrinted = true;
                  }
                } else {
                  // 像素恢复正常时重置标志
                  if (window._deviceCanvasBlackMessagePrinted) {
                    window._deviceCanvasBlackMessagePrinted = false;
                  }
                }
              }
            } catch (e) {
              if (window.debugLog) {
                window.debugLog.error('DRAWIMAGE2', 'Verify failed', e);
              }
              warn('[CanvasGraphics] drawImage2 - verify failed:', e);
            }
          } else {
            // Fallback to screenContext2D if no device context
            const targetCtx = window.screenContext2D || ctx;
            targetCtx.putImageData(imageData, 0, 0);
          }
          
        } catch (e) {
          // 移除调用过程日志
        }
      } else {
        // Fallback for non-WebGL source: use regular drawImage
        ctx.save();
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1.0;
        
        try {
          if (flipY) {
            ctx.translate(x + width / 2, y + height / 2);
            ctx.scale(1, -1);
            ctx.drawImage(canvasRef, sx, sy, width, height, -width / 2, -height / 2, width, height);
          } else {
            ctx.drawImage(canvasRef, sx, sy, width, height, x, y, width, height);
          }
        } catch (e) {
          throttledError('drawImage-error', '[CanvasGraphics] drawImage2 - drawImage error:', e);
        }
        
        ctx.restore();
      }
    },

    // Get RGBA data from context
    getRGBAFromCtx: function(lib, ctx, sx, sy, width, height) {
      if (!ctx) {
        return null;
      }
      
      // Get canvas dimensions
      const canvas = ctx.canvas || ctx._canvas;
      if (!canvas) {
        return null;
      }
      
      const canvasWidth = canvas.width || 0;
      const canvasHeight = canvas.height || 0;
      
      // Validate dimensions
      if (canvasWidth <= 0 || canvasHeight <= 0) {
        return null;
      }
      
      // Clamp request to canvas bounds
      if (sx < 0) { width += sx; sx = 0; }
      if (sy < 0) { height += sy; sy = 0; }
      if (sx + width > canvasWidth) { width = canvasWidth - sx; }
      if (sy + height > canvasHeight) { height = canvasHeight - sy; }
      
      if (width <= 0 || height <= 0) {
        // Return empty array instead of null to prevent NullPointerException
        return new Int8Array(0);
      }
      
      try {
        const imageData = ctx.getImageData(sx, sy, width, height);
        return new Int8Array(imageData.data.buffer);
      } catch (e) {
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
      // 移除调用过程日志
      
      let ctx = getCtx(ctxAddr);
      let canvas = getCtx(canvasAddr);
      
      // canvasAddr might be a canvas element reference from GLES2.getCanvasRef()
      if (!canvas && canvasAddr) {
        // Try to get from NativeMap
        if (typeof NativeMap !== 'undefined' && NativeMap.has && NativeMap.has(canvasAddr)) {
          canvas = NativeMap.get(canvasAddr);
        } else if (typeof J2ME !== 'undefined' && J2ME.NativeMap && J2ME.NativeMap.has(canvasAddr)) {
          canvas = J2ME.NativeMap.get(canvasAddr);
        }
      }
      
      // If canvas is a WebGL handle, get its canvas element
      if (canvas && canvas.gl && canvas.gl.canvas) {
        canvas = canvas.gl.canvas;
      }
      
      // Always try to get WebGL canvas from global GLES2Context as primary source for blitGL
      // This is the most reliable way since _create stores the context globally
      if (!canvas || !(canvas instanceof HTMLCanvasElement)) {
        if (window.GLES2Context && window.GLES2Context.gl && window.GLES2Context.gl.canvas) {
          canvas = window.GLES2Context.gl.canvas;
        } else if (window.currentGLES2Handle && window.currentGLES2Handle.gl && window.currentGLES2Handle.gl.canvas) {
          canvas = window.currentGLES2Handle.gl.canvas;
        }
      }
      
      // Handle canvas context vs canvas element
      let sourceCanvas = canvas;
      if (canvas && canvas._canvas) {
        sourceCanvas = canvas._canvas;
      } else if (canvas && canvas.canvas) {
        sourceCanvas = canvas.canvas;
      }
      
      // Fallback for ctx: if ctxAddr is 0 or ctx is null, try to use screen context
      // CRITICAL FIX: Check for falsy ctx (including 0) not just null/undefined
      if (!ctx || ctx === 0 || ctxAddr === 0 || ctxAddr === null) {
        // Try to get screen context from global
        if (window.screenContext2D) {
          ctx = window.screenContext2D;
        } else if (window.screenContextInfo && window.screenContextInfo.ctx) {
          ctx = window.screenContextInfo.ctx;
        } else if (window.screenCanvas) {
          ctx = window.screenCanvas.getContext('2d');
        }
      }
      
      if (!ctx || !sourceCanvas) {
        // As a last resort for blitGL, try to draw directly to screen canvas
        if (sourceCanvas && window.screenCanvas) {
          try {
            const screenCtx = window.screenCanvas.getContext('2d');
            if (screenCtx) {
              ctx = screenCtx;
            }
          } catch (e) {
            // 移除调用过程日志
          }
        }
        if (!ctx) {
          return;
        }
      }
      
      // Clamp source dimensions to canvas size to avoid IndexOutOfBounds
      const srcWidth = sourceCanvas.width || 0;
      const srcHeight = sourceCanvas.height || 0;
      
      // CRITICAL FIX: If w or h is 0, use source canvas dimensions
      // This happens when swapBuffers is called with targetWidth/targetHeight = 0
      if (w <= 0) {
        w = srcWidth;
      }
      if (h <= 0) {
        h = srcHeight;
      }
      
      // Adjust source coordinates if they exceed bounds
      if (sx < 0) { x -= sx; w += sx; sx = 0; }
      if (sy < 0) { y -= sy; h += sy; sy = 0; }
      if (sx + w > srcWidth) { w = srcWidth - sx; }
      if (sy + h > srcHeight) { h = srcHeight - sy; }
      
      // Skip if nothing to draw (after all adjustments)
      if (w <= 0 || h <= 0) {
        return;
      }
      
      try {
        // Pass flipY and withAlpha parameters correctly
        CanvasGraphicsNatives.drawImage2(null, ctx, sourceCanvas, sx, sy, x, y, w, h, flipY, withAlpha);
      } catch (e) {
        // 移除调用过程日志
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
          log('[CanvasGraphics] triggerRepaint - could not trigger repaint:', e);
        }
      }
    };

    Native[cgBasePath + '.getRGBAFromCtx.(Ljava/lang/Object;IIII)[B'] = function(addr, ctxAddr, sx, sy, w, h) {
      let ctx = getCtx(ctxAddr);
      let usedFallback = false;
      
      if (!ctx) {
        // CRITICAL FIX: When ctxAddr is 0/invalid, use device canvas as fallback
        // This is needed because 3D content is rendered directly to device canvas
        // and games may call getRGB to read pixel data for collision detection, etc.
        if (window.MIDP && window.MIDP.deviceContext) {
          ctx = window.MIDP.deviceContext;
          usedFallback = true;
        } else {
          const emptyArrayAddr = J2ME.newByteArray(0);
          return emptyArrayAddr;
        }
      }
      
      // CRITICAL FIX: If using fallback and dimensions are 0, use canvas dimensions
      if (usedFallback && (w <= 0 || h <= 0)) {
        const canvas = ctx.canvas;
        if (canvas) {
          w = w <= 0 ? canvas.width : w;
          h = h <= 0 ? canvas.height : h;
        }
      }
      
      const result = CanvasGraphicsNatives.getRGBAFromCtx(null, ctx, sx, sy, w, h);
      
      // CRITICAL FIX: Convert JavaScript Int8Array to proper Java byte array
      // Direct return of Int8Array doesn't work - must use J2ME.newByteArray
      if (!result || result.length === 0) {
        const emptyArrayAddr = J2ME.newByteArray(0);
        return emptyArrayAddr;
      }
      
      const arrayAddr = J2ME.newByteArray(result.length);
      const array = J2ME.getArrayFromAddr(arrayAddr);
      array.set(result);
      return arrayAddr;
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

