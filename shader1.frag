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

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float triangleWave(float x){
    return (4.*abs((fract(x/6.28) - .5))-1.);
}

void main()
{
    float t = u_time * .5; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    //uv.x = fract((1.+2.*0.*sin(t))*uv.x)*2.-1.;    //paving
    //uv.y = 2.*uv.y;


    //uv -= 0.3*vec2(cos(5.*t),sin(5.*t));  //floating center
    float d = length(uv)*.7;
    
    d -= .4;     //centralized on ring
    //d -= .1 * sin(t);    //center ring ocsilation
    d = abs(d);
    float d0 = d;
    
    
    d -= -0.7*d; //scale
    d -= 0.5 * t;  //zoom
    //d += .9 *d0  * sin(sqrt(2.)* t);  //zoom oscilation
    float patternAmplitude = 0.03 + 0.*cos(t)+0.0*d0;

    //uv = rotate2d((2.5)*t) * uv;
    //uv = rotate2d((5.5)*d) * uv;      //orienring spikes backwards    

 

    float d1 = d;   //this parameter's sign distingueshes subsequent main rings
    d1 = sin(15.*d1 +1.5); //main rings
    uv = rotate2d(sign(d1)*(2.5)*(t)) * uv;     //rotation  different ways  
    //uv = rotate2d(sign(d1)*(5.5)*d) * uv;      //orienring spikes backwards
    
    float d2 = d;
    d2 = d + patternAmplitude*triangleWave(8.*atan(uv.y,uv.x));   //pattern
    d2 = sin(5.*sin(15.*d2+1.5)+1.5); //rings
    uv = rotate2d(sign(d2)*(3.)*(-1.)) * uv; //entangling the pattern
    uv = rotate2d((.7)*t*sign(d1)) * uv;  //entangled pattern evolution
    //uv = rotate2d((.7)*t) * uv;  //entangled pattern evolution
    
    d += patternAmplitude*triangleWave(8.*atan(uv.y,uv.x));   //pattern rotated in a right way
    
    //d *= (1. + 3.*patternAmplitude*triangleWave(8.*atan(uv.y,uv.x))); //pattern rotated
    
    float f;
    f = sin(5.*sin(15.*d)); //rings
    //f=sin(10.*d);
    f *= d0; //shiny central ring
    f = abs(f);
    f = .1/(f);
    vec3 col = vec3(.4, .0, 1.0);
    col = paletteBlueMagenta(3.*d - t*1.8);
    //col = paletteRainbow(2.*d0 - t*.7);
    //col = paletteRainbow(.7*sin(4.*d) - t*.3);
    // Output to screen
    col *= f/4.;
    Color = vec4(col,1.0);
}