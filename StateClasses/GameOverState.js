export default class GameOverState {
    constructor(...args) {
        const [{display_dimensions}] = args
        this.mouse_coords = []
        this.main_menu_button = {
            top: display_dimensions[1]/2 - 20, 
            left: display_dimensions[0]/2 - 50, 
            bottom: display_dimensions[1]/2 + 20, 
            right: display_dimensions[0]/2 + 50, 
            text: "Main Menu"
        }
        this.title_card = {
            top: display_dimensions[1]/2 - 200,
            left: display_dimensions[0]/2 - 180,
            text: "GAME OVER"
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