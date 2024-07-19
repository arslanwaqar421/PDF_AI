import React, { useState } from 'react';
import { Link,useNavigate } from 'react-router-dom';

export default function Signup() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordMatch, setPasswordMatch] = useState(true);
  const [email,setEmail] = useState("")
  const navigate = useNavigate()

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
    checkPasswordMatch(event.target.value, confirmPassword);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
    checkPasswordMatch(password, event.target.value);
  };

  const checkPasswordMatch = (password, confirmPassword) => {
    setPasswordMatch(password === confirmPassword);
  };
  const handleSubmit = (event) => {
    event.preventDefault();
    if (passwordMatch) {
      console.log('Form submitted');
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);

      fetch("http://127.0.0.1:8000/doc_query/user/", {
        method: "POST",
        body: formData
      })
      .then((response) => {
        if (!response.ok) {
          // Handle error response
          return response.json().then((data) => {
            console.log(response);
            throw new Error(data.message || "Server response was not ok");
          });
        }
        return response.json();
      })
      .then((data) => {
        console.log(data);
        sessionStorage.setItem('user_token', data.auth_token);
        sessionStorage.setItem('user_id', data.id);
        navigate("/chatroom")
      })
      .catch((error) => {
        alert(`${error.message}`)
        }); // Display
      }}
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',  // This makes the container take the full viewport height
    }}>
      <div style={{ border: "1px solid black", width: "30%", padding: "20px", borderRadius:"10px"}}>
        <form onSubmit={handleSubmit}>
          <h3>Sign Up</h3>
          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              required
              onChange={(e)=>{setEmail(e.target.value)}}
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              value={password}
              onChange={handlePasswordChange}
              required
            />
          </div>
          <div className="mb-3">
            <label>Confirm Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Confirm password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              required
            />
          </div>
          {!passwordMatch && (
            <div style={{ color: 'red', marginBottom: '10px' }}>
              Passwords do not match.
            </div>
          )}
          <div className="d-grid">
            <button type="submit" className="btn btn-primary">
              Sign Up
            </button>
          </div>
          <p className="register text-right">
            Already have an account? <Link to="/">Login</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
