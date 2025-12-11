package pl.zb3.freej2me.bridge.graphics;



import javax.microedition.lcdui.Graphics;
import javax.microedition.lcdui.Image;
import javax.microedition.lcdui.game.Sprite;

public class CanvasImage extends Image {
    //static {
    //    System.loadLibrary("libcanvasgraphics");
    //}

    protected Object bitmapHandle = null;
    protected CanvasGraphics gc = null;
    protected int[] argbCache = null;
    
    // Add our own fields since Image fields are private
    protected int width;
    protected int height;

    public CanvasImage(int width, int height) {
        super(null, true); // Call protected constructor
        // this is mutable, so actually just white canvasgraphics
        this.width = width;
        this.height = height;
        gc = new CanvasGraphics(width, height);

        // we don't paint it white, this depends on the factory method
        // it can also be argb clear color
    }

    public CanvasImage(int width, int height, int argb) {
        // no point in keeping it bitmap
        this(width, height);

        gc.setAlphaRGB(argb);
        gc.fillRect(0, 0, width, height);
        gc.setAlphaRGB(0xff000000);
    }

    public CanvasImage(byte[] data) {
        super(null, true); // Call protected constructor
        int[] result = new int[2];

        bitmapHandle = bitmapFromBytes(data, result);
        if (bitmapHandle == null) {
            throw new IllegalArgumentException("failed to construct bitmap");
        }

        width = result[0];
        height = result[1];
    }

    public CanvasImage(CanvasImage image) {
        this(image, 0, 0, image.getWidth(), image.getHeight(), 0);
    }

    public CanvasImage(CanvasImage image, int x, int y, int width, int height, int transform) {
        super(null, true); // Call protected constructor
        int a90 = 0;
        boolean mirror = false;

        switch (transform) {
			case Sprite.TRANS_ROT90:
            case Sprite.TRANS_MIRROR_ROT90:
                a90 = 1;
				break;

			case Sprite.TRANS_ROT180:
            case Sprite.TRANS_MIRROR_ROT180:
                a90 = 2;
				break;

			case Sprite.TRANS_ROT270:
            case Sprite.TRANS_MIRROR_ROT270:
                a90 = 3;
				break;
		}

        switch (transform) {
            case Sprite.TRANS_MIRROR:
			case Sprite.TRANS_MIRROR_ROT90:
			case Sprite.TRANS_MIRROR_ROT180:
            case Sprite.TRANS_MIRROR_ROT270:
                mirror = true;
				break;
		}

        boolean swap = (a90 & 1) != 0;

        bitmapHandle = transformBitmap(image.getBitmapOrCanvas(), x, y, width, height, a90, mirror);
        if (bitmapHandle == null) {
            throw new RuntimeException("failed to construct bitmap");
        }

        this.width = swap ? height : width;
        this.height = swap ? width : height;
    }

    public CanvasImage(int[] argb, int width, int height, boolean processAlpha) {
        super(null, true); // Call protected constructor
        byte[] rgbaData = Utils.argbToRgba(argb, width, height, processAlpha);
        bitmapHandle = bitmapFromRGBAData(rgbaData, width, height);
        this.width = width;
        this.height = height;
    }

	public void getRGB(int[] argbData, int offset, int scanlength, int x, int y, int width, int height) {
        // see usage.
        /*
         * generally depending on use this shouldn't promote to a context
         *
         * we should cache converted argb
         * then use system arraycopy to copy chunks
         */

        // if we have graphics, it should have its own argb cache properly invalidated
        // so we'd delegate this
        if (gc != null) {
            gc.getRGB(argbData, offset, scanlength, x, y, width, height);
            return;
        }

        if (argbCache == null) {
            byte[] rgbaData = getRGBAFromBitmap(bitmapHandle, 0, 0, this.width, this.height);
            argbCache = Utils.rgbaToArgb(rgbaData);
        }

        for (int b=y; b<y+height; b++) {
            System.arraycopy(argbCache, b * this.width + x, argbData, offset + (b - y) * scanlength, width);
        }
    }

    public void setRGB(int x, int y, int w, int h, int[] argbData, int offset, int scanlength) {
        if (gc != null) {
            gc.setRGB(x, y, w, h, argbData, offset, scanlength);
            return;
        }

        // patch argbCache first so we don't need to invalidate it
        for (int b=y; b<y+h; b++) {
            System.arraycopy(argbData, offset + (b-y)*scanlength, argbCache, b*this.width, w);
        }

        // from cache, as we don't know the offset in argbData
        byte[] rgbaData = Utils.argbRegionToRgba(argbCache, x, y, w, h, this.width, true);

        bitmapHandle = setRGBAToBitmap(bitmapHandle, rgbaData, x, y, w, h);
	}

    public int getPixel(int x, int y) {
        int[] argb = new int[1];
        getRGB(argb, 0, 1, x, y, 1, 1);
        return argb[0];
    }

    public void setPixel(int x, int y, int color) {
        // ok, this is too much for bitmap
        if (gc == null) {
            getGraphics();
        }

        int[] argb = {color};

        setRGB(x, y, 1, 1, argb, 0, 1);
	}


    public void setFrom(Image img) { // hack for mirrorImage
        if (((CanvasImage)img).bitmapHandle == null) {
            getGraphics();
        }

        if (gc != null) {
            gc.drawImage(img, 0, 0, 0);
        } else {
            bitmapHandle = ((CanvasImage)img).bitmapHandle;
            argbCache = null;
        }
    }

    public Graphics getGraphics() {
        if (gc != null) {
            return gc;
        }

        /*
         * need to audit usage, use very wisely only if ya want to draw
         */
        argbCache = null;

        gc = CanvasGraphics.fromBitmapHandle(bitmapHandle, width, height);
        closeBitmap(bitmapHandle);
        bitmapHandle = null;

        return gc;
    }


    private static native Object bitmapFromColor(int width, int height, int r, int g, int b, int a);

    private static native Object bitmapFromBytes(byte[] data, int[] result);

    private static native Object transformBitmap(Object src, int sx, int sy, int sw, int sh, int a90, boolean mirror);

    private static native Object bitmapFromRGBAData(byte[] rgba, int width, int height);

    private static native byte[] getRGBAFromBitmap(Object handle, int sx, int sy, int width, int height);

    private static native Object setRGBAToBitmap(Object handle, byte[] rgbaData, int x, int y, int width, int height);

    private static native Object closeBitmap(Object handle);

    public Object getBitmapOrCanvas() {
        if (bitmapHandle != null) {
            return bitmapHandle;
        }

        return gc.canvasHandle;
    }
}
