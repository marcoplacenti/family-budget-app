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

  const [basicNeedsAccountsEditProvisions, setBasicNeedsEditProvisions] = useState([]);
  const [entertainmentsAccountsEditProvisions, setEntertainmentsEditProvisions] = useState([]);
  const [dailyNeedsAccountsEditProvisions, setDailyNeedsEditProvisions] = useState([]);
  const [savingsAccountsEditProvisions, setSavingsEditProvisions] = useState([]);

  const [bankOverview, setBankOverview] = useState({});
  const [selectedPeriod, setSelectedPeriod] = useState(null); 
  const [availableMonths, setAvailableMonths] = useState([]); 

  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const [refreshFlag, setRefreshFlag] = useState(null)

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

    const fetchUserData = async (idToken, period) => {
      try {
        const functionName = "UserDataFetcher";
        const payload = { idToken, period };
        const result = await lambdaInvoker.invoke(functionName, payload)
        console.log(result)
        const statusCode = result.statusCode;
        fetchPeriods(JSON.parse(result.availablePeriods));
        fetchData(JSON.parse(result.accountsData));
      } catch (error) {
        console.error("Something went wrong:", error);
      }
    };

    console.log(storedIdToken)
    fetchUserData(storedIdToken, null)

  }, [refreshFlag]);

  // Fetch financial data
  const fetchData = async (data) => {
    try {
      setBasicNeeds(data.filter(item => item.category === "basic"));
      setDailyNeeds(data.filter(item => item.category === "daily"));
      setEntertainments(data.filter(item => item.category === "entertainment"));
      setSavings(data.filter(item => item.category === "saving"));

      setBasicNeedsEditProvisions(data.filter(item => item.category === "basic"));
      setDailyNeedsEditProvisions(data.filter(item => item.category === "daily"));
      setEntertainmentsEditProvisions(data.filter(item => item.category === "entertainment"));
      setSavingsEditProvisions(data.filter(item => item.category === "saving"));
      // setEntertainmentCategories(entertainment);
    } catch (error) {
      console.error("Failed to fetch financial data:", error);
    }
  };

  const fetchPeriods = async (data) => {
    try {
      console.log(data.available_periods)
      // console.log(Array.isArray(data.available_periods))
      // setAvailablePeriods([data.available_periods])
      // console.log(availablePeriods)
      // const months = ["2024-11", "2024-12", "2025-01"].reverse();
      setAvailableMonths(data.available_periods.reverse())
      setSelectedPeriod(availableMonths[0])
      sessionStorage.setItem('availableMonths', data.available_periods.reverse())
      sessionStorage.setItem('selectedPeriod', data.available_periods.reverse()[0])
      // setEntertainmentCategories(entertainment);
    } catch (error) {
      console.error("Problem with periods:", error);
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

  const updateCategory = (category, newData) => {
    console.log(newData)
    if (category === 'basic') {
      setBasicNeedsEditProvisions(newData)
    }

    if (category === 'daily') {
      setDailyNeedsEditProvisions(newData)
    }

    if (category === 'entertainment') {
      setEntertainmentsEditProvisions(newData)
    }

    if (category === 'saving') {
      setSavingsEditProvisions(newData)
    }
  }

  const handleProvisionChange = (index, accountsData, event) => {
    const copyaccountData = structuredClone(accountsData); 
    copyaccountData[index].provision = event.target.value
    const category = copyaccountData[index].category
    updateCategory(category, copyaccountData); // Update the state dynamically
  };

  const updateCurrentBalance = (data) => {
    console.log(data)
    let initialBalance = parseFloat(data.initial_balance.replace('.', '').replace(',', '.'));
    let provision = parseFloat(data.provision.replace('.', '').replace(',', '.'));
    let transactions = parseFloat(data.transactions.replace('.', '').replace(',', '.'));
    let currentBalance = initialBalance + provision - transactions

    console.log(currentBalance)
  }
  
  const handleProvisionBlur = (index, accountsData) => {
    const copyaccountData = structuredClone(accountsData); 
    let value = copyaccountData[index].provision; // Get the current value
    value = value.replace('.', '').replace(',', '.'); // Normalize for parsing
    let category = copyaccountData[index].category
    
    // Check if it's a valid number
    if (!isNaN(parseFloat(value)) && isFinite(value)) {
      // Format it as currency
      value = formatCurrency(parseFloat(value));
    } else {
      alert("Invalid value. Will be reset to 0.")
      // Set to "0,00" if invalid
      value = "0,00";
    }
  
    copyaccountData[index].provision = value; // Update the value in the copied category
    updateCurrentBalance(copyaccountData[index])
    updateCategory(category, copyaccountData); // Update the state
  };

  const isNegative = (amount) => {
    return parseFloat(amount.replace('.', '').replace(',', '.'))
  }

  const currentBalance = (category) => {
    let initialBalance = parseFloat(category.initial_balance.replace('.', '').replace(',', '.'));
    let provision = parseFloat(category.provision.replace('.', '').replace(',', '.'));
    let transactions = parseFloat(category.transactions.replace('.', '').replace(',', '.'));
    let currentBalance = initialBalance + provision - transactions
    return formatCurrency(parseFloat(currentBalance))
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

  const openNextMonth = async () => {
    const functionName = "OpenNewPeriod";
    const payload = { idToken };
    const result = await lambdaInvoker.invoke(functionName, payload)
    const newPeriod = result.new_period
    updateData(newPeriod)
  }

  const updateData = async (period) => {

    const fetchUserDataByPeriod = async (idToken, period) => {
      try {
        const functionName = "UserDataFetcher";
        const payload = { idToken, period };
        const result = await lambdaInvoker.invoke(functionName, payload)
        const statusCode = result.statusCode;
        fetchData(JSON.parse(result.accountsData));
        sessionStorage.setItem('selectedPeriod', period)
      } catch (error) {
        console.error("Something went wrong:", error);
      }
    };

    console.log(idToken, period)
    fetchUserDataByPeriod(idToken, period)
  };

  const updateProvisions = async (data) => {
    console.log(sessionStorage.getItem('selectedPeriod'))
    console.log(basicNeedsAccountsEditProvisions)
    console.log(dailyNeedsAccountsEditProvisions)
    console.log(entertainmentsAccountsEditProvisions)
    console.log(savingsAccountsEditProvisions)

    /*
      HERE WE NEED TO INVOKE A LAMBDA TO UPDATE THE PROVISIONS AND THE CURRENT BALANCES
    */
    const updateProvisions = async (idToken, period, basic, daily, entertainment, saving) => {
      const functionName = "UserDataUpdater";
      const payload = { 
        idToken, 
        period, 
        basic,
        daily,
        entertainment,
        saving
      };
      const result = await lambdaInvoker.invoke(functionName, payload)
      //console.log(result)
    }
  
    updateProvisions(idToken, sessionStorage.getItem('selectedPeriod'), 
      basicNeedsAccountsEditProvisions, dailyNeedsAccountsEditProvisions,
      entertainmentsAccountsEditProvisions, savingsAccountsEditProvisions);

    updateData(sessionStorage.getItem('selectedPeriod'))
    setIsEditOverlayVisible(false)
    setRefreshFlag(generateRandomString())
  }

  function generateRandomString() {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let randomString = '';
    for (let i = 0; i < 16; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      randomString += characters.charAt(randomIndex);
    }
    return randomString;
  }

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
          <h3>Bank Overview for {sessionStorage.getItem('selectedPeriod')}</h3>
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
            value={sessionStorage.getItem('selectedPeriod')}
            onChange={(e) => updateData(e.target.value)}
          >
            {availableMonths.map((month) => (
              <option key={month} value={month}>{new Date(month + "-01").toLocaleString('default', { month: 'long', year: 'numeric' })}</option>
            ))}
          </select>

          {/* Edit Provisions Button */}
          <button className="edit-provisions-button" onClick={toggleEditOverlay}>
            Edit Provisions
          </button>
          <button className="edit-provisions-button" onClick={openNextMonth}>
            Open Next Month
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
                    {basicNeedsAccountsEditProvisions.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{category.initial_balance} €</td>
                        <td>
                          <input
                            type="text"
                            value={category.provision} 
                            onChange={(e) => handleProvisionChange(index, basicNeedsAccountsEditProvisions, e)} 
                            onBlur={() => handleProvisionBlur(index, basicNeedsAccountsEditProvisions)} 
                            placeholder="Enter provision"
                          />
                        </td>
                        <td className="transaction-cell">
                          {category.transactions} €
                        </td>

                        <td className={isNegative(category.current_balance) < 0 ? "negative" : "positive"}>
                        {currentBalance(category)} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <button onClick={updateProvisions}>Save</button>
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
