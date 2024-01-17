export const toonFragmentShader = `
precision mediump float;


in vec3 v_normal;
in vec3 v_surfaceToLight;
in vec3 v_surfaceToView;

uniform float u_lightPower;
uniform vec3 u_lightDirection;
uniform float u_limit;         

void main() {
  vec3 normal = normalize(v_normal);
  vec3 surfaceToLightDirection = normalize(v_surfaceToLight);
  vec3 surfaceToViewDirection = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLightDirection + surfaceToViewDirection);

  float intensity = max(dot(surfaceToLightDirection,-normalize(u_lightDirection)), 0.0);
  if(intensity>= u_limit){
    if (intensity > 0.98){
      gl_FragColor = vec4(0.8, 0.8, 0.8, 1.0);
    }  
    else if (intensity > 0.90){
      gl_FragColor = vec4(0.4, 0.4, 0.4, 1.0);
    }
    else if (intensity > 0.80){
      gl_FragColor = vec4(0.2, 0.2, 0.2, 1.0);
    }
    else{
      gl_FragColor = vec4(0.1, 0.1, 0.1, 1.0);
    }
  }
  else{
    gl_FragColor = vec4(0,0,0, 1.0);
  }
  
  gl_FragColor.rgb *= (u_lightPower/2000.0);

}
`;

export const havaliFragmentShader = `
uniform float u_time;
in vec3 v_position;

void main() {
    if (cos(2.0 * v_position.y + 3.0 * u_time) < 0.0) {
        discard;
    }
    gl_FragColor = vec4(v_position.x,v_position.y,v_position.z,1);
}

`;


export const desFragmentShader = `
uniform float u_time;
in vec3 pos;
void main() {
  gl_FragColor = vec4(0.5,0.5,0.5,1.0);
  gl_FragColor.r += sin(u_time *pos.x/1000.0)/2.0;
  gl_FragColor.g += cos(u_time*pos.y/1000.0)/2.0;
  gl_FragColor.b += sin(2.0*u_time*pos.z/1000.0)/2.0;
}
`;