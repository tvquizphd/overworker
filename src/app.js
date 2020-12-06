import React from "react";
import "./styles.css";

export default class App extends React.Component {
  state = {
    users: [],
  };
  componentDidMount() {
    fetch("/users.json")
      .then(response => response.json()).then((data) => {
      this.setState({ users: data });
    });
  }

  render() {
    const { users } = this.state;
    return (
      <div>
        <ul className="users">
          {users.map((user) => (
            <li className="user">
              <p>
                <strong>Name:</strong> {user.name}
              </p>
              <p>
                <strong>Email:</strong> {user.email}
              </p>
              <p>
                <strong>City:</strong> {user.address.city}
              </p>
            </li>
          ))}
        </ul>
      </div>
    );
  }
}
