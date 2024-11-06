import Vector from "./Vector.js"

export default class Graphics {
    static rotateAroundOriginByYX(vertex, trig_edges) {
        let rotation_matrix = [
            [trig_edges.cosy, 0, trig_edges.siny],
            [trig_edges.siny * trig_edges.sinx, trig_edges.cosx, -trig_edges.sinx * trig_edges.cosy], 
            [-trig_edges.siny * trig_edges.cosx, trig_edges.sinx, trig_edges.cosx * trig_edges.cosy]
        ]
        return Vector.mat_mult(rotation_matrix, vertex)
    }
    static rotateAroundOriginByXY(vertex, trig_edges) {
        let rotation_matrix = [
            [trig_edges.cosy, trig_edges.sinx * trig_edges.siny, trig_edges.cosx * trig_edges.siny],
            [0, trig_edges.cosx, -trig_edges.sinx],
            [-trig_edges.siny, trig_edges.sinx * trig_edges.cosy, trig_edges.cosx * trig_edges.cosy]
        ]
        return Vector.mat_mult(rotation_matrix, vertex)
    }
    static applyPerspectiveProjection(vertices, rtf, lbn, display_dimensions) {
        let projected_vertices = []
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i]
            let x = (2 * lbn[2] * vertex[0] - ((rtf[0] + lbn[0]) * vertex[2])) / ((rtf[0] - lbn[0]) * vertex[2])
            let y = (2 * lbn[2] * vertex[1] - ((rtf[1] + lbn[1]) * vertex[2])) / ((lbn[1] - rtf[1]) * vertex[2])
            let z = Math.max(Math.min(1, (rtf[2] * (vertices[0][2] - lbn[2])) / ((rtf[2] - lbn[2]) * vertices[0][2])), 0.1)
            let x_scale = display_dimensions[0] / 2, y_scale = display_dimensions[1] / 2
            x = x * x_scale + x_scale
            y = y * y_scale + y_scale
            projected_vertices.push([x, y, z])
        }
        return projected_vertices
    }
    static sequenceVisibleFaces(dot_edges) {
        if (dot_edges.length == 0) {
            return []
        } else {
            let face_vertex_sequences = []
            for (let i = 0; i < dot_edges.length; i++) {
                if (dot_edges[i][0] < 0) {
                    face_vertex_sequences.push(dot_edges[i][1])
                }
            }
            return face_vertex_sequences
        }
    }
}