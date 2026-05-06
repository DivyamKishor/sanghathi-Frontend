import React, { useContext } from "react";
import {
  Box,
  Container,
  Divider,
  Grid,
  Link as MuiLink,
  Stack,
  Typography,
  useTheme,
} from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { buildBrandedMailto } from "../utils/mailto";

const logo = "/apple-touch-icon.png";

const commonLinks = [
  { label: "Campus Buddy", to: "/campus-buddy" },
  { label: "Threads", to: "/threads" },
  { label: "Settings", to: "/settings" },
];

const contactLinks = [];

const SUPPORT_EMAIL = "emithru@gmail.com";

const roleLinks = {
  student: [
    { label: "Mentor Details", to: "/mentor-details" },
    { label: "Attendance", to: "/student/attendance" },
  ],
  faculty: [
    { label: "My Mentees", to: "/mentees" },
    { label: "Mentor-Mentee Conversation", to: "/mentor-mentee-conversation" },
  ],
  admin: [
    { label: "Add User", to: "/admin/add-user" },
    { label: "Assign Mentors", to: "/admin/mentor-assignment" },
    { label: "Upload History", to: "/admin/upload-history" },
  ],
  hod: [
    { label: "Department Mentors", to: "/hod/mentors" },
    { label: "Reports", to: "/report" },
  ],
  director: [
    { label: "View Mentors", to: "/director/mentors" },
    { label: "View Users", to: "/director/users" },
  ],
};

const FooterLinkGroup = ({ title, links, linkFontSize = "0.92rem" }) => (
  <Stack spacing={1.15}>
    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
      {title}
    </Typography>
    <Stack spacing={0.95}>
      {links.map((link) => (
        <MuiLink
          key={link.to || link.href}
          component={link.href ? "a" : RouterLink}
          to={link.href ? undefined : link.to}
          href={link.href || undefined}
          target={link.href ? "_blank" : undefined}
          rel={link.href ? "noreferrer" : undefined}
          underline="hover"
          color="text.secondary"
          sx={{
            width: "fit-content",
            fontSize: linkFontSize,
            transition: "color 0.2s ease",
            "&:hover": {
              color: "primary.main",
            },
          }}
        >
          {link.label}
        </MuiLink>
      ))}
    </Stack>
  </Stack>
);

const Footer = () => {
  const theme = useTheme();
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const role = user?.roleName;
  const currentYear = new Date().getFullYear();
  const isDashboardRoute =
    location.pathname === "/" ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/faculty") ||
    location.pathname.startsWith("/hod") ||
    location.pathname.startsWith("/director") ||
    location.pathname.startsWith("/student") ||
    location.pathname.startsWith("/mentee") ||
    location.pathname.startsWith("/mentor") ||
    location.pathname.startsWith("/report") ||
    location.pathname.startsWith("/threads") ||
    location.pathname.startsWith("/settings") ||
    location.pathname.startsWith("/campus-buddy");

  const footerLinks = roleLinks[role] || [];
  const supportLinks = [
    {
      label: SUPPORT_EMAIL,
      href: buildBrandedMailto(SUPPORT_EMAIL, {
        subject: "Sanghathi Support Request",
        details: `I am facing an issue in Sanghathi. Route: ${location.pathname}`,
        includePageContext: false,
      }),
    },
  ];

  return (
    <Box
      component="footer"
      aria-label="Application footer"
      sx={{
        mt: "auto",
        borderTop: `1px solid ${theme.palette.divider}`,
        backgroundColor: theme.palette.mode === "light"
          ? "rgba(255,255,255,0.92)"
          : "rgba(18, 24, 38, 0.96)",
        backdropFilter: "blur(12px)",
      }}
    >
      <Container maxWidth="xl" sx={{ py: { xs: 2.8, md: 3.4 } }}>
        <Grid container spacing={2.5} alignItems="flex-start">
          <Grid item xs={12} md={3}>
            <Stack spacing={1}>
              <Stack direction="row" spacing={1.2} alignItems="center">
                <Box
                  component="img"
                  src={logo}
                  alt="Sanghathi logo"
                  sx={{
                    width: 36,
                    height: 36,
                    objectFit: "contain",
                    borderRadius: "50%",
                  }}
                />
                <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                  Sanghathi
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary">
                Mentoring and student success platform for CMRIT.
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {isDashboardRoute ? "Dashboard experience" : "Application experience"}
              </Typography>
            </Stack>
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FooterLinkGroup title="Quick Links" links={commonLinks} />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FooterLinkGroup
              title={role ? `${role.charAt(0).toUpperCase()}${role.slice(1)} Links` : "Role Links"}
              links={footerLinks.length ? footerLinks : [{ label: "Login", to: "/login" }]}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FooterLinkGroup title="Contact" links={contactLinks} />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <FooterLinkGroup
              title="Having any issues / problems?"
              links={supportLinks}
              linkFontSize="0.85rem"
            />
          </Grid>
        </Grid>

        <Divider sx={{ mt: 0.6, mb: 2.2 }} />

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          <Typography variant="caption" color="text.secondary">
            © {currentYear} Sanghathi. All rights reserved.
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Sanghathi version 2.0
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
};

export default Footer;