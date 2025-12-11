#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

// needed since we use usedTextures in both shaders, thanks firefox..
precision mediump int;

const int MAX_TEXTURES = 2;

uniform sampler2D texture[MAX_TEXTURES];

uniform int usedTextures;

#define FOG_LINEAR 1
#define FOG_EXP 2
uniform int fogType;
uniform float fogStartOrDensity;
uniform float fogEnd;
uniform vec4 fogColor;

varying vec4 v_color;
varying vec4 v_backColor;
varying vec2 v_coords0;
varying vec2 v_coords1;

uniform vec4 blendColor[MAX_TEXTURES];

#define FUNC_ADD 224
#define FUNC_BLEND 225
#define FUNC_DECAL 226
#define FUNC_MODULATE 227
#define FUNC_REPLACE 228
uniform int blendMode[MAX_TEXTURES];

uniform bool hasColor[MAX_TEXTURES];
uniform bool hasAlpha[MAX_TEXTURES];

// for alpha test
uniform float minAlpha;

uniform bool isTwoSided;

varying float v_fogCoord;

void main() {
    vec4 color;
    if (isTwoSided && !gl_FrontFacing) {
        color = v_backColor;
    } else {
        color = v_color;
    }

    // Ensure color is not completely black from lighting
    // If lighting resulted in black, use a minimum ambient light
    if (color.r < 0.01 && color.g < 0.01 && color.b < 0.01) {
        color.rgb = vec3(0.1, 0.1, 0.1); // Minimum ambient light
    }

    vec2 coords[2];
    coords[0] = v_coords0;
    coords[1] = v_coords1;

    for (int i = 0; i < MAX_TEXTURES; i++) {
        if (i >= usedTextures) break;

        vec4 texColor = texture2D(texture[i], coords[i]);

        int mode = blendMode[i];

        if (mode == FUNC_REPLACE) {
            if (hasColor[i]) {
                color.rgb = texColor.rgb;
            }
            if (hasAlpha[i]) {
                color.a = texColor.a;
            }
        } else if (mode == FUNC_MODULATE) {
            if (hasColor[i]) {
                color.rgb *= texColor.rgb;
            }
            if (hasAlpha[i]) {
                color.a *= texColor.a;
            }
        } else if (mode == FUNC_DECAL) {
            if (hasColor[i]) {
                if (hasAlpha[i]) {
                    color.rgb = mix(color.rgb, texColor.rgb, texColor.a);
                } else {
                    color.rgb = texColor.rgb;
                }
            }
        } else if (mode == FUNC_BLEND) {
            if (hasColor[i]) {
                color.rgb = mix(color.rgb, blendColor[i].rgb, texColor.rgb);
            }
            if (hasAlpha[i]) {
                color.a *= texColor.a;
            }
        } else if (mode == FUNC_ADD) {
            if (hasColor[i]) {
                color.rgb += texColor.rgb;
            }
            if (hasAlpha[i]) {
                color.a *= texColor.a;
            }
        }
    }

    // Clamp color to valid range
    color = clamp(color, 0.0, 1.0);

    if (color.a < minAlpha) {
        discard;
    }

    // Apply fog
    if (fogType == FOG_LINEAR) {
        float fogFactor = clamp((fogEnd - v_fogCoord) / (fogEnd - fogStartOrDensity), 0.0, 1.0);
        color.rgb = mix(fogColor.rgb, color.rgb, fogFactor);
    } else if (fogType == FOG_EXP) {
        float fogFactor = clamp(exp(-fogStartOrDensity * v_fogCoord), 0.0, 1.0);
        color.rgb = mix(fogColor.rgb, color.rgb, fogFactor);
    }

    gl_FragColor = color;
}
