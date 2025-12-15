import React, { useState, useEffect } from 'react';
import { 
  getCashierServiceOrders, 
  getCashierBillingDetails, 
  processPayment, 
  createAndSignGatepass, 
  returnDocumentsToSA 
} from '../services/api';

const CashierDashboard = ({ token }) => {
  const [serviceOrders, setServiceOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [billingDetails, setBillingDetails] = useState(null);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showGatepassForm, setShowGatepassForm] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    paymentMethod: 'Cash',
    amount: 0,
    amountReceived: 0,
    cashierNotes: ''
  });
  const [gatepassForm, setGatepassForm] = useState({
    signatureData: '',
    additionalServices: [],
    specialInstructions: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchServiceOrdersForPayment();
  }, []);

  const fetchServiceOrdersForPayment = async () => {
    try {
      setLoading(true);
      const response = await getCashierServiceOrders();
      setServiceOrders(response.data);
    } catch (err) {
      console.error(err);
      setMessage('Error fetching service orders');
    } finally {
      setLoading(false);
    }
  };

  const fetchBillingDetails = async (serviceOrderId) => {
    try {
      const response = await getCashierBillingDetails(serviceOrderId);
      setBillingDetails(response.data);
      setPaymentForm(prev => ({ ...prev, amount: response.data.totalAmount }));
    } catch (err) {
      console.error(err);
      setMessage('Error fetching billing details');
    }
  };

  const handleSelectOrder = async (order) => {
    setSelectedOrder(order);
    await fetchBillingDetails(order._id);
    setShowPaymentForm(false);
    setShowGatepassForm(false);
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentForm(prev => ({ ...prev, paymentMethod: method }));
  };

  const handleProcessPayment = async () => {
    if (!selectedOrder || !billingDetails) return;

    try {
      setLoading(true);
      const paymentData = {
        ...paymentForm,
        // Only include relevant fields based on payment method
        ...(paymentForm.paymentMethod === 'Card' && {
          cardNumber: paymentForm.cardNumber,
          cardType: paymentForm.cardType,
          expiryDate: paymentForm.expiryDate,
          authorizationCode: paymentForm.authorizationCode
        }),
        ...(paymentForm.paymentMethod === 'Online' && {
          transactionId: paymentForm.transactionId,
          gateway: paymentForm.gateway,
          referenceNumber: paymentForm.referenceNumber
        }),
        ...(paymentForm.paymentMethod === 'Check' && {
          checkNumber: paymentForm.checkNumber,
          bankName: paymentForm.bankName,
          accountNumber: paymentForm.accountNumber,
          routingNumber: paymentForm.routingNumber
        }),
        ...(paymentForm.paymentMethod === 'Corporate Account' && {
          companyName: paymentForm.companyName,
          accountNumber: paymentForm.corporateAccountNumber,
          purchaseOrderNumber: paymentForm.purchaseOrderNumber,
          creditLimit: paymentForm.creditLimit,
          approvalCode: paymentForm.approvalCode
        }),
        ...(paymentForm.paymentMethod === 'Government Account' && {
          agencyName: paymentForm.agencyName,
          department: paymentForm.department,
          budgetCode: paymentForm.budgetCode,
          authorizationNumber: paymentForm.authorizationNumber
        })
      };

      const response = await processPayment(selectedOrder._id, paymentData);

      setMessage('Payment processed successfully!');
      setShowPaymentForm(false);
      fetchServiceOrdersForPayment();
      
      // Reset form
      setPaymentForm({
        paymentMethod: 'Cash',
        amount: 0,
        amountReceived: 0,
        cashierNotes: ''
      });
    } catch (err) {
      console.error(err);
      setMessage('Error processing payment');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGatepass = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      const response = await createAndSignGatepass(selectedOrder._id, gatepassForm);

      setMessage('Gatepass created and signed successfully!');
      setShowGatepassForm(false);
      
      // Reset form
      setGatepassForm({
        signatureData: '',
        additionalServices: [],
        specialInstructions: ''
      });
    } catch (err) {
      console.error(err);
      setMessage('Error creating gatepass');
    } finally {
      setLoading(false);
    }
  };

  const handleReturnToSA = async () => {
    if (!selectedOrder) return;

    try {
      setLoading(true);
      await returnDocumentsToSA(selectedOrder._id);

      setMessage('Documents returned to Service Advisor successfully!');
      fetchServiceOrdersForPayment();
      setSelectedOrder(null);
      setBillingDetails(null);
    } catch (err) {
      console.error(err);
      setMessage('Error returning documents');
    } finally {
      setLoading(false);
    }
  };

  const renderPaymentForm = () => {
    if (!showPaymentForm || !selectedOrder || !billingDetails) return null;

    return (
      <div className="card mt-3">
        <div className="card-header">
          <h5>Process Payment - {selectedOrder._id}</h5>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <h6>Amount: ${billingDetails.totalAmount}</h6>
              
              <div className="mb-3">
                <label className="form-label">Payment Method</label>
                <select 
                  className="form-select"
                  value={paymentForm.paymentMethod}
                  onChange={(e) => handlePaymentMethodChange(e.target.value)}
                >
                  <option value="Cash">Cash</option>
                  <option value="Card">Card</option>
                  <option value="Online">Online</option>
                  <option value="Check">Check</option>
                  <option value="Corporate Account">Corporate Account</option>
                  <option value="Government Account">Government Account</option>
                </select>
              </div>

              {paymentForm.paymentMethod === 'Cash' && (
                <div className="mb-3">
                  <label className="form-label">Amount Received</label>
                  <input
                    type="number"
                    className="form-control"
                    value={paymentForm.amountReceived}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, amountReceived: parseFloat(e.target.value) || 0 }))}
                  />
                  {paymentForm.amountReceived > paymentForm.amount && (
                    <small className="text-success">Change: ${(paymentForm.amountReceived - paymentForm.amount).toFixed(2)}</small>
                  )}
                </div>
              )}

              {paymentForm.paymentMethod === 'Card' && (
                <div className="mb-3">
                  <label className="form-label">Card Number (Last 4 digits)</label>
                  <input
                    type="text"
                    className="form-control"
                    maxLength="4"
                    value={paymentForm.cardNumber || ''}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardNumber: e.target.value }))}
                  />
                  <label className="form-label">Card Type</label>
                  <select
                    className="form-select"
                    value={paymentForm.cardType || ''}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, cardType: e.target.value }))}
                  >
                    <option value="">Select Card Type</option>
                    <option value="Visa">Visa</option>
                    <option value="MasterCard">MasterCard</option>
                    <option value="American Express">American Express</option>
                  </select>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Cashier Notes</label>
                <textarea
                  className="form-control"
                  value={paymentForm.cashierNotes}
                  onChange={(e) => setPaymentForm(prev => ({ ...prev, cashierNotes: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="d-flex gap-2">
            <button 
              className="btn btn-primary"
              onClick={handleProcessPayment}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Process Payment'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowPaymentForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderGatepassForm = () => {
    if (!showGatepassForm || !selectedOrder) return null;

    return (
      <div className="card mt-3">
        <div className="card-header">
          <h5>Create and Sign Gatepass - {selectedOrder._id}</h5>
        </div>
        <div className="card-body">
          <div className="mb-3">
            <label className="form-label">Digital Signature</label>
            <input
              type="text"
              className="form-control"
              placeholder="Enter your initials or signature"
              value={gatepassForm.signatureData}
              onChange={(e) => setGatepassForm(prev => ({ ...prev, signatureData: e.target.value }))}
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Special Instructions</label>
            <textarea
              className="form-control"
              value={gatepassForm.specialInstructions}
              onChange={(e) => setGatepassForm(prev => ({ ...prev, specialInstructions: e.target.value }))}
            />
          </div>

          <div className="d-flex gap-2">
            <button 
              className="btn btn-success"
              onClick={handleCreateGatepass}
              disabled={loading || !gatepassForm.signatureData}
            >
              {loading ? 'Creating...' : 'Create & Sign Gatepass'}
            </button>
            <button 
              className="btn btn-secondary"
              onClick={() => setShowGatepassForm(false)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <h1>Cashier Dashboard</h1>
      
      {message && (
        <div className="alert alert-info" role="alert">
          {message}
        </div>
      )}

      <div className="row">
        <div className="col-md-6">
          <h3>Service Orders Ready for Payment</h3>
          {loading && <div className="text-center">Loading...</div>}
          
          <div className="list-group">
            {serviceOrders.map(order => (
              <button
                key={order._id}
                className={`list-group-item list-group-item-action ${selectedOrder?._id === order._id ? 'active' : ''}`}
                onClick={() => handleSelectOrder(order)}
              >
                <div className="d-flex w-100 justify-content-between">
                  <h6 className="mb-1">SO: {order._id}</h6>
                  <small>Status: {order.status}</small>
                </div>
                <p className="mb-1">
                  Customer: {order.customerId?.name || 'N/A'} | 
                  Vehicle: {order.vehicleId?.plateNumber || 'N/A'}
                </p>
                <small>Updated: {new Date(order.updatedAt).toLocaleDateString()}</small>
              </button>
            ))}
          </div>
        </div>

        <div className="col-md-6">
          {selectedOrder && (
            <>
              <h3>Order Details</h3>
              <div className="card">
                <div className="card-body">
                  <h5>Service Order: {selectedOrder._id}</h5>
                  <p><strong>Customer:</strong> {selectedOrder.customerId?.name}</p>
                  <p><strong>Vehicle:</strong> {selectedOrder.vehicleId?.plateNumber} ({selectedOrder.vehicleId?.model})</p>
                  <p><strong>Status:</strong> {selectedOrder.status}</p>
                  
                  {billingDetails && (
                    <div className="mt-3">
                      <h6>Billing Details:</h6>
                      <p><strong>Total Amount:</strong> ${billingDetails.totalAmount}</p>
                      <p><strong>Billing Number:</strong> {billingDetails.billingNumber}</p>
                      <p><strong>Status:</strong> {billingDetails.status}</p>
                    </div>
                  )}

                  <div className="d-grid gap-2 mt-3">
                    <button 
                      className="btn btn-primary"
                      onClick={() => setShowPaymentForm(true)}
                      disabled={selectedOrder.status !== 'Completed'}
                    >
                      Process Payment
                    </button>
                    <button 
                      className="btn btn-success"
                      onClick={() => setShowGatepassForm(true)}
                      disabled={selectedOrder.status !== 'Paid' && selectedOrder.status !== 'Charge Account Pending'}
                    >
                      Create & Sign Gatepass
                    </button>
                    <button 
                      className="btn btn-info"
                      onClick={handleReturnToSA}
                      disabled={!billingDetails || billingDetails.status !== 'Paid'}
                    >
                      Return Documents to SA
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {renderPaymentForm()}
      {renderGatepassForm()}
    </div>
  );
};

export default CashierDashboard;