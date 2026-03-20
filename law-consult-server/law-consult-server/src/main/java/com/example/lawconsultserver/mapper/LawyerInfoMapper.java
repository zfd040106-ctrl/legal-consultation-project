package com.example.lawconsultserver.mapper;

import com.example.lawconsultserver.entity.LawyerInfo;
import com.example.lawconsultserver.entity.LawyerSearchItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

@Mapper
public interface LawyerInfoMapper {
    int insertLawyerInfo(LawyerInfo lawyerInfo);

    LawyerInfo selectByUserId(@Param("userId") Integer userId);

    List<LawyerInfo> selectAll(@Param("offset") Long offset, @Param("limit") Integer limit);

    Long countAll();

    int updateLawyerInfo(LawyerInfo lawyerInfo);

    List<LawyerSearchItem> searchActiveLawyers(@Param("keyword") String keyword,
                                               @Param("offset") Long offset,
                                               @Param("limit") Integer limit);

    Long countActiveLawyers(@Param("keyword") String keyword);

    LawyerSearchItem selectSearchItemByUserId(@Param("userId") Integer userId);

    int incrementTotalConsultations(@Param("userId") Integer userId);
}
