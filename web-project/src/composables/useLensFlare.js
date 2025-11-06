/**
 * 太阳镜头光晕特效 (Lens Flare)
 */
export function useLensFlare(canvasRef) {
  let flareCtx = null
  let sunPosition = {
    x: 0,
    y: 0,
    time: 0
  }

  // Lens Flare元素配置
  const flareElements = [
    // 主光源
    {
      type: 'core',
      position: 0,
      size: 60,
      color: { r: 255, g: 250, b: 220 },
      opacity: 0.9,
      pulseSpeed: 0.4,
      pulseAmount: 0.05,
      depthSpeed: 0.3,
      depthAmount: 0.03,
      timeOffset: 0
    },
    // 内层光晕
    {
      type: 'glow',
      position: 0,
      size: 120,
      color: { r: 255, g: 240, b: 180 },
      opacity: 0.4,
      pulseSpeed: 0.6,
      pulseAmount: 0.06,
      depthSpeed: 0.4,
      depthAmount: 0.04,
      timeOffset: 0.5
    },
    // 外层光晕
    {
      type: 'glow',
      position: 0,
      size: 200,
      color: { r: 255, g: 220, b: 150 },
      opacity: 0.2,
      pulseSpeed: 0.35,
      pulseAmount: 0.05,
      depthSpeed: 0.25,
      depthAmount: 0.03,
      timeOffset: 1.2
    },
    // 六边形光斑1
    {
      type: 'hexagon',
      position: 0.15,
      size: 40,
      color: { r: 180, g: 220, b: 255 },
      opacity: 0.3,
      rotation: 0,
      pulseSpeed: 0.7,
      pulseAmount: 0.08,
      depthSpeed: 0.5,
      depthAmount: 0.05,
      timeOffset: 2.1
    },
    // 圆形光圈1
    {
      type: 'ring',
      position: 0.25,
      size: 80,
      color: { r: 255, g: 200, b: 150 },
      opacity: 0.25,
      pulseSpeed: 0.55,
      pulseAmount: 0.07,
      depthSpeed: 0.45,
      depthAmount: 0.04,
      timeOffset: 3.5
    },
    // 六边形光斑2
    {
      type: 'hexagon',
      position: 0.38,
      size: 55,
      color: { r: 200, g: 180, b: 255 },
      opacity: 0.28,
      rotation: Math.PI / 6,
      pulseSpeed: 0.8,
      pulseAmount: 0.09,
      depthSpeed: 0.6,
      depthAmount: 0.06,
      timeOffset: 1.8
    },
    // 圆形光圈2
    {
      type: 'ring',
      position: 0.5,
      size: 100,
      color: { r: 255, g: 180, b: 200 },
      opacity: 0.2,
      pulseSpeed: 0.45,
      pulseAmount: 0.06,
      depthSpeed: 0.35,
      depthAmount: 0.04,
      timeOffset: 4.2
    },
    // 小光斑
    {
      type: 'circle',
      position: 0.6,
      size: 30,
      color: { r: 200, g: 255, b: 200 },
      opacity: 0.3,
      pulseSpeed: 0.9,
      pulseAmount: 0.1,
      depthSpeed: 0.7,
      depthAmount: 0.05,
      timeOffset: 2.7
    }
  ]

  // 绘制径向渐变光晕
  function drawGlow(ctx, x, y, size, color, opacity) {
    ctx.save()
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`)
    gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.5})`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 绘制六边形光斑
  function drawHexagon(ctx, x, y, size, color, opacity, rotation) {
    ctx.save()
    ctx.translate(x, y)
    ctx.rotate(rotation)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`)
    gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i
      const px = Math.cos(angle) * size
      const py = Math.sin(angle) * size
      if (i === 0) {
        ctx.moveTo(px, py)
      } else {
        ctx.lineTo(px, py)
      }
    }
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  // 绘制圆形光圈
  function drawRing(ctx, x, y, size, color, opacity) {
    ctx.save()
    const gradient1 = ctx.createRadialGradient(x, y, size * 0.7, x, y, size)
    gradient1.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    gradient1.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`)
    gradient1.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    ctx.fillStyle = gradient1
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 绘制圆形光斑
  function drawCircle(ctx, x, y, size, color, opacity) {
    ctx.save()
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size)
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`)
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, size, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }

  // 初始化Canvas
  function initFlareCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    flareCtx = canvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    })

    resizeFlareCanvas()
  }

  // 调整Canvas尺寸
  function resizeFlareCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.width = window.innerWidth / 2
    canvas.height = window.innerHeight

    sunPosition.x = canvas.width * 0.15
    sunPosition.y = canvas.height * 0.15
  }

  // 主绘制函数
  function drawLensFlare() {
    const canvas = canvasRef.value
    if (!canvas || !flareCtx) {
      initFlareCanvas()
      return
    }

    flareCtx.clearRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    flareElements.forEach(element => {
      const elementTime = sunPosition.time + element.timeOffset
      const pulse = Math.sin(elementTime * element.pulseSpeed) * element.pulseAmount + 1
      const animatedSize = element.size * pulse
      const opacityPulse = Math.sin(elementTime * element.pulseSpeed * 0.7) * 0.15 + 1
      const animatedOpacity = element.opacity * opacityPulse
      const depthOffset = Math.sin(elementTime * element.depthSpeed) * element.depthAmount
      const t = element.position + depthOffset
      const x = sunPosition.x + (centerX - sunPosition.x) * t
      const y = sunPosition.y + (centerY - sunPosition.y) * t

      switch (element.type) {
        case 'core':
        case 'glow':
          drawGlow(flareCtx, x, y, animatedSize, element.color, animatedOpacity)
          break
        case 'hexagon':
          const rotationSpeed = 0.03 + (element.timeOffset % 1) * 0.04
          const rotation = element.rotation + elementTime * rotationSpeed
          drawHexagon(flareCtx, x, y, animatedSize, element.color, animatedOpacity, rotation)
          break
        case 'ring':
          drawRing(flareCtx, x, y, animatedSize, element.color, animatedOpacity)
          break
        case 'circle':
          drawCircle(flareCtx, x, y, animatedSize, element.color, animatedOpacity)
          break
      }
    })

    sunPosition.time += 0.02
  }

  // 窗口调整事件
  function handleResize() {
    resizeFlareCanvas()
  }

  // 初始化
  if (canvasRef.value) {
    initFlareCanvas()
  }

  window.addEventListener('resize', handleResize)

  return {
    drawLensFlare,
    cleanup: () => {
      window.removeEventListener('resize', handleResize)
    }
  }
}
