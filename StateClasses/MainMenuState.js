export default class MainMenuState {
    constructor(...args) {
        const [{display_dimensions}] = args
        this.mouse_coords = []
        this.play_button = {
            top: display_dimensions[1]/2 - 20, 
            left: display_dimensions[0]/2 - 50, 
            bottom: display_dimensions[1]/2 + 20, 
            right: display_dimensions[0]/2 + 50, 
            text: "Start Game"
        }
        this.title_card = {
            top: display_dimensions[1]/2 - 200,
            left: display_dimensions[0]/2 - 180,
            text: "VOID ZONE"
        }
    }
    mainLoop() {
        return null
    }
    enter() {
        return null
    }
    exit() {
        return null
    }
}