#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;
const vec3 PATTERN_SHIFT = vec3(1252534.,9675.,715713.);
const int WORLEY_DEPTH = 5;

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
vec3 paletteCyan( float t ) {
    vec3 a = vec3(0., 0.7, 0.7);
    vec3 b = vec3(0., 0.25, 0.25);
    vec3 c = vec3(.5, .5, 0.25);
    vec3 d = vec3(0.5,0.5,- 0.25);

    return a + b*cos( 6.28318*(c*t+d) );
}

uint hashUint (in uint seed){ //murmur type of hash from https://t.ly/bKdP7
    seed ^= seed >> 17;
    seed *= 0xed5ad4bbU;
    seed ^= seed >> 11;
    seed *= 0xac4c1b51U;
    seed ^= seed >> 15;
    seed *= 0x31848babU;
    seed ^= seed >> 14;
    return seed;
}
uvec2 hashUint(in uvec2 seed){
    return uvec2(hashUint(seed.x),hashUint(seed.y));
}
uvec3 hashUint(in uvec3 seed){
    return uvec3(hashUint(seed.x),hashUint(seed.y),hashUint(seed.z));
}

vec2 hashVec2(in vec2 seed){
    uvec2 uintSeed = uvec2(seed + PATTERN_SHIFT.xy);
    uvec2 hashOnce = hashUint(uintSeed);
    vec2 hashTwice = vec2(hashUint(hashOnce + uintSeed.yx));
    return hashTwice / float(0xffffffffu);
}

vec3 hashVec3(in vec3 seed){
    uvec3 uintSeed = uvec3(seed + PATTERN_SHIFT.xyz);
    uvec3 hashOnce = hashUint(uintSeed);
    uvec3 hashTwice = hashUint(hashOnce + uintSeed.yzx);
    vec3 hashTrice = vec3(hashUint(hashTwice + uintSeed.zxy));
    return hashTrice / float(0xffffffffu);
}

vec3 voronoi2d(vec2 position){ //.xy is the closest voronoi2d gridcell, .z is the distance to it
    vec2 cellOrigin = floor(position); //cell where position is
    vec2 positionRelative = fract(position);
    vec2 cellOffset;    //Offset to the cell that is currently being calculated
    vec2 pointOffset;   //Offset to the voronoi2d point in current cell
    float dist;
    vec3 result = vec3 (0.,0.,1000.);
    for(float x = -2.; x <= 1. ; x++){
    for(float y = -2.; y <= 1.; y++){
        cellOffset = vec2(x,y);
        pointOffset = cellOffset + hashVec2(cellOffset + cellOrigin);
        dist = length(positionRelative - pointOffset);
        if (dist < result.z) (result = vec3(cellOffset,dist));
    }
    }
    return result;
}

vec4 voronoi3d(vec3 position){ //.xyz is the closest voronoi3d gridcell, .w is the distance to it
    vec3 cellOrigin = floor(position); //cell where position is
    vec3 positionRelative = fract(position);
    vec3 cellOffset;    //Offset to the cell that is currently being calculated
    vec3 pointOffset;   //Offset to the voronoi2d point in current cell
    float dist;
    vec4 result = vec4 (0., 0., 0., 1000.);
    for(float x = -2.; x <= 2. ; x++){
    for(float y = -2.; y <= 2.; y++){
    for(float z = -2.; z <= 2.; z++){
        cellOffset = vec3(x,y,z);
        pointOffset = cellOffset + hashVec3(cellOffset + cellOrigin);
        dist = length(positionRelative - pointOffset);
        if (dist < result.w) (result = vec4(cellOffset + cellOrigin,dist));
    }
    }
    }
    return result;
}

void sortedInsert(inout vec4[WORLEY_DEPTH] worleyArray, in vec4 worleyElement){
    if (worleyElement.w < worleyArray[WORLEY_DEPTH - 1].w) {
        worleyArray [WORLEY_DEPTH - 1] = worleyElement;
        for (int i = WORLEY_DEPTH - 1; i > 0; i--){
            if (worleyArray[i-1].w < worleyArray[i].w) break;
            worleyElement = worleyArray[i-1];
            worleyArray[i-1] = worleyArray[i];
            worleyArray[i] = worleyElement;
        }        
    }
}

vec4 [WORLEY_DEPTH] worley3d(in vec3 position){
    vec3 cellOrigin = floor(position); //cell where position is
    vec3 positionRelative = fract(position);
    vec3 cellOffset;    //Offset to the cell that is currently being calculated
    vec3 pointOffset;   //Offset to the voronoi2d point in current cell
    float dist;
    vec4 [WORLEY_DEPTH] result;
    for (int i = 0; i < WORLEY_DEPTH; i++){
         result[i] = vec4 (0., 0., 0., 1000.);
    }
    //vec4 result = vec4 (0., 0., 0., 1000.);
    for(float x = -2.; x <= 2.; x++){
    for(float y = -2.; y <= 2.; y++){
    for(float z = -2.; z <= 2.; z++){
        cellOffset = vec3(x,y,z);
        pointOffset = cellOffset + hashVec3(cellOffset + cellOrigin);
        dist = length(positionRelative - pointOffset);
        vec4 point = vec4(cellOffset + cellOrigin,dist);
        sortedInsert(result, point);
    }
    }
    }
    return result;
}

void main()
{
    float t = u_time * .2; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0.,0.,.0);
    uv *= 5.;
    vec2 pavedUv = fract(uv);
    vec4 [WORLEY_DEPTH] worley3d = worley3d(vec3(uv,t));
    float dist; 
    dist = worley3d[2].w;
    //dist = 0.3*exp(-dist * dist);
    //dist = sin(13. * 3.1415 * dist);
    //col = paletteBlueMagenta(12.*dist);
    //col = vec3(0.,dist,dist+0.5);
    //col += vec3(1. - voronoi3d.z);

    
    //col = paletteRainbow(1.);
    
    //col = paletteRainbow(hashVec3(voronoi3d.xyz).x);
    //col *= smoothstep(0.,0.8,dist);

    //col = paletteRainbow(.2);
    
    col = paletteCyan(.7*worley3d[0].w);
    //col = paletteBlueMagenta(.7*worley3d[0].w);
    //col *= 0.45/dist;
    //col *= 0.9; 
    col *= 1.*dist;
    
    //col.r += (1.- 1. * step(0.01,fract(pavedUv.x)));
    //col.r += (1.- 1. * step(0.01,fract(pavedUv.y)));
    Color = vec4(col, 1.);
}