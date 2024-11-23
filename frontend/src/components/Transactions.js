import React, { useState } from "react";
import "../styles/Transactions.css";

function Transactions() {
  const [transaction, setTransaction] = useState({ category: "", amount: 0, description: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted transaction: ", transaction);
  };

  return (
    <div className="transactions">
      <h1>Add Transaction</h1>
      <form onSubmit={handleSubmit}>
        <label>
          Category:
          <select name="category" onChange={handleChange} required>
            <option value="">Select</option>
            <option value="Groceries">Groceries</option>
            <option value="Transportation">Transportation</option>
            <option value="Media">Media</option>
          </select>
        </label>
        <label>
          Amount:
          <input type="number" name="amount" onChange={handleChange} required />
        </label>
        <label>
          Description:
          <input type="text" name="description" onChange={handleChange} />
        </label>
        <button type="submit">Add Transaction</button>
      </form>
    </div>
  );
}

export default Transactions;
