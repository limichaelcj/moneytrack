import React from 'react'
import { BrowserRouter as Router, Switch, Route, Redirect } from 'react-router-dom'
import { Query, withApollo } from 'react-apollo'
import CssBaseline from '@material-ui/core/CssBaseline'
import Container from '@material-ui/core/Container'

import DataWrapper from './components/DataWrapper'
import Login from './components/auth/Login'
import Account from './components/views/Account'
import Transactions from './components/views/transactions/Transactions'
import Friends from './components/views/Friends'
import Timeline from './components/views/Timeline'
import NavBottom from './components/NavBottom'
import UserHeader from './components/UserHeader'
import AppHeader from './components/AppHeader'
import Loader from './components/Loader'
import ErrorPage from './components/Error'
import './index.css';

import LOGGED_IN_USER_QUERY from './graphql/queries/LoggedInUser'

class App extends React.Component {
  constructor(props){
    super(props);
    this.state = {
      user: null
    }
    this.covertState = this.covertState.bind(this);
  }

  // auth
  // _isLoaded(){
  //   return !this.props.loggedInUserQuery.loading;
  // }
  //
  // _isLoggedIn(){
  //   const query = this.props.loggedInUserQuery;
  //   console.log('query', query)
  //   const isLoggedIn = query.loggedInUser && query.loggedInUser.id !== null;
  //   return isLoggedIn;
  // }

  _logout(history) {
    console.log('logout')
    localStorage.removeItem('graphcoolToken');
    window.location.href = '/';
  }

  // state
  covertState(obj){
    Object.assign(this.state, obj);
  }

  // render
  _rootRedirect = () => {
    return (
      <Redirect to={this.state.user.isLoggedIn ? '/account' : '/login'} />
    );
  }

  _renderLogin = () => {
    return (
      <React.Fragment>
        <AppHeader />
        <div className="ViewWrapper">
          <Login />
        </div>
      </React.Fragment>
    );
  }

  _renderDataWrapper = id => {
    const styles = {
      view: {
        flex: '1 1 auto',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        padding: 0
      }
    }
    return (
      <DataWrapper covertState={this.covertState} variables={{ id }} >
        <Router>
          <UserHeader logout={this._logout} />
          <Container style={styles.view} maxWidth='md'>
            <Switch>
              <Route path='/transactions' render={()=><Transactions user={this.state.user} />} />
              <Route path='/friends' render={()=><Friends user={this.state.user} />} />
              <Route path='/timeline' render={()=><Timeline user={this.state.user} />} />
              <Route path='/' render={()=><Redirect to='/transactions' />} />
            </Switch>
          </Container>
          <NavBottom />
        </Router>
      </DataWrapper>
    )
  }

  render(){
    return (
      <div className="App">
        <CssBaseline />
        <Query query={LOGGED_IN_USER_QUERY}>
          {({ data, loading, error}) => {
            if (loading) return <Loader />;
            if (error) return <ErrorPage message={error.message} />
            if (data.loggedInUser && data.loggedInUser.id !== null){
              return this._renderDataWrapper(data.loggedInUser.id);
            }
            return this._renderLogin();
          }}
        </Query>
      </div>
    );
  }
}

export default withApollo(App);

// export default graphql(LOGGED_IN_USER_QUERY, {
//   name: 'loggedInUserQuery',
//   options: {fetchPolicy: 'network-only'}
// })(App);
