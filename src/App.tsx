import Pusher from 'pusher-js';
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const ChatApp: React.FC = () => {
  const [auth, SetAuth] = useState(false);
  const [username, setUsername] = useState<string>('');
  const [room, setRoom] = useState<string>('');
  const [allMessage, setAllMessage] = useState<{ room: string, message: String, username: string }[]>([]);
  const [message, setMessage] = useState("");




  const handleJoinRoom = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`http://127.0.0.1:8080/join`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room: room, newUsername: username })
      })
        .then((res) => {
          return res.json();
        })
        .then((jsonData) => {

          return jsonData;
        }) as { status: number, message: string };
      // console.log(response)
      if (response.status === 200) {
        // invoke Pusher
        subscribeToNewUserChannel();
        SetAuth(!auth);
        toast.success(`Joined room ${room}`);

      }
      else {
        toast.warn(`${response.message}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }

  }

  // copy room ID
  const copyRoom = () => {
    window.navigator.clipboard.writeText(room);
  }

  // const channelToGetMessage = pusher.subscribe('chat-45');
  // channelToGetMessage.bind('message', function (data: object) {
  //   alert(JSON.stringify(data));
  // });




  const subscribeToNewUserChannel = () => {
    // init Pusher
    Pusher.logToConsole = true;

    const pusher = new Pusher(import.meta.env.VITE_APIkey, {
      cluster: 'ap2'
    });
    const channel = pusher.subscribe(`chat-${room}`);

    // receive events sent to the user-joined
    channel.bind('user-joined', (data: { room: string, newUsername: string }) => {
      toast(`${data.newUsername} joined the room ${data.room}`);

    });

    // receive events sent to the message
    channel.bind('message', (data: { room: string, username: string, message: string }) => {
      //set message received from the event
      setAllMessage((prevMessages) => [...prevMessages, data]);


    });
  }

  const sendData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    // Send message to server
    try {
      console.log("URL  ", `http://127.0.0.1:8080/messages/${room}`)
      const response = await fetch(`http://127.0.0.1:8080/messages/${room}`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room: room, username: username, message: message, })
      })
        .then((res) => {
          return res.json();
        })
        .then((jsonData) => {

          return jsonData;
        }) as { status: number, message: string };
      console.log(response)
      if (response.status === 200) {
        // console.log('check - ', JSON.stringify(response))

        toast.success("A message has been sent.")
        setMessage("");

      }
      else {
        toast.warn(`${response.message}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  useEffect(() => {
    // Clean up Pusher subscriptions when component unmounts
    return () => {
      Pusher.logToConsole = false; // Disable Pusher logging to console
      const pusher = new Pusher(import.meta.env.VITE_APIkey, {
        cluster: 'ap2'
      });

      pusher.unsubscribe(`chat-${room}`);
    };
  }, [room]);

  return (
    <>
      <ToastContainer />
      {auth ? (<>
        {/* display messages */}

        <div className="text-center ">
          <div className="text-5xl p-5">
            Private message <button onClick={copyRoom} className="rounded-xl w-full md:w-40 text-sm font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">Copy Room ID</button>
          </div>

        </div>

        <div className="grid grid-cols-1
                    gap-4 items-center justify-center mb-36 overflow-y-auto p-5 text-xl mt-1 md:mb-28">
          <div className="flex flex-col flex-auto h-full p-6">
            <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
              <div className="flex flex-col h-full overflow-x-auto mb-4">
                <div className="flex flex-col h-full">
                  <div className="grid grid-cols-12 gap-y-2">
                    {allMessage.map((val, key) => {
                      return ((val.username === username) ?
                        (<div key={key} className="col-start-6 col-end-13 p-3 rounded-lg">
                          <div className="flex items-center justify-start flex-row-reverse">
                            <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                              {val.username.charAt(0).toUpperCase()}
                            </div>
                            <div className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                              {/* message */}
                              <div>
                                {val.message}
                              </div>
                            </div>
                          </div>
                        </div>) :
                        (
                          <div key={key} className="col-start-1 col-end-8 p-3 rounded-lg">
                            <div className="flex flex-row items-center">
                              {/* Name Logo */}
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {val.username.charAt(0).toUpperCase()}
                              </div>
                              {/* Message */}
                              <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                <div>{val.message}</div>
                              </div>
                            </div>
                          </div>
                        )

                      )
                    })}

                    {/* Left Display */}


                    {/* Right display */}




                  </div>
                </div>

              </div>


            </div>


            {/* send message */}
            <form onSubmit={sendData}>
              <div className="fixed bottom-0  text-center left-0 
                    w-full bg-white p-4 grid grid-cols-1 md:grid-cols-2 
                    gap-4 items-center">
                <div className="rounded">
                  <input
                    required
                    value={message}
                    onChange={(e) => { setMessage(e.target.value) }}
                    type="text"
                    name="roomid"
                    id="roomid"
                    placeholder="Enter Message"
                    className=" rounded-2xl w-full p-1 md:w-96 border-2 border-cyan-300 focus:outline-none focus:ring focus:ring-cyan-800  focus:bg-cyan-50/10  pl-2"
                  />
                </div>

                <div className="rounded">
                  <button className="rounded-xl w-full md:w-40 text-lg font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">
                    Send Message
                  </button>
                </div>
              </div>


            </form>




          </div></div>

      </>
      ) : (<>
        {/* Default Page */}
        <div className="container w-3/4 mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4 ">
          <div className=" p-4 rounded-xl bg-gray-300/50 ">
            <div className="text-xl  font-semibold md:text-5xl">

              ⭐️Welcome to SecureChat
            </div>
            <div className="mt-1 md:mt-4 text-justify">SecureChat is a platform that allows you to have secure and private conversations with your friends. To get started, simply enter a unique username and a Room ID. Share this Room ID with your friend, and they can join your secure conversation.</div>

          </div>
          <div className=" p-4 rounded-xl bg-gray-300/50 ">
            <div className="text-xl  font-semibold md:text-5xl">


              How it Works:
            </div>
            <div className="mt-1 md:mt-4 text-justify ">
              <ol className="list-decimal list-inside space-y-3">
                <li className="font-semibold">Enter Your Details:
                  <ul className="font-normal list-disc list-inside ">

                    <li className="">Choose a unique username.</li>
                    <li>Enter a Room ID for your private conversation.</li>
                  </ul>
                </li>
                <li className="font-semibold">Share Room ID:
                  <ul className="font-normal list-disc list-inside">
                    <li>Share the Room ID with your friend.</li>

                  </ul>
                </li>
                <li className="font-semibold">Start Chatting:
                  <ul className="font-normal list-disc list-inside ">
                    <li>Once your friend joins with the Room ID, your secure conversation begins.</li>

                  </ul>
                </li>

              </ol>
            </div>

          </div>
        </div>

        {/* Login Details */}
        <div className="container mx-auto p-4 flex-nowrap justify-center text-center gap-4 text-lg">
          <div className="text-2xl">
            Enter Username and a Room ID
          </div>
          <form onSubmit={handleJoinRoom}>
            <div className="p-4  rounded ">
              <input value={username} required type="text" name="username" id="username" placeholder="Enter Username" className="p-1 w-56 border focus:outline-none focus:ring focus:ring-cyan-300  focus:bg-cyan-50/10 border-gray-300 pl-2" onChange={(e) => { setUsername(e.target.value) }} />
            </div>
            <div className="p-4  rounded ">
              <input required type="number" name="roomid" id="roomid" placeholder="Enter Room Id" className="w-56 border focus:outline-none focus:ring focus:ring-cyan-300  focus:bg-cyan-50/10 border-gray-300 pl-2" onChange={(e) => { setRoom(e.target.value) }} value={room} />
            </div>
            <div className="p-4  rounded ">
              <button className="w-20 text-lg font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">Join</button>

            </div>
          </form>
        </div>

      </>)
      }
    </>
  );
};

export default ChatApp;
