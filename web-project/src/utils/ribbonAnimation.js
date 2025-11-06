// 柔和丝带动画
export class Ribbon {
  constructor(canvas, ctx) {
    this.canvas = canvas
    this.ctx = ctx
    this.points = []
    this.numPoints = 20
    this.animationId = null
    this.init()
  }

  init() {
    for (let i = 0; i < this.numPoints; i++) {
      this.points.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: Math.random() * 1.5 - 0.75,
        vy: Math.random() * 1.5 - 0.75
      })
    }
  }

  update() {
    this.points.forEach(point => {
      point.x += point.vx
      point.y += point.vy

      if (point.x < 0 || point.x > this.canvas.width) point.vx *= -1
      if (point.y < 0 || point.y > this.canvas.height) point.vy *= -1
    })
  }

  draw() {
    this.ctx.strokeStyle = 'rgba(230, 165, 165, 0.08)'
    this.ctx.lineWidth = 2
    this.ctx.beginPath()
    this.ctx.moveTo(this.points[0].x, this.points[0].y)

    for (let i = 1; i < this.points.length; i++) {
      this.ctx.lineTo(this.points[i].x, this.points[i].y)
    }

    this.ctx.stroke()
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.update()
    this.draw()
    this.animationId = requestAnimationFrame(() => this.animate())
  }

  start() {
    this.animate()
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }
}


