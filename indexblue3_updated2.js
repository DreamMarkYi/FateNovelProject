// ========== Perlin Noise 类实现 - 用于生成平滑的随机噪声效果 ==========
class PerlinNoise {
    constructor() {
        // 创建置换表数组，用于生成伪随机梯度
        this.p = new Array(512);           // 512个元素的数组（256的两倍，避免溢出）
        this.permutation = [];             // 0-255的随机排列

        // 生成0-255的随机排列
        for (let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(Math.random() * 256);
        }

        // 将排列数组复制两次到p数组中，避免索引越界
        for (let i = 0; i < 512; i++) {
            this.p[i] = this.permutation[i & 255];  // i & 255 等价于 i % 256
        }
    }

    /**
     * 淡入淡出函数 - 用于平滑插值
     * @param {number} t - 输入值 (0-1)
     * @return {number} - 平滑后的值 (0-1)
     */
    fade(t) {
        // Ken Perlin的改进淡入淡出函数: 6t^5 - 15t^4 + 10t^3
        return t * t * t * (t * (t * 6 - 15) + 10);
    }

    /**
     * 线性插值函数
     * @param {number} t - 插值因子 (0-1)
     * @param {number} a - 起始值
     * @param {number} b - 结束值
     * @return {number} - 插值结果
     */
    lerp(t, a, b) {
        return a + t * (b - a);
    }

    /**
     * 梯度函数 - 计算梯度向量与距离向量的点积
     * @param {number} hash - 哈希值，用于选择梯度方向
     * @param {number} x - x方向的距离
     * @param {number} y - y方向的距离
     * @return {number} - 点积结果
     */
    grad(hash, x, y) {
        const h = hash & 15;              // 取哈希值的低4位 (0-15)
        const u = h < 8 ? x : y;          // 如果h<8使用x，否则使用y
        const v = h < 4 ? y : h === 12 || h === 14 ? x : 0;  // 根据h值选择v
        // 根据h的位模式决定是否取反，计算点积
        return ((h & 1) === 0 ? u : -u) + ((h & 2) === 0 ? v : -v);
    }

    /**
     * 2D Perlin噪声主函数
     * @param {number} x - x坐标
     * @param {number} y - y坐标
     * @return {number} - 噪声值 (-1到1之间)
     */
    noise(x, y) {
        // 找到单位网格的坐标
        const X = Math.floor(x) & 255;    // x的整数部分，限制在0-255
        const Y = Math.floor(y) & 255;    // y的整数部分，限制在0-255

        // 找到网格内的相对位置
        x -= Math.floor(x);               // x的小数部分 (0-1)
        y -= Math.floor(y);               // y的小数部分 (0-1)

        // 计算淡入淡出曲线
        const u = this.fade(x);           // x的平滑值
        const v = this.fade(y);           // y的平滑值

        // 计算网格四个角的哈希值
        const a = this.p[X] + Y;          // 左下角
        const aa = this.p[a];             // 左下角的哈希值
        const ab = this.p[a + 1];         // 左上角的哈希值
        const b = this.p[X + 1] + Y;      // 右下角
        const ba = this.p[b];             // 右下角的哈希值
        const bb = this.p[b + 1];         // 右上角的哈希值

        // 对四个角的梯度进行双线性插值
        return this.lerp(v,
            this.lerp(u, this.grad(this.p[aa], x, y), this.grad(this.p[ba], x - 1, y)),        // 下边插值
            this.lerp(u, this.grad(this.p[ab], x, y - 1), this.grad(this.p[bb], x - 1, y - 1))  // 上边插值
        );
    }
}

// ========== Canvas 初始化 ==========
const canvas = document.getElementById('textCanvas');  // 获取Canvas元素
const ctx = canvas.getContext('2d');                   // 获取2D渲染上下文
const perlin = new PerlinNoise();                       // 创建Perlin噪声生成器实例
let time = 0;                                           // 时间变量，用于动画（随时间递增）

// 设置Canvas画布尺寸
canvas.width = 800;                                     // 画布宽度800像素
canvas.height = 600;                                    // 画布高度600像素

// ========== 文字内容和样式配置数组 ==========
// 每个对象定义一行文字的所有属性
const texts = [
    {
        text: 'SILENT HAZE',                           // 文字内容：标题
        x: 0,                                           // x坐标位置
        y: 50,                                          // y坐标位置
        size: 16,                                       // 字体大小（像素）
        weight: '300',                                  // 字重：300（细体）
        spacing: 5,                                     // 字间距（像素）
        noiseScale: 0.05                                // 噪声缩放比例（控制噪声"瓦片"大小）
    },
    {
        text: 'SUMMER',                                 // 文字内容：主标题1
        x: -10,
        y: 120,
        size: 96,                                       // 大字号：96像素
        weight: '700',                                  // 字重：700（粗体）
        spacing: 0,
        noiseScale: 0.02                                // 较小的噪声比例（更细腻的效果）
    },
    {
        text: 'BREEZE',                                 // 文字内容：主标题2
        x: 0,
        y: 240,
        size: 96,
        weight: '700',
        spacing: 0,
        noiseScale: 0.02
    },
    {
        text: '海辺の思い出',  // 文字内容：日文副标题
        x: 0,
        y: 360,
        size: 15,                                       // 小字号：15像素
        weight: '300',
        spacing: 2,
        noiseScale: 0.08                                // 较大的噪声比例（更明显的波动效果）
    }
];

// ========== 绘制带噪声效果的文字函数 ==========
/**
 * 在Canvas上绘制带有Perlin噪声效果的文字
 * 噪声效果使文字产生动态的"消散"或"波动"视觉效果
 */
