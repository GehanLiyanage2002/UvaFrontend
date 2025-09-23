

import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const LogoutPage = () => {
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {

        localStorage.removeItem('user');
        localStorage.removeItem('token');

        const params = new URLSearchParams(location.search);
        const redirectTo = params.get('redirect') || '/';

        navigate(redirectTo);
    }, [navigate, location]);

    return null;
};

export default LogoutPage;
