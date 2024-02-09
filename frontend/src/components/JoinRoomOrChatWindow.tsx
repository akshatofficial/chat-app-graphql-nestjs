import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ChatWindow from './ChatWindow';
import { Flex, Text } from '@mantine/core';

function JoinRoomOrChatWindow() {
  const { id } = useParams<{ id: string }>();

  const [contentToRender, setContentToRender] = useState<React.ReactNode | string>('');
  useEffect(() => {
    if (!id) {
      setContentToRender('Please choose a chatroom');
    } else {
      setContentToRender(ChatWindow);
    }
  }, [setContentToRender, id]);
  return (
    <Flex h={'100vh'} w={'100%'} justify={'center'} align={'center'}>
      <Text size={!id ? 'xl': ""}>{contentToRender}</Text>
    </Flex>
  );
}

export default JoinRoomOrChatWindow;
