import { Box, Text, VStack } from '@chakra-ui/react';
import { Bell, CalendarDays, FileText, FolderKanban, LayoutDashboard, LayoutList, ListChecks, LogOut, Medal, SquareChartGantt, User } from 'lucide-react';
import { useNavigate } from 'react-router';

const menuItems = [
    {
        "title": "Dashboard",
        "link": "",
        "icon": <LayoutDashboard size={15} />
    },
    {
        "title": "Projects",
        "link": "member-projects",
        "icon": <FolderKanban size={15} />
    },
    // {
    //     "title": "Tasks",
    //     "link": "member-tasks",
    //     "icon": <ListChecks size={15} />
    // },
    {
        "title": "Reports",
        "link": "member-reports",
        "icon": <FileText size={15} />
    },
    {
        "title": "Notices",
        "link": "member-notices",
        "icon": <Bell size={15} />
    },
    {
        "title": "Calendar",
        "link": "calendar",
        "icon": <CalendarDays size={15} />
    },
    {
        "title": "Profile",
        "link": "profile",
        "icon": <User size={15} />
    },
]

const MemberSidebar = () => {
    return (
        <Box
            width="250px"
            position="fixed"
            top={0}
            bottom={0}
            className='border-r bg-gray-100'

        >
            <VStack align="start" className='text-black h-full' gap={0}>
                <div className='px-2 py-4 w-full text-black flex gap-2'>
                    <div className='border border-cyan-500 rounded-md flex w-10 justify-center items-center'>
                        <Medal className='text-cyan-700' />
                    </div>
                    <div className='flex flex-col'>
                        <div className='font-bold'>Wellassa Projects</div>
                        <div className='text-xs'>Manage Projects with ease </div>
                    </div>
                </div>

                <div className='px-2 flex flex-col w-full h-full justify-between'>
                    <div>
                        {menuItems.map((line: any) => (<SidebarItem key={line.title} data={line} />))}
                    </div>
                    <div className="pb-2 mt-auto">
                                <SidebarItem
                                  data={{
                                    title: 'Logout',
                                    icon: <LogOut size={15} />,
                                    link: '/',
                                  }}
                                />
                              </div>
                </div>
            </VStack>
        </Box>
    );
};

const SidebarItem = ({ data }: any) => {

    const navigate = useNavigate()

    const onNavLinkClicked = () => {
        navigate(data.link)
    }

    return (
        <div onClick={onNavLinkClicked} className='rounded-md text-black w-full flex items-center gap-2 p-2 hover:bg-gray-100 cursor-default'>
            {data.icon}
            {data.title}
        </div>
    )
}

export default MemberSidebar;