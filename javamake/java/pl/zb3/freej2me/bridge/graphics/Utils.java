package pl.zb3.freej2me.bridge.graphics;

public class Utils {
    public static byte[] argbToRgba(int[] argb, int width, int height, boolean withAlpha) {
        byte[] rgba = argbRegionToRgba(argb, 0, 0, width, height, width, withAlpha);
        return rgba;
    }

    public static int[] rgbaToArgb(byte[] rgba) {
        int[] argb = new int[rgba.length / 4];

        for (int i = 0; i < argb.length; i++) {
            argb[i] = ((rgba[i * 4 + 3] & 0xFF) << 24) |
                    ((rgba[i * 4] & 0xFF) << 16) |
                    ((rgba[i * 4 + 1] & 0xFF) << 8) |
                    (rgba[i * 4 + 2] & 0xFF);
        }

        return argb;
    }

    public static byte[] argbRegionToRgba(int[] argb, int offset, int scanlength, int width, int height, boolean withAlpha) {
        byte[] rgba = new byte[width * height * 4];

        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int argbIndex = offset + i * scanlength + j;
                int rgbaIndex = (i * width + j) * 4;
                rgba[rgbaIndex] = (byte) ((argb[argbIndex] >> 16) & 0xFF);
                rgba[rgbaIndex + 1] = (byte) ((argb[argbIndex] >> 8) & 0xFF);
                rgba[rgbaIndex + 2] = (byte) (argb[argbIndex] & 0xFF);
                rgba[rgbaIndex + 3] = (byte) (withAlpha ? ((argb[argbIndex] >> 24) & 0xff) : 0xff);
            }
        }

        return rgba;
    }

    public static byte[] argbRegionToRgba(int[] argb, int x, int y, int width, int height, int scanlength, boolean withAlpha) {
        byte[] rgba = new byte[width * height * 4];

        for (int i = 0; i < height; i++) {
            for (int j = 0; j < width; j++) {
                int argbIndex = (i + y) * scanlength + j + x;
                int rgbaIndex = (i * width + j) * 4;
                rgba[rgbaIndex] = (byte) ((argb[argbIndex] >> 16) & 0xFF);
                rgba[rgbaIndex + 1] = (byte) ((argb[argbIndex] >> 8) & 0xFF);
                rgba[rgbaIndex + 2] = (byte) (argb[argbIndex] & 0xFF);
                rgba[rgbaIndex + 3] = (byte) (withAlpha ? ((argb[argbIndex] >> 24) & 0xff) : 0xff);
            }
        }

        return rgba;
    }

    public static native Object getCanvasFromCtx(Object handle);
}
