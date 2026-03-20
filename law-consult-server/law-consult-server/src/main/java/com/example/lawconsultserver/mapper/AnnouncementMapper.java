package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.Announcement;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface AnnouncementMapper {
    int insertAnnouncement(Announcement announcement);

    List<Announcement> selectAll(@Param("keyword") String keyword,
                                 @Param("status") String status,
                                 @Param("offset") Long offset,
                                 @Param("limit") Integer limit);

    Long countAll(@Param("keyword") String keyword, @Param("status") String status);

    int updateAnnouncement(Announcement announcement);

    int deleteAnnouncement(@Param("id") Integer id);

    int deleteById(@Param("id") Integer id);

    int updatePin(@Param("id") Integer id, @Param("isPinned") Boolean isPinned);

    Long countPinned();
}
