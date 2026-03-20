package com.example.lawconsultserver.service;

import com.example.lawconsultserver.common.response.ApiResponse;

public interface AiChatService {
    /**
     * AI问答（调用DeepSeek API）
     */
    ApiResponse<?> chat(Integer userId, String question);

    /**
     * 获取AI对话历史
     */
    ApiResponse<?> getChatHistory(Integer userId, Integer page, Integer pageSize);

    ApiResponse<?> deleteChatHistory(Integer userId, java.util.List<Integer> ids);
}
