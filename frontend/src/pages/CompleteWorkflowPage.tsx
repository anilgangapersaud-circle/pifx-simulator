import React, { useState, useEffect } from 'react';
import { AppState } from '../App';
import QuoteCreationForm from '../components/QuoteCreationForm';
import TradeCreationForm from '../components/TradeCreationForm';
import GetTradesForm from '../components/GetTradesForm';
import GetSignaturesForm from '../components/GetSignaturesForm';
import SignTypedDataForm from '../components/SignTypedDataForm';
import RegisterSignatureForm from '../components/RegisterSignatureForm';
import TakerDeliverForm from '../components/TakerDeliverForm';
import ResponseDisplay from '../components/ResponseDisplay';

interface CompleteWorkflowPageProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

type WorkflowStep = 'quote' | 'trade' | 'getTrades' | 'presign' | 'sign' | 'register' | 'deliver' | 'complete';
type FlowType = 'taker' | 'maker';

const CompleteWorkflowPage: React.FC<CompleteWorkflowPageProps> = ({ state, updateState }) => {
  const [flowType, setFlowType] = useState<FlowType>('taker');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('quote');
  
  // Initialize flow type in global state when component mounts
  useEffect(() => {
    updateState({ currentFlowType: flowType });
  }, []); // Run once on mount
  const [workflowData, setWorkflowData] = useState({
    quoteResponse: null as any,
    tradeResponse: null as any,
    getTradesResponse: null as any,
    presignResponse: null as any,
    signResponse: null as any,
    registerResponse: null as any,
    deliveryResponse: null as any,
    quoteComplete: false,
    tradeComplete: false,
    getTradesComplete: false,
    presignComplete: false,
    signComplete: false,
    registerComplete: false,
    deliveryComplete: false
  });

  // Step-specific update handlers
  const handleQuoteUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful quote response, advance to trade step
    if (updates.quoteResponse && !updates.quoteError && !updates.quoteLoading) {
      setWorkflowData(prev => ({
        ...prev,
        quoteResponse: updates.quoteResponse,
        quoteComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handleTradeUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful trade response, advance to presign step
    if (updates.tradeResponse && !updates.tradeError && !updates.tradeLoading) {
      setWorkflowData(prev => ({
        ...prev,
        tradeResponse: updates.tradeResponse,
        tradeComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handleGetTradesUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful get trades response, advance to presign step
    if (updates.response && !updates.error && !updates.loading) {
      setWorkflowData(prev => ({
        ...prev,
        getTradesResponse: updates.response,
        getTradesComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handlePresignUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful presign response, advance to signing step
    if (updates.response && !updates.error && !updates.loading) {
      setWorkflowData(prev => ({
        ...prev,
        presignResponse: updates.response,
        presignComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handleSignUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful signing response, advance to register step
    if (updates.signingResponse && !updates.signingError && !updates.signingLoading) {
      setWorkflowData(prev => ({
        ...prev,
        signResponse: updates.signingResponse,
        signComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handleRegisterUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful registration response, advance to delivery step
    if (updates.registrationResponse && !updates.registrationError && !updates.registrationLoading) {
      setWorkflowData(prev => ({
        ...prev,
        registerResponse: updates.registrationResponse,
        registerComplete: true
      }));
      
      // User must manually proceed to next step
    }
  };

  const handleDeliveryUpdate = (updates: Partial<AppState>) => {
    updateState(updates);
    
    // If we got a successful delivery response, mark as complete and auto-advance
    if (updates.response && !updates.error && !updates.loading) {
      setWorkflowData(prev => ({
        ...prev,
        deliveryResponse: updates.response,
        deliveryComplete: true
      }));
      
      // Automatically move to complete step after successful delivery
      setTimeout(() => {
        setCurrentStep('complete');
      }, 1000); // Small delay to show success message briefly
    }
  };

  const resetWorkflow = () => {
    // Set initial step based on flow type
    setCurrentStep(flowType === 'taker' ? 'quote' : 'getTrades');
    setWorkflowData({
      quoteResponse: null,
      tradeResponse: null,
      getTradesResponse: null,
      presignResponse: null,
      signResponse: null,
      registerResponse: null,
      deliveryResponse: null,
      quoteComplete: false,
      tradeComplete: false,
      getTradesComplete: false,
      presignComplete: false,
      signComplete: false,
      registerComplete: false,
      deliveryComplete: false
    });
    updateState({ 
      quoteResponse: null, 
      quoteError: null, 
      quoteLoading: false,
      tradeResponse: null, 
      tradeError: null, 
      tradeLoading: false,
      response: null, 
      error: null, 
      loading: false,
      signingResponse: null, 
      signingError: null, 
      signingLoading: false,
      registrationResponse: null, 
      registrationError: null, 
      registrationLoading: false
    });
  };

  const getStepStatus = (step: WorkflowStep) => {
    // Return 'hidden' for steps not relevant to current flow
    if (flowType === 'maker') {
      if (step === 'quote' || step === 'trade') return 'hidden';
    }

    switch (step) {
      case 'quote':
        return workflowData.quoteComplete ? 'completed' : currentStep === 'quote' ? 'active' : 'available';
      case 'trade':
        return workflowData.tradeComplete ? 'completed' : currentStep === 'trade' ? 'active' : 'available';
      case 'getTrades':
        return workflowData.getTradesComplete ? 'completed' : currentStep === 'getTrades' ? 'active' : 'available';
      case 'presign':
        return workflowData.presignComplete ? 'completed' : currentStep === 'presign' ? 'active' : 'available';
      case 'sign':
        return workflowData.signComplete ? 'completed' : currentStep === 'sign' ? 'active' : 'available';
      case 'register':
        return workflowData.registerComplete ? 'completed' : currentStep === 'register' ? 'active' : 'available';
      case 'deliver':
        return workflowData.deliveryComplete ? 'completed' : currentStep === 'deliver' ? 'active' : 'available';
      case 'complete':
        return currentStep === 'complete' ? 'active' : workflowData.deliveryComplete ? 'available' : 'disabled';
      default:
        return 'disabled';
    }
  };

  const canNavigateToStep = (step: WorkflowStep) => {
    // Don't allow navigation to hidden steps
    if (getStepStatus(step) === 'hidden') return false;
    
    // Allow navigation to any step except 'complete'
    // Complete step can only be accessed when delivery is actually complete
    switch (step) {
      case 'complete':
        return workflowData.deliveryComplete;
      default:
        return true;
    }
  };

  // Function to handle flow type changes
  const handleFlowTypeChange = (newFlowType: FlowType) => {
    setFlowType(newFlowType);
    // Reset workflow when switching flows
    setCurrentStep(newFlowType === 'taker' ? 'quote' : 'getTrades');
    setWorkflowData({
      quoteResponse: null,
      tradeResponse: null,
      getTradesResponse: null,
      presignResponse: null,
      signResponse: null,
      registerResponse: null,
      deliveryResponse: null,
      quoteComplete: false,
      tradeComplete: false,
      getTradesComplete: false,
      presignComplete: false,
      signComplete: false,
      registerComplete: false,
      deliveryComplete: false
    });
    updateState({ 
      currentFlowType: newFlowType, // Update the global flow type for theming
      quoteResponse: null, 
      quoteError: null, 
      quoteLoading: false,
      tradeResponse: null, 
      tradeError: null, 
      tradeLoading: false,
      response: null, 
      error: null, 
      loading: false,
      signingResponse: null, 
      signingError: null, 
      signingLoading: false,
      registrationResponse: null, 
      registrationError: null, 
      registrationLoading: false
    });
  };

  // Helper function for arrow color
  const getArrowColor = () => '#a0aec0';

  const renderStepIndicator = (step: WorkflowStep, stepNumber: number, label: string) => {
    const status = getStepStatus(step);
    const canNavigate = canNavigateToStep(step);
    
    // Don't render hidden steps
    if (status === 'hidden') return null;
    
    // Colors for all flows (using taker color scheme)
    const getStepColors = () => {
      return {
        completed: '#38a169', // Green for completed steps
        active: '#667eea',    // Blue for active step
        available: '#f0f8ff', // Light blue for available steps
        availableText: '#4a5568' // Gray text for available steps
      };
    };

    const colors = getStepColors();
    
    return (
      <div 
        key={step}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          cursor: canNavigate ? 'pointer' : 'default',
          opacity: status === 'disabled' ? 0.5 : 1,
          transition: 'transform 0.1s ease'
        }}
        onClick={() => canNavigate && setCurrentStep(step)}
        onMouseEnter={(e) => {
          if (canNavigate && status !== 'active') {
            e.currentTarget.style.transform = 'scale(1.05)';
          }
        }}
        onMouseLeave={(e) => {
          if (canNavigate) {
            e.currentTarget.style.transform = 'scale(1)';
          }
        }}
      >
        <div style={{
          width: '2.5rem',
          height: '2.5rem',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold',
          fontSize: '1rem',
          backgroundColor: 
            status === 'completed' ? colors.completed :
            status === 'active' ? colors.active : 
            status === 'available' ? colors.available : '#e2e8f0',
          color: 
            status === 'completed' ? 'white' :
            status === 'active' ? 'white' :
            status === 'available' ? colors.availableText : '#a0aec0',
          border: 
            status === 'active' ? `3px solid ${colors.active}` :
            status === 'available' ? `2px solid ${colors.availableText}` : 
            status === 'disabled' ? 'none' : 'none',
          boxShadow: canNavigate ? '0 2px 4px rgba(0,0,0,0.1)' : 'none'
        }}>
          {status === 'completed' ? '✓' : stepNumber}
        </div>
        <span style={{ 
          marginTop: '0.5rem', 
          fontSize: '0.8rem', 
          fontWeight: status === 'active' ? 'bold' : 'normal',
          color: 
            status === 'active' ? colors.active :
            status === 'available' ? colors.availableText : 
            status === 'completed' ? colors.completed : '#4a5568',
          textAlign: 'center'
        }}>
          {label}
        </span>
      </div>
    );
  };

  return (
    <div className="page-container" style={{ maxWidth: 'none', width: '100%', padding: '0.5rem 1rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div className="page-header" style={{ maxWidth: 'none', width: '100%', textAlign: 'center' }}>
        {/* Flow Type Toggle */}
        <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleFlowTypeChange('taker')}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${flowType === 'taker' ? '#667eea' : '#e2e8f0'}`,
              backgroundColor: flowType === 'taker' ? '#667eea' : 'white',
              color: flowType === 'taker' ? 'white' : '#4a5568',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            Taker
          </button>
          <button
            type="button"
            onClick={() => handleFlowTypeChange('maker')}
            style={{
              padding: '0.5rem 1rem',
              border: `2px solid ${flowType === 'maker' ? '#667eea' : '#e2e8f0'}`,
              backgroundColor: flowType === 'maker' ? '#667eea' : 'white',
              color: flowType === 'maker' ? 'white' : '#4a5568',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '500',
              fontSize: '0.9rem'
            }}
          >
            Maker
          </button>
        </div>
        
        <p style={{ fontSize: '0.9rem', color: '#718096', fontStyle: 'italic' }}>
          💡 Click on any step below to jump directly to that stage
        </p>
      </div>
      
      {/* Workflow Progress Steps */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        margin: '1rem 0', 
        padding: '1rem',
        border: '1px solid #e2e8f0',
        borderRadius: '8px',
        backgroundColor: '#f8fafc',
        overflowX: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', minWidth: 'max-content' }}>
          {flowType === 'taker' ? (
            <>
              {renderStepIndicator('quote', 1, 'Quote')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('trade', 2, 'Trade')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('getTrades', 3, 'Get Trades')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('presign', 4, 'Presign')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('sign', 5, 'Sign')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('register', 6, 'Register')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('deliver', 7, 'Deliver')}
            </>
          ) : (
            <>
              {renderStepIndicator('getTrades', 1, 'Get Trades')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('presign', 2, 'Presign')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('sign', 3, 'Sign')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('register', 4, 'Register')}
              <div style={{ fontSize: '1.2rem', color: getArrowColor() }}>→</div>
              
              {renderStepIndicator('deliver', 5, 'Deliver')}
            </>
          )}
        </div>
      </div>

      <div className="page-content" style={{ maxWidth: 'none', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        {/* Quote Creation */}
        {currentStep === 'quote' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Request for Quote
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Request a quote for your stablecoin exchange. This establishes the trading terms and rate.
              </p>
              
              <QuoteCreationForm state={state} updateState={handleQuoteUpdate} />
            </div>

            {/* Show success message when quote is created */}
            {workflowData.quoteComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Quote Created Successfully!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  Your price quote has been generated. You can now proceed to create a trade.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('trade')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Trade Creation →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Get Trades */}
        {currentStep === 'getTrades' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Get Available Trades
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                {flowType === 'taker' 
                  ? 'Retrieve your created trades. Filter by type: "taker" to see trades where you are the taker.'
                  : 'Retrieve trades where you can act as a maker. Filter by type: "maker" to see trades you can fulfill.'
                }
              </p>
              
              <GetTradesForm state={state} updateState={handleGetTradesUpdate} flowType={flowType} />
            </div>

            {/* Show success message when trades are retrieved */}
            {workflowData.getTradesComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.5rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Trades Retrieved Successfully!</h3>
                </div>
                <p style={{ margin: 0, textAlign: 'center', color: '#4a5568' }}>
                  Available trades have been loaded. You can now proceed to get presign data for trade delivery.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('presign')}
                    style={{
                      marginTop: '1rem',
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Get Presign Data →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Trade Creation */}
        {currentStep === 'trade' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Create Trade
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Create a trade order using your quote. This locks in the exchange rate and creates a tradeable contract.
              </p>
              
              <TradeCreationForm state={state} updateState={handleTradeUpdate} />
            </div>

            {/* Show success message when trade is created */}
            {workflowData.tradeComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Trade Created Successfully!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  Your trade order has been created. You can now get the presign data for signing.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('presign')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Get Presign Data →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Get Presign Data */}
        {currentStep === 'presign' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Get Presign Data
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Retrieve the structured data that needs to be signed for your trade. This contains the EIP-712 typed data.
              </p>
              
              <GetSignaturesForm state={state} updateState={handlePresignUpdate} flowType={flowType} />
            </div>

            {/* Show success message when presign data is retrieved */}
            {workflowData.presignComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Presign Data Retrieved!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  The signing data has been retrieved. You can now proceed to sign the typed data.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('sign')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Sign Data →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sign Typed Data */}
        {currentStep === 'sign' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Sign Typed Data
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Sign the EIP-712 structured data using your wallet. This creates a cryptographic signature for your trade.
              </p>
              
              <SignTypedDataForm state={state} updateState={handleSignUpdate} flowType={flowType} />
            </div>

            {/* Show success message when data is signed */}
            {workflowData.signComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Data Signed Successfully!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  Your typed data has been signed. You can now proceed to register the signature.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('register')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Register Signature →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Register Signature */}
        {currentStep === 'register' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Register Signature
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Submit your cryptographic signature to the exchange to register it for the trade.
              </p>
              
              <RegisterSignatureForm state={state} updateState={handleRegisterUpdate} flowType={flowType} />
            </div>

            {/* Show success message when signature is registered */}
            {workflowData.registerComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Signature Registered Successfully!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  Your signature has been registered with the exchange. You can now proceed to execute the token delivery.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('deliver')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#667eea',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    Proceed to Token Fund →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Token Fund */}
        {currentStep === 'deliver' && (
          <div className="form-section" style={{ width: '100%' }}>
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '1.5rem',
              marginBottom: '1.5rem',
              width: '100%'
            }}>
              <h2 style={{ marginBottom: '0.5rem', color: '#2d3748', textAlign: 'center' }}>
                Execute Token Fund
              </h2>
              <p style={{ marginBottom: '1rem', color: '#718096', textAlign: 'center' }}>
                Execute either takerDeliver (with Permit2 signatures) or makerDeliver (simple trade ID) to fulfill the trade.
              </p>
              
              <TakerDeliverForm state={state} updateState={handleDeliveryUpdate} flowType={flowType} />
            </div>

            {/* Show success message when delivery is complete */}
            {workflowData.deliveryComplete && (
              <div style={{
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '1rem',
                marginBottom: '1rem',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <span style={{ fontSize: '1.5rem', marginRight: '0.75rem' }}>✅</span>
                  <h3 style={{ margin: 0, color: '#38a169' }}>Token Fund Complete!</h3>
                </div>
                <p style={{ margin: '0 0 1rem 0', color: '#4a5568', textAlign: 'center' }}>
                  Your tokens have been successfully delivered to the smart contract. The trade execution is complete.
                </p>
                <div style={{ textAlign: 'center' }}>
                  <button
                    onClick={() => setCurrentStep('complete')}
                    style={{
                      padding: '0.75rem 1.5rem',
                      backgroundColor: '#38a169',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      fontWeight: 'bold',
                      fontSize: '1rem'
                    }}
                  >
                    View Summary →
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Completion Summary */}
        {currentStep === 'complete' && (
          <div className="form-section">
            <div style={{ 
              border: '1px solid #e2e8f0', 
              borderRadius: '8px', 
              padding: '2rem',
              textAlign: 'center',
              width: '100%'
            }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>🎊</div>
              <h2 style={{ marginBottom: '1rem', color: '#38a169' }}>
                Workflow Complete!
              </h2>
              <p style={{ marginBottom: '1rem', color: '#4a5568', fontSize: '1.1rem' }}>
                You have successfully completed the full trading workflow:
                <br />
                ✅ {flowType === 'taker' ? 'Created quote' : 'Retrieved trades'}
                <br />
                {flowType === 'taker' && (
                  <>
                    ✅ Created trade
                    <br />
                  </>
                )}
                ✅ Retrieved presign data
                <br />
                ✅ Signed typed data
                <br />
                ✅ Registered signature
                <br />
                ✅ Executed token delivery
              </p>

              {/* Transaction ID Display */}
              {workflowData.deliveryResponse && workflowData.deliveryResponse.transactionHash && (
                <div style={{
                  backgroundColor: '#f0fff4',
                  border: '1px solid #9ae6b4',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '2rem',
                  textAlign: 'center'
                }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>🎉</div>
                  <h3 style={{ margin: '0 0 0.5rem 0', color: '#38a169' }}>Transaction Successful!</h3>
                  <p style={{ margin: '0 0 0.5rem 0', color: '#4a5568', fontSize: '0.9rem' }}>
                    Transaction ID:
                  </p>
                  <div style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '4px',
                    padding: '0.5rem',
                    fontFamily: 'monospace',
                    fontSize: '0.85rem',
                    color: '#2d3748',
                    wordBreak: 'break-all'
                  }}>
                    {workflowData.deliveryResponse.transactionHash}
                  </div>
                </div>
              )}

              {/* Summary Cards Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: '1rem', 
                marginBottom: '1.5rem',
                textAlign: 'left',
                width: '100%'
              }}>
                {/* Quote Summary */}
                {workflowData.quoteResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>💱 Quote Creation</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      <strong>Quote ID:</strong> <code style={{ fontSize: '0.8rem' }}>{workflowData.quoteResponse.id || workflowData.quoteResponse.data?.id || 'N/A'}</code>
                    </div>
                  </div>
                )}

                {/* Trade Summary */}
                {workflowData.tradeResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>💼 Trade Creation</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      <strong>Trade ID:</strong> <code style={{ fontSize: '0.8rem' }}>{workflowData.tradeResponse.id || workflowData.tradeResponse.data?.id || 'N/A'}</code>
                    </div>
                  </div>
                )}

                {/* Presign Summary */}
                {workflowData.presignResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>📋 Presign Data</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      <strong>Type:</strong> EIP-712 Typed Data
                    </div>
                  </div>
                )}

                {/* Signing Summary */}
                {workflowData.signResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>✍️ Data Signing</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      <strong>Signature:</strong> <code style={{ fontSize: '0.8rem' }}>Generated</code>
                    </div>
                  </div>
                )}

                {/* Registration Summary */}
                {workflowData.registerResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#667eea' }}>📝 Signature Registration</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      <strong>Type:</strong> {workflowData.registerResponse.type || 'N/A'}
                    </div>
                  </div>
                )}

                {/* Delivery Summary */}
                {workflowData.deliveryResponse && (
                  <div style={{
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '1rem'
                  }}>
                    <h4 style={{ margin: '0 0 1rem 0', color: '#38a169' }}>🚀 Token Fund</h4>
                    <div style={{ fontSize: '0.9rem', color: '#4a5568' }}>
                      <strong>Status:</strong> Completed
                      <br />
                      {workflowData.deliveryResponse.id && (
                        <>
                          <strong>Transaction ID:</strong> <code style={{ fontSize: '0.8rem' }}>{workflowData.deliveryResponse.id}</code>
                          <br />
                        </>
                      )}
                      {workflowData.deliveryResponse.txHash && (
                        <>
                          <strong>Tx Hash:</strong> 
                          <code style={{ fontSize: '0.7rem', wordBreak: 'break-all' }}>
                            {workflowData.deliveryResponse.txHash}
                          </code>
                          <br />
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                <button
                  onClick={resetWorkflow}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: '#667eea',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  🔄 Start New Workflow
                </button>
                
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '0.75rem 1.5rem',
                    backgroundColor: 'white',
                    color: '#4a5568',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    fontSize: '1rem'
                  }}
                >
                  🏠 Return to Home
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Response Display - Only show for current step and not complete */}
        {currentStep !== 'complete' && (
          <div className="response-section" style={{ width: '100%' }}>
            <ResponseDisplay 
              response={
                currentStep === 'quote' ? state.quoteResponse :
                currentStep === 'trade' ? state.tradeResponse :
                currentStep === 'getTrades' ? state.response :
                currentStep === 'presign' ? state.response :
                currentStep === 'sign' ? state.signingResponse :
                currentStep === 'register' ? state.registrationResponse :
                currentStep === 'deliver' ? state.response :
                state.response
              }
              loading={
                currentStep === 'quote' ? state.quoteLoading :
                currentStep === 'trade' ? state.tradeLoading :
                currentStep === 'getTrades' ? state.loading :
                currentStep === 'presign' ? state.loading :
                currentStep === 'sign' ? state.signingLoading :
                currentStep === 'register' ? state.registrationLoading :
                currentStep === 'deliver' ? state.loading :
                state.loading
              }
              error={
                currentStep === 'quote' ? state.quoteError :
                currentStep === 'trade' ? state.tradeError :
                currentStep === 'getTrades' ? state.error :
                currentStep === 'presign' ? state.error :
                currentStep === 'sign' ? state.signingError :
                currentStep === 'register' ? state.registrationError :
                currentStep === 'deliver' ? state.error :
                state.error
              }
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CompleteWorkflowPage;
