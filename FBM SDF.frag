#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;

const float ID_BACKGROUND = 0.;
const float ID_TERRAIN = .7;
const float ID_LAKES = -1.;

const float LAKE_LEVEL = 0.02;

const float ITERATION_LIMIT = 1000.;
const int NOISE_ITERATION_LIMIT = 1;
const float MAX_DIST = 10.;
const float MIN_DIST = 0.001;
const float BIG_NUMBER = 1234.5678;

const float PI = 3.14159265;
const float TWO_PI = 6.28318531;

const vec3 PATTERN_SHIFT = vec3(134.432,475.23,713.632);

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
    float differential;
    float footprint;
    float surfaceID;
};

float sdSphere( in vec3 position, in vec3 center, in float radius){
  return length(position - center) - radius;
}
float sdPlane( vec3 p ){
	return p.y;
}

vec2 AddObjects (vec2 firstObject, vec2 secondObject){
    if (firstObject.x < secondObject.x) {return firstObject;}
    return secondObject;
}
// circular
float opSmoothUnion( float d1, float d2, float k ){
    float h = max(k-abs(d1-d2),0.0);
    return min(d1, d2) - h*h*0.25/k;
}
float opSmoothIntersection( float d1, float d2, float k ){
    float h = max(k-abs(d1-d2),0.0);
    return max(d1, d2) + h*h*0.25/k;
}

uint hashUint (in uint seed){    //murmur type of hash from https://t.ly/bKdP7 
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
float hashFloat(in vec3 seed){
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


float sdFbmStep (in float frequency, in vec3 position, in float pixelWidth){
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
        float radius;
        //radius = 0.5 * hashFloat(runningCellID);
        radius = 0.5 * hashFloat(runningCellID) * (1. - smoothstep(.0, .2, pixelWidth));
        float dist = (1./frequency) * sdSphere(position, runningCellID + vec3(0.5), radius);
        if (dist < result) result = dist;
    }
    }
    }
    return result;
}
float sdFbm (in float base, in vec3 position, in float pixelWidth){ //pixelWidth is the size of the pixel in world-space
    float result = base;
    float wave;
    float frequency = 1.;
    position += PATTERN_SHIFT;
    position += PATTERN_SHIFT;
    for (int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        //result = opSmoothUnion(opSmoothIntersection(result, sdFbmStep(frequency, amplitude, position), amplitude),result, 1.5);
        wave = sdFbmStep(frequency, position, pixelWidth);
        float clampingRadius = .2 / frequency;
        float inflationRadius = .05 / frequency;
        wave = opSmoothIntersection(result - inflationRadius, wave, clampingRadius); //clamping new layer
        result = opSmoothUnion(result, wave, clampingRadius);    //adding new layer
        frequency *= 2.;
        position += PATTERN_SHIFT;
        position.xz = rotate2d(10.)*position.xz;
        if (1./frequency < 1. * pixelWidth) break;
    }
    return result;
}

vec2 sdFbmLODReturn (in float base, in vec3 position, in float pixelWidth){
    vec2 result = vec2(base,0);
    float wave;
    float frequency = 1.;
    position += PATTERN_SHIFT;
    position += PATTERN_SHIFT;
    for (int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        //result = opSmoothUnion(opSmoothIntersection(result, sdFbmStep(frequency, amplitude, position), amplitude),result, 1.5);
        wave = sdFbmStep(frequency, position, pixelWidth);
        float clampingRadius = .3 / frequency;
        float inflationRadius = .1 / frequency;
        wave = opSmoothIntersection(result.x - inflationRadius, wave, clampingRadius); //clamping new layer
        result.x = opSmoothUnion(result.x, wave, clampingRadius);    //adding new layer
        result.y += 1.;
        frequency *= 2.;
        position += PATTERN_SHIFT;
        position.xz = rotate2d(10.)*position.xz;
        if (1./frequency < 1. * pixelWidth) break;
    }
    return result;
}

