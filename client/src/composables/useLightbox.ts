import { onBeforeUnmount, onMounted, shallowRef, type Ref } from 'vue'
import PhotoSwipeLightbox from 'photoswipe/lightbox'

export interface LightboxItem {
  src: string
  width: number
  height: number
  alt: string
}

/**
 * PhotoSwipe, wired to a gallery whose thumbnails carry `data-pswp-index`.
 * Feeding it the real thumbnail element is what buys the zoom-out-of-the-grid
 * animation instead of a plain fade.
 */
export function useLightbox(gallery: Ref<HTMLElement | null>, items: Ref<LightboxItem[]>) {
  const lightbox = shallowRef<PhotoSwipeLightbox>()

  function thumbnailAt(index: number): HTMLImageElement | null {
    return gallery.value?.querySelector(`[data-pswp-index="${index}"] img`) ?? null
  }

  onMounted(() => {
    const instance = new PhotoSwipeLightbox({
      dataSource: items.value,
      pswpModule: () => import('photoswipe'),
      bgOpacity: 1,
      padding: { top: 56, bottom: 56, left: 20, right: 20 },
      showHideAnimationType: 'zoom',
      zoomAnimationDuration: 400,
      counter: true,
      arrowPrev: true,
      arrowNext: true,
      wheelToZoom: true,
      closeTitle: 'Close',
      zoomTitle: 'Zoom',
      arrowPrevTitle: 'Previous',
      arrowNextTitle: 'Next',
    })

    instance.addFilter(
      'thumbEl',
      (fallback, _data, index) => thumbnailAt(index) ?? (fallback as HTMLElement),
    )
    instance.addFilter(
      'placeholderSrc',
      (fallback, slide) => thumbnailAt(slide.index)?.currentSrc || fallback,
    )

    // Caption reads out of the alt text we already write for each screenshot.
    instance.on('uiRegister', () => {
      instance.pswp?.ui?.registerElement({
        name: 'caption',
        order: 9,
        isButton: false,
        appendTo: 'root',
        onInit: (element, pswp) => {
          element.className = 'pswp__caption'
          const update = () => {
            element.textContent = (pswp.currSlide?.data as LightboxItem | undefined)?.alt ?? ''
          }
          pswp.on('change', update)
          update()
        },
      })
    })

    instance.init()
    lightbox.value = instance
  })

  onBeforeUnmount(() => {
    lightbox.value?.destroy()
    lightbox.value = undefined
  })

  function open(index: number) {
    lightbox.value?.loadAndOpen(index, items.value)
  }

  return { open }
}
