import { Center, Navbar, Stack, Tooltip, UnstyledButton, createStyles, rem } from "@mantine/core"
import { IconBrandMessenger, IconBrandWechat, IconLogin, IconLogout, IconUser } from "@tabler/icons-react";
import { useGeneralStore } from "../stores/generalStore";
import { useState } from "react";
import { useUserStore } from "../stores/userStore";
import { useMutation } from "@apollo/client";
import { LOGOUT_USER } from "../graphql/mutations/Logout";


const useStyles = createStyles((theme) => {
    return {
        link: {
            width: rem(50),
            height: rem(50),
            borderRadius: theme.radius.md,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.colorScheme === "dark" ?theme.colors.dark[0] : theme.colors.gray[7],
            "&:hover": {
                backgroundColor: 
                    theme.colorScheme === "dark" ? 
                    theme.colors.dark[5] : theme.colors.gray[0]
            } 
        },
        active: {
            "&, &:hover": {
                backgroundColor: 
                    theme.fn.variant({
                        variant: "light",
                        color: theme.primaryColor
                    }).background,
                    color: theme.fn.variant({variant: "light", color: theme.primaryColor}).color
            }
        }
    }
});

interface NavbarLinkProps {
    icon: React.FC<any>,
    label: string,
    active?: boolean,
    onClick?(): void
}

function NavbarLink({icon: Icon, label, active, onClick}: NavbarLinkProps) {
    const {classes, cx} = useStyles();

    return (
        <Tooltip label={label} position="top-start" transitionProps={{duration: 2}}>
            <UnstyledButton onClick={onClick} className={cx(classes.link, {
                [classes.active]: active
            })}>
                <Icon size="1.25rem" stroke={1.5}/>
            </UnstyledButton>
        </Tooltip>
    )
}

const mockData = [{icon: IconBrandWechat, label: "Chatrooms"}]

function Sidebar() {
    const toggleLoginModal = useGeneralStore((state) => state.toggleLoginModal)
    const toggleProfileSettingsModal = useGeneralStore((state) => state.toggleProfileSettingsModal);
    const [activeLinkIndex, setActiveLinkIndex] = useState(0);
    const userId = useUserStore((state) => state.id);
    const user = useUserStore((state) => state);
    const setUser = useUserStore((state) => state.setUser);
    const [logoutUser] = useMutation(LOGOUT_USER, {
        onCompleted: () => {
            toggleLoginModal();
        }
    })
    const links = mockData.map((link, idx) => (
        <NavbarLink
        {...link}
        key = {link.label}
        active={idx === activeLinkIndex}
        onClick={() => setActiveLinkIndex(idx)} 
        />
    ))
    const handleLogout = async() => {
        await logoutUser();
        setUser({
            id: 0,
            fullname: "",
            email: "",
            avatarUrl: null
        })
    }
  return (
    <Navbar fixed zIndex={100} p={"md"} w={rem(100)}>
        <Center>
            <IconBrandMessenger type="mark" size={30} />
        </Center>
        <Navbar.Section grow mt={50}>
            <Stack justify="center" spacing={0}>
                {userId && links}
            </Stack>
        </Navbar.Section>
        <Navbar.Section>
            <Stack justify="center" spacing={0}>
                {userId && (
                    <NavbarLink icon={IconUser} label={`${user.fullname}'s Profile`} onClick={toggleProfileSettingsModal} />
                )}
                {userId ? (
                    <NavbarLink icon={IconLogout} label="Logout" onClick={handleLogout} />
                ) : (
                    <NavbarLink icon={IconLogin} label="Login" onClick={toggleLoginModal} />
                )}
            </Stack>
        </Navbar.Section>
    </Navbar>
  )
}

export default Sidebar