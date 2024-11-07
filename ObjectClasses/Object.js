import Graphics from "../MethodClasses/Graphics.js"
import Vector from "../MethodClasses/Vector.js"

export default class Object {
    static spawnIndividual(...args) {
        const [{tag, struct_name, col, pos, vel, timer, health}] = args
        let game_object = {
            tag: tag,
            structure_name: struct_name,
            colour: col,
            position: pos,
            velocity: vel,
            timer: timer,
            health: health,
            lock_tag: -1
        }
        return game_object
    }
    static spawnLaser(side, velocity, position, colour) {
        let game_object = {
            tag: side + "_laser",
            colour: colour,
            position: position,
            velocity: velocity,
            timer: 5,
            health: 1
        }
        return game_object
    }
    static spawnMissile(direction, speed, colour, timer, locking_counter) {
        let game_object = {
            tag: "missile",
            colour: colour,
            position: [0, 0, 0],
            velocity: Vector.scale(direction, speed),
            timer: timer,
            health: 1,
            lock_tag: locking_counter
        }
        return game_object
    }
    static spawnConvoy(struct_name, count, radius, speed, centre_position) {
        let convoy = []
        let velocity = Vector.scale(centre_position, -speed)
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 * i) / count
            let centre_offset = Graphics.rotateAroundOriginByYX([0, 0, radius], {cosx: 1, sinx: 0, cosy: Math.cos(angle), siny: Math.sin(angle)})
            let spawn_position = Vector.add(centre_position, centre_offset)
            convoy.push(this.spawnIndividual({tag: "enemy", struct_name: struct_name, pos: spawn_position, vel: velocity, col: "cyan", timer: 240, health: 100}))
        }
        return convoy
    }
    static spawnDebris(structure, object, speed) {
        let total_debris = []
        for (let face_info of structure.faces) {
            let debris_vertices = []
            for (let vertex of structure.vertices) {
                debris_vertices.push(Vector.subtract(vertex, face_info[0]))
            }
            let game_object = {
                tag: "debris",
                colour: object.colour,
                vertices: debris_vertices,
                edges: face_info[1],
                position: Vector.add(object.position, face_info[0]),
                velocity: Vector.scale(face_info[0], speed),
                timer: 2.5,
                health: 1
            }
            total_debris.push(game_object)
        }
        return total_debris
    }
    static randomFloat() {
        let f = Math.random()
        return Math.random() > 0.5 ? -f : f
    }
}