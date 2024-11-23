import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/UserSetup.css'; // Import the CSS file for styling
import '../styles/InitUserData.css';

import CustomLambdaInvocation from '../utils/CustomLambdaInvocation';

function UserSetup() {
  const [basicNeeedsCategories, setbasicNeeds] = useState([]);
  const [dailyNeedsCategories, setdailyNeeds] = useState([]);
  const [entertainmentsCategories, setentertainments] = useState([]);
  const [savingsCategories, setSavings] = useState([]);

  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const navigate = useNavigate();

  const [isOverlayVisible, setIsOverlayVisible] = useState(true);

  const lambdaInvoker = new CustomLambdaInvocation();

  

  useEffect(() => {

    setbasicNeeds({
      'Affitto': "0,00",
      'Assicurazione': "0,00",
      'Elettricità': "0,00",
      'Sindacato': "0,00",
      'Telefonia': "0,00",
      'TV': "0,00"
    })

    setdailyNeeds({
      'Alimentari': "0,00",
      'Complementari': "0,00",
      'Medicinali': "0,00",
      'Mobilio': "0,00",
      'Trasporto': "0,00",
      'Visite Mediche': "0,00"
    })
  
    setentertainments({
      'Personali Marco': "0,00",
      'Personali Miriam': "0,00",
      'Uscite': "0,00",
      'Viaggi Palermo': "0,00",
      'Viaggi Ricreativi': "0,00"
    })
  
    setSavings({
      'Automobile': "0,00",
      'Casa Danimarca': "0,00",
      'Casa Palermo': "0,00",
      'Cassa': "0,00",
      'Investimenti': "0,00",
      'Safety Net': "0,00"
    })

    const storedIdToken  = sessionStorage.getItem("idToken");
    const storedAccessToken = sessionStorage.getItem("accessToken");
    const storedRefreshToken = sessionStorage.getItem("refreshToken");
    if (!storedIdToken || !storedAccessToken || !storedRefreshToken) {
        // Redirect to login if not authenticated
        navigate("/");
    }

    setIdToken(storedIdToken);
    setAccessToken(storedIdToken);
    setRefreshToken(storedIdToken);

  }, []);

  const handleProvisionChange = (index, category, event) => {
    const newData = { ...category }; // Create a shallow copy of the category
    newData[index] = event.target.value; // Update the specific field with the raw input
    updateCategory(category, newData); // Update the state dynamically
  };
  

  const updateCategory = (category, newData) => {
    const categoryKeys = JSON.stringify(Object.keys(category))
    if (categoryKeys === JSON.stringify(Object.keys(basicNeeedsCategories))) {
      setbasicNeeds(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(dailyNeedsCategories))) {
      setdailyNeeds(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(entertainmentsCategories))) {
      setentertainments(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(savingsCategories))) {
      setSavings(newData)
    }
    
  }
  
  const handleProvisionBlur = (index, category) => {
    const newData = { ...category }; // Create a shallow copy of the category
    let value = category[index]; // Get the current value
    value = value.replace('.', '').replace(',', '.'); // Normalize for parsing
    
    // Check if it's a valid number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      // Format it as currency
      value = formatCurrency(parseFloat(value));
    } else {
      alert("Invalid value. Will be reset to 0.")
      // Set to "0,00" if invalid
      value = "0,00";
    }
  
    newData[index] = value; // Update the value in the copied category
    updateCategory(category, newData); // Update the state
  };
  
  

  // Format numbers to 2 decimal places
  const formatCurrency = (amount) => {
    let formattedAmount = parseFloat(amount).toFixed(2);
    formattedAmount = formattedAmount.replace('.', ',');
    const [integer, decimal] = formattedAmount.split(',');
    const integerWithThousandsSeparator = integer.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    return decimal ? `${integerWithThousandsSeparator},${decimal}` : integerWithThousandsSeparator;
  };

  const handleLogout = () => {
    sessionStorage.clear();
    navigate("/");
  };

  const onSubmitInitData = (event) => {
    event.preventDefault();

    const formInputs = event.target.elements;
    const startMonth = formInputs['startmonth'].value
    const currency = formInputs['currency'].value

    const allBalances = Object.assign({}, basicNeeedsCategories, dailyNeedsCategories, entertainmentsCategories, savingsCategories);

    const functionName = "InitializeUserData";
    const payload = { idToken, startMonth, currency, allBalances };
    lambdaInvoker.invoke(functionName, payload)
    navigate("/home")
  };
  
  return (
    <div className="app-container">
  {/* Overlay Form */}
  {isOverlayVisible && (
    <div className="overlay">
      <div className="form-container">
        <h2>Initialize your accounts!</h2>
        <h5>Looks like we have no data registered on your account. Please tell us how much money you currently have in these accounts.</h5>
        <form onSubmit={onSubmitInitData}>
          <div className="form-row month-currency-row">
            <div className="form-group">
              <label htmlFor="startMonth">Select Month and Year</label>
              <input id="startmonth" type="month" required placeholder="Select Month and Year" />
            </div>
            <div className="form-group">
              <label htmlFor="currency">Select Currency</label>
              <select id="currency" required>
                <option value="DKK">DKK</option>
                <option value="EUR">EUR</option>
                <option value="USD">USD</option>
              </select>
            </div>
          </div>
          
          {/* Category Groups on the Same Row */}
          <div className="category-group-wrapper">
            <div className="category-group basic-needs-group">
              <h3>Basic Needs Accounts</h3>
              {Object.keys(basicNeeedsCategories).map((category, index) => (
                <div className="form-row" key={index}>
                  <label htmlFor={`field-${index + 1}`}>{category}</label>
                  <input
                    id={`field-${index + 1}`}
                    type="text"
                    value={basicNeeedsCategories[category] || ""} // Controlled by state
                    onChange={(e) => handleProvisionChange(category, basicNeeedsCategories, e)} // Allow free typing
                    onBlur={() => handleProvisionBlur(category, basicNeeedsCategories)} // Validate and format on blur
                  />
                </div>
              ))}
            </div>

            <div className="category-group entertainment-group">
              <h3>Daily Needs Accounts</h3>
              {Object.keys(dailyNeedsCategories).map((category, index) => (
                <div className="form-row" key={index}>
                  <label htmlFor={`field-${index + 1}`}>{category}</label>
                  <input
                    id={`field-${index + 1}`} 
                    type="text"
                    value={dailyNeedsCategories[category] || ""}
                    onChange={(e) => handleProvisionChange(category, dailyNeedsCategories, e)} 
                    onBlur={() => handleProvisionBlur(category, dailyNeedsCategories)} 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Two Extra Boxes Below */}
          <div className="category-group-wrapper">
          <div className="category-group entertainment-group">
              <h3>Entertainment Accounts</h3>
              {Object.keys(entertainmentsCategories).map((category, index) => (
                <div className="form-row" key={index}>
                  <label htmlFor={`field-${index + 1}`}>{category}</label>
                  <input
                    id={`field-${index + 1}`} 
                    type="text"
                    value={entertainmentsCategories[category] || ""}
                    onChange={(e) => handleProvisionChange(category, entertainmentsCategories, e)} 
                    onBlur={() => handleProvisionBlur(category, entertainmentsCategories)}
                  />
                </div>
              ))}
            </div>

            <div className="category-group entertainment-group">
              <h3>Saving Accounts</h3>
              {Object.keys(savingsCategories).map((category, index) => (
                <div className="form-row" key={index}>
                  <label htmlFor={`field-${index + 1}`}>{category}</label>
                  <input
                    id={`field-${index + 1}`} 
                    type="text"
                    value={savingsCategories[category] || ""}
                    onChange={(e) => handleProvisionChange(category, savingsCategories, e)} 
                    onBlur={() => handleProvisionBlur(category, savingsCategories)}
                  />
                </div>
              ))}
            </div>
          </div>

          <button type="submit">Save</button>
        </form>
        <button className="logout-button" onClick={handleLogout}>Discard & Logout</button>
      </div>
    </div>
  )}
</div>

  )
}

export default UserSetup;
