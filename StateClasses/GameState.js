import Vector from "../MethodClasses/Vector.js"
import Graphics from "../MethodClasses/Graphics.js"
import Object from "../ObjectClasses/Object.js"

export default class GameState {
    constructor(...args) {
        const [{display_dimensions, sens = 0.0008, lbn = [-20, 20, 20], rtf = [20, -20, 300], star_count = 60}] = args
        this.delta_coords = [0, 0]
        this.delta_time

        this.sensitivity = sens

        this.key_down_state = {
            "KeyW": false,
            "KeyS": false
        }
        this.mouse_down_state = {
            "0": false,
            "2": false,
        }

        this.game_objects = []

        this.lbn = lbn
        this.rtf = rtf
        this.display_dimensions = display_dimensions
        this.rotation_x = 0
        this.rotation_y = 0

        this.player_speed = 1.2
        this.default_speed = this.player_speed
        this.delta_speed = 0.2
        this.max_speed = 2
        this.min_speed = 0.4

        this.radar_centre = [display_dimensions[0] / 2, display_dimensions[1] / 2 + 250]
        this.radar_radius = 80
        this.radar_range = 500
        this.radar_points

        this.fire_rate = 0.4
        this.fire_timer = this.fire_rate
        this.max_shots = 20
        this.overheat_counter = 0
        this.overheat_active = false
        this.laser_colour = "lightblue"
        this.laser_damage = 20

        this.player_position = [0, 0, 0]


        let backgroundObjectPosition = () => {
            let pos = []
            while (pos.length < 3) {
                let f = Math.random()
                pos.push(Math.random() > 0.5 ? -f : f)
            }
            return pos
        }
        this.distant_stars = []
        while (this.distant_stars.length < star_count) {
            this.distant_stars.push(backgroundObjectPosition())
        }

        this.current_vertices
        this.current_edges
        this.current_colour
        this.current_stars
        this.current_object
    }
    mainLoop() {
        let frame_time = 60 * this.delta_time
        // Reset various arrays
        this.radar_points = []
        this.current_hud_pointers = []
        this.current_stars = []

        //Array of only player lasers for collison checks later
        let lasers = this.game_objects.filter(e => e.colour == this.laser_colour).map(e => [e.position, this.game_objects.indexOf(e)])

        // Change in mouse position is translated into change int rotation around x and y axis
        let angle_x = Math.atan(this.delta_coords[1] * this.sensitivity)
        let angle_y = Math.atan(this.delta_coords[0] * this.sensitivity)
        
        // Total rotation around x and y axis is incremented by calculated amount
        this.rotation_x = Math.max(-Math.PI/2, Math.min(Math.PI/2, this.rotation_x - angle_x))
        this.rotation_y += angle_y
        if (this.rotation_y > Math.PI) {
            this.rotation_y -= 2 * Math.PI
        }
        if (this.rotation_y < -Math.PI) {
            this.rotation_y += 2 * Math.PI
        }

        // Trignometric values which are used often
        let trig_vals = {
            cosx: Math.cos(this.rotation_x),
            cosy: Math.cos(this.rotation_y),
            sinx: Math.sin(this.rotation_x),
            siny: Math.sin(this.rotation_y)
        }

        // Velocity of player in game space
        let player_velocity = Graphics.rotateAroundOriginByXY([0, 0, this.player_speed], trig_vals)
        // Player position is changed accordingly
        this.player_position = Vector.add(player_velocity.map(e => e * frame_time), this.player_position)

        //Keyboard input
        if (this.key_down_state["KeyW"] && !this.key_down_state["KeyS"]) {
            this.player_speed = Math.min(this.max_speed, this.player_speed + this.delta_speed * this.delta_time)
        } else if (!this.key_down_state["KeyW"] && this.key_down_state["KeyS"]) {
            this.player_speed = Math.max(this.min_speed, this.player_speed - this.delta_speed * this.delta_time)
        } else {
            if (this.player_speed > this.default_speed) {
                this.player_speed = Math.max(this.default_speed, this.player_speed - this.delta_speed * this.delta_time)
            } else if (this.player_speed < this.default_speed) {
                this.player_speed = Math.min(this.default_speed, this.player_speed + this.delta_speed * this.delta_time)
            }
        }

        //Mouse input
        if (this.overheat_active) {
            this.fire_timer -= this.delta_time
            if (this.fire_timer < 0) {
                this.fire_timer = 0
                this.overheat_counter = 0
                this.overheat_active = false
            }
        }
        if (this.mouse_down_state["0"] && !this.overheat_active) {
            this.fire_timer -= this.delta_time
            if (this.fire_timer < 0) {
                let laser_origin = Graphics.rotateAroundOriginByXY([0, 3, 0], trig_vals)
                this.game_objects.push(Object.spawnLaser(player_velocity, laser_origin, 4, this.laser_colour))
                this.fire_timer = this.fire_rate
                this.overheat_counter = Math.min(this.max_shots, this.overheat_counter + 1)
            }
            if (this.overheat_counter == this.max_shots) {
                this.fire_timer = 10
                this.overheat_active = true
            }
        }
        if (!this.mouse_down_state["0"] && this.overheat_counter > 0 && !this.overheat_active) {
            this.overheat_counter -= this.delta_time
        }
        
        // Background star calculations and rendering
        trig_vals.siny *= -1, trig_vals.sinx *= -1
        let rotated_stars = this.distant_stars.map(e => Graphics.rotateAroundOriginByYX(e, trig_vals))
        this.current_stars = Graphics.applyPerspectiveProjection(rotated_stars, this.rtf, this.lbn, this.display_dimensions)
        this.drawBackground()
        trig_vals.siny *= -1, trig_vals.sinx *= -1

        // Game objects are iterated through
        for (let i = 0; i < this.game_objects.length; i++) {
            // Time until deletion is reduced
            this.game_objects[i].timer -= this.delta_time
            // The total change in position for an object, being the sum of it's velocity and the relative velocity to the player
            let sum_velocity = Vector.add(this.game_objects[i].velocity, player_velocity.map(e => -e)).map(e => e * frame_time)
            this.game_objects[i].position = Vector.add(this.game_objects[i].position, sum_velocity)
            // Collision check
            let obj = this.game_objects[i]
            if (obj.colour != this.laser_colour && obj.face_normals.length > 0) {
                let p1 = Vector.add(obj.position, obj.bounding_box[0])
                let p2 = Vector.add(obj.position, obj.bounding_box[1])
                for (let l = 0; l < lasers.length; l++) {
                    let within = true
                    for (let k = 0; k < 3; k++) {
                        if (!(lasers[l][0][k] < p1[k] && lasers[l][0][k] > p2[k])) {
                            within = false
                            break
                        }
                    }
                    if (within) {
                        this.game_objects[i].health -= this.laser_damage
                        this.game_objects[lasers[l][1]].timer = 0
                        break
                    }
                }
            }
            // Object calculations
            trig_vals.siny *= -1, trig_vals.sinx *= -1
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

            // Radar calculations
            if (rotated_face_views.length > 0) {
                trig_vals.cosx = 1, trig_vals.sinx = 0
                let rotated_pos = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
                let radar_point = [(rotated_pos[0] * this.radar_radius) / this.radar_range, (-rotated_pos[2] * this.radar_radius) / this.radar_range, 0]
                if (Vector.length(radar_point) < this.radar_radius) {
                    this.radar_points.push(radar_point)
                }
            }
            trig_vals.cosx = Math.cos(this.rotation_x), trig_vals.sinx = Math.sin(this.rotation_x), trig_vals.siny *= -1

            // Only objects in view are rendered
            if (rotated_vertices[0][2] > this.lbn[2]) {
                this.current_colour = obj.colour
                this.current_edges = Graphics.findVisibleEdges(rotated_face_views, rotated_face_normals, obj.edges)
                this.current_vertices = Graphics.applyPerspectiveProjection(rotated_vertices, this.rtf, this.lbn, this.display_dimensions)
                this.drawObject()
            }
        }
        // Blows up objects with zero health
        let dead_objects = this.game_objects.filter(e => e.health <= 0)
        this.game_objects = this.game_objects.filter(e => e.health > 0)
        for (let obj of dead_objects) {
            this.game_objects.push(...Object.spawnDebris(obj, 0.1))
        }
        // Filters out timed out objects
        this.game_objects = this.game_objects.filter(e => e.timer > 0)
        // HUD is drawn on top
        this.drawHUD()
    }
    drawHUD() {
        return null
    }
    drawObject() {
        return null
    }
    drawBackground() {
        return null
    }
    enter() {
        return null
    }
    exit() {
        return null
    }
}