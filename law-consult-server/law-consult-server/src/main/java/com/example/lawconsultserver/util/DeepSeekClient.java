package com.example.lawconsultserver.util;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.apache.http.client.methods.CloseableHttpResponse;
import org.apache.http.client.methods.HttpPost;
import org.apache.http.entity.StringEntity;
import org.apache.http.impl.client.CloseableHttpClient;
import org.apache.http.impl.client.HttpClients;
import org.apache.http.util.EntityUtils;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Component
public class DeepSeekClient {

    private static final String LEGAL_CHECK_PROMPT = """
            你是法律问题分类器。请判断用户输入是否属于法律咨询范围。
            只返回 LEGAL 或 NON_LEGAL，不要输出其他内容。
            属于法律咨询的包括：合同纠纷、劳动争议、婚姻家庭、交通事故、债务借贷、房产纠纷、公司法务、刑事风险、行政处罚、知识产权等。
            非法律咨询包括：情感建议、医学诊断、学习辅导、编程排错、日常闲聊、购物推荐、天气、美食等。
            """;

    private static final String LEGAL_CHAT_PROMPT = """
            你是一位专业的法律顾问助手。请只回答法律相关问题。
            你是法律咨询辅助工具，不能替代执业律师提供正式法律意见或最终法律结论。
            回答要求：
            1. 先给出结论或判断。
            2. 再给出简明的法律依据或处理建议。
            3. 如信息不足，明确提示用户补充关键事实。
            4. 不要编造法条编号。
            5. 保持简洁、清晰、可操作。
            """;

    @Value("${openrouter.api.key}")
    private String apiKey;

    @Value("${openrouter.api.url}")
    private String apiUrl;

    @Value("${openrouter.model}")
    private String model;

    @Value("${openrouter.temperature}")
    private double temperature;

    @Value("${openrouter.max-tokens}")
    private int maxTokens;

    private final ObjectMapper objectMapper = new ObjectMapper();

    public boolean isLegalQuestion(String question) {
        String result = callModel(LEGAL_CHECK_PROMPT, question, 0, 16);
        if (result == null) {
            return containsLegalKeywords(question);
        }
        String normalized = result.trim().toUpperCase();
        if (normalized.contains("NON_LEGAL")) {
            return false;
        }
        if (normalized.contains("LEGAL")) {
            return true;
        }
        return containsLegalKeywords(question);
    }

    public String chat(String question) {
        String answer = callModel(LEGAL_CHAT_PROMPT, question, temperature, maxTokens);
        return answer == null ? "法律咨询服务暂时不可用，请稍后重试。" : answer;
    }

    private String callModel(String systemPrompt, String userPrompt, double requestTemperature, int requestMaxTokens) {
        try (CloseableHttpClient httpClient = HttpClients.createDefault()) {
            HttpPost httpPost = new HttpPost(apiUrl);
            httpPost.setHeader("Authorization", "Bearer " + apiKey);
            httpPost.setHeader("Content-Type", "application/json");
            httpPost.setHeader("HTTP-Referer", "http://localhost:8080");
            httpPost.setHeader("X-Title", "Legal Consultation System");

            Map<String, Object> requestBody = new HashMap<>();
            requestBody.put("model", model);
            requestBody.put("temperature", requestTemperature);
            requestBody.put("max_tokens", requestMaxTokens);

            List<Map<String, String>> messages = new ArrayList<>();
            Map<String, String> systemMessage = new HashMap<>();
            systemMessage.put("role", "system");
            systemMessage.put("content", systemPrompt);
            messages.add(systemMessage);

            Map<String, String> userMessage = new HashMap<>();
            userMessage.put("role", "user");
            userMessage.put("content", userPrompt);
            messages.add(userMessage);

            requestBody.put("messages", messages);
            httpPost.setEntity(new StringEntity(objectMapper.writeValueAsString(requestBody), "UTF-8"));

            try (CloseableHttpResponse response = httpClient.execute(httpPost)) {
                String responseBody = EntityUtils.toString(response.getEntity(), "UTF-8");
                Map<String, Object> responseMap = objectMapper.readValue(responseBody, Map.class);
                return extractContent(responseMap);
            }
        } catch (Exception exception) {
            return null;
        }
    }

    @SuppressWarnings("unchecked")
    private String extractContent(Map<String, Object> responseMap) {
        if (responseMap == null || !responseMap.containsKey("choices")) {
            return null;
        }
        List<Map<String, Object>> choices = (List<Map<String, Object>>) responseMap.get("choices");
        if (choices == null || choices.isEmpty()) {
            return null;
        }
        Map<String, Object> choice = choices.get(0);
        if (!(choice.get("message") instanceof Map<?, ?> message)) {
            return null;
        }
        Object content = message.get("content");
        return content == null ? null : String.valueOf(content);
    }

    private boolean containsLegalKeywords(String question) {
        if (question == null) {
            return false;
        }
        String content = question.toLowerCase();
        String[] keywords = {
                "法律", "法条", "合同", "劳动", "仲裁", "起诉", "诉讼", "离婚", "抚养", "继承",
                "借款", "欠钱", "债务", "赔偿", "交通事故", "工伤", "诈骗", "刑事", "行政处罚",
                "房产", "租房", "知识产权", "公司法", "违约", "律师"
        };
        for (String keyword : keywords) {
            if (content.contains(keyword)) {
                return true;
            }
        }
        return false;
    }
}
