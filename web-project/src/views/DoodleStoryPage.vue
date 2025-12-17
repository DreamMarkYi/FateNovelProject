<template>
  <div class="container">
    <aside class="sidebar">
      <div class="sidebar-text">Sketchbook</div>

      <div class="nav-controls">
        <button
            class="nav-btn prev-btn"
            @click="prevPage"
            :disabled="currentIndex === 0"
            title="上一页"
        >
          ↑
        </button>
        <span class="page-indicator">{{ currentIndex + 1 }} / {{ stories.length }}</span>
        <button
            class="nav-btn next-btn"
            @click="nextPage"
            :disabled="currentIndex === stories.length - 1"
            title="下一页"
        >
          ↓
        </button>
      </div>
    </aside>

    <transition name="book-flip" mode="out-in">

      <div class="page-wrapper" :key="currentIndex">

        <section class="text-section">
          <div class="date-mark">{{ currentStory.dateMark }}</div>

          <h1>{{ currentStory.date }}</h1>

          <div class="content-body">
            <p v-for="(paragraph, index) in currentStory.content" :key="index">
              {{ paragraph }}
            </p>
          </div>

          <div class="signature">
            <div class="sign-name">{{ currentStory.signature }}</div>
          </div>
        </section>

        <section class="image-section">
          <div class="doodle-frame">
            <img :src="currentStory.image" :alt="currentStory.title">
          </div>
        </section>

      </div>
    </transition>

  </div>
</template>

<script>
export default {
  name: 'DoodleStoryPage',
  data() {
    return {
      currentIndex: 0,
      stories: [
        {
          dateMark: '上课无聊画的',
          date: '2016年10月21日',
          title: '汉堡店的秘密',
          content: [
            '今天做了一件"坏事"。 我带着琉璃,还有顺手抓来的秋山,逃掉了学生会的例会。',
            '理由很简单:琉璃盯着校门口快餐店的眼神太直白了。那个平日里完美无缺的大小姐 ,居然会对廉价的油炸食品露出这种渴望又胆怯的表情,实在让人没法放着不管。',
            '到了店里,琉璃拿着汉堡的样子如临大敌。果然,第一口下去,番茄酱就沾到了嘴角。 她瞬间僵住,脸色惨白,仿佛犯下了什么不可饶恕的社交错误。',
            '笨蛋秋山叹了口气,极其自然地递过一张纸巾,用那种毫无起伏的语调说:"神代同学,这里没有观众,也没人给你打分,放松点。"',
            '琉璃愣了一下,脸颊瞬间涨红。她狠狠瞪了痕一眼,接过纸巾擦掉了污渍,但紧绷的肩膀却垮了下来。',
            'P.S. 其实,我早就注意到痕的口袋里装着那包没开封的纸巾了。 故意没提醒琉璃小心酱汁,就是想看看那个木头会怎么做。'
          ],
          signature: '遥',
          image: 'https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/MiniStoryBG1.png'
        },
        {
          dateMark: '不开心',
          date: '2016年11月05日',
          title: '图书馆的偶遇',
          content: [
            '如果有“在毫无意义的事情上浪费人生”的比赛，痕这家伙绝对能拿金牌。',
            '今天躲雨的时候钻进了一家电玩城。本来只是想打发时间，结果这家伙在一台抓娃娃机前走不动路了。橱窗里明明只是一只长得像被生活痛殴过的、眼歪嘴斜的蓝色鲨鱼玩偶，审美奇差无比。但整个笨蛋就像是被下了降头一样，死死盯着那只鲨鱼。',
            '真的太好笑了。 平日里那副对什么都提不起劲、仿佛看破红尘的死鱼眼去哪了？现在这个为了几十块钱的布偶跟机器较劲的笨蛋是谁啊？',
            '“喂，秋山同学“，“再投下去，这只鲨鱼的身价都要超过神户牛肉了。”',
            '痕被我吓得手一抖，摇杆一歪，爪子却奇迹般地勾住了鲨鱼的尾巴。 伴随着欢快的廉价电子音，那只丑鲨鱼滚了出来。',
            '他愣了一下，把玩偶从取物口拿出来，长舒了一口气，然后极其顺手地，把那个丑东西塞进了我的怀里。',
            '“拿去堵住你的嘴。”',
            '既然你这么诚心诚意地供奉了，本小姐就勉为其难收下吧。 虽然它真的很丑，丑得和你刚才那副不服输的表情一模一样。',
              'P.S. 回家把鲨鱼摆在床头了。 盯着看了会儿，发现这鲨鱼死气沉沉的眼神……怎么越看越像痕？ 以后心情不好的时候，就戳它的脸出气好了。'
          ],
          signature: '遥',
          image: 'https://mini-story-bg.oss-cn-shanghai.aliyuncs.com/MiniStoryBG2.png'
        }
      ]
    }
  },
  computed: {
    currentStory() {
      return this.stories[this.currentIndex];
    }
  },
  methods: {
    nextPage() {
      if (this.currentIndex < this.stories.length - 1) {
        this.currentIndex++;
      }
    },
    prevPage() {
      if (this.currentIndex > 0) {
        this.currentIndex--;
      }
    }
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
  background-color: #fff; /* 这里的背景色作为书本底色 */
  overflow: hidden;
  /* 关键：为3D翻页增加透视感 */
  perspective: 2000px;
}

/* --- 左侧边栏 --- */
.sidebar {
  width: 12%; min-width: 100px;
  background-color: #fcfcfc;
  display: flex;
  flex-direction: column; /* 改为纵向排列以容纳按钮 */
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  box-shadow: inset -10px 0 20px -10px rgba(0,0,0,0.05);
  z-index: 10; /* 确保侧边栏在翻页层之上 */
  position: relative;
}

.sidebar-text {
  writing-mode: vertical-rl; text-orientation: upright;
  letter-spacing: 0.6em; font-size: 12px; color: #bbb;
  font-family: sans-serif; text-transform: uppercase;
  flex: 1; /* 占据剩余空间 */
  display: flex; justify-content: center; align-items: center;
}

/* 导航按钮样式 */
.nav-controls {
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.nav-btn {
  background: none;
  border: 2px solid #ddd;
  border-radius: 50%;
  width: 40px; height: 40px;
  cursor: pointer;
  font-family: 'Caveat', cursive;
  font-size: 1.2rem;
  color: #888;
  transition: all 0.3s ease;
}

.nav-btn:hover:not(:disabled) {
  border-color: #b85c5c;
  color: #b85c5c;
  transform: scale(1.1);
}

.nav-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.page-indicator {
  font-size: 0.9rem;
  color: #bbb;
  font-family: 'Caveat', cursive;
}

/* --- 翻页包裹容器 --- */
/* 这个容器包裹 Text 和 Image 两个 section，模拟一张完整的纸 */
.page-wrapper {
  flex: 1;
  display: flex;
  height: 100%;
  width: 100%;
  background-color: #fff;
  /* 关键：设置旋转原点在左侧，模拟书脊 */
  transform-origin: left center;
  box-shadow: -5px 0 15px rgba(0,0,0,0.05);
}

/* --- 动画定义: 书本翻页效果 --- */
.book-flip-enter-active {
  transition: all 0.8s cubic-bezier(0.4, 0.0, 0.2, 1);
}
.book-flip-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
}

/* 进入时：从右侧像翻书一样盖过来，或者像新纸张展开 */
.book-flip-enter-from {
  transform: rotateY(-20deg); /* 稍微折叠 */
  opacity: 0;
  filter: blur(2px);
}

/* 离开时：向左翻过去，或者像旧纸张被掀开 */
.book-flip-leave-to {
  transform: rotateY(-15deg) translateX(-20px);
  opacity: 0;
}

/* 确保进入和离开状态是平展的 */
.book-flip-enter-to, .book-flip-leave-from {
  transform: rotateY(0deg);
  opacity: 1;
  filter: blur(0);
}


/* --- 中间文字区 (原有样式微调) --- */
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
  font-size: 1.5rem;
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
  font-size: 3rem;
  color: #b85c5c;
  font-weight: lighter;
  transform: rotate(-3deg);
  display: inline-block;
  font-family: 'Caveat', 'Zhi Mang Xing', cursive;
}

