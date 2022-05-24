export default {
  bind(el, { value }) {
    el.style.visibility = value ? 'visible' : 'hidden';
  },

  update(el, {value, oldValue}, vnode) {
    if (!value === !oldValue) {
      return
    }

    if (value) {
      (vnode?.data?.transition as any)?.beforeEnter(el);
      el.style.visibility = 'visible';
      (vnode?.data?.transition as any)?.enter(el)
    } else {
      (vnode?.data?.transition as any)?.leave(el, () => {
        el.style.visibility = 'hidden'
      })
    }
  }
}