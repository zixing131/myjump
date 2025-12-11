package kemulator.m3g.gles2;

import java.util.*;

import kemulator.m3g.impl.*;
import kemulator.m3g.utils.*;
import pl.zb3.freej2me.bridge.gles2.BufferHelper;
import pl.zb3.freej2me.bridge.gles2.GLES2;
import pl.zb3.freej2me.bridge.graphics.CanvasGraphics;


import javax.microedition.lcdui.Graphics;
import javax.microedition.m3g.*;

public final class Emulator3D {
	private static Emulator3D instance;
	private final RenderPipe renderPipe;
	private Object target;
	private boolean depthBufferEnabled;
	private int hints;
	private static int targetWidth;
	private static int targetHeight;
	private static byte[] buffer;
	private static final Hashtable properties = new Hashtable();
	private float depthRangeNear;
	private float depthRangeFar;
	private int viewportX;
	private int viewportY;
	private int viewportWidth;
	private int viewportHeight;
	
	// Log throttling to reduce spam
	private static long lastSwapLogTime = 0;
	private static long lastClearLogTime = 0;

	public static final int MaxViewportWidth = 2048;
	public static final int MaxViewportHeight = 2048;
	public static final int MaxViewportDimension = 2048;
	public static final int NumTextureUnits = 2;
	public static final int MaxTextureDimension = 2048;
	public static final int MaxSpriteCropDimension = 1024;
	public static final int MaxLights = 8;
	public static final int MaxTransformsPerVertex = 4;
	private boolean exiting;

	private SpriteProgram spriteProgram;
	private BackgroundProgram backgroundProgram;
	private MeshProgram meshProgram;
	private ShaderProgram currentProgram;

	private BufferHelper bufferHelper;

	private boolean flatShade = false;

	private boolean noTextureFiltering = false; // CLDC doesn't support Boolean.getBoolean()

	private Transform tmpMat = new Transform();

	private Object blitTexture;
	private Object blitVAO = null;

	private Object bgVAO = null;
	private Object bgBuffer = null;
	private float[] bgBufferArray = null;

	// hyperoptimization: should we have per-sprite buffers?
	private Object spriteVAO = null;
	private Object spriteBuffer = null;
	private float[] spriteBufferArray = null;


	// optimization: UBOs..


	private Emulator3D() {
		instance = this;
		properties.put("supportAntialiasing", Boolean.TRUE);
		properties.put("supportTrueColor", Boolean.TRUE);
		properties.put("supportDithering", Boolean.TRUE);
		properties.put("supportMipmapping", new Boolean(!noTextureFiltering));
		properties.put("supportPerspectiveCorrection", Boolean.TRUE);
		properties.put("supportLocalCameraLighting", Boolean.TRUE);
		properties.put("maxLights", new Integer(MaxLights));
		properties.put("maxViewportWidth", new Integer(MaxViewportWidth));
		properties.put("maxViewportHeight", new Integer(MaxViewportHeight));
		properties.put("maxViewportDimension", new Integer(Math.min(MaxViewportDimension, MaxViewportHeight)));
		properties.put("maxTextureDimension", new Integer(MaxTextureDimension));
		properties.put("maxSpriteCropDimension", new Integer(MaxSpriteCropDimension));
		properties.put("maxTransformsPerVertex", new Integer(MaxTransformsPerVertex));
		properties.put("numTextureUnits", new Integer(NumTextureUnits));
		properties.put("coreID", "@KEmulator LWJ-OpenGL-M3G @liang.wu");

		renderPipe = new RenderPipe();
		spriteProgram = new SpriteProgram();
		backgroundProgram = new BackgroundProgram();
		meshProgram = new MeshProgram();

		bufferHelper = new BufferHelper();
	}

	public static Emulator3D getInstance() {
		if (instance == null) {
			instance = new Emulator3D();
		}

		return instance;
	}

	/*
	 * antialias setting here for easy implementation
	 * in webgl this will translate to { antialias: true } on the canvas
	 */
	public synchronized final void bindTarget(Object target, boolean antialias) {
		if (exiting) {
			// Infinite lock instead just throwing an exception
			try {
				wait();
			} catch (InterruptedException ignored) {}
			throw new IllegalStateException("exiting");
		}

		GLES2.ensure(antialias); // for webgl, here we'll need to put antialias

		int w;
		int h;

		if (target instanceof Graphics) {
			// Graphics3D.bindTarget ensures we always receive CanvasGraphics here
			// (it wraps non-CanvasGraphics in an internal buffer)
			if (!(target instanceof CanvasGraphics)) {
				throw new IllegalStateException("Expected CanvasGraphics at this point. This is an internal error.");
			}
			this.target = target;
			w = ((CanvasGraphics) this.target).getWidth();
			h = ((CanvasGraphics) this.target).getSafeHeight();
		} else {
			if (!(target instanceof Image2D)) {
				throw new IllegalArgumentException();
			}

			this.target = target;
			w = ((Image2D) this.target).getWidth();
			h = ((Image2D) this.target).getHeight();
		}

		try {
			try {
				GLES2.setSurface(w, h);
				GLES2.bind();
			} catch (Exception e) {
				e.printStackTrace();
			}

			if (targetWidth != w || targetHeight != h) {
				// this buffer doesn't need alpha
				// blending is done via OpenGL, not via the image layer
				buffer = new byte[w * h * 4];
				targetWidth = w;
				targetHeight = h;
			}

			GLES2.enable(GLES2.Constants.GL_SCISSOR_TEST);
			GLES2.pixelStorei(GLES2.Constants.GL_UNPACK_ALIGNMENT, 1);
		} catch (Exception e) {
			e.printStackTrace();
			this.target = null;
			throw new IllegalArgumentException();
		}
	}

	public synchronized void releaseTarget() {
		// Ensure we finish rendering and swap buffers before releasing
		if (this.target != null) {
			try {
				// Always call finish() to ensure all rendering is complete
				// This is safe even if bound is false, as finish() checks handle internally
				if (GLES2.bound) {
					try {
						GLES2.finish();
					} catch (Exception e) {
						System.err.println("[Emulator3D] releaseTarget - finish() failed: " + e.getMessage());
						// Continue even if finish fails
					}
				}
				// Swap buffers to copy rendered content to target
				try {
					swapBuffers();
				} catch (Exception e) {
					System.err.println("[Emulator3D] releaseTarget - swapBuffers() failed: " + e.getMessage());
					e.printStackTrace();
					// Continue to release target even if swapBuffers fails
				}
			} catch (Exception e) {
				System.err.println("[Emulator3D] releaseTarget - error during finish/swapBuffers: " + e.getMessage());
				e.printStackTrace();
				// Continue to release target even if there was an error
			}
		}

		if (exiting) {
			this.target = null;
			return;
		}

		// Always clear target and release GLES2, even if there were errors
		try {
			this.target = null;
			if (GLES2.bound) {
				GLES2.release();
			}
		} catch (Exception e) {
			System.err.println("[Emulator3D] releaseTarget - error during cleanup: " + e.getMessage());
			// Force clear target even if release fails
			this.target = null;
			GLES2.bound = false;
		}
	}

