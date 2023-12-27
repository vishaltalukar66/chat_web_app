import Pusher from 'pusher-js';
import React, { useState, useEffect } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ChatApp: React.FC = () => {
  // State for user authentication
  const [auth, setAuth] = useState(false);
  // State for the user's username
  const [username, setUsername] = useState<string>('');
  // State for the chat room ID
  const [room, setRoom] = useState<string>('');
  // State to store all chat messages
  const [allMessages, setAllMessages] = useState<{ room: string, message: string, username: string }[]>([]);
  // State for the current message being typed
  const [message, setMessage] = useState("");

  // Function to handle user joining a chat room
  const handleJoinRoom = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      // API call to join the chat room
      const response = await fetch(`https://web-rtc-backend-delta.vercel.app/common/createroom`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room: room, newUsername: username })
      })
        .then((res) => res.json())
        .then((jsonData) => jsonData as { status: number, message: string });

      // Handling the response
      if (response.status === 200) {
        // Invoke Pusher to subscribe to the chat room
        subscribeToNewUserChannel();
        // Update authentication state
        setAuth(!auth);
        // Show success message
        toast.success(`Joined room ${room}`);
      } else {
        // Show warning message in case of an error
        toast.warn(`${response.message}`);
      }
    } catch (error) {
      console.error('Error joining room:', error);
    }
  }

  // Function to copy the chat room ID to the clipboard
  const copyRoom = () => {
    window.navigator.clipboard.writeText(room);
  }

  // Function to subscribe to the chat room channel using Pusher
  const subscribeToNewUserChannel = () => {
    Pusher.logToConsole = false;

    // Initializing Pusher
    const pusher = new Pusher(import.meta.env.VITE_APIkey, {
      cluster: 'ap2'
    });
    // Subscribing to the specific chat room channel
    const channel = pusher.subscribe(`chat-${room}`);

    // Handling events on the channel
    channel.bind('user-joined', (data: { room: string, newUsername: string }) => {
      // Show a toast when a new user joins
      toast(`${data.newUsername} joined the room ${data.room}`);
    });

    channel.bind('message', (data: { room: string, username: string, message: string }) => {
      // Add the received message to the state
      setAllMessages((prevMessages) => [...prevMessages, data]);
      console.log(JSON.stringify(data));
    });
  }

  // Function to send a chat message
  const sendData = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    try {
      // API call to send a message
      const response = await fetch(`https://web-rtc-backend-delta.vercel.app/common/message`, {
        method: 'POST',
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ room: room, username: username, message: message, })
      })
        .then((res) => res.json())
        .then((jsonData) => jsonData as { status: number, message: string });

      // Handling the response
      if (response.status === 200) {
        // Show success message
        toast.success("A message has been sent.")
        // Clear the message input field
        setMessage("");
      } else {
        // Show warning message in case of an error
        toast.warn(`${response.message}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }

  // Cleanup function to unsubscribe from Pusher when the component unmounts
  useEffect(() => {
    return () => {
      Pusher.logToConsole = false;
      const pusher = new Pusher(import.meta.env.VITE_APIkey, {
        cluster: 'ap2'
      });
      // Unsubscribe from the specific chat room channel
      pusher.unsubscribe(`chat-${room}`);
    };
  }, [room]);

  // Render JSX based on authentication state
  return (
    <>
      <ToastContainer />
      {auth ? (
        <>
          {/* Display messages */}
          <div className="text-center ">
            <div className="text-5xl p-5">
              Private message <button onClick={copyRoom} className="rounded-xl w-full md:w-40 text-sm font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">Copy Room ID</button>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 items-center justify-center mb-36 overflow-y-auto p-5 text-xl mt-1 md:mb-28">
            <div className="flex flex-col flex-auto h-full p-6">
              <div className="flex flex-col flex-auto flex-shrink-0 rounded-2xl bg-gray-100 h-full p-4">
                <div className="flex flex-col h-full overflow-x-auto mb-4">
                  <div className="flex flex-col h-full">
                    <div className="grid grid-cols-12 gap-y-2">
                      {/* Displaying all chat messages */}
                      {allMessages.map((val, key) => (
                        (val.username === username) ? (
                          <div key={key} className="col-start-6 col-end-13 p-3 rounded-lg">
                            {/* Self message */}
                            <div className="flex items-center justify-start flex-row-reverse">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {val.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="relative mr-3 text-sm bg-indigo-100 py-2 px-4 shadow rounded-xl">
                                {val.message}
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div key={key} className="col-start-1 col-end-8 p-3 rounded-lg">
                            {/* Other's message */}
                            <div className="flex flex-row items-center">
                              <div className="flex items-center justify-center h-10 w-10 rounded-full bg-indigo-500 flex-shrink-0">
                                {val.username.charAt(0).toUpperCase()}
                              </div>
                              <div className="relative ml-3 text-sm bg-white py-2 px-4 shadow rounded-xl">
                                {val.message}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Send message form */}
              <form onSubmit={sendData}>
                <div className="fixed bottom-0 text-center left-0 w-full bg-white p-4 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                  <div className="rounded">
                    {/* Message input field */}
                    <input
                      required
                      value={message}
                      onChange={(e) => { setMessage(e.target.value) }}
                      type="text"
                      name="roomid"
                      id="roomid"
                      placeholder="Enter Message"
                      className="rounded-2xl w-full p-1 md:w-96 border-2 border-cyan-300 focus:outline-none focus:ring focus:ring-cyan-800 focus:bg-cyan-50/10 pl-2"
                    />
                  </div>
                  <div className="rounded">
                    {/* Send message button */}
                    <button className="rounded-xl w-full md:w-40 text-lg font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">
                      Send Message
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </>
      ) : (
        <>
          {/* Default Page for non-authenticated users */}
          <div className="container w-3/4 mx-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl bg-gray-300/50 ">
              <div className="text-xl font-semibold md:text-5xl">
                ⭐️Welcome to SecureChat
              </div>
              <div className="mt-1 md:mt-4 text-justify">
                SecureChat is a platform that allows you to have secure and private conversations with your friends. To get started, simply enter a unique username and a Room ID. Share this Room ID with your friend, and they can join your secure conversation.
              </div>
            </div>
            <div className="p-4 rounded-xl bg-gray-300/50 ">
              <div className="text-xl font-semibold md:text-5xl">
                How it Works:
              </div>
              <div className="mt-1 md:mt-4 text-justify">
                {/* List of steps for using SecureChat */}
                <ol className="list-decimal list-inside space-y-3">
                  <li className="font-semibold">Enter Your Details:
                    <ul className="font-normal list-disc list-inside ">
                      <li>Choose a unique username.</li>
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

          {/* Login Details Form */}
          <div className="container mx-auto p-4 flex-nowrap justify-center text-center gap-4 text-lg">
            <div className="text-2xl">
              Enter Username and a Room ID
            </div>
            <form onSubmit={handleJoinRoom}>
              <div className="p-4  rounded ">
                {/* Username input field */}
                <input
                  value={username}
                  required
                  type="text"
                  name="username"
                  id="username"
                  placeholder="Enter Username"
                  className="p-1 w-56 border focus:outline-none focus:ring focus:ring-cyan-300 focus:bg-cyan-50/10 border-gray-300 pl-2"
                  onChange={(e) => { setUsername(e.target.value) }}
                />
              </div>
              <div className="p-4  rounded ">
                {/* Room ID input field */}
                <input
                  required
                  type="number"
                  name="roomid"
                  id="roomid"
                  placeholder="Enter Room Id"
                  className="w-56 border focus:outline-none focus:ring focus:ring-cyan-300 focus:bg-cyan-50/10 border-gray-300 pl-2"
                  onChange={(e) => { setRoom(e.target.value) }}
                  value={room}
                />
              </div>
              <div className="p-4  rounded ">
                {/* Join button */}
                <button className="w-20 text-lg font-semibold p-1 border focus:outline-none focus:ring focus:ring-cyan-300 bg-cyan-600/40 hover:bg-cyan-600 border-gray-300">
                  Join
                </button>
              </div>
            </form>
          </div>
        </>
      )}
    </>
  );
};

export default ChatApp;