function drawTextWithNoise() {
    // 清空整个画布，准备重新绘制
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 遍历所有文字对象，逐个绘制
    texts.forEach((textObj, index) => {
        // 设置主画布的字体样式（用于测量文字尺寸）
        ctx.font = `${textObj.weight} ${textObj.size}px Arial`;  // 设置字重和大小
        ctx.textBaseline = 'top';                                 // 文字基线对齐到顶部

        // 测量文字的实际渲染宽度
        const metrics = ctx.measureText(textObj.text);
        const textWidth = metrics.width;                          // 文字宽度（像素）
        const textHeight = textObj.size;                          // 文字高度（近似等于字号）

        // 创建临时画布，用于处理单个文字的像素数据
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d');
        tempCanvas.width = textWidth + 20;                        // 临时画布宽度（留出边距）
        tempCanvas.height = textHeight + 20;                      // 临时画布高度（留出边距）

        // 在临时画布上绘制白色文字
        tempCtx.font = ctx.font;                                  // 复制字体样式
        tempCtx.fillStyle = 'white';                              // 设置填充颜色为白色
        tempCtx.textBaseline = 'top';                             // 文字基线对齐到顶部
        tempCtx.fillText(textObj.text, 10, 10);                   // 绘制文字（偏移10px留边距）

        // 获取临时画布上的像素数据（RGBA格式）
        const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
        const data = imageData.data;                              // 像素数组：[R, G, B, A, R, G, B, A, ...]

        // 遍历临时画布的每个像素，应用噪声效果
        for (let y = 0; y < tempCanvas.height; y++) {
            for (let x = 0; x < tempCanvas.width; x++) {
                const index = (y * tempCanvas.width + x) * 4;    // 计算像素在数组中的索引（每个像素4个值）
                const alpha = data[index + 3];                    // 获取当前像素的Alpha通道值

                // 只处理不透明的像素（即文字区域）
                if (alpha > 0) {
                    // 计算Perlin噪声值
                    // noiseScale控制噪声的"频率"：值越小，噪声变化越平滑
                    const noiseX = x * textObj.noiseScale;        // x坐标缩放
                    const noiseY = y * textObj.noiseScale;        // y坐标缩放
                    const noise = perlin.noise(noiseX + time, noiseY + time * 0.5);  // 获取噪声值（-1到1），加入时间参数使其动画化
                    const normalizedNoise = (noise + 1) / 2;      // 归一化噪声值到0-1范围

                    // 根据噪声调整像素的颜色和透明度
                    // const intensity = index < 2 ? 30 : 50;     // 这行代码未使用（可以删除）
                    data[index] = 255;                            // R通道：白色
                    data[index + 1] = 255;                        // G通道：白色
                    data[index + 2] = 255;                        // B通道：白色
                    // Alpha通道：基于噪声值调整透明度
                    // 公式说明：(1 - normalizedNoise*0.4)^2 * alpha
                    // - normalizedNoise*0.4: 噪声影响强度为40%
                    // - (1 - ...)^2: 平方函数，使过渡更柔和
                    // - * alpha: 保留原始透明度信息
                    data[index + 3] = Math.pow((1 - normalizedNoise * 0.4), 2) * alpha;
                }
            }
        }

        // 将处理后的像素数据写回临时画布
        tempCtx.putImageData(imageData, 0, 0);
        // 将临时画布的内容绘制到主画布上
        ctx.drawImage(tempCanvas, textObj.x, textObj.y);

        // 绘制装饰线条（在第一个文字[index=0]和第三个文字[index=2]后）
        if (index === 0 || index === 2) {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';          // 半透明白色
            ctx.fillRect(textObj.x, textObj.y + textObj.size + 20, 120, 1);  // 绘制120px宽，1px高的线条
        }
    });

    // 为所有文字添加统一的阴影效果（增加深度感）
    ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';                      // 阴影颜色：30%不透明度的黑色
    ctx.shadowBlur = 8;                                           // 阴影模糊半径：8像素
    ctx.shadowOffsetX = 0;                                        // 阴影水平偏移：0像素（正下方）
    ctx.shadowOffsetY = 4;                                        // 阴影垂直偏移：4像素（向下）
}

// ========== 前景图片视差和3D效果相关变量初始化 ==========
const backgroundImg1 = document.querySelector('#background img');        // 右侧前景图片元素
const backgroundImg2 = document.querySelector('#background2 img');       // 左侧前景图片元素
const backgroundContainer1 = document.querySelector('#background');      // 右侧前景图片容器
const backgroundContainer2 = document.querySelector('#background2');     // 左侧前景图片容器

// ========== 视频相关变量初始化 ==========
const videoElement = document.querySelector('#mainVideo');               // 视频元素
const videoContainer = document.querySelector('#videoContainer');        // 视频容器
const rightMediaArea = document.querySelector('.right-media-area');      // 右侧媒体区域包装容器

let mouseX = window.innerWidth / 2;                                      // 鼠标当前x坐标（初始化为屏幕中心）
let mouseY = window.innerHeight / 2;                                     // 鼠标当前y坐标（初始化为屏幕中心）
let targetX1 = 0;                                                        // 右侧图片目标x偏移量（归一化值，-1到1）
let targetY1 = 0;                                                        // 右侧图片目标y偏移量（归一化值，-1到1）
let targetX2 = 0;                                                        // 左侧图片目标x偏移量（归一化值，-1到1）
let targetY2 = 0;                                                        // 左侧图片目标y偏移量（归一化值，-1到1）
let isHoveringImg1 = false;                                              // 是否悬停在右侧图片上
let isHoveringImg2 = false;                                              // 是否悬停在左侧图片上
let isHoveringVideo = false;                                             // 是否悬停在视频上
let targetXVideo = 0;                                                    // 视频目标x偏移量（归一化值，-1到1）
let targetYVideo = 0;                                                    // 视频目标y偏移量（归一化值，-1到1）
let isHoveringRightArea = false;                                         // 是否悬停在右侧媒体区域
let imageOpacity = 1;                                                    // 图片当前透明度
let videoOpacity = 0;                                                    // 视频当前透明度

// ========== 检测鼠标是否在前景图片区域内的函数 ==========
/**
 * 检测鼠标是否在指定的前景图片区域内
 * @param {number} mouseX - 鼠标x坐标
 * @param {number} mouseY - 鼠标y坐标
 * @param {HTMLElement} container - 图片容器元素
 * @param {HTMLElement} img - 图片元素
 * @return {boolean} - 是否在图片区域内
 */
function isMouseOverImage(mouseX, mouseY, container, img) {
    if (!container || !img) return false;

    const containerRect = container.getBoundingClientRect();
    const imgRect = img.getBoundingClientRect();

    // 检测鼠标是否在图片的实际显示区域内
    return mouseX >= imgRect.left &&
        mouseX <= imgRect.right &&
        mouseY >= imgRect.top &&
        mouseY <= imgRect.bottom;
}

// ========== 鼠标移动事件监听器 - 实现按区域的视差效果 ==========
/**
 * 监听鼠标移动，检测是否在前景图片区域内
 * 只对鼠标悬停的图片应用视差效果
 */
