// import { ViewIcon } from "@chakra-ui/icons";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  Button,
  useDisclosure,
  ModalHeader,
  ModalCloseButton,
} from "@chakra-ui/react";
import { FormControl, FormLabel } from "@chakra-ui/form-control";
import { Input } from "@chakra-ui/input";

import { useState } from "react";


const MessageScheduleModal = ({ user, children,delayset }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [delay, setDelay] = useState();
  const [selectedDateTime, setSelectedDateTime] = useState(null);

  const submitHandler = async () => {
    if (selectedDateTime) {
      const selectedDate = new Date(selectedDateTime);
      const currentTime = new Date();
      
      // Calculate the delay in seconds
      const seconds = Math.floor((selectedDate.getTime() - currentTime.getTime()) / 1000);

      setDelay(seconds)
      delayset(seconds); // Pass the seconds to the delayset function
      // console.log(delay);
      onClose();
    }
  };

  
  return (
    <>
      {children ? (
        <span onClick={onOpen}>{children}</span>
      ) : (
        <img
            src="https://cdn-icons-png.flaticon.com/128/5196/5196789.png"
            onClick={onOpen}
            alt="message scheduler"
            style={{ height: "30px", width: "30px",marginRight: "40px" }}
          />
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
          <FormControl id="number">
            <FormLabel>Delay</FormLabel>
            <Input
              type="datetime-local"
              value={selectedDateTime}
              onChange={(e) => setSelectedDateTime(e.target.value)}
            />
          </FormControl>
          <Button
            colorScheme="blue"
            width="100%"
            style={{ marginTop: 15 }}
            onClick={submitHandler}
          >
            Save
          </Button>
        </ModalContent>
      </Modal>
    </>
  );
};

export default MessageScheduleModal;
