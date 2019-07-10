import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';

import { ApolloProvider } from 'react-apollo';
import { ApolloClient } from 'apollo-client';
import { createHttpLink } from 'apollo-link-http';
import { InMemoryCache } from 'apollo-cache-inmemory';

import 'typeface-roboto';
import * as serviceWorker from './serviceWorker';

import gql from 'graphql-tag';

const httpLink = createHttpLink({
  uri: process.env.REACT_APP_GRAPHCOOL_URI
});

const client = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache()
});
 
// client.query({
//   query: gql`
//     query getUsers {
//       allUsers {
//         id
//         name
//         alias
//         transactions {
//           description
//         }
//       }
//     }
//   `
// }).then(result => console.log(result));

ReactDOM.render(
  <ApolloProvider client={client}>
    <App />
  </ApolloProvider>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