document.addEventListener('mousemove', (e) => {
    mouseX = e.clientX;                                                  // 更新鼠标x坐标
    mouseY = e.clientY;                                                  // 更新鼠标y坐标

    // 检测鼠标是否悬停在各个前景图片和视频上
    isHoveringImg1 = isMouseOverImage(mouseX, mouseY, backgroundContainer1, backgroundImg1);
    isHoveringImg2 = isMouseOverImage(mouseX, mouseY, backgroundContainer2, backgroundImg2);
    isHoveringVideo = isMouseOverImage(mouseX, mouseY, videoContainer, videoElement);

    // 检测鼠标是否悬停在右侧媒体区域（使用更精确的检测）
    isHoveringRightArea = isMouseOverImage(mouseX, mouseY, backgroundContainer1, backgroundImg1);

    // 计算鼠标相对于屏幕中心的归一化偏移量（-1到1之间）
    const centerX = window.innerWidth / 2;                               // 屏幕中心x坐标
    const centerY = window.innerHeight / 2;                              // 屏幕中心y坐标
    const offsetX = (mouseX - centerX) / centerX;                        // x方向偏移量：-1（最左）到1（最右）
    const offsetY = (mouseY - centerY) / centerY;                        // y方向偏移量：-1（最上）到1（最下）

    // 只为悬停的图片更新目标位置，未悬停的图片目标位置逐渐回到0
    if (isHoveringImg1) {
        targetX1 = offsetX;
        targetY1 = offsetY;
    } else {
        // 平滑回到原始位置
        targetX1 *= 0.95;
        targetY1 *= 0.95;
    }

    if (isHoveringImg2) {
        targetX2 = offsetX;
        targetY2 = offsetY;
    } else {
        // 平滑回到原始位置
        targetX2 *= 0.95;
        targetY2 *= 0.95;
    }

    // 视频视差效果
    if (isHoveringVideo) {
        targetXVideo = offsetX;
        targetYVideo = offsetY;
    } else {
        // 平滑回到原始位置
        targetXVideo *= 0.95;
        targetYVideo *= 0.95;
    }

    // 透明度切换逻辑
    if (isHoveringRightArea) {
        // 悬停在右侧区域时：图片淡出，视频淡入
        imageOpacity = Math.max(0, imageOpacity - 0.05);                     // 图片透明度递减（调整速度）
        videoOpacity = Math.min(1, videoOpacity + 0.05);                     // 视频透明度递增（调整速度）
    } else {
        // 不悬停时：图片淡入，视频淡出
        imageOpacity = Math.min(1, imageOpacity + 0.05);                     // 图片透明度递增（调整速度）
        videoOpacity = Math.max(0, videoOpacity - 0.05);                     // 视频透明度递减（调整速度）
    }
});

// ========== 平滑视差动画更新函数 ==========
/**
 * 根据鼠标位置更新前景图片的3D变换效果
 * 包括：位移、旋转、缩放、滤镜、阴影等
 * 每帧调用一次，实现平滑的视差效果
 * 现在只对悬停的图片应用变换效果
 */
function updateParallax() {
    // ---------- 视差参数配置 ----------
    const parallaxStrength1 = 25;       // 右侧图片视差移动强度（像素）
    const parallaxStrength2 = 30;       // 左侧图片视差移动强度（像素，略强于右侧）
    const tiltStrength = 4;             // 3D倾斜旋转强度（度数）
    const scaleBase = 1.02;             // 基础缩放比例（1.02 = 放大2%）

    // ---------- 计算右侧图片的变换值 ----------
    const moveX1 = targetX1 * parallaxStrength1;                         // x方向移动距离（像素）：鼠标右移图片右移
    const moveY1 = targetY1 * parallaxStrength1 * 0.7;                   // y方向移动距离（像素）：系数0.7使垂直移动较弱
    const tiltX1 = targetY1 * tiltStrength;                              // 绕x轴旋转角度（度）：鼠标下移图片向后倾
    const tiltY1 = -targetX1 * tiltStrength;                             // 绕y轴旋转角度（度）：鼠标右移图片向左转（负值）
    const scale1 = scaleBase + Math.abs(targetX1 * 0.03) + Math.abs(targetY1 * 0.02);  // 动态缩放：鼠标远离中心时放大

    // ---------- 计算左侧图片的变换值 ----------
    const moveX2 = -targetX2 * parallaxStrength2;                        // x方向移动距离（像素）：与右侧相反（负值）
    const moveY2 = targetY2 * parallaxStrength2 * 0.8;                   // y方向移动距离（像素）：系数0.8
    const tiltX2 = -targetY2 * tiltStrength;                             // 绕x轴旋转角度（度）：与右侧相反
    const tiltY2 = targetX2 * tiltStrength;                              // 绕y轴旋转角度（度）：与右侧相反
    const scale2 = scaleBase + Math.abs(targetX2 * 0.025) + Math.abs(targetY2 * 0.025);  // 动态缩放：系数略小于右侧

    // 应用3D变换到右侧图片
    if (backgroundImg1) {
        backgroundImg1.style.transform =
            `perspective(1200px) ` +
            `translateX(${moveX1}px) translateY(${moveY1}px) ` +
            `rotateX(${tiltX1}deg) rotateY(${tiltY1}deg) ` +
            `scale(${scale1}) ` +
            `translateZ(20px)`;

        // 动态调整滤镜
        const filterBrightness = 1.03 + Math.abs(targetX1 * 0.05);
        const filterContrast = 1.02 + Math.abs(targetY1 * 0.08);
        const filterSaturate = 1 + Math.abs(targetX1 * 0.1);
        // 计算动态边缘光强度
        const glowIntensity = 0.6 + Math.abs(targetX1 * 0.2) + Math.abs(targetY1 * 0.2);
        const glowBlue = 0.4 + Math.abs(targetX1 * 0.15);
        backgroundImg1.style.filter =
            `contrast(${filterContrast}) brightness(${filterBrightness }) saturate(${filterSaturate}) drop-shadow(0 0 20px rgba(255, 255, 255, ${glowIntensity})) drop-shadow(0 0 70px rgba(102, 242, 255, ${glowBlue }))`;

        // 应用透明度
        backgroundImg1.style.opacity = imageOpacity;


    }

    // 应用3D变换到左侧图片
    if (backgroundImg2) {
        backgroundImg2.style.transform =
            `perspective(1200px) ` +
            `translateX(${moveX2}px) translateY(${moveY2}px) ` +
            `rotateX(${tiltX2}deg) rotateY(${tiltY2}deg) ` +
            `scale(${scale2}) ` +
            `translateZ(15px)`;

        // 动态调整滤镜
        const filterBrightness = 1.03 + Math.abs(targetY2 * 0.06);
        const filterContrast = 1.02 + Math.abs(targetX2 * 0.07);
        const filterSaturate = 1 + Math.abs(targetY2 * 0.08);
        backgroundImg2.style.filter =
            `contrast(${filterContrast}) brightness(${filterBrightness}) saturate(${filterSaturate})`;
    }

    // ---------- 计算视频的变换值 ----------
    const moveXVideo = targetXVideo * parallaxStrength1;                      // x方向移动距离（像素）：与右侧图片相同强度
    const moveYVideo = targetYVideo * parallaxStrength1 * 0.7;                // y方向移动距离（像素）：系数0.7
    const tiltXVideo = targetYVideo * tiltStrength;                           // 绕x轴旋转角度（度）
    const tiltYVideo = -targetXVideo * tiltStrength;                          // 绕y轴旋转角度（度）
    const scaleVideo = scaleBase + Math.abs(targetXVideo * 0.03) + Math.abs(targetYVideo * 0.02);  // 动态缩放

    // 应用3D变换到视频
    if (videoElement) {
        videoElement.style.transform =
            `perspective(1200px) ` +
            `translateX(${moveXVideo}px) translateY(${moveYVideo}px) ` +
            `rotateX(${tiltXVideo}deg) rotateY(${tiltYVideo}deg) ` +
            `scale(${scaleVideo}) ` +
            `translateZ(25px)`;

        // 动态调整滤镜
        const filterBrightness = 1.03 + Math.abs(targetXVideo * 0.05);
        const filterContrast = 1.02 + Math.abs(targetYVideo * 0.08);
        const filterSaturate = 1 + Math.abs(targetXVideo * 0.1);
        // 计算动态边缘光强度
        const glowIntensity = 0.6 + Math.abs(targetXVideo * 0.2) + Math.abs(targetYVideo * 0.2);
        const glowBlue = 0.4 + Math.abs(targetXVideo * 0.15);
        videoElement.style.filter =
            `contrast(${filterContrast}) brightness(${filterBrightness}) saturate(${filterSaturate}) drop-shadow(0 0 20px rgba(255, 255, 255, ${glowIntensity})) drop-shadow(0 0 70px rgba(102, 242, 255, ${glowBlue}))`;

        // 应用透明度
        videoElement.style.opacity = videoOpacity;

        // 确保视频容器的指针事件根据透明度调整
        if (videoOpacity > 0.1) {
            videoContainer.style.pointerEvents = 'auto';
        } else {
            videoContainer.style.pointerEvents = 'none';
        }
    }

    // 更新深度阴影
    if (backgroundContainer1) {
        const shadowIntensity1 = 0.6 + Math.abs(targetX1 * 0.2) + Math.abs(targetY1 * 0.15);
        backgroundContainer1.style.setProperty('--shadow-opacity', shadowIntensity1);
    }

    if (backgroundContainer2) {
        const shadowIntensity2 = 0.7 + Math.abs(targetX2 * 0.25) + Math.abs(targetY2 * 0.2);
        backgroundContainer2.style.setProperty('--shadow-opacity', shadowIntensity2);
    }

    if (videoContainer) {
        const shadowIntensityVideo = 0.6 + Math.abs(targetXVideo * 0.2) + Math.abs(targetYVideo * 0.15);
        videoContainer.style.setProperty('--shadow-opacity', shadowIntensityVideo);
    }
}

