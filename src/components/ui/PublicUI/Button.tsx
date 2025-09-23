import React from 'react';
import { Button as ChakraBtn } from '@chakra-ui/react';
import clsx from 'clsx';

const Button = ({ onClick, className, children }: any) => {
    return (
        <ChakraBtn onClick={onClick} className={clsx('border px-4 bg-black text-white hover:bg-gray-800', className)}>{children}</ChakraBtn>
    );
};

export default Button;