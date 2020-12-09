import '../public/main.css'

import { config } from '@fortawesome/fontawesome-svg-core'
import '@fortawesome/fontawesome-svg-core/styles.css' // Import the CSS
config.autoAddCss = false // Tell Font Awesome to skip adding the CSS automatically

// This default export is required
export default function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />
}
