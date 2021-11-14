
<template lang="pug">
.progress-linear.m-t-5
  .p(:style="{ width: (value / max * 100) + '%' }")
</template>

<script>
export default {
  name: 'progress-linear',
  props: {
    value: {
      type: Number,
      required: true,
    },
    max: {
      type: Number,
      required: true,
    },
  },
}
</script>

<style lang="scss">
@import '@/styles/variables.scss';

$progress-height: $border-width;

.progress-linear {
  width: 100%;
  height: $progress-height;
  border-radius: $progress-height / 2;
  background-color: $dark;
  margin-bottom: 10px;

  .p {
    background-color: $accent;
    height: 100%;
    border-radius: $progress-height / 2;
    transition: width 1s ease-in-out;
  }
}
</style>