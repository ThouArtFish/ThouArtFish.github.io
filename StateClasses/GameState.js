import Vector from "../MethodClasses/Vector.js"
import Graphics from "../MethodClasses/Graphics.js"
import Object from "../ObjectClasses/Object.js"

export default class GameState {
    constructor(...args) {
        const [{display_dimensions, sens = 0.0008, lbn = [-20, 20, 20], rtf = [20, -20, 1000], star_count = 50}] = args

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
        this.speed_boost = 50

        this.key_down_state = {
            "KeyW": false,
            "KeyS": false,
            "KeyQ": false,
            "KeyE": false,
            "KeyL": false
        }
        this.mouse_down_state = {
            "0": false,
            "2": false,
        }

        this.game_objects = [Object.spawnIndividual({
            side: "player",
            tag: "base",
            struct_name: "cube",
            col: [242, 200, 85],
            pos: [0, 0, 0],
            vel: [0, 0, 0],
            health: 100,
            timer: 1
        })]

        // Graphics variables
        this.lbn = lbn
        this.rtf = rtf
        this.display_dimensions = display_dimensions

        // Rotation variables
        this.rotation_x = 0
        this.rotation_y = 0

        // Player speed variables
        this.player_speed = 1.2
        this.default_speed = this.player_speed
        this.delta_speed = 0.2
        this.max_speed = 2.4
        this.min_speed = 0

        // Radar variables
        this.radar_centre = [display_dimensions[0] / 2, display_dimensions[1] * 0.85]
        this.radar_radius = 90
        this.radar_range = 1800
        this.radar_points

        // Player laser variables
        this.fire_rate = 0.4
        this.fire_timer = this.fire_rate
        this.max_shots = 25
        this.overheat_counter = 0
        this.overheat_active = false
        this.laser_damage = 25
        this.laser_speed = 6
        this.laser_colour = "#ff4242"

        // Player missile variables
        this.locking_time = 3
        this.lock_colour = "orange"
        this.locking_timer = this.locking_time
        this.player_missile_speed = 5
        this.enemy_missile_speed = 4
        this.missile_damage = 100
        this.missiles_left = 3
        this.missile_colour = "#f5f05b"
        this.max_missiles = this.missiles_left
        this.locking_counter = 1

        // Enemy missile variables
        this.jam_timeout = 0.4
        this.jam_timer = this.jam_timeout
        this.enemy_missile_active = false

        // Player stuff
        this.player_health = 100
        this.player_hitbox_cargo = [25, 25, 25]
        this.player_hitbox_projectile = [8, 8, 8]
        this.max_player_health = this.player_health
        this.score = 0
        this.score_template = {
            "convoy": 50,
            "guard": 100
        }

        // Convoy stuff
        this.convoy_count = 0
        this.convoy_speed = 0.6
        this.convoy_distance = 2000
        this.impact_timer = 0

        // Object types
        this.enemy_types = ["convoy", "guard"]
        this.projectile_types = ["missile", "laser"]
        this.cargo_types = ["health", "ammo"]

        // Background starts
        this.distant_stars = []
        while (this.distant_stars.length < star_count) {
            this.distant_stars.push([Vector.randomFloat(), Vector.randomFloat(), Vector.randomFloat()])
        }

        // One time inputs
        this.just_fired = false
        this.just_locked = false

        // Loop relevant
        this.current_stars
        this.current_render
    }
    registerKeyboardInput(player_direction) {
        // Pointer lock control
        this.just_locked = (this.key_down_state["KeyL"] && this.just_locked) ? true : false
        if (this.key_down_state["KeyL"] && !this.just_locked) {
            this.changeLock()
            this.just_locked = true
        }
        // Acceleration and decceleration
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

        // Firing tracking missiles
        this.just_fired = (this.key_down_state["KeyQ"] && this.just_fired) ? true : false
        if (this.key_down_state["KeyQ"] && this.locking_timer == this.locking_time && !this.just_fired && this.missiles_left > 0) {
            let closest = [0]
            for (let i = 0; i < this.game_objects.length; i++) {
                if (this.enemy_types.includes(this.game_objects[i].tag) && this.game_objects[i].lock_tag < 0) {
                    let d = Vector.dot(Vector.scale(this.game_objects[i].position, 1), player_direction)
                    if (d > closest[0] && d > 0) {
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

        // Jamming enemy tracking missiles
        if (this.jam_timer > this.jam_timeout) {
            this.jam_timer = Math.max(this.jam_timeout, this.jam_timer - this.delta_time)
        } else if (this.key_down_state["KeyE"]) {
            this.jam_timer -= this.delta_time
        } else {
            if (this.jam_timer > 0) {
                this.jam_timer = this.jam_timeout
            } else {
                this.jam_timer = 3 * this.jam_timeout
            }
        }
    }
    registerMouseInput(player_direction) {
        // Fire main lasers
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
                this.game_objects.push(Object.spawnIndividual(
                    {
                        side: "player",
                        tag: "laser",
                        col: this.laser_colour,
                        pos: [0, 0, 0],
                        vel: Vector.scale(player_direction, this.laser_speed),
                        timer: 6
                    }))
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

        // Fire tracking missile
        if (this.mouse_down_state["2"] && this.locking_timer < 0) {
            this.missiles_left -= 1
            this.game_objects.push(Object.spawnIndividual(
                {
                    side: "player",
                    tag: "missile",
                    col: this.missile_colour,
                    pos: [0, 0, 0],
                    vel: [0, 0, 0],
                    timer: 20,
                    lock_tag: this.locking_counter
                }))
            this.lock_colour = "orange"
            this.locking_counter += 1
            this.locking_timer = this.locking_time
            this.just_fired = true
        }
    }
    prePerspectiveRendering(obj, trig_vals) {
        let struct = this.structures[obj.structure_name]
        let vertex_info = [], face_info = []
        for (let k = 0; k < Math.max(struct.vertices.length, struct.faces.length); k++) {
            if (k < struct.vertices.length) {
                let game_vertex = Vector.add(obj.position, struct.vertices[k])
                vertex_info.push(Graphics.rotateAroundOriginByYX(game_vertex, trig_vals))
            }
            if (k < struct.faces.length) {
                let face_view = Vector.add(obj.position, struct.faces[k][0])
                let face_dot = Vector.dot(face_view, struct.faces[k][0])
                if (face_dot < 0) {
                    face_dot *= 1 / (Vector.length(face_view) * Vector.length(struct.faces[k][0]))
                    face_info.push([-face_dot, struct.faces[k][1]])
                }
            }
        }
        return [vertex_info, face_info]
    }
    collisionDetection(position, top, bottom) {
        for (let k = 0; k < 3; k++) {
            if (!(position[k] < top[k] && position[k] > bottom[k])) {
                return false
            }
        }
        return true
    }
    mainLoop() {
        // Reset radar points
        this.radar_points = []

        // New convoy if previous is dead
        if (this.convoy_count == 0) {
            this.convoy_count = Math.floor(Math.random() * 4) + 5
            let convoy_centre = Vector.scale([Vector.randomFloat(), Vector.randomFloat(), Vector.randomFloat()], this.convoy_distance)
            let convoy_velocity = Vector.scale(Vector.subtract(this.game_objects[0].position, convoy_centre), this.convoy_speed)
            let convoy = Object.spawnConvoy({
                struct_name: "cube", 
                count: this.convoy_count, 
                rad: 150, 
                vel: convoy_velocity, 
                centre: convoy_centre,
                col: [242, 24, 242]
            })
            this.game_objects.push(...convoy)
            this.impact_timer = this.convoy_distance / (this.convoy_speed * this.speed_boost)
        }
        // Base is checked for impacts
        this.impact_timer -= this.delta_time
        if (this.impact_timer < 0) {
            this.game_objects[0].health -= 50
            this.game_objects = this.game_objects.filter(e => e.tag != "convoy")
            this.convoy_count = 0
            if (this.game_objects[0].health <= 0) {
                return "game_over"
            }
        }

        // Array of player projectiles for checking projectile collisions later
        let player_projectiles = this.game_objects.filter(e => e.side == "player" && this.projectile_types.includes(e.tag)).map(e => this.game_objects.indexOf(e))

        // Check if there are any incoming missiles
        this.enemy_missile_active = this.game_objects.filter(e => e.side == "enemy" && e.tag == "missile").length > 0

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

        // Direction of player in game space
        let player_direction = Graphics.rotateAroundOriginByXY([0, 0, 1], trig_vals)
        // Velocity of player in game space
        let player_velocity = Vector.scale(player_direction, this.player_speed)

        //Keyboard input
        this.registerKeyboardInput(player_direction)

        //Mouse input
        this.registerMouseInput(player_direction)

        // Some trignometric values are reversed for rendering
        trig_vals.siny *= -1, trig_vals.sinx *= -1

        // Background star calculations and rendering
        let rotated_stars = this.distant_stars.map((e) => Graphics.rotateAroundOriginByYX(e, trig_vals)).filter((e) => e[2] > 0)
        this.current_stars = Graphics.applyPerspectiveProjection(rotated_stars, this.rtf, this.lbn, this.display_dimensions, false)
        this.drawBackground()


        // Array for objects spawned during loop and objects to render after loop
        let spawned_objects = []
        let render_objects = []
        // Each game object is updated
        for (let i = 0; i < this.game_objects.length; i++) {
            // Timer on each object is reduced, except for base
            this.game_objects[i].timer -= i != 0 ? this.delta_time : 0
            // The total change in position for an object, being the sum of it's velocity and the relative velocity to the player
            let sum_velocity = Vector.subtract(this.game_objects[i].velocity, player_velocity).map(e => e * this.delta_time * this.speed_boost)
            this.game_objects[i].position = Vector.add(this.game_objects[i].position, sum_velocity)
            // Useful reference
            let obj = this.game_objects[i]


            // Enemy objects
            if (obj.side == "enemy") {
                // Enemy projectiles
                if (obj.tag == "laser") {
                    if (this.collisionDetection(obj.position.map((e) => Math.abs(e)), this.player_hitbox_projectile, [0, 0, 0])) {
                        this.player_health -= 5
                        this.game_objects[i].timer = 0
                    }
                }
                else if (obj.tag == "missile") {
                    if (this.collisionDetection(obj.position.map((e) => Math.abs(e)), this.player_hitbox_projectile, [0, 0, 0])) {
                        this.player_health -= 10
                        this.game_objects[i].timer = 0
                    }
                    let jam_missiles = (this.jam_timer > 0) && (this.jam_timer < this.jam_timeout)
                    if (jam_missiles && Vector.length(obj.position) < 50) {
                        this.game_objects[i].timer = 0
                    }
                    this.game_objects[i].velocity = Vector.scale(obj.position, -this.enemy_missile_speed)
                }
                // Enemies
                else {
                    // Collision detection with player projectiles
                    let top = Vector.add(obj.position, this.structures[obj.structure_name].bounding_box[0])
                    let bottom = Vector.add(obj.position, this.structures[obj.structure_name].bounding_box[1])
                    for (let p of player_projectiles) {
                        let projectile = this.game_objects[p]
                        if (this.collisionDetection(projectile.position, top, bottom)) {
                            this.game_objects[i].health -= projectile.tag == "missile" ? this.missile_damage : this.laser_damage
                            this.game_objects[p].timer = 0
                            break
                        }
                    }
                    // Chance to fire at player if within a certain range
                    if (Vector.length(obj.position) < 1500) {
                        this.game_objects[i].fire_rate[0] -= this.delta_time
                        if (this.game_objects[i].fire_rate[0] < 0) {
                            spawned_objects.push(Object.spawnIndividual(
                                {
                                    side: "enemy",
                                    tag: "laser", 
                                    col: this.laser_colour,
                                    pos: obj.position,
                                    vel: Vector.scale(obj.position, -this.laser_speed).map(e => e + (Vector.randomFloat() * 0.7)),
                                    timer: 5
                                }))
                            this.game_objects[i].fire_rate[0] = Math.random() * obj.fire_rate[1]
                        }
                    }
                    // Missile carriers have a chance to fire a homing missile at the player
                    if (obj.missile_rate[1] > 0) {
                        this.game_objects[i].missile_rate[0] -= this.delta_time
                        if (this.game_objects[i].missile_rate[0] < 0) {
                            spawned_objects.push(Object.spawnIndividual(
                                {
                                    side: "enemy",
                                    tag: "missile", 
                                    col: this.missile_colour,
                                    pos: obj.position,
                                    vel: [0, 0, 0],
                                    timer: 20
                                }))
                            this.game_objects[i].missile_rate[0] = Math.random() * obj.missile_rate[1] + 5
                        }
                    }
                } 
            }


            // Player objects
            else if (obj.side == "player") {
                // Updating missile velocity
                if (obj.tag == "missile") {
                    let o = this.game_objects.findIndex((e) => (e.lock_tag == obj.lock_tag) && (e.tag != "missile"))
                    if (o != -1) {
                        let tracked_object = this.game_objects[o]
                        let new_missile_direction = Vector.subtract(tracked_object.position, obj.position)
                        this.game_objects[i].velocity = Vector.scale(new_missile_direction, this.player_missile_speed)
                    }
                }
                // Cargo collision checks
                else if (this.cargo_types.includes(obj.tag)) {
                    if (this.collisionDetection(obj.position.map((e) => Math.abs(e)), this.player_hitbox_cargo, [0, 0, 0])) {
                        if (obj.tag == "health") {
                            this.player_health = Math.min(this.max_player_health, this.player_health + 5)
                        } else {
                            this.missiles_left = Math.min(this.max_missiles, this.missiles_left + 1)
                        }
                        this.game_objects[i].timer = 0
                    }
                }
            }
            // Create point on radar for missiles and enemies
            if (this.enemy_types.includes(obj.tag) || obj.tag == "missile") {
                trig_vals.cosx = 1, trig_vals.sinx = 0
                let radar_position = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
                let radar_point = [(radar_position[0] * this.radar_radius) / this.radar_range, (-radar_position[2] * this.radar_radius) / this.radar_range, 0]
                if (Vector.length(radar_point) < this.radar_radius) {
                    this.radar_points.push(radar_point)
                }
                trig_vals.cosx = Math.cos(this.rotation_x), trig_vals.sinx = -Math.sin(this.rotation_x)
            }


            //Arrays for info about faces and vertices
            let vertex_info = []
            let face_info = []
            // Objects centre position is rotated, needed for rendering later
            let centre_position = Graphics.rotateAroundOriginByYX(obj.position, trig_vals)
            vertex_info.push(centre_position)
            // Render info is calculated, only if object is in view
            if (centre_position[2] > this.lbn[2]) {
                // Applying rotation to the vertices and faces of an object
                // Rotation for 3D objects
                if (!this.projectile_types.includes(obj.tag) && obj.tag != "debris") {
                    let pre_perspec_info = this.prePerspectiveRendering(obj, trig_vals)
                    vertex_info.push(...pre_perspec_info[0])
                    face_info.push(...pre_perspec_info[1])
                // Rotation for 2D objects, which are the debris pieces
                } else if (obj.structure_name == "plane") {
                    let vertex_sequence = []
                    for (let k = 0; k < obj.vertices.length; k++) {
                        vertex_sequence.push(k)
                        vertex_info.push(Graphics.rotateAroundOriginByYX(Vector.add(obj.position, obj.vertices[k]), trig_vals))
                    }
                    face_info.push([1, vertex_sequence])
                }
                // Projectiles are already rotated since they are rendered using the centre position variable

                // Applies perspective projection to values
                let apply_perspective = Graphics.applyPerspectiveProjection(vertex_info, this.rtf, this.lbn, this.display_dimensions, true)
                let perspective_centre = apply_perspective.shift()

                // Deciding whether to draw a "locking square" for objects being tracked
                let draw_locking_sqaure = this.locking_timer < this.locking_time && obj.lock_tag > 0

                // Pushes render info onto render stack
                let render_info = {
                    lock_info: [draw_locking_sqaure, this.lock_colour],
                    colour: obj.colour,
                    faces: face_info,
                    vertices: apply_perspective,
                    centre: perspective_centre
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
        // Post mortem stuff
        let dead_objects = this.game_objects.filter(e => e.health <= 0 || e.timer <= 0)
        for (let obj of dead_objects) {
            // Decrease convoy count if obj was a convoy unit
            if (obj.tag == "convoy") {
                this.convoy_count -= 1
            }
            // Remove locking value from target obj once player missile is destroyed
            if (obj.tag == "missile" && obj.side == "player") {
                let o = this.game_objects.findIndex((e) => e.lock_tag == obj.lock_tag)
                if (o != -1) {
                    this.game_objects[o].lock_tag = -1
                }
            }
            // Only enemy objs can satisfy this statement
            if (obj.timer > 0) {
                // Increase score and spawn debris
                this.score += this.score_template[obj.tag]
                this.game_objects.push(...Object.spawnDebris(this.structures[obj.structure_name], obj, 0.2))
                // Chance to drop cargo
                if (Math.random() > 0.7) {
                    let type = Math.random() > 0.5 ? "health" : "ammo"
                    this.game_objects.push(Object.spawnIndividual({
                        side: "player",
                        tag: type,
                        struct_name: "cube",
                        col: type == "health" ? [119, 247, 54] : [191, 187, 191],
                        pos: obj.position,
                        vel: [0, 0, 0],
                        timer: 60
                    }))
                }
            }
        }
        // Filters out objects that are dead or have timed out
        this.game_objects = this.game_objects.filter(e => e.health > 0 && e.timer > 0)
        // Pushes objects spawned during game loop into game objects
        this.game_objects.push(...spawned_objects)
        // HUD is drawn on top
        this.drawHUD()
        return 0
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
    changeLock() {
        return null
    }
    enter() {
        return null
    }
    exit() {
        return null
    }
}