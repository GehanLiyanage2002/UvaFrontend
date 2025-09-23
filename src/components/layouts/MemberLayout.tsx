import { Box, Flex, HStack, Text, VStack } from '@chakra-ui/react';
import React from 'react';
import Header from '../ui/PublicUI/Header';
import { Outlet } from 'react-router';
import MemberSidebar from '../ui/MemberUI/MemberSidebar';


const MemberLayout = () => {
    return (
        <Flex height="100vh" flexDirection="row">
            <MemberSidebar />
            <Box ml="250px" flex="1" bg="gray.50">
                <Header />
                <div className='h-full px-6 py-3'>
                    <Outlet />
                </div>
            </Box>
        </Flex>
    );
};

export default MemberLayout;




