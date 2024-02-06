import React, { useState } from 'react';
import { useGeneralStore } from '../stores/generalStore';
import { useUserStore } from '../stores/userStore';
import { useMutation, useQuery } from '@apollo/client';
import { Mutation, Query } from '../gql/graphql';
import { GET_USER_CHATROOMS } from '../graphql/queries/getUserChatrooms';
import { useMediaQuery } from '@mantine/hooks';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DELETE_CHATROOM } from '../graphql/mutations/DeleteChatroom';
import { Button, Card, Flex, Group, Loader, ScrollArea, Text } from '@mantine/core';
import { IconPlus, IconTrashX, IconX } from '@tabler/icons-react';
import OverlappingAvatars from './OverlappingAvatars';

function RoomList() {
  const toggleCreateRoomModal = useGeneralStore((state) => state.toggleCreateRoomModal);
  const userId = useUserStore((state) => state.id);

  console.log(userId);
  const {
    data,
    loading: getUserChatroomsLoading,
    error,
  } = useQuery<Query>(GET_USER_CHATROOMS, {
    variables: {
      userId: userId,
    },
  });

  const isSmallDevice = useMediaQuery('(max-width: 768px)');
  const responsiveTextStyle: React.CSSProperties = {
    textOverflow: isSmallDevice ? 'unset' : 'ellipsis',
    whiteSpace: isSmallDevice ? 'unset' : 'nowrap',
    overflow: isSmallDevice ? 'unset' : 'hidden',
  };
  const responsiveFlexStyles: React.CSSProperties = {
    maxWidth: isSmallDevice ? 'unset' : '200px',
  };

  const [activeChatroomId, setActiveChatroomId] = useState<number | null>(
    parseInt(useParams<{ id: string }>().id || '0')
  );

  const navigate = useNavigate();
  const [deleteChatroom] = useMutation<Mutation>(DELETE_CHATROOM, {
    variables: {
      chatroomId: activeChatroomId,
    },
    refetchQueries: [
      {
        query: GET_USER_CHATROOMS,
        variables: {
          userId: userId,
        },
      },
    ],
    onCompleted: (data) => {
      console.log(data);
      navigate('/');
    },
  });
  return (
    <Flex direction={'row'} w={isSmallDevice ? 'calc(100% - 105px)' : '550px'} h={'100vh'} ml={'105px'}>
      <Card shadow="md" w={'100%'} p={0}>
        <Group position="apart" w={'100%'} mb={'md'} mt={'md'}>
          <Button variant="light" leftIcon={<IconPlus />} onClick={toggleCreateRoomModal}>
            Create Chatroom
          </Button>
          <ScrollArea h={'83vh'} w={'100%'}>
            <Flex direction={'column'}>
              <Flex justify={'center'} align={'center'} h={'100%'} mih={'75px'}>
                {getUserChatroomsLoading && (
                  <Flex align={'center'}>
                    <Loader mr={'md'} />
                    <Text italic c={'dimmed'}>
                      Loading
                    </Text>
                  </Flex>
                )}
              </Flex>
              {data?.getUserChatrooms?.map((chatroom) => (
                <Link
                  style={{
                    transition: 'background-color 0.3s',
                    cursor: 'pointer',
                  }}
                  to={`/chatrooms/${chatroom.id}`}
                  key={chatroom.id}
                  onClick={() => setActiveChatroomId(parseInt(chatroom.id || '0'))}
                >
                  <Card
                    style={
                      activeChatroomId === parseInt(chatroom.id || '0') ? { backgroundColor: '#f0f1f1' } : undefined
                    }
                    mih={120}
                    py={'md'}
                    withBorder
                    shadow="md"
                  >
                    <Flex justify={'space-around'}>
                      {chatroom.users && (
                        <Flex align={'center'}>
                          <OverlappingAvatars users={chatroom.users} />
                        </Flex>
                      )}
                      {chatroom.messages && chatroom.messages.length > 0 ? (
                        <Flex style={responsiveFlexStyles} direction={'column'} align={'start'} w={'100%'} h="100%">
                          <Flex direction={'column'}>
                            <Text size="lg" style={responsiveTextStyle}>
                              {chatroom.name}
                            </Text>
                            <Text style={responsiveTextStyle}>{chatroom.messages[0].content}</Text>
                            <Text c="dimmed" style={responsiveTextStyle}>
                              {new Date(chatroom.messages[0].createdAt).toLocaleString()}
                            </Text>
                          </Flex>
                        </Flex>
                      ) : (
                        <Flex align="center" justify={'center'}>
                          <Text italic c="dimmed">
                            No Messages
                          </Text>
                        </Flex>
                      )}
                      {chatroom?.users && chatroom.users[0].id === userId && (
                        <Flex h="100%" align="end" justify={'end'}>
                          <Button
                            p={0}
                            variant="light"
                            color="red"
                            onClick={(e) => {
                              e.preventDefault();
                              deleteChatroom();
                            }}
                          >
                            <IconTrashX />
                          </Button>
                        </Flex>
                      )}
                    </Flex>
                  </Card>
                </Link>
              ))}
            </Flex>
          </ScrollArea>
        </Group>
      </Card>
    </Flex>
  );
}

export default RoomList;
