#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;
const int NOISE_ITERATION_LIMIT = 7;
const vec3 PATTERN_SHIFT = vec3(1234.,9675.,715713.);

vec3 paletteBrownish (float t){
    vec3 a = vec3(0.5, 0.31, 0.15);
    vec3 b = vec3(0.37, 0.18, 0.15);
    vec3 c = vec3(0.5, 0.5, 0.5);
    vec3 d = vec3(0.5,0.5,0.);
    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 paletteRainbow( float t ) 
{
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0,0.33,0.67);

    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 paletteCyan( float t ) 
{
    vec3 a = vec3(0., 0.7, 0.7);
    vec3 b = vec3(0., 0.25, 0.25);
    vec3 c = vec3(.5, .5, 0.25);
    vec3 d = vec3(0.5,0.5,- 0.25);

    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 paletteBlueMagenta( float t ) 
{
    vec3 a = vec3(0.6, 0., 0.8);
    vec3 b = vec3(0.4, 0., 0.2);
    vec3 c = vec3(.5, .0, .5);
    vec3 d = vec3(.5,0.,0.);

    return a + b*cos( 6.28318*(c*t+d) );
} 


uint hashUint (in uint seed)    //murmur type of hash from https://t.ly/bKdP7
{ 
    seed ^= seed >> 17;
    seed *= 0xed5ad4bbU;
    seed ^= seed >> 11;
    seed *= 0xac4c1b51U;
    seed ^= seed >> 15;
    seed *= 0x31848babU;
    seed ^= seed >> 14;
    return seed;
}
uvec2 hashUint(in uvec2 seed)
{
    return uvec2(hashUint(seed.x),hashUint(seed.y));
}
uvec3 hashUint(in uvec3 seed)
{
    return uvec3(hashUint(seed.x),hashUint(seed.y),hashUint(seed.z));
}
float hashFloat(in float seed)  //(0,1) RNG
{ 
    uint hash = hashUint(uint(seed + PATTERN_SHIFT.x)); 
    return float(hash) / float(0xffffffffu);
}
float hashFloat(in vec2 seed)
{
    seed += PATTERN_SHIFT.xy;
    uint hashX = hashUint(uint(seed.x));
    uint hashXY = hashUint(hashX + uint(seed.y));
    return float(hashXY) / float(0xffffffffu);
}
float hashFloat(in vec3 seed)
{
    seed += PATTERN_SHIFT.xyz;
    uint hashX = hashUint(uint(seed.x));
    uint hashXY = hashUint(hashX + uint(seed.y));
    uint hashXYZ = hashUint(hashXY + uint(seed.z));
    return float(hashXYZ) / float(0xffffffffu);
}
vec2 hashVec2(in vec2 seed)
{
    uvec2 uintSeed = uvec2(seed + PATTERN_SHIFT.xy);
    uvec2 hashOnce = hashUint(uintSeed);
    vec2 hashTwice = vec2(hashUint(hashOnce + uintSeed.yx));
    return hashTwice / float(0xffffffffu);
}
vec3 hashVec3(in vec3 seed)
{
    uvec3 uintSeed = uvec3(seed + PATTERN_SHIFT.xyz);
    uvec3 hashOnce = hashUint(uintSeed);
    uvec3 hashTwice = hashUint(hashOnce + uintSeed.yzx);
    vec3 hashTrice = vec3(hashUint(hashTwice + uintSeed.zxy));
    return hashTrice / float(0xffffffffu);
}
vec2 hashVec2Unit(in vec2 seed)
{
    float hashAngle = 2.*3.1415*hashFloat(seed);
    return vec2(cos(hashAngle),sin(hashAngle));
}


vec3 voronoi2d(vec2 position)   //.xy is the closest voronoi2d gridcell, .z is the distance to it
{ 
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
vec4 voronoi3d(vec3 position)   //.xyz is the closest voronoi3d gridcell, .w is the distance to it
{ 
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


float singleCornerNoise2d (vec2 gridCorner, vec2 point){      
    float res;
    res = dot(gridCorner - point, hashVec2Unit(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-pi;pi)
    //res = (res + 1.)*.5;            //map to (0;1)
    //if(res > 1.3)
    return (res);
}
/*float singleCornerNoise3d (vec3 gridCorner, vec3 point){      
    float res;
    res = dot(gridCorner - point, hashVec3Unit(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-pi;pi)
    //res = (res + 1.)*.5;            //map to (0;1)
    //if(res > 1.3)
    return (res);
}*/
float lerp (in float leftValue, in float rightValue, in float offset){  //offset от 0 до 1
    return (leftValue + (rightValue - leftValue) * (smoothstep(0.,1.,offset)));
    //return (leftValue * offset + rightValue * (1.-offset));
}
float noise2d(in vec2 uv, float frequency){
    uv *= frequency;
    vec2 gridCornerCoords[4];
    gridCornerCoords[0] = vec2(floor(uv));              //bottom left
    gridCornerCoords[1] = vec2(floor(uv)) + vec2(1,0);  //bottom right
    gridCornerCoords[2] = vec2(floor(uv)) + vec2(0,1);  //top left
    gridCornerCoords[3] = vec2(floor(uv)) + vec2(1,1);  //top right
    float gridCornerValues[4];
    for (int i = 0; i<4; i++){gridCornerValues[i] = singleCornerNoise2d(gridCornerCoords[i],uv);}
    float bottom = lerp(gridCornerValues[0],gridCornerValues[1], fract(uv.x));
    float top = lerp(gridCornerValues[2],gridCornerValues[3], fract(uv.x));
    //return(gridCornerValues[2]);
    return (lerp(bottom, top, fract(uv.y)));
}
/*float noise3d(in vec3 uvw, float frequency){
    uvw *= frequency;
    vec3 cellID = floor(uvw);
    vec3 gridCornerCoords[8];
    for(int x = 0; x <= 1; x++){
    for(int y = 0; y <= 1; y++){
    for(int z = 0; z <= 1; z++){
        gridCornerCoords[0 + 4*z + 2*y + x] = cellID + vec3(x,y,z);
    }
    }
    }
    float gridCornerValues[8];
    for (int i = 0; i<8; i++){gridCornerValues[i] = singleCornerNoise3d(gridCornerCoords[i],uvw);}
    float bottom = lerp(gridCornerValues[0],gridCornerValues[1], fract(uv.x));
    float top = lerp(gridCornerValues[2],gridCornerValues[3], fract(uv.x));
    //return(gridCornerValues[2]);
    return (lerp(bottom, top, fract(uv.y)));
}*/
float fbm (float startingFrequency, vec2 position){
    float noiseValue = 0.;
    float frequency = startingFrequency;
    float  amplitude = 1./frequency;
    //float angle = 0.;
    for(int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        noiseValue += amplitude*noise2d(position, frequency);
        amplitude *= 0.25;
        frequency *= 2.;
        position += PATTERN_SHIFT.xy;
        //uv+= 0.1*rotate2d(angle)*vec2(u_time);
        //angle += 2.*3.1415/float(NOISE_ITERATION_LIMIT);
    }
    return noiseValue; 
}
vec2 fbm2d (float startingFrequency, vec2 position){
    return 3.5*vec2 (fbm(startingFrequency, position), fbm(startingFrequency, position + PATTERN_SHIFT.xy));
}



void main()
{
    float t = u_time * 0.3; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0.);
    vec4 voronoi = voronoi3d(vec3(4.*uv,t));
    voronoi = voronoi3d(vec3(4.*uv, u_time));
    float dist = voronoi.w;;
    //dist = 1.2*exp(-voronoi3d.w * voronoi3d.w);
    //vec2 cellStep = hashVec3(voronoi3d.xyz).xy;
    //uv += cellStep;

    
    //dist = sin(10. * 3.1415 * dist);
    //col = paletteBlueMagenta(12.*dist);
    col = vec3(dist+0.25,dist-0.4,0.);
    //col += vec3(1. - voronoi3d.w);

    
    //col = paletteRainbow(1.);
    
    //col = paletteRainbow(hashFloat(voronoi3d.xyz));
    //col *= smoothstep(0.,0.8,dist);

    //col = paletteRainbow(.43);
    //col = paletteBlueMagenta(1.*dist);
    col = paletteCyan(0.9*dist);
    
    
    //col *= 0.2/dist;
    
    /*float noiseValue = 0.;
    vec2 noiseVec2 = vec2(0.);
    col = vec3(0.);
    noiseVec2 = fbm2d(1., uv);
    for(int i = 0; i < 3; i++){
        noiseVec2 = fbm2d(1., uv + noiseVec2 + 1.*t);
    }
    noiseValue = fbm(1., uv + noiseVec2);
    //noiseValue = fbm(1., uv);
    noiseValue = (noiseValue + 1.)*.5; //map to (0,1) from (-1,1)
    //col = vec3(0.5*noiseValue, noiseValue, noiseValue);
    col = paletteBlueMagenta(noiseValue);*/

    //col = paletteCyan(1.*dist);
    //col *= 1.1*dist;
    //if(dist < 0.1) col.r += 0.5;
    //col.r += (1.- 1. * step(0.04,fract(pavedUv.x)));
    //col.r += (1.- 1. * step(0.04,fract(pavedUv.y)));
    Color = vec4(col, 1.);
}