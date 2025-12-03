uniform sampler2D baseTexture;
uniform sampler2D bloomTexture;
varying vec2 vUv;
void main() {
    vec4 base = texture2D( baseTexture, vUv );
    vec4 bloom = texture2D( bloomTexture, vUv );
    gl_FragColor = base + bloom;
}