#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
const float ITERATION_LIMIT = 100.;
const int NOISE_ITERATION_LIMIT = 4;
const float ID_BACKGROUND = 0.;
const float ID_GROUND = -1.;
const float ID_SPHERE = 1.;
const float ID_PLANE = 2.;
const float ID_BOX = 3.;



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

float sdSphere( in vec3 position, in float r){
  return length(position)-r;
}

float sdPlane( vec3 p ){
	return p.y;
}

float sdBox( vec3 position, vec3 size ){
  vec3 q = abs(position) - size;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

vec3 GetColor(vec3 position, float surfaceId){
    vec3 color = vec3(0.4667, 0.0, 0.7137);
    if (surfaceId == ID_PLANE) {
        
        color = vec3(0.0784, 0.102, 0.3373);
        }
    if (surfaceId == ID_SPHERE) {
        color  = paletteBlueMagenta(1./50.);
        //color = vec3(0.8353, 0.0314, 0.502);
        }
    if (surfaceId == ID_BOX) {
        color = vec3(0.8353, 0.0314, 0.502);
        }
    if (surfaceId == ID_GROUND) {
        color = (position.y+5.) * vec3(0.2078, 0.1725, 0.1059);
        }
    return color;
}

vec2 AddObjects (vec2 firstObject, vec2 secondObject){
    if (firstObject.x < secondObject.x) {return firstObject;}
    return secondObject;
}

vec3 Paving (vec3 position){
    return 10.*fract(.1*(position))-vec3(5.);
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 sdfMap (vec3 position){
    vec2 result;
    vec3 rotatedPosition = vec3(rotate2d(.5*u_time)*position.xy,position.z);
    vec3 spherePosition = Paving(rotatedPosition + vec3(5.0,5.+1.5*u_time,5.-3.*u_time)) - vec3(0.,0.,0.);
    vec2 sphere = vec2(sdSphere(spherePosition, 1.), ID_SPHERE);
    vec3 planePosition = (position - vec3(0.,-15.,0.));
    vec2 plane = vec2(sdPlane(planePosition), ID_PLANE);
    vec3 boxPosition = Paving (vec3(position + vec3(5.+cos(2.*u_time),5.+sin(2.*u_time), 5.)));
    vec2 box = vec2(sdBox(boxPosition,vec3(1.)),ID_BOX);
    result = sphere;
    //result = plane;
    result = AddObjects(result, sphere);
    //result = AddObjects(result, box);

    return result;
}

vec2 sdfRaymarch(Ray ray){      //.x is ray length, .y is surfaceID
    
    vec2 result = vec2(0.,ID_BACKGROUND);
    vec2 sd;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        sd = sdfMap(ray.origin + result.x * ray.direction);
        if (sd.x < 0.001) {result.y = sd.y; break;}
        result.x += sd.x;
        if (result.x > 4000.) {result.y = ID_BACKGROUND; break;}
    }
    return (result);
}

/*vec2 hash2dUnitVector(vec2 st) { // st is our pair of variables
    float hashAngle = fract(sin(dot(st.xy, vec2(12.9898,78.233)))) * 43758.5453123;
    return (rotate2d (hashAngle) * vec2(1.,0.));
}*/

vec2 hash2dUnitVector(vec2 gridCorner){
    float hashAngle = 2.*3.14*fract(6421.234*sin(19512.35* gridCorner.x * gridCorner.x + 2389.) 
    + 138.283*cos(49824.+167840.17 * gridCorner.y *gridCorner.x) 
    + 1928. * sin(167.17* gridCorner.y * gridCorner.y ) + .0*u_time + .0*cos(u_time));
    return (rotate2d (hashAngle) * vec2(1.,0.));
}

/*vec3 hash3d(vec3 gridCorner){
    float hashAngle = 2.*3.14*fract(6421.234*sin(156512.35* gridCorner.x * gridCorner.x + 2389.) 
    + 138.283*cos(49824.+167840.17 * gridCorner.y *gridCorner.x) 
    + 1928. * sin(167.17* gridCorner.y * gridCorner.y )
    + 138.283*cos(49824.+167840.17 * gridCorner.z *gridCorner.z));
    return (rotate2d (hashAngle) * vec2(1.,0.));
}*/

float singleCornerNoise2d (vec2 gridCorner, vec2 point){      
    float res;
    res = dot(gridCorner - point, hash2dUnitVector(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-pi;pi)
    //res = (res + 1.)*.5;            //map to (0;1)
    //if(res > 1.3)
    return (res);
}
/*float singleCornerNoise3d (vec3 gridCorner, vec3 point){      
    float res;
    res = dot(gridCorner - point, hash3d(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-1;1)
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

vec2 zMap(vec3 position){       //.x is relative height, .y is surfaceID
    vec2 result = vec2(0., ID_GROUND);
    result.x = -2.;
    float noiseValue = 0.;
    float amplitude = 2.;
    float frequency = 1.;
    float angle = 0.;
    for(int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        noiseValue += amplitude*noise2d(position.xz, frequency);
        amplitude *= 0.5;
        frequency *= 2.;
        //position.xz += rotate2d(angle)*vec2(position.xz);
        //angle += 2.*3.1415/float(NOISE_ITERATION_LIMIT);
    }
    result.x += 1.* noiseValue;
    result.x = position.y - result.x;
    return result;
}

vec2 expRaymarch(Ray ray){      //.x is ray length, .y is surfaceID
    
    vec2 result = vec2(0.,ID_BACKGROUND);
    float stepsize = .01;
    vec2 h;
    float isExpanding = 1.;

    for(float i = 0.; i < ITERATION_LIMIT; i++){
        
        h = zMap(ray.origin + result.x * ray.direction);
        if (abs(h.x) < 0.01) {result.y = h.y; break;}
        if (result.x > 1000.) {result.y = ID_BACKGROUND; break;}
        if (h.x < 0.) {isExpanding = -1.;}
        if (isExpanding == -1.) stepsize *= 0.5;
        if (isExpanding == 1.) stepsize += 0.01;
        //stepsize *= 1.25 + (1.-0.25)*isExpanding; 
        result.x += sign(h.x) * stepsize;
        //if (h.x > 0.) {stepsize *= 2.; result.x +=stepsize;}

    }
    return (result);
}

float softShadow( in vec3 ro, in vec3 rd, float mint, float maxt, float k ){
    float res = 1.0;
    float t = mint;
    float h;
    for( float i = 0.; (i < ITERATION_LIMIT); i++ )
    {
        h = sdfMap(ro + rd*t).x;
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
    vec2 raymarchResult;
    vec2 sdfResult = sdfRaymarch(ray);
    vec2 expResult = expRaymarch(ray); 
    raymarchResult = AddObjects(sdfResult, expResult);
    //raymarchResult = expResult;
    ray.length = raymarchResult.x;
    ray.position = ray.origin + ray.direction * ray.length;
    col = GetColor(ray.position,raymarchResult.y);
    //col *= softShadow (ray.position, lightDirection,.1,10.,10.);

    //col = vec3(I);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    //col *= f/4.;
    gl_FragColor = vec4(col, 1.);
}