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
    vec4 color = v_color;

    if (isTwoSided && !gl_FrontFacing) {
        color = v_backColor;
    }

    vec2 v_coords[MAX_TEXTURES];
    v_coords[0] = v_coords0;
    v_coords[1] = v_coords1;

    // DEBUG TEST: Output solid RED to verify shader is running
    gl_FragColor = vec4(1.0, 0.0, 0.0, 1.0);
    return;
    // END DEBUG TEST

    // Store original vertex color brightness for fallback
    float originalBrightness = length(color.rgb);
    
    // CRITICAL FIX: Force vertex color to white if too dark
    // This ensures textures show properly with MODULATE blend mode
    if (originalBrightness < 0.1) {
        color.rgb = vec3(1.0, 1.0, 1.0);
    }

    // Track if we had any valid texture contribution
    bool hadValidTexture = false;

    for (int i=0; i<MAX_TEXTURES; i++) {
        if (i < usedTextures) {
            vec4 texColor = vec4(0.0);
            if (i == 0) {
                texColor = texture2D(texture[0], v_coords[0]);
            }
            else if (i == 1) {
                texColor = texture2D(texture[1], v_coords[1]);
            }
            
            // Check if texture sampled something valid (not completely black)
            float texBrightness = length(texColor.rgb);
            bool texIsValid = texBrightness > 0.01 || texColor.a > 0.01;
            
            if (texIsValid) {
                hadValidTexture = true;
            }

            if (blendMode[i] == FUNC_REPLACE) {
                if (hasColor[i]) {
                    // REPLACE: use texture color, but if texture is black/invalid,
                    // keep current color to avoid black output from failed texture load
                    if (texBrightness > 0.01) {
                        color.rgb = texColor.rgb;
                    }
                    // else: keep current color (texture might not have loaded properly)
                }
                if (hasAlpha[i]) {
                    color.a = texColor.a;
                }
            } else if (blendMode[i] == FUNC_MODULATE) {
                if (hasColor[i]) {
                    // MODULATE: multiply colors
                    // If texture is black/invalid, skip multiplication to avoid black output
                    if (texBrightness > 0.01) {
                        color.rgb = color.rgb * texColor.rgb;
                    }
                    // else: keep current color (don't multiply by black)
                }
                if (hasAlpha[i]) {
                    color.a = color.a * texColor.a;
                }
            } else if (blendMode[i] == FUNC_DECAL) {
                // Only apply DECAL if texture is valid
                if (texBrightness > 0.01 || texColor.a > 0.01) {
                    if (hasAlpha[i]) {
                        color.rgb = color.rgb*vec3(1.0 - texColor.a) + texColor.rgb * texColor.a;
                    } else {
                        color.rgb = texColor.rgb;
                    }
                }
            } else if (blendMode[i] == FUNC_BLEND) {
                // Only apply BLEND if texture is valid
                if (texBrightness > 0.01) {
                    if (hasColor[i]) {
                        color.rgb = color.rgb * vec3(-texColor.rgb + 1.0) + blendColor[i].rgb * texColor.rgb;
                    }
                }
                if (hasAlpha[i]) {
                    color.a = color.a * texColor.a;
                }
            } else if (blendMode[i] == FUNC_ADD) {
                if (hasColor[i]) {
                    color.rgb = color.rgb + texColor.rgb;
                }
                if (hasAlpha[i]) {
                    color.a = color.a * texColor.a;
                }
            } else {
                // Unknown blend mode - just use texture color if valid
                if (texBrightness > 0.01) {
                    color.rgb = texColor.rgb;
                }
            }

            color = clamp(color, 0.0, 1.0);
        }
    }
    
    // Final safety check: if result is still too dark, something went wrong
    float finalBrightness = length(color.rgb);
    
    // DEBUG: Always show what state we're in
    if (finalBrightness < 0.05) {
        if (usedTextures > 0 && !hadValidTexture) {
            // Texture sampling failed completely - show debug magenta
            color.rgb = vec3(1.0, 0.0, 1.0);
        } else if (usedTextures == 0) {
            // No textures and still dark - show debug cyan
            color.rgb = vec3(0.0, 1.0, 1.0);
        } else {
            // Had valid texture but still dark - show debug yellow
            // This means texture was valid but blending produced black
            color.rgb = vec3(1.0, 1.0, 0.0);
        }
    }

    if (color.a < minAlpha) {
        discard;
    }

    if (fogType > 0) {
        float ffact = 1.0;

        if (fogType == FOG_LINEAR) {
            ffact = clamp((fogEnd - v_fogCoord)/ (fogEnd - fogStartOrDensity), 0., 1.);
        } else {
            ffact = clamp(exp(-fogStartOrDensity * v_fogCoord), 0., 1.);
        }

        color.rgb = mix(fogColor.rgb, color.rgb, ffact);
    }

    gl_FragColor = color;
}
