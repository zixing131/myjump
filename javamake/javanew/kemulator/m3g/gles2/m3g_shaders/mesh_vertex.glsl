// needed since we use usedTextures in both shaders, thanks firefox..
precision mediump int;

const int MAX_TEXTURES = 2;

uniform int usedTextures;

attribute vec3 vPos;
attribute vec3 vPosLight;

attribute vec4 vColor;
attribute vec3 vNormal;

// sync with MAX_TEXTURES
attribute vec2 vCoords0;
attribute vec2 vCoords1;

uniform vec4 vPosSb;

uniform mat4 vCoordsMat[MAX_TEXTURES];


uniform mat4 projectionMatrix;
uniform mat4 viewMatrix;
uniform mat4 modelMatrix;

varying vec4 v_color;
varying vec4 v_backColor;

// sync with MAX_TEXTURES
varying vec2 v_coords0;
varying vec2 v_coords1;

varying float v_fogCoord;


uniform bool trackVertexColors;

uniform bool useLighting;

uniform vec4 mAmbient;
uniform vec4 mDiffuse;
uniform vec4 mSpecular;
uniform vec4 mEmissive;
uniform float mShininess;

uniform float alphaFactor;

const int MAX_LIGHTS = 8;

uniform int usedLights;


uniform vec4 lAmbient[MAX_LIGHTS];
uniform vec4 lDiffuse[MAX_LIGHTS];
uniform vec4 lSpecular[MAX_LIGHTS];
uniform vec4 lPosition[MAX_LIGHTS];
uniform mat4 lMatrix[MAX_LIGHTS];
uniform vec3 lDirection[MAX_LIGHTS];
uniform float lShininess[MAX_LIGHTS];
uniform float lSpotCutoffCos[MAX_LIGHTS];
uniform float lConstAtt[MAX_LIGHTS];
uniform float lLinAtt[MAX_LIGHTS];
uniform float lQuadAtt[MAX_LIGHTS];

uniform bool isLocalViewer;
uniform bool isTwoSided;

uniform bool isFlatShaded;

void main() {
    // Use the ORIGINAL vertex transformation logic
    // This correctly transforms vertices from model space to clip space
    
    vec4 modelPos = modelMatrix * vec4(vPos, 1.0);
    vec4 viewPos = viewMatrix * modelPos;
    gl_Position = projectionMatrix * viewPos;
    
    // DEBUG: Force white color (fragment shader will override with red)
    v_color = vec4(1.0, 1.0, 1.0, 1.0);
    v_backColor = vec4(1.0, 1.0, 1.0, 1.0);
    
    // Use ALL attributes to prevent WebGL optimizer from removing them
    // This ensures getAttribLocation returns valid indices
    vec3 dummyNormal = vNormal * 0.0001;
    vec3 dummyPosLight = vPosLight * 0.0001;
    v_color.rgb += dummyNormal + dummyPosLight;
    v_color += vColor * 0.0001;
    
    // Pass through texture coordinates
    vec4 tvcoord0 = vCoordsMat[0] * vec4(vCoords0, 0, 1);
    vec4 tvcoord1 = vCoordsMat[1] * vec4(vCoords1, 0, 1);
    v_coords0 = tvcoord0.xy / tvcoord0.w;
    v_coords1 = tvcoord1.xy / tvcoord1.w;
    
    // Fog coordinate
    v_fogCoord = abs(viewPos.z);
}
