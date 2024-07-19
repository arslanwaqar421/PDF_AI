
// import './App.css';

import Chatroom from "./components/Chatroom";
import Login from "./components/Login";
import Signup from "./components/Signup";
import {BrowserRouter,Routes,Route} from 'react-router-dom'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login/>}/>
        <Route path="signup" element={<Signup/>}/>
        <Route path="chatroom" element={<Chatroom/>}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