vec2 map (vec3 position, float pixelWidth){
    vec2 result;
    vec3 planePosition = (position - vec3(0., 0., 0.));
    float terrainBase = sdPlane(planePosition);
    result = vec2(sdFbm(terrainBase, position, pixelWidth),ID_TERRAIN);
    //result = sdFbmLODReturn(terrainBase, position, pixelWidth);
    vec3 lakePosition = (position - vec3(0., LAKE_LEVEL, 0.));
    vec2 lake = vec2(sdPlane(lakePosition), ID_LAKES);
    result = AddObjects(result, lake);
    return result;
}
vec2 mapWithoutWater (vec3 position, float pixelWidth){
    vec2 result;
    vec3 planePosition = (position - vec3(0., 0., 0.));
    float terrainBase = sdPlane(planePosition);
    result = vec2(sdFbm(terrainBase, position, pixelWidth),ID_TERRAIN);
    return result;
}
void propagateRay(inout Ray ray, float distance){
    ray.length += distance;
    ray.position += distance * ray.direction;
    ray.footprint += distance * ray.differential;
    if (ray.length > MAX_DIST) {ray.length = MAX_DIST; ray.position = ray.origin + ray.length * ray.direction;}
}
void raymarchSdf(inout Ray ray){      

    vec2 sd;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        sd = map(ray.position, ray.footprint);
        float minDist = 1. * ray.footprint;
        //minDist = MIN_DIST;
        if (sd.x < minDist) {propagateRay(ray, sd.x - minDist); ray.surfaceID = sd.y; break;}
        propagateRay(ray, sd.x * 1.);
        if (ray.length == MAX_DIST) {ray.surfaceID = ID_BACKGROUND; break;}
    }
    
}
void raymarchSdfWithoutWater(inout Ray ray){
    vec2 sd;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        sd = mapWithoutWater(ray.position, ray.footprint);
        if (sd.x < 1. * ray.footprint) {ray.surfaceID = sd.y; break;}
        propagateRay(ray, sd.x * 1.2);
        if (ray.length == MAX_DIST) {ray.surfaceID = ID_BACKGROUND; break;}
    }
}

