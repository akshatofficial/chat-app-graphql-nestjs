import { useState } from 'react'
import { useGeneralStore } from '../stores/generalStore'
import { Button, Col, Grid, Group, Modal, Paper, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { useUserStore } from '../stores/userStore';
import { GraphQLErrorExtensions } from 'graphql';
import { useMutation } from '@apollo/client';
import { Mutation } from '../gql/graphql';
import { REGISTER_USER } from '../graphql/mutations/Register';
import { LOGIN_USER } from '../graphql/mutations/Login';
import ProfileSettings from './ProfileSettings';

function AuthOverlay() {
    const isLoginModalOpen = useGeneralStore((state) => state.isLoginModalOpen);
    const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);
    const [isRegister, setIsRegister] = useState(true);
    const toggleForm = () => {
        setIsRegister(!isRegister)
      }
  

const Register = () => {
    const registerForm = useForm({
        initialValues: {
            fullname: "",
            email: "",
            password: "",
            confirmPassword: ""
        },
        validate: {
            fullname: (value: string) => 
            value.trim().length >= 3 ? null : "Username must be of 3 characters",
            email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email",
            password: (value: string) => value.trim().length >= 3 ? null : "Password must be of 3 characters",
            confirmPassword: (value: string, values) => value === values.password ? null : "Passwords do not match"
        }
    })

    const setUser = useUserStore((state) => state.setUser)
    const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);

    const [errors, setErrors] = useState<GraphQLErrorExtensions>({});

    const [registerUser, {loading: registerLoading}] = useMutation<Mutation>(REGISTER_USER);

    const handleRegister = async() => {
        setErrors({});

        await registerUser({
            variables: {
                email: registerForm.values["email"],
                password: registerForm.values["password"],
                fullname: registerForm.values["fullname"],
                confirmPassword: registerForm.values["confirmPassword"]
            },
            onCompleted: (data) => {
                setErrors({})
                if(data?.register.user)
                    setUser({
                        id: data?.register.user.id,
                        email: data?.register.user.email,
                        fullname: data?.register.user.fullname,
                    })
                toggleLoginModal();
            }
        }).catch((err) => {
            console.log(err);
            console.log(err.graphQLErrors, "ERROR")
            setErrors(err.graphQLErrors[0].extensions)
            useGeneralStore.setState({isLoginModalOpen: true})
        })
    }

    return (
        <Paper>
        <Text align="center" size="xl">
          Register
        </Text>

        <form
          onSubmit={registerForm.onSubmit(() => {
            handleRegister()
          })}
        >
          <Grid mt={20}>
            <Col span={12} md={6}>
              <TextInput
                label="Fullname"
                placeholder="Choose a full name"
                {...registerForm.getInputProps("fullname")}
                error={registerForm.errors.fullname || (errors?.fullname as string)}
              />
            </Col>

            <Col span={12} md={6}>
              <TextInput
                autoComplete="off"
                label="Email"
                placeholder="Enter your email"
                {...registerForm.getInputProps("email")}
                error={registerForm.errors.email || (errors?.email as string)}
              />
            </Col>
            <Col span={12} md={6}>
              <TextInput
                autoComplete="off"
                label="Password"
                type="password"
                placeholder="Enter your password"
                {...registerForm.getInputProps("password")}
                error={registerForm.errors.password || (errors?.password as string)}
              />
            </Col>
            <Col span={12} md={6}>
              <TextInput
                {...registerForm.getInputProps("confirmPassword")}
                error={
                  registerForm.errors.confirmPassword ||
                  (errors?.confirmPassword as string)
                }
                autoComplete="off"
                label="Confirm Password"
                type="password"
                placeholder="Confirm your password"
              />
            </Col>

            <Col span={12}>
              <Button variant="link" onClick={toggleForm} pl={0}>
                Already registered? Login here
              </Button>
            </Col>
          </Grid>

          <Group position="left" mt={20}>
            <Button
              variant="outline"
              color="blue"
              type="submit"
              disabled={registerLoading}
            >
              Register
            </Button>
            <Button variant="outline" color="red">
              Cancel
            </Button>
          </Group>
        </form>
      </Paper>
    )
}

const Login = () => {
    const loginForm = useForm({
        initialValues: {
            email: "",
            password: ""
        },
        validate: {
            email: (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? null : "Invalid email",
        }
    })

    const setUser = useUserStore((state) => state.setUser)
    const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal);

    const [errors, setErrors] = useState<GraphQLErrorExtensions>({});

    const [loginUser, {loading: loginLoading}] = useMutation<Mutation>(LOGIN_USER);

    const handleLogin = async() => {
        setErrors({});

        await loginUser({
            variables: {
                email: loginForm.values["email"],
                password: loginForm.values["password"],
            },
            onCompleted: (data) => {
                setErrors({})
                if(data?.login.user)
                    setUser({
                        id: data?.login.user.id,
                        email: data?.login.user.email,
                        fullname: data?.login.user.fullname,
                        avatarUrl: data?.login.user.avatarUrl
                    })
                toggleLoginModal();
            }
        }).catch((err) => {
            console.log(err);
            console.log(err.graphQLErrors, "ERROR")
            setErrors(err.graphQLErrors[0].extensions)
            useGeneralStore.setState({isLoginModalOpen: true})
        })
    }

    return (
        <Paper>
        <Text align="center" size="xl">
          Login
        </Text>

        <form
          onSubmit={loginForm.onSubmit(() => {
            handleLogin()
          })}
        >
          <Grid mt={20}>
            <Col span={12} md={6}>
              <TextInput
                autoComplete="off"
                label="Email"
                placeholder="Enter your email"
                {...loginForm.getInputProps("email")}
                error={loginForm.errors.email || (errors?.email as string)}
              />
            </Col>
            <Col span={12} md={6}>
              <TextInput
                autoComplete="off"
                label="Password"
                type="password"
                placeholder="Enter your password"
                {...loginForm.getInputProps("password")}
                error={loginForm.errors.password || (errors?.password as string)}
              />
            </Col>
            </Grid>
            <Group position="left" mt={20}>
            <Button
              variant="outline"
              color="green"
              type="submit"
              disabled={loginLoading}
            >
              Login
            </Button>
            <Button variant="outline" color="red">
              Cancel
            </Button>
          </Group>
            </form>
            </Paper>
    )
}

return (
    <Modal centered opened={isLoginModalOpen} onClose={toggleLoginModal}>
        {isRegister ? <Register/> : <Login/>}
    </Modal>
  )
}

export default AuthOverlay