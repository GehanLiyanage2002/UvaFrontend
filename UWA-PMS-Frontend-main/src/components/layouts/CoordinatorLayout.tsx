import { Box, Flex } from '@chakra-ui/react';
import React from 'react';
import Header from '../ui/PublicUI/Header';
import { Outlet } from 'react-router-dom';
import CoordinatorSidebar from '../ui/CoordinatorUI/CoordinatorSidebar';

const CoordinatorLayout = () => {
  return (
    <Flex height="100vh" flexDirection="row">
      <CoordinatorSidebar />
      <Box ml="250px" flex="1" bg="gray.50">
        <Header />
        <Box className="h-full px-6 py-3">
          <Outlet />
        </Box>
      </Box>
    </Flex>
  );
};

export default CoordinatorLayout;