	public void swapBuffers() {
		swapBuffers(0, 0, targetWidth, targetHeight);
	}

	public final void swapBuffers(int x, int y, int width, int height) {
		// Throttle logging to reduce console spam
		long now = System.currentTimeMillis();
		boolean shouldLog = (lastSwapLogTime == 0 || now - lastSwapLogTime > 1000);
		if (shouldLog) {
			String targetName = "null";
			if (this.target != null) {
				String className = this.target.getClass().getName();
				int lastDot = className.lastIndexOf('.');
				targetName = lastDot >= 0 ? className.substring(lastDot + 1) : className;
			}
			System.out.println("[Emulator3D] swapBuffers called - x:" + x + " y:" + y + " w:" + width + " h:" + height + " target:" + targetName);
			lastSwapLogTime = now;
		}
		if (this.target != null) {
			try {
				if (this.target instanceof Image2D) {
					Image2D targetImage = (Image2D) this.target;

					// Validate buffer size before readPixels
					int requiredSize = width * height * 4; // RGBA = 4 bytes per pixel
					if (buffer == null || buffer.length < requiredSize) {
						System.err.println("[Emulator3D] swapBuffers - buffer too small, resizing. Required: " + requiredSize + ", Current: " + (buffer != null ? buffer.length : 0));
						buffer = new byte[requiredSize];
					}

					// Validate dimensions
					if (width <= 0 || height <= 0 || x < 0 || y < 0) {
						System.err.println("[Emulator3D] swapBuffers - invalid dimensions: x:" + x + " y:" + y + " w:" + width + " h:" + height);
						return;
					}

					// Ensure GLES2 context is available and bound before reading pixels
					if (GLES2.getCanvasRef() == null) {
						System.err.println("[Emulator3D] swapBuffers - GLES2 canvas not available for readPixels");
						return;
					}
					
					try {
						GLES2.readPixels(x, y, width, height, buffer);
					} catch (Exception e) {
						System.err.println("[Emulator3D] swapBuffers - readPixels failed: " + e.getMessage());
						e.printStackTrace();
						return;
					}

					if (targetImage.getFormat() == Image2D.RGBA) {
						// Flip rows while copying to the target image.
						int bitsPerColor = targetImage.getBitsPerColor();
						int expectedArraySize = width * height * bitsPerColor;
						
						// Ensure flippedBuffer has the correct size for Image2D.set()
						byte[] flippedBuffer = new byte[expectedArraySize];
						int rowSize = width * 4; // RGBA from readPixels = 4 bytes per pixel

						// Validate rowSize to prevent array bounds issues
						if (rowSize > 0 && buffer.length >= requiredSize && expectedArraySize > 0) {
							for (int row = 0; row < height; row++) {
								int srcOffset = row * rowSize;
								int dstOffset = (height - 1 - row) * rowSize;
								
								// Ensure we don't exceed buffer boundaries
								if (srcOffset + rowSize <= buffer.length && dstOffset + rowSize <= flippedBuffer.length) {
									System.arraycopy(buffer, srcOffset, flippedBuffer, dstOffset, rowSize);
								} else {
									System.err.println("[Emulator3D] swapBuffers - arraycopy bounds check failed: row=" + row + " srcOffset=" + srcOffset + " dstOffset=" + dstOffset + " rowSize=" + rowSize + " bufferLen=" + buffer.length + " flippedLen=" + flippedBuffer.length);
									// Try to copy what we can
									int copySize = Math.min(rowSize, Math.min(buffer.length - srcOffset, flippedBuffer.length - dstOffset));
									if (copySize > 0) {
										System.arraycopy(buffer, srcOffset, flippedBuffer, dstOffset, copySize);
									}
									break;
								}
							}
							
							// Validate array size before calling set()
							if (flippedBuffer.length < expectedArraySize) {
								System.err.println("[Emulator3D] swapBuffers - flippedBuffer too small. Expected: " + expectedArraySize + ", Got: " + flippedBuffer.length);
								return;
							}
						} else {
							System.err.println("[Emulator3D] swapBuffers - invalid parameters for RGBA flip. rowSize=" + rowSize + " bufferLen=" + buffer.length + " requiredSize=" + requiredSize + " expectedArraySize=" + expectedArraySize);
							return;
						}

						try {
							targetImage.set(x, y, width, height, flippedBuffer);
						} catch (Exception e) {
							System.err.println("[Emulator3D] swapBuffers - Image2D.set() failed: " + e.getMessage());
							e.printStackTrace();
						}
					} else {
						// Convert buffer to RGB format and flip rows.
						int bitsPerColor = targetImage.getBitsPerColor();
						int expectedArraySize = width * height * bitsPerColor;
						byte[] rgbData = new byte[expectedArraySize];
						int rowSize = width * 4; // RGBA from readPixels = 4 bytes per pixel
						int rgbIndex = 0;

						// Validate dimensions before conversion
						if (rowSize > 0 && buffer.length >= requiredSize && expectedArraySize > 0) {
							for (int row = 0; row < height; row++) {
								int bufferRowStart = (height - 1 - row) * rowSize;

								for (int col = 0; col < width; col++) {
									int bufferIndex = bufferRowStart + (col * 4);
									if (bufferIndex + 2 < buffer.length && rgbIndex + bitsPerColor - 1 < rgbData.length) {
										rgbData[rgbIndex++] = buffer[bufferIndex];     // Red
										if (bitsPerColor > 1) {
											rgbData[rgbIndex++] = buffer[bufferIndex + 1]; // Green
										}
										if (bitsPerColor > 2) {
											rgbData[rgbIndex++] = buffer[bufferIndex + 2]; // Blue
										}
									} else {
										System.err.println("[Emulator3D] swapBuffers - RGB conversion bounds check failed: row=" + row + " col=" + col + " bufferIndex=" + bufferIndex + " rgbIndex=" + rgbIndex + " bitsPerColor=" + bitsPerColor);
										break;
									}
								}
							}
							
							// Validate array size before calling set()
							if (rgbData.length < expectedArraySize) {
								System.err.println("[Emulator3D] swapBuffers - rgbData too small. Expected: " + expectedArraySize + ", Got: " + rgbData.length);
								return;
							}
						} else {
							System.err.println("[Emulator3D] swapBuffers - invalid parameters for RGB conversion. rowSize=" + rowSize + " bufferLen=" + buffer.length + " requiredSize=" + requiredSize + " expectedArraySize=" + expectedArraySize);
							return;
						}

						try {
							targetImage.set(x, y, width, height, rgbData);
						} catch (Exception e) {
							System.err.println("[Emulator3D] swapBuffers - Image2D.set() failed: " + e.getMessage());
							e.printStackTrace();
						}
					}
				} else if (this.target instanceof CanvasGraphics) {
					// we can't blend here, we must overwrite
					// if the overwrite hint was not specified, the img was already drawn into the internal buffer
					// just blending without doing it would break compositemode interacting with the background

					// Ensure GLES2 context is available before blitting
					// Even if bound is false, the context handle should still exist
					if (GLES2.getCanvasRef() != null) {
						// CRITICAL: Ensure all rendering commands are completed before reading from WebGL canvas
						// This ensures we get the latest rendered frame, not the previous one
						if (GLES2.bound) {
							GLES2.finish();
						}
						
						// flipY must be true because WebGL Y-axis is bottom-up while Canvas2D Y-axis is top-down
						if (shouldLog) {
							System.out.println("[Emulator3D] swapBuffers - calling blitGL on CanvasGraphics after finish()");
						}
						try {
							((CanvasGraphics) this.target).blitGL(x, y, x, y, width, height, true, false);
							if (shouldLog) {
								System.out.println("[Emulator3D] swapBuffers - blitGL completed");
							}
						} catch (Exception e) {
							System.err.println("[Emulator3D] swapBuffers - blitGL failed: " + e.getMessage());
							e.printStackTrace();
						}
					} else {
						System.err.println("[Emulator3D] swapBuffers - GLES2 canvas not available, cannot blit");
					}
				}
			} catch (Exception e) {
				System.err.println("[Emulator3D] swapBuffers - exception: " + e.getMessage());
				e.printStackTrace();
			}
		} else {
			System.out.println("[Emulator3D] swapBuffers - target is null, skipping");
		}
	}