/* --- 右侧区域 --- */
.image-section {
  flex: 1;
  height: 100%;
  background-color: #ffffff;
  margin-left: -180px;
  display: flex;
  align-items: center; /* 垂直居中 */
  justify-content: center; /* 水平居中 */
  position: relative;
  overflow: hidden;
}

/* ... (保留 ::before 和 ::after 装饰元素不变) ... */

/* 图片的外框容器 */
.doodle-frame {
  /* 1. 改为填满父容器，作为一个巨大的画布 */
  width: 100%;
  height: 100%;

  /* 2. 使用 Flexbox 确保图片始终居中 */
  display: flex;
  align-items: center;
  justify-content: center;

  background: transparent;

  /* 3. 保留之前的旋转风格，但去掉了 left: 100px 的硬偏移，
        改用 justify-content 控制，或者在这里微调 */
  transform: rotate(4deg) translateX(50px);
  position: relative;
}

/* 图片本体 */
.doodle-frame img {
  /* 核心修改：不再强制 width: 60% */

  /* 4. 让宽高自适应，保持原图比例 */
  width: auto;
  height: auto;
  /* 5. 限制最大尺寸：既不能太宽，也不能太高 */
  /* 限制宽度不超过父容器的 70% */
  max-width: 80%;
  /* 关键点：限制高度不超过屏幕高度的 60% (避免长图撑爆) */
  max-height: 80vh;

  object-fit: contain;

  /* 保持原来的滤镜效果 */
  mix-blend-mode: multiply;
  opacity: 0.9;
  transition: transform 1s ease;

  /* 增加一个轻微的阴影，增加纸张剪贴感 */
  filter: drop-shadow(2px 4px 6px rgba(0,0,0,0.1));
}

/* 移动端适配 */
@media (max-width: 768px) {
  .container {
    flex-direction: column;
    overflow-y: auto;
    perspective: none; /* 移动端取消3D透视，避免滚动问题 */
  }
  .page-wrapper {
    flex-direction: column;
    transform: none !important; /* 移动端取消3D旋转 */
    opacity: 1 !important;
  }
  .sidebar {
    width: 100%;
    height: auto;
    padding: 10px;
    flex-direction: row; /* 移动端横向排列 */
    justify-content: space-between;
  }
  .sidebar-text {
    writing-mode: horizontal-tb;
    font-size: 14px;
    flex: 0;
  }
  .nav-controls {
    flex-direction: row;
    margin-bottom: 0;
  }
  .text-section {
    width: 100%;
    padding: 60px 30px;
  }
  .image-section {
    width: 100%;
    min-height: 500px;
    padding: 40px 0;
    margin-left: 0;
  }
  .doodle-frame {
    width: 85%;
    left: 0;
  }
  .image-section::after {
    display: none;
  }

  /* 移动端改为简单的淡入淡出 */
  .book-flip-enter-active, .book-flip-leave-active {
    transition: opacity 0.3s ease;
  }
  .book-flip-enter-from, .book-flip-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>