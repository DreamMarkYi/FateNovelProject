// 波纹点击效果
export function createRipple(e, color = 'rgba(230, 165, 165, 0.6)') {
  const ripple = document.createElement('div')
  ripple.style.cssText = `
    position: fixed;
    left: ${e.clientX}px;
    top: ${e.clientY}px;
    width: 0;
    height: 0;
    border: 2px solid ${color};
    border-radius: 50%;
    transform: translate(-50%, -50%);
    pointer-events: none;
    z-index: 1000;
  `
  document.body.appendChild(ripple)

  let size = 0
  const animate = setInterval(() => {
    size += 10
    ripple.style.width = size + 'px'
    ripple.style.height = size + 'px'
    ripple.style.opacity = 1 - (size / 200)

    if (size >= 200) {
      clearInterval(animate)
      document.body.removeChild(ripple)
    }
  }, 20)
}

// 页面过渡效果
export function fadeOut() {
  return new Promise((resolve) => {
    document.body.style.opacity = '0'
    document.body.style.transform = 'scale(0.95)'
    setTimeout(resolve, 800)
  })
}


