import Vector from "../MethodClasses/Vector.js"
import Graphics from "../MethodClasses/Graphics.js"
import Object from "../ObjectClasses/Object.js"

export default class GameState {
    constructor(...args) {
        const [{display_dimensions, sens = 0.0008, lbn = [-20, 20, 20], rtf = [20, -20, 1000], star_count = 60}] = args

        this.structures = {
            "cube": {
                vertices: [[-5, -5, -5], [5, -5, -5], [-5, -5, 5], [5, -5, 5], [-5, 5, -5], [5, 5, -5], [-5, 5, 5], [5, 5, 5]],
                faces: [
                    [[0, 5, 0], [5, 7, 6, 4]], 
                    [[5, 0, 0], [3, 7, 5, 1]], 
                    [[0, -5, 0], [3, 1, 0, 2]], 
                    [[-5, 0, 0], [6, 4, 0, 2]],
                    [[0, 0, 5], [7, 6, 2, 3]], 
                    [[0, 0, -5], [0, 1, 5, 4]]
                ],
                bounding_box: [[7, 7, 7], [-7, -7, -7]]
            },
            "pyramid": {
                vertices: [[0, 1.25, -5], [5, 1.25, 0], [-5, 1.25, 0], [0, 1.25, 5], [0, -3.75, 0]],    
                faces: [
                    [[0, 1.25, 0], [1, 0, 2, 3]], 
                    [[1.25, -1.25, 1.25], [4, 1, 3]], 
                    [[-1.25, -1.25, 1.25], [4, 3, 2]], 
                    [[1.25, -1.25, -1.25], [1, 0, 4]], 
                    [[-1.25, -1.25, -1.25], [0, 2, 4]]
                ],
                bounding_box: [[7, 3.25, 7], [-7, -3.25, -7]]
            }
        }

        this.delta_coords = [0, 0]
        this.delta_time

        this.sensitivity = sens

        this.key_down_state = {
            "KeyW": false,
            "KeyS": false,
            "KeyQ": false
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

        this.radar_centre = [display_dimensions[0] / 2, display_dimensions[1] * 0.85]
        this.radar_radius = 80
        this.radar_range = 500
        this.radar_points

        this.fire_rate = 0.4
        this.fire_timer = this.fire_rate
        this.max_shots = 20
        this.overheat_counter = 0
        this.overheat_active = false
        this.laser_damage = 20
        this.laser_speed = 6
        this.enemy_laser_colour = "#ff4242"
        this.player_laser_colour = "#53fc5c"

        this.locking_time = 3
        this.lock_colour = "orange"
        this.locking_timer = this.locking_time
        this.missile_time = 8
        this.missile_speed = 5
        this.missile_damage = 100
        this.missiles_left = 3
        this.missile_colour = "yellow"
        this.max_missiles = this.missiles_left
        this.just_fired = false
        this.locking_counter = 1

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

        this.current_stars
        this.current_render
    }
    registerKeyboardInput(player_velocity) {
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

        this.just_fired = (this.key_down_state["KeyQ"] && this.just_fired) ? true : false
        if (this.key_down_state["KeyQ"] && this.locking_timer == this.locking_time && !this.just_fired && this.missiles_left > 0) {
            let closest = [0]
            for (let i = 0; i < this.game_objects.length; i++) {
                if (this.game_objects[i].tag == "enemy") {
                    let d = Vector.dot(Vector.scale(this.game_objects[i].position, 1), player_velocity)
                    if (d > closest[0] && this.game_objects[i].lock_tag < 0) {
                        closest = [d, i]
                    }
                }
            }
            if (closest.length > 1) {
                this.game_objects[closest[1]].lock_tag = this.locking_counter
                this.locking_timer -= this.delta_time
            }
        } else if (this.key_down_state["KeyQ"] && this.locking_timer < this.locking_time) {
            this.locking_timer -= this.delta_time
            if (this.locking_timer < 0) {
                this.lock_colour = "red"
            }
        } else if (!this.key_down_state["KeyQ"] && this.locking_timer < this.locking_time) {
            let i = this.game_objects.findIndex(e => (e.lock_tag == this.locking_counter) && (e.tag != "missile"))
            if (i != -1) {
                this.game_objects[i].lock_tag = -1
            }
            this.lock_colour = "orange"
            this.locking_timer = this.locking_time
        }
    }
    registerMouseInput(player_velocity) {
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
                this.game_objects.push(Object.spawnLaser("player", Vector.scale(player_velocity, this.laser_speed), [0, 0, 0], this.player_laser_colour))
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

        if (this.mouse_down_state["2"] && this.locking_timer < 0) {
            this.missiles_left -= 1
            this.game_objects.push(Object.spawnMissile(player_velocity, this.missile_speed, this.missile_colour, this.missile_time, this.locking_counter))
            this.lock_colour = "orange"
            this.locking_counter += 1
            this.locking_timer = this.locking_time
            this.just_fired = true
        }
    }
    mainLoop() {
        let frame_time = 60 * this.delta_time
        // Reset various arrays
        this.radar_points = []
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
        this.registerKeyboardInput(player_velocity)

        //Mouse input
        this.registerMouseInput(player_velocity)

        // Some trignometric values are reversed for rendering
        trig_vals.siny *= -1, trig_vals.sinx *= -1

        // Background star calculations and rendering
        let rotated_stars = this.distant_stars.map(e => Graphics.rotateAroundOriginByYX(e, trig_vals))
        this.current_stars = Graphics.applyPerspectiveProjection(rotated_stars, this.rtf, this.lbn, this.display_dimensions)
        this.drawBackground()

        // Array for objects spawned during loop and objects to render after loop
        let spawned_objects = []
        let render_objects = []
        // Each game object is updated
        for (let i = 0; i < this.game_objects.length; i++) {
            // Timer on each object is reduced
            this.game_objects[i].timer -= this.delta_time
            // The total change in position for an object, being the sum of it's velocity and the relative velocity to the player
            let sum_velocity = Vector.subtract(this.game_objects[i].velocity, player_velocity).map(e => e * frame_time)
            this.game_objects[i].position = Vector.add(this.game_objects[i].position, sum_velocity)
            // Objects centre position is rotated, needed for rendering later
            let centre_position = Graphics.rotateAroundOriginByYX(this.game_objects[i].position, trig_vals)

            let obj = this.game_objects[i]
            // Player damage check
            if (obj.tag == "enemy_laser") {
                let within = true
                for (let k = 0; k < 3; k++) {
                    if(!(Math.abs(obj.position[k]) < 10)) {
                        within = false
                        break
                    }
                }
                if (within) {
                    this.player_health -= 5
                    this.game_objects[i].timer = 0
                }
            }

            let rotated_vertices = [], dot_edges = []

            // Enemy object calculations
            if (obj.tag == "enemy") {
                let struct = this.structures[obj.structure_name]

                // Rendering
                for (let k = 0; k < Math.max(struct.vertices.length, struct.faces.length); k++) {
                    if (k < struct.vertices.length) {
                        let game_vertex = Vector.add(obj.position, struct.vertices[k])
                        rotated_vertices.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
                    }
                    if (k < struct.faces.length) {
                        let face_view = Vector.add(obj.position, struct.faces[k][0])
                        let rotated_face_view = Graphics.rotateAroundOriginByYX(face_view, trig_vals)
                        let rotated_face_normal = Graphics.rotateAroundOriginByYX(struct.faces[k][0], trig_vals)
                        let dot = Vector.dot(rotated_face_view, rotated_face_normal)
    
                        dot_edges.push([dot, struct.faces[k][1]])
                    }
                }

                let p1 = Vector.add(obj.position, struct.bounding_box[0])
                let p2 = Vector.add(obj.position, struct.bounding_box[1])
                // Collision detection with player lasers
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

                // Collision detection with missiles and updating missile velocity
                if (obj.lock_tag > 0) {
                    let m = this.game_objects.findIndex(e => (e.lock_tag == obj.lock_tag) && (e.tag == "missile"))
                    if (m != -1) {
                        let missile = this.game_objects[m]
                        let new_missile_direction = Vector.subtract(obj.position, missile.position)
                        this.game_objects[m].velocity = Vector.scale(new_missile_direction, this.missile_speed)
    
                        let within = true
                        for (let k = 0; k < 3; k++) {
                            if (!(missile.position[k] < p1[k] && missile.position[k] > p2[k])) {
                                within = false
                                break
                            }
                        }
                        if (within) {
                            this.game_objects[i].health -= this.missile_damage
                            this.game_objects[i].lock_tag = -1
                            this.game_objects[m].timer = 0
                        }
                    }
                }

                // Chance to fire at player if within a certain range
                if (Vector.length(obj.position) < 500 && Math.random() > 0.999) {
                    spawned_objects.push(Object.spawnLaser("enemy", Vector.scale(obj.position, -this.laser_speed), obj.position, this.enemy_laser_colour))
                }

                // Position on radar
                trig_vals.cosx = 1, trig_vals.sinx = 0
                let rotated_pos = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
                let radar_point = [(rotated_pos[0] * this.radar_radius) / this.radar_range, (-rotated_pos[2] * this.radar_radius) / this.radar_range, 0]
                if (Vector.length(radar_point) < this.radar_radius) {
                    this.radar_points.push(radar_point)
                }
                trig_vals.cosx = Math.cos(this.rotation_x), trig_vals.sinx = -Math.sin(this.rotation_x)
            } 
            // Debris calculations
            else if (obj.tag == "debris") {
                dot_edges = [[-1, obj.edges]]
                for (let vertex of obj.vertices) {
                    let game_vertex = Vector.add(obj.position, vertex)
                    rotated_vertices.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
                }
            } 
            // Projectile calculations
            else {
                rotated_vertices.push(Graphics.rotateAroundOriginByYX(obj.position, trig_vals))
            }

            // Only objects in view are rendered
            if (centre_position[2] > this.lbn[2]) {
                let missile_fired = this.game_objects.filter(e => e.lock_tag == obj.lock_tag).length > 1
                let draw_locking_sqaure = !missile_fired && obj.lock_tag > 0

                let edges_sequences = Graphics.sequenceVisibleFaces(dot_edges)
                let render_info = {
                    lock_info: [draw_locking_sqaure, this.lock_colour],
                    colour: obj.colour,
                    faces: edges_sequences,
                    vertices: Graphics.applyPerspectiveProjection(rotated_vertices, this.rtf, this.lbn, this.display_dimensions),
                    centre: Graphics.applyPerspectiveProjection([centre_position], this.rtf, this.lbn, this.display_dimensions)[0]
                }
                render_objects.push(render_info)
            }
        }
        // Render all objects
        render_objects.sort((a, b) => b.centre[2] - a.centre[2])
        for (let obj of render_objects) {
            this.current_render = obj
            this.drawObject()
        }
        // Pushes objects spawned during game loop into game objects
        this.game_objects.push(...spawned_objects)
        // Blows up objects with zero health
        let dead_objects = this.game_objects.filter(e => e.health <= 0)
        for (let obj of dead_objects) {
            this.game_objects.push(...Object.spawnDebris(this.structures[obj.structure_name], obj, 0.2))
        }
        this.game_objects = this.game_objects.filter(e => e.health > 0)
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