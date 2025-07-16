import React, { useState, useEffect } from 'react';
import axios from 'axios';
import SideBar from '../components/side_bar';
import TopNavbar from '../components/top_navbar';
import './css/manageCheckouts.css';

const ManageCheckouts = () => {
  const [checkouts, setCheckouts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [confirmationModal, setConfirmationModal] = useState({
    isVisible: false,
    checkoutId: null,
    action: '',
    note: '',
  });
  const [currentPage, setCurrentPage] = useState(1); 
  const [totalPages, setTotalPages] = useState(1); 

  const apiUrl = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const fetchCheckouts = async () => {
      try {
        const token = localStorage.getItem('authToken'); 
        const response = await axios.get(
          `${apiUrl}/api/checkout/all-checkouts?page=1&limit=20`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.status === 200) {
          const sortedCheckouts = response.data.checkouts
            .map((checkout) => ({
              ...checkout,
              quantity: checkout.quantity || 0,
              totalPrice: checkout.totalPrice || 0,
              BuyerStatus: checkout.BuyerStatus || 'NotYetReceived', 
            }))
            .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
          setCheckouts(sortedCheckouts || []);
          setTotalPages(response.data.totalPages || 1);
        }
      } catch (error) {
        console.error('Error fetching checkouts:', error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchCheckouts();
  }, [currentPage]);

  const handleUpdateStatus = async () => {
    const { checkoutId, action, note } = confirmationModal;

    try {
      const token = localStorage.getItem('authToken'); 
      const response = await axios.patch(
        `http://localhost:5000/api/checkout-status/${checkoutId}`, 
        { status: action, approvalNote: note }, 
        { headers: { Authorization: `Bearer ${token}` } } 
      );

      if (response.status === 200) {
        setCheckouts((prevCheckouts) =>
          prevCheckouts.map((checkout) =>
            checkout._id === checkoutId
              ? {
                  ...checkout,
                  status: action,
                  approvedAt:
                    action === 'Approved'
                      ? new Date().toISOString()
                      : checkout.approvedAt, 
                  approvalNote: response.data.checkout.approvalNote,
                }
              : checkout
          )
        );
      }
      setConfirmationModal({ isVisible: false, checkoutId: null, action: '', note: '' });
    } catch (error) {
      console.error('Error updating checkout status:', error.message);
      alert(
        `Failed to update checkout status.\nStatus: ${error.response?.status}\nMessage: ${
          error.response?.data?.message || 'An error occurred.'
        }`
      ); 
    }
  };

  const openConfirmationModal = (checkoutId, action) => {
    console.log('Opening modal for checkoutId:', checkoutId); 
    setConfirmationModal({ isVisible: true, checkoutId, action, note: '' });
  };

  const closeConfirmationModal = () => {
    setConfirmationModal({ isVisible: false, checkoutId: null, action: '', note: '' });
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) setCurrentPage((prevPage) => prevPage - 1);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) setCurrentPage((prevPage) => prevPage + 1);
  };

  return (
    <div className="mcheckouts-main">
      <TopNavbar />
      <main className="mcheckouts-main-content">
        <SideBar />
        <div className="mcheckouts-admin-content">
          <h1 className="mcheckouts-title">Manage User Checkouts</h1>

          {loading ? (
            <p className="mcheckouts-loading-message">Loading...</p>
          ) : checkouts.length > 0 ? (
            <>
              <div className="mcheckouts-table-container">
                <table className="mcheckouts-table">
                  <thead>
                    <tr>
                      <th>User Name</th>
                      <th>Listing ID</th>
                      <th>Seller Name</th>
                      <th>Bank</th>
                      <th>Reference No</th>
                      <th>Proof</th>
                      <th>Submitted At</th>
                      <th>Approved At</th>
                      <th>Status</th>
                      <th>Buyer Status</th>
                      <th>Approval Note</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {checkouts.map((checkout) => (
                      <tr key={checkout._id}>
                        <td>
                          {checkout.userId
                            ? `${checkout.userId.first_name} ${checkout.userId.last_name}`
                            : 'Unknown User'}
                        </td>
                        <td>{checkout.listingId?.identifier || 'No Listing ID'}</td>
                        <td>{checkout.listingId?.userId.first_name || 'No Seller'}</td>
                        <td>{checkout.bank}</td>
                        <td>{checkout.referenceNumber}</td>
                        <td>
  <a href={checkout.proofImage} target="_blank" rel="noreferrer" className="hyperlink">
    View Image
  </a>
</td>
                        <td>
                          {checkout.submittedAt
                            ? new Date(checkout.submittedAt).toLocaleString()
                            : 'Not Available'}
                        </td>
                        <td>
                          {checkout.approvedAt
                            ? new Date(checkout.approvedAt).toLocaleString()
                            : 'Pending'}
                        </td>
                        <td>{checkout.status}</td>
                        <td>{checkout.BuyerStatus || 'NotYetReceived'}</td>
                        <td>{checkout.approvalNote || 'N/A'}</td>
                        <td>
                          {checkout.status === 'Pending' && (
                            <>
                              <button
                                className="mcheckouts-button mcheckouts-approve-button"
                                onClick={() => openConfirmationModal(checkout._id, 'Approved')}
                              >
                                Approve
                              </button>
                              <button
                                className="mcheckouts-button mcheckouts-reject-button"
                                onClick={() => openConfirmationModal(checkout._id, 'Rejected')}
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="pagination-controls">
                <button onClick={goToPreviousPage} disabled={currentPage === 1}>
                  Previous
                </button>
                <span>
                  Page {currentPage} of {totalPages}
                </span>
                <button onClick={goToNextPage} disabled={currentPage === totalPages}>
                  Next
                </button>
              </div>
            </>
          ) : (
            <p>No checkouts available.</p>
          )}
        </div>
      </main>

      {confirmationModal.isVisible && (
        <div className="mcheckouts-modal-overlay">
          <div className="mcheckouts-modal-content">
            <p>
              Are you sure you want to{' '}
              {confirmationModal.action === 'Approved' ? 'approve' : 'reject'} this payment?
            </p>
            <textarea
              value={confirmationModal.note}
              onChange={(e) =>
                setConfirmationModal((prev) => ({ ...prev, note: e.target.value }))
              } 
              placeholder="Add a note (optional)..."
              className="mcheckouts-note-input"
            ></textarea>
            <button className="mcheckouts-modal-button" onClick={handleUpdateStatus}>
              Confirm
            </button>
            <button className="mcheckouts-modal-button" onClick={closeConfirmationModal}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCheckouts;