import Vector from "../MethodClasses/Vector.js"
import Graphics from "../MethodClasses/Graphics.js"
import Object from "../ObjectClasses/Object.js"

export default class GameState {
    constructor(...args) {
        const [{display_dimensions, sens = 0.0008, lbn = [-20, 20, 20], rtf = [20, -20, 300], star_count = 60}] = args

        this.structures = {
            "cube": {
                vertices: [[-5, -5, -5], [5, -5, -5], [-5, -5, 5], [5, -5, 5], [-5, 5, -5], [5, 5, -5], [-5, 5, 5], [5, 5, 5]],
                edges: [[2, 0], [3, 1], [2, 3], [0, 1], [3, 7], [1, 5], [7, 5], [7, 6], [5, 4], [6, 4], [6, 2], [4, 0]],
                face_normals: [[[0, 5, 0], [6, 9, 7, 8]], [[5, 0, 0], [4, 6, 5, 1]], [[0, -5, 0], [1, 0, 3, 2]], [[-5, 0, 0], [9, 10, 0, 11]], [[0, 0, 5], [7, 4, 10, 2]], [[0, 0, -5], [3, 5, 11, 8]]],
                bounding_box: [[7, 7, 7], [-7, -7, -7]]
            },
            "pyramid": {
                vertices: [[0, 1.25, -5], [5, 1.25, 0], [-5, 1.25, 0], [0, 1.25, 5], [0, -3.75, 0]],    
                edges: [[1, 0], [1, 3], [2, 0], [2, 3], [4, 0], [4, 1], [4, 2], [4, 3]],
                face_normals: [[[0, 1.25, 0], [0, 2, 3, 1]], [[1.25, -1.25, 1.25], [5, 7, 1]], [[-1.25, -1.25, 1.25], [7, 3, 6]], [[1.25, -1.25, -1.25], [5, 4, 0]], [[-1.25, -1.25, -1.25], [6, 4, 2]]],
                bounding_box: [[7, 3.25, 7], [-7, -3.25, -7]]
            }
        }

        this.delta_coords = [0, 0]
        this.delta_time

        this.sensitivity = sens

        this.key_down_state = {
            "KeyW": false,
            "KeyS": false,
            "keyT": false
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
        this.laser_damage = 20

        this.player_health = 100

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
        let lasers = this.game_objects.filter(e => e.tag == "player_laser").map(e => [e.position, this.game_objects.indexOf(e)])

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
        if (this.key_down_state["keyT"] && !this.target_locked) {
            let closest = [0, 0]
            for (let i = 0; i < this.game_objects.length; i++) {
                let obj = this.game_objects[i]
                if (obj.face_normals.length > 0) {
                    let d = Vector.dot(Vector.scale(enemy_objects.position, 1), player_velocity)
                    if (d > closest[0]) {
                        closest = [d, i]
                    }
                }
            }
            this.game_objects[closest[1]].locked = true
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
                this.game_objects.push(Object.spawnLaser("player", player_velocity, [0, 0, 0], 6, "purple"))
                this.fire_timer = this.fire_rate
                this.overheat_counter = Math.min(this.max_shots, this.overheat_counter + 1)
            }
            if (this.overheat_counter == this.max_shots) {
                this.fire_timer = 20
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

            let obj = this.game_objects[i]
            // Player damage check
            if (obj.tag == "enemy_laser") {
                let within = true
                for (let k = 0; k < 3; k++) {
                    if(!(Math.abs(obj.position[k]) < 20)) {
                        within = false
                        break
                    }
                }
                if (within) {
                    this.player_health -= 5
                    this.game_objects[i].timer = 0
                }
            }

            trig_vals.siny *= -1, trig_vals.sinx *= -1
            let rotated_vertices = [], rotated_face_views = [], rotated_face_normals = [], edges = []

            // Enemy object calculations
            if (obj.tag == "enemy") {
                let struct = this.structures[obj.structure_name]
                edges = struct.edges

                // Rendering
                for (let k = 0; k < Math.max(struct.vertices.length, struct.face_normals.length); k++) {
                    if (k < struct.vertices.length) {
                        let game_vertex = Vector.add(obj.position, struct.vertices[k])
                        rotated_vertices.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
                    }
                    if (k < struct.face_normals.length) {
                        let face_view = Vector.add(obj.position, struct.face_normals[k][0])
                        rotated_face_views.push(Graphics.rotateAroundOriginByYX(face_view, trig_vals))
    
                        rotated_face_normals.push([Graphics.rotateAroundOriginByYX(struct.face_normals[k][0], trig_vals), struct.face_normals[k][1]])
                    }
                }

                // Collision detection with player lasers
                let p1 = Vector.add(obj.position, struct.bounding_box[0])
                let p2 = Vector.add(obj.position, struct.bounding_box[1])
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
                        this.hit_counter += 1
                        break
                    }
                }

                // Chance to fire at player if within a certain range
                if (Vector.length(obj.position) < 500 && Math.random() > 0.999) {
                    this.game_objects.push(Object.spawnLaser("enemy", player_velocity.map(e => -e), obj.position, 6, "red"))
                }

                // Position on radar
                trig_vals.cosx = 1, trig_vals.sinx = 0
                let rotated_pos = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
                let radar_point = [(rotated_pos[0] * this.radar_radius) / this.radar_range, (-rotated_pos[2] * this.radar_radius) / this.radar_range, 0]
                if (Vector.length(radar_point) < this.radar_radius) {
                    this.radar_points.push(radar_point)
                }
            } 
            // Debris calculations
            else if (obj.tag == "debris") {
                edges = obj.edges
                for (let vertex of obj.vertices) {
                    let game_vertex = Vector.add(obj.position, vertex)
                    rotated_vertices.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
                }
            } 
            // Projectile calculations
            else {
                rotated_vertices.push(Graphics.rotateAroundOriginByYX(obj.position, trig_vals))
            }

            trig_vals.cosx = Math.cos(this.rotation_x), trig_vals.sinx = Math.sin(this.rotation_x), trig_vals.siny *= -1

            // Only objects in view are rendered
            if (rotated_vertices[0][2] > this.lbn[2]) {
                this.current_colour = obj.colour
                this.current_edges = Graphics.findVisibleEdges(rotated_face_views, rotated_face_normals, edges)
                this.current_vertices = Graphics.applyPerspectiveProjection(rotated_vertices, this.rtf, this.lbn, this.display_dimensions)
                this.drawObject()
            }
        }
        
        // Blows up objects with zero health
        let dead_objects = this.game_objects.filter(e => e.health <= 0)
        this.game_objects = this.game_objects.filter(e => e.health > 0)
        for (let obj of dead_objects) {
            this.game_objects.push(...Object.spawnDebris(this.structures[obj.structure_name], obj, 0.1))
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