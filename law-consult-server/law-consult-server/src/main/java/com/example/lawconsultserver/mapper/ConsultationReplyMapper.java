package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.ConsultationReply;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ConsultationReplyMapper {
    int insertReply(ConsultationReply reply);
    int insertUserReply(ConsultationReply reply);
    ConsultationReply selectReplyById(@Param("id") Integer id);
    List<ConsultationReply> selectRepliesByConsultationId(@Param("consultationId") Integer consultationId);
    int updateReply(ConsultationReply reply);
    int deleteRepliesByConsultationId(@Param("consultationId") Integer consultationId);
}