// ========== 右侧媒体区域悬停检测 ==========
/**
 * 为右侧媒体区域添加专门的悬停事件监听器
 */
if (rightMediaArea) {
    rightMediaArea.addEventListener('mouseenter', () => {
        isHoveringRightArea = true;
    });

    rightMediaArea.addEventListener('mouseleave', () => {
        isHoveringRightArea = false;
    });
}

// ========== 视频交互控制 ==========
/**
 * 视频点击播放/暂停功能
 */
if (videoElement) {
    // 预加载视频
    videoElement.load();

    videoElement.addEventListener('click', () => {
        if (videoElement.paused) {
            videoElement.play().catch(e => {
                console.log('视频播放失败:', e);
            });
        } else {
            videoElement.pause();
        }
    });

    // 视频可以播放时自动播放
    videoElement.addEventListener('canplay', () => {
        // 延迟自动播放，确保页面加载完成
        setTimeout(() => {
            videoElement.play().catch(e => {
                console.log('自动播放失败，可能需要用户交互:', e);
                // 如果自动播放失败，设置视频为静音并重试
                videoElement.muted = true;
                videoElement.play().catch(e2 => {
                    console.log('静音播放也失败:', e2);
                });
            });
        }, 1000);
    });

    // 视频加载完成后的处理
    videoElement.addEventListener('loadeddata', () => {
        console.log('视频数据加载完成');
        // 确保视频容器可见
        if (videoContainer) {
            videoContainer.style.display = 'flex';
        }
    });

    // 视频悬停时启用鼠标事件
    videoElement.addEventListener('mouseenter', () => {
        videoContainer.style.pointerEvents = 'auto';
    });

    videoElement.addEventListener('mouseleave', () => {
        videoContainer.style.pointerEvents = 'none';
    });

    // 视频错误处理
    videoElement.addEventListener('error', (e) => {
        console.error('视频加载错误:', e);
        console.error('视频错误详情:', videoElement.error);
    });
}

// ========== 鼠标悬停交互 - Canvas文字区域 ==========
let isHovering = false;                                                   // 标记是否悬停在标题上
canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();                         // 获取Canvas相对于视口的位置
    const x = e.clientX - rect.left;                                     // 计算鼠标相对于Canvas的x坐标
    const y = e.clientY - rect.top;                                      // 计算鼠标相对于Canvas的y坐标

    // 检测是否悬停在主标题"SUMMER"或"BREEZE"上（y: 180-300, x: 0-600）
    isHovering = (y > 180 && y < 300 && x < 600);
    canvas.style.cursor = isHovering ? 'pointer' : 'default';            // 悬停时显示手型光标，否则默认光标
});

// ========== 滚动视差效果 ==========
let scrollY = 0;                                                          // 当前滚动位置
let ticking = false;                                                      // 防抖标志，避免频繁触发

/**
 * 更新滚动视差效果
 * 根据页面滚动位置调整前景图片的垂直位置
 */
function updateScrollParallax() {
    const scrollFactor1 = scrollY * 0.3;                                 // 右侧图片滚动系数：0.3（向下移动）
    const scrollFactor2 = scrollY * 0.4;                                 // 左侧图片滚动系数：0.4（向上移动，注意负号）

    if (backgroundContainer1) {
        backgroundContainer1.style.transform = `translateY(${scrollFactor1}px)`;  // 右侧图片随滚动向下移动
    }

    if (backgroundContainer2) {
        backgroundContainer2.style.transform = `translateY(${-scrollFactor2}px)`; // 左侧图片随滚动向上移动（创建对比效果）
    }

    if (videoContainer) {
        videoContainer.style.transform = `translateY(${scrollFactor1}px)`; // 视频随滚动向下移动（与右侧图片相同）
    }
}

// 监听滚动事件，使用requestAnimationFrame优化性能
window.addEventListener('scroll', () => {
    scrollY = window.pageYOffset;                                        // 更新滚动位置（兼容旧浏览器）

    if (!ticking) {                                                      // 如果没有待处理的动画帧
        requestAnimationFrame(() => {                                    // 在下一帧更新视差效果
            updateScrollParallax();
            ticking = false;                                             // 重置标志
        });
        ticking = true;                                                  // 设置标志，防止重复调用
    }
});

