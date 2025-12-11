package pl.zb3.freej2me.bridge.graphics;

import javax.microedition.lcdui.Font;
import javax.microedition.lcdui.Image;

import pl.zb3.freej2me.bridge.gles2.GLES2;

public class CanvasGraphics extends javax.microedition.lcdui.Graphics {
    //static {
    //    System.loadLibrary("libcanvasgraphics");
    //}

    protected Object canvasHandle;
    protected Object ctxHandle;

    protected int[] argbCache = null;

    protected Rectangle absoluteClip;

    // Add our own fields since Graphics fields are private
    protected int width;
    protected int height;
    protected Font font;
    protected int color;
    protected int strokeStyle;
    protected int translateX;
    protected int translateY;

	protected int barHeight = 0;
    protected boolean opaqueColor = true;


    public CanvasGraphics(Object ctxHandle, Object canvasHandle, int width, int height) {
        super(true); // Call protected constructor
        this.ctxHandle = ctxHandle;
        this.canvasHandle = Utils.getCanvasFromCtx(ctxHandle);
        doInit(width, height);
    }

    public CanvasGraphics(int width, int height) {
        super(true); // Call protected constructor
        ctxHandle = createCanvasCtx(width, height);
        canvasHandle = Utils.getCanvasFromCtx(ctxHandle);
        doInit(width, height);
    }

    private CanvasGraphics() {
        super(true); // Call protected constructor
    }

    protected CanvasGraphics(Object bitmapHandle, int width, int height) {
        super(true); // Call protected constructor
        ctxHandle = bitmapToCanvasCtx(bitmapHandle);
        canvasHandle = Utils.getCanvasFromCtx(ctxHandle);
        doInit(width, height);
    }

    public static CanvasGraphics fromBitmapHandle(Object bitmapHandle, int width, int height) {
        CanvasGraphics cg = new CanvasGraphics();
        cg.ctxHandle = bitmapToCanvasCtx(bitmapHandle);
        cg.canvasHandle = Utils.getCanvasFromCtx(cg.ctxHandle);
        cg.doInit(width, height);
        return cg;
    }

    public static CanvasGraphics fromCtxHandle(Object ctxHandle) {
        // internal method for screen, doesn't call doinit
        CanvasGraphics cg = new CanvasGraphics();
        cg.ctxHandle = ctxHandle;
        cg.canvasHandle = Utils.getCanvasFromCtx(cg.ctxHandle);
        return cg;
    }

    public final void doInit(int width, int height) {
        this.width = width;
        this.height = height;
        absoluteClip = new Rectangle(0, 0, width, height);
        setColor(0x000000);
    }


    // internal method
    public void clearARGB(int x, int y, int width, int height, int argb) {
        clearRect(x, y, width, height);
        setAlphaRGB(argb);
        fillRect(x, y, width, height);
        argbCache = null;
	}

    public void copyArea(int subx, int suby, int subw, int subh, int x, int y, int anchor) {
        // umm, clip and translate apply

		x = anchorX(x, subw, anchor);
		y = anchorY(y, subh, anchor);

        drawImage(canvasHandle, subx, suby, x, y, subw, subh);
        argbCache = null;
	}

    public void drawImage(Image image, int x, int y) {
        drawImage(image, x, y, 0);
    }

    public void drawImage(Image image, int x, int y, int anchor) {
        Object handle = ((CanvasImage)image).getBitmapOrCanvas();

        int imgWidth = image.getWidth();
        int imgHeight = image.getHeight();

        x = anchorX(x, imgWidth, anchor);
        y = anchorY(y, imgHeight, anchor);

        drawImage(handle, 0, 0, x, y, imgWidth, imgHeight);
        argbCache = null;
    }

	public void drawImagePart(Image image, int x, int y, int width, int height) {
        // assumes they're actually the same size
        drawImage(((CanvasImage)image).getBitmapOrCanvas(), x, y, x, y, width, height);
        argbCache = null;
    }

