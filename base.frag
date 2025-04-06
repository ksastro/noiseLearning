#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const vec3 PATTERN_SHIFT = vec3(1252534.,943675.,715713.);

/*vec3 palette(float coefficients[16], float t){
    vec3 a = coefficients[0];
    vec3 b = coefficients[1];
    vec3 c = coefficients[2];
    vec3 d = coefficients[3];
    return a + b*cos( 6.28318*(c*t+d) );
}*/
vec3 paletteBrownish (float t){
    vec3 a = vec3(0.5, 0.35, 0.15);
    vec3 b = vec3(0.37, 0.22, 0.05);
    vec3 c = vec3(0.5, 0.5, 0.5);
    vec3 d = vec3(0.5,0.5,0.5);
    return a + b*cos( 6.28318*(c*t+d) );
}
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
mat2 rotate2d(float _angle)
{
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
vec2 hashVec2Unit(in vec2 seed)
{
    float hashAngle = 2.*3.1415*hashFloat(seed);
    return vec2(cos(hashAngle),sin(hashAngle));
}
vec3 hashVec3Unit(in vec3 seed)
{
    float phi = (2.*hashFloat(seed)-1.)*3.1415;      //phi spherical coordinate, (-Pi,Pi)
    float Theta = acos(2.*hashFloat(seed + PATTERN_SHIFT.xyz) - 1.);    //Theta spherical coordinate
    return vec3(cos(phi)*sin(Theta),sin(phi)*sin(Theta),cos(Theta));
}
vec3 hashVec3(in vec3 seed)
{
    uvec3 uintSeed = uvec3(seed + PATTERN_SHIFT.xyz);
    uvec3 hashOnce = hashUint(uintSeed);
    uvec3 hashTwice = hashUint(hashOnce + uintSeed.yzx);
    vec3 hashTrice = vec3(hashUint(hashTwice + uintSeed.zxy));
    return hashTrice / float(0xffffffffu);
}

float sdCircle( vec2 p, float r )
{
    return length(p) - r;
}

struct Ray
{
    vec3 origin;
    vec3 direction;
    float length;
    vec3 position;
};
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