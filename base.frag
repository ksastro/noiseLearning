#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

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

float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1. );
    return mix( d2, d1, h ) - k*h*(1.-h);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 hash2dUnitVector(vec2 gridCorner){
    float hashAngle = 2.*3.14*fract(6421.234*sin(19512.35* gridCorner.x * gridCorner.x + 2389.) 
    + 138.283*cos(49824.+167840.17 * gridCorner.y *gridCorner.x) 
    + 1928. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    return (rotate2d (hashAngle) * vec2(1.,0.));
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