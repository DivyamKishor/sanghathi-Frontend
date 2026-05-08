import React, { useEffect, useState, useRef, useContext } from "react";
import { styled } from "@mui/system";
import { formatDistanceToNowStrict } from "date-fns";
import { Box, Avatar, Typography } from "@mui/material";
import { Stack, Input, Divider, IconButton } from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";

import Iconify from "../../../components/Iconify";
import Scrollbar from "../../../components/Scrollbar";

import { AuthContext } from "../../../context/AuthContext";
import {
  getAvatarSrc,
  getAvatarFallbackText,
} from "../../../utils/avatarResolver";

const ContentStyle = styled("div")(({ theme }) => ({
  display: "inline-block",
  maxWidth: "min(75vw, 420px)",
  padding: theme.spacing(1.5),
  borderRadius: 14,
  backgroundColor: theme.palette.grey[500_12],
  color: theme.palette.text.primary,
  border: `1px solid ${theme.palette.divider}`,
}));

const formatMessageAge = (createdAt) => {
  const rawLabel = formatDistanceToNowStrict(new Date(createdAt || Date.now()), {
    addSuffix: true,
  });

  return rawLabel
    .replace(" seconds", "s")
    .replace(" second", "s")
    .replace(" minutes", "m")
    .replace(" minute", "m")
    .replace(" hours", "h")
    .replace(" hour", "h")
    .replace(" days", "d")
    .replace(" day", "d")
    .replace(" weeks", "w")
    .replace(" week", "w")
    .replace(" months", "mo")
    .replace(" month", "mo")
    .replace(" years", "y")
    .replace(" year", "y");
};

const MessageItem = ({ message, conversation }) => {
  const { user } = useContext(AuthContext);

  const RootStyle = styled("div")(({ theme }) => ({
    marginBottom: theme.spacing(3),
  }));

  const participants = Array.isArray(conversation?.participants)
    ? conversation.participants
    : [];

  const messageSenderId =
    message?.senderId?._id ||
    message?.sender?._id ||
    message?.senderId ||
    message?.sender;

  const normalizedSenderId = String(messageSenderId || "");
  const normalizedCurrentUserId = String(user?._id || "");

  const sender =
    participants.find(
      (participant) => String(participant?._id || "") === normalizedSenderId
    ) ||
    message?.sender ||
    null;

  const isMe = normalizedSenderId === normalizedCurrentUserId;
  
  // Custom alignment for observers (HOD/Admin/Director)
  const isObserver = ["hod", "admin", "director"].includes(user?.roleName) && 
                     !participants.some(p => String(p._id) === normalizedCurrentUserId);
  
  let justifyContent = isMe ? "flex-end" : "flex-start";
  let alignRight = isMe;

  if (isObserver) {
    if (sender?.roleName === "faculty") {
      justifyContent = "flex-end";
      alignRight = true;
    } else {
      justifyContent = "flex-start";
      alignRight = false;
    }
  }

  const firstName = sender?.name && sender.name.split(" ")[0];
  const senderAvatarSrc = getAvatarSrc(sender);

  return (
    <RootStyle>
      <Box
        sx={{
          display: "flex",
          justifyContent,
          alignItems: "flex-end",
          gap: 1,
        }}
      >
        {(!alignRight || isObserver) && (
          <Avatar
            alt={sender?.name}
            src={senderAvatarSrc || undefined}
            sx={{ width: 32, height: 32, order: alignRight ? 2 : 0 }}
          >
            {!senderAvatarSrc ? getAvatarFallbackText(sender?.name) : null}
          </Avatar>
        )}

        <Box
          sx={{
            display: "inline-flex",
            flexDirection: "column",
            alignItems: alignRight ? "flex-end" : "flex-start",
            maxWidth: "min(75vw, 420px)",
            order: 1
          }}
        >
          <ContentStyle
            sx={{
              ...(alignRight
                ? {
                    color: "primary.contrastText",
                    bgcolor: "primary.main",
                    borderColor: "primary.main",
                    borderTopRightRadius: 6,
                  }
                : {
                    borderTopLeftRadius: 6,
                  }),
            }}
          >
            <Typography variant="body2">{message.body}</Typography>
          </ContentStyle>
          <Box
            sx={{
              mt: 0.75,
              display: "flex",
              alignItems: "center",
              justifyContent: alignRight ? "flex-end" : "flex-start",
              gap: 0.75,
            }}
          >
            {(!alignRight || isObserver) && firstName ? (
              <Typography variant="caption" sx={{ color: "text.secondary", fontWeight: 600 }}>
                {firstName}
              </Typography>
            ) : null}
            <Box
              component="span"
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.4,
                px: 0.8,
                py: 0.2,
                borderRadius: 999,
                bgcolor: "action.hover",
                color: "text.secondary",
              }}
            >
              <AccessTimeRoundedIcon sx={{ fontSize: 12 }} />
              <Typography component="span" variant="caption" sx={{ lineHeight: 1.2 }}>
                {formatMessageAge(message.createdAt)}
              </Typography>
            </Box>
          </Box>
        </Box>
      </Box>
    </RootStyle>
  );
};

export function MessageList({ conversation, messages }) {
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollToBottom();
    }
  }, [messages]);

  return (
    <>
      <Scrollbar sx={{ p: 3 }} ref={scrollRef}>
        {messages.map((message) => (
          <MessageItem
            key={message._id}
            message={message}
            conversation={conversation}
          />
        ))}
      </Scrollbar>
    </>
  );
}

const RootStyle = styled("div")(({ theme }) => ({
  minHeight: 56,
  display: "flex",
  position: "relative",
  alignItems: "center",
  paddingLeft: theme.spacing(2),
}));

export function MessageInput({ disabled, onSend }) {
  const fileInputRef = useRef(null);
  const [message, setMessage] = useState("");

  const handleAttach = () => {
    fileInputRef.current?.click();
  };

  const handleKeyUp = (event) => {
    if (event.key === "Enter") {
      handleSend();
    }
  };

  const handleSend = () => {
    if (!message) {
      return "";
    }
    onSend(message);
    setMessage("");
  };

  return (
    <RootStyle>
      <Input
        disabled={disabled}
        fullWidth
        value={message}
        disableUnderline
        onKeyUp={handleKeyUp}
        onChange={(event) => setMessage(event.target.value)}
        placeholder="Type a message"
        endAdornment={
          <Stack direction="row" spacing={1} sx={{ flexShrink: 0, mr: 1.5 }}>
            <IconButton disabled={disabled} size="small" onClick={handleAttach}>
              <Iconify
                icon="ic:round-add-photo-alternate"
                width={22}
                height={22}
              />
            </IconButton>
            <IconButton disabled={disabled} size="small" onClick={handleAttach}>
              <Iconify icon="eva:attach-2-fill" width={22} height={22} />
            </IconButton>
            <IconButton disabled={disabled} size="small">
              <Iconify icon="eva:mic-fill" width={22} height={22} />
            </IconButton>
          </Stack>
        }
      />

      <Divider orientation="vertical" flexItem />

      <IconButton
        color="primary"
        disabled={!message}
        onClick={handleSend}
        sx={{ mx: 1 }}
      >
        <Iconify icon="ic:round-send" width={22} height={22} />
      </IconButton>

      <input type="file" ref={fileInputRef} style={{ display: "none" }} />
    </RootStyle>
  );
}
