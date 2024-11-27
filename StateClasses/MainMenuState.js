import Vector from "../MethodClasses/Vector.js"

export default class MainMenuState {
    constructor(...args) {
        const [{display_dimensions}] = args
        this.display_dimensions = display_dimensions
        this.mouse_coords
        this.just_clicked = false
        this.play_button = {
            top_right: [70, -25],
            bottom_left: [-70, 25],
            text: "Start Game"
        }
        this.title_card = {
            top: -150,
            left: -180,
            text: "VOID  ZONE"
        } 
    }
    checkClick(pos, tr, bl) {
        return pos[0] < tr[0] && pos[0] > bl[0] && pos[1] > tr[1] && pos[1] < bl[1]
    }
    mainLoop() {
        this.drawMain()
        if (this.just_clicked) {
            this.just_clicked = false
            let rel_coords = [
                this.mouse_coords[0] - (this.display_dimensions[0] / 2), 
                this.mouse_coords[1] - (this.display_dimensions[1] / 2)
            ]
            if (this.checkClick(rel_coords, this.play_button.top_right, this.play_button.bottom_left)) {
                return "game_state"
            }
        }
        return 0
    }
}