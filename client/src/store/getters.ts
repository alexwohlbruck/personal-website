export const project = state => name => {
  return state.projects.find(p => p.name === name);
}