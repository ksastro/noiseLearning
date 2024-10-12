#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const vec3 PATTERN_SHIFT = vec3(1252534.,943675.,715713.);

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

struct Ray{
    vec3 origin;
    vec3 direction;
    float length;
    vec3 position;
};

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

float hashFloat(in float seed){
    uint hash = hashUint(uint(seed + PATTERN_SHIFT.x)); 
    return float(hash) / float(0xFFFFFFFFU);
}

float hashFloat2d(in vec2 seed){
    uint hashX = hashUint(uint(seed.x + PATTERN_SHIFT.x));
    uint hashXY = hashUint(hashX + uint(seed.y + PATTERN_SHIFT.y));
    return float(hashXY) / float(0xFFFFFFFFU);
}

vec2 hashVec2(in vec2 seed){
    uvec2 uintSeed = uvec2(seed + PATTERN_SHIFT.xy);
    uvec2 hashOnce = hashUint(uintSeed);
    vec2 hashTwice = vec2(hashUint(hashOnce + uintSeed.yx));
    return hashTwice / float(0xffffffffu);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 hashVec2Unit(in vec2 seed){
    float hashAngle = 2.*3.1415*hashFloat2d(seed);
    return (rotate2d (hashAngle) * vec2(1.,0.));
}

vec3 hashVec3(in vec3 seed){
    uvec3 uintSeed = uvec3(seed + PATTERN_SHIFT.xyz);
    uvec3 hashOnce = hashUint(uintSeed);
    uvec3 hashTwice = hashUint(hashOnce + uintSeed.yzx);
    vec3 hashTrice = vec3(hashUint(hashTwice + uintSeed.zxy));
    return hashTrice / float(0xffffffffu);
}

float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1. );
    return mix( d2, d1, h ) - k*h*(1.-h);
}

float opSmoothSubtraction( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2+d1)/k, 0.0, 1. );
    return mix( d2, -d1, h ) + k*h*(1.-h);
}

float opSmoothIntersection( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1. );
    return mix( d2, d1, h ) + k*h*(1.-h);
}

void main()
{
    //float t = u_time * 2.; //anim speed
    //vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(1.,0.,.0);
    Color = vec4(col, 1.);
    //return(vec4(col,1.));
}