// ========== 主动画循环 ==========
/**
 * 主动画循环函数
 * 每帧更新：文字噪声动画 + 视差效果
 * 使用requestAnimationFrame实现流畅的60fps动画
 */
function animate() {
    time += 0.005;                                                        // 递增时间变量，控制噪声动画速度（0.005 = 缓慢变化）
    drawTextWithNoise();                                                  // 重绘带噪声效果的文字
    updateParallax();                                                     // 更新前景图片的视差效果
    //();                                                       // 绘制热浪扭曲效果
    drawRain();                                                           // 绘制雨滴粒子效果
    drawLensFlare();                                                      // 绘制镜头光晕效果
    requestAnimationFrame(animate);                                       // 请求下一帧动画（递归调用）
}

// ========== 雨滴粒子特效 ==========
/**
 * 右侧雨滴粒子效果实现
 * 创建自然的雨滴下落动画，包含不同速度和大小的雨滴
 */
const rainCanvas = document.getElementById('rainCanvas');
const rainCtx = rainCanvas.getContext('2d', {
    alpha: true,
    desynchronized: true  // 性能优化
});

// 设置Canvas尺寸
function resizeRainCanvas() {
    rainCanvas.width = window.innerWidth / 2;
    rainCanvas.height = window.innerHeight;
}
resizeRainCanvas();

// 雨滴类
class Raindrop {
    constructor() {
        this.reset();
    }

    reset() {
        // 随机x位置
        this.x = Math.random() * rainCanvas.width;
        // 从顶部上方开始
        this.y = -Math.random() * rainCanvas.height;
        // 雨滴长度：15-30像素
        this.length = 15 + Math.random() * 15;
        // 下落速度：根据长度决定（长的雨滴下落更快）
        this.speed = 8 + (this.length / 30) * 12;
        // 雨滴宽度：1-2像素
        this.width = 1 + Math.random();
        // 透明度：0.3-0.7
        this.opacity = 0.3 + Math.random() * 0.4;
    }

    update() {
        // 向下移动
        this.y += this.speed;

        // 如果超出底部，重置到顶部
        if (this.y > rainCanvas.height) {
            this.reset();
        }
    }

