// Imports
import Vector from "./MethodClasses/Vector.js"
import MainMenuState from "./StateClasses/MainMenuState.js"
import GameState from "./StateClasses/GameState.js"
import Graphics from "./MethodClasses/Graphics.js"
import Object from "./ObjectClasses/Object.js"
import GameOverState from "./StateClasses/GameOverState.js"

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
function mouseMovement(e) {
    clearTimeout(mouse_timer)
    mouse_timer = setTimeout(() => {game_state.delta_coords = [0, 0]}, 0)
    game_state.delta_coords = [e.movementX, e.movementY]
}
function mousePositionMainMenu(e) {
    main_menu_state.mouse_coords = [e.clientX, e.clientY]
}
function mousePositionGameOver(e) {
    game_over_state.mouse_coords = [e.clientX, e.clientY]
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
function onMainMenuClick() {
    let withinRange = (val, range) => (val >= range[0] && val <= range[1])
    if (
        withinRange(main_menu_state.mouse_coords[0], [main_menu_state.play_button.left, main_menu_state.play_button.right]) && 
        withinRange(main_menu_state.mouse_coords[1], [main_menu_state.play_button.top, main_menu_state.play_button.bottom])
    ) 
    {
        main_menu_state.exit()
        game_state = assignStateFunctions(new GameState({display_dimensions: [canvas.width, canvas.height]}))
        game_state.enter()
    }
}
function onGameOverClick() {
    let withinRange = (val, range) => (val >= range[0] && val <= range[1])
    if (
        withinRange(game_over_state.mouse_coords[0], [game_over_state.main_menu_button.left, game_over_state.main_menu_button.right]) && 
        withinRange(game_over_state.mouse_coords[1], [game_over_state.main_menu_button.top, game_over_state.main_menu_button.bottom])
    ) 
    {
        game_over_state.exit()
        main_menu_state.enter()
    }
}


// Game state
var game_state
function assignStateFunctions(state) {
    let new_state = state
    new_state.enter = () => {
        current_state = new_state
        canvas.style.cursor = "none"
        canvas.requestPointerLock()
        canvas.addEventListener("mousemove", mouseMovement)
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        window.addEventListener("mousedown", onMouseDown)
        window.addEventListener("mouseup", onMouseUp)
    }
    new_state.exit = () => {
        canvas.style.cursor = "auto"
        document.exitPointerLock()
        canvas.removeEventListener("mousemove", mouseMovement)
        window.removeEventListener("keydown", onKeyDown)
        window.removeEventListener("keyup", onKeyUp)
        window.removeEventListener("mousedown", onMouseDown)
        window.removeEventListener("mouseup", onMouseUp)
    }
    new_state.changeLock = () => {
        if (document.pointerLockElement == canvas) {
            document.exitPointerLock()
        } else {
            canvas.requestPointerLock()
        }
    }
    new_state.drawObject = () => {
        let render_object = new_state.current_render
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
    new_state.drawBackground = () => {
        ctx.fillStyle = "white"
        for (let star of new_state.current_stars) {
            ctx.beginPath()
            ctx.arc(star[0], star[1], 1, 0, Math.PI * 2)
            ctx.fill()
            ctx.closePath()
        }
    }
    new_state.drawHUD = () => {
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
            "Wave " + new_state.wave_count.toString(),
            15,
            30
        )
        ctx.fillText(
            new_state.score.toString(),
            15,
            60
        )
    
        ctx.font = "20px mainfont"
        ctx.translate(new_state.radar_centre[0], new_state.radar_centre[1])
        ctx.beginPath()
        ctx.arc(0, 0, new_state.radar_radius, 0, Math.PI * 2)
        ctx.moveTo(0, -new_state.radar_radius)
        ctx.lineTo(0, new_state.radar_radius)
        ctx.moveTo(-new_state.radar_radius, 0)
        ctx.lineTo(new_state.radar_radius, 0)
        ctx.stroke()
        ctx.closePath()
        ctx.fillStyle = "red"
        for (let point of new_state.radar_points) {
            if (point.length < 2) {
                continue
            }
            ctx.beginPath()
            ctx.arc(point[0], point[1], 2, 0, Math.PI * 2)
            ctx.fill()
            ctx.closePath()
        }
    
        ctx.fillStyle = "#ff3853"
        if (new_state.enemy_missile_active) {
            ctx.fillText(
                "MISSILE",
                -35,
                -new_state.radar_radius - 25,
            )
        }
    
        let overheat_meter_height = (new_state.overheat_counter / new_state.max_shots) * new_state.radar_radius * 2
        ctx.fillStyle = overheat_meter_height >= new_state.radar_radius * 2 ? "maroon" : "red"
        ctx.fillRect(
            new_state.radar_radius + 40,
            -new_state.radar_radius + (new_state.radar_radius * 2 - overheat_meter_height),
            20,
            overheat_meter_height,  
        )
        ctx.fillText(
            "LMG",
            new_state.radar_radius + 40,
            -new_state.radar_radius - 25,
            20
        )
    
        let missile_meter_height = (new_state.missiles_left / new_state.max_missiles) * new_state.radar_radius * 2
        ctx.fillStyle = "grey"
        ctx.fillRect(
            new_state.radar_radius + 10,
            -new_state.radar_radius + (new_state.radar_radius * 2 - missile_meter_height),
            20,
            missile_meter_height,  
        )
        ctx.fillText(
            "HSM",
            new_state.radar_radius + 10,
            -new_state.radar_radius - 25,
            20
        )
    
        let health_meter_height = (new_state.player_health / 100) * new_state.radar_radius * 2
        ctx.fillStyle = "green"
        ctx.fillRect(
            -new_state.radar_radius - 30,
            -new_state.radar_radius + (new_state.radar_radius * 2 - health_meter_height),
            20,
            health_meter_height,
        )
        ctx.drawImage(
            health_icon, 
            -new_state.radar_radius - 30, 
            -new_state.radar_radius - 25
        )
    
        let speed_meter_height = (new_state.player_speed / new_state.max_speed) * state.radar_radius * 2
        ctx.fillStyle = "orange"
        ctx.fillRect(
            -new_state.radar_radius - 60,
            -new_state.radar_radius + (state.radar_radius * 2 - speed_meter_height),
            20,
            speed_meter_height
        )
        ctx.drawImage(
            speed_icon, 
            -new_state.radar_radius - 60, 
            -new_state.radar_radius - 25
        )
    
        ctx.setTransform(1, 0, 0, 1, 0, 0)
    }
    return new_state
}


// Game Over state
var game_over_state = new GameOverState({display_dimensions: [canvas.width, canvas.height]})
game_over_state.enter = () => {
    current_state = game_over_state
    canvas.addEventListener("mouseup", onGameOverClick)
    canvas.addEventListener("mousemove", mousePositionGameOver)
}
game_over_state.exit = () => {
    canvas.removeEventListener("mouseup", onGameOverClick)
    canvas.removeEventListener("mousemove", mousePositionGameOver)
}
game_over_state.mainLoop = () => {
    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.fillRect(
        game_over_state.main_menu_button.left, 
        game_over_state.main_menu_button.top, 
        game_over_state.main_menu_button.right - game_over_state.main_menu_button.left, 
        game_over_state.main_menu_button.bottom - game_over_state.main_menu_button.top
    )
    ctx.fillStyle = "black"
    ctx.font = "20px mainfont"
    ctx.fillText(game_over_state.main_menu_button.text, game_over_state.main_menu_button.left + 6, game_over_state.main_menu_button.top + 24, 90)
    ctx.closePath()

    ctx.beginPath()
    ctx.fillStyle = "red"
    ctx.font = "80px mainfont"
    ctx.fillText(game_over_state.title_card.text, game_over_state.title_card.left, game_over_state.title_card.top)
    ctx.closePath()
    return 0
}


// Main menu state
var main_menu_state = new MainMenuState({display_dimensions: [canvas.width, canvas.height]})
main_menu_state.enter = () => {
    current_state = main_menu_state
    canvas.addEventListener("mouseup", onMainMenuClick)
    canvas.addEventListener("mousemove", mousePositionMainMenu)
}
main_menu_state.exit = () => {
    canvas.removeEventListener("mouseup", onMainMenuClick)
    canvas.removeEventListener("mousemove", mousePositionMainMenu)
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
    return 0
}


// Main function that updates the display
function updateDisplay(timestamp) {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    current_state.delta_time = (timestamp - last_time) / 1000
    last_time = timestamp

    let end_state = current_state.mainLoop()
    if (end_state != 0) {
        current_state.exit() 
        switch (end_state) {
            case "game_over":
                game_over_state.enter()
                break
            case "main_menu_state":
                main_menu_state.enter()
                break
            case "game":
                state.enter()
                break
        }
    }

    requestAnimationFrame(updateDisplay)
}


// Startup stuff
main_menu_state.enter()
window.addEventListener("resize", onWindowResize)
// Lift off!!
updateDisplay(0)
