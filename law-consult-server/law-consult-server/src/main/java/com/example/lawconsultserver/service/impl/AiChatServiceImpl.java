package com.example.lawconsultserver.service.impl;

import com.example.lawconsultserver.common.exception.BusinessException;
import com.example.lawconsultserver.common.response.ApiResponse;
import com.example.lawconsultserver.common.response.PageResponse;
import com.example.lawconsultserver.entity.AiChatHistory;
import com.example.lawconsultserver.entity.User;
import com.example.lawconsultserver.mapper.AiChatHistoryMapper;
import com.example.lawconsultserver.mapper.UserMapper;
import com.example.lawconsultserver.service.AiChatService;
import com.example.lawconsultserver.util.DeepSeekClient;
import org.apache.commons.lang3.StringUtils;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class AiChatServiceImpl implements AiChatService {

    private static final int DEFAULT_PAGE_SIZE = 10;
    private static final String NON_LEGAL_MESSAGE = "当前问题不属于法律咨询范围，仅支持法律相关咨询。建议改为描述具体法律问题，复杂情况请咨询专业律师。";

    @Autowired
    private AiChatHistoryMapper aiChatHistoryMapper;

    @Autowired
    private DeepSeekClient deepSeekClient;

    @Autowired
    private UserMapper userMapper;

    @Override
    @Transactional
    public ApiResponse<?> chat(Integer userId, String question) {
        if (userId == null || StringUtils.isBlank(question)) {
            throw new BusinessException("Invalid parameters");
        }
        validateAiUser(userId);

        String trimmedQuestion = question.trim();
        String answer = deepSeekClient.isLegalQuestion(trimmedQuestion)
                ? deepSeekClient.chat(trimmedQuestion)
                : NON_LEGAL_MESSAGE;

        AiChatHistory chat = new AiChatHistory();
        chat.setUserId(userId);
        chat.setQuestion(trimmedQuestion);
        chat.setAnswer(answer);

        if (aiChatHistoryMapper.insertChat(chat) <= 0) {
            throw new BusinessException("Save chat failed");
        }

        Map<String, Object> data = new HashMap<>();
        data.put("id", chat.getId());
        data.put("answer", answer);
        data.put("isLegalQuestion", !NON_LEGAL_MESSAGE.equals(answer));
        return ApiResponse.success("Chat success", data);
    }

    @Override
    public ApiResponse<?> getChatHistory(Integer userId, Integer page, Integer pageSize) {
        if (userId == null) {
            throw new BusinessException("User ID cannot be null");
        }
        validateAiUser(userId);

        page = page == null || page < 1 ? 1 : page;
        pageSize = pageSize == null || pageSize < 1 ? DEFAULT_PAGE_SIZE : pageSize;

        long offset = (long) (page - 1) * pageSize;
        long total = aiChatHistoryMapper.countChatsByUserId(userId);
        List<AiChatHistory> chats = aiChatHistoryMapper.selectChatsByUserId(userId, offset, pageSize);

        return ApiResponse.success(PageResponse.of(total, page, pageSize, chats));
    }

    @Override
    @Transactional
    public ApiResponse<?> deleteChatHistory(Integer userId, List<Integer> ids) {
        if (userId == null || ids == null || ids.isEmpty()) {
            throw new BusinessException("Invalid parameters");
        }
        validateAiUser(userId);
        List<Integer> validIds = ids.stream().filter(id -> id != null && id > 0).distinct().toList();
        if (validIds.isEmpty()) {
            throw new BusinessException("Invalid parameters");
        }
        int deleted = aiChatHistoryMapper.deleteChatsByIds(userId, validIds);
        Map<String, Object> data = new HashMap<>();
        data.put("deletedCount", deleted);
        return ApiResponse.success("Delete chat history success", data);
    }

    private void validateAiUser(Integer userId) {
        User user = userMapper.selectUserById(userId);
        if (user == null || !"user".equals(user.getRole()) || !"active".equals(user.getStatus())) {
            throw new BusinessException("User is unavailable");
        }
    }
}
