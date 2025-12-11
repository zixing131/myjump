package javax.microedition.m3g;

import java.util.Hashtable;
import javax.microedition.lcdui.Graphics;

import kemulator.m3g.gles2.Emulator3D;
import kemulator.m3g.impl.CameraCache;
import kemulator.m3g.impl.LightsCache;

import pl.zb3.freej2me.bridge.graphics.CanvasGraphics;

public class Graphics3D {
	public static final int ANTIALIAS = 2;
	public static final int DITHER = 4;
	public static final int OVERWRITE = 16;
	public static final int TRUE_COLOR = 8;

	private static Object target = null;
	private static Emulator3D impl;
	private static Graphics3D inst = new Graphics3D();

	private int viewportX, viewportY;
	private int viewportWidth, viewportHeight;

	private float depthRangeNear, depthRangeFar;
	private Image2D tempBgImage;

	private Graphics3D() {
		impl = Emulator3D.getInstance();
		depthRangeNear = 0.0F;
		depthRangeFar = 1.0F;
	}

	public static final Graphics3D getInstance() {
		return inst;
	}

	public static final Emulator3D getImpl() {
		return impl;
	}

	public static final Hashtable getProperties() {
		return impl.getProperties();
	}

	public void bindTarget(Object target) {
		this.bindTarget(target, true, 0);
	}

	public void bindTarget(Object target, boolean depthBuffer, int hints) {
		impl.enableDepthBuffer(depthBuffer);

		if (Graphics3D.target != null) {
			throw new IllegalStateException("Target already bound");
		} else if (target == null) {
			throw new NullPointerException("target");
		} else if (hints != 0 && (hints & (ANTIALIAS | DITHER | OVERWRITE | TRUE_COLOR)) == 0) {
			throw new IllegalArgumentException("hints");
		}

		boolean overwrite = (hints & OVERWRITE) != 0;
		boolean blitBack = false;

		Background bck = new Background();
		bck.setColorClearEnable(!overwrite); // zb3: TODO: shouldn't it be the opposite? test wrt to removing non-alpha
											 // and here we'd have the non-transparent bg, so blending'd not be an issue
		bck.setDepthClearEnable(depthBuffer);

		if (target instanceof Graphics) {
			Graphics g = (Graphics) target;

			int targetW = ((CanvasGraphics)g).getWidth();
			int targetH = ((CanvasGraphics)g).getSafeHeight();
			if (targetW > Emulator3D.MaxViewportWidth || targetH > Emulator3D.MaxViewportHeight) {
				throw new IllegalArgumentException();
			}

			Graphics3D.target = target;
			impl.bindTarget(g, (hints & ANTIALIAS) != 0);
			setViewport(g.getClipX(), g.getClipY(), g.getClipWidth(), Math.min(g.getClipHeight(), targetH));

			if (!overwrite) {
				// logic is that we need to blit this to GL buffer so 3D can interact with it
				// like by blending. needs to use optimized path, not image2d path
				blitBack = true;
			}
		} else if (target instanceof Image2D) {
			Image2D img2d = (Image2D) target;

			int targetW = img2d.getWidth();
			int targetH = img2d.getHeight();
			if (targetW > Emulator3D.MaxViewportWidth || targetH > Emulator3D.MaxViewportHeight) {
				throw new IllegalArgumentException();
			}

			int imageFormat = img2d.getFormat();
			if (!img2d.isMutable() || imageFormat != Image2D.RGB && imageFormat != Image2D.RGBA) {
				throw new IllegalArgumentException();
			}

			Graphics3D.target = target;
			impl.bindTarget(img2d, (hints & ANTIALIAS) != 0);
			setViewport(0, 0, targetW, targetH);

			if (!overwrite) {
				bck.setImage(img2d);
				bck.setCrop(viewportX, viewportY, viewportWidth, viewportHeight);
			}
		} else {
			throw new IllegalArgumentException("Unsupported target type");
		}

		if (Graphics3D.target != null) {
			impl.setHints(hints);
			setDepthRange(this.depthRangeNear, this.depthRangeFar);
			clear(bck);

			if (blitBack) {
				impl.blitBackground();
			}
		}
	}

	public void releaseTarget() {
		if (target != null) {
			impl.releaseTarget();
			target = null;
		}

	}

	public Object getTarget() {
		return target;
	}

	public int getHints() {
		return impl.getHints();
	}

	public boolean isDepthBufferEnabled() {
		return impl.isDepthBufferEnabled();
	}

	public void setViewport(int x, int y, int width, int height) {
		if (width > 0 && height > 0 && width <= Emulator3D.MaxViewportWidth && height <= Emulator3D.MaxViewportHeight) {
			viewportX = x;
			viewportY = y;
			viewportWidth = width;
			viewportHeight = height;
			impl.setViewport(x, y, width, height);
		} else {
			throw new IllegalArgumentException();
		}
	}

	public int getViewportX() {
		return this.viewportX;
	}

	public int getViewportY() {
		return this.viewportY;
	}

	public int getViewportWidth() {
		return this.viewportWidth;
	}

	public int getViewportHeight() {
		return this.viewportHeight;
	}

	public void setDepthRange(float near, float far) {
		if (near >= 0.0F && near <= 1.0F && far >= 0.0F && far <= 1.0F) {
			depthRangeNear = near;
			depthRangeFar = far;
			impl.setDepthRange(near, far);
		} else {
			throw new IllegalArgumentException();
		}
	}

	public float getDepthRangeNear() {
		return depthRangeNear;
	}

	public float getDepthRangeFar() {
		return depthRangeFar;
	}

	public void clear(Background background) {
		if (target == null) {
			throw new IllegalStateException();
		} else {
			impl.clearBackgound(background);
		}
	}

	public void render(World world) {
		if (world == null) {
			throw new NullPointerException();
		} else if (target != null && world.getActiveCamera() != null && world.getActiveCamera().isDescendantOf(world)) {
			impl.render(world);
		} else {
			throw new IllegalStateException();
		}
	}

	public void render(Node node, Transform transform) {
		if (node == null) {
			throw new NullPointerException();
		} else if (!(node instanceof Sprite3D) && !(node instanceof Mesh) && !(node instanceof Group)) {
			throw new IllegalArgumentException();
		} else if (target != null && CameraCache.camera != null) {
			impl.render(node, transform);
		} else {
			throw new IllegalStateException();
		}
	}

	public void render(VertexBuffer vertices, IndexBuffer triangles, Appearance appearance, Transform transform, int scope) {
		if (vertices != null && triangles != null && appearance != null) {
			if (target != null && CameraCache.camera != null) {
				impl.render(vertices, triangles, appearance, transform, scope);
			} else {
				throw new IllegalStateException();
			}
		} else {
			throw new NullPointerException();
		}
	}

	public void render(VertexBuffer vertices, IndexBuffer triangles, Appearance appearance, Transform transform) {
		this.render(vertices, triangles, appearance, transform, -1);
	}

	public void setCamera(Camera camera, Transform transform) {
		CameraCache.setCamera(camera, transform);
	}

	public Camera getCamera(Transform transform) {
		return CameraCache.getCamera(transform);
	}

	public int addLight(Light light, Transform transform) {
		return LightsCache.addLight(light, transform);
	}

	public void setLight(int index, Light light, Transform transform) {
		LightsCache.setLight(index, light, transform);
	}

	public void resetLights() {
		LightsCache.resetLights();
	}

	public int getLightCount() {
		return LightsCache.getLightCount();
	}

	public Light getLight(int index, Transform transform) {
		return LightsCache.getLight(index, transform);
	}
}
