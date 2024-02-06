import { Flex } from '@mantine/core';
import React from 'react';

function MainLayout({ children }: { children: React.ReactElement }) {
  return (
    <Flex>
      <Flex>{children}</Flex>
    </Flex>
  );
}

export default MainLayout;