float softShadow( in vec3 ro, in vec3 rd, float k ){
    float res = 1.0;
    float t = 0.1;
    for( float i = 0.; (i < ITERATION_LIMIT); i++ )
    {
        float h = map(ro + rd*t, 0.).x;
        if( h<0.001 )
            return 0.0;
        res = min( res, k*h/t );
        t += h;
        if (t > MAX_DIST/10.) break;
    }
    return res;
}
vec3 applyFog( in vec3 pixelColor, in Ray ray, in vec3  sunDirection ){
    float fogDensity = 0.05;
    float fogAmount = 1.0 - exp(-ray.length * fogDensity);
    float sunAmount = max( dot(ray.direction, sunDirection), 0.0 );
    vec3  fogColor  = mix( vec3(0.5,0.6,0.7), // blue
                           vec3(1.0,0.9,0.7), // yellow
                           pow(sunAmount,8.0) );
    return mix( pixelColor, fogColor, fogAmount );
}
vec3 refVector( in vec3 v, in vec3 n ){
    float k = dot(v,n);
    return (k>0.0) ? v : v-2.0*n*k;
}
Ray reflectRay(in Ray ray, in vec3 normal){
    ray.origin = ray.position;
    ray.direction = ray.direction - 2. * normal * dot(ray.direction, normal);
    ray.length = 0.;
    return ray;
}
vec3 calcNormalTetrahedron(in vec3 position, in float pixelWidth){
    vec2 k = vec2(1,-1) * 1.1 * pixelWidth;
    return normalize( k.xyy*map(position + k.xyy, pixelWidth).x + 
                      k.yyx*map(position + k.yyx, pixelWidth).x + 
                      k.yxy*map(position + k.yxy, pixelWidth).x + 
                      k.xxx*map(position + k.xxx, pixelWidth).x );
}
vec3 calcNormalTetrahedronFiltered(in vec3 position, in float pixelWidth){
    vec3 normal = calcNormalTetrahedron(position, pixelWidth);
    vec3 result = normal;
    result += dFdx(normal) * .125;
    result += dFdy(normal) * .125;
    normalize(result);
    return result;
}
vec3 getNormal(in Ray ray){
    vec3 normal;
    if (ray.surfaceID == ID_LAKES) {
        return vec3(0,1,0);
        float amp = 0.00002;
        float freq = 1000.;
        float width = 100.*ray.footprint / abs(ray.direction.y);
        //return normalize(vec3(0,1,-amp * freq * cos(freq * ray.position.z)));
        normal = normalize(vec3(0,1,-amp * freq * cos(freq * ray.position.z) * sin(width) / width) );
    }
    if (ray.surfaceID != ID_LAKES) normal = calcNormalTetrahedron(ray.position, ray.footprint);
    return refVector (normal, -ray.direction);
    return normal;
}
vec3 calcLightning (in vec3 position, in vec3 normal, in vec3 lightDirection, in vec3 lightColor){
    float amplitude = dot(normal,lightDirection);
    amplitude += 0.25 * (dFdx(amplitude) + dFdy(amplitude));
    amplitude *= softShadow(position, lightDirection, 16.);
    return amplitude * lightColor;
}
vec3 GetMaterial(vec3 position, vec3 normal, float surfaceID){
    vec3 material = vec3(0.2);
    if (surfaceID == ID_TERRAIN) {
        material = vec3(0.2);
        return material;
    }
    return material;
}
vec3 GetColor(Ray ray, in vec3 sunDirection){
    vec3 normal = getNormal(ray);
    vec3 sunColor = 1.25*HSVtoRGB(vec3(55.,100.,100.));     //vec3(0.9098, 0.8353, 0.0275)    
    vec3 skyLightDirection = normalize(vec3(0.,2.,0.));
    vec3 skyColor = 0.2 * HSVtoRGB(vec3(195.,100.,100.));
    //skyColor = vec3(0);
    vec3 color = vec3(0);
    if (ray.surfaceID == ID_TERRAIN) {
        //color = vec3((dot(normalize(vec3(screenSpacePosition,1.)),normal) + 1.) /2.);
        //return color;
        vec3 material = GetMaterial(ray.position, normal, ray.surfaceID);
        vec3 sunLight = calcLightning(ray.position, normal, sunDirection, sunColor);
        vec3 skyLight = calcLightning(ray.position, normal, skyLightDirection, skyColor);
        vec3 reflectedLight = calcLightning(ray.position, normal, normalize(vec3(-sunDirection.xz, 0)).xzy, 0.2*sunColor);
        vec3 totalLight = sunLight + skyLight + reflectedLight;
        color = material * totalLight;
        //color += 0.1*clamp(ray.position.z * vec3(0.0196, 0.0784, 0.0824),0.,.4);
    }
    if (ray.surfaceID == ID_BACKGROUND) {
        color = skyColor;
    }
    if (ray.surfaceID == ID_LAKES){
        color = vec3(0.0, 0.0, 0.000005);
    }

    return color;
}
vec3 processReflection(in Ray ray, in vec3 color, in vec3 sunDirection){
    float waveAmp = 0.00003;
    float waveFreq = 1000.;
    float width = ray.footprint / abs(normalize(vec2(ray.direction.z,ray.direction.y)).y);//pixel footprint on a water surface
    float waveLength = TWO_PI / waveFreq;
    vec3 normal;
    

    if(width < waveLength){
        normal = normalize(vec3(0,1,-waveAmp * waveFreq * cos(waveFreq * ray.position.z) * sin(width) / width));
    }
    if(width >= waveLength){
        normal = vec3(0,1,0);
    }
    

    //Schlick's approximation
    float refractionIndex = 1.333;
    float rZero = ((refractionIndex - 1.) * (refractionIndex - 1.)) / ((refractionIndex + 1.) * (refractionIndex + 1.));
    float reflectionCoefficient = rZero + (1. - rZero) * pow((1. - abs(dot(ray.direction, normal))), 5.);

    Ray reflectedRay = reflectRay(ray, normal);
    raymarchSdfWithoutWater(reflectedRay);
    vec3 reflectedColor = GetColor(reflectedRay, sunDirection);
    reflectedColor = applyFog(reflectedColor, ray, sunDirection);
    return mix(color, reflectedColor, reflectionCoefficient);
}

