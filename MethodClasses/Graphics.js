import Vector from "./Vector.js"

export default class Graphics {
    static rotateAroundOriginByYX(vertex, trig_vals) {
        let rotation_matrix = [
            [trig_vals.cosy, 0, trig_vals.siny],
            [trig_vals.siny * trig_vals.sinx, trig_vals.cosx, -trig_vals.sinx * trig_vals.cosy], 
            [-trig_vals.siny * trig_vals.cosx, trig_vals.sinx, trig_vals.cosx * trig_vals.cosy]
        ]
        return Vector.mat_mult(rotation_matrix, vertex)
    }
    static rotateAroundOriginByXY(vertex, trig_vals) {
        let rotation_matrix = [
            [trig_vals.cosy, trig_vals.sinx * trig_vals.siny, trig_vals.cosx * trig_vals.siny],
            [0, trig_vals.cosx, -trig_vals.sinx],
            [-trig_vals.siny, trig_vals.sinx * trig_vals.cosy, trig_vals.cosx * trig_vals.cosy]
        ]
        return Vector.mat_mult(rotation_matrix, vertex)
    }
    static applyPerspectiveProjection(vertices, rtf, lbn, display_dimensions, include_z) {
        let projected_vertices = []
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i]
            let x = (2 * lbn[2] * vertex[0] - ((rtf[0] + lbn[0]) * vertex[2])) / ((rtf[0] - lbn[0]) * vertex[2])
            let y = (2 * lbn[2] * vertex[1] - ((rtf[1] + lbn[1]) * vertex[2])) / ((lbn[1] - rtf[1]) * vertex[2])
            let x_scale = display_dimensions[0] / 2, y_scale = display_dimensions[1] / 2
            x = x * x_scale + x_scale
            y = y * y_scale + y_scale
            let projected_vertex = [x, y]
            if (include_z) {
                let z = Math.max(Math.min(1, (rtf[2] * (vertices[0][2] - lbn[2])) / ((rtf[2] - lbn[2]) * vertices[0][2])), 0.1)
                projected_vertex.push(z)
            }
            projected_vertices.push(projected_vertex)
        }
        return projected_vertices
    }
}