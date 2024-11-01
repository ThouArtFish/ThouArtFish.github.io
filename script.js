// Imports
import Vector from "./MethodClasses/Vector.js"
import MainMenuState from "./StateClasses/MainMenuState.js"
import GameState from "./StateClasses/GameState.js"
import Graphics from "./MethodClasses/Graphics.js"
import Object from "./ObjectClasses/Object.js"

// Global constants
const canvas = document.getElementById("display");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const ctx = canvas.getContext("2d");
const squip = {
    vertices: [[0, 1.25, -5], [5, 1.25, 0], [-5, 1.25, 0], [0, 1.25, 5], [0, -3.75, 0]],    
    edges: [[1, 0], [1, 3], [2, 0], [2, 3], [4, 0], [4, 1], [4, 2], [4, 3]],
    face_normals: [[[0, 1.25, 0], [0, 2, 3, 1]], [[1.25, -1.25, 1.25], [5, 7, 1]], [[-1.25, -1.25, 1.25], [7, 3, 6]], [[1.25, -1.25, -1.25], [5, 4, 0]], [[-1.25, -1.25, -1.25], [6, 4, 2]]],
    bounding_box: [[5, 1.25, 5], [-5, -1.25, -5]]
}
const cubid = {
    vertices: [[-5, -5, -5], [5, -5, -5], [-5, -5, 5], [5, -5, 5], [-5, 5, -5], [5, 5, -5], [-5, 5, 5], [5, 5, 5]],
    edges: [[2, 0], [3, 1], [2, 3], [0, 1], [3, 7], [1, 5], [7, 5], [7, 6], [5, 4], [6, 4], [6, 2], [4, 0]],
    face_normals: [[[0, 5, 0], [6, 9, 7, 8]], [[5, 0, 0], [4, 6, 5, 1]], [[0, -5, 0], [1, 0, 3, 2]], [[-5, 0, 0], [9, 10, 0, 11]], [[0, 0, 5], [7, 4, 10, 2]], [[0, 0, -5], [3, 5, 11, 8]]],
    bounding_box: [[5, 5, 5], [-5, -5, -5]]
}

// global variables
var lastTime = 0
var mouse_timer
var current_state

// Website events
function detectMouseMovement(e) {
    clearTimeout(mouse_timer)
    mouse_timer = setTimeout(() => {game_state.delta_coords = [0, 0]}, 0)
    game_state.delta_coords = [e.movementX, e.movementY]
}
function detectMousePosition(e) {
    main_menu_state.mouse_coords = [e.clientX, e.clientY]
}
function onKeyDown(e) {
    game_state.key_down_state[e.code] = true
}
function onKeyUp(e) {
    game_state.key_down_state[e.code] = false
}
function onMouseDown(e) {
    game_state.mouse_down_state[String(e.button)] = true
}
function onMouseUp(e) {
    game_state.mouse_down_state[String(e.button)] = false
}
function onMenuClick() {
    let withinRange = (val, range) => (val >= range[0] && val <= range[1])
    if (
        withinRange(main_menu_state.mouse_coords[0], [main_menu_state.play_button.left, main_menu_state.play_button.right]) && 
        withinRange(main_menu_state.mouse_coords[1], [main_menu_state.play_button.top, main_menu_state.play_button.bottom])
    ) 
    {
        main_menu_state.exit()
        game_state.enter()
    }
}

