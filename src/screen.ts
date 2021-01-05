export class Screen{
    canvas = document.createElement('canvas')
    ctx = this.canvas.getContext('2d')
    unitSize = 1
    constructor(unitSize: number, container: HTMLElement) {
        this.unitSize = unitSize
        this.canvas.width = 64 * this.unitSize
        this.canvas.height = 32 * this.unitSize
        container.appendChild(this.canvas)
    }
    clear() {
        this.ctx.clearRect(0, 0, 64, 32)
    }
    render(chatPic) {
        this.clear()
        chatPic.forEach((val, index) => {
            if (val === 1) {
                this.ctx.fillStyle = 'rgb(255, 255, 255)'
            } else {
                this.ctx.fillStyle = 'rgb(0, 0, 0)'
            }
            this.ctx.fillRect(index % 64 * this.unitSize, Math.floor(index / 64) * this.unitSize, this.unitSize, this.unitSize)
        })
    }
}