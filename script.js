const canvas = document.getElementById("display");
const ctx = canvas.getContext("2d");

const z_near = 0
const z_far = 200

const fov = (90) * (Math.PI / 360)

const camera_direction = [0, 0, 1]

const line_min = 0.5
const line_max = 4

const display_dimensions = [canvas.width/2, canvas.height/2]
const aspect_ratio = canvas.width / canvas.height

const fps = 30
var lastTime = 0

const object1 = {
    vertices: [[0, 0, -5], [5, 0, 0], [-5, 0, 0], [0, 0, 5], [0, -5, 0]],    
    edges: [[1, 0], [1, 3], [2, 0], [2, 3], [4, 0], [4, 1], [4, 2], [4, 3]],
    face_normals: [[[], [2, 4, 6]], [[], [0, 4, 5]], [[], []], [[], []], [[], []]]
}
const position1 = [-10, -10, 100]
const velocity1 = [0, 0.05, 0]

const object2 = {
    vertices: [[-5, -5, -5], [5, -5, -5], [-5, -5, 5], [5, -5, 5], [-5, 5, -5], [5, 5, -5], [-5, 5, 5], [5, 5, 5]],
    edges: [[2, 0], [3, 1], [2, 3], [0, 1], [3, 7], [1, 5], [7, 5], [7, 6], [5, 4], [6, 4], [6, 2], [4, 0]],
    face_normals: [[[0, 2.5, 0], [7, 6, 5, 4]], [[2.5, 0, 0], [3, 7, 1, 5]], [[0, -2.5, 0], [2, 3, 0, 1]], [[-2.5, 0, 0], [6, 2, 4, 0]], [[0, 0, 2.5], [7, 6, 2, 3]], [[0, 0, -2.5], [4, 0, 5, 1]]]
}
const position2 = [-10, -10, 10]
const velocity2 = [0, 0, 0.05]

var ingame_objects = [];



function add(v1, v2) {
    return [v1[0] + v2[0], v1[1] + v2[1], v1[2] + v2[2]]
}

function dot(v1, v2) {
    return v1[0] * v2[0] + v1[1] * v2[1] + v1[2] * v2[2]
}

function spawnObject(object, velocity, spawn_position) {
    let game_object = {
        vertices: object.vertices,
        position: spawn_position,
        edges: object.edges,
        velocity: velocity,
        face_normals: object.face_normals
    }
    ingame_objects.push(game_object)
}

function applyPerspectiveProjection(vertex) {
    let x = (vertex[0] * (1 / (aspect_ratio * Math.tan(fov)))) / vertex[2]
    let y = (vertex[1] * (1 / Math.tan(fov))) / vertex[2]
    return [x * display_dimensions[0] + display_dimensions[0], y * display_dimensions[1] + display_dimensions[1]]
}

function draw(display_objects) {
    for (let i = 0; i < display_objects.length; i++) {
        let current = display_objects[i]
        ctx.lineWidth = ((current.position[2] - z_near) / (z_far - z_near)) * (line_min - line_max) + line_max

        let shown_vertices = new Set();
        for (let j = 0; j < current.face_normals.length; j++) {
            let dot_prod = dot(add(current.position, current.face_normals[j][0]), current.face_normals[j][0])
            if (dot_prod < 0) {
                current.face_normals[j][1].forEach(e => shown_vertices.add(e))
            }
        }
        let shown_edges = []
        for (let j = 0; j < current.edges.length; j++) {
            if (shown_vertices.has(current.edges[j][0]) && shown_vertices.has(current.edges[j][1])) {
                shown_edges.push(current.edges[j])
            }
        }
        for(let j = 0; j < shown_edges.length; j++) {
            ctx.beginPath();
            let line_start = current.vertices[shown_edges[j][0]]
            let line_end = current.vertices[shown_edges[j][1]]
            ctx.moveTo(line_start[0], line_start[1]);
            ctx.lineTo(line_end[0], line_end[1]);
            ctx.stroke();
            ctx.closePath();
        }
    }
}

function checkZ(vertex) {
    if (vertex[2] > z_far) {
        return false
    }
    if (vertex[2] < z_near) {
        return false
    }
    return true
}

function updateDisplay(timestamp) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let delta_time = (timestamp - lastTime) * (fps/1000)
    lastTime = timestamp

    let display_objects = []

    for (let i = 0; i < ingame_objects.length; i++) {
        if (checkZ(ingame_objects[i].position)) {
            let delta_velocity = ingame_objects[i].velocity.map(i => i * delta_time)
            ingame_objects[i].position = add(ingame_objects[i].position, delta_velocity)
            let display_object = {
                vertices: [],
                position: ingame_objects[i].position,
                edges: ingame_objects[i].edges,
                face_normals: ingame_objects[i].face_normals
            }
            for (let j = 0; j < ingame_objects[i].vertices.length; j++) {
                let game_space_point = add(ingame_objects[i].vertices[j], ingame_objects[i].position)
                display_object.vertices.push(applyPerspectiveProjection(game_space_point))
            }
            display_objects.push(display_object)
        }
    }
    draw(display_objects)

    requestAnimationFrame(updateDisplay)
}

ctx.strokeStyle = "white"
spawnObject(object2, velocity2, position2)
updateDisplay(0)
