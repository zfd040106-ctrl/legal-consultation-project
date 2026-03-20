package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.Complaint;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface ComplaintMapper {
    int insertComplaint(Complaint complaint);
    List<Complaint> selectAll(@Param("status") String status,
                              @Param("type") String type,
                              @Param("keyword") String keyword,
                              @Param("offset") Long offset,
                              @Param("limit") Integer limit);
    Long countAll(@Param("status") String status,
                  @Param("type") String type,
                  @Param("keyword") String keyword);
    int updateStatus(@Param("id") Integer id, @Param("status") String status, @Param("reason") String reason);

    // 补充缺失的方法
    List<Complaint> selectByStatus(@Param("status") String status, @Param("offset") Long offset, @Param("limit") Integer limit);
    Long countByStatus(@Param("status") String status);
    Complaint selectById(@Param("id") Integer id);
    int deleteComplaint(@Param("id") Integer id);
}
