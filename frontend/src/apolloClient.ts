import { ApolloClient, ApolloLink, InMemoryCache, NormalizedCacheObject, Observable, gql, split } from "@apollo/client";
import {WebSocketLink} from '@apollo/client/link/ws';
import {onError} from '@apollo/client/link/error'
import { useUserStore } from "./stores/userStore";
import  {createUploadLink} from "apollo-upload-client";
import { getMainDefinition } from "@apollo/client/utilities";
import {loadDevMessages, loadErrorMessages} from '@apollo/client/dev' 

loadDevMessages()
loadErrorMessages();

async function refreshToken(client: ApolloClient<NormalizedCacheObject>) {
    try {
        const {data} = await client.mutate({
            mutation: gql`
                mutation RefreshToken {
                    refreshToken
                }
            `
        })
    
        const newAccessToken = data?.refreshToken
        if(!newAccessToken) {
            throw new Error("New access token not recieved");
        }
    }catch(e) {
        throw new Error("Error in getting new access token")
    }
}

let retryCount: number = 0;
let maxRetryCount:  number = 3;

const wsLink = new WebSocketLink({
    uri: "ws://localhost:8080/graphql",
    options: {
        reconnect: true,
        connectionParams: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`
        }
    }
})

const errorLink = onError(({graphQLErrors, operation, forward}) => {
    for(const err of graphQLErrors!) {
        if(err.extensions.code === "UNAUTHENTICATED" && retryCount < maxRetryCount) {
            retryCount++;
            return new Observable((observer) => {
                refreshToken(client).then((token) => {
                    console.log(`Received token is ${token}`)
                    operation.setContext((prevToken:any) => ({
                        headers: {
                            ...prevToken.headers,
                            authorization: token
                        }
                    }))
                    const forward$ = forward(operation)
                    forward$.subscribe(observer)
                })
                .catch((e) => observer.error(e)) 
            })
        }

        if(err.message === "Refresh token not found") {
            console.log("refresh token not found")
            useUserStore.setState({
                id: undefined,
                fullname: "",
                email: ""
            })
        }
    }
})

const uploadLink = createUploadLink({
    uri: "http://localhost:8080/graphql",
  credentials: "include",
  headers: {
    "apollo-require-preflight": "true",
  },
})

const link = split(
    // Split based on operation type
    ({ query }) => {
      const definition = getMainDefinition(query)
      return (
        definition.kind === "OperationDefinition" &&
        definition.operation === "subscription"
      )
    },
    wsLink,
    ApolloLink.from([errorLink, uploadLink])
  )
  export const client = new ApolloClient({
    uri: "http://localhost:8080/graphql",
    cache: new InMemoryCache({}),
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
    },
    link: link,
  })