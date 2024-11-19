import Graphics from "../MethodClasses/Graphics.js"
import Vector from "../MethodClasses/Vector.js"

export default class Object {
    static spawnIndividual(...args) {
        const [{side, tag, struct_name="dot", vert=[], col, pos, vel, timer, health=1, fire_rate=0, missile_rate=0, lock_tag=-1}] = args
        let game_object = {
            side: side,
            tag: tag,
            structure_name: struct_name,
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
        let [{struct_name, count, rad, vel, centre, col}] = args
        let convoy = []
        let missile_carrier = Math.floor(Math.random() * count)
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 * i) / count
            let centre_offset = Graphics.rotateAroundOriginByYX([0, 0, rad], {cosx: 1, sinx: 0, cosy: Math.cos(angle), siny: Math.sin(angle)})
            convoy.push(this.spawnIndividual({
                side: "enemy",
                tag: "convoy", 
                struct_name: struct_name, 
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
    static spawnDebris(structure, object, speed) {
        let total_debris = []
        for (let face_info of structure.faces) {
            let debris_vertices = []
            for (let vertex_index of face_info[1]) {
                debris_vertices.push(Vector.subtract(structure.vertices[vertex_index], face_info[0]))
            }
            total_debris.push(this.spawnIndividual({
                side: "player",
                tag: "debris", 
                struct_name: "plane", 
                vert: debris_vertices,
                pos: Vector.add(object.position, face_info[0]), 
                vel: Vector.scale(face_info[0], speed),
                col: object.colour, 
                timer: 2.5
            }))
        }
        return total_debris
    }
}