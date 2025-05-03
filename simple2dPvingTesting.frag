#version 300 es
precision highp float;

out vec4 Color;
uniform vec2 u_resolution;
uniform float u_time;
const vec3 PATTERN_SHIFT = vec3(980.549,814.0278,713.632);

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
float hashFloat(in vec2 seed)
{
    seed += PATTERN_SHIFT.xy;
    uint hashX = hashUint(uint(seed.x));
    uint hashXY = hashUint(hashX + uint(seed.y));
    return float(hashXY) / float(0xffffffffU);
}

float sdCircle(in vec2 pos, in vec2 center, in float radius){
    return length(pos-center) - radius;
}

float sdCircleGrid(in float frequency, in vec2 position){
    float result = 10000.1;    //just a big number
    position *= frequency;
    
    vec2 cellID = floor(position);            //ID of the cell, in which position is
    vec2 positionRelative = fract(position);    //position relative to current cell origin
    //baseCell is the cell where the closest sphere can be with minimal xyz
    vec2 baseCellOffset = vec2(0);

    baseCellOffset = -1.*vec2(positionRelative.x<0.5, positionRelative.y<0.5);

    vec2 baseCellID = cellID + baseCellOffset;
    for(int x = 0; x < 2; x++){
    for(int y = 0; y < 2; y++){
        vec2 runningCellID = baseCellID + vec2(x,y);
        float radius = 0.5 * hashFloat(runningCellID);
        float dist = (1./frequency) * sdCircle(position, runningCellID + vec2(0.5), radius);
        if (dist < result) result = dist;
    }
    }
    return result;

}

float map (in vec2 pos){
    float circleGrid = sdCircleGrid(4., pos);
    float circle = sdCircle(pos, vec2(0), .5);
    //return circle;
    return circleGrid;
}

void main()
{
    //float t = u_time * 2.; //anim speed
    vec2 uv = (gl_FragCoord.xy * 2. - u_resolution.xy)/u_resolution.y;
    //uv *= 5.;
    //uv = vec2(0.5);
    float sdf = map(uv);

    vec3 col = vec3(0);

    float linesFrequency = 34.0;

    float red = 0.; 
    float green = 0.;
    float blue = 0.;
    
    red = -1.*sign(sdf)*fract(sdf*linesFrequency);
    //red = fract(sdf);
    green = abs(2. * sdf);
    blue = sign(sdf)*abs(sin(3.1415*linesFrequency*sdf));

    col = vec3(red, green, blue);
    Color = vec4(col, 1.);
    //return(vec4(col,1.));
}