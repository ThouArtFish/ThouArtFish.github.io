import Vector from "./Vector.js"

export default class Graphics {
    constructor(...args) {
        const [{lbn, rtf}] = args

        this.lbn = lbn
        this.rtf = rtf

        this.struct = {
            "cube": {
                vertices: [[-6, -6, -6], [6, -6, -6], [-6, -6, 6], [6, -6, 6], [-6, 6, -6], [6, 6, -6], [-6, 6, 6], [6, 6, 6]],
                faces: [
                    [[0, 6, 0], [5, 7, 6, 4]], 
                    [[6, 0, 0], [3, 7, 5, 1]], 
                    [[0, -6, 0], [3, 1, 0, 2]], 
                    [[-6, 0, 0], [6, 4, 0, 2]],
                    [[0, 0, 6], [7, 6, 2, 3]], 
                    [[0, 0, -6], [0, 1, 5, 4]]
                ],
                bounding_box: [[6, 6, 6], [-6, -6, -6]]
            },
            "octahedron": {
                vertices: [[0, 0, 9], [0, 0, -9], [0, 9, 0], [0, -9, 0], [9, 0, 0], [-9, 0, 0]],
                faces: [
                    [[-3, 3, -3], [2, 5, 1]], [[3, 3, -3], [2, 1, 4]], [[3, -3, -3], [4, 1, 3]], [[-3, -3, -3], [3, 5, 1]], 
                    [[-3, 3, 3], [2, 5, 0]], [[3, 3, 3], [2, 0, 4]], [[3, -3, 3], [4, 0, 3]], [[-3, -3, 3], [3, 5, 0]]
                ],
                bounding_box: [[9, 9, 9], [-9, -9, -9]]
            },
            "dodecahedron" : {
                vertices: [
                    [-37.4, -14.2, 0], [-23, -23, -23], [-23, -23, 23], [-23, 23, 23], [-23, 23, -23],
                    [-37.4, 14.2, 0], [-14.2, 0, 37.4], [-14.2, 0, -37.4], [14.2, 0, -37.4], [14.2, 0, 37.4], [23, 23, 23],
                    [23, 23, -23], [23, -23, -23], [23, -23, 23], [37.4, -14.2, 0], [37.4, 14.2, 0], [0, 37.4, 14.2],
                    [0, 37.4, -14.2], [0, -37.4, 14.2], [0, -37.4, -14.2]
                ],
                faces: [
                    [[0, -16.8, 27.2], [18, 2, 6, 9, 13]], [[-16.8, -27.2, 0], [1, 0, 2, 18, 19]], [[-27.2, 0, -16.8], [7, 4, 5, 0, 1]], [[0, 16.8, -27.2], [7, 8, 11, 17, 4]], 
                    [[27.2, 0, 16.8], [15, 14, 13, 9, 10]], [[16.8, -27.2, 0], [12, 19, 18, 13, 14]], [[0, -16.8, -27.2], [8, 7, 1, 19, 12]], [[0, 16.8, 27.2], [16, 10, 9, 6, 3]], 
                    [[-27.2, 0, 16.8], [0, 5, 3, 6, 2]], [[27.2, 0, -16.8], [11, 8, 12, 14, 15]], [[-16.8, 27.2, 0], [5, 4, 17, 16, 3]], [[16.8, 27.2, 0], [17, 11, 15, 10, 16]]
                ],
                bounding_box: [[12, 12, 12], [-12, -12, -12]]
            }
        }
    }
    vertexRotationAndFaceDetection(obj, rotationYX) {
        let struct = this.struct[obj.struct]
        let vertex_info = [], face_info = []
        for (let k = 0; k < Math.max(struct.vertices.length, struct.faces.length); k++) {
            if (k < struct.vertices.length) {
                let game_vertex = Vector.add(obj.position, struct.vertices[k])
                vertex_info.push(Vector.mat_mult(rotationYX, game_vertex))
            }
            if (k < struct.faces.length) {
                let face_view = Vector.add(obj.position, struct.faces[k][0])
                let face_dot = Vector.dot(face_view, struct.faces[k][0])
                if (face_dot < 0) {
                    face_dot *= 1 / (Vector.length(struct.faces[k][0]) * Vector.length(face_view))
                    face_info.push([-face_dot, struct.faces[k][1]])
                }
            }
        }
        return [vertex_info, face_info]
    }
    generateRadarPoint(obj, rotation_y, radar_radius, radar_range) {
        let d = obj.position[0] ** 2 + obj.position[2] ** 2
        if (d > radar_range ** 2) {
            return []
        }
        let rotation_around_y = [
            [Math.cos(rotation_y), 0, -Math.sin(rotation_y)],
            [0, 1, 0],
            [Math.sin(rotation_y), 0, Math.cos(rotation_y)]
        ]
        let rotated_pos = Vector.mat_mult(rotation_around_y, obj.position)
        let radar_point = [(rotated_pos[0] * radar_radius) / radar_range, (-rotated_pos[2] * radar_radius) / radar_range, 0]
        return [radar_point, obj.colour]
    }
    applyPerspectiveProjection(vertices, x_scale, y_scale, include_z) {
        let projected_vertices = []
        for (let i = 0; i < vertices.length; i++) {
            let vertex = vertices[i]
            let x = (2 * this.lbn[2] * vertex[0] - ((this.rtf[0] + this.lbn[0]) * vertex[2])) / ((this.rtf[0] - this.lbn[0]) * vertex[2])
            let y = (2 * this.lbn[2] * vertex[1] - ((this.rtf[1] + this.lbn[1]) * vertex[2])) / ((this.lbn[1] - this.rtf[1]) * vertex[2])
            x = x * x_scale
            y = y * y_scale
            let projected_vertex = [x, y]
            if (include_z) {
                let z = Math.max(Math.min(1, (this.rtf[2] * (vertex[2] - this.lbn[2])) / ((this.rtf[2] - this.lbn[2]) * vertex[2])), 0.01)
                projected_vertex.push(z)
            }
            projected_vertices.push(projected_vertex)
        }
        return projected_vertices
    }
}