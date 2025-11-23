import { useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from 'react-transition-group';
import './PageTransition.css';

export default function PageTransition({ children }) {
    const location = useLocation();

    return (
        <TransitionGroup component={null}>
            <CSSTransition
                key={location.pathname}
                timeout={500}
                classNames="page"
                unmountOnExit
            >
                {children}
            </CSSTransition>
        </TransitionGroup>
    );
}
