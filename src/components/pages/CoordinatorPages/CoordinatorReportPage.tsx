import React from 'react';
import { FileText } from 'lucide-react';
import { Box, Input } from '@chakra-ui/react';
import { LuSearch } from "react-icons/lu";
import Button from '../../ui/PublicUI/Button';

const CoordinatorReportHomePage: React.FC = () => {
    const memberReports = [
        {
            project: 'Project Management System',
            reportLink: '/reports/pms.pdf',
            ganttLink: '/gantt/pms.png',
        },
        {
            project: 'Mobile App Development',
            reportLink: '/reports/mobile.pdf',
            ganttLink: '/gantt/mobile.png',
        },
        {
            project: 'Research Portal',
            reportLink: '/reports/research.pdf',
            ganttLink: '/gantt/research.png',
        },
    ];

    return (
        <div className="flex flex-col gap-6 pb-4">
            <div className="flex justify-between items-center">
                <div>
                    <div className="font-bold text-3xl flex items-center gap-2">
                        <FileText size={30} />
                        My Reports
                    </div>
                    <div className="text-xs text-gray-500">
                        View and download your assigned project reports
                    </div>
                </div>

                <div className="flex gap-3 items-center">
                    <Box position="relative" width="200px" border="1px solid #CBD5E0" borderRadius="md">
                        <Box position="absolute" top="50%" left="8px" transform="translateY(-50%)" zIndex="10">
                            <LuSearch size={16} color="gray" />
                        </Box>
                        <Input
                            type="text"
                            placeholder="Search Reports"
                            pl="30px"
                            size="xs"
                            border="none"
                            borderRadius="md"
                            fontSize={'xs'}
                        />
                    </Box>
                </div>
            </div>

            <div className="flex flex-col border rounded-md overflow-hidden">
                <div className="grid grid-cols-3 font-bold text-sm bg-gray-100 p-2 border-b">
                    <div className="pl-1">Project Name</div>
                    <div className="pl-2">Project Report</div>
                    <div className="pl-2">Gantt Chart</div>
                </div>

                {memberReports.map((report, idx) => (
                    <div key={idx} className="grid grid-cols-3 text-xs p-2 border-b hover:bg-gray-50 transition">
                        <div className="pl-1">{report.project}</div>
                        <div className="pl-2">
                            <a href={report.reportLink} target="_blank" className="text-cyan-600 hover:underline">
                                View Report
                            </a>
                        </div>
                        <div className="pl-2">
                            <a href={report.ganttLink} target="_blank" className="text-cyan-600 hover:underline">
                                View Gantt
                            </a>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CoordinatorReportHomePage;