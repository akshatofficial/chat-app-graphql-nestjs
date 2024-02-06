import React, { useState } from 'react';
import { useGeneralStore } from '../stores/generalStore';
import { Button, Group, Modal, MultiSelect, Stepper, TextInput } from '@mantine/core';
import { useMutation, useQuery } from '@apollo/client';
import { Chatroom, Mutation, Query } from '../gql/graphql';
import { CREATE_CHATROOM } from '../graphql/mutations/CreateChatroom';
import { useForm } from '@mantine/form';
import { SEARCH_USER } from '../graphql/queries/SearchUser';
import { ADD_USERS_TO_CHATROOM } from '../graphql/mutations/AddUsersToChatroom';
import { IconPlus } from '@tabler/icons-react';

function AddChatroom() {
  const [active, setActive] = useState(1);
  const [highestStepVisited, setHighestStepVisited] = useState(active);
  const handleStepChange = (nxtStep: number) => {
    const isOutOfBound: boolean = nxtStep > 2 || nxtStep < 0;

    if (isOutOfBound) return;

    setActive(nxtStep);
    setHighestStepVisited((prevHighest) => Math.max(prevHighest, nxtStep));
  };
  const isCreateRoomModalOpen = useGeneralStore((state) => state.isCreateRoomModalOpen);
  const toggleCreateRoomModal = useGeneralStore((state) => state.toggleCreateRoomModal);

  const [createChatroom, { loading: createChatroomLoading }] = useMutation<Mutation>(CREATE_CHATROOM);

  const createChatroomForm = useForm({
    initialValues: {
      name: '',
    },
    validate: {
      name: (val) => (val.trim().length >= 3 ? null : 'Chatroom name must be of atleast 3 length'),
    },
  });

  const [newlyCreatedChatroom, setNewlyCreatedChatroom] = useState<Chatroom | null>(null);

  const handleCreateChatroom = async () => {
    await createChatroom({
      variables: {
        name: createChatroomForm.values.name,
      },
      onCompleted: (data) => {
        console.log(data);
        setNewlyCreatedChatroom(data.createChatroom);
        handleStepChange(active + 1);
      },
      onError: (error) => {
        console.log(error);
        createChatroomForm.setErrors({
          name: error.graphQLErrors[0].extensions?.names as string,
        });
      },
      refetchQueries: ['GetUserChatrooms'],
    });
  };

  const [searchTerm, setSearchTerm] = useState<String>('');
  const { data, refetch } = useQuery<Query>(SEARCH_USER, {
    variables: {
      fullname: searchTerm,
    },
  });
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [addUsersToChatroom, { loading: addUsersToChatroomLoading }] = useMutation<Mutation>(ADD_USERS_TO_CHATROOM);
  const handleAddUsersToChatroom = async () => {
    await addUsersToChatroom({
      variables: {
        chatroomId: newlyCreatedChatroom?.id && parseInt(newlyCreatedChatroom.id),
        userIds: selectedUsers.map((user) => parseInt(user)),
      },
      onCompleted: (data) => {
        console.log(data);
        handleStepChange(1);
        toggleCreateRoomModal();
        setSelectedUsers([]);
        setNewlyCreatedChatroom(null);
        createChatroomForm.reset();
      },
      onError: (error) => {
        createChatroomForm.setErrors({
          name: error.graphQLErrors[0].extensions?.name as string,
        });
      },
      refetchQueries: ['GetUserChatrooms'],
    });
  };

  let debounceTime: NodeJS.Timeout;
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);

    clearTimeout(debounceTime);
    debounceTime = setTimeout(() => {
      refetch();
    }, 300);
  };
  type SelectItem = {
    label: string,
    value: string,
  };
  const selectItems: SelectItem[] =
    data?.searchUser?.map((user) => ({
      label: user.fullname,
      value: String(user.id),
    })) || [];
  return (
    <Modal opened={isCreateRoomModalOpen} onClose={toggleCreateRoomModal}>
      <Stepper active={active} onStepClick={setActive} breakpoint={'sm'}>
        <Stepper.Step label="Step 1" description="Create Chatroom">
          <div>Create a Chatroom</div>
        </Stepper.Step>
        <Stepper.Step label="Step 2" description="Add Members">
          <form onSubmit={createChatroomForm.onSubmit(() => handleCreateChatroom())}>
            <TextInput
              label="Chatroom name"
              placeholder="Enter the chatroom name"
              error={createChatroomForm.errors.name}
              {...createChatroomForm.getInputProps('name')}
            />
            {createChatroomForm.values.name && (
              <Button type="submit" mt={'md'} loading={createChatroomLoading}>
                Create Room
              </Button>
            )}
          </form>
        </Stepper.Step>
        <Stepper.Completed>
          <MultiSelect
            onSearchChange={handleSearchChange}
            nothingFound="No user found"
            searchable
            pb={'xl'}
            data={selectItems}
            label="Choose the chatroom users you want to add"
            placeholder="Choose all the users that you want to add to this chaatroom"
            onChange={(values) => setSelectedUsers(values)}
          />
        </Stepper.Completed>
      </Stepper>
      {active !== 1 && (
        <Group mt={'xl'}>
          <Button variant="default" onClick={() => handleStepChange(active - 1)}>
            Back
          </Button>
          {selectedUsers.length > 0 && (
            <Button
              color="blue"
              leftIcon={<IconPlus />}
              onClick={handleAddUsersToChatroom}
              loading={addUsersToChatroomLoading}
            >
              Add Users
            </Button>
          )}
        </Group>
      )}
    </Modal>
  );
}

export default AddChatroom;
