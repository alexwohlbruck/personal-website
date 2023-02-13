const offlineStateItems = ['me']

export interface OfflineStateItem {
  key: keyof typeof offlineStateItems
  value: any
}

export const syncLocalStorage = (store) => {
  for (const offlineStateItem of offlineStateItems) {
    store.watch(
      (state) => state[offlineStateItem],
      (value) => localStorage.setItem(offlineStateItem, JSON.stringify(value)),
      { deep: true },
    )
  }

  // Load offline state items from local storage
  for (const offlineStateItem of offlineStateItems) {
    const value = localStorage.getItem(offlineStateItem)
    if (value) {
      store.commit('SET_OFFLINE_STATE_ITEM', {
        key: offlineStateItem,
        value: JSON.parse(value),
      })
    }
  }
}
