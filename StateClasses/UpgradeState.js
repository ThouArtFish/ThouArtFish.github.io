export default class UpgradeState {
    constructor(...args) {
        const [{display_dimensions}] = args
        this.score
        this.mouse_coords
        this.display_dimensions = display_dimensions
        this.just_clicked = false
        this.leave = false
        this.close_switch = false
        this.title_card = {
            top: -150,
            left: -180,
            text: "UPGRADES"
        }
        this.upgrade_buttons = [
            {   
                top_right: [-190, -20],
                bottom_left: [-290, 20],
                text: "Increase main gun fire rate",
                level: 0,
                price: 700
            },
            {   
                top_right: [-190, 60],
                bottom_left: [-290, 100],
                text: "Reduce main gun overheat period",
                level: 0,
                price: 800
            },
            {   
                top_right: [210, -20],
                bottom_left: [110, 20],
                text: "Increase tracking missile capacity",
                level: 0,
                price: 900
            },
            {   
                top_right: [210, 60],
                bottom_left: [110, 100],
                text: "Increase cargo drop rate",
                level: 0,
                price: 1000
            },
        ]
        this.upgrade_levels = [0, 0, 0, 0]
    }
    checkClick(pos, tr, bl) {
        return pos[0] < tr[0] && pos[0] > bl[0] && pos[1] > tr[1] && pos[1] < bl[1]
    }
    mainLoop() {
        this.drawMain()
        if (this.leave) {
            this.leave = false
            if (this.close_switch) {
                this.close_switch = false
                return "game_state"
            } else {
                this.close_switch = true
            }
        }
        if (this.just_clicked) {
            this.upgrade_levels = []
            this.just_clicked = false
            let rel_coords = [
                this.mouse_coords[0] - (this.display_dimensions[0] / 2), 
                this.mouse_coords[1] - (this.display_dimensions[1] / 2)
            ]
            for (let i = 0; i < this.upgrade_buttons.length; i++) {
                let button = this.upgrade_buttons[i]
                let button_clicked = this.checkClick(rel_coords, button.top_right, button.bottom_left)
                if (button_clicked && button.price <= this.score && button.level < 3) {
                    this.upgrade_buttons[i].level += 1
                    this.score -= button.price
                }
                this.upgrade_levels.push(this.upgrade_buttons[i].level)
            }
        }
        return 0
    }
}