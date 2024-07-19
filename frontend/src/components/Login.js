import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [email,setEmail] = useState("")
  const [password,setPassword] = useState("")
  const navigate = useNavigate()

  const handlesubmit = (event) =>{
    event.preventDefault()

    if (email.length === 0 || password.length === 0)
      alert("Please fill all fields.")
    else{
      const formData = new FormData()

      formData.append("email", email)
      formData.append("password", password)

      fetch("http://127.0.0.1:8000/doc_query/user/login/",{
        method : "POST",
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
        navigate("/chatroom");
      })
      .catch((error) => {
        console.log(error)
        alert(`${error.message}`)
        }); // Display
    }
  }
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',  // This makes the container take the full viewport height
    }}>
      <div style={{ border: "1px solid black", width: "30%",padding: "20px", borderRadius:"10px"}}>
        <form>
          <h3>Sign In</h3>
          <div className="mb-3">
            <label>Email address</label>
            <input
              type="email"
              className="form-control"
              placeholder="Enter email"
              onChange={(e)=>{setEmail(e.target.value)}}
            />
          </div>
          <div className="mb-3">
            <label>Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter password"
              onChange={(e)=>{setPassword(e.target.value)}}
            />
          </div>
          <div className="d-grid">
            <button type="submit" className="btn btn-primary" onClick={handlesubmit}>
              Login
            </button>
          </div>
          <p className="register text-right">
            Don't have an account? <Link to="/signup">Sign Up</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
