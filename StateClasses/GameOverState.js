export default class GameOverState {
    constructor(...args) {
        const [{display_dimensions}] = args
        this.display_dimensions = display_dimensions
        this.mouse_coords
        this.tribute
        this.death_stats = [
            {   
                top: -20,
                left: -270,
                text: "Waves defeated: ",
                stat: ""
            },
            {   
                top: 0,
                left: -270,
                text: "Enemies destroyed: ",
                stat: ""
            },
            {   
                top: 20,
                left: -270,
                text: "Time survived: ",
                stat: ""
            },
            {   
                top: 40,
                left: -270,
                text: "Total score: ",
                stat: ""
            },
        ]
        this.just_clicked = false
        this.main_menu_button = {
            top_right: [70, 125],
            bottom_left: [-70, 175],
            text: "Main Menu"
        }
        this.title_card = {
            top: -150,
            left: -180,
            text: "GAME OVER"
        }
    }
    tributeWriter() {
        let score = Number(this.death_stats[3].stat)
        if (score < 2000) {
            return '"There  were  finer  pilots"'
        } else if (score < 4000) {
            return '"Pretty  decent  shot"'
        } else {
            return '"Another  ace  among  the  stars"'
        }
    }
    checkClick(pos, tr, bl) {
        return pos[0] < tr[0] && pos[0] > bl[0] && pos[1] > tr[1] && pos[1] < bl[1]
    }
    mainLoop() {
        if (this.tribute != "") {
            this.tribute = this.tributeWriter()
        }
        this.drawMain()
        if (this.just_clicked) {
            this.just_clicked = false
            let rel_coords = [
                this.mouse_coords[0] - this.display_dimensions[0] / 2, 
                this.mouse_coords[1] - this.display_dimensions[1] / 2,
            ]
            if (this.checkClick(rel_coords, this.main_menu_button.top_right, this.main_menu_button.bottom_left)) {
                return "main_menu_state"
            }
        }
        return 0
    }
}