//3-Ray reflection for anti-aliasing
//Stupid idea
/*vec3 processReflection3x(in Ray ray, in vec3 color, in vec3 sunDirection)
{
    vec3 normalMin;
    vec3 normalMid;
    vec3 normalMax;
    float refractionIndex = 1.333;
    float rZero = ((refractionIndex - 1.) * (refractionIndex - 1.)) / ((refractionIndex + 1.) * (refractionIndex + 1.));
    vec3 reflectedColor;

    float amp = 0.00002;
    float freq = 1000.;
    float width = ray.footprint / abs(normalize(vec2(ray.direction.z,ray.direction.y)).y);
    
    
    normalMid = normalize(vec3(0,1,-amp * freq * cos(freq * ray.position.z) * sin(width) / width));
    
    float reflectionCoefficientMid = rZero + (1. - rZero) * pow((1. - abs(dot(ray.direction, normalMid))), 5.);
    Ray reflectedRayMid = reflectRay(ray, normalMid);
    raymarchSdfWithoutWater(reflectedRayMid);
    vec3 reflectedColorMid = GetColor(reflectedRayMid, sunDirection);
    reflectedColorMid = reflectionCoefficientMid * applyFog(reflectedColorMid, reflectedRayMid, sunDirection);

    if (width < PI / (.5*freq)){
        reflectedColor = reflectedColorMid / reflectionCoefficientMid;
        return mix(color, reflectedColor, reflectionCoefficientMid);
    }
    if (width > TWO_PI / freq){
        normalMin = normalize(vec3(0,1,-amp * freq));
        normalMax = normalize(vec3(0,1,amp * freq));
    }
    if (width <= TWO_PI / freq){
        normalMin = normalize(vec3(0,1,-amp * freq * cos(freq * (ray.position.z - width * 0.5))));
        normalMax = normalize(vec3(0,1,-amp * freq * cos(freq * (ray.position.z + width * 0.5))));
    }
    //Schlick's approximation
    
    float reflectionCoefficientMin = rZero + (1. - rZero) * pow((1. - abs(dot(ray.direction, normalMin))), 5.);
    float reflectionCoefficientMax = rZero + (1. - rZero) * pow((1. - abs(dot(ray.direction, normalMax))), 5.);
    
    Ray reflectedRayMin = reflectRay(ray, normalMin);
    Ray reflectedRayMax = reflectRay(ray, normalMax);
    raymarchSdfWithoutWater(reflectedRayMin);
    raymarchSdfWithoutWater(reflectedRayMax);
    vec3 reflectedColorMin = GetColor(reflectedRayMin, sunDirection);
    vec3 reflectedColorMax = GetColor(reflectedRayMax, sunDirection);
    reflectedColorMin = reflectionCoefficientMin * applyFog(reflectedColorMin, reflectedRayMin, sunDirection);
    reflectedColorMax = reflectionCoefficientMax * applyFog(reflectedColorMax, reflectedRayMax, sunDirection);
    float x = abs(dot(normalMin, normalMid))/abs(dot(normalMin, normalMax)); //relative position of mid
    reflectedColor = 0.5 * (reflectedColorMin * (1. - x) + reflectedColorMid + reflectedColorMax * x) / (reflectionCoefficientMin + reflectionCoefficientMax + reflectionCoefficientMid);
    return mix(color, reflectedColor, reflectionCoefficientMid);
}*/

void main()
{
    Color = vec4(1.);
    //return;
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/max(u_resolution.y, u_resolution.x);

    vec3 col = vec3(0.,0.,.0);
    vec3 lightDirection = normalize(vec3(1.,1.,-1.));

    Ray ray;
    ray.origin = vec3(5.0,.1,0.);
    ray.direction = normalize(vec3(uv,1.));
    ray.differential = 1. * length(fwidth(ray.direction));
    ray.footprint = 0.;
    ray.direction = vec3(rotate2d(-.25)*ray.direction.yz,ray.direction.x).zxy;
    ray.length = 0.;
    ray.position = ray.origin;
    ray.surfaceID = ID_BACKGROUND;

    raymarchSdf(ray);

    vec3 normal;
    normal = getNormal(ray);
    //normal = calcNormalTetrahedronFiltered(ray.position, ray.differential * ray.length);
    vec3 sunDirection = normalize(vec3(.25,.35,1.));
    col = GetColor(ray, sunDirection);
    if(ray.surfaceID == ID_LAKES) col = processReflection(ray, col, sunDirection);
    col = applyFog(col, ray, sunDirection);

    //col = vec3(I);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    //col *= f/4.;
    col = pow(col, vec3(1./2.2));
    Color = vec4(col, 1.);
}
