import React from "react";

export default function Checkbox(props) {
  const { name, checked, toggle } = props
  return (
    <input
      type="checkbox"
      name={name}
      checked={checked}
      onChange={(e) => toggle(e.target.name)}
      className="form-check-input"
    />
  )
};
