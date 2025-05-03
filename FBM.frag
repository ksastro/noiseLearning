#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const float ID_BACKGROUND = 0.;
const float ID_TERRAIN = 1.;

const float ITERATION_LIMIT = 500.;
const int NOISE_ITERATION_LIMIT = 10;
const float MAX_DIST = 100.;
const float BIG_NUMBER = 1234.5678;

const vec3 PATTERN_SHIFT = vec3(134.432,475.23,713.632);

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

vec3 HSVtoRGB (vec3 hsv){
    float r, g, b;
	
	float h = hsv.x / 360.;
	float s = hsv.y / 100.;
	float v = hsv.z / 100.;
	
	int i = int(floor(h * 6.));
	float f = h * 6. - floor(h * 6.);
	float p = v * (1. - s);
	float q = v * (1. - f * s);
	float t = v * (1. - (1. - f) * s);
	
	switch (i % 6) {
		case 0: r = v, g = t, b = p; break;
		case 1: r = q, g = v, b = p; break;
		case 2: r = p, g = v, b = t; break;
		case 3: r = p, g = q, b = v; break;
		case 4: r = t, g = p, b = v; break;
		case 5: r = v, g = p, b = q; break;
	}
	return vec3(r,g,b);
}

struct Ray{
    vec3 origin;
    vec3 direction;
    float length;
    vec3 position;
};

