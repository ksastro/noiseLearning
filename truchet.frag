#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const float EULER_NUMBER = 2.718281828;
const float PI = 3.1415926535;

const vec3 PATTERN_SHIFT = vec3(1254.,935.,715713.);

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

float Length(vec2 p, float gamma)
{
    p = abs(p);
    return pow((pow(p.x, gamma) + pow(p.y, gamma)), 1./gamma);
}

float sdCircle( vec2 p, vec2 center, float r, float gamma )
{
    return Length((p - center), gamma) - r;
}

vec2 Truchet (vec2 p, float gamma){  //.x is sdf, .y is arg, gamma is power for Length
    vec2 cellID = floor(p);
    float checkerID = mod(cellID.x+cellID.y, 2.)*2.-1.;
    float cellHash = hashFloat(cellID);
    float cellHashBinary = step(0.5, cellHash);
    cellHashBinary = cellHashBinary * 2. - 1.;
    vec2 griduv = fract(p);
    griduv -= 0.5;
    griduv.x *= cellHashBinary;

    bool isTopRight = (griduv.x + griduv.y > 0.);
    vec2 circleCenter = vec2(.5);
    if(!isTopRight) circleCenter *= -1.;

    float sdf;
    sdf = sdCircle(griduv, circleCenter, .5, gamma);
    float arg = atan(griduv.y - circleCenter.y, griduv.x - circleCenter.x);
    arg *= 4.;      //needed for continuity
    arg *= checkerID;   //needed for continuity
    return vec2(sdf, arg);
}

void main()
{
    float t = u_time * .1; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    float scale = 4.;
    uv *= scale;

    

    vec2 truchet1 = Truchet(uv, 1.5);
    float sdf = truchet1.x;
    float arg = truchet1.y;
    float thickness = 0.15;
    float amplitude;
    amplitude = exp(-1. * sdf * sdf / (thickness * thickness));
    amplitude = clamp(thickness/(abs(sdf)),0.,1.); //hyperbolic
    if (abs(sdf) > 0.1) amplitude = 0.;
    //if (amplitude < 0.3) amplitude = 0.;

    vec3 col1 = vec3(0.,0.,0.);
    
    col1 += paletteBlueMagenta(arg/PI + 10.*t) * amplitude * 0.8;

    vec2 truchet2 = Truchet(uv + PATTERN_SHIFT.xy + vec2(0.5), 4.);
    sdf = truchet2.x;
    arg = truchet2.y;
    thickness = 0.03;
    amplitude = exp(-1. * sdf * sdf / (thickness * thickness));
    amplitude = clamp(thickness/(abs(sdf)),0.,1.); //hyperbolic
    //if (abs(sdf) > 0.1) amplitude = 0.;
    if (amplitude < 0.6) amplitude = 0.;

    vec3 col2 = vec3(0.);
    
    col2 += paletteCyan(arg/PI + 10.*t) * amplitude * 0.8;

    //col += vec3(abs(sin(arg)) * amplitude * 0.5);
    
    //col.g = sin(arg) * amplitude;
    //if (abs(griduv.x) > 0.49 || abs(griduv.y) > 0.49) col = vec3(1.,0.,0.);

    vec3 col = vec3(0.,0.,0.);
    //col = col1;
    if (col1.r + col1.g + col1.b == 0.) col = col2;
    if (col2.r + col2.g + col2.b == 0.) col = col1;

    uv += 0.25;

    vec2 cellID = floor(uv);
    float cellHash = hashFloat(cellID);
    float cellHashBinary = step(0.5, cellHash);
    
    if (col1.r + col1.g + col1.b != 0. && col2.r + col2.g + col2.b != 0.) col = cellHashBinary * col1 + (1. - cellHashBinary) * col2;
    Color = vec4(col, 1.);
}