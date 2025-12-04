uniform float uTime;
uniform vec2 uResolution; // [New]
uniform vec3 uBaseColor;
uniform vec3 uHighlightColor;
uniform vec3 uFogColor;
uniform vec3 uFogColorLight; // [New]
uniform vec3 uFogColorDark;  // [New]
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

    // [New] Gradient Fog Logic
    vec2 screenUV = gl_FragCoord.xy / uResolution;
    float gradientFactor = smoothstep(0.2, 1.5, screenUV.x + screenUV.y);
    vec3 finalFogColor = mix(uFogColorDark, uFogColorLight, gradientFactor);

    vec3 finalColor = mix(finalFogColor, cloudMix, noise * 0.5 + 0.5);
    finalColor += uHighlightColor * smoothstep(0.65, 1.0, noise) * 0.5;
    
    // Apply distance fade to fog color
    finalColor = mix(finalColor, finalFogColor, 1.0 - fade);

    gl_FragColor = vec4(finalColor, alpha * fade);
}