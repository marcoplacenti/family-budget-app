import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/Home.css'; // Import the CSS file for styling
import '../styles/InitUserData.css';

import CustomLambdaInvocation from '../utils/CustomLambdaInvocation';

function Home() {
  const [basicNeedsAccounts, setBasicNeeds] = useState([]);
  const [entertainmentsAccounts, setEntertainments] = useState([]);
  const [dailyNeedsAccounts, setDailyNeeds] = useState([]);
  const [savingsAccounts, setSavings] = useState([]);
  const [availablePeriods, setAvailablePeriods] = useState([]);
  const [bankOverview, setBankOverview] = useState({});
  const [monthYear, setMonthYear] = useState(null);

  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const navigate = useNavigate();

  const [isEditOverlayVisible, setIsEditOverlayVisible] = useState(false);

  const lambdaInvoker = new CustomLambdaInvocation();

  useEffect(() => {

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

    // TODO: Check existing months (aka do we already have data for this user?) Let's assume we never do for now
    const checkUserDataInit = async (idToken) => {
      try {
        const functionName = "UserDataFetcher";
        const payload = { idToken };
        const result = await lambdaInvoker.invoke(functionName, payload)
        console.log(result)
        const statusCode = result.statusCode;
        fetchData(JSON.parse(result.accountsData));
        fetchPeriods(JSON.parse(result.availablePeriods));
      } catch (error) {
        console.error("Something went wrong:", error);
      }
    };

    console.log(storedIdToken)
    checkUserDataInit(storedIdToken)
    
    // Fetch financial data
    const fetchData = async (data) => {
      try {
        setBasicNeeds(data.filter(item => item.category === "basic"));
        setDailyNeeds(data.filter(item => item.category === "daily"));
        setEntertainments(data.filter(item => item.category === "entertainment"));
        setSavings(data.filter(item => item.category === "saving"));
        // setEntertainmentCategories(entertainment);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };

    const fetchPeriods = async (data) => {
      try {
        console.log(data)
        setAvailablePeriods(data)
        console.log(availablePeriods)
        // setEntertainmentCategories(entertainment);
      } catch (error) {
        console.error("Failed to fetch financial data:", error);
      }
    };

    // Fetch bank overview
    const fetchBankOverview = async (data) => {
      try {
        //console.log(data)

        //setBankOverview(result);
      } catch (error) {
        console.error("Failed to fetch bank overview:", error);
      }
    };

  }, []);

  const updateCategory = (category, newData) => {
    const categoryKeys = JSON.stringify(Object.keys(category))
    if (categoryKeys === JSON.stringify(Object.keys(basicNeedsAccounts))) {
      setBasicNeeds(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(dailyNeedsAccounts))) {
      setDailyNeeds(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(entertainmentsAccounts))) {
      setEntertainments(newData)
    }

    if (categoryKeys === JSON.stringify(Object.keys(savingsAccounts))) {
      setSavings(newData)
    }
  }

  const handleProvisionChange = (index, category, event) => {
    const newData = { ...category }; // Create a shallow copy of the category
    newData[index] = event.target.value; // Update the specific field with the raw input
    updateCategory(category, newData); // Update the state dynamically
  };
  
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

  const isNegative = (amount) => {
    return parseFloat(amount.replace('.', '').replace(',', '.'))
  }

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

  const toggleEditOverlay = () => {
    setIsEditOverlayVisible(!isEditOverlayVisible);
  };

  const updateData = () => {
    console.log(basicNeedsAccounts)
  };

  return (
    
    <div className="overview">
      {/* Sidebar */}
      <div className="sidebar">
        <button onClick={() => navigate("/overview")}>Overview</button>
        <button onClick={() => navigate("/transactions")}>Transactions</button>
        <button className="logout-button" onClick={handleLogout}>Logout</button>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        <h2>Financial Overview</h2>

        {/* Bank Overview Section */}
        <div className="bank-overview">
          <h3>Bank Overview for {monthYear}</h3>
          <div className="bank-details">
            <div>
              <strong>Main Account:</strong> {bankOverview.mainAccount ? formatCurrency(bankOverview.mainAccount) : 'Loading...'} €
            </div>
            <div>
              <strong>Savings Account:</strong> {bankOverview.savingsAccount ? formatCurrency(bankOverview.savingsAccount) : 'Loading...'} €
            </div>
          </div>
        </div>

        {/* Month-Year Dropdown */}
        <div className="dropdown-container">
          <label htmlFor="month-year-dropdown">Select Month/Year: </label>
          <select
            id="month-year-dropdown"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
          >
            <option value="2024-01">January 2024</option>
            <option value="2024-02">February 2024</option>
            <option value="2024-11">November 2024</option>
          </select>

          {/* Edit Provisions Button */}
          <button className="edit-provisions-button" onClick={toggleEditOverlay}>
            Edit Provisions
          </button>
        </div>

        <div className="category-group-wrapper">
          {/* Basic Categories Table */}
          <div className="category-group basic-needs-group">
            <h3 className="table-title">Basic Needs Accounts</h3>
            <div className="table-container">
              <table className="financial-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Initial Budget</th>
                    <th>Provisions</th>
                    <th>Transactions</th>
                    <th>Current Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {basicNeedsAccounts.map((category, index) => (
                    <tr key={index}>
                      <td classname='account-cell'>{category.name}</td>
                      <td>{category.initial_balance} €</td>
                      <td className='provision-cell'>{category.provision} €</td>
                      <td className="transaction-cell">
                        {category.transactions} €
                      </td>

                      <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                      {category.current_balance} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Basic Categories Table */}
          <div className="category-group entertainment-group">
            <h3 className="table-title">Daily Needs Accounts</h3>
            <div className="table-container">
              <table className="financial-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Initial Budget</th>
                    <th>Provisions</th>
                    <th>Transactions</th>
                    <th>Current Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {dailyNeedsAccounts.map((category, index) => (
                    <tr key={index}>
                      <td>{category.name}</td>
                      <td>{category.initial_balance} €</td>
                      <td className='provision-cell'>{category.provision} €</td>
                      <td className="transaction-cell">
                        {category.transactions} €
                      </td>
                      <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                      {category.current_balance} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="category-group-wrapper">
          {/* Basic Categories Table */}
          <div className="category-group basic-needs-group">
            <h3 className="table-title">Entertainments Accounts</h3>
            <div className="table-container">
              <table className="financial-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Initial Budget</th>
                    <th>Provisions</th>
                    <th>Transactions</th>
                    <th>Current Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {entertainmentsAccounts.map((category, index) => (
                    <tr key={index}>
                      <td classname='account-cell'>{category.name}</td>
                      <td>{category.initial_balance} €</td>
                      <td className='provision-cell'>{category.provision} €</td>
                      <td className="transaction-cell">
                        {category.transactions} €
                      </td>
                      <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                      {category.current_balance} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Basic Categories Table */}
          <div className="category-group entertainment-group">
            <h3 className="table-title">Savings Accounts</h3>
            <div className="table-container">
              <table className="financial-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Initial Budget</th>
                    <th>Provisions</th>
                    <th>Transactions</th>
                    <th>Current Budget</th>
                  </tr>
                </thead>
                <tbody>
                  {savingsAccounts.map((category, index) => (
                    <tr key={index}>
                      <td>{category.name}</td>
                      <td>{category.initial_balance} €</td>
                      <td className='provision-cell'>{category.provision} €</td>
                      <td className="transaction-cell">
                        {category.transactions} €
                      </td>
                      <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                      {category.current_balance} €
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        {/* Overlay for Edit Provisions */}
        {isEditOverlayVisible && (
          <div className="overlay">
            <div className="overlay-content">
              <div className="form-container">
                <table className="financial-table">
                  <thead>
                    <tr>
                      <th>Name</th>
                      <th>Initial Budget</th>
                      <th>Provisions</th>
                      <th>Transactions</th>
                      <th>Current Budget</th>
                    </tr>
                  </thead>
                  <tbody>
                    {basicNeedsAccounts.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{category.initial_balance} €</td>
                        <td>
                          <input
                            type="text"
                            value={category.provision} 
                            onChange={(e) => handleProvisionChange(index, basicNeedsAccounts, e)} 
                            onBlur={() => handleProvisionBlur(index, basicNeedsAccounts)} 
                            placeholder="Enter provision"
                          />
                        </td>
                        <td className="transaction-cell">
                          {category.transactions} €
                        </td>

                        <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                        {category.current_balance} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={updateData}>Save</button>
                <button onClick={toggleEditOverlay}>Close</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
  }

export default Home;
