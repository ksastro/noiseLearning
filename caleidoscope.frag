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

float sdCircle( vec2 p, vec2 center, float r )
{
    return length(p - center) - r;
}

vec2 AddObjects (vec2 firstObject, vec2 secondObject)
{
    if (firstObject.x < secondObject.x) {return firstObject;}
    return secondObject;
}

vec2 gridUV (in  vec2 p, in float scale, in float shift){
    p += vec2(shift);
    p *= scale;
    vec2 gridID = floor(p);
    
    p = fract(p);
    if (mod(gridID.x, 2.) == 1.) p.x = 1. - p.x;
    if (mod(gridID.y, 2.) == 1.) p.y = 1. - p.y;
    return p;
}

vec2 sdf (in vec2 p){

    vec2 result = vec2(1000.,0.);
    float t = 0.3*u_time;

    vec2 p0 = p;
    p = gridUV(p0, 6., 0.);

    vec2 p1 = squareBorder(t);
    vec2 p2 = squareBorder(2.7*t);
    vec2 sdSegment1 = vec2(sdSegment(p, p1, p2),1.);
    result = AddObjects(result, sdSegment1);

    p = gridUV(p0, 6., 0.);
    p1 = squareBorder(1.3*t);
    p2 = squareBorder(1.129138*t);
    vec2 sdSegment2 = vec2(sdSegment(p, p1, p2), 2.);
    result = AddObjects(result,sdSegment2);

    p = gridUV(p0, 3., 0.);
    p1 = vec2(0.3,0.3) + 0.15*vec2(cos(t),sin(t));
    p2 = squareBorder(-1.242*t);
    vec2 sdSegment3 = vec2(sdSegment(p, p1, p2), 3.);
    result = AddObjects(result,sdSegment3);

    p = gridUV(p0, 12., 0.);
    p1 = squareBorder(1.3*t);
    p2 = squareBorder(1.3*t + 2.);
    vec2 sdSegment4 = vec2(sdSegment(p, p1, p2), 4.);
    result = AddObjects(result,sdSegment4);

    p = gridUV(p0, 3., 0.);
    p1 = squareBorder(-0.7*t);
    p2 = squareBorder(-0.7*t + 1.);
    vec2 sdSegment5 = vec2(sdSegment(p, p1, p2), 5.);
    result = AddObjects(result,sdSegment5);

    p = gridUV(p0, 6., 0.);
    vec2 sdCircle1 = vec2(abs(sdCircle(p, vec2(0.5) + 0.5 * vec2(cos(2.*t),sin(4.*t)), 0.15*sin(3.*t)+ 0.3)), 6.);
    result = AddObjects(result,sdCircle1);

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

    
    
    vec2 SDF = sdf(uv);
    vec3 col = vec3(0);
    if (SDF.y == 1.) col = vec3(1.,0.,0.);
    if (SDF.y == 2.) col = vec3(0.,1.,0.);
    if (SDF.y == 3.) col = vec3(0.,0.,1.);
    if (SDF.y == 4.) col = vec3(0.0863, 0.8, 0.6706);
    if (SDF.y == 5.) col = vec3(0.5608, 0.0784, 0.6667);
    if (SDF.y == 6.) col = vec3(0.8235, 0.5569, 0.0941);
    float amplitude = step(0.98, 1.-SDF.x);
    Color = vec4(amplitude * col, 1.);
}