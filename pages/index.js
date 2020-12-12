import { Component } from 'react'
import Page from '../components/page'
import { refreshOniOSRotate, preventScroll } from '../functions/events'

export default class Index extends Component {

  constructor(props) {
    super()
    this.state = {
      inputText: "Welcome!"
    }
  }

  componentDidMount() {
    // For overwriting iOS Chrome 100% height offset issue and
    // For keeping navbar in iOS Safari Portrait mode on smaller iPhones
    window.addEventListener('orientationchange', refreshOniOSRotate, false);
    // For preventing navbar in iOS Safari Landscape mode
    window.addEventListener('touchmove', preventScroll, { passive: false });
  }

  componentWillUnmount() {
    window.removeEventListener('orientationchange', refreshOniOSRotate, false);
    window.removeEventListener('touchmove', preventScroll, { passive: false });
  }

  inputTextChange = (s) => {
    this.setState({
      inputText: s
    })
  }

  render(props) {
    const {inputText} = this.state;
    return (
      <Page
        inputText={inputText}
        inputTextChange={this.inputTextChange}
      />
    ) 
  }
}
