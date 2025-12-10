uniform float uTime;
uniform float uHeight;
uniform float uBottom;
uniform float uBaseSize;

attribute vec3 aData; // x: speed, y: offset, z: size

varying vec3 vWorldPosition;
varying float vAlpha;

void main() {
    vec3 pos = position;
    float speed = aData.x;
    float offset = aData.y *5.0;
    float sizeRnd = aData.z;

    // 1. 线性进度
    float linearProgress = mod((uTime * speed) + offset, 1.0);

    // 2. 非线性分布
    float easedProgress = pow(linearProgress, 3.0);

    // 3. 计算实际高度
    pos.y = uBottom + (easedProgress * uHeight);

    // 4. 螺旋摆动
    float wobble = sin(uTime * 0.5 + offset) * 20.0 * easedProgress;
    pos.x += cos(uTime * 0.2 + offset) * 10.0;
    pos.z += sin(uTime * 0.3 + offset) * 10.0;

    vec4 worldPos = modelMatrix * vec4(pos, 1.0);
    vWorldPosition = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;

    gl_PointSize = uBaseSize * sizeRnd;

    // 淡入淡出
    float fadeIn = smoothstep(0.0, 0.1, linearProgress);
    float fadeOut = 1.0 - smoothstep(0.7, 1.0, linearProgress);

    vAlpha = fadeIn * fadeOut;
}