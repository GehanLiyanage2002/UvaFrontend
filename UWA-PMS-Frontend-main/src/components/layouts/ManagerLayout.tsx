import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';

import { Outlet } from 'react-router';
import ManagerSidebar from '../ui/ManagerUI/ManagerSidebar';
import Header from '../ui/PublicUI/Header';


const ManagerLayout = () => {
    return (
        <Flex height="100vh" flexDirection="row">
            <ManagerSidebar />
            <Box ml="250px" flex="1" bg="gray.50">
                <Header />
                <div className='h-full px-6 py-3'>
                    <Outlet />
                </div>
            </Box>
        </Flex>
    );
};

export default ManagerLayout;