	public final void enableDepthBuffer(boolean enabled) {
		depthBufferEnabled = enabled;
	}

	public final boolean isDepthBufferEnabled() {
		return depthBufferEnabled;
	}

	public final void setHints(int hints) {
		this.hints = hints;

		if (target != null) {
			setHintsInternal();
		}

	}

	private void setHintsInternal() {
		if ((hints & Graphics3D.DITHER) != 0) {
			GLES2.enable(GLES2.Constants.GL_DITHER);
		} else {
			GLES2.disable(GLES2.Constants.GL_DITHER);
		}
	}

	public final int getHints() {
		return hints;
	}

	public final Hashtable getProperties() {
		return properties;
	}

	public final synchronized void setDepthRange(float near, float far) {
		depthRangeNear = near;
		depthRangeFar = far;
		GLES2.depthRange(depthRangeNear, depthRangeFar);
	}

	public final synchronized void setViewport(int x, int y, int w, int h) {
		viewportX = x;
		viewportY = y;
		viewportWidth = w;
		viewportHeight = h;

		if (GLES2.bound) {
			GLES2.viewport(viewportX, targetHeight - viewportY - viewportHeight, viewportWidth, viewportHeight);
			GLES2.scissor(viewportX, targetHeight - viewportY - viewportHeight, viewportWidth, viewportHeight);
		}
	}

	public final synchronized void clearBackgound(Object bgObj) {
		Background bg = (Background) bgObj;

		GLES2.clearDepthf(1);
		GLES2.depthMask(true);
		GLES2.colorMask(true, true, true, true);

		int bgColor = bg != null ? bg.getColor() : 0;
		float r = G3DUtils.getFloatColor(bgColor, 16);
		float g = G3DUtils.getFloatColor(bgColor, 8);
		float b = G3DUtils.getFloatColor(bgColor, 0);
		float a = G3DUtils.getFloatColor(bgColor, 24);
		
		// Ensure alpha is at least 1.0 (fully opaque) if color is 0 (black)
		// This prevents clearing to fully transparent black which would show nothing
		if (bgColor == 0 && a == 0.0f) {
			a = 1.0f; // Default to opaque black instead of transparent
		}
		
		// Throttle logging to reduce console spam
		long now = System.currentTimeMillis();
		if (lastClearLogTime == 0 || now - lastClearLogTime > 1000) {
			System.out.println("[Emulator3D] clearBackgound - bgColor: 0x" + Integer.toHexString(bgColor) + " rgba: (" + r + ", " + g + ", " + b + ", " + a + ")");
			lastClearLogTime = now;
		}
		
		GLES2.clearColor(r, g, b, a);

		if (bg != null) {
			int colorClear = bg.isColorClearEnabled() ? GLES2.Constants.GL_COLOR_BUFFER_BIT : 0;
			int depthClear = depthBufferEnabled && bg.isDepthClearEnabled() ? GLES2.Constants.GL_DEPTH_BUFFER_BIT : 0;
			GLES2.clear(colorClear | depthClear);

			drawBackgroundImage(bg);
		} else {
			GLES2.clear(GLES2.Constants.GL_COLOR_BUFFER_BIT | (depthBufferEnabled ? GLES2.Constants.GL_DEPTH_BUFFER_BIT : 0));
		}
	}

	private void drawBackgroundImage(Background bg) {
		if (bg == null || bg.getImage() == null || bg.getCropWidth() <= 0 || bg.getCropHeight() <= 0) return;

		GLES2.disable(GLES2.Constants.GL_CULL_FACE); // we can't rely on frontFace/cullFace settings
		GLES2.disable(GLES2.Constants.GL_BLEND);
		GLES2.depthFunc(GLES2.Constants.GL_ALWAYS);
		GLES2.depthMask(false);

		useProgram(backgroundProgram);

		if (bgVAO == null) {
			bgVAO = GLES2.createVertexArray();
			GLES2.bindVertexArray(bgVAO);

			bgBuffer = GLES2.createBuffer();
			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, bgBuffer);
			GLES2.bufferData(GLES2.Constants.GL_ARRAY_BUFFER, 16*4, GLES2.Constants.GL_DYNAMIC_DRAW);

			bgBufferArray = new float[] {
				// positions
				1, 1,
				0, 1,
				1, 0,
				0, 0,

				// uv rect - to be filled
				0, 0,
				0, 0,
				0, 0,
				0, 0
			};

			GLES2.enableVertexAttribArray(backgroundProgram.aPos);
			GLES2.enableVertexAttribArray(backgroundProgram.aNormalizedUV);

			GLES2.vertexAttribPointer(backgroundProgram.aPos, 2, GLES2.Constants.GL_FLOAT, false, 0, 0);
			GLES2.vertexAttribPointer(backgroundProgram.aNormalizedUV, 2, GLES2.Constants.GL_FLOAT, false, 0, 32);
		} else {
			GLES2.bindVertexArray(bgVAO);
		}

		float imgWidth = bg.getImage().getWidth();
		float imgHeight = bg.getImage().getHeight();

		float[] uvRect = new float[] {
			bg.getCropX() / imgWidth, bg.getCropY() / imgHeight,
			(bg.getCropX() + bg.getCropWidth()) / imgWidth,
			(bg.getCropY() + bg.getCropHeight()) / imgHeight
		};

