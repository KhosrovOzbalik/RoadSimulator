export const toonVertexShader = `
    uniform vec3 u_lightWorldPosition;
    uniform vec3 u_viewWorldPosition;
    out vec3 v_normal;
    out vec3 v_surfaceToLight;
    out vec3 v_surfaceToView;


    void main() {

        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        v_normal =  normalize(normalMatrix * normal);

        vec3 surfaceWorldPosition = (modelMatrix  * vec4(position, 1.0)).xyz;
        v_surfaceToLight = u_lightWorldPosition - surfaceWorldPosition;
        v_surfaceToView = u_viewWorldPosition - surfaceWorldPosition;
    }

`;


export const havaliVertexShader = `
out vec3 v_position;
void main() {
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    v_position =  position;
}

`;

export const desVertexShader = `
uniform float u_time;
out vec3 pos;

void main() {
	float r = 15.0;
	float theta = 0.87 * u_time;
	float phi = 0.63 * u_time;
    
	vec3 attractor_position = r * vec3(sin(theta) * cos(phi), sin(theta) * sin(phi), cos(theta));

	vec3 effect_direction = attractor_position - position;
	float effect_intensity = min(30.0 * pow(length(effect_direction), -2.0), 1.0);
	vec3 new_position = position + effect_intensity * effect_direction;

	// Calculate the modelview position
	vec4 mv_position = modelViewMatrix * vec4(new_position, 1.0);

	// Save the varyings
	vec3 v_position = mv_position.xyz;
	vec3 v_normal = normalize(normalMatrix * normal);

    pos = (projectionMatrix * mv_position).xyz;
	// Vertex shader output
	gl_Position = projectionMatrix * mv_position;
}
`;


