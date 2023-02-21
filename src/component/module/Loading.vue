<template>
  <div class="mo-loading-mask" v-if="mask" :style="{ background: mask }"></div>
  <div :class="['mo-loading', type]">
    <img src="/public/img/icon-loading.svg" />
    <div class="message" v-html="message" v-if="message"></div>
  </div>
</template>
<script>
import i18n from '@/i18n';

export default {
  name: 'mo-toast',
  props: {
    type: {
      type: String,
      default: 'normal',
    },
    message: {
      type: String,
      default: i18n('loading') + '...',
    },
    duration: {
      type: Number,
      default: 0,
    },
    mask: {
      type: [Boolean, String],
      default: true,
    },
    onClose: {
      type: Function,
      default() {
        return () => {};
      },
    },
  },
  mounted() {
    if (this.duration > 0) {
      let timer = setTimeout(() => {
        this.onClose();
      }, this.duration);
    }
  },
};
</script>
<style lang="less">
.mo-loading-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 998;
  background-color: rgba(0, 0, 0, 0.25);
}
.mo-loading {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;

  img {
    width: 100px;
    animation: mo-loading-animate 1s linear infinite;
  }

  .message {
    margin-top: 20px;
    font-size: 28px;
  }

  &.white {
    img {
      filter: brightness(0) invert(1);
    }
  }
}

@keyframes mo-loading-animate {
  100% {
    transform: rotate(360deg);
  }
}
</style>
