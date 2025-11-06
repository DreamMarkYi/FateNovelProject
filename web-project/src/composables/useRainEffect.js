/**
 * 雨滴粒子特效
 */
export function useRainEffect(canvasRef) {
  let rainCtx = null
  let raindrops = []
  let splashes = []
  const raindropCount = 150

  // 雨滴类
  class Raindrop {
    constructor(canvasWidth, canvasHeight) {
      this.canvasWidth = canvasWidth
      this.canvasHeight = canvasHeight
      this.reset()
    }

    reset() {
      this.x = Math.random() * this.canvasWidth
      this.y = -Math.random() * this.canvasHeight
      this.length = 15 + Math.random() * 15
      this.speed = 8 + (this.length / 30) * 12
      this.width = 1 + Math.random()
      this.opacity = 0.3 + Math.random() * 0.4
    }

    update() {
      this.y += this.speed
      if (this.y > this.canvasHeight) {
        this.reset()
      }
    }

    draw(ctx) {
      ctx.save()
      ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`
      ctx.lineWidth = this.width
      ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(this.x, this.y)
      ctx.lineTo(this.x, this.y + this.length)
      ctx.stroke()
      ctx.restore()
    }
  }

  // 水花类
  class Splash {
    constructor(x, y) {
      this.x = x
      this.y = y
      this.radius = 0
      this.maxRadius = 3 + Math.random() * 4
      this.opacity = 0.6
      this.growing = true
    }

    update() {
      if (this.growing) {
        this.radius += 0.5
        this.opacity -= 0.05
        if (this.radius >= this.maxRadius) {
          this.growing = false
        }
      }
      return this.opacity > 0
    }

    draw(ctx) {
      ctx.save()
      ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
      ctx.stroke()
      ctx.restore()
    }
  }

  // 初始化Canvas
  function initRainCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    rainCtx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    })

    resizeRainCanvas()

    // 初始化雨滴
    raindrops = []
    for (let i = 0; i < raindropCount; i++) {
      raindrops.push(new Raindrop(canvas.width, canvas.height))
    }
  }

  // 调整Canvas尺寸
  function resizeRainCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.width = window.innerWidth / 2
    canvas.height = window.innerHeight

    // 重新初始化雨滴
    raindrops.forEach(drop => {
      drop.canvasWidth = canvas.width
      drop.canvasHeight = canvas.height
    })
  }

  // 绘制雨滴效果
  function drawRain() {
    const canvas = canvasRef.value
    if (!canvas || !rainCtx) {
      initRainCanvas()
      return
    }

    rainCtx.clearRect(0, 0, canvas.width, canvas.height)

    // 更新和绘制雨滴
    raindrops.forEach(drop => {
      drop.update()
      drop.draw(rainCtx)

      // 随机生成水花
      if (drop.y >= canvas.height - 5 && Math.random() < 0.1) {
        splashes.push(new Splash(drop.x, canvas.height))
      }
    })

    // 更新和绘制水花
    for (let i = splashes.length - 1; i >= 0; i--) {
      const splash = splashes[i]
      if (!splash.update()) {
        splashes.splice(i, 1)
      } else {
        splash.draw(rainCtx)
      }
    }
  }

  // 窗口调整事件
  function handleResize() {
    resizeRainCanvas()
  }

  // 初始化
  if (canvasRef.value) {
    initRainCanvas()
  }

  window.addEventListener('resize', handleResize)

  return {
    drawRain,
    cleanup: () => {
      window.removeEventListener('resize', handleResize)
    }
  }
}


