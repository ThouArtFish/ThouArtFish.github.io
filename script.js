// Class containing vector operations, specific to the game's requirements
import Vector from "/Vector.js"
import BaseObjects from "./BaseObjects.js"
import GUIElements from "./GUIElements.js"

// global constants
const rtf = [20, -20, 220]
const lbn = [-20, 20, 20]
const canvas = document.getElementById("display");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const base_objects = new BaseObjects()
const gui_elements = new GUIElements(canvas.width, canvas.height)
const ctx = canvas.getContext("2d");
const sensitivity = 0.0008
const fps = 60

// global variables
var display_centre = [canvas.width/2, canvas.height/2]
var lastTime = 0
var mouse_coords = [0, 0]
var delta_coords = [0, 0]
var total_angle_x = 0
var total_angle_y = 0
var mouse_timer
var game_objects = []
var delta_time
var current_main_loop

// Objects and GUI elements
const play_button = gui_elements.play_button
const squip = base_objects.squip
const cubid = base_objects.cubid

// Main loops, including enter and exit functions
const game_loop = {
    requestPointerLockWithUnadjustedMovement: async () => {
        const promise = canvas.requestPointerLock({
          unadjustedMovement: true,
        })
      
        if (!promise) {
          console.log("disabling mouse acceleration is not supported");
        }
      
        try {
            await promise;
            return console.log("pointer is locked");
        } catch (error) {
            if (error.name === "NotSupportedError") {
                return canvas.requestPointerLock();
            }
        }
    },
    enter: () => {
        current_main_loop = () => game_loop.mainLoop()
        canvas.style.cursor = "none"
        game_loop.requestPointerLockWithUnadjustedMovement()
    },
    exit: () => {
        canvas.style.cursor = "auto"
        document.exitPointerLock()
    },
    mainLoop: () => {
        let angle_x = Math.atan(delta_coords[1] * sensitivity)
        let angle_y = Math.atan(delta_coords[0] * sensitivity)
    
        total_angle_x = Math.max(-Math.PI/2, Math.min(Math.PI/2, total_angle_x + angle_x))
        total_angle_y += angle_y

        let trig_vals = {
            cosx: Math.cos(total_angle_x),
            cosy: Math.cos(-total_angle_y),
            sinx: Math.sin(total_angle_x),
            siny: Math.sin(-total_angle_y)
        }
    
        for (let i = 0; i < game_objects.length; i++) {
    
            let delta_velocity = game_objects[i].velocity.map(e => e * delta_time)
            game_objects[i].position = Vector.add(game_objects[i].position, delta_velocity)

            let rotated_pos = Vector.rotateXY(game_objects[i].position, trig_vals)
            let rotated_vertices = [], rotated_face_normals = []
            let vertices_count = game_objects[i].vertices.length, face_normals_count = game_objects[i].face_normals.length
            let l = vertices_count >= face_normals_count ? vertices_count : face_normals_count
            for (let k = 0; k < l; k++) {
                if (k < vertices_count) {
                    rotated_vertices.push(Vector.rotateXY(game_objects[i].vertices[k], trig_vals))
                }
                if (k < face_normals_count) {
                    rotated_face_normals.push([Vector.rotateXY(game_objects[i].face_normals[k][0], trig_vals), game_objects[i].face_normals[k][1]])
                }
            }
    
            if (rotated_pos[2] > 0) {
    
                let edge_info = findEdges(rotated_face_normals, game_objects[i].edges, rotated_pos)
                let vertices_info = applyPerspectiveProjection(rotated_vertices, rotated_pos)
    
                if (vertices_info.length != 0) {
                    drawObject(vertices_info, edge_info, game_objects[i].colour)
                }
            }
        }
    }
}
const menu_loop = {
    onMouseClick: () => {
        let withinRange = (val, range) => (val >= range[0] && val <= range[1])
        if (withinRange(mouse_coords[0], [play_button.left, play_button.right]) && withinRange(mouse_coords[1], [play_button.top, play_button.bottom])) 
        {
            menu_loop.exit()
            game_loop.enter()
        }
    },
    enter: () => {
        current_main_loop = () => menu_loop.mainLoop()
        canvas.addEventListener("mouseup", menu_loop.onMouseClick)
    },
    exit: () => {
        canvas.removeEventListener("mouseup", menu_loop.onMouseClick)
    },
    mainLoop: () => {
        ctx.beginPath()
        ctx.fillStyle = "red"
        ctx.fillRect(play_button.left, play_button.top, play_button.right - play_button.left, play_button.bottom - play_button.top)
        ctx.fillStyle = "black"
        ctx.font = "20px serif"
        ctx.fillText(play_button.text, play_button.left + 6, play_button.top + 24)
        ctx.closePath()
    }
}

