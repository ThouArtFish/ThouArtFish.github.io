import Graphics from "../MethodClasses/Graphics.js"
import Vector from "../MethodClasses/Vector.js"

export default class Object {
    static spawnIndividual(...args) {
        const [{obj, col, pos, vel, timer, health}] = args
        let game_object = {
            colour: col,
            vertices: obj.vertices,
            position: pos,
            edges: obj.edges,
            bounding_box: obj.bounding_box,
            velocity: vel,
            face_normals: obj.face_normals,
            timer: timer,
            health: health
        }
        return game_object
    }
    static spawnLaser(direction, position, speed, colour) {
        let game_object = {
            colour: colour,
            vertices: [[0, 0, 0], Vector.scale(direction, -5)],
            position: position,
            edges: [[0, 1]],
            velocity: Vector.scale(direction, speed),
            face_normals: [],
            timer: 7,
            health: 1
        }
        return game_object
    }
    static spawnConvoy(object, count, radius, speed, centre_position) {
        let convoy = []
        let velocity = Vector.scale(centre_position, -speed)
        for (let i = 0; i < count; i++) {
            let angle = (Math.PI * 2 * i) / count
            let centre_offset = Graphics.rotateAroundOriginByYX([0, 0, radius], {cosx: 1, sinx: 0, cosy: Math.cos(angle), siny: Math.sin(angle)})
            let spawn_position = Vector.add(centre_position, centre_offset)
            convoy.push(this.spawnIndividual({obj: object, pos: spawn_position, vel: velocity, col: "white", timer: 240, health: 100}))
        }
        return convoy
    }
    static spawnDebris(object, speed) {
        let total_debris = []
        for (let face_info of object.face_normals) {
            let debris_edges = []
            for (let edge_index of face_info[1]) {
                debris_edges.push(object.edges[edge_index])
            }
            let game_object = {
                colour: object.colour,
                vertices: object.vertices,
                position: object.position,
                edges: debris_edges,
                velocity: Vector.scale(face_info[0], speed),
                face_normals: [],
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