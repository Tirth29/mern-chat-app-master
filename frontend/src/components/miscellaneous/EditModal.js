import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Button,
  useDisclosure,
  IconButton,
  ModalHeader,
  ModalCloseButton,
} from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";
import { useToast } from "@chakra-ui/toast";
import axios from "axios";
import { useState } from "react";
import { useHistory } from "react-router";

const EditModal = ({ user, children }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  // const [show, setShow] = useState(false);
  const toast = useToast();
  const history = useHistory();

  const [name, setName] = useState(user.name);
  const [pic, setPic] = useState(user.pic);
  const [picLoading, setPicLoading] = useState(false);
  const [number, setNumber] = useState(user.number);

  const submitHandler = async () => {
    setPicLoading(true);
    console.log(name, number, pic);
    try {
      const config = {
        headers: {
          "Content-type": "application/json",
        },
      };
      const { data } = await axios.post(
        "/api/user/edit",
        {
          name,
          number,
          email: user.email,
          pic,
        },
        config
      );
      console.log(data);
      toast({
        title: "Update Profile Successful",
        status: "success",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      localStorage.setItem("userInfo", JSON.stringify(data));
      setPicLoading(false);
      history.push("/chats");
    } catch (error) {
      toast({
        title: "Error Occured!",
        description: error.response.data.message,
        status: "error",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
    }
  };

  const postDetails = (pics) => {
    setPicLoading(true);
    if (pics === undefined) {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      return;
    }
    console.log(pics);
    if (
      pics.type === "image/jpeg" ||
      pics.type === "image/png" ||
      pics.type === "image/jpg"
    ) {
      const data = new FormData();
      data.append("file", pics);
      data.append("upload_preset", "chat-app");
      data.append("cloud_name", "da4imwbrd");
      fetch("https://api.cloudinary.com/v1_1/da4imwbrd/image/upload", {
        method: "post",
        body: data,
      })
        .then((res) => res.json())
        .then((data) => {
          setPic(data.url.toString());
          console.log(data.url.toString());
          setPicLoading(false);
        })
        .catch((err) => {
          console.log(err);
          setPicLoading(false);
        });
    } else {
      toast({
        title: "Please Select an Image!",
        status: "warning",
        duration: 5000,
        isClosable: true,
        position: "bottom",
      });
      setPicLoading(false);
      return;
    }
  };
  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <IconButton d={{ base: "flex" }} icon={<ViewIcon />} onClick={onOpen} />
      )}
      <Modal size="lg" onClose={onClose} isOpen={isOpen} isCentered>
        <ModalOverlay />
        <ModalContent h="410px" p="40px">
          <ModalHeader
            fontSize="20px"
            fontFamily="Work sans"
            d="flex"
            justifyContent="center"
          >
            {user.email}
          </ModalHeader>
          <ModalCloseButton />
          <FormControl id="first-name">
            <FormLabel>Name</FormLabel>
            <Input
              placeholder={user.name}
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </FormControl>
          <FormControl id="number">
            <FormLabel>Phone No.</FormLabel>
            <Input
              type="number"
              placeholder="Enter Your Phone No."
              value={number}
              onChange={(e) => setNumber(e.target.value)}
            />
          </FormControl>
          <FormControl id="pic">
            <FormLabel>Upload your Picture</FormLabel>
            <Input
              type="file"
              p={1.5}
              accept="image/*"
              onChange={(e) => postDetails(e.target.files[0])}
            />
          </FormControl>
          <Button
            colorScheme="blue"
            width="100%"
            style={{ marginTop: 15 }}
            onClick={submitHandler}
            isLoading={picLoading}
          >
            Save
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};

export default EditModal;
