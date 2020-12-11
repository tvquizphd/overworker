import { Component } from 'react'
import Page from '../components/page'

export default class Index extends Component {

  constructor(props) {
    super()
    this.state = {
      inputText: "Welcome!"
    }
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