float sdSphere( in vec3 position, in vec3 center, in float radius)
{
  return length(position - center) - radius;
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

uint hashUint (in uint seed)    //murmur type of hash from https://t.ly/bKdP7
{ 
    seed += 0x9e3779b9U;
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

mat2 rotate2d(float _angle)
{
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}


float sdFbmStep (in float frequency, in vec3 position)
{
    float result = BIG_NUMBER;    //just a big number
    position *= frequency;
    vec3 cellID = floor(position);            //ID of the cell, in which position is
    vec3 positionRelative = fract(position);    //position relative to current cell origin
    //baseCell is the cell where the closest sphere can be with minimal xyz
    vec3 baseCellOffset = -1.*vec3(positionRelative.x<0.5, positionRelative.y<0.5, positionRelative.z<0.5);
    vec3 baseCellID = cellID + baseCellOffset;
    for(int x = 0; x < 2; x++){
    for(int y = 0; y < 2; y++){
    for(int z = 0; z < 2; z++){
        vec3 runningCellID = baseCellID + vec3(x,y,z);
        float radius = 0.5 * hashFloat(runningCellID);
        float dist = (1./frequency) * sdSphere(position, runningCellID + vec3(0.5), radius);
        if (dist < result) result = dist;
    }
    }
    }
    return result;
}
float sdFbm (float base, vec3 position)
{
    float result = base;
    float wave;
    float frequency = 1.;
    position += PATTERN_SHIFT;
    position += PATTERN_SHIFT;
    for (int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        //result = opSmoothUnion(opSmoothIntersection(result, sdFbmStep(frequency, amplitude, position), amplitude),result, 1.5);
        wave = sdFbmStep(frequency, position);
        float clampingRadius = .3 / frequency;
        float inflationRadius = .15 / frequency;
        wave = opSmoothIntersection(result - inflationRadius, wave, clampingRadius); //clamping new layer
        result = opSmoothUnion(result, wave, clampingRadius);    //adding new layer
        //result = wave;
        frequency *= 2.;
        position += PATTERN_SHIFT;
        position.xz = rotate2d(10.)*position.xz;
    }
    return result;
}

vec2 map (vec3 position)
{
    vec2 result;
    vec3 planePosition = (position - vec3(0., 0., 0.));
    vec2 plane = vec2(sdPlane(planePosition), ID_TERRAIN);
    result = vec2(sdFbm(plane.x, position),ID_TERRAIN);
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
vec3 calcNormalTetrahedron( in vec3 position )
{
    const float epsilon = .005; // replace by an appropriate value
    float h = epsilon * position.z;
    const vec2 k = vec2(1,-1);
    return normalize( k.xyy*map( position + k.xyy*h ).x + 
                      k.yyx*map( position + k.yyx*h ).x + 
                      k.yxy*map( position + k.yxy*h ).x + 
                      k.xxx*map( position + k.xxx*h ).x );
}
vec3 calcLightning (in vec3 position, in vec3 normal, in vec3 lightDirection, in vec3 lightColor){
    float amplitude = dot(normal,lightDirection);
    amplitude *= softShadow(position, lightDirection,.1, 10., 16.);
    return amplitude * lightColor;
}

vec2 raymarchSdf(Ray ray){      //.x is ray length, .y is surfaceID
    
    vec2 result = vec2(0.,ID_BACKGROUND);
    vec2 sd;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        sd = map(ray.origin + result.x * ray.direction);
        if (sd.x < 0.001 * result.x) {result.y = sd.y; break;}
        result.x += sd.x;
        if (result.x > MAX_DIST) {result.y = ID_BACKGROUND; break;}
    }
    return (result);
}

vec3 backgroundColor(vec2 uv){
    vec3 downColor = vec3(0.8863, 0.2078, 0.0196);
    vec3 upColor = vec3(0.0196, 0.1098, 0.1686);
    uv.y = (uv.y + 1.) * 0.5;
    vec3 color = uv.y * upColor + (1. - uv.y) * 2. * downColor;
    return color;
}

vec3 GetMaterial(vec3 position, vec3 normal, float surfaceID){
    vec3 material = vec3(0.2);
    if (surfaceID == ID_TERRAIN) {
        material = vec3(0.2);
        return material;
    }
    return material;
}
vec3 GetColor(vec3 position, vec3 normal, vec2 screenSpacePosition, float surfaceID)
{
    vec3 sunLightDirection = normalize(vec3(1.,1.,-1.));
    vec3 sunColor = 1.25*HSVtoRGB(vec3(55.,100.,100.));     //vec3(0.9098, 0.8353, 0.0275)    
    vec3 skyLightDirection = normalize(vec3(0.,2.,0.));
    vec3 skyColor = 0.2 * HSVtoRGB(vec3(195.,100.,100.));
    vec3 color = vec3(0);
    if (surfaceID == ID_TERRAIN) {
        vec3 material = GetMaterial(position, normal, surfaceID);
        vec3 sunLight = calcLightning(position, normal, sunLightDirection, sunColor);
        vec3 skyLight = calcLightning(position, normal, skyLightDirection, skyColor);
        vec3 reflectedLight = calcLightning(position, normal, vec3(-sunLightDirection.xz, 0).xzy, 0.2*sunColor);
        vec3 totalLight = sunLight + skyLight + reflectedLight;
        color = material * totalLight;
        color += 0.1*clamp(position.z * vec3(0.0196, 0.0784, 0.0824),0.,.4);
    }
    if (surfaceID == ID_BACKGROUND) {
        color = backgroundColor(screenSpacePosition);
    }
    return color;
}

void main()
{
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    vec3 col = vec3(0.,0.,.0);
    vec3 lightDirection = normalize(vec3(1.,1.,-1.));
    Ray ray;
    ray.origin = vec3(0.0,.2,0.);
    ray.direction = normalize(vec3(uv,1.));
    ray.direction = vec3(rotate2d(-.5)*ray.direction.yz,ray.direction.x).zxy;
    ray.length = 0.;
    ray.position = ray.origin;
    float surfaceId = ID_BACKGROUND;

    vec2 raymarchResult = raymarchSdf(ray);

    ray.position = ray.origin + ray.direction * raymarchResult.x;
    vec3 normal = calcNormalTetrahedron(ray.position);
    col = GetColor(ray.position, normal, uv, raymarchResult.y);

    //col = vec3(I);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    //col *= f/4.;
    col = pow(col, vec3(1./2.2));
    Color = vec4(col, 1.);
}
