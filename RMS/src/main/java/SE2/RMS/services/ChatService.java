package SE2.RMS.services;

import org.springframework.stereotype.Service;

import SE2.RMS.model.ChatMessage;
import SE2.RMS.repository.ChatRepository;

import java.util.List;

@Service
public class ChatService {
    private final ChatRepository chatRepository;

    public ChatService(ChatRepository chatRepository) {
        this.chatRepository = chatRepository;
    }

    public void saveMessage(ChatMessage message) {
        chatRepository.save(message);
    }

    public List<ChatMessage> getChatHistory() {
        return chatRepository.findAll();
    }
}