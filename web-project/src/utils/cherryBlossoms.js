// 樱花飘落特效
export function createPetals(container) {
  const numPetals = 15
  const petals = []
  const timeouts = []
  let isDestroyed = false

  for (let i = 0; i < numPetals; i++) {
    const timeoutId = setTimeout(() => {
      if (isDestroyed) return // 如果已销毁，不再创建新花瓣
      
      const petal = document.createElement('div')
      petal.className = 'petal'
      petal.style.cssText = `
        position: fixed;
        width: ${Math.random() * 5 + 8}px;
        height: ${Math.random() * 5 + 8}px;
        background: radial-gradient(ellipse at center, rgba(255, 182, 193, 0.8), rgba(255, 218, 224, 0.4));
        border-radius: 50% 0 50% 0;
        pointer-events: none;
        animation: fall linear infinite;
        opacity: 0.7;
        z-index: 2;
        left: ${Math.random() * 100}%;
        animation-duration: ${Math.random() * 5 + 5}s;
        animation-delay: ${Math.random() * 3}s;
      `
      
      container.appendChild(petal)
      petals.push(petal)
    }, i * 800)
    
    timeouts.push(timeoutId)
  }

  return {
    cleanup: () => {
      isDestroyed = true
      
      // 清除所有待执行的setTimeout
      timeouts.forEach(timeoutId => clearTimeout(timeoutId))
      
      // 移除所有已创建的花瓣
      petals.forEach(petal => {
        if (petal.parentNode) {
          petal.parentNode.removeChild(petal)
        }
      })
      
      // 清除所有可能已经存在的花瓣（防止遗漏）
      const remainingPetals = container.querySelectorAll('.petal')
      remainingPetals.forEach(petal => {
        if (petal.parentNode) {
          petal.parentNode.removeChild(petal)
        }
      })
    }
  }
}

// 添加樱花飘落动画的CSS
export function addPetalStyles() {
  if (!document.getElementById('petal-styles')) {
    const style = document.createElement('style')
    style.id = 'petal-styles'
    style.textContent = `
      @keyframes fall {
        0% {
          transform: translateY(-10vh) rotate(0deg);
          opacity: 0.8;
        }
        100% {
          transform: translateY(110vh) rotate(360deg);
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)
  }
}

