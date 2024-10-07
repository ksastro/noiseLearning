#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
const float ITERATION_LIMIT = 101.;
const float BACKGROUNG_ID = 0.;
const float SPHERE_ID = 1.;
const float PLANE_ID = 2.;
const float BOX_ID = 3.;

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

int simpleHash(int x) {
    return x * 1105245 + 12345;
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

vec2 map (vec3 position){
    vec2 result;
    vec3 rotatedPosition = vec3(rotate2d(.5*u_time)*position.xy,position.z);
    vec3 spherePosition = Paving(position + vec3(5.0, 0., 5.)) - vec3(0.,0.,0.);
    vec2 sphere = vec2(sdSphere(spherePosition, float(simpleHash(int(position.x)))/1000000000.), SPHERE_ID);
    vec3 planePosition = (position - vec3(0.,-15.,0.));
    vec2 plane = vec2(sdPlane(planePosition), PLANE_ID);
    vec3 boxPosition = Paving (vec3(position + vec3(5.+cos(2.*u_time),5.+sin(2.*u_time), 5.)));
    vec2 box = vec2(sdBox(boxPosition,vec3(1.)), BOX_ID);
    result = sphere;
    //result = plane;
    result = AddObjects(result, sphere);
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

    col *= softShadow (ray.position, lightDirection,.1,10.,4.);

    //col = vec3(I);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    //col *= f/4.;
    gl_FragColor = vec4(col, 1.);
}