		// check if uvRect matches currently uploaded buffer values
		if (uvRect[0] != bgBufferArray[8 + 2] ||
		    uvRect[1] != bgBufferArray[8 + 1] ||
			uvRect[2] != bgBufferArray[8 + 0] ||
			uvRect[3] != bgBufferArray[8 + 5]) {
			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, bgBuffer);

			bgBufferArray[8 + 0] = uvRect[2]; bgBufferArray[8 + 1] = uvRect[1];
			bgBufferArray[8 + 2] = uvRect[0]; bgBufferArray[8 + 3] = uvRect[1];
			bgBufferArray[8 + 4] = uvRect[2]; bgBufferArray[8 + 5] = uvRect[3];
			bgBufferArray[8 + 6] = uvRect[0]; bgBufferArray[8 + 7] = uvRect[3];

			GLES2.bufferSubData(GLES2.Constants.GL_ARRAY_BUFFER, 0, 16*4, bgBufferArray);
		}

		GLES2.uniform1i(backgroundProgram.uRepeatX, bg.getImageModeX() == Background.REPEAT ? 1 : 0);
		GLES2.uniform1i(backgroundProgram.uRepeatY, bg.getImageModeY() == Background.REPEAT ? 1 : 0);

		GLES2.activeTexture(GLES2.Constants.GL_TEXTURE0);

		useTexture(bg.getImage());

		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MIN_FILTER, GLES2.Constants.GL_NEAREST);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MAG_FILTER, GLES2.Constants.GL_NEAREST);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_S, GLES2.Constants.GL_CLAMP_TO_EDGE);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_T, GLES2.Constants.GL_CLAMP_TO_EDGE);

		ensureTextureLoaded(bg.getImage(), true);

		GLES2.uniform1i( backgroundProgram.uTexture, 0); // Texture unit 0

		GLES2.drawArrays(GLES2.Constants.GL_TRIANGLE_STRIP, 0, 4);

		GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, null);

		GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, null);

		// GLES2.bindVertexArray(null);
		// everything happens inside while one of these is bound, so no need to unbind

		useFP();

	}

	public void blitBackground() { // eyy.. rushed, check this..
		if (!(target instanceof Graphics)) return;

		GLES2.disable(GLES2.Constants.GL_CULL_FACE); // we can't rely on frontFace/cullFace settings
		GLES2.disable(GLES2.Constants.GL_BLEND);
		GLES2.depthFunc(GLES2.Constants.GL_ALWAYS);
		GLES2.depthMask(false); // possibly we'd not want it and write via gl_Position
		                             // but that's one call anyway
		useProgram(backgroundProgram);

		if (blitVAO == null) {
			blitVAO = GLES2.createVertexArray();
			GLES2.bindVertexArray(blitVAO);

			Object blitBuffer = GLES2.createBuffer();
			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, blitBuffer);
			GLES2.bufferData(GLES2.Constants.GL_ARRAY_BUFFER, 16*4, GLES2.Constants.GL_STATIC_DRAW);

			float[] bufferBuffer = new float[] {
				// positions
				1, 1,
				0, 1,
				1, 0,
				0, 0,

				// uv rect
				1, 0,
				0, 0,
				1, 1,
				0, 1
			};

			GLES2.bufferSubData(GLES2.Constants.GL_ARRAY_BUFFER, 0, 16*4, bufferBuffer);

			GLES2.enableVertexAttribArray(backgroundProgram.aPos);
			GLES2.enableVertexAttribArray(backgroundProgram.aNormalizedUV);

			GLES2.vertexAttribPointer(backgroundProgram.aPos, 2, GLES2.Constants.GL_FLOAT, false, 0, 0);
			GLES2.vertexAttribPointer(backgroundProgram.aNormalizedUV, 2, GLES2.Constants.GL_FLOAT, false, 0, 32);
		} else {
			GLES2.bindVertexArray(blitVAO);
		}

		GLES2.uniform1i(backgroundProgram.uRepeatX, 0);
		GLES2.uniform1i(backgroundProgram.uRepeatY, 0);

		GLES2.activeTexture(GLES2.Constants.GL_TEXTURE0);

		if (blitTexture == null) {
			blitTexture = GLES2.createTexture();
		}
		GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, blitTexture);

		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MIN_FILTER, GLES2.Constants.GL_NEAREST);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MAG_FILTER, GLES2.Constants.GL_NEAREST);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_S, GLES2.Constants.GL_CLAMP_TO_EDGE);
		GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_T, GLES2.Constants.GL_CLAMP_TO_EDGE);

		GLES2.texImageFromGraphics((CanvasGraphics)target, 0, 0, targetWidth, targetHeight);

		GLES2.uniform1i( backgroundProgram.uTexture, 0); // Texture unit 0

		GLES2.drawArrays(GLES2.Constants.GL_TRIANGLE_STRIP, 0, 4);

		GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, null);

		// GLES2.bindVertexArray(null);
		// everything happens inside while one of these is bound, so no need to unbind

		useFP();
	}

	private void setupCamera() {
		if (CameraCache.camera != null) {
			GLES2.uniformMatrix4fv(meshProgram.uProjectionMatrix, true, CameraCache.camera.getProjectionMatrixElements());

			GLES2.uniformMatrix4fv(meshProgram.uViewMatrix, true, ((Transform3D) CameraCache.invCam.getImpl()).m_matrix);
		} else {
			throw new RuntimeException("camera cache null?");
		}
	}

	private void setupLights(Vector lights, Vector lightMats, int scope) {
		int usedLights = 0;

		for (int i = 0; i < lights.size() && usedLights < MaxLights; ++i) {
			Light light = (Light) lights.elementAt(i);

			if (light == null || (light.getScope() & scope) == 0 || !renderPipe.isVisible(light)) {
				continue;
			}

			int lightId = usedLights;
			usedLights++;

			Transform lightMat = (Transform) lightMats.elementAt(i);

			// the actual position is defined via matrix.. see it this is optimal
			GLES2.uniformMatrix4fv(meshProgram.uLMatrix[lightId], true, ((Transform3D) lightMat.getImpl()).m_matrix);

			float[] tmpLightPos;
			if (light.getMode() == Light.DIRECTIONAL) {
				tmpLightPos = LightsCache.POSITIVE_Z_AXIS; //light direction!
			} else {
				tmpLightPos = LightsCache.LOCAL_ORIGIN;
			}

			GLES2.uniform4fv(meshProgram.uLPosition[lightId], tmpLightPos);

			float[] defaultColor = new float[]{0, 0, 0, 1}; //rgba

			float[] lightColor = new float[]{0, 0, 0, 1}; //rgba
			G3DUtils.fillFloatColor(lightColor, light.getColor());
			float lightIntensity = light.getIntensity();
			lightColor[0] *= lightIntensity;
			lightColor[1] *= lightIntensity;
			lightColor[2] *= lightIntensity;
			lightColor[3] = 1.0F;

			int lightMode = light.getMode();

			GLES2.uniform4fv(meshProgram.uLAmbient[lightId],
				(lightMode == Light.AMBIENT) ? lightColor : defaultColor
			);
			GLES2.uniform4fv(meshProgram.uLDiffuse[lightId],
				(lightMode == Light.AMBIENT) ? defaultColor : lightColor
			);
			GLES2.uniform4fv(meshProgram.uLSpecular[lightId],
				(lightMode == Light.AMBIENT) ? defaultColor : lightColor
			);

			GLES2.uniform1f(meshProgram.uLConstAtt[lightId],
				(lightMode == Light.SPOT || lightMode == Light.OMNI) ? light.getConstantAttenuation() : 1.0f
			);
			GLES2.uniform1f(meshProgram.uLLinAtt[lightId],
				(lightMode == Light.SPOT || lightMode == Light.OMNI) ? light.getLinearAttenuation() : 0.0f
			);
			GLES2.uniform1f(meshProgram.uLQuadAtt[lightId],
				(lightMode == Light.SPOT || lightMode == Light.OMNI) ? light.getQuadraticAttenuation() : 0.0f
			);

			if (lightMode == Light.SPOT) {
				GLES2.uniform3fv(meshProgram.uLDirection[lightId],
					LightsCache.NEGATIVE_Z_AXIS // actual direction is from the matrix
				);
				GLES2.uniform1f(meshProgram.uLSpotCutoffCos[lightId],
					(float)Math.cos(Math.toRadians(light.getSpotAngle()))
				);
				GLES2.uniform1f(meshProgram.uLShininess[lightId],
					light.getSpotExponent()
				);
			} else {
				GLES2.uniform1f(meshProgram.uLSpotCutoffCos[lightId], -1.0f);
			}
		}

		GLES2.uniform1i(meshProgram.uUsedLights, usedLights);

	}

	public final void render(VertexBuffer vb, IndexBuffer ib, Appearance ap, Transform trans, int scope) {
		renderVertex(vb, ib, ap, trans, scope, 1.0F);
	}

	private synchronized void renderVertex(VertexBuffer vb, IndexBuffer ib, Appearance ap, Transform trans, int scope, float alphaFactor) {
		if ((CameraCache.camera.getScope() & scope) != 0) {
			useProgram(meshProgram);

			GLES2.uniform1f(meshProgram.uAlphaFactor, alphaFactor);

			setupCamera();

			GLES2.uniformMatrix4fv(meshProgram.uModelMatrix, true, ((Transform3D) trans.getImpl()).m_matrix);

			setupAppearance(ap, false);
			if (ap.getMaterial() != null) {
				setupLights(LightsCache.m_lights, LightsCache.m_lightsTransform, scope);
			}

			draw(vb, ib, ap);

			useFP();
		}
	}

	private void setupAppearance(Appearance ap, boolean spriteMode) {
		if (!spriteMode) {
			setupPolygonMode(ap.getPolygonMode());
		}

		setupCompositingMode(ap.getCompositingMode());
		if (!spriteMode) {
			setupMaterial(ap.getMaterial());
		}

		setupFog(ap.getFog());
	}

	private void setupPolygonMode(PolygonMode pm) {
		if (pm == null) {
			pm = new PolygonMode();
		}

		int var1 = pm.getCulling();
		if (var1 == PolygonMode.CULL_NONE) {
			GLES2.disable(GLES2.Constants.GL_CULL_FACE);
		} else {
			GLES2.enable(GLES2.Constants.GL_CULL_FACE);
			GLES2.cullFace(var1 == PolygonMode.CULL_FRONT ? GLES2.Constants.GL_FRONT : GLES2.Constants.GL_BACK);
		}

		flatShade = pm.getShading() == PolygonMode.SHADE_FLAT;
		GLES2.frontFace(pm.getWinding() == PolygonMode.WINDING_CW ? GLES2.Constants.GL_CW : GLES2.Constants.GL_CCW);


		GLES2.uniform1i(meshProgram.uIsTwoSided, pm.isTwoSidedLightingEnabled() ? 1 : 0);
		GLES2.uniform1i(meshProgram.uIsLocalViewer, pm.isLocalCameraLightingEnabled() ? 1 : 0);

		// note perspective correction should always work
	}

	private void setupCompositingMode(CompositingMode cm) {
		if (cm == null) {
			cm = new CompositingMode();
		}

		if (depthBufferEnabled) {
			GLES2.enable(GLES2.Constants.GL_DEPTH_TEST);
		} else {
			GLES2.disable(GLES2.Constants.GL_DEPTH_TEST);
		}

		GLES2.depthMask(cm.isDepthWriteEnabled());
		GLES2.depthFunc(cm.isDepthTestEnabled() ? GLES2.Constants.GL_LEQUAL : GLES2.Constants.GL_ALWAYS);
		GLES2.colorMask(cm.isColorWriteEnabled(), cm.isColorWriteEnabled(), cm.isColorWriteEnabled(), cm.isAlphaWriteEnabled());

		GLES2.uniform1f(((ICommonShader)currentProgram).uMinAlpha(), cm.getAlphaThreshold());

		if (cm.getBlending() == CompositingMode.REPLACE) {
			GLES2.disable(GLES2.Constants.GL_BLEND);
		} else {
			GLES2.enable(GLES2.Constants.GL_BLEND);
		}

		switch (cm.getBlending()) {
			case CompositingMode.ALPHA:
				GLES2.blendFunc(GLES2.Constants.GL_SRC_ALPHA, GLES2.Constants.GL_ONE_MINUS_SRC_ALPHA);
				break;
			case CompositingMode.ALPHA_ADD:
				GLES2.blendFunc(GLES2.Constants.GL_SRC_ALPHA, GLES2.Constants.GL_ONE);
				break;
			case CompositingMode.MODULATE:
				GLES2.blendFunc(GLES2.Constants.GL_DST_COLOR, GLES2.Constants.GL_ZERO);
				break;
			case CompositingMode.MODULATE_X2:
				GLES2.blendFunc(GLES2.Constants.GL_DST_COLOR, GLES2.Constants.GL_SRC_COLOR);
				break;
			case CompositingMode.REPLACE:
				GLES2.blendFunc(GLES2.Constants.GL_ONE, GLES2.Constants.GL_ZERO);
				break;
			default:
				break;
		}

		// polygon offset is supported in webgl
		GLES2.polygonOffset(cm.getDepthOffsetFactor(), cm.getDepthOffsetUnits());
		if (cm.getDepthOffsetFactor() == 0.0F && cm.getDepthOffsetUnits() == 0.0F) {
			GLES2.disable(GLES2.Constants.GL_POLYGON_OFFSET_FILL);
		} else {
			GLES2.enable(GLES2.Constants.GL_POLYGON_OFFSET_FILL);
		}


	}

	private void setupMaterial(Material mat) {
		GLES2.uniform1i(meshProgram.uUseLighting, (mat != null) ? 1 : 0);

		if (mat != null) {
			GLES2.uniform1i(meshProgram.uTrackVertexColors, mat.isVertexColorTrackingEnabled() ? 1 : 0);

			float[] tmpCol = new float[4];

			G3DUtils.fillFloatColor(tmpCol, mat.getColor(Material.AMBIENT));
			GLES2.uniform4f(meshProgram.uMAmbient, tmpCol[0], tmpCol[1], tmpCol[2], tmpCol[3]);

			G3DUtils.fillFloatColor(tmpCol, mat.getColor(Material.DIFFUSE));
			GLES2.uniform4f(meshProgram.uMDiffuse, tmpCol[0], tmpCol[1], tmpCol[2], tmpCol[3]);

			G3DUtils.fillFloatColor(tmpCol, mat.getColor(Material.EMISSIVE));
			GLES2.uniform4f(meshProgram.uMEmissive, tmpCol[0], tmpCol[1], tmpCol[2], tmpCol[3]);

			G3DUtils.fillFloatColor(tmpCol, mat.getColor(Material.SPECULAR));
			GLES2.uniform4f(meshProgram.uMSpecular, tmpCol[0], tmpCol[1], tmpCol[2], tmpCol[3]);

			GLES2.uniform1f(meshProgram.uMShininess, mat.getShininess());
		}
	}

	private void setupFog(Fog fog) {
		if (currentProgram != null) {
			ICommonShader cs = (ICommonShader)currentProgram;
			if (fog != null) {
				if (fog.getMode() == Fog.LINEAR) {
					GLES2.uniform1i(cs.uFogType(), 1);
					GLES2.uniform1f(cs.uFogStartOrDensity(), fog.getNearDistance());
					GLES2.uniform1f(cs.uFogEnd(), fog.getFarDistance());
				} else {
					GLES2.uniform1i(cs.uFogType(), 2);
					GLES2.uniform1f(cs.uFogStartOrDensity(), fog.getDensity());
				}

				float[] fogColor = new float[4];
				G3DUtils.fillFloatColor(fogColor, fog.getColor());
				GLES2.uniform4f(cs.uFogColor(), fogColor[0], fogColor[1], fogColor[2], fogColor[3]);
			} else {
				GLES2.uniform1i(cs.uFogType(), 0);
			}

		} else {
			throw new IllegalStateException("no program");
		}
	}

	private void draw(VertexBuffer vb, IndexBuffer indices, Appearance ap) {
		// this uploads and binds a correct VAO
		vb.uploadToGL(indices, flatShade, ap.getMaterial() != null, meshProgram, bufferHelper);

		float[] scaleBias = new float[4];
		VertexArray positions = vb.getPositions(scaleBias);

		GLES2.uniform1i(meshProgram.uIsFlatShaded, flatShade ? 1 : 0);
		GLES2.uniform4f(meshProgram.uVPosSb, scaleBias[1], scaleBias[2], scaleBias[3], scaleBias[0]);


		if (ap != null) {
			int usedTextures = 0;

			for (int i = 0; i < NumTextureUnits; ++i) {
				Texture2D texture2D = ap.getTexture(i);
				scaleBias[3] = 0.0F;
				VertexArray texCoords = vb.getTexCoords(i, scaleBias);

				if (texture2D == null || texCoords == null) continue;

				int textureIdx = usedTextures++;

				Image2D image2D = texture2D.getImage();

				GLES2.activeTexture(GLES2.Constants.GL_TEXTURE0 + textureIdx);

				Object glTexture = useTexture(image2D); // calls bind but on acivetexture

				GLES2.uniform1i(meshProgram.uBlendMode[textureIdx], texture2D.getBlending());


				float[] blendColor = new float[4];
				G3DUtils.fillFloatColor(blendColor, texture2D.getBlendColor());
				blendColor[3] = 1.0F;

				GLES2.uniform4f(meshProgram.uBlendColor[textureIdx], blendColor[0], blendColor[1], blendColor[2], blendColor[3]);


				ensureTextureLoaded(image2D);

				boolean hasColor = true, hasAlpha = true;

				switch (image2D.getFormat()) {
					case Image2D.ALPHA:
						hasColor = false;
						break;
					case Image2D.LUMINANCE:
						hasAlpha = false;
						break;
					case Image2D.RGB:
						hasAlpha = false;
						break;
				}

			GLES2.uniform1i(meshProgram.uHasColor[textureIdx], hasColor ? 1 : 0);
			GLES2.uniform1i(meshProgram.uHasAlpha[textureIdx], hasAlpha ? 1 : 0);



			GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_S,
					texture2D.getWrappingS() == Texture2D.WRAP_CLAMP ? GLES2.Constants.GL_CLAMP_TO_EDGE : GLES2.Constants.GL_REPEAT
			);
			GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_T,
					texture2D.getWrappingT() == Texture2D.WRAP_CLAMP ? GLES2.Constants.GL_CLAMP_TO_EDGE : GLES2.Constants.GL_REPEAT
			);

				int levelFilter = texture2D.getLevelFilter();
				int imageFilter = texture2D.getImageFilter();

				int magFilter = GLES2.Constants.GL_NEAREST, minFilter = GLES2.Constants.GL_NEAREST;

				if (!noTextureFiltering) {
					if (imageFilter == Texture2D.FILTER_NEAREST) {
						minFilter = magFilter = GLES2.Constants.GL_NEAREST;

						if (levelFilter == Texture2D.FILTER_NEAREST) minFilter = GLES2.Constants.GL_NEAREST_MIPMAP_NEAREST;
						else if (levelFilter == Texture2D.FILTER_LINEAR) minFilter = GLES2.Constants.GL_NEAREST_MIPMAP_LINEAR;
					} else if (imageFilter == Texture2D.FILTER_LINEAR) {
						minFilter = magFilter = GLES2.Constants.GL_LINEAR;

						if (levelFilter == Texture2D.FILTER_NEAREST) minFilter = GLES2.Constants.GL_LINEAR_MIPMAP_NEAREST;
						else if (levelFilter == Texture2D.FILTER_LINEAR) minFilter = GLES2.Constants.GL_LINEAR_MIPMAP_LINEAR;
					}
				}

				GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MIN_FILTER, minFilter);
				GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MAG_FILTER, magFilter);

				if (!noTextureFiltering) {
					GLES2.toggleAnisotropy(imageFilter == Texture2D.FILTER_LINEAR);
				}

				// Bind the texture for use in the shader
				GLES2.uniform1i(meshProgram.uTexture[textureIdx], textureIdx); // Texture unit 0
				GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, glTexture);

				// not normalized
				texture2D.getCompositeTransform(tmpMat);

				tmpMat.postTranslate(scaleBias[1], scaleBias[2], scaleBias[3]);
				tmpMat.postScale(scaleBias[0], scaleBias[0], scaleBias[0]);

				GLES2.uniformMatrix4fv(meshProgram.uVCoordsMat[textureIdx], true, ((Transform3D) tmpMat.getImpl()).m_matrix);
			}

			GLES2.uniform1i(meshProgram.uUsedTextures, usedTextures);


			TriangleStripArray triangleStripArray = (TriangleStripArray) indices;

			if (flatShade) {
				GLES2.drawArrays(GLES2.Constants.GL_TRIANGLES, 0, positions.getExplodedVertexCount());
			} else {
				int[] triangles = triangleStripArray.getTriangles();
				GLES2.drawElements(GLES2.Constants.GL_TRIANGLE_STRIP, triangles.length, GLES2.Constants.GL_UNSIGNED_SHORT, 0);
				// don't unbind GLES2.Constants.GL_ELEMENT_ARRAY_BUFFER, we bind it via VAO
			}


			/*for (int i = 0; i < usedTextures; ++i) {
				GLES2.activeTexture(GLES2.Constants.GL_TEXTURE0 + i);
				GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, null);

			}*/
		} else {
			throw new IllegalStateException("appearance is null?");
		}

		// GLES2.bindVertexArray(null);
		// everything happens inside while one of these is bound, so no need to unbind

		GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, null);

	}


	public synchronized void render(World world) {
		Transform camTrans = new Transform();
		world.getActiveCamera().getTransformTo(world, camTrans);
		CameraCache.setCamera(world.getActiveCamera(), camTrans);

		clearBackgound(world.getBackground());
		LightsCache.addLightsFromWorld(world);
		renderPipe.pushRenderNode(world, null);

		renderPushedNodes();
	}

	public synchronized void render(Node node, Transform transform) {
		renderPipe.pushRenderNode(node, transform);
		renderPushedNodes();
	}

	private void renderPushedNodes() {
		renderPipe.sortNodes();

		for (int i = 0; i < renderPipe.getSize(); i++) {
			RenderObject ro = renderPipe.getRenderObj(i);

			if (ro.node instanceof Mesh) {
				Mesh mesh = (Mesh) ro.node;
				IndexBuffer indices = mesh.getIndexBuffer(ro.submeshIndex);
				Appearance ap = mesh.getAppearance(ro.submeshIndex);

				if (indices != null && ap != null) {
					VertexBuffer vb = MeshMorph.getInstance().getMorphedVertexBuffer(mesh);
					renderVertex(vb, indices, ap, ro.trans, mesh.getScope(), ro.alphaFactor);
				}
			} else {
				renderSprite((Sprite3D) ro.node, ro.trans, ro.alphaFactor);
			}
		}

		renderPipe.clear();
		MeshMorph.getInstance().clearCache();
		
		// Ensure all rendering commands are submitted to GPU
		// This helps ensure the latest frame is ready when swapBuffers is called
		if (GLES2.bound) {
			// Note: We don't call finish() here because it would block and slow down rendering
			// finish() is called in releaseTarget() and swapBuffers() when needed
		}
	}

	private void renderSprite(Sprite3D sprite, Transform spriteTransform, float alphaFactor) {
		if (!G3DUtils.intersectRectangle(sprite.getCropX(), sprite.getCropY(), Math.abs(sprite.getCropWidth()), Math.abs(sprite.getCropHeight()), 0, 0, sprite.getImage().getWidth(), sprite.getImage().getHeight(), null)) {
			return;
		}

		// Define initial vectors for 3D coordinates (homogeneous coordinates with w=1.0).
		float[] origin = new float[]{0.0F, 0.0F, 0.0F, 1.0F};  // Origin point (0, 0, 0)
		float[] rightDirection = new float[]{1.0F, 0.0F, 0.0F, 1.0F};  // Point along x-axis (1, 0, 0)
		float[] upDirection = new float[]{0.0F, 1.0F, 0.0F, 1.0F};  // Point along y-axis (0, 1, 0)

		// Combine the camera's inverse transformation with the sprite's transformation
		Transform combinedTransform = new Transform(CameraCache.invCam);
		combinedTransform.postMultiply(spriteTransform);

		// Apply the combined transformation to the 3D coordinates
		Transform3D impl = (Transform3D) combinedTransform.getImpl();
		impl.transform(origin);
		impl.transform(rightDirection);
		impl.transform(upDirection);

		// Copy the transformed origin for future use
		float[] transformedOrigin = new float[]{origin[0], origin[1], origin[2], origin[3]};

		// Normalize the coordinates by their 'w' component (perspective division)
		Vector4f.mul(origin, 1.0F / origin[3]);
		Vector4f.mul(rightDirection, 1.0F / rightDirection[3]);
		Vector4f.mul(upDirection, 1.0F / upDirection[3]);

		// Calculate direction vectors relative to the origin
		Vector4f.sub(rightDirection, origin);
		Vector4f.sub(upDirection, origin);

		// Compute the lengths of the directional vectors (scaled in x and y)
		float[] scaledX = new float[]{Vector4f.length(rightDirection), 0.0F, 0.0F, 0.0F};
		float[] scaledY = new float[]{0.0F, Vector4f.length(upDirection), 0.0F, 0.0F};

		// Add the scaled vectors back to the transformed origin to get final screen-space positions
		Vector4f.add(scaledX, transformedOrigin);
		Vector4f.add(scaledY, transformedOrigin);

		// Get the camera's projection transform and apply it to the screen-space positions
		Transform projectionTransform = new Transform();
		CameraCache.camera.getProjection(projectionTransform);
		impl = (Transform3D) projectionTransform.getImpl();
		impl.transform(transformedOrigin);
		impl.transform(scaledX);
		impl.transform(scaledY);

		// Check if the sprite is in front of the camera (z/w ratio check)
		if (transformedOrigin[3] > 0.0F && -transformedOrigin[3] < transformedOrigin[2] && transformedOrigin[2] <= transformedOrigin[3]) {
			// Normalize again after projection
			Vector4f.mul(transformedOrigin, 1.0F / transformedOrigin[3]);
			Vector4f.mul(scaledX, 1.0F / scaledX[3]);
			Vector4f.mul(scaledY, 1.0F / scaledY[3]);

			// Adjust directions for screen-space (after projection)
			Vector4f.sub(scaledX, transformedOrigin);
			Vector4f.sub(scaledY, transformedOrigin);

			// what is scaledX and scaledY?
			// these are the width/height of an "3d unit" in clip space

			// Check if sprite needs to be scaled
			boolean isSpriteScaled = sprite.isScaled();

			// crop affects UVs and for unscaled sprites it also affects their size
			// btw looks like scaled sprites are always squares..
			float[] uvRect = new float[]{
				sprite.getCropX()/(float)sprite.getImage().getWidth(),
			    sprite.getCropY()/(float)sprite.getImage().getHeight(),
				(sprite.getCropX() + (sprite.getCropWidth() < 0 ? sprite.getImage().getWidth() : 0) + sprite.getCropWidth())/(float)sprite.getImage().getWidth(),
			    (sprite.getCropY() + (sprite.getCropHeight() < 0 ? sprite.getImage().getHeight() : 0) + sprite.getCropHeight())/(float)sprite.getImage().getHeight(),
			};

			float scaleX, scaleY;

			if (!isSpriteScaled) {
				// these represent physical pixels on the screen
				// thus need to be normalized using current viewport area
				scaleX = Math.abs(sprite.getCropWidth());
				scaleY = Math.abs(sprite.getCropHeight());

				// turn to NDC
				scaleX = scaleX*2 / this.viewportWidth;
				scaleY = scaleY*2 / this.viewportHeight;
			} else {
				// these are in ndc for units
				scaleX = Vector4f.length(scaledX);
				scaleY = Vector4f.length(scaledY);
			}

			useProgram(spriteProgram);

			if (spriteVAO == null) {
				spriteVAO = GLES2.createVertexArray();
				GLES2.bindVertexArray(spriteVAO);

				spriteBuffer = GLES2.createBuffer();
				GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, spriteBuffer);
				GLES2.bufferData(GLES2.Constants.GL_ARRAY_BUFFER, 12*4, GLES2.Constants.GL_DYNAMIC_DRAW);

				spriteBufferArray = new float[] {
					// vertex id
					0, 1, 2, 3,

					// uv rect - to be filled
					0, 0,
					0, 0,
					0, 0,
					0, 0
				};

				GLES2.enableVertexAttribArray(spriteProgram.aUV);
				GLES2.enableVertexAttribArray(spriteProgram.aVertexID);

				GLES2.vertexAttribPointer(spriteProgram.aVertexID, 1, GLES2.Constants.GL_FLOAT, false, 0, 0);
				GLES2.vertexAttribPointer(spriteProgram.aUV, 2, GLES2.Constants.GL_FLOAT, false, 0, 16);
			} else {
				GLES2.bindVertexArray(spriteVAO);
			}

			// check if uvRect matches currently uploaded buffer values
			if (uvRect[0] != spriteBufferArray[4 + 2] ||
				uvRect[1] != spriteBufferArray[4 + 1] ||
				uvRect[2] != spriteBufferArray[4 + 0] ||
				uvRect[3] != spriteBufferArray[4 + 5]) {
				GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, spriteBuffer);

				spriteBufferArray[4 + 0] = uvRect[2]; spriteBufferArray[4 + 1] = uvRect[1];
				spriteBufferArray[4 + 2] = uvRect[0]; spriteBufferArray[4 + 3] = uvRect[1];
				spriteBufferArray[4 + 4] = uvRect[2]; spriteBufferArray[4 + 5] = uvRect[3];
				spriteBufferArray[4 + 6] = uvRect[0]; spriteBufferArray[4 + 7] = uvRect[3];

				GLES2.bufferSubData(GLES2.Constants.GL_ARRAY_BUFFER, 0, 12*4, spriteBufferArray);
			}

			this.setupAppearance(sprite.getAppearance(), true);


			GLES2.uniformMatrix4fv(spriteProgram.uProjectionMatrix, true, ((Transform3D) projectionTransform.getImpl()).m_matrix);
			GLES2.uniformMatrix4fv(spriteProgram.uModelViewMatrix, true, ((Transform3D) combinedTransform.getImpl()).m_matrix);

			GLES2.uniform1f(spriteProgram.uScaleX, scaleX);
			GLES2.uniform1f(spriteProgram.uScaleY, scaleY);
			GLES2.uniform1f(spriteProgram.uAlphaFactor, alphaFactor);

			// we have "infra" for texture ids.. they're persistend, loaded on demand
			// ids are reserved and content can be invalidated

			Object texture = useTexture(sprite.getImage());

			// Set texture parameters
            GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MIN_FILTER, GLES2.Constants.GL_NEAREST);
		    GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_MAG_FILTER, GLES2.Constants.GL_NEAREST);
			GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_S, GLES2.Constants.GL_CLAMP_TO_EDGE);
			GLES2.texParameteri(GLES2.Constants.GL_TEXTURE_2D, GLES2.Constants.GL_TEXTURE_WRAP_T, GLES2.Constants.GL_CLAMP_TO_EDGE);

			ensureTextureLoaded(sprite.getImage());

			// Bind the texture for use in the shader
			GLES2.uniform1i(spriteProgram.uTexture, 0); // Texture unit 0
			GLES2.activeTexture(GLES2.Constants.GL_TEXTURE0);
			GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, texture);


			// Draw the sprite as a triangle strip (rendered as screen-space pixels)
			GLES2.drawArrays(GLES2.Constants.GL_TRIANGLE_STRIP, 0, 4);

			GLES2.bindBuffer(GLES2.Constants.GL_ARRAY_BUFFER, null);
			// GLES2.bindVertexArray(null);
			// everything happens inside while one of these is bound, so no need to unbind



			useFP();
		}
	}


	public Object useTexture(Image2D image2D) {
		Object texture = image2D.getTexture();
		if (texture == null) {
			texture = GLES2.createTexture();
			image2D.setTexture(texture);
		}
		GLES2.bindTexture(GLES2.Constants.GL_TEXTURE_2D, texture);
		return texture;
	}

	public void ensureTextureLoaded(Image2D image2D) {
		ensureTextureLoaded(image2D, false);
	}

	public void ensureTextureLoaded(Image2D image2D, boolean skipMipmaps) {
		if (!image2D.isLoaded()) {
			image2D.setLoaded(true);

			short texFormat = GLES2.Constants.GL_RGB;
			switch (image2D.getFormat()) {
				case Image2D.ALPHA:
					texFormat = GLES2.Constants.GL_ALPHA;
					break;
				case Image2D.LUMINANCE:
					texFormat = GLES2.Constants.GL_LUMINANCE;
					break;
				case Image2D.LUMINANCE_ALPHA:
					texFormat = GLES2.Constants.GL_LUMINANCE_ALPHA;
					break;
				case Image2D.RGB:
					texFormat = GLES2.Constants.GL_RGB;
					break;
				case Image2D.RGBA:
					texFormat = GLES2.Constants.GL_RGBA;
			}


			GLES2.texImage2D(GLES2.Constants.GL_TEXTURE_2D, 0,
				texFormat, image2D.getWidth(), image2D.getHeight(), 0,
				texFormat, GLES2.Constants.GL_UNSIGNED_BYTE,
				image2D.getImageData()
			);

			if (!skipMipmaps && !noTextureFiltering) {
				GLES2.generateMipmap(GLES2.Constants.GL_TEXTURE_2D);
			}

		}

	}

	public void useProgram(ShaderProgram prog) {
		prog.use();
		currentProgram = prog;
	}

	public void useFP() {
		currentProgram = null;
	}

	public static void exit() {
		if (instance == null)
			return;
		Emulator3D inst = instance;
		if (inst.exiting) return;
		inst.exiting = true;
		synchronized (inst) {
			try {
				// try to make context current
				GLES2.bind();

				inst.bufferHelper.deallocate();
				GLES2.release();
			} catch (Exception ignored) {}
		}
		GLES2.destroy(); // ?
	}

}