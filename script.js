// Class containing vector operations, specific to the game's requirements
import Vector from "/Vector.js"
import MainMenuState from "/MainMenuState.js"
import GameState from "/GameState.js"
import BaseObjects from "/BaseObjects.js"
import Graphics from "/Graphics.js"

// global constants
const canvas = document.getElementById("display");
canvas.width = window.innerWidth
canvas.height = window.innerHeight
const base_objects = new BaseObjects()
const ctx = canvas.getContext("2d");
const fps = 60

// global variables
var lastTime = 0
var mouse_timer
var current_state

// Object templates
const squip = base_objects.squip
const cubid = base_objects.cubid

// Website events
function detectMouseMovement(e) {
    clearTimeout(mouse_timer)
    mouse_timer = setTimeout(() => {game_state.delta_coords = [0, 0]}, 0)
    game_state.delta_coords = [e.movementX, e.movementY]
}
function detectMousePosition(e) {
    main_menu_state.mouse_coords = [e.clientX, e.clientY]
}
function onMouseClick() {
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
}
game_state.exit = () => {
    canvas.style.cursor = "auto"
    document.exitPointerLock()
    canvas.removeEventListener("mousemove", detectMouseMovement)
}
game_state.drawObject = () => {
    ctx.strokeStyle = "white"
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
game_state.drawHUD = () => {
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
    ctx.fillStyle = "blue"
    ctx.beginPath()
    ctx.arc(game_state.radar_centre[0], game_state.radar_centre[1], 4, 0, Math.PI * 2)
    ctx.fill()
    ctx.closePath()

    ctx.fillStyle = "red"
    for (let point of game_state.radar_points) {
        ctx.beginPath()
        ctx.arc(point[0] + game_state.radar_centre[0], point[1] + game_state.radar_centre[1], 3, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }
    ctx.font = "20px mainfont"
    ctx.fillText(
        String(Math.round(game_state.rotation_x / Math.PI * 180)), 
        game_state.radar_centre[0] + 25, 
        game_state.radar_centre[1] - game_state.radar_radius - 5
    )
    ctx.fillText(
        String(Math.round(game_state.rotation_y / Math.PI * 180)), 
        game_state.radar_centre[0] - 40, 
        game_state.radar_centre[1] - game_state.radar_radius - 5
    )
}
// Main menu state
var main_menu_state = new MainMenuState({display_dimensions: [canvas.width, canvas.height]})
main_menu_state.enter = () => {
    current_state = main_menu_state
    canvas.addEventListener("mouseup", onMouseClick)
    canvas.addEventListener("mousemove", detectMousePosition)
}
main_menu_state.exit = () => {
    canvas.removeEventListener("mouseup", onMouseClick)
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

    current_state.delta_time = (timestamp - lastTime) * (fps/1000)
    lastTime = timestamp

    current_state.mainLoop()

    requestAnimationFrame(updateDisplay)
}
// Startup stuff
ctx.lineWidth = 1
main_menu_state.enter()
// Test objects
game_state.spawnObject(cubid, [0, 0, 0], [0, 0, 50])
game_state.spawnObject(squip, [0, 0, 0], [30, -50, 40])
// Lift off!!
updateDisplay(0)
