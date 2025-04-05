#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const vec3 PATTERN_SHIFT = vec3(1252534.,943675.,715713.);

float sdSegment( in vec2 p, in vec2 a, in vec2 b )
{
    vec2 pa = p-a, ba = b-a;
    float h = clamp( dot(pa,ba)/dot(ba,ba), 0.0, 1.0 );
    return length( pa - ba*h );
}

vec2 squareBorder (float t){
    t = mod(t, 4.);
    if (t < 1.) return vec2(t,0.);
    if (t < 2.) return vec2(1.,t - 1.);
    if (t < 3.) return vec2(3.- t,1.);
    return vec2(0.,4. - t);
}

vec2 AddObjects (vec2 firstObject, vec2 secondObject)
{
    if (firstObject.x < secondObject.x) {return firstObject;}
    return secondObject;
}

vec2 sdf (in vec2 p){
    vec2 result;
    float t = u_time;
    vec2 p1 = squareBorder(t);
    vec2 p2 = squareBorder(2.7*t);
    vec2 sdSegment1 = vec2(sdSegment(p, p1, p2),1.);
    vec2 p3 = squareBorder(1.3*t);
    vec2 p4 = squareBorder(1.129138*t);
    vec2 sdSegment2 = vec2(sdSegment(p, p3, p4), 2.);
    result = AddObjects(sdSegment1,sdSegment2);

    return result;
}


vec2 caleidoscopeSquare (in vec2 uv){
    uv = fract (uv * 5.);
    return uv;
}

void main()
{
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;

    uv *= 5.;
    vec2 gridID = floor(uv);
    vec2 gridCellParity;
    uv = fract(uv);
    if (mod(gridID.x, 2.) == 1.) uv.x = 1. - uv.x;
    if (mod(gridID.y, 2.) == 1.) uv.y = 1. - uv.y;
    
    vec2 SDF = sdf(uv);
    vec3 col = vec3(0);
    if (SDF.y == 1.) col = vec3(1.,0.,0.);
    if (SDF.y == 2.) col = vec3(0.,1.,0.);
    float amplitude = step(0.95, 1.-SDF.x);
    Color = vec4(amplitude * col, 1.);
}