	public void drawRegion(Image image, int subx, int suby, int subw, int subh, int transform, int x, int y, int anchor) {
        if (transform == 0) {
            x = anchorX(x, subw, anchor);
            y = anchorY(y, subh, anchor);
            drawImage(((CanvasImage)image).getBitmapOrCanvas(), subx, suby, x, y, subw, subh);
        } else {
            // this path is not so optimized
            CanvasImage img = new CanvasImage((CanvasImage)image, subx, suby, subw, subh, transform);
            CanvasImage canvasImg = (CanvasImage)img;
            x = anchorX(x, canvasImg.width, anchor);
            y = anchorY(y, canvasImg.height, anchor);
            drawImage(img.getBitmapOrCanvas(), 0, 0, x, y, canvasImg.width, canvasImg.height);
        }
        argbCache = null;
	}

    public void drawRGB(int[] argbData, int offset, int scanlength, int x, int y, int width, int height, boolean processAlpha)
	{
        if (width<1 || height<1) { return; }

        byte[] rgbaData = Utils.argbRegionToRgba(argbData, offset, scanlength, width, height, processAlpha);

        drawRGBAData(ctxHandle, rgbaData, width, height, x, y, processAlpha);
        argbCache = null;
	}

    public void drawLine(int x1, int y1, int x2, int y2) {
		drawLine(ctxHandle, x1, y1, x2, y2);
        argbCache = null;
	}

    public void drawArc(int x, int y, int width, int height, int startAngle, int arcAngle) {
		drawArc(ctxHandle, x, y, width, height, startAngle, arcAngle);
        argbCache = null;
	}

    public void fillArc(int x, int y, int width, int height, int startAngle, int arcAngle) {
		fillArc(ctxHandle, x, y, width, height, startAngle, arcAngle);
        argbCache = null;
	}

    public void clearRect(int x, int y, int width, int height) {
		clearRect(ctxHandle, x, y, width, height);
        argbCache = null;
    }

    public void drawRect(int x, int y, int width, int height) {
		drawRect(ctxHandle, x, y, width, height);
        argbCache = null;
    }

    public void fillRect(int x, int y, int width, int height) {
		fillRect(ctxHandle, x, y, width, height);
        argbCache = null;
    }

    public void drawRoundRect(int x, int y, int width, int height, int arcWidth, int arcHeight) {
		drawRoundRect(ctxHandle, x, y, width, height, arcWidth, arcHeight);
        argbCache = null;
    }

    public void fillRoundRect(int x, int y, int width, int height, int arcWidth, int arcHeight) {
		fillRoundRect(ctxHandle, x, y, width, height, arcWidth, arcHeight);
        argbCache = null;
    }

    public void drawTriangle(int x1, int y1, int x2, int y2, int x3, int y3) {
		drawPolygon(new int[]{x1, x2, x3}, new int[]{y1, y2, y3}, 3);
	}

	public void fillTriangle(int x1, int y1, int x2, int y2, int x3, int y3) {
		fillPolygon(new int[]{x1, x2, x3}, new int[]{y1, y2, y3}, 3);
	}

    public void drawPolygon(int[] x, int[] y, int nPoints) {
		drawPolygon(ctxHandle, x, y, nPoints);
        argbCache = null;
	}

    public void fillPolygon(int[] x, int[] y, int nPoints) {
        // canvas has no API to disable antialiasing but some games draw polygons
        // using multiple calls to fillTriangle.. in this case we must force
        // the triangle to be drawn with sharp edges even if it's slower
        // but it currently only works for opaque triangles

		fillPolygon(ctxHandle, x, y, nPoints, x.length == 3 && opaqueColor);
        argbCache = null;
	}

    public void drawChar(char character, int x, int y, int anchor) {
		// CLDC doesn't support Character.toString(char), use String constructor
		drawString(new String(new char[]{character}), x, y, anchor);
	}

	public void drawChars(char[] data, int offset, int length, int x, int y, int anchor) {
        if (offset < 0 || offset >= data.length || length <= 0) {
            return;
        }

        int actualLength = Math.min(length, data.length - offset);
        if (actualLength <= 0) {
            return;
        }

        drawString(new String(data, offset, actualLength), x, y, anchor);
	}

