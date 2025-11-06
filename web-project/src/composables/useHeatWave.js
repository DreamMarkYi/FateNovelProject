/**
 * 热浪扭曲特效
 */
export function useHeatWave(canvasRef) {
  let heatCtx = null
  let heatWaveTime = 0
  let heatWaveLines = []
  const numHeatWaves = 15

  // 初始化Canvas
  function initHeatWaveCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    heatCtx = canvas.getContext('2d')
    resizeHeatWaveCanvas()

    // 初始化热浪线条
    heatWaveLines = []
    for (let i = 0; i < numHeatWaves; i++) {
      heatWaveLines.push({
        x: Math.random() * canvas.width,
        baseY: Math.random() * canvas.height,
        amplitude: 30 + Math.random() * 50,
        frequency: 0.002 + Math.random() * 0.003,
        speed: 0.5 + Math.random() * 1.5,
        width: 2 + Math.random() * 4,
        opacity: 0.1 + Math.random() * 0.2,
        phase: Math.random() * Math.PI * 2
      })
    }
  }

  // 调整Canvas尺寸
  function resizeHeatWaveCanvas() {
    const canvas = canvasRef.value
    if (!canvas) return

    canvas.width = window.innerWidth / 2
    canvas.height = window.innerHeight
  }

  // 绘制热浪效果
  function drawHeatWave() {
    const canvas = canvasRef.value
    if (!canvas || !heatCtx) {
      initHeatWaveCanvas()
      return
    }

    heatCtx.clearRect(0, 0, canvas.width, canvas.height)

    heatWaveLines.forEach((wave) => {
      heatCtx.save()

      heatCtx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity})`
      heatCtx.lineWidth = wave.width
      heatCtx.lineCap = 'round'

      heatCtx.beginPath()

      for (let y = 0; y < canvas.height; y += 5) {
        const offset = Math.sin((y * wave.frequency) + (heatWaveTime * 0.02) + wave.phase) * wave.amplitude
        const xPos = wave.x + offset

        if (y === 0) {
          heatCtx.moveTo(xPos, y)
        } else {
          heatCtx.lineTo(xPos, y)
        }
      }

      heatCtx.stroke()
      heatCtx.restore()

      // 更新热浪位置
      wave.baseY -= wave.speed

      if (wave.baseY < -100) {
        wave.baseY = canvas.height + 100
        wave.x = Math.random() * canvas.width
      }
    })

    heatWaveTime += 1
  }

  // 窗口调整事件
  function handleResize() {
    resizeHeatWaveCanvas()
  }

  // 初始化
  if (canvasRef.value) {
    initHeatWaveCanvas()
  }

  window.addEventListener('resize', handleResize)

  return {
    drawHeatWave,
    cleanup: () => {
      window.removeEventListener('resize', handleResize)
    }
  }
}
