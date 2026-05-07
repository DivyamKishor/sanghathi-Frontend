import React from "react";
import { List, ListItem, ListItemText, Typography, Box, Divider, Avatar } from '@mui/material';

const MentorSuggestionMenu = ({ suggestions, onMentorSelect }) => {
  return (
    <List sx={{ p: 0 }}>
      {suggestions.map((mentor, index) => (
        <React.Fragment key={mentor._id}>
          <ListItem
            onClick={() => onMentorSelect(mentor)}
            sx={{
              cursor: 'pointer',
              py: 1.5,
              px: 2,
              '&:hover': {
                backgroundColor: 'action.hover',
              },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <Avatar 
                src={mentor.avatar || mentor.photo} 
                sx={{ width: 40, height: 40, mr: 2, bgcolor: 'primary.main' }}
              >
                {mentor.name.charAt(0)}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {mentor.name}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    {mentor.email}
                  </Typography>
                  {mentor.department && (
                    <>
                      <Typography variant="caption" color="text.secondary">•</Typography>
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 500 }}>
                        {mentor.department}
                      </Typography>
                    </>
                  )}
                </Box>
              </Box>
            </Box>
          </ListItem>
          {index < suggestions.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  );
};

export default MentorSuggestionMenu;
