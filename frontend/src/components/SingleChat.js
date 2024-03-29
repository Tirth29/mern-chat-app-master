import { FormControl } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { Box, Text } from "@chakra-ui/layout";
import "./styles.css";
import { IconButton, Spinner, useToast } from "@chakra-ui/react";
import { getSender, getSenderFull } from "../config/ChatLogics";
import { useEffect, useState } from "react";
import axios from "axios";
import { ArrowBackIcon } from "@chakra-ui/icons";
import ProfileModal from "./miscellaneous/ProfileModal";
import ScrollableChat from "./ScrollableChat";
import Lottie from "react-lottie";
import animationData from "../animations/typing.json";
import Picker from "emoji-picker-react";
import MessageScheduleModal from "./miscellaneous/MessageScheduleModel";

import io from "socket.io-client";
import UpdateGroupChatModal from "./miscellaneous/UpdateGroupChatModal";
import { ChatState } from "../Context/ChatProvider";
import { socket_host } from "../config.json";
const ENDPOINT = socket_host; // "https://QuickChat.herokuapp.com"; -> After deployment
var socket, selectedChatCompare;

let audioChunks = [];
let audioBlob;
let audioBuffer;
let mediaRecorder;

const SingleChat = ({ fetchAgain, setFetchAgain }) => {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typing, setTyping] = useState(false);
  const [istyping, setIsTyping] = useState(false);
  const [delay, setDelay] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const toast = useToast();

  const defaultOptions = {
    loop: true,
    autoplay: true,
    animationData: animationData,
    rendererSettings: {
      preserveAspectRatio: "xMidYMid slice",
    },
  };
  const { selectedChat, setSelectedChat, user, notification, setNotification } =
    ChatState();

  const fetchMessages = async () => {
    if (!selectedChat) return;

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      setLoading(true);

      const { data } = await axios.get(
        `/api/message/${selectedChat._id}`,
        config
      );

      setMessages(data);
      setLoading(false);

      socket.emit("join chat", selectedChat._id);
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: "Failed to Load the Messages",
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
    }
  };

  const sendMessage = async (event) => {
    if (
      (event.type === "click" || event.key === "Enter") &&
      (newMessage || audioBuffer)
    ) {
      socket.emit("stop typing", selectedChat._id);
      console.log(delay);
      try {
        const config = {
          headers: {
            "Content-type": "application/json",
            Authorization: `Bearer ${user.token}`,
            maxBodyLength: 100000000,
          },
        };
        setNewMessage("");
        const { data } = await axios.post(
          "http://localhost:3001/api/message",
          JSON.stringify({
            content: newMessage,
            chatId: selectedChat,
            delay: delay * 1000,
            audio: audioBuffer?.join(","),
            type: audioBuffer ? "audio" : "text",
          }),
          config
        );

        data.delay = delay;
        data.type = audioBlob ? "audio" : "text";
        data.audioBlob = audioBlob;
        data.audioBuffer = audioBuffer;

        console.log(data);

        audioBlob = null;
        audioChunks = [];
        audioBuffer = null;

        if (delay > 0) {
          socket.emit("schedule_message", data);
        } else {
          socket.emit("new message", data);
        }
        setMessages([...messages, data]);
      } catch (error) {
        toast({
          title: "Error Occured!",
          description: "Failed to send the Message",
          status: "error",
          duration: 5000,
          isClosable: true,
          position: "bottom",
        });
      }
    }
  };

  const delayset = (data) => {
    setDelay(data);
  };

  useEffect(() => {
    socket = io(ENDPOINT);
    socket.emit("setup", user);
    socket.on("connected", () => setSocketConnected(true));
    socket.on("typing", () => setIsTyping(true));
    socket.on("stop typing", () => setIsTyping(false));

    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    fetchMessages();

    selectedChatCompare = selectedChat;
    // eslint-disable-next-line
  }, [selectedChat]);

  useEffect(() => {
    socket.on("message recieved", (newMessageRecieved) => {
      console.log("New message received:", newMessageRecieved);
      if (
        !selectedChatCompare || // if chat is not selected or doesn't match current chat
        selectedChatCompare._id !== newMessageRecieved.chat._id
      ) {
        if (!notification.includes(newMessageRecieved)) {
          setNotification([newMessageRecieved, ...notification]);
          setFetchAgain(!fetchAgain);
        }
      } else {
        setMessages([...messages, newMessageRecieved]);
      }
    });
  });

  const startRecording = () => {
    audioChunks = [];
    try {
      mediaRecorder.start();
      // startRecordingButton.disabled = true;
      // stopRecordingButton.disabled = false;
      // errorMessage.textContent = "";
    } catch (error) {
      console.error("Error starting recording:", error);
      // errorMessage.textContent =
      // "Error starting recording. Please check microphone permissions.";
    }
  };

  const stopRecording = () => {
    try {
      mediaRecorder.stop();
      // startRecordingButton.disabled = false;
      // stopRecordingButton.disabled = true;
    } catch (error) {
      console.error("Error stopping recording:", error);
      // errorMessage.textContent = "Error stopping recording.";
    }
  };

  useEffect(() => {
    console.log("setting up media");
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((stream) => {
        mediaRecorder = new MediaRecorder(stream);

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };
        mediaRecorder.onstop = async () => {
          audioBlob = new Blob(audioChunks, { type: "audio/wav" });
          // console.log("Audio blob: ", audioBlob);
          const audioUrl = URL.createObjectURL(audioBlob);
          audioBuffer = new Uint8Array(await audioBlob.arrayBuffer());
          // document.getElementById("audioPlayer")?.src = audioUrl;
        };
      })
      .catch((error) => {
        console.error("Error accessing microphone:", error);
        // errorMessage.textContent =
        // "Error accessing microphone. Please grant permission and reload the page.";
      });
  }, []);

  const [showPicker, setShowPicker] = useState(false);
  const onEmojiClick = (event, emojiObject) => {
    console.log(emojiObject);
    // console.log(event);
    setNewMessage((prevInput) => {
      return prevInput + event.emoji;
    });
    console.log(messages);
    setShowPicker(false);
  };

  const typingHandler = (e) => {
    setNewMessage(e.target.value);

    if (!socketConnected) return;

    if (!typing) {
      setTyping(true);
      socket.emit("typing", selectedChat._id);
    }
    let lastTypingTime = new Date().getTime();
    var timerLength = 3000;
    setTimeout(() => {
      var timeNow = new Date().getTime();
      var timeDiff = timeNow - lastTypingTime;
      if (timeDiff >= timerLength && typing) {
        socket.emit("stop typing", selectedChat._id);
        setTyping(false);
      }
    }, timerLength);
  };

  return (
    <>
      {selectedChat ? (
        <>
          <Text
            fontSize={{ base: "28px", md: "30px" }}
            pb={3}
            px={2}
            w="100%"
            fontFamily="Work sans"
            d="flex"
            justifyContent={{ base: "space-between" }}
            alignItems="center"
          >
            <IconButton
              d={{ base: "flex", md: "none" }}
              icon={<ArrowBackIcon />}
              onClick={() => setSelectedChat("")}
            />
            {messages &&
              (!selectedChat.isGroupChat ? (
                <>
                  {getSender(user, selectedChat.users)}
                  <ProfileModal
                    user={getSenderFull(user, selectedChat.users)}
                  />
                </>
              ) : (
                <>
                  {selectedChat.chatName.toUpperCase()}
                  <UpdateGroupChatModal
                    fetchMessages={fetchMessages}
                    fetchAgain={fetchAgain}
                    setFetchAgain={setFetchAgain}
                  />
                </>
              ))}
          </Text>
          <Box
            d="flex"
            flexDir="column"
            justifyContent="flex-end"
            p={3}
            bg="#E8E8E8"
            w="100%"
            h="100%"
            borderRadius="lg"
            overflowY="hidden"
          >
            {loading ? (
              <Spinner
                size="xl"
                w={20}
                h={20}
                alignSelf="center"
                margin="auto"
              />
            ) : (
              <div className="messages">
                <ScrollableChat messages={messages} />
              </div>
            )}

            <FormControl
              onKeyDown={sendMessage}
              id="first-name"
              isRequired
              mt={3}
            >
              {istyping ? (
                <div>
                  <Lottie
                    options={defaultOptions}
                    // height={50}
                    width={70}
                    style={{ marginBottom: 15, marginLeft: 0 }}
                  />
                </div>
              ) : (
                <></>
              )}
              {/* <audio id="audioPlayer" controls></audio> */}

              <div className="picker-container">
                <Input
                  variant="filled"
                  bg="#E0E0E0"
                  placeholder="Enter a message.."
                  value={newMessage}
                  onChange={typingHandler}
                />
                <div
                  className="audio-container"
                  onClick={() => {
                    if (isRecording) {
                      console.log("stop");
                      stopRecording();
                      setIsRecording(false);
                    } else {
                      console.log("start");
                      startRecording();
                      setIsRecording(true);
                    }
                  }}
                >
                  {isRecording ? (
                    <div className="recording"></div>
                  ) : (
                    <div className="audio-icon">
                      <img
                        src="https://icons.getbootstrap.com/assets/icons/mic.svg"
                        alt="mic"
                        style={{ height: "25px", width: "25px" }}
                      />
                    </div>
                  )}
                </div>
                <div className="msg-scheduler">
                  <MessageScheduleModal user={user} delayset={delayset} />
                </div>
                <img
                  className="emoji-icon"
                  src="https://icons.getbootstrap.com/assets/icons/emoji-smile.svg"
                  onClick={() => setShowPicker((val) => !val)}
                  alt="emoji"
                  style={{ height: "25px", width: "25px" }}
                />
                <img
                  className="send-icon"
                  src="https://cdn-icons-png.flaticon.com/128/9502/9502119.png"
                  onClick={(e) => sendMessage(e)}
                  alt="emoji"
                  style={{ height: "30px", width: "30px" }}
                />
                {showPicker && (
                  <Picker
                    pickerStyle={{ width: "100%" }}
                    onEmojiClick={onEmojiClick}
                  />
                )}
              </div>
            </FormControl>
          </Box>
        </>
      ) : (
        // to get socket.io on same page
        <Box d="flex" alignItems="center" justifyContent="center" h="100%">
          <Text fontSize="3xl" pb={3} fontFamily="Work sans">
            Click on a user to start chatting
          </Text>
        </Box>
      )}
    </>
  );
};

export default SingleChat;
