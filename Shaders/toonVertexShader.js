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