    public void drawSubstring(String str, int offset, int len, int x, int y, int anchor)
	{
        if (str.length() < offset + len) {
            return;
        }

        drawString(str.substring(offset, offset+len), x, y, anchor);
	}


	public void drawString(String str, int x, int y, int anchor) {
		if(str == null || str.length() == 0) {
            return;
        }

        x = anchorX(x, font.stringWidth(str), anchor);
        int ascent = font.getBaselinePosition();
        int height = font.getHeight();

        y += ascent;

        if ((anchor & VCENTER)>0) { y = y+height/2; }
        if ((anchor & BOTTOM)>0) { y = y-height; }
        if ((anchor & BASELINE)>0) { y = y-ascent; }

        drawText(ctxHandle, str, x, y);
        argbCache = null;
	}

    public void setStrokeStyle(int style) {
		strokeStyle = style;
        setDotted(ctxHandle, strokeStyle == DOTTED);
    }

    public void setColor(int rgb) {
        setAlphaRGB(0xff000000 | rgb);
    }

    public void setAlphaRGB(int argb) {
        color = argb;
        setColor(ctxHandle, (color >> 16)&0xff, (color >> 8)&0xff, (color)&0xff, (color >> 24)&0xff);

        opaqueColor = ((color >> 24)&0xff) == 0xff;
	}

    public void translate(int x, int y) {
        applyTranslate(ctxHandle, x, y);
		translateX += x;
		translateY += y;
	}

    public void setFont(Font font) {
        this.font = font;
        if (font.canvasFont == null) {
            font.canvasFont = new CanvasFont(font);
        }
        setFont(ctxHandle, font.canvasFont.fontString);
    }

    public void reset() { //Internal use method, resets the Graphics object to its inital values
        resetWithClip(0, 0, width, height);
	}

    public void resetWithClip(int x, int y, int width, int height) { //Internal use method, resets the Graphics object to its inital values
        translateX = 0; translateY = 0;
        absoluteClip.set(x, y, width, height);
        strokeStyle = SOLID;
        font = Font.getDefaultFont();

        reapplyState();
	}

    private void reapplyState() {
        if (font.canvasFont == null) {
            font.canvasFont = new CanvasFont(font);
        }
        setFullState(ctxHandle, font.canvasFont.fontString, strokeStyle == DOTTED, (color >> 16)&0xff, (color >> 8)&0xff, (color)&0xff, (color >> 24)&0xff, absoluteClip.x, absoluteClip.y, absoluteClip.width, absoluteClip.height, translateX, translateY);
    }

    public void clipRect(int x, int y, int width, int height) {
        // clip modifications force reset full state change
        // so they're always expressed in absolute coords

        absoluteClip.intersect(x+translateX, y+translateY, width, height);
        reapplyState();
    }

	public void setClip(int x, int y, int width, int height) {
        absoluteClip.set(x+translateX, y+translateY, width, height);
        reapplyState();
    }

    public int getClipWidth() {
        return absoluteClip.width;
    }

    public int getClipHeight() {
        return absoluteClip.height;
    }

    public int getClipX() {
        return absoluteClip.x - translateX;
    }

    public int getClipY() {
        return absoluteClip.y - translateY;
    }




	// hack for m3g
	public void setBarHeight(int height) {
		barHeight = height;
	}

	public int getWidth() {
		return width;
	}

	public int getFullHeight() {
		return height;
	}

	public int getSafeHeight() {
		return height - barHeight;
	}

    public void getRGB(int[] argbData, int offset, int scanlength, int x, int y, int width, int height) {
        if (argbCache == null) {
            byte[] rgbaData = getRGBAFromCtx(ctxHandle, 0, 0, this.width, this.height);
            argbCache = Utils.rgbaToArgb(rgbaData);
        }

        for (int b=y; b<y+height; b++) {
            System.arraycopy(argbCache, b * this.width + x, argbData, offset + (b - y) * scanlength, width);
        }
    }


