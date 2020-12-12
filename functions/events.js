export const alertSafariPortrait = function() {
  const innerHeightOld = window.innerHeight
  window.requestAnimationFrame(() => {
    const {innerHeight, innerWidth} = window
    const likelySafari90DegRot = innerHeightOld?
      (innerHeightOld != innerHeight): false
    const nowPortrait = innerHeight > innerWidth
    if (likelySafari90DegRot && nowPortrait) {
      alert('Switching to portrait mode')
      // window.location.reload();
    }
  })
}

export const preventScroll = function(e) {
  const el = getComputedStyle(e.target)
  const blockScroll = el.getPropertyValue("--block-scroll")
  // const touchAction = el.getPropertyValue("touch-action")
  // console.log(touchAction)
  if (blockScroll.includes("yes")) {
    e.preventDefault();
    e.stopImmediatePropagation();
  }
}
