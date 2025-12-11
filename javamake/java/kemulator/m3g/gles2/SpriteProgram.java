package kemulator.m3g.gles2;

public class SpriteProgram extends ShaderProgram implements ICommonShader {
    public int aUV;
    public int aVertexID;
    public Object uProjectionMatrix;
    public Object uModelViewMatrix;
    public Object uScaleX;
    public Object uScaleY;
    public Object uTexture;
    public Object uAlphaFactor;

    public Object uDepthRange;

    public Object uFogType;
    public Object uFogStartOrDensity;
    public Object uFogEnd;
    public Object uFogColor;

    public Object uMinAlpha;

    public SpriteProgram() {
        super("sprite");
    }

    public void onLoad() {
        aUV = a("a_uv");
        aVertexID = a("a_vertexID");
        uProjectionMatrix = u("projectionMatrix");
        uModelViewMatrix = u("modelViewMatrix");
        uScaleX = u("scaleX");
        uScaleY = u("scaleY");
        uTexture = u("texture");
        uAlphaFactor = u("alphaFactor");
        uDepthRange = u("depthRange");
        uFogType = u("fogType");
        uFogStartOrDensity = u("fogStartOrDensity");
        uFogEnd = u("fogEnd");
        uFogColor = u("fogColor");
        uMinAlpha = u("minAlpha");
    }

    public Object uDepthRange() {
        return uDepthRange;
    }

    public Object uFogType() {
        return uFogType;
    }

    public Object uFogStartOrDensity() {
        return uFogStartOrDensity;
    }

    public Object uFogEnd() {
        return uFogEnd;
    }

    public Object uFogColor() {
        return uFogColor;
    }

    public Object uMinAlpha() {
        return uMinAlpha;
    }

}
