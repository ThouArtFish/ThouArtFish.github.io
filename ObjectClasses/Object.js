import Graphics from "../MethodClasses/Graphics.js"
import Vector from "../MethodClasses/Vector.js"

export default class Object {
    static spawnIndividual(...args) {
        const [{side, tag, struct="dot", vert=[], col, pos, vel, timer, health=1, fire_rate=0, missile_rate=0, lock_tag=-1}] = args
        let game_object = {
            side: side,
            tag: tag,
            struct: struct,
            vertices: vert,
            colour: col,
            position: pos,
            velocity: vel,
            timer: timer,
            health: health,
            fire_rate: [Math.random() * fire_rate, fire_rate],
            missile_rate: [Math.random() * missile_rate, missile_rate],
            lock_tag: lock_tag
        }
        return game_object
    }
    static spawnConvoy(...args) {
        let [{struct, count, rad, vel, centre, col}] = args
        let convoy = []
        let missile_carrier = Math.floor(Math.random() * count)
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 * i) / count
            let centre_offset = [rad * Math.sin(angle), 0, rad * Math.cos(angle)]
            convoy.push(this.spawnIndividual({
                side: "enemy",
                tag: "convoy", 
                struct: struct, 
                pos: Vector.add(centre, centre_offset), 
                vel: vel, 
                col: col, 
                timer: 240, 
                health: 100,
                fire_rate: 12,
                missile_rate: i == missile_carrier ? 15 : 0
            }))
        }
        return convoy
    }
    static spawnDebris(obj, struct, speed) {
        let total_debris = []
        for (let face_info of struct.faces) {
            let debris_vertices = []
            for (let vertex_index of face_info[1]) {
                debris_vertices.push(Vector.subtract(struct.vertices[vertex_index], face_info[0]))
            }
            total_debris.push(this.spawnIndividual({
                side: "player",
                tag: "debris", 
                struct: "plane", 
                vert: debris_vertices,
                pos: Vector.add(obj.position, face_info[0]), 
                vel: Vector.scale(face_info[0], speed),
                col: obj.colour, 
                timer: 2.5
            }))
        }
        return total_debris
    }
}