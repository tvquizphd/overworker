import { Component } from 'react'
import Page from '../components/page'
import { alertSafariPortrait, preventScroll } from '../functions/events'

export default class Index extends Component {

  constructor(props) {
    super()
    this.state = {
      inputText: "Welcome!"
    }
  }

  componentDidMount() {
    // Needed For iOS Safari
    window.addEventListener('orientationchange', alertSafariPortrait, false);
    window.addEventListener('touchmove', preventScroll, { passive: false });
  }

  componentWillUnmount() {
    // Needed For iOS Safari
    window.removeEventListener('orientationchange', alertSafariPortrait, false);
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
