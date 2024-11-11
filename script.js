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
const health_icon = new Image()
health_icon.src = "images/health.png"
const speed_icon = new Image()
speed_icon.src = "images/speed.png"


// global variables
var last_time = 0
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
function onWindowResize(e) {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    game_state.display_dimensions = [canvas.width, canvas.height]
    game_state.radar_centre = [canvas.width * 0.5, canvas.height * 0.85]
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
    let render_object = game_state.current_render
    if (render_object.vertices.length == 0) {
        let radius = Math.max(2, (1 - render_object.centre[2]) * 20)
        ctx.fillStyle = render_object.colour
        ctx.beginPath()
        ctx.arc(render_object.centre[0], render_object.centre[1], radius, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    } else {
        ctx.lineWidth = 1
        ctx.strokeStyle = "black"
        for (let stuff of render_object.faces) {
            let shaded_rgb = render_object.colour.map((e) => (Math.round(e * stuff[0]) < 16 ? "0" : "") + (Math.round(e * stuff[0]).toString(16)))
            ctx.fillStyle = "#" + shaded_rgb[0] + shaded_rgb[1] + shaded_rgb[2]

            let sequence = stuff[1]
            ctx.beginPath()
            ctx.moveTo(render_object.vertices[sequence[0]][0], render_object.vertices[sequence[0]][1])
            for (let i = 1; i < sequence.length; i++) {
                ctx.lineTo(render_object.vertices[sequence[i]][0], render_object.vertices[sequence[i]][1])
            }
            ctx.closePath()
            ctx.stroke()
            ctx.fill()
        }

        if (render_object.lock_info[0]) {
            ctx.strokeStyle = render_object.lock_info[1]
            ctx.strokeRect(
                render_object.centre[0] - 30,
                render_object.centre[1] - 30,
                60,
                60
            )
        }
    }
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
    ctx.font = "20px mainfont"
    ctx.lineWidth = 1
    ctx.strokeStyle = "yellow"
    ctx.beginPath()
    ctx.moveTo(canvas.width/2, canvas.height/2 - 25)
    ctx.lineTo(canvas.width/2, canvas.height/2 - 8)
    ctx.moveTo(canvas.width/2, canvas.height/2 + 8)
    ctx.lineTo(canvas.width/2, canvas.height/2 + 25)
    ctx.moveTo(canvas.width/2 - 25, canvas.height/2)
    ctx.lineTo(canvas.width/2 - 8, canvas.height/2)
    ctx.moveTo(canvas.width/2 + 8, canvas.height/2)
    ctx.lineTo(canvas.width/2 + 25, canvas.height/2)
    ctx.stroke()
    ctx.closePath()

    ctx.font = "30px mainfont"
    ctx.fillStyle = "white"
    ctx.fillText(
        game_state.score.toString(),
        15,
        30
    )

    ctx.font = "20px mainfont"
    ctx.translate(game_state.radar_centre[0], game_state.radar_centre[1])
    ctx.beginPath()
    ctx.arc(0, 0, game_state.radar_radius, 0, Math.PI * 2)
    ctx.moveTo(0, -game_state.radar_radius)
    ctx.lineTo(0, game_state.radar_radius)
    ctx.moveTo(-game_state.radar_radius, 0)
    ctx.lineTo(game_state.radar_radius, 0)
    ctx.stroke()
    ctx.closePath()
    ctx.fillStyle = "red"
    for (let point of game_state.radar_points) {
        ctx.beginPath()
        ctx.arc(point[0], point[1], 2, 0, Math.PI * 2)
        ctx.fill()
        ctx.closePath()
    }

    ctx.fillStyle = "#ff3853"
    if (game_state.enemy_missile_count > 0) {
        ctx.fillText(
            "MISSILE",
            -35,
            -game_state.radar_radius - 25,
        )
    }

    let overheat_meter_height = (game_state.overheat_counter / game_state.max_shots) * game_state.radar_radius * 2
    ctx.fillStyle = overheat_meter_height >= game_state.radar_radius * 2 ? "maroon" : "red"
    ctx.fillRect(
        game_state.radar_radius + 40,
        -game_state.radar_radius + (game_state.radar_radius * 2 - overheat_meter_height),
        20,
        overheat_meter_height,  
    )
    ctx.fillText(
        "LMG",
        game_state.radar_radius + 40,
        -game_state.radar_radius - 25,
        20
    )

    let missile_meter_height = (game_state.missiles_left / game_state.max_missiles) * game_state.radar_radius * 2
    ctx.fillStyle = "grey"
    ctx.fillRect(
        game_state.radar_radius + 10,
        -game_state.radar_radius + (game_state.radar_radius * 2 - missile_meter_height),
        20,
        missile_meter_height,  
    )
    ctx.fillText(
        "HSM",
        game_state.radar_radius + 10,
        -game_state.radar_radius - 25,
        20
    )

    let health_meter_height = (game_state.player_health / 100) * game_state.radar_radius * 2
    ctx.fillStyle = "green"
    ctx.fillRect(
        -game_state.radar_radius - 30,
        -game_state.radar_radius + (game_state.radar_radius * 2 - health_meter_height),
        20,
        health_meter_height,
    )
    ctx.drawImage(
        health_icon, 
        -game_state.radar_radius - 30, 
        -game_state.radar_radius - 25
    )

    let speed_meter_height = (game_state.player_speed / game_state.max_speed) * game_state.radar_radius * 2
    ctx.fillStyle = "orange"
    ctx.fillRect(
        -game_state.radar_radius - 60,
        -game_state.radar_radius + (game_state.radar_radius * 2 - speed_meter_height),
        20,
        speed_meter_height
    )
    ctx.drawImage(
        speed_icon, 
        -game_state.radar_radius - 60, 
        -game_state.radar_radius - 25
    )

    ctx.setTransform(1, 0, 0, 1, 0, 0)
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

    current_state.delta_time = (timestamp - last_time) * (1/1000)
    last_time = timestamp

    current_state.mainLoop()

    requestAnimationFrame(updateDisplay)
}
// Startup stuff
main_menu_state.enter()
window.addEventListener("resize", onWindowResize)
//Convoy test
let convoy_position = Vector.scale([Vector.randomFloat(), Vector.randomFloat(), Vector.randomFloat()], 500)
game_state.game_objects = Object.spawnConvoy({
        struct_name: "cube", 
        count: 8, 
        rad: 90, 
        spe: 1.1, 
        centre: convoy_position,
        col: [242, 24, 242]
    })
// Lift off!!
updateDisplay(0)
