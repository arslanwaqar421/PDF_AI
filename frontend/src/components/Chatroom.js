import React, { useEffect, useState, useRef } from "react";
import botImage from "../assets/images/bit_image.jpeg" 
import { useNavigate } from "react-router-dom";
import {
  MDBContainer,
  MDBRow,   
  MDBCol,
  MDBCard,
  MDBCardBody,
  MDBIcon,
  MDBTypography,
  MDBInput,  
} from "mdb-react-ui-kit";
import "./Chatroom.css"
import Scrollbars from "react-custom-scrollbars-2"

function Chatroom() {
    const [selectedFiles,setSelectedFiles] = useState([])
    const [chatHistory, setChatHistory] = useState([])
    const [chatMessages,setChatMessages] = useState([])
    const [chatId,setChatId] = useState("")
    const [userToken, setUserToken] = useState("");
    const [userId, setUserId] = useState("")
    const [isUploading,setIsUploading] = useState(false)
    const [isUploaded,setIsUploaded] = useState(false)
    const fileInputRef = useRef(null)
    const navigate = useNavigate()


    useEffect(() => {
      const token = sessionStorage.getItem('user_token');
      const id = sessionStorage.getItem('user_id');

      if (token && id) {
        setUserToken(token);
        setUserId(id);
      }
    }, []);

    useEffect(()=>{
      if(userToken){
      console.log("Fetching User Chats...")
      fetchUserChats()
      }
    },[userToken])

    useEffect(()=>{
      if (chatHistory.length)
      {
        fetchChatMessages(chatHistory[0].id)
        setChatId(chatHistory[0].id)
      }
    },[chatHistory])

    useEffect(()=>{
      if(chatHistory.length){
        console.log("from use effect")
        fetchChatFiles(chatHistory[0].id)}
    },[chatHistory])

    const fetchChatFiles = (chatid) =>{
      console.log("Fetching chat files", chatid)
      fetch(`http://127.0.0.1:8000/doc_query/chat/${chatid}/files`,{
        method: "GET",
        headers:{
          "Authorization": `Bearer ${userToken}`,
        }
      })
      .then((response)=>{
        if (!response.ok){
          console.log("error")
          throw new Error("Server response was not ok")
        }
        return response.json()
      })
      .then((data)=>{
        console.log(data)
        setSelectedFiles(data)
        if (data.length){
          console.log("length is :", data.length )
          setIsUploaded(true)
        }
        else{
          setIsUploaded(false)
        }
      })
      .catch((error) =>console.error("There was a problem with the fetch operation:", error))
    }

    const fetchUserChats= ()=> {
      console.log("user token" , userToken)
      fetch("http://127.0.0.1:8000/doc_query/chat/",{
        method : "GET",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type" : "application/json"
        }
      })
      .then((response)=>{
        if(!response.ok){
          throw new Error("Server response was not ok")
        }
        return response.json()
      })
      .then((data)=>{
        console.log("Chat History is :",data)
        setChatHistory(data)
      })
      .catch((error) =>console.error("There was a problem with the fetch operation:", error))
    }

    const createNewChat = ()=>{
      console.log("Creating New Chat......")
      const chat_title = window.prompt("Enter Chat Title:","MyChat");
      if (chat_title!== null && chat_title.length>0 ){
        fetch("http://127.0.0.1:8000/doc_query/chat/",{
          method: "POST",
          headers: {
            "Authorization": `Bearer ${userToken}`,
            "Content-Type" : "application/json"
          },
          body:JSON.stringify({
            title : `${chat_title}`,
            owner_id : `${userId}`
          })
        }).then((response)=>{
          if(!response.ok){
            console.log("error")
            throw new Error("Server response was not ok")
          }
          return response.json()
        })
        .then((data)=>{
          console.log("New chat",data)
          // we can also append the chathistory array
          fetchUserChats()
          setSelectedFiles([])
        })
        .catch((error) => console.error('There was a problem with the fetch operation:', error));
  }
  else{
    console.log("In else doing nothing")
  }
     };


    const uploadFiles = (event)=>{
      event.preventDefault()
      if (chatId === ""){
        alert("Create a chat first!")
      }
      else{

        setIsUploading(true)
        console.log("Uploading Files..")
        const formData =  new FormData()
        for(let i=0;i<selectedFiles.length;i++){
        formData.append('files[]',selectedFiles[i])
      }
      formData.append("chat_id", chatId)

      fetch("http://127.0.0.1:8000/doc_query/file/", {
        method:"POST",
        headers: {
          "Authorization": `Bearer ${userToken}`,
        },
        body: formData
      })
      .then(response => {
        if (!response.ok) {
          throw new Error('Server response was not ok.');
        }
        return response.json();
      })
      .then(data => {
        console.log('Success:', data);
        setIsUploading(false)
        alert("File Uploaded Successsfully")
        setIsUploaded(true)
        // fileInputRef.current.value = ""
      })
      .catch(error => {
        console.error('There was a problem with the fetch operation:', error.message);
        alert(error.message)
        setIsUploading(false)
      });
    }
    }

    const handleFileChange = (event) => {
      const files = Array.from(event.target.files);
      const filteredFiles = files.filter(file => file.size < 2 * 1024 * 1024);
      setSelectedFiles(filteredFiles);
      // event.target.value = ""
    };

    const handleEnterKey = (event)=>{
      if (event.key ==="Enter" && event.target.value.length){
        createUserNewMessage(event.target.value,chatId)
        event.target.value = ""
      }
    }
    const createBotResponse = (user_query)=>{
      console.log("Waiting for bots meesage..")
      fetch("http://127.0.0.1:8000/doc_query/chat/message/bot",{
        method: "POST",
        headers: {
          "Content-Type" : "application/json"
        },
        body: JSON.stringify({
          "user_query": user_query,
          "chat_id":chatId
        })
      })
      .then((response)=>{
        if(!response.ok){
          console.log("error")
          throw new Error("Server response was not ok")
        }
        return response.json()
      })
      .then((data)=>{
        console.log(data)
        fetchChatMessages(chatId)
      })
      .catch((error)=> console.error('There was a problem with the fetch operation:', error))
    }

    const createUserNewMessage = (content)=>{ // call the bot response funciton here
      console.log("Creating new message with content..." ,content,chatId)
        fetch("http://127.0.0.1:8000/doc_query/message/",{
          method: "POST",
          headers: {
            "Authorization": `Bearer ${userToken}`,
            "Content-Type" : "application/json"
          },
          body: JSON.stringify({
            "msg_txt" : content,
            "type" : "user",
            "chat_id": chatId,
          })

        })
        .then((response)=>{
          if (!response.ok){
            console.log("error")
            throw new Error("Server response was not ok")
          }
          return response.json()
        })
        .then((data)=>{
          console.log(data)
          fetchChatMessages(chatId)
          createBotResponse(content)

        })
        .catch((error)=> console.error('There was a problem with the fetch operation:', error))

    }

    const fetchChatMessages = (chatid) =>{
      setChatId(chatid)
      console.log("Fetching Chat Messages....", chatid)
      fetch(`http://127.0.0.1:8000/doc_query/chat/${chatid}/messages`,{
        method:"GET",
        headers: {
          "Authorization": `Bearer ${userToken}`,
          "Content-Type" : "application/json"
        }
      }
      )
      .then((response)=>{
        if(!response.ok){
          console.log("error")
          throw new Error("Server Response was not ok")
        }
        return response.json()
      })
      .then((data)=>{
        console.log(data)
        setChatMessages(data)
        fetchChatFiles(chatid)
      })
      .catch((error)=> console.error('There was a problem with the fetch operation:', error))
    }

    const handleDeleteChat =(chatid)=>{
      console.log("Deleting chat", chatid)
      if(window.confirm("Are you sure to delete this chat")){

        fetch(`http://127.0.0.1:8000/doc_query/chat/${chatid}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${userToken}`,
        }
      })
      .then((response)=>{
        if (!response.ok){
          console.log("error")
          throw new Error("Server response was not ok")
        }
        return response.json()
      })
      .then((data)=>{
        console.log(data)
        fetchUserChats()
        fetchChatMessages(chatId)
        setSelectedFiles([])
        // if (fileInputRef.current) {
        //   fileInputRef.current.file = null; // Clear file input
        // }
      })
      .catch((error) => console.error("There was a problem with the fetch operation:", error));
    }
  }

    const handleLogout = ()=>{
      sessionStorage.clear()
      navigate("/")
    }

    const formatDate = (utcdate) => {
      const new_date = new Date(utcdate + 'Z')
      const options = {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
      };
      return new_date.toLocaleString('en-US', options)
    };

  return (
    <MDBContainer fluid className="py-5" style={{ backgroundColor: "#CDC4F9" }}>
      <MDBRow>
        <MDBCol md="12">
          <MDBCard id="chat3" style={{ borderRadius: "15px" }}>
            <MDBCardBody>
              <MDBRow>
              <div className="d-flex justify-content-center align-items-center">
                <button type="button" className="btn btn-danger" onClick={handleLogout}>Logout</button>
              </div>
                {/* CHAT HISTORY SECTION */}
                <MDBCol md="6" lg="5" xl="4" className="mb-4 mb-md-0" style={{borderRight:"2px solid grey"}}>
                  <div className="p-3">
                    <div style={{display: "flex" , justifyContent: "space-evenly"}}>
                      <h3>Chat History</h3>
                      <button style={{border: "none", borderRadius: "5px", background: "blue", width : "125px" , color: "white"}}
                      onMouseOver={(e)=>e.target.style.background = "#0f0352"} onMouseOut={(e)=> e.target.style.background="blue"} onClick={createNewChat}>New Chat</button>
                    </div>
                    <Scrollbars
                      style={{ position: "relative", height: "400px" }}
                    >
                      <MDBTypography listUnStyled className="mb-0">
                      {chatHistory.length === 0 && (
                      <div className="d-flex justify-content-center align-items-center" style={{height:"50vh"}}>
                        <h4 className="large rounded-3 text-muted" style={{background: "lightblue", width:"200px",paddingLeft: "10px"}}>No Chats so far!</h4>
                      </div>
                    )}
                        {chatHistory.length > 0 &&
                        chatHistory.map((chat)=>{
                          return <li key={chat.id} className="p-2 border-bottom d-flex justify-content-between align-items-center">
                          <a href="#!" className="d-flex justify-content-between" onClick={() => fetchChatMessages(chat.id)} style={{flex: 1}}>
                            <div className="d-flex flex-row">
                              <div className="pt-1">
                                <p className="fw-bold mb-0">{chat.title}</p>
                              </div>
                            </div>
                            <div className="pt-1">
                              <p className="small text-muted mb-1">{formatDate(chat.creation_timestamp)}</p>
                            </div>
                          </a>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={(e) => {
                              e.stopPropagation(); // Prevent the click event from bubbling up to the parent elements
                              handleDeleteChat(chat.id);
                            }}>
                            Delete
                          </button>
                        </li>
                        })
                        }
                      </MDBTypography>
                    </Scrollbars>
                  </div>
                </MDBCol>
                <MDBCol md="6" lg="5" xl="4" style={{marginTop:"20px"}}>
                    <h3>Upload PDFs</h3>
                    <p className="text-muted">Select Files less than 2MB</p>
                        <Scrollbars 
                            style={{position:"relative" , height: "400px"}}
                            >
                                {isUploading && (<>
                                <div class="spinner-border text-primary" role="status">
                              </div>
                              <h5>Uploading Files....</h5>
                                </>)
                              }
                                {selectedFiles.length > 0 && isUploaded && (
                                    <div className="mt-3">
                                        <h5>Uploaded Files:</h5>
                                        <ul>
                                            {selectedFiles.map((item,index) => {
                                                return (
                                                    <li key={index}>{item.name}</li>
                                                )
                                            })}
                                        </ul>
                                    </div>
                                )}
                        </Scrollbars>
                        { !isUploaded &&

                          <div className="justify-content-start align-items-center" style={{color:"green"}}>
                        <form onSubmit={uploadFiles}>
                            <div style={{display:"flex"}}>
                                <MDBInput
                                onChange={handleFileChange}
                                type="file"
                                accept=".pdf"
                                required
                                multiple
                                inputRef={fileInputRef} // Attach ref to the input
                                >
                                </MDBInput>
                                <button type="submit" style={{borderRadius:"5px",background : "blue" , color: "white", border:"none", width: "125px"}} onMouseOver={(e)=>e.target.style.background = "#0f0352"} onMouseOut={(e)=> e.target.style.background="blue"}>Upload</button>
                            </div>
                        </form>
                        </div>
                      }
                </MDBCol>
                <MDBCol md="6" lg="5" xl="4" style={{borderLeft:"2px solid grey"}}>
                  {
                    isUploaded && (<div>

                  <Scrollbars
                  style={{ position: "relative", height: "400px" }}
                  className="pt-3 pe-3"
                  >
                    {/* DISPLAY CHAT MESSAGES */}
                    {chatMessages.length === 0 && (
                      <div className="d-flex justify-content-center align-items-center" style={{height:"100%"}}>
                        <h4 className="large rounded-3 text-muted" style={{background: "lightblue", width:"250px", paddingLeft: "15px"}}>No messages so far!</h4>
                      </div>
                    )}
                    {(chatMessages.length>0 || chatHistory.length>0) && (
                      chatMessages.map((msg)=>{
                        if (msg.type === "MessageType.USER"){
                          return <div key={msg.id} className="d-flex flex-row justify-content-start">
                                                  <img
                        src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                        alt="avatar 1"
                        style={{ width: "45px", height: "100%" }}
                      />
                          <div>
                            <p
                              className="small p-2 ms-3 mb-1 rounded-3"
                              style={{ backgroundColor: "#f5f6f7" }}
                            >
                              {msg.msg_txt}
                            </p>
                            <p className="small ms-3 mb-3 rounded-3 text-muted float-end">
                              {formatDate(msg.creation_timestamp).split(",")[2]}
                            </p>
                          </div>
                        </div>
                        }
                        else{
                          return <div key={msg.id} className="d-flex flex-row justify-content-end">
                          <div>
                            <p className="small p-2 me-3 mb-1 text-white rounded-3 bg-primary">
                              {msg.msg_txt}
                            </p>
                            <p className="small me-3 mb-3 rounded-3 text-muted">
                              {formatDate(msg.creation_timestamp).split(",")[2]}
                            </p>
                          </div>
                          <img
                            src={botImage}
                            alt="BOT"
                            style={{ width: "45px", height: "100%" }}
                          />
                        </div>
                        }
                      })
                    )}
                  </Scrollbars>
                  <div className="text-muted d-flex justify-content-start align-items-center pe-3 pt-3 mt-2">
                    <img
                      src="https://mdbcdn.b-cdn.net/img/Photos/new-templates/bootstrap-chat/ava6-bg.webp"
                      alt="avatar 3"
                      style={{ width: "40px", height: "100%" }}
                      />
                    <input
                      type="text"
                      className="form-control form-control-lg"
                      id="messageInput"
                      placeholder="Type message"
                      // onChange={(e)=>setMessage(e.target.value)}
                      onKeyDown={handleEnterKey}
                      />
                    <a className="ms-1 text-muted" href="#!">
                      <MDBIcon fas icon="paperclip" />
                    </a>
                    <a className="ms-3 text-muted" href="#!">
                      <MDBIcon fas icon="smile" />
                    </a>
                    <a className="ms-3" href="#!">
                      <MDBIcon fas icon="paper-plane" />
                    </a>
                  </div>
                  </div>)
                  }
                </MDBCol>
              </MDBRow>
            </MDBCardBody>
            </MDBCard>
        </MDBCol>
      </MDBRow>
    </MDBContainer>
  );
}

export default Chatroom;