// @mui
import { Container, Tab, Box, Tabs, useTheme } from "@mui/material";
// hooks
import useTabs from "../../hooks/useTabs";
// components
import Page from "../../components/Page";
import Iconify from "../../components/Iconify";
import React, { useContext, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import api from "../../utils/axios";

import CareerCounselling from "./CareerCounselling";
import Mooc from "./Mooc";
import ProfessionalBodiesSection from "./ProfessionalBodiesSection";
import ClubsSection from "./ClubsSection";
import MiniProject from "./MiniProject";
import Activity from "./Activity";
import Hobbies from "./Hobbies";
import Project from "../Placement/Project";

const parseSemester = (value) => {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const numeric = Number(value);
  if (!Number.isNaN(numeric)) {
    return numeric;
  }

  const match = String(value).match(/\d+/);
  return match ? Number(match[0]) : null;
};


export default function CareerReview() {
  const { currentTab, onChangeTab, setCurrentTab } = useTabs("Career Counselling");
  const theme = useTheme();
  const isLight = theme.palette.mode === 'light';
  const { user } = useContext(AuthContext);
  const [searchParams] = useSearchParams();
  const menteeId = searchParams.get("menteeId");
  const [semester, setSemester] = useState(() => parseSemester(user?.sem));

  useEffect(() => {
    const targetUserId = menteeId || user?._id;

    if (!targetUserId) {
      setSemester(null);
      return;
    }

    const semesterFromContext = !menteeId ? parseSemester(user?.sem) : null;
    if (semesterFromContext) {
      setSemester(semesterFromContext);
      return;
    }

    const fetchSemester = async () => {
      try {
        const response = await api.get(`/student-profiles/${targetUserId}`);
        const profile = response.data?.data || response.data;
        const resolvedSemester =
          parseSemester(profile?.sem) ??
          parseSemester(profile?.semester) ??
          parseSemester(profile?.currentSemester);

        setSemester(resolvedSemester);
      } catch (_error) {
        setSemester(null);
      }
    };

    fetchSemester();
  }, [menteeId, user?._id, user?.sem]);

  const isSemesterSix = semester === 6;
  
  const ACCOUNT_TABS = useMemo(() => {
    const baseTabs = [
      {
        value: "Career Counselling",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <CareerCounselling />,
      },
      {
        value: "Clubs",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <ClubsSection />,
      },
      {
        value: "Professional Bodies",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <ProfessionalBodiesSection />,
      },
      {
        value: "Mooc Courses",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <Mooc resolvedSemester={semester} />,
      },
      {
        value: "Mini Project",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <MiniProject resolvedSemester={semester} />,
      },
      {
        value: "Activity",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <Activity />,
      },
      {
        value: "Hobbies",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <Hobbies />,
      },
    ];

    if (isSemesterSix) {
      baseTabs.push({
        value: "Technical Work",
        icon: <Iconify icon={"ic:round-account-box"} width={20} height={20} />,
        component: <Project />,
      });
    }

    return baseTabs;
  }, [isSemesterSix]);

  useEffect(() => {
    const tabExists = ACCOUNT_TABS.some((tab) => tab.value === currentTab);
    if (!tabExists) {
      setCurrentTab("Career Counselling");
    }
  }, [ACCOUNT_TABS, currentTab, setCurrentTab]);
  
  return (
    <Page title="Career Review">
      <Container maxWidth="lg">
        <Tabs
          allowScrollButtonsMobile
          variant="scrollable"
          scrollButtons="auto"
          value={currentTab}
          onChange={onChangeTab}
          sx={{
            '& .MuiTab-root': {
              color: isLight ? theme.palette.text.secondary : theme.palette.text.primary,
              '&.Mui-selected': {
                color: isLight ? theme.palette.primary.main : theme.palette.info.main
              }
            },
            '& .MuiTabs-indicator': {
              backgroundColor: isLight ? theme.palette.primary.main : theme.palette.info.main
            }
          }}
        >
          {ACCOUNT_TABS.map((tab) => (
            <Tab
              disableRipple
              key={tab.value}
              label={tab.value}
              icon={tab.icon}
              value={tab.value}
            />
          ))}
        </Tabs>

        <Box sx={{ mb: 5 }} />

        {ACCOUNT_TABS.map((tab) => {
          const isMatched = tab.value === currentTab;
          return isMatched && <Box key={tab.value}>{tab.component}</Box>;
        })}
      </Container>
    </Page>
  );
}