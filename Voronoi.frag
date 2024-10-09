#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;

vec3 paletteRainbow( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0,0.33,0.67);

    return a + b*cos( 6.28318*(c*t+d) );
}

vec3 paletteBlueMagenta( float t ) {
    vec3 a = vec3(0.6, 0., 0.8);
    vec3 b = vec3(0.4, 0., 0.2);
    vec3 c = vec3(.5, .0, .5);
    vec3 d = vec3(.5,0.,0.);

    return a + b*cos( 6.28318*(c*t+d) );
} 

vec2 hash2d(vec2 gridCorner){
    gridCorner.x*=5.;
    float x = fract(6421.234*sin(19512.35* gridCorner.x * gridCorner.x + 2389.) 
    + 138.283*cos(49824.+16940.17 * gridCorner.y *gridCorner.x) 
    + 1928. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    float y = fract(6341.234*sin(1832.35* gridCorner.x * gridCorner.x + 2389.) 
    + 178.243*cos(46124.+1360.17 * gridCorner.y *gridCorner.x) 
    + 1298. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    return (vec2 (x,y));
}

vec3 voronoi(vec2 position){ //.xy is closest voronoi gridcell, .z is the distance to it
    vec2 cellOrigin = floor(position); //cell where position is
    vec2 positionRelative = fract(position);
    vec2 cellOffset;    //Offset to the cell that is currently being calculated
    vec2 pointOffset;   //Offset to the voronoi point in current cell
    float dist;
    vec3 result = vec3 (0.,0.,1000.);
    for(float x = -2.; x <= 1. ; x++){
        for(float y = -2.; y <= 1.; y++){
            cellOffset = vec2(x,y);
            pointOffset = cellOffset + hash2d(cellOffset + cellOrigin);
            dist = length(positionRelative - pointOffset);
            if (dist < result.z) (result = vec3(cellOffset,dist));
        }
    }
    return result;
}

void main()
{
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0.,0.,.0);
    uv *= 5.;
    vec2 pavedUv = fract(uv);
    vec3 voronoi = voronoi(uv);
    float dist;
    //dist = 0.3*exp(-voronoi.z * voronoi.z);
    dist = voronoi.z;
    //dist = sin(1. * 3.1415 * dist);
    //col = paletteBlueMagenta(12.*dist);
    col = vec3(0.,dist,dist+0.5);
    //col += vec3(1. - voronoi.z);
    //col.r += (1.- 1. * step(0.05,fract(pavedUv.x)));
    //col.r += (1.- 1. * step(0.05,fract(pavedUv.y)));
    gl_FragColor = vec4(col, 1.);
}