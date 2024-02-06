import React, { useEffect, useRef, useState } from 'react'
import { useGeneralStore } from '../stores/generalStore'
import { useUserStore } from '../stores/userStore';
import { useForm } from '@mantine/form';
import { useMutation } from '@apollo/client';
import { UPDATE_PROFILE } from '../graphql/mutations/UpdateUserProfile';
import { Avatar, Button, FileInput, Flex, Group, Modal, TextInput } from '@mantine/core';
import { Mutation } from '../gql/graphql';
import { IconEditCircle } from '@tabler/icons-react';
import { GraphQLErrorExtensions } from 'graphql';

function ProfileSettings() {
    const isProfileSettingsModalOpen = useGeneralStore((state) => state.isProfileSettingsModalOpen);
    const toggleProfileSettingsModal = useGeneralStore((state) => state.toggleProfileSettingsModal);

    const profileImage = useUserStore((state) => state.avatarUrl)
    const updateProfileImage = useUserStore((state) => state.updateProfileImage)

    const fullname = useUserStore((state) => state.fullname)
    const updateFullname = useUserStore((state) => state.updateUsername)

    const [imageFile, setImageFile] = useState<File | null>(null);
    const imagePreview = imageFile ? URL.createObjectURL(imageFile) : null;

    const fileInputRef = useRef<HTMLButtonElement>(null);
    
    // useEffect(() => {
    //     if(!!imageFile) {
    //         setImagePreview(URL.createObjectURL(imageFile));
    //     }
    // }, [imageFile]);

    useEffect(() => {
        console.log("PI ----> ",  profileImage);
        console.log("IP ----> ", imagePreview);
    }, [profileImage, imagePreview]);

    // const [updateForm, setUpdateForm]

    const updateForm = useForm({
        initialValues: {
            profileImage: profileImage,
            fullname: fullname
        },
        validate: {
            fullname: (value) => value.trim().length >= 3 ? null : "Name must be of length atleast 3."
        }
    })

    useEffect(() => {  
        if(profileImage && fullname) {
            updateForm.setFieldValue("profileImage", profileImage);
            updateForm.setFieldValue("fullname", fullname);
        }
    }, [profileImage, fullname])

    const [updateProfile, {loading: updateProfileLoading}] = useMutation<Mutation>(UPDATE_PROFILE)

    const [errors, setErrors] = useState<GraphQLErrorExtensions>({});

    const handleOnSubmitUpdateForm = async() => {
        if(updateForm.validate().hasErrors) return ;
        setErrors({});

        await updateProfile({
            variables: {
                fullname: updateForm.values.fullname,
                file: imageFile
            },
            onCompleted: (data) => {
                // console.log(data);
                updateProfileImage(data.updateUserProfile.avatarUrl ?? "")
                updateFullname(data.updateUserProfile.fullname)
                toggleProfileSettingsModal()
            },
        }).catch((err) => {
            console.log(err);
            console.log(err.graphQLErrors, "ERROR")
            setErrors(err.graphQLErrors[0].extensions)
            useGeneralStore.setState({isProfileSettingsModalOpen: true})
        })
    }

  return (
    <Modal centered opened={isProfileSettingsModalOpen} onClose={toggleProfileSettingsModal} title="Profile Settings">
        <form onSubmit={updateForm.onSubmit(() => handleOnSubmitUpdateForm())}>
            <Group pos={"relative"} w={100} h={100} style={{cursor: "pointer"}} onClick={() => fileInputRef.current?.click()}>
                <Avatar src={profileImage || imagePreview || null} style={{border: "1px solid grey"}} alt='profile' h={100} w={100} radius={100} />
                <IconEditCircle
                    color="black"
                    size={30}
                    style={{
                    position: "absolute",
                    top: 50,
                    right: -10,
                    background: "white",
                    border: "1px solid black",
                    padding: 5,
                    borderRadius: 100,
                    }}
                />
                <FileInput
                    ref={fileInputRef}
                    style={{ display: "none" }}
                    pos={"absolute"}
                    accept="image/*"
                    onChange={(file) => setImageFile(file)}
                />
            </Group>
            <TextInput
                style={{marginTop: 20}}
                label="Fullname"
                placeholder="Choose a full name"
                {...updateForm.getInputProps("fullname")}
                onChange={(event) => {
                    updateForm.setFieldValue("fullname", event.currentTarget.value)
                  }}
                error={updateForm.errors.fullname || (errors?.fullname as string)}
              />
              <Flex gap="md" mt="sm">
                <Button onClick={handleOnSubmitUpdateForm}>Save</Button>
                <Button onClick={toggleProfileSettingsModal} variant="link">
                    Cancel
                </Button>
        </Flex>
        </form>
    </Modal>
  )
}

export default ProfileSettings