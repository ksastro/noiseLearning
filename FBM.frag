#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;
const float ITERATION_LIMIT = 100.;
const float BACKGROUNG_ID = 0.;
const float SPHERE_ID = 1.;
const float PLANE_ID = 2.;
const float BOX_ID = 3.;
const int NOISE_ITERATION_LIMIT = 1;
const vec3 PATTERN_SHIFT = vec3(15234.,943675.,715713.);

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

float sdSphere( in vec3 position, in float radius)
{
  return length(position)-radius;
}
float sdPlane( vec3 p )
{
	return p.y;
}
float sdBox( vec3 position, vec3 size )
{
  vec3 q = abs(position) - size;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

vec3 GetColor(vec3 position, float surfaceId){
    vec3 color = vec3(0.4667, 0.0, 0.7137);
    if (surfaceId == 2.) {
        
        color = vec3(0.0784, 0.102, 0.3373);
        }
    if (surfaceId == SPHERE_ID) {
        color  = paletteBlueMagenta(1./50.);
        //color = vec3(0.8353, 0.0314, 0.502);
        }
    if (surfaceId == 3.) {
        color  = paletteBlueMagenta(1./50.);
        color = vec3(0.8353, 0.0314, 0.502);
        }
    return color;
}

vec2 AddObjects (vec2 firstObject, vec2 secondObject)
{
    if (firstObject.x < secondObject.x) {return firstObject;}
    return secondObject;
}
float opSmoothUnion( float d1, float d2, float k )
{
    float h = clamp( 0.5 + 0.5*(d2-d1)/k, 0.0, 1. );
    return mix( d2, d1, h ) - k*h*(1.-h);
}
float opSmoothIntersection( float d1, float d2, float k )
{
    float h = clamp( 0.5 - 0.5*(d2-d1)/k, 0.0, 1. );
    return mix( d2, d1, h ) + k*h*(1.-h);
}

vec3 Paving (vec3 position){
    return 10.*fract(.1*(position))-vec3(5.);
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

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float sdFbmStep (float frequency, float amplitude, vec3 position){
    float result = 100.;
    position *= frequency;
    vec3 originID = floor(position);            //ID of the cell, in which position is
    vec3 positionRelative = fract(position);    //position relative to current cell origin
    //baseID is the ID of a max(xyz) cell where the closest sphere can be
    vec3 baseShift = vec3(positionRelative.x>0.5, positionRelative.y>0.5, positionRelative.z>0.5);
    vec3 baseID = originID + baseShift;
    vec3 sphereOffset;
    float radius;
    float dist;
    for(int x = -1; x < 1; x++){
    for(int y = -1; y < 1; y++){
    for(int z = -1; z < 1; z++){
        vec3 cellOffset = vec3(x,y,z);
        radius = amplitude * hashFloat(baseID + cellOffset);
        sphereOffset = baseShift + cellOffset - positionRelative + vec3(0.5);
        dist = sdSphere(sphereOffset, radius);
        if (dist < result) result = dist;
    }
    }
    }
    return result;
}

float sdFbm (float base, vec3 position)
{
    float result = base;
    float amplitude = 1.;
    float frequency = 1.;
    for (int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        result = opSmoothIntersection(result, sdFbmStep(frequency, amplitude, position), 0.1);
        amplitude *= 0.5;
        frequency *= 2.;
    }
    return result;
}

vec2 map (vec3 position){
    vec2 result;
    vec3 rotatedPosition = vec3(rotate2d(.5*u_time)*position.xy,position.z);
    vec3 spherePosition = Paving(position + vec3(5.0, 0., 5.)) - vec3(0.,0.,0.);
    vec2 sphere = vec2(sdSphere(spherePosition, hashFloat(spherePosition)), SPHERE_ID);
    vec3 planePosition = (position - vec3(0., -1., 0.));
    vec2 plane = vec2(sdPlane(planePosition), PLANE_ID);
    vec2 fbm = vec2(sdFbmStep(1.,1.,position), SPHERE_ID);
    result = vec2(sdFbm(plane.x, position),SPHERE_ID);
    //result = plane;
    //result = fbm;
    //result = AddObjects(result, sphere);
    //result = vec2(opSmoothIntersection(plane.x, fbm.x, .5),SPHERE_ID);
    //result = AddObjects(result, box);

    return result;
}

float softShadow( in vec3 ro, in vec3 rd, float mint, float maxt, float k )
{
    float res = 1.0;
    float t = mint;
    for( float i = 0.; (i < ITERATION_LIMIT); i++ )
    {
        float h = map(ro + rd*t).x;
        if( h<0.001 )
            return 0.0;
        res = min( res, k*h/t );
        t += h;
        if (t>maxt) break;
    }
    return res;
}

void main()
{
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    //uv.x = fract((1.+2.*0.*sin(t))*uv.x)*2.-1.;    //paving
    //uv.y = 2.*uv.y;
    vec3 col = vec3(0.,0.,.0);
    vec3 lightDirection = normalize(vec3(1.,1.,-1.));
    Ray ray;
    ray.origin = vec3(0.,0.,-3.);
    ray.direction = normalize(vec3(uv,1.));
    ray.length = 0.;
    ray.position = ray.origin;
    float surfaceId = BACKGROUNG_ID;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        vec2 d = map(ray.position);
        if (d.x < 0.001) {surfaceId = d.y; break;}
        ray.length += d.x;
        ray.position = ray.origin + ray.length * ray.direction;
        if (ray.length > 45000.) { break;}
    }
    col = GetColor(ray.position,surfaceId);

    col *= softShadow (ray.position, lightDirection,.1,10.,16.);

    //col = vec3(I);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    //col *= f/4.;
    Color = vec4(col, 1.);
}
