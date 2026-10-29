import { Link } from 'react-router-dom';

import logo from '@assets/mainLogo/pekologo.svg';
import { forgotpasswordReset } from '@domains/auth/slices/forgotpasswordSlice';
import { useAppDispatch } from '@src/hooks/store';
import { paths } from '@src/routes/paths';

const LandingHeader = () => {
    const dispatch = useAppDispatch();

    return (
        <header className="absolute left-0 top-0 z-10 px-6 pt-5 md:px-12 md:pt-10 xxl:px-16 xxl:pt-14">
            <Link
                to={paths.auth.jwt.login}
                onClick={() => dispatch(forgotpasswordReset())}
                aria-label="Go to login"
            >
                <img src={logo} alt="Peko" className="h-auto w-24 md:w-24 xxl:w-32" />
            </Link>
        </header>
    );
};

export default LandingHeader;
