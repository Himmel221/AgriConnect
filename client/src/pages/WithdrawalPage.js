/* WithdrawalPage.js */

import React, { useState, useEffect } from 'react';
import TopNavbar from '../components/top_navbar';
import SideBar from '../components/side_bar';
import './css/WithdrawalPage.css';

const WithdrawalPage = () => {
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]); 
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState(''); 
  const [accountNumber, setAccountNumber] = useState('');
  const [accountName, setAccountName] = useState('');
  const [commissionFee, setCommissionFee] = useState(0);
  const [totalReceive, setTotalReceive] = useState(0); 
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false); 

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchData = async () => {
      const token = localStorage.getItem('authToken'); 
      try {
        const balanceResponse = await fetch(`${apiUrl}/api/withdraw/balance`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        const historyResponse = await fetch(`${apiUrl}/api/withdraw-history`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        console.log('Balance Response:', balanceResponse);
        console.log('History Response:', historyResponse);
  
        if (!balanceResponse.ok) {
          console.error('Error fetching balance:', balanceResponse.status);
          return;
        }
        if (!historyResponse.ok) {
          console.error('Error fetching history:', historyResponse.status);
          setHistory([]); 
        }
  
        const balanceResult = await balanceResponse.json();
        const historyResult = historyResponse.ok ? await historyResponse.json() : { history: [] };
  
        console.log('Parsed Balance:', balanceResult); 
        console.log('Parsed History:', historyResult); 
  
        setBalance(balanceResult.sellerBalance || 0); 
        setHistory(historyResult.history || []); 
      } catch (error) {
        console.error('Error fetching data:', error.message);
      }
    };
    fetchData();
  }, []);

  const handleWithdraw = async () => {
    setLoading(true);
  
    const token = localStorage.getItem('authToken');
    try {
      const response = await fetch(`${apiUrl}/api/withdraw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amount: withdrawAmount,
          method: withdrawMethod,
          accountNumber,
          accountName,
        }),
      });
  
      if (response.ok) {
        alert('Withdrawal successful!');
        setBalance((prev) => prev - parseFloat(withdrawAmount)); 
        setHistory((prev) => [
          ...prev,
          {
            method: withdrawMethod,
            amount: withdrawAmount,
            date: new Date().toLocaleString(),
          },
        ]); 
        setShowModal(false);
        setWithdrawAmount('');
        setWithdrawMethod('');
        setAccountNumber('');
        setAccountName('');
      } else {
        const result = await response.json();
        alert(`Withdrawal failed: ${result.message}`);
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const commission = withdrawAmount ? withdrawAmount * 0.01 : 0;
    setCommissionFee(commission.toFixed(2));
    setTotalReceive((withdrawAmount - commission).toFixed(2));
  }, [withdrawAmount]);

  return (
    <>
      <TopNavbar />
      <SideBar />
      <div className="withdraw-page">
        <h1>Withdraw Funds</h1>
        
        {}
        <div className="withdraw-funds-section">
          <div className="withdraw-balance">
          <p>Current Balance: ₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
            <button onClick={() => setShowModal(true)} className="withdraw-btn">
              Withdraw
            </button>
          </div>
        </div>

        {}
        <div className="withdraw-history-section">
          <h2>Withdrawal History</h2>
          <ul className="withdraw-history">
            {history.length > 0 ? (
              history.map((entry, index) => (
                <li key={index}>
                  <p>
                    <strong>Amount:</strong> ₱{entry.amount.toFixed(2)}
                  </p>
                  <p>
                    <strong>Method:</strong> {entry.method}
                  </p>
                  <p>
                    <strong>Date:</strong> {entry.date}
                  </p>
                </li>
              ))
            ) : (
              <p>No withdrawal history available.</p>
            )}
          </ul>
        </div>

        {showModal && (
          <div className="withdraw-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="withdraw-modal" onClick={(e) => e.stopPropagation()}>
              <h2>Withdraw Funds</h2>
              
              <div className="withdraw-modal-form-group">
              <label>Available Balance</label>
              <p>₱{balance.toLocaleString('en-PH', { minimumFractionDigits: 2 })}</p>
              </div>

              <div className="withdraw-modal-form-group">
                <label>Withdrawal Method</label>
                <select
                  value={withdrawMethod}
                  onChange={(e) => setWithdrawMethod(e.target.value)}
                  className="withdraw-method"
                >
                  <option value="" disabled>Select Method</option>
                  <option value="Bank #1">Bank #1</option>
                  <option value="Bank #2">Bank #2</option>
                  <option value="Bank #3">Bank #3</option>
                </select>
              </div>

              <div className="withdraw-modal-form-group">
                <label>Account Number</label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="Enter Account Number"
                />
              </div>

              <div className="withdraw-modal-form-group">
                <label>Account Name</label>
                <input
                  type="text"
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value)}
                  placeholder="Enter Account Name"
                />
              </div>

              <div className="withdraw-modal-form-group">
                <label>Amount to Withdraw</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder="Enter Amount"
                />
              </div>

              <div className="withdraw-modal-summary">
                <p>
                  <span>Commission (1%)</span>
                  <span>₱{commissionFee}</span>
                </p>
                <p>
                  <span>Total to Receive</span>
                  <span>₱{totalReceive}</span>
                </p>
              </div>

              <div className="withdraw-modal-buttons">
                <button
                  onClick={handleWithdraw}
                  disabled={loading || !withdrawAmount || !withdrawMethod || !accountNumber || !accountName}
                >
                  {loading ? 'Processing...' : 'Confirm Withdrawal'}
                </button>
                <button onClick={() => setShowModal(false)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default WithdrawalPage;