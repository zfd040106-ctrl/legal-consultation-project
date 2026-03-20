package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.AuditLog;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface AuditLogMapper {
    int insertLog(AuditLog log);

    List<AuditLog> selectRecentLogs(@Param("limit") Integer limit);

    List<AuditLog> selectLogs(@Param("offset") Long offset, @Param("limit") Integer limit);

    Long countLogs();
}
