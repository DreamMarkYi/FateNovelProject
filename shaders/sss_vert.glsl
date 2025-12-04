#define USE_UV
#include <common>
#include <uv_pars_vertex>
#include <displacementmap_pars_vertex>
#include <fog_pars_vertex>
#include <shadowmap_pars_vertex>
#include <logdepthbuf_pars_vertex>
#include <clipping_planes_pars_vertex>

// Required for Volumetric Fog
varying vec3 vWorldPosition;

void main() {
    #include <uv_vertex>
    #include <color_vertex>
    #include <begin_vertex>
    #include <displacementmap_vertex>
    #include <project_vertex>
    #include <logdepthbuf_vertex>
    #include <clipping_planes_vertex>

    // Calculate World Position for Fog
    vWorldPosition = (modelMatrix * vec4(position, 1.0)).xyz;

    #include <worldpos_vertex>
    #include <shadowmap_vertex>
    #include <fog_vertex>
}