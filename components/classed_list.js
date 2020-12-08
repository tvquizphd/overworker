import { Children } from "react"

const ClassedList = ({ children, className }) => {

  const listItems = Children.map(children, (child, id) => (
    <li key={ id } className={`${className}-item`}>
      { child }
    </li>
  ))

  return (
    <ul className={ className }>
      { listItems }
    </ul>
  )
}

export default ClassedList
