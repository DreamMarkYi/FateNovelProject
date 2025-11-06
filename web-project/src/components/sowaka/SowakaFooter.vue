<template>
  <footer>
    <div class="footer-content">
      <div class="footer-logo">そわか</div>
      <ul class="footer-links">
        <li><a href="#story" @click="scrollToSection">物語</a></li>
        <li><a href="#concept" @click="scrollToSection">コンセプト</a></li>
        <li><a href="#rooms" @click="scrollToSection">客室</a></li>
        <li><a href="#dining">お食事</a></li>
        <li><a href="#spa">スパ</a></li>
        <li><a href="#wedding">ウェディング</a></li>
        <li><a href="#access">交通案内</a></li>
        <li><a href="#contact">お問い合わせ</a></li>
      </ul>
      <div class="footer-info">
        〒605-0000 京都府京都市東山区下河原通八坂鳥居前下る<br>
        TEL: 075-541-5323<br>
        E-mail: info@sowaka.com<br>
        営業時間: 24時間 (チェックイン 15:00 / チェックアウト 12:00)
      </div>
      <div class="copyright">
        © 2025 SOWAKA KYOTO. All Rights Reserved.
      </div>
    </div>
  </footer>
</template>

<script setup>
const emit = defineEmits(['scroll-to-section'])

const scrollToSection = (event) => {
  emit('scroll-to-section', event)
}
</script>

<style scoped>
/* Footer */
footer {
  background-color: #2a2a2a;
  color: #aaa;
  padding: 80px 50px 40px;
  text-align: center;
}

.footer-logo {
  font-size: 28px;
  letter-spacing: 6px;
  margin-bottom: 40px;
  color: #d4c5b0;
  font-weight: 300;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 40px;
  margin-bottom: 50px;
  list-style: none;
  flex-wrap: wrap;
}

.footer-links a {
  color: #aaa;
  text-decoration: none;
  font-size: 13px;
  letter-spacing: 2px;
  transition: color 0.3s;
}

.footer-links a:hover {
  color: #d4c5b0;
}

.footer-info {
  font-size: 13px;
  line-height: 2.2;
  color: #888;
  margin-bottom: 40px;
}

.copyright {
  font-size: 11px;
  color: #666;
  letter-spacing: 1px;
  padding-top: 30px;
  border-top: 1px solid #444;
}

/* Responsive */
@media (max-width: 768px) {
  .footer-links {
    flex-direction: column;
    gap: 20px;
  }
}
</style>
