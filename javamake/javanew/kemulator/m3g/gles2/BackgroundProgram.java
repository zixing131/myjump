package kemulator.m3g.gles2;

public class BackgroundProgram extends ShaderProgram {
    public int aPos;
    public int aNormalizedUV;
    public Object uTexture;
    public Object uRepeatX;
    public Object uRepeatY;

    public BackgroundProgram() {
        super("background");
    }

    public void onLoad() {
        aPos = a("a_pos");
        aNormalizedUV = a("a_normalizedUV");
        uTexture = u("texture");
        uRepeatX = u("repeatX");
        uRepeatY = u("repeatY");
    }
}
