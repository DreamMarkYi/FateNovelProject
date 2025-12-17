<template>
  <div class="container">
    <aside class="sidebar">
      <div class="sidebar-text">Sketchbook</div>
    </aside>

    <section class="text-section">
      <div class="date-mark">上课无聊画的</div>

      <h1>2016年10月21日</h1>

      <div class="content-body">
        <p>今天做了一件"坏事"。 我带着琉璃,还有顺手抓来的秋山,逃掉了学生会的例会。</p>
        <p>理由很简单:琉璃盯着校门口快餐店的眼神太直白了。那个平日里完美无缺的大小姐 ,居然会对廉价的油炸食品露出这种渴望又胆怯的表情,实在让人没法放着不管。</p>
        <p>到了店里,琉璃拿着汉堡的样子如临大敌。果然,第一口下去,番茄酱就沾到了嘴角。 她瞬间僵住,脸色惨白,仿佛犯下了什么不可饶恕的社交错误。</p>
        <p>笨蛋秋山叹了口气,极其自然地递过一张纸巾,用那种毫无起伏的语调说:"神代同学,这里没有观众,也没人给你打分,放松点。"</p>
        <p>琉璃愣了一下,脸颊瞬间涨红。她狠狠瞪了痕一眼,接过纸巾擦掉了污渍,但紧绷的肩膀却垮了下来。</p>
        <p>最后,笨蛋秋山一边抱怨着"下次别找我"一边熟练地收拾餐盘,琉璃虽然嘴硬说"仅此一次",嘴角却忍不住上扬。</p>
        <p>P.S. 其实,我早就注意到痕的口袋里装着那包没开封的纸巾了。 故意没提醒琉璃小心酱汁,就是想看看那个木头会怎么做。 不过,看着他那么熟练自然地帮琉璃解围,虽然画面很美好,但我心里莫名稍微有一点点不爽。 决定了,下次买冰淇淋的时候,我也要不小心"手滑"一下。</p>
      </div>

      <div class="signature">
        <div class="sign-name">遥</div>
      </div>
    </section>

    <section class="image-section">
      <div class="doodle-frame">
        <img src="/MiniStoryBG/MiniStoryBG2.png" alt="Doodle Sketch">
      </div>
    </section>
  </div>
</template>

<script>
export default {
  name: 'DoodleStoryPage',
  mounted() {
    // 组件挂载后的逻辑
  }
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&family=Zhi+Mang+Xing&display=swap');

/* --- 全局设置 --- */
* { 
    margin: 0; 
    padding: 0; 
    box-sizing: border-box; 
}

.container { 
    display: flex; 
    height: 100vh; 
    width: 100vw;
    font-family: 'Caveat', 'Zhi Mang Xing', cursive;
    color: #2c3e50;
    background-color: #fff;
    overflow: hidden;
}

/* --- 左侧边栏 --- */
.sidebar {
    width: 12%; min-width: 100px;
    background-color: #fcfcfc;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
    box-shadow: inset -10px 0 20px -10px rgba(0,0,0,0.05);
}
.sidebar-text {
    writing-mode: vertical-rl; text-orientation: upright;
    letter-spacing: 0.6em; font-size: 12px; color: #bbb;
    font-family: sans-serif; text-transform: uppercase;
}

/* --- 中间文字区 --- */
.text-section {
    width: 45%;
    padding: 0 8%;
    display: flex; flex-direction: column; justify-content: center;
    background-color: #ffffff;
    z-index: 2;
}
.date-mark { 
    margin-top: 80px;
    font-size: 1.2rem; 
    color: #999;  
    text-align: right; 
    transform: rotate(-2deg);
    font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}
h1 { 
    font-size: 3.5rem; 
    font-weight: 500; 
    margin-bottom: 50px; 
    line-height: 1.2; 
    color: #000; 
    transform: rotate(-1deg);
    font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}
.content-body { 
    font-size: 1.6rem; 
    line-height: 1.8; 
    color: #34495e; 
    margin-bottom: 60px; 
    font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}

.content-body p {
    margin: 0 0 0.5em 0;
    text-indent: 2em;
}
.signature { 
    margin-top: auto; 
    text-align: right; 
    padding-bottom: 40px;
}
.sign-name { 
    font-size: 2rem; 
    color: #b85c5c; 
    font-weight: bold; 
    transform: rotate(-3deg); 
    display: inline-block;
    font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}

/* =========================================
   --- 右侧区域:纸张质感与图片融合 ---
========================================= */
.image-section {
    flex: 1;
    height: 100%;
    /* 关键点1:改为暖色调的米黄色,模拟泛黄的纸张 */
    background-color: #ffffff;
    left: -80px;
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    overflow: hidden;
}

/* 装饰元素:左上角的星星 */
.image-section::before {
    content: '☆';
    position: absolute;
    top: 15%; left: 10%;
    font-size: 4rem; color: #b85c5c;
    transform: rotate(-20deg);
    opacity: 0.6;
    font-family: 'Caveat', cursive;
    /* 装饰物也加上混合模式,看起来像画在纸上 */
    mix-blend-mode: multiply;
}
/* 装饰元素:右下角的文字 */
.image-section::after {
    content: '→ 笨蛋';
    position: absolute;
    bottom: 18%; right: -1%;
    font-size: 2rem; color: #2c3e50;
    font-family: 'Zhi Mang Xing', cursive;
    transform: rotate(60deg);
    opacity: 0.5;

    mix-blend-mode: multiply;
}

/* 图片容器 */
.doodle-frame {
    width: 100%;
    height: auto;


    /* 确保容器本身是透明的,不要设置 background-color: #fff */
    background: transparent;
   left : 200px;
    transform: rotate(4deg);
    position: relative;
}

/* 图片本体 */
.doodle-frame img {
    width: 60%;
    height: 60%;
    object-fit: contain;

    /* 滤镜:去色并增加对比度,把照片变成黑白线条感 */


    /* 关键点2:正片叠底 (Multiply)
       这会让图片中的白色像素变透明,
       从而透出父级 (.image-section) 的米黄色背景 */
    mix-blend-mode: multiply;

    /* 稍微降低一点透明度,让质感更柔和 */
    opacity: 0.9;
}

/* 移动端适配 */
@media (max-width: 768px) {
    .container { 
        flex-direction: column; 
        overflow-y: auto; 
    }
    .sidebar { 
        width: 100%; 
        height: 30px; 
        min-width: auto; 
    }
    .sidebar-text { 
        writing-mode: horizontal-tb; 
        font-size: 10px; 
        letter-spacing: 0.2em;
    }
    .text-section { 
        width: 100%; 
        padding: 60px 30px; 
    }
    h1 { 
        font-size: 2.5rem; 
    }
    .content-body { 
        font-size: 1.3rem; 
    }
    .image-section { 
        width: 100%; 
        min-height: 500px; 
        padding: 40px 0;
    }
    .doodle-frame { 
        width: 85%; 
    }
    .image-section::after { 
        display: none; 
    }
}
</style>

