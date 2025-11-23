import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import './PageTransition.css';

function AnimatedRoutes() {
  const location = useLocation();
  const [previousLocation, setPreviousLocation] = React.useState(null);

  React.useEffect(() => {
    setPreviousLocation(location);
  }, [location]);

  // Determine if we're going from chat to landing
  const isReturningToLanding = previousLocation?.pathname === '/chat' && location.pathname === '/';
  const transitionClass = isReturningToLanding ? 'page-reverse' : 'page';

  return (
    <TransitionGroup component={null}>
      <CSSTransition
        key={location.pathname}
        timeout={500}
        classNames={transitionClass}
        unmountOnExit
      >
        <Routes location={location}>
          <Route path="/" element={<Landing />} />
          <Route path="/chat" element={<Chat />} />
        </Routes>
      </CSSTransition>
    </TransitionGroup>
  );
}

function App() {
  return (
    <Router>
      <AnimatedRoutes />
    </Router>
  );
}

export default App;