// GameState
var game_state = new GameState({display_dimensions: [canvas.width, canvas.height]})
game_state.enter = () => {
    current_state = game_state
    canvas.style.cursor = "none"
    canvas.requestPointerLock({unadjustedMovement: true})
    canvas.addEventListener("mousemove", detectMouseMovement)
    window.addEventListener("keydown", onKeyDown)
    window.addEventListener("keyup", onKeyUp)
    window.addEventListener("mousedown", onMouseDown)
    window.addEventListener("mouseup", onMouseUp)
}
game_state.exit = () => {
    canvas.style.cursor = "auto"
    document.exitPointerLock()
    canvas.removeEventListener("mousemove", detectMouseMovement)
    window.removeEventListener("keydown", onKeyDown)
    window.removeEventListener("keyup", onKeyUp)
    window.removeEventListener("mousedown", onMouseDown)
    window.removeEventListener("mouseup", onMouseUp)
}
game_state.drawObject = () => {
    ctx.lineWidth = game_state.current_colour == "lightblue" || game_state.current_colour == "red"  ? 3 : 1
    ctx.strokeStyle = game_state.current_colour
    ctx.beginPath()
    for (let i = 0; i < game_state.current_edges.length; i++) {
        let line_start = game_state.current_vertices[game_state.current_edges[i][0]]
        let line_end = game_state.current_vertices[game_state.current_edges[i][1]]
        ctx.moveTo(line_start[0], line_start[1])
        ctx.lineTo(line_end[0], line_end[1])
    }
    ctx.stroke()
    ctx.closePath()
}
game_state.drawBackground = () => {
    ctx.fillStyle = "white"
    for (let star of game_state.current_stars) {
        ctx.beginPath()
        ctx.arc(star[0], star[1], 1, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
}
game_state.drawHUD = () => {
    ctx.lineWidth = 1
    ctx.beginPath()
    ctx.strokeStyle = "yellow"
    ctx.arc(game_state.radar_centre[0], game_state.radar_centre[1], game_state.radar_radius, 0, Math.PI * 2)
    ctx.moveTo(game_state.radar_centre[0], game_state.radar_centre[1] - game_state.radar_radius)
    ctx.lineTo(game_state.radar_centre[0], game_state.radar_centre[1] + game_state.radar_radius)
    ctx.moveTo(game_state.radar_centre[0] - game_state.radar_radius, game_state.radar_centre[1])
    ctx.lineTo(game_state.radar_centre[0] + game_state.radar_radius, game_state.radar_centre[1])
    ctx.moveTo(canvas.width/2, canvas.height/2 - 25)
    ctx.lineTo(canvas.width/2, canvas.height/2 + 25)
    ctx.moveTo(canvas.width/2 - 25, canvas.height/2)
    ctx.lineTo(canvas.width/2 + 25, canvas.height/2)
    ctx.stroke()
    ctx.closePath()
    ctx.fillStyle = "red"
    for (let point of game_state.radar_points) {
        ctx.beginPath()
        ctx.arc(point[0] + game_state.radar_centre[0], point[1] + game_state.radar_centre[1], 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
    ctx.font = "20px mainfont"
    let position_display = game_state.player_position.map(e => Math.floor(e))
    position_display[1] = -position_display[1]
    position_display = String(position_display)
    ctx.fillText(
        position_display,
        game_state.radar_centre[0] - 10 * Math.floor(position_display.length/2),
        game_state.radar_centre[1] + game_state.radar_radius + 18
    )

    let overheat_meter_height = (game_state.overheat_counter / game_state.max_shots) * game_state.radar_radius * 2
    ctx.fillStyle = overheat_meter_height >= game_state.radar_radius * 2 ? "maroon" : "red"
    ctx.fillRect(
        game_state.radar_centre[0] + game_state.radar_radius + 10,
        game_state.radar_centre[1] - game_state.radar_radius + (game_state.radar_radius * 2 - overheat_meter_height),
        20,
        overheat_meter_height,
    )
    let speed_meter_height = (game_state.player_speed / game_state.max_speed) * game_state.radar_radius * 2
    ctx.fillStyle = "orange"
    ctx.fillRect(
        game_state.radar_centre[0] - game_state.radar_radius - 30,
        game_state.radar_centre[1] - game_state.radar_radius + (game_state.radar_radius * 2 - speed_meter_height),
        20,
        speed_meter_height
    )
}
// Main menu state
var main_menu_state = new MainMenuState({display_dimensions: [canvas.width, canvas.height]})
main_menu_state.enter = () => {
    current_state = main_menu_state
    canvas.addEventListener("mouseup", onMenuClick)
    canvas.addEventListener("mousemove", detectMousePosition)
}
main_menu_state.exit = () => {
    canvas.removeEventListener("mouseup", onMenuClick)
    canvas.removeEventListener("mousemove", detectMousePosition)
}
main_menu_state.mainLoop = () => {
    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.fillRect(
        main_menu_state.play_button.left, 
        main_menu_state.play_button.top, 
        main_menu_state.play_button.right - main_menu_state.play_button.left, 
        main_menu_state.play_button.bottom - main_menu_state.play_button.top
    )
    ctx.fillStyle = "black"
    ctx.font = "20px mainfont"
    ctx.fillText(main_menu_state.play_button.text, main_menu_state.play_button.left + 6, main_menu_state.play_button.top + 24, 90)
    ctx.closePath()

    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.font = "80px mainfont"
    ctx.fillText(main_menu_state.title_card.text, main_menu_state.title_card.left, main_menu_state.title_card.top)
    ctx.closePath()
}
// Main function that updates the display
function updateDisplay(timestamp) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    current_state.delta_time = (timestamp - lastTime) * (1/1000)
    lastTime = timestamp

    current_state.mainLoop()

    requestAnimationFrame(updateDisplay)
}
// Startup stuff
main_menu_state.enter()
//Convoy test
let convoy_position = Vector.scale([Object.randomFloat(), Object.randomFloat(), Object.randomFloat()], 450)
game_state.game_objects = Object.spawnConvoy(squip, 5, 40, 0.4, convoy_position)
// Lift off!!
updateDisplay(0)
