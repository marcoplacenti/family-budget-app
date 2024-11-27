import React, { useState } from "react";
import "../styles/Transactions.css";

function Transactions() {
  const [transaction, setTransaction] = useState({ category: "", amount: 0, description: "" });
  const [formRows, setFormRows] = useState([{ id: 1, category: "", amount: 0, description: "" }]);

  const handleChange = (e, id) => {
    const { name, value } = e.target;
    const updatedRows = formRows.map(row => {
      if (row.id === id) {
        return { ...row, [name]: value };
      }
      return row;
    });
    setFormRows(updatedRows);
  };

  const handleAddRow = () => {
    const newRow = { id: formRows.length + 1, category: "", amount: 0, description: "" };
    setFormRows([...formRows, newRow]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted transaction: ", transaction);
  };

  return (
    <div className="transactions">
      <div className="column-container">
        <div className="column">
          <h1>Add Transaction</h1>
          <form onSubmit={handleSubmit}>
            <label>
              Category:
              <select name="category" value={transaction.category} onChange={handleChange} required>
                <option value="">Select</option>
                <option value="Groceries">Groceries</option>
                <option value="Transportation">Transportation</option>
                <option value="Media">Media</option>
              </select>
            </label>
            <label>
              Amount:
              <input type="number" name="amount" value={transaction.amount} onChange={handleChange} required />
            </label>
            <label>
              Description:
              <input type="text" name="description" value={transaction.description} onChange={handleChange} />
            </label>
            <button type="submit">Add Transaction</button>
          </form>
        </div>
        <div className="column">
          <h1>Transaction Details</h1>
          <table>
            <thead>
              <tr>
                <th>Category</th>
                <th>Amount</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {formRows.map(row => (
                <tr key={row.id}>
                  <td><input type="text" name="category" value={row.category} onChange={(e) => handleChange(e, row.id)} /></td>
                  <td><input type="number" name="amount" value={row.amount} onChange={(e) => handleChange(e, row.id)} /></td>
                  <td><input type="text" name="description" value={row.description} onChange={(e) => handleChange(e, row.id)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={handleAddRow}>Add Row</button>
        </div>
      </div>
    </div>
  );
}

export default Transactions;