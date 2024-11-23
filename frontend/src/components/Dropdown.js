import React from "react";
import "../styles/Dropdown.css";

function Dropdown({ label, options, setValue }) {
  const handleChange = (event) => {
    setValue(event.target.value);
  };

  return (
    <div className="dropdown">
      <label>{label}</label>
      <select onChange={handleChange}>
        {options.map((option, index) => (
          <option key={index} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}

export default Dropdown;
