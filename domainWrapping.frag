#version 300 es
precision mediump float;

uniform vec2 u_resolution;
uniform float u_time;
out vec4 Color;
const int NOISE_ITERATION_LIMIT = 7;
const vec3 PATTERN_SHIFT = vec3(1234.,9675.,71713.);

vec3 paletteBrownish (float t){
    vec3 a = vec3(0.5, 0.31, 0.15);
    vec3 b = vec3(0.37, 0.18, 0.15);
    vec3 c = vec3(0.5, 0.5, 0.5);
    vec3 d = vec3(0.5,0.5,0.);
    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 paletteBlueMagenta( float t ) {
    vec3 a = vec3(0.6, 0., 0.8);
    vec3 b = vec3(0.4, 0., 0.2);
    vec3 c = vec3(.5, .0, .5);
    vec3 d = vec3(.5,0.,0.);

    return a + b*cos( 6.28318*(c*t+d) );
} 
vec3 paletteRainbow( float t ) {
    vec3 a = vec3(0.5, 0.5, 0.5);
    vec3 b = vec3(0.5, 0.5, 0.5);
    vec3 c = vec3(1.0, 1.0, 1.0);
    vec3 d = vec3(0.0,0.33,0.67);
    return a + b*cos( 6.28318*(c*t+d) );
}
vec3 paletteCyan( float t ) {
    vec3 a = vec3(0., 0.7, 0.7);
    vec3 b = vec3(0., 0.25, 0.25);
    vec3 c = vec3(.5, .5, 0.25);
    vec3 d = vec3(0.5,0.5,- 0.25);

    return a + b*cos( 6.28318*(c*t+d) );
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}
uint hashUint (in uint seed){ //murmur type of hash from https://t.ly/bKdP7
    seed ^= seed >> 17;
    seed *= 0xed5ad4bbU;
    seed ^= seed >> 11;
    seed *= 0xac4c1b51U;
    seed ^= seed >> 15;
    seed *= 0x31848babU;
    seed ^= seed >> 14;
    return seed;
}
float hashFloat(in vec2 seed){
    uint hashX = hashUint(uint(seed.x + PATTERN_SHIFT.x));
    uint hashXY = hashUint(hashX + uint(seed.y + PATTERN_SHIFT.y));
    return float(hashXY) / float(0xFFFFFFFFU);
}
float hashFloat(in vec3 seed){
    seed += PATTERN_SHIFT.xyz;
    uint hashX = hashUint(uint(seed.x));
    uint hashXY = hashUint(hashX + uint(seed.y));
    uint hashXYZ = hashUint(hashXY + uint(seed.z));
    return float(hashXYZ) / float(0xffffffffu);
}
vec2 hashVec2Unit(in vec2 seed){
    float hashAngle = 2.*3.1415*hashFloat(seed);
    return vec2(cos(hashAngle),sin(hashAngle));
}
vec3 hashVec3Unit(in vec3 seed){
    float phi = (2.*hashFloat(seed)-1.)*3.1415;      //phi spherical coordinate, (-Pi,Pi)
    float Theta = acos(2.*hashFloat(seed + PATTERN_SHIFT.xyz) - 1.);    //Theta spherical coordinate
    return vec3(cos(phi)*sin(Theta),sin(phi)*sin(Theta),cos(Theta));
}

float singleCornerNoise2d (vec2 gridCorner, vec2 point){      
    float res;
    res = dot(gridCorner - point, hashVec2Unit(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-pi;pi)
    //res = (res + 1.)*.5;            //map to (0;1)
    //if(res > 1.3)
    return (res);
}
/*float singleCornerNoise3d (vec3 gridCorner, vec3 point){      
    float res;
    res = dot(gridCorner - point, hashVec3Unit(gridCorner));
    res = atan(res)* 2./3.1415;     //map to (-1;1)
    //res = atan(res) ;             //map to (-pi;pi)
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
/*float noise3d(in vec3 uvw, float frequency){
    uvw *= frequency;
    vec3 cellID = floor(uvw);
    vec3 gridCornerCoords[8];
    for(int x = 0; x <= 1; x++){
    for(int y = 0; y <= 1; y++){
    for(int z = 0; z <= 1; z++){
        gridCornerCoords[0 + 4*z + 2*y + x] = cellID + vec3(x,y,z);
    }
    }
    }
    float gridCornerValues[8];
    for (int i = 0; i<8; i++){gridCornerValues[i] = singleCornerNoise3d(gridCornerCoords[i],uvw);}
    float bottom = lerp(gridCornerValues[0],gridCornerValues[1], fract(uv.x));
    float top = lerp(gridCornerValues[2],gridCornerValues[3], fract(uv.x));
    //return(gridCornerValues[2]);
    return (lerp(bottom, top, fract(uv.y)));
}*/
float fbm (float startingFrequency, vec2 position){
    float noiseValue = 0.;
    float frequency = startingFrequency;
    float  amplitude = 1./frequency;
    //float angle = 0.;
    for(int i = 0; i < NOISE_ITERATION_LIMIT; i++){
        noiseValue += amplitude*noise2d(position, frequency);
        amplitude *= 0.25;
        frequency *= 2.;
        position += PATTERN_SHIFT.xy;
        //uv+= 0.1*rotate2d(angle)*vec2(u_time);
        //angle += 2.*3.1415/float(NOISE_ITERATION_LIMIT);
    }
    return noiseValue; 
}
vec2 fbm2d (float startingFrequency, vec2 position){
    return 3.5*vec2 (fbm(startingFrequency, position), fbm(startingFrequency, position + PATTERN_SHIFT.xy));
}

void main(){
    float t = u_time * .2; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    //uv.x = fract(5.*(uv.x))*2.-1.;    //paving
    //uv.y = 5.*uv.y;
    float noiseValue = 0.;
    vec2 noiseVec2 = vec2(0.);
    vec3 col = vec3(0.,0.,0.);
    noiseVec2 = fbm2d(1., uv);
    for(int i = 0; i < 3; i++){
        noiseVec2 = fbm2d(1., uv + noiseVec2 + t);
    }
    noiseValue = fbm(1., uv + noiseVec2);
    //noiseValue = fbm(1., uv);
    noiseValue = (noiseValue + 1.)*.5; //map to (0,1) from (-1,1)
    //col = vec3(0.5*noiseValue, noiseValue, noiseValue);
    col = paletteCyan(noiseValue);
    Color = vec4(col, 1.);
}