package pl.zb3.freej2me.bridge.graphics;

import javax.microedition.lcdui.Font;

public class CanvasFont {
    //static {
    //    System.loadLibrary("libcanvasfont");
    //}

    protected String fontString = null;
    protected boolean underlined = false;

    private boolean hasCachedMetrics = false;
    private int height = 0;
    private int ascent = 0;

    public CanvasFont(Font font) {
        String str = "sans-serif";
		if (font.getFace() == Font.FACE_MONOSPACE) { str = "monospace"; }

        str = font.getPointSize()+"px "+str;

        if ((font.getStyle() & Font.STYLE_BOLD) > 0) {
            str = "bold " + str;
        }

        if ((font.getStyle() & Font.STYLE_ITALIC) > 0) {
            str = "italic " + str;
        }

        if ((font.getStyle() & Font.STYLE_UNDERLINED) > 0) {
            underlined = true;
        }

        fontString = str;
    }

	public int stringWidth(String str) {
        return getTextWidth(fontString, str);
	}

    private void cacheMetrics() {
        int[] result = new int[2];
        getFontMetrics(fontString, result);
        height = result[0];
        ascent = result[1];
    }

	public int getHeight() {
        if (!hasCachedMetrics) {
            cacheMetrics();
        }
        return height;
	}

	public int getAscent() {
        if (!hasCachedMetrics) {
            cacheMetrics();
        }
		return ascent;
	}

    private static native int getTextWidth(String fontStr, String text);
    private static native int getFontMetrics(String fontStr, int[] result);
}
