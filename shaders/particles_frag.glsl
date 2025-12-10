uniform float uTime;
uniform vec3 uColor;

// 雾效 Uniforms
uniform vec3 hFogColor;
uniform float hFogDensity;
uniform float hFogBase;

varying vec3 vWorldPosition;
varying float vAlpha;

#include <noise>

void main() {
    vec2 xy = gl_PointCoord.xy - vec2(0.5);
    float dist = length(xy);
    if (dist > 0.5) discard;

    float circleAlpha = 1.0 - smoothstep(0.0, 0.5, dist);
    circleAlpha = pow(circleAlpha, 1.5);

    vec3 noisePos = vWorldPosition * 0.005;
    noisePos.y *= 0.5;
    noisePos.x += uTime * 0.05;

    float noise = fbm(noisePos);

    float distY = vWorldPosition.y - hFogBase;
    float heightFactor = 0.0;
    if (distY > 0.0) {
        heightFactor = exp(-distY * hFogDensity * (1.0 + noise));
    } else {
        heightFactor = 1.0;
    }

    float camDist = length(vWorldPosition - cameraPosition);
    float distFactor = 1.0 - exp(-camDist * 0.0002);

    float totalFog = clamp(heightFactor + distFactor, 0.0, 0.8);

    vec3 finalColor = mix(uColor *100.0, hFogColor, totalFog);
    float fogAlpha = 1.0 - totalFog;

    gl_FragColor = vec4(finalColor, vAlpha * circleAlpha * fogAlpha);
}