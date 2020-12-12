
const iOSBrowserCheck = () => {
  const ua = window.navigator.userAgent
  const iOS = !!ua.match(/iP(?:ad|hone)/)
  const version = ua.match(/ Gecko\) ([^\/]*)/)[1]
  return iOS ? {
    'Version': 'Safari',
    'FxiOS': 'Firefox',
    'CriOS': 'Chrome',
    'OPiOS': 'Opera'
  }[version] || 'Other' : undefined
}
export const refreshOniOSRotate = function() {
  const innerHeightOld = window.innerHeight
  const iOSBrowser = iOSBrowserCheck()
  const isSafari = iOSBrowser == 'Safari'
  const isChrome = iOSBrowser == 'Chrome'
  window.requestAnimationFrame(() => {
    const {innerHeight, innerWidth} = window
    const nowPortrait = innerHeight > innerWidth
    const safari90DegRot = (innerHeightOld && isSafari)?
      (innerHeightOld != innerHeight): false
    if (safari90DegRot && nowPortrait) {
      window.location.reload();
    }
    else if (isChrome) {
      window.location.reload();
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
