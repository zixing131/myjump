uniform mat4 uProjMatrix;
uniform mat4 uMvMatrix;
uniform float uAmbIntensity;
attribute vec4 aPosition;
attribute vec3 aNormal;
attribute vec3 aColorData;
attribute vec2 aMaterial;
varying vec3 vColor;
varying vec3 vNormal;
varying float vIsReflect;
varying float vAmbIntensity;

void main() {
    gl_Position = uProjMatrix * uMvMatrix * aPosition;
    vNormal = mat3(uMvMatrix) * aNormal;
    vColor = aColorData;
    vIsReflect = aMaterial[1];
    vAmbIntensity = aMaterial[0] > 0.5 ? uAmbIntensity : -1.0;
}