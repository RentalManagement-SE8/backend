package SE2.RMS.controller;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import SE2.RMS.model.ChatMessage;
import SE2.RMS.services.ChatService;

import java.time.LocalDateTime;

@Controller
public class ChatController {
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatService chatService;

    public ChatController(SimpMessagingTemplate messagingTemplate, ChatService chatService) {
        this.messagingTemplate = messagingTemplate;
        this.chatService = chatService;
    }

    @MessageMapping("/chat")
    @SendTo("/topic/messages")
    public ChatMessage sendMessage(ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        chatService.saveMessage(message);
        return message;
    }

    public void sendPrivateMessage(String recipient, ChatMessage message) {
        message.setTimestamp(LocalDateTime.now());
        chatService.saveMessage(message);
        messagingTemplate.convertAndSendToUser(recipient, "/queue/messages", message);
    }
}
