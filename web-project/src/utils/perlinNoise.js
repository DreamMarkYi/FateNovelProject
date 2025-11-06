/**
 * Perlin Noise 类实现 - 用于生成平滑的随机噪声效果
 */
export class PerlinNoise {
  constructor() {
    // 创建置换表数组，用于生成伪随机梯度
    this.p = new Array(512)
    this.permutation = []

    // 生成0-255的随机排列
    for (let i = 0; i < 256; i++) {
      this.permutation[i] = Math.floor(Math.random() * 256)
    }

    // 将排列数组复制两次到p数组中，避免索引越界
    for (let i = 0; i < 512; i++) {
      this.p[i] = this.permutation[i & 255]
    }
  }

  /**
   * 淡入淡出函数 - 用于平滑插值
   * @param {number} t - 输入值 (0-1)
   * @return {number} - 平滑后的值 (0-1)
   */
  fade(t) {
    return t * t * t * (t * (t * 6 - 15) + 10)
  }

  /**
   * 线性插值函数
   * @param {number} t - 插值因子 (0-1)
   * @param {number} a - 起始值
   * @param {number} b - 结束值
   * @return {number} - 插值结果
   */
  lerp(t, a, b) {
    return a + t * (b - a)
  }

  /**
   * 梯度函数 - 计算梯度向量与距离向量的点积
   * @param {number} hash - 哈希值，用于选择梯度方向
   * @param {number} x - x方向的距离
   * @param {number} y - y方向的距离
   * @return {number} - 点积结果
   */
  grad(hash, x, y) {
    const h = hash & 15
    const u = h < 8 ? x : y
    const v = h < 4 ? y : h === 12 || h === 14 ? x : 0
    return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v)
  }

  /**
   * 2D Perlin噪声主函数
   * @param {number} x - x坐标
   * @param {number} y - y坐标
   * @return {number} - 噪声值 (-1到1之间)
   */
  noise(x, y) {
    const X = Math.floor(x) & 255
    const Y = Math.floor(y) & 255

    x -= Math.floor(x)
    y -= Math.floor(y)

    const u = this.fade(x)
    const v = this.fade(y)

    const a = this.p[X] + Y
    const aa = this.p[a]
    const ab = this.p[a + 1]
    const b = this.p[X + 1] + Y
    const ba = this.p[b]
    const bb = this.p[b + 1]

    return this.lerp(v,
      this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),
      this.lerp(u, this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1))
    )
  }
}
