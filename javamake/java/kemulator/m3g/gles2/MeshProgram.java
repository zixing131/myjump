package kemulator.m3g.gles2;

public class MeshProgram extends ShaderProgram implements ICommonShader {
    public static final int MAX_TEXTURES = 2;
    public static final int MAX_LIGHTS = 8;

    public int aVPos;
    public int aVPosLight;
    public int aVColor;
    public int aVNormal;
    public int[] aVCoords;
    public Object[] uVCoordsMat;
    public Object uVPosSb;
    public Object uProjectionMatrix;
    public Object uModelMatrix;
    public Object uViewMatrix;
    public Object uTrackVertexColors;
    public Object uUseLighting;
    public Object uMAmbient;
    public Object uMDiffuse;
    public Object uMSpecular;
    public Object uMEmissive;
    public Object uMShininess;
    public Object uUsedLights;
    public Object uAlphaFactor;
    public Object[] uLAmbient;
    public Object[] uLDiffuse;
    public Object[] uLSpecular;
    public Object[] uLPosition;
    public Object[] uLMatrix;
    public Object[] uLDirection;
    public Object[] uLShininess;
    public Object[] uLSpotCutoffCos;
    public Object[] uLConstAtt;
    public Object[] uLLinAtt;
    public Object[] uLQuadAtt;
    public Object uIsLocalViewer;
    public Object uIsTwoSided;
    public Object uDepthRange;
    public Object uIsFlatShaded;
    public Object uUsedTextures;
    public Object[] uTexture;

    public Object uFogType;
    public Object uFogStartOrDensity;
    public Object uFogEnd;
    public Object uFogColor;
    public Object uMinAlpha;

    public Object[] uBlendColor;
    public Object[] uBlendMode;
    public Object[] uHasColor;
    public Object[] uHasAlpha;

    public MeshProgram() {
        super("mesh");
    }

    public void onLoad() {
        aVPos = a("vPos");
        aVPosLight = a("vPosLight");
        aVColor = a("vColor");
        aVNormal = a("vNormal");
        aVCoords = new int[MAX_TEXTURES];
        uVCoordsMat = new Object[MAX_TEXTURES];
        uTexture = new Object[MAX_TEXTURES];
        uBlendColor = new Object[MAX_TEXTURES];
        uBlendMode = new Object[MAX_TEXTURES];
        uHasColor = new Object[MAX_TEXTURES];
        uHasAlpha = new Object[MAX_TEXTURES];

        for (int i = 0; i < MAX_TEXTURES; i++) {
            aVCoords[i] = a("vCoords" + i);
            uVCoordsMat[i] = u("vCoordsMat", i);
            uTexture[i] = u("texture", i);
            uBlendColor[i] = u("blendColor", i);
            uBlendMode[i] = u("blendMode", i);
            uHasColor[i] = u("hasColor", i);
            uHasAlpha[i] = u("hasAlpha", i);
        }
        uVPosSb = u("vPosSb");
        uProjectionMatrix = u("projectionMatrix");
        uViewMatrix = u("viewMatrix");
        uModelMatrix = u("modelMatrix");
        uTrackVertexColors = u("trackVertexColors");
        uUseLighting = u("useLighting");
        uMAmbient = u("mAmbient");
        uMDiffuse = u("mDiffuse");
        uMSpecular = u("mSpecular");
        uMEmissive = u("mEmissive");
        uMShininess = u("mShininess");
        uUsedLights = u("usedLights");
        uAlphaFactor = u("alphaFactor");
        uLAmbient = new Object[MAX_LIGHTS];
        uLDiffuse = new Object[MAX_LIGHTS];
        uLSpecular = new Object[MAX_LIGHTS];
        uLPosition = new Object[MAX_LIGHTS];
        uLMatrix = new Object[MAX_LIGHTS];
        uLDirection = new Object[MAX_LIGHTS];
        uLShininess = new Object[MAX_LIGHTS];
        uLSpotCutoffCos = new Object[MAX_LIGHTS];
        uLConstAtt = new Object[MAX_LIGHTS];
        uLLinAtt = new Object[MAX_LIGHTS];
        uLQuadAtt = new Object[MAX_LIGHTS];
        for (int i = 0; i < MAX_LIGHTS; i++) {
            uLAmbient[i] = u("lAmbient", i);
            uLDiffuse[i] = u("lDiffuse", i);
            uLSpecular[i] = u("lSpecular", i);
            uLPosition[i] = u("lPosition", i);
            uLMatrix[i] = u("lMatrix", i);
            uLDirection[i] = u("lDirection", i);
            uLShininess[i] = u("lShininess", i);
            uLSpotCutoffCos[i] = u("lSpotCutoffCos", i);
            uLConstAtt[i] = u("lConstAtt", i);
            uLLinAtt[i] = u("lLinAtt", i);
            uLQuadAtt[i] = u("lQuadAtt", i);
        }

        uIsLocalViewer = u("isLocalViewer");
        uIsTwoSided = u("isTwoSided");
        uDepthRange = u("depthRange");
        uIsFlatShaded = u("isFlatShaded");
        uUsedTextures = u("usedTextures");

        uFogType = u("fogType");
        uFogStartOrDensity = u("fogStartOrDensity");
        uFogEnd = u("fogEnd");
        uFogColor = u("fogColor");
        uMinAlpha = u("minAlpha");
    }

    public Object uViewMatrix() {
        return uViewMatrix;
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
