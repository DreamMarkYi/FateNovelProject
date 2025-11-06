import { ref, onMounted, onUnmounted } from 'vue'
import { PerlinNoise } from '@/utils/perlinNoise'

// 文字噪声效果
export function useTextNoise(canvasRef) {
  let time = 0
  let animationId = null
  const perlin = new PerlinNoise()

  const texts = [
    {
      text: 'SILENT HAZE',
      x: 0,
      y: 50,
      size: 16,
      weight: '300',
      spacing: 5,
      noiseScale: 0.05
    },
    {
      text: 'SUMMER',
      x: -10,
      y: 120,
      size: 96,
      weight: '700',
      spacing: 0,
      noiseScale: 0.02
    },
    {
      text: 'BREEZE',
      x: 0,
      y: 240,
      size: 96,
      weight: '700',
      spacing: 0,
      noiseScale: 0.02
    },
    {
      text: '海辺の思い出',
      x: 0,
      y: 360,
      size: 15,
      weight: '300',
      spacing: 2,
      noiseScale: 0.08
    }
  ]

  const drawTextWithNoise = (canvas, ctx) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    texts.forEach((textObj, index) => {
      ctx.font = `${textObj.weight} ${textObj.size}px Arial`
      ctx.textBaseline = 'top'

      const metrics = ctx.measureText(textObj.text)
      const textWidth = metrics.width
      const textHeight = textObj.size

      const tempCanvas = document.createElement('canvas')
      const tempCtx = tempCanvas.getContext('2d')
      tempCanvas.width = textWidth + 20
      tempCanvas.height = textHeight + 20

      tempCtx.font = ctx.font
      tempCtx.fillStyle = 'white'
      tempCtx.textBaseline = 'top'
      tempCtx.fillText(textObj.text, 10, 10)

      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height)
      const data = imageData.data

      for (let y = 0; y < tempCanvas.height; y++) {
        for (let x = 0; x < tempCanvas.width; x++) {
          const index = (y * tempCanvas.width + x) * 4
          const alpha = data[index + 3]

          if (alpha > 0) {
            const noiseX = x * textObj.noiseScale
            const noiseY = y * textObj.noiseScale
            const noise = perlin.noise(noiseX + time, noiseY + time * 0.5)
            const normalizedNoise = (noise + 1) / 2

            data[index] = 255
            data[index + 1] = 255
            data[index + 2] = 255
            data[index + 3] = Math.pow((1 - normalizedNoise * 0.4), 2) * alpha
          }
        }
      }

      tempCtx.putImageData(imageData, 0, 0)
      ctx.drawImage(tempCanvas, textObj.x, textObj.y)

      if (index === 0 || index === 2) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.4)'
        ctx.fillRect(textObj.x, textObj.y + textObj.size + 20, 120, 1)
      }
    })

    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)'
    ctx.shadowBlur = 8
    ctx.shadowOffsetX = 0
    ctx.shadowOffsetY = 4
  }

  const animate = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    time += 0.005
    drawTextWithNoise(canvas, ctx)
    animationId = requestAnimationFrame(animate)
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (canvas) {
      canvas.width = 800
      canvas.height = 600
      animate()
    }
  })

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })

  return { animate }
}

// 雨滴效果
export function useRainEffect(canvasRef) {
  let animationId = null
  const raindrops = []
  const splashes = []

  class Raindrop {
    constructor(canvas) {
      this.canvas = canvas
      this.reset()
    }

    reset() {
      this.x = Math.random() * this.canvas.width
      this.y = -Math.random() * this.canvas.height
      this.length = 15 + Math.random() * 15
      this.speed = 8 + (this.length / 30) * 12
      this.width = 1 + Math.random()
      this.opacity = 0.3 + Math.random() * 0.4
    }

    update() {
      this.y += this.speed
      if (this.y > this.canvas.height) {
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

  const animate = () => {
    const canvas = canvasRef.value
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true })
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    raindrops.forEach(drop => {
      drop.update()
      drop.draw(ctx)

      if (drop.y >= canvas.height - 5 && Math.random() < 0.1) {
        splashes.push(new Splash(drop.x, canvas.height))
      }
    })

    for (let i = splashes.length - 1; i >= 0; i--) {
      const splash = splashes[i]
      if (!splash.update()) {
        splashes.splice(i, 1)
      } else {
        splash.draw(ctx)
      }
    }

    animationId = requestAnimationFrame(animate)
  }

  onMounted(() => {
    const canvas = canvasRef.value
    if (canvas) {
      canvas.width = window.innerWidth / 2
      canvas.height = window.innerHeight

      for (let i = 0; i < 150; i++) {
        raindrops.push(new Raindrop(canvas))
      }

      animate()
    }
  })

  onUnmounted(() => {
    if (animationId) {
      cancelAnimationFrame(animationId)
    }
  })

  return { animate }
}

// 视差效果
export function useParallaxEffect() {
  const mouseX = ref(window.innerWidth / 2)
  const mouseY = ref(window.innerHeight / 2)
  const targetX1 = ref(0)
  const targetY1 = ref(0)
  const isHovering = ref(false)

  const handleMouseMove = (e) => {
    mouseX.value = e.clientX
    mouseY.value = e.clientY

    const centerX = window.innerWidth / 2
    const centerY = window.innerHeight / 2
    const offsetX = (mouseX.value - centerX) / centerX
    const offsetY = (mouseY.value - centerY) / centerY

    if (isHovering.value) {
      targetX1.value = offsetX
      targetY1.value = offsetY
    } else {
      targetX1.value *= 0.95
      targetY1.value *= 0.95
    }
  }

  onMounted(() => {
    document.addEventListener('mousemove', handleMouseMove)
  })

  onUnmounted(() => {
    document.removeEventListener('mousemove', handleMouseMove)
  })

  return {
    mouseX,
    mouseY,
    targetX1,
    targetY1,
    isHovering
  }
}


