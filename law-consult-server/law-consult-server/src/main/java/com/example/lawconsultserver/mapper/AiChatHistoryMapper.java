package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.AiChatHistory;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AiChatHistoryMapper {
    int insertChat(AiChatHistory chat);
    List<AiChatHistory> selectChatsByUserId(@Param("userId") Integer userId,
                                            @Param("offset") Long offset,
                                            @Param("limit") Integer limit);
    Long countChatsByUserId(@Param("userId") Integer userId);
    int deleteChatsByIds(@Param("userId") Integer userId, @Param("ids") List<Integer> ids);
}
