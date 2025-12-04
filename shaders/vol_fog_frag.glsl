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

float dist = length(vWorldPosition - cameraPosition);
float distFactor = 1.0 - exp(-dist * 0.0002);
float totalFog = clamp(heightFactor + distFactor, 0.0, 1.0);

// [New] Screen Space Gradient Fog
vec2 screenUV = gl_FragCoord.xy / uResolution;
// Gradient from bottom-left (0,0) to top-right (1,1)
// We want top-right to be light, bottom-left to be dark.
// simple linear gradient: (x + y) / 2.0
float gradientFactor = smoothstep(0.2, 1.5, screenUV.x + screenUV.y); 
vec3 finalFogColor = mix(uFogColorDark, uFogColorLight, gradientFactor);

gl_FragColor.rgb = mix(gl_FragColor.rgb, finalFogColor, totalFog);