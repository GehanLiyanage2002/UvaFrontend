import { Box, Text, VStack } from '@chakra-ui/react';
import {
  Bell,
  CalendarDays,
  FileText,
  icons,
  LayoutDashboard,
  LogOut,
  Medal,
  SquareChartGantt,
  User,
  Users
} from 'lucide-react';
import { useNavigate } from 'react-router';

const menuItems = [
  {
    title: "Dashboard",
    link: "dashboard",
    icon: <LayoutDashboard size={15} />
  },
  {
    "title": "Projects",
    "link": "projects",
    "icon": <SquareChartGantt size={15} />
  },
  {
    title: "Notices",
    link: "notices",
    icon: <Bell size={15} />
  },
  {
    title: "Supervisors",
    link: "supervisors",
    icon: <Users size={15} />
  },
  {
    title: "Calendar",
    link: "calendar",
    icon: <CalendarDays size={15} />
  },
  // {
  //   title: "Reports",
  //   link: "reports",
  //   icon: <FileText size={15} />
  // },
  // {
  //   title: "Profile",
  //   link: "profile",
  //   icon: <User size={15} />
  // },
];

const CoordinatorSidebar = () => {
  return (
    <Box
      width="250px"
      position="fixed"
      top={0}
      bottom={0}
      className="border-r bg-gray-100"
    >
      <VStack align="start" className="text-black h-full" gap={0}>
        <div className="px-2 py-4 w-full text-black flex gap-2">
          <div className="border border-cyan-500 rounded-md flex w-10 justify-center items-center">
            <Medal className="text-cyan-700" />
          </div>
          <div className="flex flex-col">
            <div className="font-bold">Wellassa Projects</div>
            <div className="text-xs">Coordinator Panel</div>
          </div>
        </div>
        <div className="px-2 flex flex-col w-full h-full justify-between">
          <div className="flex flex-col gap-1">
            {menuItems.map((item) => (
              <SidebarItem key={item.title} data={item} />
            ))}
          </div>
          <div className="pb-2 mt-auto">
            <SidebarItem
              data={{
                title: 'Logout',
                icon: <LogOut size={15} />,
                link: 'logout'
              }}
            />
          </div>
        </div>
      </VStack>
    </Box>
  );
};

const SidebarItem = ({ data }: any) => {
  const navigate = useNavigate();

  const onNavLinkClicked = () => {
    if (data.link) {
      navigate(data.link.startsWith('/') ? data.link : `/coordinator/${data.link}`);
    }
  };

  return (
    <div
      onClick={onNavLinkClicked}
      className="rounded-md text-black w-full flex items-center gap-2 p-2 hover:bg-gray-200 cursor-pointer"
    >
      {data.icon}
      <span className="text-sm">{data.title}</span>
    </div>
  );
};

export default CoordinatorSidebar;