// Takes an object blueprint and adds it to array of game objects to be rendered 
function spawnObject(object, velocity, spawn_position) {
    let game_object = {
        vertices: object.vertices,
        position: spawn_position,
        edges: object.edges,
        velocity: velocity,
        face_normals: object.face_normals,
        colour: object.colour,
    }
    game_objects.push(game_object)
}

// Applies perspective projection to a game object and returns the vertices to be drawn on screen, or an empty array if all vertices are out of bounds
function applyPerspectiveProjection(vertices, pos) {
    let projected_vertices = []
    let out_of_view = 0
    for (let i = 0; i < vertices.length; i++) {
        let game_vertex = Vector.add(vertices[i], pos)
        let x = (2 * lbn[2] * game_vertex[0] - ((rtf[0] + lbn[0]) * game_vertex[2])) / ((rtf[0] - lbn[0]) * game_vertex[2])
        let y = (2 * lbn[2] * game_vertex[1] - ((rtf[1] + lbn[1]) * game_vertex[2])) / ((lbn[1] - rtf[1]) * game_vertex[2])
        x = x * display_centre[0] + display_centre[0]
        y = y * display_centre[1] + display_centre[1]
        if ((x < 0 || x > canvas.width) || (y < 0 || y > canvas.height)) {
            out_of_view += 1
        }
        projected_vertices.push([x, y])
    }
    return out_of_view != projected_vertices.length ? projected_vertices: []
}

// Returns an array of edges which can be seen from the POV of the display
function findEdges(face_normals, edges, pos) {
    let shown_edges = new Set();
    for (let i = 0; i < face_normals.length; i++) {
        let dot_prod = Vector.dot(Vector.add(pos, face_normals[i][0]), face_normals[i][0])
        if (dot_prod < 0) {
            face_normals[i][1].forEach(e => shown_edges.add(edges[e]))
        }
    }
    return [...shown_edges]
}

// Draws the projected vertices on the display and the edges between them
function drawObject(vertices, edges, colour) {
    ctx.strokeStyle = colour
    ctx.beginPath();
    for (let i = 0; i < edges.length; i++) {
        let line_start = vertices[edges[i][0]]
        let line_end = vertices[edges[i][1]]
        ctx.moveTo(line_start[0], line_start[1]);
        ctx.lineTo(line_end[0], line_end[1]);
        ctx.stroke();
    }
    ctx.closePath();
}

// Main function that updates the display
function updateDisplay(timestamp) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    delta_time = (timestamp - lastTime) * (fps/1000)
    lastTime = timestamp

    current_main_loop()

    requestAnimationFrame(updateDisplay)
}

// Startup stuff
ctx.lineWidth = 1
menu_loop.enter()
//Event listener to track mouse movement and change in mouse position
canvas.addEventListener("mousemove", (e) => {
    clearTimeout(mouse_timer)
    mouse_timer = setTimeout(() => {delta_coords = [0, 0]}, 0)
    delta_coords = [e.movementX, e.movementY]
    mouse_coords = [e.clientX, e.clientY]
})
// Event listener when resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    display_centre = [canvas.width/2, canvas.height/2]
})
// Test objects
spawnObject(cubid, [0, 0, 0], [-20, 0, 50])
spawnObject(squip, [0, 0, 0], [30, -50, 40])
// Lift off!!
updateDisplay(0)
