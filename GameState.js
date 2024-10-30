import Vector from "/Vector.js"
import Graphics from "/Graphics.js"

export default class GameState {
    constructor(...args) {
        const [{display_dimensions, sens = 0.0008, lbn = [-20, 20, 20], rtf = [20, -20, 220]}] = args
        this.sensitivity = sens
        this.rotation_x = 0
        this.rotation_y = 0
        this.game_objects = []
        this.delta_coords = [0, 0]
        this.player_speed = 0.8
        this.radar_points = []
        this.delta_time = 0
        this.lbn = lbn
        this.rtf = rtf
        this.display_dimensions = display_dimensions
        this.radar_centre = [display_dimensions[0] / 2, display_dimensions[1] / 2 + 250]
        this.radar_radius = 80
        this.current_vertices
        this.current_edges
        this.object_relative_velocity = [0, 0, -this.player_speed]
    }
    spawnObject(object, velocity, spawn_position) {
        let game_object = {
            vertices: object.vertices,
            position: spawn_position,
            edges: object.edges,
            velocity: velocity,
            face_normals: object.face_normals,
        }
        this.game_objects.push(game_object)
    }
    mainLoop() {
        this.radar_points = []

        let angle_x = Math.atan(this.delta_coords[1] * this.sensitivity)
        let angle_y = Math.atan(this.delta_coords[0] * this.sensitivity)
    
        this.rotation_x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation_x - angle_x))
        this.rotation_y += angle_y
        if (this.rotation_y > Math.PI) {
            this.rotation_y -= 2 * Math.PI
        }
        if (this.rotation_y < -Math.PI) {
            this.rotation_y += 2 * Math.PI
        }

        let trig_vals = {
            cosx: Math.cos(this.rotation_x),
            cosy: Math.cos(this.rotation_y),
            sinx: Math.sin(this.rotation_x),
            siny: Math.sin(this.rotation_y)
        }       
    
        for (let i = 0; i < this.game_objects.length; i++) {
            let object_relative_velocity = Graphics.rotateAroundOriginByXY([0, 0, -this.player_speed], trig_vals)
            let sum_velocity = Vector.add(this.game_objects[i].velocity, object_relative_velocity).map(e => e * this.delta_time)
            this.game_objects[i].position = Vector.add(this.game_objects[i].position, sum_velocity)

            trig_vals.siny *= -1, trig_vals.sinx *= -1
            let obj = this.game_objects[i]
            let rotated_vertices = [], rotated_face_views = [], rotated_face_normals = []
            for (let k = 0; k < Math.max(obj.vertices.length, obj.face_normals.length); k++) {
                if (k < obj.vertices.length) {
                    let game_vertex = Vector.add(obj.position, obj.vertices[k])
                    rotated_vertices.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
                }
                if (k < obj.face_normals.length) {
                    let face_view = Vector.add(obj.position, obj.face_normals[k][0])
                    rotated_face_views.push(Graphics.rotateAroundOriginByYX(face_view, trig_vals))

                    rotated_face_normals.push([Graphics.rotateAroundOriginByYX(obj.face_normals[k][0], trig_vals), obj.face_normals[k][1]])
                }
            }

            trig_vals.cosx = 1, trig_vals.sinx = 0
            let rotated_pos = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
            let radar_point = [(rotated_pos[0] * this.radar_radius) / 300, (-rotated_pos[2] * this.radar_radius) / 300, 0]
            if (Vector.length(radar_point) < this.radar_radius) {
                this.radar_points.push(radar_point)
            }
            trig_vals.cosx = Math.cos(this.rotation_x), trig_vals.sinx = Math.sin(this.rotation_x), trig_vals.siny *= -1

            if (rotated_vertices[0][2] > this.lbn[2]) {
                this.current_edges = Graphics.findVisibleEdges(rotated_face_views, rotated_face_normals, obj.edges)
                this.current_vertices = Graphics.applyPerspectiveProjection(rotated_vertices, this.rtf, this.lbn, this.display_dimensions)
                this.drawObject()
            }
        }
        this.drawHUD()
    }
    drawHUD() {
        return null
    }
    drawObject() {
        return null
    }
    enter() {
        return null
    }
    exit() {
        return null
    }
}