    public void setRGB(int x, int y, int w, int h, int[] argbData, int offset, int scanlength) {
        // patch argbCache first so we don't need to invalidate it
        for (int b=y; b<y+h; b++) {
            System.arraycopy(argbData, offset + (b-y)*scanlength + x, argbCache, b*this.width, w);
        }

        // from cache, as we don't know the offset in argbData
        byte[] rgbaData = Utils.argbRegionToRgba(argbCache, x, y, w, h, this.width, true);

        putRGBAData(ctxHandle, rgbaData, x, y, w, h);
    }

    private void drawImage(Object handle, int sx, int sy, int dx, int dy, int width, int height) {
        drawImage2(ctxHandle, handle, sx, sy, dx, dy, width, height, false, true);
        argbCache = null;
    }

    // for GLES2
    public Object getCanvasRef() {
        return canvasHandle;
    }

    // for media player
    public Object getContextRef() {
        return ctxHandle;
    }

    // for ImageEncoder
    public byte[] encode(String type) {
        return encode(ctxHandle, type);
    }

    public void blitGL(int sx, int sy, int x, int y, int width, int height, boolean flipY, boolean withAlpha) {
        // honestly, withAlpha should be deprecated
        // like would we lose anything if we clear the gl buffer to a nontransparent color?

        drawImage2(ctxHandle, GLES2.getCanvasRef(), sx, sy, x, y, width, height, flipY, withAlpha);
        argbCache = null;
	}

    //

    private static native void drawRGBAData(Object handle, byte[] rgbaData, int width, int height, int x, int y,
    boolean processAlpha);

    private static native void drawLine(Object handle, int x1, int y1, int x2, int y2);
    private static native void drawArc(Object handle, int x, int y, int width, int height, int startAngle, int arcAngle);

    private static native void fillArc(Object handle, int x, int y, int width, int height, int startAngle, int arcAngle);
    private static native void clearRect(Object handle, int x, int y, int width, int height);

    private static native void drawRect(Object handle, int x, int y, int width, int height);

    private static native void fillRect(Object handle, int x, int y, int width, int height);

    private static native void drawRoundRect(Object handle, int x, int y, int width, int height, int arcWidth, int arcHeight);

	private static native void fillRoundRect(Object handle, int x, int y, int width, int height, int arcWidth, int arcHeight);

	private static native void drawPolygon(Object handle, int[] x, int[] y, int nPoints);

    private static native void fillPolygon(Object handle, int[] x, int[] y, int nPoints, boolean useSharpFillHack);


    private static native void drawText(Object handle, String str, int x, int y);

    private static native void setDotted(Object handle, boolean b);

    private static native void setColor(Object handle, int i, int j, int k, int l);

    private static native void applyTranslate(Object handle, int x, int y);

	private static native void setFont(Object handle, String fontString);

	private static native void setFullState(Object handle, String fontString, boolean b, int i, int j, int k, int l, int x, int y,
            int width, int height, int translateX, int translateY);

	private static native void drawImage2(Object handle, Object canvasRef, int sx, int sy, int x, int y, int width, int height,
            boolean flipY, boolean withAlpha);

    private static native byte[] getRGBAFromCtx(Object handle, int sx, int sy, int width, int height);

    private static native Object bitmapToCanvasCtx(Object handle);

    private static native Object createCanvasCtx(int width, int height);

    private static native void putRGBAData(Object handle, byte[] rgbaData, int x, int y, int w, int h);

    private static native byte[] encode(Object handle, String type);

    // Helper methods for anchor calculations
    private int anchorX(int x, int width, int anchor) {
        if ((anchor & HCENTER) != 0) {
            x -= width / 2;
        } else if ((anchor & RIGHT) != 0) {
            x -= width;
        }
        return x;
    }

    private int anchorY(int y, int height, int anchor) {
        if ((anchor & VCENTER) != 0) {
            y -= height / 2;
        } else if ((anchor & BOTTOM) != 0) {
            y -= height;
        }
        return y;
    }
}
