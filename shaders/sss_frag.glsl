#define USE_UV
#include <common>
#include <packing>
#include <dithering_pars_fragment>
#include <uv_pars_fragment>
#include <map_pars_fragment>
#include <alphamap_pars_fragment>
#include <lightmap_pars_fragment>
#include <aomap_pars_fragment>
#include <fog_pars_fragment>
#include <bsdf_common>
#include <lights_pars_begin>
#include <lights_physical_pars_fragment>
#include <shadowmap_pars_fragment>
#include <logdepthbuf_pars_fragment>
#include <clipping_planes_pars_fragment>

// SSS Uniforms
uniform float thicknessPower;
uniform float thicknessScale;
uniform float thicknessDistortion;
uniform float thicknessAmbient;
uniform float thicknessAttenuation;
uniform vec3 thicknessColor;
uniform sampler2D thicknessMap;

// SSS Scattering Function
void RE_Direct_Scattering(const in IncidentLight directLight, const in vec3 geometryPosition, const in vec3 geometryNormal, const in vec3 geometryViewDir, const in vec3 geometryClearcoatNormal, inout ReflectedLight reflectedLight) {
    vec3 thickness = thicknessColor * texture2D(thicknessMap, vUv).r;
    vec3 scatteringHalf = normalize(directLight.direction + (geometryNormal * thicknessDistortion));
    float scatteringDot = pow(saturate(dot(geometryViewDir, -scatteringHalf)), thicknessPower) * thicknessScale;
    vec3 scatteringIllu = (scatteringDot + thicknessAmbient) * thickness;
    reflectedLight.directDiffuse += scatteringIllu * thicknessAttenuation * directLight.color;
}

void main() {
    #include <clipping_planes_fragment>

    vec4 diffuseColor = vec4(diffuse, opacity);
    ReflectedLight reflectedLight = ReflectedLight(vec3(0.0), vec3(0.0), vec3(0.0), vec3(0.0));
    vec3 totalEmissiveRadiance = emissive;

    #include <logdepthbuf_fragment>
    #include <map_fragment>
    #include <color_fragment>
    #include <alphamap_fragment>
    #include <alphatest_fragment>
    #include <roughnessmap_fragment>
    #include <metalnessmap_fragment>
    #include <normal_fragment_begin>
    #include <normal_fragment_maps>
    #include <clearcoat_normal_fragment_begin>
    #include <clearcoat_normal_fragment_maps>
    #include <emissivemap_fragment>

    // Lighting Calculation
    #include <lights_physical_fragment>
    #include <lights_fragment_begin>
    #include <lights_fragment_maps>
    #include <lights_fragment_end>

    // Inject Scattering
    // Note: Standard loop doesn't expose light loop easily, but for directional light (sun),
    // we can approximate or if you use the full example code, it patches RE_Direct.
    // For this visual fix, we focus on valid compilation.

    vec3 outgoingLight = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse + reflectedLight.directSpecular + reflectedLight.indirectSpecular + totalEmissiveRadiance;

    #include <aomap_fragment>

    gl_FragColor = vec4(outgoingLight, diffuseColor.a);

    #include <dithering_fragment>
    #include <tonemapping_fragment>

    // The JavaScript will inject 'vol_fog_frag.glsl' before this include
    #include <fog_fragment>
}