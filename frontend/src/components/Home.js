import React, { useState, useEffect } from 'react';
import { useNavigate } from "react-router-dom";
import '../styles/Home.css'; // Import the CSS file for styling
import '../styles/InitUserData.css';

import CustomLambdaInvocation from '../utils/CustomLambdaInvocation';

function Home() {
  const [basicCategories, setBasicCategories] = useState([]);
  const [entertainmentCategories, setEntertainmentCategories] = useState([]);
  const [bankOverview, setBankOverview] = useState({});
  const [monthYear, setMonthYear] = useState(null);

  const [idToken, setIdToken] = useState(null);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);

  const [isInitDataSubmitted, setIsInitDataSubmitted] = useState(null);
  const [initialBalances, setInitialBalances] = useState({});

  const navigate = useNavigate();

  const [isOverlayVisible, setIsOverlayVisible] = useState(false);
  const [isEditOverlayVisible, setIsEditOverlayVisible] = useState(false);

  const lambdaInvoker = new CustomLambdaInvocation();

  const defaultCategories = [
    'Affitto', 'Elettricità', 'Assicurazione', 'Alimentari', 'Uscite'
  ]

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
        fetchData(JSON.parse(result.body));
      } catch (error) {
        console.error("Something went wrong:", error);
      }
    };

    console.log(storedIdToken)
    checkUserDataInit(storedIdToken)
    
    // Fetch financial data
    const fetchData = async (data) => {
      try {
        setBasicCategories(data);
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

  const handleProvisionChange = (index, category, event) => {
    let value = event.target.value.toString(); // Take the input as-is
    // value = value.replace(",", ".")
    
    const newData = [...category];
    newData[index].provision = value;

    category === basicCategories ? setBasicCategories(newData) : setEntertainmentCategories(newData);
  };
  
  const handleProvisionBlur = (index, category) => {
    const newData = [...category];
    let provisions = newData[index].provision.replace(',', '.');
    let initial_balance = parseFloat(newData[index].initial_balance.replace(',', '.'))
    let transactions = parseFloat(newData[index].transactions.replace(',', '.'))

    if (!isNaN(parseFloat(provisions))) {
      provisions = parseFloat(parseFloat(provisions).toFixed(2));
      let current_balance = initial_balance + provisions - transactions
      newData[index].current_balance = formatCurrency(current_balance)
      newData[index].provision = formatCurrency(provisions)
    } else {
      let current_balance = initial_balance - transactions
      newData[index].current_balance = formatCurrency(current_balance)
      newData[index].provision = formatCurrency(0);
    }

    const functionName = "UserDataUpdater";
    const payload = { idToken, newData };
    lambdaInvoker.invoke(functionName, payload)

    // Update state for the correct category
    category === basicCategories ? setBasicCategories(newData) : setEntertainmentCategories(newData);
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

  const onSubmitInitData = (event) => {
    event.preventDefault();

    setIsOverlayVisible(false);

    const formInputs = event.target.elements;
    const startMonth = formInputs['startmonth'].value
    const currency = formInputs['currency'].value
    const balances = defaultCategories.reduce((acc, category, index) => {
      acc[category] = formInputs[`field-${index + 1}`].value;
      return acc;
    }, {});

    // setInitialBalances(balances);
    

    // Now you can process or save initialBalances
    //console.log(balances);

    // Authenticate
    const initializeUserData = async () => {
      try {
          const functionName = "InitializeUserData";
          const payload = { idToken, startMonth, currency, balances };
          const result = await lambdaInvoker.invoke(functionName, payload)
          //console.log(result)
          const statusCode = result.statusCode;
          const body = JSON.parse(result.body);
          if (statusCode === 200){
            setIsInitDataSubmitted(true);
            //navigate("/overview")
          } else {
            setIsInitDataSubmitted(false);
            console.error("Login failed:", result);
            alert("You have provided invalid amounts! Please try again.");
            //navigate("/overview")
          return result
          }
  
      } catch (error) {
          console.error("Failed to authenticate:", error);
      }
    };

    initializeUserData();
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

        {/* Basic Categories Table */}
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
              {basicCategories.map((category, index) => (
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

        {/* Basic Categories Table */}
        <h3 className="table-title">Entertainment Accounts</h3>
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
              {entertainmentCategories.map((category, index) => (
                <tr key={index}>
                  <td>{category.name}</td>
                  <td>{category.initial_balance} €</td>
                  <td className='provisions-cell'>{category.provision} €</td>
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
                    {basicCategories.map((category, index) => (
                      <tr key={index}>
                        <td>{category.name}</td>
                        <td>{category.initial_balance} €</td>
                        <td>
                          <input
                            type="text"
                            value={category.provision} 
                            onChange={(e) => handleProvisionChange(index, basicCategories, e)} 
                            onBlur={() => handleProvisionBlur(index, basicCategories)} 
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
                <button onClick={toggleEditOverlay}>Save</button>
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
