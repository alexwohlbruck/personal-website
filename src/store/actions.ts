export const getSomething = async ({ commit }) => {
  const result = 1//await getSomething()
  commit('something', result)
}