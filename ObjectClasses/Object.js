import Graphics from "../MethodClasses/Graphics.js"
import Vector from "../MethodClasses/Vector.js"

export default class Object {
    static spawnIndividual(...args) {
        const [{side, tag, struct_name, col, pos, vel, timer, health, fire_rate, missile_rate}] = args
        let game_object = {
            side: side,
            tag: tag,
            structure_name: struct_name,
            colour: col,
            position: pos,
            velocity: vel,
            timer: timer,
            health: health,
            fire_rate: [Math.random() * fire_rate, fire_rate],
            missile_rate: [Math.random() * missile_rate, missile_rate],
            lock_tag: -1
        }
        return game_object
    }
    static spawnProjectile(...args) {
        const [{side, tag, vel, pos, col, timer, lock_tag}] = args
        let game_object = {
            side: side,
            tag: tag,
            colour: col,
            position: pos,
            velocity: vel,
            timer: timer,
            health: 1,
            lock_tag: lock_tag
        }
        return game_object
    }
    static spawnConvoy(...args) {
        let [{struct_name, count, rad, spe, centre, col}] = args
        let convoy = []
        let velocity = Vector.scale(centre, -spe)
        let missile_carrier = Math.floor(Math.random() * count)
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 * i) / count
            let centre_offset = Graphics.rotateAroundOriginByYX([0, 0, rad], {cosx: 1, sinx: 0, cosy: Math.cos(angle), siny: Math.sin(angle)})
            convoy.push(this.spawnIndividual(
            {
                side: "enemy",
                tag: "convoy", 
                struct_name: struct_name, 
                pos: Vector.add(centre, centre_offset), 
                vel: velocity, 
                col: col, 
                timer: 240, 
                health: 100,
                fire_rate: 10,
                missile_rate: i == missile_carrier ? 25 : 0,
                locking_counter: -1
            }))
        }
        return convoy
    }
    static spawnDebris(structure, object, speed) {
        let total_debris = []
        for (let face_info of structure.faces) {
            let debris_vertices = []
            for (let vertex_index of face_info[1]) {
                debris_vertices.push(Vector.subtract(structure.vertices[vertex_index], face_info[0]))
            }
            let game_object = {
                tag: "debris",
                colour: object.colour,
                vertices: debris_vertices,
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