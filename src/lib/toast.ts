// Shows a message at the bottom of the screen (rendered by CollectionsLayout).
export const toast = (msg: string, bad = false) =>
  window.dispatchEvent(new CustomEvent('toast', { detail: { msg, bad } }))