    draw(ctx) {
        ctx.save();

        // 设置雨滴样式
        ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`; // 浅蓝灰色
        ctx.lineWidth = this.width;
        ctx.lineCap = 'round';

        // 绘制雨滴线条
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(this.x, this.y + this.length);
        ctx.stroke();

        ctx.restore();
    }
}

// 创建雨滴数组
const raindrops = [];
const raindropCount = 150;  // 雨滴数量（可调整密度）

for (let i = 0; i < raindropCount; i++) {
    raindrops.push(new Raindrop());
}

// 地面水花/涟漪效果
class Splash {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = 0;
        this.maxRadius = 3 + Math.random() * 4;
        this.opacity = 0.6;
        this.growing = true;
    }

    update() {
        if (this.growing) {
            this.radius += 0.5;
            this.opacity -= 0.05;

            if (this.radius >= this.maxRadius) {
                this.growing = false;
            }
        }

        return this.opacity > 0;
    }

    draw(ctx) {
        ctx.save();

        ctx.strokeStyle = `rgba(174, 194, 224, ${this.opacity})`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.stroke();

        ctx.restore();
    }
}

// 水花数组
const splashes = [];

/**
 * 绘制雨滴效果
 */
function drawRain() {
    // 清空画布
    rainCtx.clearRect(0, 0, rainCanvas.width, rainCanvas.height);

    // 更新和绘制雨滴
    raindrops.forEach(drop => {
        drop.update();
        drop.draw(rainCtx);

        // 随机生成水花（降低频率以提高性能）
        if (drop.y >= rainCanvas.height - 5 && Math.random() < 0.1) {
            splashes.push(new Splash(drop.x, rainCanvas.height));
        }
    });

    // 更新和绘制水花
    for (let i = splashes.length - 1; i >= 0; i--) {
        const splash = splashes[i];

        if (!splash.update()) {
            splashes.splice(i, 1);
        } else {
            splash.draw(rainCtx);
        }
    }
}

// 窗口调整时更新Canvas尺寸
window.addEventListener('resize', () => {
    resizeRainCanvas();
});

// ========== 太阳镜头光晕特效 (Lens Flare) ==========
/**
 * 左侧太阳镜头光晕效果实现
 * 创建专业的lens flare效果，包含主光源、光圈、六边形光斑等
 */
const lensFlareCanvas = document.getElementById('lensFlareCanvas');
const flareCtx = lensFlareCanvas.getContext('2d', {
    alpha: true,
    desynchronized: true  // 性能优化
});

// 设置Canvas尺寸
function resizeFlareCanvas() {
    lensFlareCanvas.width = window.innerWidth / 2;
    lensFlareCanvas.height = window.innerHeight;
}
resizeFlareCanvas();

// 太阳位置（左上角）
const sunPosition = {
    x: lensFlareCanvas.width * 0.15,     // 左上角15%位置
    y: lensFlareCanvas.height * 0.15,    // 顶部15%位置
    time: 0
};

// Lens Flare元素配置
const flareElements = [
    // 主光源（最亮的核心）
    {
        type: 'core',
        position: 0,           // 在太阳位置
        size: 60,
        color: { r: 255, g: 250, b: 220 },
        opacity: 0.9,
        pulseSpeed: 0.4,       // 呼吸速度
        pulseAmount: 0.05,     // 呼吸幅度（减小）
        depthSpeed: 0.3,       // 前后移动速度
        depthAmount: 0.03,     // 前后移动幅度（减小）
        timeOffset: 0          // 时间偏移
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
    // 六边形光斑1（更靠近太阳）
    {
        type: 'hexagon',
        position: 0.15,        // 从0.3改为0.15
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
    // 圆形光圈1（更靠近太阳）
    {
        type: 'ring',
        position: 0.25,        // 从0.5改为0.25
        size: 80,
        color: { r: 255, g: 200, b: 150 },
        opacity: 0.25,
        pulseSpeed: 0.55,
        pulseAmount: 0.07,
        depthSpeed: 0.45,
        depthAmount: 0.04,
        timeOffset: 3.5
    },
    // 六边形光斑2（更靠近太阳）
    {
        type: 'hexagon',
        position: 0.38,        // 从0.65改为0.38
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
    // 圆形光圈2（更靠近太阳）
    {
        type: 'ring',
        position: 0.5,         // 从0.8改为0.5
        size: 100,
        color: { r: 255, g: 180, b: 200 },
        opacity: 0.2,
        pulseSpeed: 0.45,
        pulseAmount: 0.06,
        depthSpeed: 0.35,
        depthAmount: 0.04,
        timeOffset: 4.2
    },
    // 小光斑（更靠近太阳）
    {
        type: 'circle',
        position: 0.6,         // 从0.9改为0.6
        size: 30,
        color: { r: 200, g: 255, b: 200 },
        opacity: 0.3,
        pulseSpeed: 0.9,
        pulseAmount: 0.1,
        depthSpeed: 0.7,
        depthAmount: 0.05,
        timeOffset: 2.7
    }
];

/**
 * 绘制径向渐变光晕
 */
function drawGlow(ctx, x, y, size, color, opacity) {
    ctx.save();

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
    gradient.addColorStop(0.3, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.5})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * 绘制六边形光斑
 */
function drawHexagon(ctx, x, y, size, color, opacity, rotation) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(rotation);

    // 创建径向渐变
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, size);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
    gradient.addColorStop(0.7, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity * 0.3})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;

    // 绘制六边形
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i;
        const px = Math.cos(angle) * size;
        const py = Math.sin(angle) * size;
        if (i === 0) {
            ctx.moveTo(px, py);
        } else {
            ctx.lineTo(px, py);
        }
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
}

/**
 * 绘制圆形光圈
 */
function drawRing(ctx, x, y, size, color, opacity) {
    ctx.save();

    // 外圈
    const gradient1 = ctx.createRadialGradient(x, y, size * 0.7, x, y, size);
    gradient1.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);
    gradient1.addColorStop(0.5, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
    gradient1.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient1;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * 绘制圆形光斑
 */
function drawCircle(ctx, x, y, size, color, opacity) {
    ctx.save();

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
    gradient.addColorStop(0, `rgba(${color.r}, ${color.g}, ${color.b}, ${opacity})`);
    gradient.addColorStop(1, `rgba(${color.r}, ${color.g}, ${color.b}, 0)`);

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
}

/**
 * 绘制光线条纹（模拟光的衍射）
 */
function drawLightStreaks(ctx) {
    const streakCount = 8;
    const streakLength = 300;

    ctx.save();
    ctx.translate(sunPosition.x, sunPosition.y);

    for (let i = 0; i < streakCount; i++) {
        const angle = (Math.PI * 2 / streakCount) * i + sunPosition.time * 0.1;

        ctx.save();
        ctx.rotate(angle);

        // 创建线性渐变
        const gradient = ctx.createLinearGradient(0, 0, streakLength, 0);
        gradient.addColorStop(0, 'rgba(255, 250, 220, 0.15)');
        gradient.addColorStop(0.5, 'rgba(255, 250, 220, 0.05)');
        gradient.addColorStop(1, 'rgba(255, 250, 220, 0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, -2, streakLength, 4);

        ctx.restore();
    }

    ctx.restore();
}

/**
 * 主绘制函数
 */
function drawLensFlare() {
    // 清空画布
    flareCtx.clearRect(0, 0, lensFlareCanvas.width, lensFlareCanvas.height);

    // 计算中心点（用于光斑分布）
    const centerX = lensFlareCanvas.width / 2;
    const centerY = lensFlareCanvas.height / 2;

    // 绘制光线条纹
    //drawLightStreaks(flareCtx);

    // 绘制所有lens flare元素
    flareElements.forEach(element => {
        // 每个元素有独立的动画时间
        const elementTime = sunPosition.time + element.timeOffset;

        // 独立的呼吸动画（大小缩放）
        const pulse = Math.sin(elementTime * element.pulseSpeed) * element.pulseAmount + 1;
        const animatedSize = element.size * pulse;

        // 独立的透明度动画
        const opacityPulse = Math.sin(elementTime * element.pulseSpeed * 0.7) * 0.15 + 1;
        const animatedOpacity = element.opacity * opacityPulse;

        // 前后移动效果（通过改变位置来模拟景深）
        const depthOffset = Math.sin(elementTime * element.depthSpeed) * element.depthAmount;

        // 计算当前元素位置（从太阳位置到屏幕中心的连线上）
        // 添加景深偏移，使光斑看起来在前后移动
        const t = element.position + depthOffset;
        const x = sunPosition.x + (centerX - sunPosition.x) * t;
        const y = sunPosition.y + (centerY - sunPosition.y) * t;

        // 根据类型绘制不同的元素
        switch (element.type) {
            case 'core':
            case 'glow':
                drawGlow(flareCtx, x, y, animatedSize, element.color, animatedOpacity);
                break;
            case 'hexagon':
                // 六边形也有独立的旋转速度
                const rotationSpeed = 0.03 + (element.timeOffset % 1) * 0.04;
                const rotation = element.rotation + elementTime * rotationSpeed;
                drawHexagon(flareCtx, x, y, animatedSize, element.color, animatedOpacity, rotation);
                break;
            case 'ring':
                drawRing(flareCtx, x, y, animatedSize, element.color, animatedOpacity);
                break;
            case 'circle':
                drawCircle(flareCtx, x, y, animatedSize, element.color, animatedOpacity);
                break;
        }
    });

    // 更新时间
    sunPosition.time += 0.02;
}

// 窗口调整时更新Canvas尺寸
window.addEventListener('resize', () => {
    resizeFlareCanvas();
    // 更新太阳位置
    sunPosition.x = lensFlareCanvas.width * 0.15;
    sunPosition.y = lensFlareCanvas.height * 0.15;
});

// ========== 热浪扭曲特效 ==========
/**
 * 热浪扭曲效果实现
 * 使用Canvas创建垂直波动的扭曲效果，模拟夏日热浪
 */
const heatWaveCanvas = document.getElementById('heatWaveCanvas');
const heatCtx = heatWaveCanvas.getContext('2d');

// 设置Canvas尺寸为左侧区域的大小
heatWaveCanvas.width = window.innerWidth / 2;
heatWaveCanvas.height = window.innerHeight;

// 热浪参数
let heatWaveTime = 0;                                                 // 热浪动画时间变量
const heatWaveLines = [];                                             // 存储热浪线条
const numHeatWaves = 15;                                              // 热浪线条数量

// 初始化热浪线条
for (let i = 0; i < numHeatWaves; i++) {
    heatWaveLines.push({
        x: Math.random() * heatWaveCanvas.width,                      // 随机x位置
        baseY: Math.random() * heatWaveCanvas.height,                 // 基准y位置
        amplitude: 30 + Math.random() * 50,                           // 波动幅度：30-80px
        frequency: 0.002 + Math.random() * 0.003,                     // 波动频率
        speed: 0.5 + Math.random() * 1.5,                             // 上升速度
        width: 2 + Math.random() * 4,                                 // 线条宽度
        opacity: 0.1 + Math.random() * 0.2,                           // 透明度
        phase: Math.random() * Math.PI * 2                            // 初始相位
    });
}

/**
 * 绘制热浪效果
 */
function drawHeatWave() {
    // 清空画布
    heatCtx.clearRect(0, 0, heatWaveCanvas.width, heatWaveCanvas.height);

    // 绘制每条热浪线
    heatWaveLines.forEach((wave, index) => {
        heatCtx.save();

        // 设置线条样式
        heatCtx.strokeStyle = `rgba(255, 255, 255, ${wave.opacity})`;
        heatCtx.lineWidth = wave.width;
        heatCtx.lineCap = 'round';

        // 绘制扭曲的垂直线条
        heatCtx.beginPath();

        for (let y = 0; y < heatWaveCanvas.height; y += 5) {
            // 计算x位置的扭曲偏移
            const offset = Math.sin((y * wave.frequency) + (heatWaveTime * 0.02) + wave.phase) * wave.amplitude;
            const xPos = wave.x + offset;

            if (y === 0) {
                heatCtx.moveTo(xPos, y);
            } else {
                heatCtx.lineTo(xPos, y);
            }
        }

        heatCtx.stroke();
        heatCtx.restore();

        // 更新热浪位置（向上移动）
        wave.baseY -= wave.speed;

        // 如果移出屏幕顶部，重置到底部
        if (wave.baseY < -100) {
            wave.baseY = heatWaveCanvas.height + 100;
            wave.x = Math.random() * heatWaveCanvas.width;
        }
    });

    // 增加时间变量
    heatWaveTime += 1;
}

// 窗口大小调整时更新Canvas尺寸
window.addEventListener('resize', () => {
    heatWaveCanvas.width = window.innerWidth / 2;
    heatWaveCanvas.height = window.innerHeight;
});

// 启动动画循环
animate();

// ========== 窗口大小调整事件监听器 ==========
let resizeTimeout;                                                        // 防抖定时器
window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);                                         // 清除之前的定时器
    resizeTimeout = setTimeout(() => {                                   // 延迟150毫秒执行，避免频繁触发
        // 重新计算屏幕中心点，重置鼠标位置
        mouseX = window.innerWidth / 2;                                  // 重置为新的屏幕中心x
        mouseY = window.innerHeight / 2;                                 // 重置为新的屏幕中心y
        targetX1 = 0;                                                    // 重置右侧图片目标x偏移量
        targetY1 = 0;                                                    // 重置右侧图片目标y偏移量
        targetX2 = 0;                                                    // 重置左侧图片目标x偏移量
        targetY2 = 0;                                                    // 重置左侧图片目标y偏移量
        isHoveringImg1 = false;                                          // 重置右侧图片悬停状态
        isHoveringImg2 = false;                                          // 重置左侧图片悬停状态
        isHoveringVideo = false;                                         // 重置视频悬停状态
        targetXVideo = 0;                                                // 重置视频目标x偏移量
        targetYVideo = 0;                                                // 重置视频目标y偏移量
        isHoveringRightArea = false;                                     // 重置右侧区域悬停状态
        imageOpacity = 1;                                                // 重置图片透明度为1
        videoOpacity = 0;                                                // 重置视频透明度为0

        // 重置前景图片的变换和滤镜效果
        if (backgroundImg1) {
            backgroundImg1.style.transform = '';                         // 清除右侧图片的变换
            // 重置右侧图片的滤镜：对比度1.02，亮度1.03，添加白色和蓝色投影
            backgroundImg1.style.filter = 'contrast(1.02) brightness(1.03) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(135, 206, 250, 0.4))';
            backgroundImg1.style.opacity = '1';                          // 重置图片透明度为1
        }
        if (backgroundImg2) {
            backgroundImg2.style.transform = '';                         // 清除左侧图片的变换
            backgroundImg2.style.filter = '';                            // 清除左侧图片的滤镜
        }
        if (videoElement) {
            videoElement.style.transform = '';                           // 清除视频的变换
            // 重置视频的滤镜：对比度1.02，亮度1.03，添加白色和蓝色投影
            videoElement.style.filter = 'contrast(1.02) brightness(1.03) drop-shadow(0 0 20px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 40px rgba(135, 206, 250, 0.4))';
            videoElement.style.opacity = '0';                            // 重置视频透明度为0
        }

        // 可以在这里添加其他响应式逻辑（如重新计算Canvas尺寸等）
    }, 150);                                                             // 延迟150毫秒执行
});

// ========== 页面可见性API优化 ==========
/**
 * 当用户切换到其他标签页时暂停动画，节省资源
 * 当用户回到此标签页时恢复动画
 */
document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
        // 页面隐藏时暂停动画（注意：cancelAnimationFrame需要动画ID，这里实际无法暂停）
        // 正确的做法是在animate函数中检查document.hidden状态
        cancelAnimationFrame(animate);                                   // 尝试取消动画帧（此处逻辑有误，但保留原代码）
    } else {
        // 页面恢复显示时重新启动动画循环
        animate();
    }
});

// ========== 页面加载完成事件监听器 ==========
/**
 * 等待所有资源（特别是图片）加载完成后初始化视差效果
 * 新的加载顺序：1.模糊背景 2.前景图片 3.标题和特效
 * 延长50%的动画时间，约3秒内完成所有动画
 */
window.addEventListener('load', () => {
    updateParallax();                                                     // 初始化视差效果（确保正确的初始状态）

    // 第一阶段：显示模糊背景图片
    setTimeout(() => {
        // 先显示左侧模糊背景
        const leftBlurBg = document.querySelector('.left-blur-bg');
        if (leftBlurBg) {
            leftBlurBg.classList.add('bg-loaded');                       // 添加bg-loaded类，触发模糊背景渐入动画
        }
    }, 75);                                                              // 延迟75毫秒

    setTimeout(() => {
        // 再显示右侧模糊背景
        const rightBlurBg = document.querySelector('.right-blur-bg');
        if (rightBlurBg) {
            rightBlurBg.classList.add('bg-loaded');                      // 添加bg-loaded类，触发模糊背景渐入动画
        }
    }, 225);                                                             // 延迟225毫秒

    // 第二阶段：显示前景图片（与模糊背景更紧密连接）
    setTimeout(() => {
        // 显示右侧前景图片
        const background1 = document.querySelector('#background');
        if (background1) {
            background1.classList.add('foreground-loaded');              // 添加foreground-loaded类，触发前景图片渐入动画
        }
    }, 600);                                                             // 延迟600毫秒（延长50%）

    setTimeout(() => {
        // 显示左侧前景图片
        const background2 = document.querySelector('#background2');
        if (background2) {
            background2.classList.add('foreground-loaded');              // 添加foreground-loaded类，触发前景图片渐入动画
        }
    }, 900);                                                             // 延迟900毫秒（延长50%）

    setTimeout(() => {
        // 显示视频容器
        const videoContainer = document.querySelector('#videoContainer');
        if (videoContainer) {
            videoContainer.classList.add('video-loaded');                // 添加video-loaded类，触发视频渐入动画
            // 确保视频开始加载
            const video = videoContainer.querySelector('video');
            if (video) {
                video.load(); // 重新加载视频
            }
        }
    }, 1200);                                                            // 延迟1200毫秒

    // 第三阶段：显示标题和特效（与前景图片更紧密连接）
    setTimeout(() => {
        // 显示标题内容
        const container = document.querySelector('.container');
        if (container) {
            container.classList.add('content-loaded');                   // 添加content-loaded类，触发内容渐入动画
        }
    }, 1500);                                                            // 延迟1500毫秒（延长50%）

    setTimeout(() => {
        // 显示热浪特效
        const heatWaveCanvas = document.querySelector('#heatWaveCanvas');
        if (heatWaveCanvas) {
            heatWaveCanvas.classList.add('effect-loaded');               // 添加effect-loaded类，触发特效渐入动画
        }
    }, 1800);                                                            // 延迟1800毫秒（延长50%）

    setTimeout(() => {
        // 显示雨滴特效
        const rainCanvas = document.querySelector('#rainCanvas');
        if (rainCanvas) {
            rainCanvas.classList.add('effect-loaded');                   // 添加effect-loaded类，触发特效渐入动画
        }
    }, 1950);                                                            // 延迟1950毫秒（延长50%）

    setTimeout(() => {
        // 显示太阳光晕特效
        const lensFlareCanvas = document.querySelector('#lensFlareCanvas');
        if (lensFlareCanvas) {
            lensFlareCanvas.classList.add('effect-loaded');               // 添加effect-loaded类，触发特效渐入动画
        }
    }, 2100);                                                            // 延迟2100毫秒（延长50%）
});

// ========== 页面DOM加载完成时立即显示背景 ==========
/**
 * 当DOM加载完成时（不等待图片等资源），立即显示背景
 * 这样用户可以立即看到背景，避免白屏
 * 新的加载顺序：1.模糊背景 2.前景图片 3.标题和特效
 */
document.addEventListener('DOMContentLoaded', () => {
    // 背景立即显示，无需等待
    document.body.style.opacity = '1';

    // 检查图片加载状态，如果已缓存则提前开始分阶段显示
    const images = document.querySelectorAll('img');
    let loadedImages = 0;
    const totalImages = images.length;

    if (totalImages === 0) {
        // 没有图片时，使用较快的时间节点，但保持新的加载顺序
        // 第一阶段：模糊背景
        setTimeout(() => {
            const leftBlurBg = document.querySelector('.left-blur-bg');
            const rightBlurBg = document.querySelector('.right-blur-bg');
            if (leftBlurBg) leftBlurBg.classList.add('bg-loaded');
            if (rightBlurBg) rightBlurBg.classList.add('bg-loaded');
        }, 100);

        // 第二阶段：前景图片
        setTimeout(() => {
            const background1 = document.querySelector('#background');
            const background2 = document.querySelector('#background2');
            const videoContainer = document.querySelector('#videoContainer');
            if (background1) background1.classList.add('foreground-loaded');
            if (background2) background2.classList.add('foreground-loaded');
            if (videoContainer) videoContainer.classList.add('video-loaded');
        }, 300);

        // 第三阶段：标题和特效
        setTimeout(() => {
            const container = document.querySelector('.container');
            if (container) container.classList.add('content-loaded');
        }, 200);

        setTimeout(() => {
            const heatWaveCanvas = document.querySelector('#heatWaveCanvas');
            if (heatWaveCanvas) heatWaveCanvas.classList.add('effect-loaded');
        }, 250);

        setTimeout(() => {
            const rainCanvas = document.querySelector('#rainCanvas');
            if (rainCanvas) rainCanvas.classList.add('effect-loaded');
        }, 280);

        setTimeout(() => {
            const lensFlareCanvas = document.querySelector('#lensFlareCanvas');
            if (lensFlareCanvas) lensFlareCanvas.classList.add('effect-loaded');
        }, 300);
    } else {
        // 检查图片加载状态
        images.forEach(img => {
            if (img.complete) {
                loadedImages++;
            } else {
                img.addEventListener('load', () => {
                    loadedImages++;
                    // 当图片加载完成时，不在这里触发显示，让window.load事件处理
                });
            }
        });

        // 如果所有图片都已加载（缓存），使用较快的时间节点，但保持新的加载顺序
        if (loadedImages === totalImages) {
            // 第一阶段：模糊背景
            setTimeout(() => {
                const leftBlurBg = document.querySelector('.left-blur-bg');
                if (leftBlurBg) {
                    leftBlurBg.classList.add('bg-loaded');
                }
            }, 50);

            setTimeout(() => {
                const rightBlurBg = document.querySelector('.right-blur-bg');
                if (rightBlurBg) {
                    rightBlurBg.classList.add('bg-loaded');
                }
            }, 150);

            // 第二阶段：前景图片（更紧密连接）
            setTimeout(() => {
                const background1 = document.querySelector('#background');
                if (background1) {
                    background1.classList.add('foreground-loaded');
                }
            }, 200);                                                     // 缩短间隔

            setTimeout(() => {
                const background2 = document.querySelector('#background2');
                if (background2) {
                    background2.classList.add('foreground-loaded');
                }
            }, 280);                                                     // 缩短间隔

            setTimeout(() => {
                const videoContainer = document.querySelector('#videoContainer');
                if (videoContainer) {
                    videoContainer.classList.add('video-loaded');
                    // 确保视频开始加载
                    const video = videoContainer.querySelector('video');
                    if (video) {
                        video.load(); // 重新加载视频
                    }
                }
            }, 360);                                                     // 缩短间隔

            // 第三阶段：标题和特效（更紧密连接）
            setTimeout(() => {
                const container = document.querySelector('.container');
                if (container) {
                    container.classList.add('content-loaded');
                }
            }, 420);                                                     // 缩短间隔

            setTimeout(() => {
                const heatWaveCanvas = document.querySelector('#heatWaveCanvas');
                if (heatWaveCanvas) heatWaveCanvas.classList.add('effect-loaded');
            }, 480);                                                     // 缩短间隔

            setTimeout(() => {
                const rainCanvas = document.querySelector('#rainCanvas');
                if (rainCanvas) rainCanvas.classList.add('effect-loaded');
            }, 520);                                                     // 缩短间隔

            setTimeout(() => {
                const lensFlareCanvas = document.querySelector('#lensFlareCanvas');
                if (lensFlareCanvas) lensFlareCanvas.classList.add('effect-loaded');
            }, 560);                                                     // 缩短间隔
        }
    }
});

