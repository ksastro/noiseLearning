#ifdef GL_ES
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
const int NOISE_ITERATION_LIMIT = 7;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec2 hash2d(vec2 gridCorner){
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
    res = dot(gridCorner - point, hash2d(gridCorner));
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
    float gridCornerValues[8];
    for (int i = 0; i<4; i++){gridCornerValues[i] = singleCornerNoise2d(gridCornerCoords[i],uv);}
    float bottom = lerp(gridCornerValues[0],gridCornerValues[1], fract(uv.x));
    float top = lerp(gridCornerValues[2],gridCornerValues[3], fract(uv.x));
    //return(gridCornerValues[2]);
    return (lerp(bottom, top, fract(uv.y)));
}

/*float noise3d(in vec2 uv, float frequency){
    uv *= frequency;
    vec3 uvt = vec3(uv,u_time);
    vec3 gridCornerCoords[8];
    gridCornerCoords[0] = vec3(floor(uvt));              //bottom left
    gridCornerCoords[1] = vec3(floor(uvt)) + vec3(1,0,0);  //bottom right
    gridCornerCoords[2] = vec3(floor(uvt)) + vec3(0,1,0);  //top left
    gridCornerCoords[3] = vec3(floor(uvt)) + vec3(1,1,0);  //top right
    float gridCornerValues[8];
    for (int i = 0; i<4; i++){gridCornerValues[i] = singleCornerNoise3d(gridCornerCoords[i],uv);}
    float bottom = lerp(gridCornerValues[0],gridCornerValues[1], fract(uv.x));
    float top = lerp(gridCornerValues[2],gridCornerValues[3], fract(uv.x));
    //return(gridCornerValues[2]);
    return (lerp(bottom, top, fract(uv.y)));
}*/

void main(){
    float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    //uv.x = fract(5.*(uv.x))*2.-1.;    //paving
    //uv.y = 5.*uv.y;
    float noiseValue = 0.;
    vec3 col = vec3(0.,0.,.0);
    float amplitude = 1.;
    float frequency = 1.;
    //float angle = 0.;
    for(int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        noiseValue += amplitude*noise2d(uv, frequency);
        amplitude *= 0.5;
        frequency *= 2.;
        //uv+= 0.1*rotate2d(angle)*vec2(u_time);
        //angle += 2.*3.1415/float(NOISE_ITERATION_LIMIT);
    }
    noiseValue = (noiseValue + 1.)*.5; //map to (0,1) from (-1,1)
    col = vec3(0.5*noiseValue, noiseValue, noiseValue);
    gl_FragColor = vec4(col, 1.);
}