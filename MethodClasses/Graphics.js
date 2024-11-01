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
    static applyPerspectiveProjection(vertices, rtf, lbn, display_dimensions) {
        let projected_vertices = []
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i]
            let x = (2 * lbn[2] * vertex[0] - ((rtf[0] + lbn[0]) * vertex[2])) / ((rtf[0] - lbn[0]) * vertex[2])
            let y = (2 * lbn[2] * vertex[1] - ((rtf[1] + lbn[1]) * vertex[2])) / ((lbn[1] - rtf[1]) * vertex[2])
            let x_scale = display_dimensions[0] / 2, y_scale = display_dimensions[1] / 2
            x = x * x_scale + x_scale
            y = y * y_scale + y_scale
            projected_vertices.push([x, y])
        }
        return projected_vertices
    }
    static findVisibleEdges(face_views, face_normals, edges) {
        let shown_edges = new Set();
        for (let i = 0; i < face_normals.length; i++) {
            let dot_prod = Vector.dot(face_views[i], face_normals[i][0])
            if (dot_prod < 0) {
                face_normals[i][1].forEach(e => shown_edges.add(edges[e]))
            }
        }
        return face_views.length > 0 ? [...shown_edges] : edges
    }
}