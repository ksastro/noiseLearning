#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec2 hash2d(vec2 gridCorner){
    float x = fract(6421.234*sin(19512.35* gridCorner.x * gridCorner.x + 2389.) 
    + 138.283*cos(49824.+167840.17 * gridCorner.y *gridCorner.x) 
    + 1928. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    float y = fract(6341.234*sin(1932.35* gridCorner.x * gridCorner.x + 2389.) 
    + 178.243*cos(46124.+1360.17 * gridCorner.y *gridCorner.x) 
    + 1298. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    return (vec2 (x,y));
}

vec3 voronoi(vec2 position){ //.xy is closest voronoi gridcell, .z is the distance to it
    vec2 cellID = floor(position);
    float dist = length(position - (cellID + hash2d(cellID)));
    return vec3(cellID,dist);
}

void main()
{
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0.,0.,.0);
    uv *= 5.;
    vec2 pavedUv = fract(uv);
    vec3 voronoi = voronoi(uv);
    col += vec3(1. -voronoi.z);
    //col.r += (1.- 1. * step(0.05,fract(pavedUv.x)));
    //col.r += (1.- 1. * step(0.05,fract(pavedUv.y)));
    gl_FragColor = vec4(col, 1.);
}