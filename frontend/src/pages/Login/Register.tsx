import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Mail, Lock, User, Eye, EyeOff, AlertCircle, 
  Building, MapPin, Phone, FileText, CreditCard, 
  Banknote, Globe, CheckCircle, Stethoscope 
} from 'lucide-react';
import styles from './Register.module.css';

interface RegisterFormData {
  // User Account
  email: string;
  password: string;
  confirmPassword: string;
  fullName: string;
  
  // Business Profile
  businessName: string;
  businessAddress: string;
  phoneNumber: string;
  vatNumber: string;
  practiceNumber: string; // NEW: Practice Number
  accountNumber: string;
  bankName: string;
  branchCode: string;
  accountHolderName: string;
  businessEmail: string;
}

export const Register: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<RegisterFormData>({
    // User Account
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    
    // Business Profile
    businessName: '',
    businessAddress: '',
    phoneNumber: '',
    vatNumber: '',
    practiceNumber: '', // NEW: Practice Number
    accountNumber: '',
    bankName: '',
    branchCode: '',
    accountHolderName: '',
    businessEmail: '',
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'account' | 'business'>('account');

  // API URL from environment variables
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError(null);
  };

  const validateAccountStep = (): boolean => {
    if (!formData.fullName.trim()) {
      setError('Full name is required');
      return false;
    }

    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }

    if (!formData.password) {
      setError('Password is required');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    return true;
  };

  const validateBusinessStep = (): boolean => {
    if (!formData.businessName.trim()) {
      setError('Business name is required');
      return false;
    }

    if (!formData.businessAddress.trim()) {
      setError('Business address is required');
      return false;
    }

    if (!formData.phoneNumber.trim()) {
      setError('Phone number is required');
      return false;
    }

    if (!formData.vatNumber.trim()) {
      setError('VAT number is required');
      return false;
    }

    if (!formData.practiceNumber.trim()) {
      setError('Practice number is required');
      return false;
    }

    if (!formData.accountNumber.trim()) {
      setError('Account number is required');
      return false;
    }

    return true;
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAccountStep()) {
      setCurrentStep('business');
      setError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateBusinessStep()) {
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare registration data with business profile
      const registrationData = {
        email: formData.email,
        password: formData.password,
        fullName: formData.fullName,
        businessProfile: {
          businessName: formData.businessName,
          businessAddress: formData.businessAddress,
          phoneNumber: formData.phoneNumber,
          vatNumber: formData.vatNumber,
          practiceNumber: formData.practiceNumber, // NEW: Practice Number
          accountNumber: formData.accountNumber,
          bankName: formData.bankName || undefined,
          branchCode: formData.branchCode || undefined,
          accountHolderName: formData.accountHolderName || formData.businessName,
          businessEmail: formData.businessEmail || formData.email,
          invoicePrefix: 'INV-',
          currency: 'ZAR'
        }
      };

      // API call to register with business profile
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess('Registration successful! Redirecting to login...');
      
      // Reset form
      setFormData({
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        businessName: '',
        businessAddress: '',
        phoneNumber: '',
        vatNumber: '',
        practiceNumber: '',
        accountNumber: '',
        bankName: '',
        branchCode: '',
        accountHolderName: '',
        businessEmail: '',
      });
      setCurrentStep('account');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during registration');
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };

  const goBackToAccount = () => {
    setCurrentStep('account');
    setError(null);
  };

  return (
    <div className={styles.registerContainer}>
      <div className={styles.registerCard}>
        <div className={styles.registerHeader}>
          <h1 className={styles.title}>Create Your Account</h1>
          <p className={styles.subtitle}>
            {currentStep === 'account' 
              ? 'Start with your personal account details' 
              : 'Tell us about your business'}
          </p>
          <div className={styles.stepIndicator}>
            <span className={`${styles.stepDot} ${currentStep === 'account' ? styles.active : styles.completed}`}>
              {currentStep === 'account' ? '1' : '✓'}
            </span>
            <span className={`${styles.stepLine} ${currentStep === 'business' ? styles.active : ''}`}></span>
            <span className={`${styles.stepDot} ${currentStep === 'business' ? styles.active : ''}`}>
              {currentStep === 'business' ? '2' : '2'}
            </span>
          </div>
        </div>

        {error && (
          <div className={styles.errorAlert}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className={styles.successAlert}>
            <CheckCircle size={20} />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={currentStep === 'account' ? handleNextStep : handleSubmit} className={styles.registerForm}>
          {currentStep === 'account' ? (
            // Account Step
            <>
              <div className={styles.formGroup}>
                <label htmlFor="fullName" className={styles.label}>
                  <User size={18} />
                  Full Name *
                </label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={20} />
                  <input
                    id="fullName"
                    name="fullName"
                    type="text"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="name"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="email" className={styles.label}>
                  <Mail size={18} />
                  Email Address *
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter your email"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="password" className={styles.label}>
                  <Lock size={18} />
                  Password *
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter your password (min 8 characters)"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={togglePasswordVisibility}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className={styles.passwordHint}>
                  Password must be at least 8 characters long
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="confirmPassword" className={styles.label}>
                  <Lock size={18} />
                  Confirm Password *
                </label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm your password"
                    className={styles.input}
                    disabled={isLoading}
                    autoComplete="new-password"
                    required
                  />
                  <button
                    type="button"
                    className={styles.passwordToggle}
                    onClick={toggleConfirmPasswordVisibility}
                    tabIndex={-1}
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className={styles.nextButton}
                disabled={isLoading}
              >
                Continue to Business Details →
              </button>
            </>
          ) : (
            // Business Profile Step
            <>
              <div className={styles.formGroup}>
                <label htmlFor="businessName" className={styles.label}>
                  <Building size={18} />
                  Business Name *
                </label>
                <div className={styles.inputWrapper}>
                  <Building className={styles.inputIcon} size={20} />
                  <input
                    id="businessName"
                    name="businessName"
                    type="text"
                    value={formData.businessName}
                    onChange={handleChange}
                    placeholder="Enter your business name"
                    className={styles.input}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="businessAddress" className={styles.label}>
                  <MapPin size={18} />
                  Business Address *
                </label>
                <div className={styles.inputWrapper}>
                  <MapPin className={styles.inputIcon} size={20} />
                  <input
                    id="businessAddress"
                    name="businessAddress"
                    type="text"
                    value={formData.businessAddress}
                    onChange={handleChange}
                    placeholder="Enter your business address"
                    className={styles.input}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phoneNumber" className={styles.label}>
                  <Phone size={18} />
                  Phone Number *
                </label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} size={20} />
                  <input
                    id="phoneNumber"
                    name="phoneNumber"
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    placeholder="e.g., +27123456789"
                    className={styles.input}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="vatNumber" className={styles.label}>
                    <FileText size={18} />
                    VAT Number *
                  </label>
                  <div className={styles.inputWrapper}>
                    <FileText className={styles.inputIcon} size={20} />
                    <input
                      id="vatNumber"
                      name="vatNumber"
                      type="text"
                      value={formData.vatNumber}
                      onChange={handleChange}
                      placeholder="e.g., VAT-123456789"
                      className={styles.input}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="practiceNumber" className={styles.label}>
                    <Stethoscope size={18} />
                    Practice Number *
                  </label>
                  <div className={styles.inputWrapper}>
                    <Stethoscope className={styles.inputIcon} size={20} />
                    <input
                      id="practiceNumber"
                      name="practiceNumber"
                      type="text"
                      value={formData.practiceNumber}
                      onChange={handleChange}
                      placeholder="e.g., PRAC-12345"
                      className={styles.input}
                      disabled={isLoading}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountNumber" className={styles.label}>
                  <CreditCard size={18} />
                  Account Number *
                </label>
                <div className={styles.inputWrapper}>
                  <CreditCard className={styles.inputIcon} size={20} />
                  <input
                    id="accountNumber"
                    name="accountNumber"
                    type="text"
                    value={formData.accountNumber}
                    onChange={handleChange}
                    placeholder="Enter account number"
                    className={styles.input}
                    disabled={isLoading}
                    required
                  />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label htmlFor="bankName" className={styles.label}>
                    <Banknote size={18} />
                    Bank Name
                  </label>
                  <div className={styles.inputWrapper}>
                    <Banknote className={styles.inputIcon} size={20} />
                    <input
                      id="bankName"
                      name="bankName"
                      type="text"
                      value={formData.bankName}
                      onChange={handleChange}
                      placeholder="e.g., ABC Bank"
                      className={styles.input}
                      disabled={isLoading}
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label htmlFor="branchCode" className={styles.label}>
                    Branch Code
                  </label>
                  <div className={styles.inputWrapper}>
                    <input
                      id="branchCode"
                      name="branchCode"
                      type="text"
                      value={formData.branchCode}
                      onChange={handleChange}
                      placeholder="e.g., 123456"
                      className={styles.input}
                      disabled={isLoading}
                      style={{ paddingLeft: '12px' }}
                    />
                  </div>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="accountHolderName" className={styles.label}>
                  <User size={18} />
                  Account Holder Name
                </label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={20} />
                  <input
                    id="accountHolderName"
                    name="accountHolderName"
                    type="text"
                    value={formData.accountHolderName}
                    onChange={handleChange}
                    placeholder="Enter account holder name"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="businessEmail" className={styles.label}>
                  <Mail size={18} />
                  Business Email
                </label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input
                    id="businessEmail"
                    name="businessEmail"
                    type="email"
                    value={formData.businessEmail}
                    onChange={handleChange}
                    placeholder="business@company.com"
                    className={styles.input}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className={styles.buttonGroup}>
                <button
                  type="button"
                  className={styles.backButton}
                  onClick={goBackToAccount}
                  disabled={isLoading}
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className={styles.registerButton}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className={styles.spinner}></span>
                      Creating Account...
                    </>
                  ) : (
                    'Complete Registration'
                  )}
                </button>
              </div>
            </>
          )}
        </form>

        <div className={styles.loginLink}>
          <p>
            Already have an account?{' '}
            <Link to="/" className={styles.link}>
              Sign in here
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;