package com.example.lawconsultserver.controller;

import com.example.lawconsultserver.service.AiChatService;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.dto.AiChatRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

/**
 * AI聊天控制器
 */
@RestController
@RequestMapping("/api/ai")
public class AiChatController {

    @Autowired
    private AiChatService aiChatService;

    /**
     * AI问答
     */
    @PostMapping("/chat")
    public ApiResponse<?> chat(@RequestBody AiChatRequest request) {
        return aiChatService.chat(
            request.getUserId(),
            request.getMessage()
        );
    }

    /**
     * 获取对话历史
     */
    @GetMapping("/history")
    public ApiResponse<?> getHistory(
            @RequestParam Integer userId,
            @RequestParam(defaultValue = "1") Integer page,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return aiChatService.getChatHistory(userId, page, pageSize);
    }

    @PostMapping("/history/delete")
    public ApiResponse<?> deleteHistory(@RequestBody(required = false) java.util.Map<String, Object> body) {
        if (body == null) {
            return aiChatService.deleteChatHistory(null, null);
        }
        Integer userId = body.get("userId") instanceof Number ? ((Number) body.get("userId")).intValue() : null;
        java.util.List<Integer> ids = new java.util.ArrayList<>();
        if (body.get("ids") instanceof java.util.List<?> rawIds) {
            for (Object rawId : rawIds) {
                if (rawId instanceof Number) {
                    ids.add(((Number) rawId).intValue());
                }
            }
        }
        return aiChatService.deleteChatHistory(userId, ids);
    }
}
