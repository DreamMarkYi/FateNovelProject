uniform float uTime;
uniform vec3 uBaseColor;
uniform vec3 uHighlightColor;
uniform vec3 uFogColor;
varying vec2 vUv;
varying vec3 vWorldPosition;

#include <noise>

void main() {
    vec3 pos = vWorldPosition * 0.002;
    pos.x += uTime * 0.05;
    pos.z += uTime * 0.02;
    float noise = fbm(pos + vec3(0.0, uTime * 0.1, 0.0));
    float alpha = smoothstep(-0.2, 0.8, noise);
    float dist = length(vWorldPosition.xz - cameraPosition.xz);
    float fade = 1.0 - smoothstep(1000.0, 3500.0, dist);
    float toneMix = smoothstep(0.3, 0.8, noise * 0.5 + 0.5);
    vec3 cloudMix = mix(uBaseColor, uHighlightColor, toneMix);
    vec3 finalColor = mix(uFogColor, cloudMix, noise * 0.5 + 0.5);
    finalColor += uHighlightColor * smoothstep(0.65, 1.0, noise) * 0.5;
    gl_FragColor = vec4(finalColor, alpha );
}